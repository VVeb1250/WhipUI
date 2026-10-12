#!/usr/bin/env python3
"""Small dependency-free state guard. Enforces provenance invariants, NOT design quality."""
import argparse
import json
import sys
from pathlib import Path

STATUSES = {"proposed", "assumed", "approved", "rejected", "superseded"}


def has_owner_evidence(decision, kind):
    evidence = decision.get("evidence")
    return (
        decision.get("authority") == "owner"
        and isinstance(evidence, dict)
        and evidence.get("kind") == kind
        and isinstance(evidence.get("locator"), str)
        and bool(evidence["locator"].strip())
    )


def load(path):
    try:
        obj = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ValueError(f"could not parse {path}: {exc}") from exc
    if not isinstance(obj, dict):
        # Invalid JSON shape is reported through the same CLI path as invalid JSON syntax.
        raise ValueError("root must be an object")  # noqa: TRY004
    return obj


def check(obj, previous=None, strict=False):
    errors, warnings = [], []
    if not isinstance(obj, dict):
        return ["root must be an object"], warnings
    if not isinstance(obj.get("schema_version"), str):
        errors.append("missing schema_version")
    if not obj.get("project") or not isinstance(obj.get("project"), str):
        errors.append("project must be non-empty string")
    decisions = obj.get("decisions", [])
    if not isinstance(decisions, list):
        return ["decisions must be an array"], warnings
    seen = set()
    current = {}
    for i, d in enumerate(decisions):
        p = f"decisions[{i}]"
        if not isinstance(d, dict):
            errors.append(f"{p}: must be object")
            continue
        did = d.get("id")
        if not isinstance(did, str) or not did.strip():
            errors.append(f"{p}: missing id")
            continue
        if did in seen:
            errors.append(f"{p}: duplicate id {did}")
        seen.add(did)
        current[did] = d
        if not d.get("statement") or not isinstance(d.get("statement"), str):
            errors.append(f"{p}: empty statement")
        status = d.get("status")
        if not isinstance(status, str) or status not in STATUSES:
            errors.append(f"{p}: status must be one of {sorted(STATUSES)}")
        ev = d.get("evidence", {})
        if not isinstance(ev, dict):
            errors.append(f"{p}: evidence must be object")
            ev = {}
        if status == "approved":
            if d.get("authority") != "owner":
                errors.append(f"{p}: approved requires authority=owner")
            if not has_owner_evidence(d, "explicit_owner_approval"):
                errors.append(f"{p}: approved needs explicit_owner_approval with source locator")
        if (status == "rejected" and d.get("authority") == "owner"
                and not has_owner_evidence(d, "explicit_owner_rejection")):
            errors.append(f"{p}: claimed owner rejection needs explicit_owner_rejection provenance")
        if isinstance(ev.get("locator"), str) and "EXAMPLE" in ev["locator"].upper():
            (errors if strict else warnings).append(f"{p}: example provenance is not actual approval evidence")
        if status == "assumed" and d.get("authority") == "owner":
            errors.append(f"{p}: assumed decision cannot have owner authority")
        for key in ("supersedes", "amends_pinned"):
            if key in d and (
                not isinstance(d[key], list)
                or any(not isinstance(item, str) or not item.strip() for item in d[key])
            ):
                errors.append(f"{p}: {key} must be an array of non-empty strings")

    for key in ("references", "preference_evidence", "preferences"):
        if key in obj and not isinstance(obj[key], list):
            errors.append(f"{key}: must be array")
    preferences = obj.get("preference_evidence", obj.get("preferences", []))
    for i, pref in enumerate(preferences if isinstance(preferences, list) else []):
        if not isinstance(pref, dict):
            errors.append(f"preferences[{i}]: must be object")
            continue
        origin = pref.get("origin", {})
        if pref.get("confidence") == "high" and isinstance(origin, dict) and origin.get("kind") in ("agent_inference", "model_guess"):
            warnings.append(f"preferences[{i}]: high confidence from agent inference may overstate owner's taste")

    freedom = obj.get("freedom", {})
    if not isinstance(freedom, dict):
        errors.append("freedom must be an object")
    else:
        for key in ("pinned", "agent_may_decide", "escalate"):
            if key in freedom and (
                not isinstance(freedom[key], list)
                or any(not isinstance(item, str) or not item.strip() for item in freedom[key])
            ):
                errors.append(f"freedom.{key} must be an array of non-empty strings")
    if errors:
        return errors, warnings

    if previous is not None:
        previous_errors, _ = check(previous, strict=strict)
        if previous_errors:
            return [f"previous: {error}" for error in previous_errors], warnings
        old = {d.get("id"): d for d in previous.get("decisions", []) if isinstance(d, dict)}
        old_approval_locators = {
            d["evidence"]["locator"].strip()
            for d in old.values()
            if d.get("status") == "approved" and has_owner_evidence(d, "explicit_owner_approval")
        }
        for did, prev in old.items():
            if prev.get("status") != "approved":
                continue
            now = current.get(did)
            if (now and now.get("status") == "approved"
                    and now.get("statement") == prev.get("statement")
                    and now.get("scope") == prev.get("scope")):
                continue
            # A repeated source locator is not new authorization to change intent.
            replacement = [
                d for d in current.values()
                if did in d.get("supersedes", []) and d.get("status") == "approved"
                and has_owner_evidence(d, "explicit_owner_approval")
                and d["evidence"]["locator"].strip() not in old_approval_locators
            ]
            if (now and now.get("status") == "rejected"
                    and has_owner_evidence(now, "explicit_owner_rejection")
                    and now["evidence"]["locator"].strip() not in old_approval_locators):
                continue
            if not replacement:
                errors.append(f"previously approved decision {did} changed/disappeared without new explicit owner-approved superseding decision")
        old_pinned = set(previous.get("freedom", {}).get("pinned", []))
        new_pinned = set(freedom.get("pinned", []))
        lost = old_pinned - new_pinned
        if lost:
            approved_amendments = set()
            for d in current.values():
                if (d.get("status") == "approved"
                    and has_owner_evidence(d, "explicit_owner_approval")
                    and d["evidence"]["locator"].strip() not in old_approval_locators):
                    approved_amendments.update(d.get("amends_pinned", []))
            unauthorized = lost - approved_amendments
            if unauthorized:
                errors.append(f"pinned constraints removed without explicit owner-approved amendment: {sorted(unauthorized)}")
    return errors, warnings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("state", help="path to design intent or project state JSON")
    parser.add_argument("--previous", help="prior version; prevents silent deletion of approved decisions")
    parser.add_argument("--strict", action="store_true", help="treat example provenance as an error")
    args = parser.parse_args()
    try:
        obj = load(args.state)
        prev = load(args.previous) if args.previous else None
    except ValueError as exc:
        print("ERROR:", exc, file=sys.stderr)
        return 2
    errors, warnings = check(obj, prev, args.strict)
    for w in warnings:
        print("WARNING:", w)
    for e in errors:
        print("ERROR:", e, file=sys.stderr)
    if errors:
        return 1
    print(f"PASS: {args.state}; provenance checks passed (not a UX/UI quality test)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
