#!/usr/bin/env python3
"""Basic Agent Skills structural checks, file references and JSON fixtures."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def validate():
    errors = []
    for name in ("whip-design", "whip-ui"):
        skill = ROOT / name / "SKILL.md"
        if not skill.exists():
            errors.append(f"Missing {skill}")
            continue
        s = skill.read_text(encoding="utf-8")
        if not s.startswith("---\n"):
            errors.append(f"No frontmatter: {name}")
            continue
        fm = s.split("---\n", 2)[1]
        found = re.search(r"^name:\s*(\S+)\s*$", fm, re.MULTILINE)
        desc = re.search(r"^description:\s*(.*)$", fm, re.MULTILINE)
        if not found or found.group(1) != name:
            errors.append(f"Invalid skill name: {name}")
        if not desc or not 0 < len(desc.group(1)) <= 1024:
            errors.append(f"Invalid description: {name}")
        if len(s.splitlines()) > 500:
            errors.append(f"Too-long hot-path SKILL.md {name}")
    # Detect actually referenced reference files, excluding web links and samples.
    for skill in (ROOT / "whip-design" / "SKILL.md", ROOT / "whip-ui" / "SKILL.md"):
        if not skill.is_file():
            continue
        text = skill.read_text(encoding="utf-8")
        for rel in re.findall(r"`((?:references|\.\./shared)/[^`]+\.(?:md|json))`", text):
            if not (skill.parent / rel).is_file():
                errors.append(f"Broken reference {skill.relative_to(ROOT)} -> {rel}")
    for sub in ("design-intent.example.json", "design-state.example.json"):
        try:
            json.loads((ROOT / "shared" / sub).read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            errors.append(f"Invalid template {sub}: {exc}")
    return errors


if __name__ == "__main__":
    errors = validate()
    for e in errors:
        print("ERROR:", e)
    if errors:
        raise SystemExit(1)
    print("PASS: two valid skill entrypoints; local references resolve; state templates parse. Not a behavior/design benchmark.")
