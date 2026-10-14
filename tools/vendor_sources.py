"""Retain selected upstream Git blobs, licenses and reproducible file provenance.

Run against local source checkouts; no network, installers, hooks or source edits.
SKILL.md becomes REFERENCE.md so retained sources cannot compete in discovery.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = (
    ("impeccable", "impeccable-upstream", "pbakaus/impeccable", "245ad82def45831dc56a21b683c7a1ff530b06cc", (("plugin/skills/impeccable", ""), ("plugin/agents", "agents"), ("LICENSE", "LICENSE"), ("NOTICE.md", "NOTICE.md"))),
    ("intent", "intent-upstream", "ghaida/intent", "3fc38dff381ce0e4dec8f52c97c3e37abd95e10e", (("skills", "skills"), ("LICENSE", "LICENSE"))),
    ("taste", "taste-upstream", "Leonxlnx/taste-skill", "d237dd399d57524945c0c81327da5da19f7a468d", (("skills/taste-skill", "frontend"), ("skills/redesign-skill", "redesign"), ("skills/image-to-code-skill", "image-to-code"), ("LICENSE", "LICENSE"))),
    ("garden", "garden-upstream", "ConardLi/garden-skills", "7a6d5a72e4f44bb4cc0c23c01b3d97205c723b68", (("skills/web-design-engineer", ""), ("LICENSE", "LICENSE"))),
    ("promax", "promax-upstream", "nextlevelbuilder/ui-ux-pro-max-skill", "7246805992a42b7bba37d4cac83b01416f0c6c44", ((".claude/skills/ui-ux-pro-max", ""), ("LICENSE", "LICENSE"))),
    ("frontend-design", "anthropic-upstream", "anthropics/skills", "dbd4588f9e1033efb41dad4bef2f7947c8993d44", (("skills/frontend-design", ""),)),
    ("game-ui", "game-ui-upstream", "jeremylongworth-source/AgentSkills", "45f314d2a3d3201dd5a0304a3a4f3a5f23a905a2", (("skills/game-ui-design/SKILL.md", "REFERENCE.md"), ("skills/game-ui-design/references/game-ui-checklist.md", "references/game-ui-checklist.md"), ("LICENSE", "LICENSE"))),
    ("game-browser", "game-browser-upstream", "openai/plugins", "0722921d5542fc593105c27bd52630babd8b8c2a", (("plugins/game-studio/skills/game-ui-frontend/SKILL.md", "skills/game-ui-frontend/REFERENCE.md"), ("plugins/game-studio/.codex-plugin/plugin.json", "LICENSE-METADATA.json"), ("plugins/game-studio/references/frontend-prompts.md", "references/frontend-prompts.md"), ("plugins/game-studio/references/three-hud-layout-patterns.md", "references/three-hud-layout-patterns.md"), ("plugins/game-studio/references/playtest-checklist.md", "references/playtest-checklist.md"), ("plugins/game-studio/skills/web-game-foundations/SKILL.md", "skills/web-game-foundations/REFERENCE.md"), ("plugins/game-studio/skills/react-three-fiber-game/SKILL.md", "skills/react-three-fiber-game/REFERENCE.md"))),
)


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args])


def retain(checkouts):
    record = {"schema": 1, "sources": []}
    for name, checkout, repository, commit, selections in SOURCES:
        repo = checkouts / checkout
        resolved = git(repo, "rev-parse", commit).decode().strip()
        if resolved != commit:
            raise ValueError(f"Unresolved pin: {name}")
        files = []
        for source, target in selections:
            listing = git(repo, "ls-tree", "-r", "--name-only", commit, "--", source).decode().splitlines()
            if not listing:
                raise ValueError(f"Missing selected source: {name}/{source}")
            for original in listing:
                relative = original[len(source):].lstrip("/")
                destination = Path(target) / relative if relative else Path(target)
                if destination.name == "SKILL.md":
                    destination = destination.with_name("REFERENCE.md")
                installed = ROOT / "shared" / "library" / name / destination
                if not installed.resolve().is_relative_to((ROOT / "shared/library" / name).resolve()):
                    raise ValueError("Unsafe destination")
                data = git(repo, "show", f"{commit}:{original}")
                installed.parent.mkdir(parents=True, exist_ok=True)
                if installed.exists() and installed.read_bytes() != data:
                    raise ValueError(f"Refusing to overwrite changed retained source: {installed}")
                installed.write_bytes(data)
                files.append({"source": original, "path": installed.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
        record["sources"].append({"id": name, "repository": f"https://github.com/{repository}", "commit": commit, "files": files})
    (ROOT / "shared/SOURCES.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Retained {len(record['sources'])} pinned sources, {sum(len(s['files']) for s in record['sources'])} Git blobs")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkouts", type=Path, required=True)
    retain(parser.parse_args().checkouts.resolve())
