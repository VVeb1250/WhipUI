import json
import shutil
import sys
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_pack import validate
from check_state import check


class PackTests(unittest.TestCase):
    def setUp(self):
        self.intent = json.loads((ROOT / "shared/design-intent.example.json").read_text(encoding="utf-8"))
        self.state = json.loads((ROOT / "shared/design-state.example.json").read_text(encoding="utf-8"))

    def test_pack_references(self):
        self.assertEqual(validate(), [])

    def test_examples_valid(self):
        self.assertEqual(check(self.intent)[0], [])
        self.assertEqual(check(self.state)[0], [])

    def test_ai_cannot_approve(self):
        pkt = deepcopy(self.intent)
        pkt["decisions"][0]["status"] = "approved"
        self.assertTrue(check(pkt)[0])

    def test_owner_claim_needs_provenance(self):
        pkt = deepcopy(self.intent)
        d = pkt["decisions"][0]
        d.update(status="approved", authority="owner")
        d["evidence"] = {"kind": "agent_inference", "locator": "looks approved to agent"}
        self.assertTrue(check(pkt)[0])

    def test_previous_approved_cannot_disappear(self):
        next_state = deepcopy(self.state)
        next_state["decisions"] = next_state["decisions"][1:]
        errors, _ = check(next_state, self.state)
        self.assertTrue(any("changed/disappeared" in error for error in errors))

    def test_explicit_supersession_allows_change(self):
        next_state = deepcopy(self.state)
        next_state["decisions"][0]["status"] = "superseded"
        next_state["decisions"].append({
            "id": "D-003", "statement": "Use authentic screenshots", "status": "approved", "authority": "owner",
            "supersedes": ["D-001"], "evidence": {"kind": "explicit_owner_approval", "locator": "owner message 42"}
        })
        self.assertEqual(check(next_state, self.state)[0], [])

    def test_deleting_pinned_constraint_fails(self):
        old = deepcopy(self.intent)
        new = deepcopy(old)
        new["freedom"]["pinned"] = []
        self.assertTrue(any("pinned constraints" in x for x in check(new, old)[0]))

    def test_owner_may_amend_pinned_constraint(self):
        old = deepcopy(self.intent)
        new = deepcopy(old)
        old_constraint = old["freedom"]["pinned"][0]
        new["freedom"]["pinned"] = []
        new["decisions"].append({
            "id": "D-002", "statement": "Change prior constraint", "status": "approved",
            "authority": "owner", "amends_pinned": [old_constraint],
            "evidence": {"kind": "explicit_owner_approval", "locator": "owner message 43"}
        })
        self.assertEqual(check(new, old)[0], [])

    def test_duplicate_decisions_fail(self):
        pkt = deepcopy(self.intent)
        pkt["decisions"].append(deepcopy(pkt["decisions"][0]))
        self.assertTrue(any("duplicate id" in x for x in check(pkt)[0]))

    def test_approval_locator_must_be_nonempty_text(self):
        for locator in (None, "", "   ", 42, {"source": "owner"}, ["owner"]):
            with self.subTest(locator=locator):
                pkt = deepcopy(self.state)
                pkt["decisions"][0]["evidence"]["locator"] = locator
                self.assertTrue(check(pkt)[0])

    def test_owner_rejection_locator_must_be_nonempty_text(self):
        pkt = deepcopy(self.state)
        pkt["decisions"][1]["evidence"]["locator"] = {"source": "owner"}
        self.assertTrue(check(pkt)[0])

    def test_recycled_approval_cannot_authorize_changed_direction(self):
        pkt = deepcopy(self.state)
        pkt["decisions"][0]["statement"] = "Replace real artifacts with stock images"
        pkt["decisions"][0]["supersedes"] = ["D-001"]
        self.assertTrue(check(pkt, self.state)[0])

    def test_scope_expansion_needs_new_approval(self):
        pkt = deepcopy(self.state)
        pkt["decisions"][0]["scope"] = "Every future project"
        self.assertTrue(check(pkt, self.state)[0])

    def test_recycled_approval_cannot_release_pinned_constraint(self):
        old = deepcopy(self.intent)
        old["decisions"] = [deepcopy(self.state["decisions"][0])]
        pkt = deepcopy(old)
        pkt["freedom"]["pinned"] = []
        pkt["decisions"][0]["amends_pinned"] = old["freedom"]["pinned"]
        self.assertTrue(check(pkt, old)[0])

    def test_malformed_fields_return_errors(self):
        for path, value in (
            (("decisions", 0, "status"), []),
            (("decisions", 0, "supersedes"), "D-001"),
            (("decisions", 0, "amends_pinned"), {}),
            (("preferences",), 42),
            (("freedom",), "not an object"),
            (("freedom", "pinned"), "not a list"),
            (("freedom", "pinned"), [{}]),
        ):
            with self.subTest(path=path):
                pkt = deepcopy(self.intent)
                target = pkt
                for part in path[:-1]:
                    target = target[part]
                target[path[-1]] = value
                self.assertTrue(check(pkt, self.intent)[0])

    def test_unchanged_approval_remains_valid(self):
        self.assertEqual(check(deepcopy(self.state), self.state)[0], [])

    def test_missing_entrypoint_reports_error(self):
        with tempfile.TemporaryDirectory() as temp:
            incomplete = Path(temp)
            for name in ("whip-design", "shared"):
                shutil.copytree(ROOT / name, incomplete / name)
            with patch("check_pack.ROOT", incomplete):
                self.assertTrue(any("Missing" in error for error in validate()))

    def test_strict_mode_rejects_example_approval(self):
        self.assertTrue(check(self.state, strict=True)[0])


if __name__ == "__main__":
    unittest.main()
