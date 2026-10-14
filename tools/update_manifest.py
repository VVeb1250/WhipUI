"""Rebuild the release integrity manifest from npm's explicit shipped roots."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def update():
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    files = []
    for name in [*package["files"], "package.json"]:
        target = ROOT / name
        if name == "MANIFEST.json":
            continue
        selected = target.rglob("*") if target.is_dir() else [target]
        for file in selected:
            if file.is_file() and file.name != ".npmignore" and "__pycache__" not in file.parts and file.suffix != ".pyc":
                data = file.read_bytes()
                files.append({"path": file.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
    result = {"version": package["version"], "status": "experimental", "source": "shared/SOURCES.json", "files": sorted(files, key=lambda item: item["path"])}
    (ROOT / "MANIFEST.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Manifest: {len(files)} shipped files, version {package['version']}")


if __name__ == "__main__":
    update()
