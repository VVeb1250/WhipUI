import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_pack import validate


class ComboPackTests(unittest.TestCase):
    def test_installed_source_integrity_and_links(self):
        self.assertEqual(validate(), [])

    def test_documented_launcher_paths_exist_in_retained_layout(self):
        adapter = (ROOT / "shared/host-integration.md").read_text(encoding="utf-8")
        match = re.search(r"POSIX: invoke the absolute `([^`]+)`", adapter)
        self.assertIsNotNone(match)
        if match:
            self.assertTrue((ROOT / "shared/library/impeccable" / match.group(1)).is_file())
        self.assertTrue((ROOT / "shared/library/impeccable/scripts/impeccable.cmd").is_file())

    def test_retained_sources_cannot_compete_in_discovery(self):
        self.assertEqual(
            sorted(p.relative_to(ROOT).as_posix() for p in ROOT.rglob("SKILL.md")),
            ["whip-design/SKILL.md", "whip-ui/SKILL.md"],
        )

    def test_all_pinned_libraries_have_license_evidence(self):
        sources = json.loads((ROOT / "shared/SOURCES.json").read_text())["sources"]
        self.assertEqual({s["id"] for s in sources}, {"intent", "impeccable", "taste", "garden", "promax", "frontend-design", "game-ui", "game-browser"})
        for source in sources:
            self.assertEqual(len(source["commit"]), 40)
            self.assertTrue(any(Path(f["path"]).name.startswith("LICENSE") for f in source["files"]))
        plugin_license = json.loads((ROOT / "shared/library/game-browser/LICENSE-METADATA.json").read_text())
        self.assertEqual(plugin_license["license"], "MIT")
        self.assertEqual(plugin_license["author"]["name"], "OpenAI")

    def test_tampered_source_fails_validation(self):
        with tempfile.TemporaryDirectory() as temp:
            candidate = Path(temp)
            for name in ("whip-design", "whip-ui", "shared"):
                shutil.copytree(ROOT / name, candidate / name)
            reference = candidate / "shared/library/taste/frontend/REFERENCE.md"
            reference.write_text(reference.read_text() + "\nchanged\n")
            with patch("check_pack.ROOT", candidate):
                self.assertTrue(any("Source integrity" in x for x in validate()))

    def test_missing_entrypoint_reports_failure(self):
        with tempfile.TemporaryDirectory() as temp, patch("check_pack.ROOT", Path(temp)):
            self.assertTrue(any("Missing" in x for x in validate()))

    def test_pro_max_query_runs_from_unrelated_project_without_writes(self):
        search = ROOT / "shared/library/promax/scripts/search.py"
        with tempfile.TemporaryDirectory() as temp:
            result = subprocess.run([sys.executable, "-B", str(search), "keyboard focus navigation", "--domain", "ux", "--max-results", "3", "--json"], cwd=temp, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            self.assertEqual(data["domain"], "ux")
            self.assertGreater(len(data["results"]), 0)
            evidence = json.dumps(data["results"]).lower()
            self.assertTrue("focus" in evidence or "keyboard" in evidence)
            self.assertEqual(list(Path(temp).iterdir()), [])

    def test_stack_query_is_real_stack_guidance(self):
        result = subprocess.run([sys.executable, "-B", str(ROOT / "shared/library/promax/scripts/search.py"), "form error recovery", "--stack", "react", "--max-results", "3", "--json"], capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        self.assertEqual(data["stack"], "react")
        self.assertGreater(len(data["results"]), 0)

    def test_release_manifest_hashes_match_shipped_content(self):
        manifest = json.loads((ROOT / "MANIFEST.json").read_text())
        for entry in manifest["files"]:
            self.assertEqual(hashlib.sha256((ROOT / entry["path"]).read_bytes()).hexdigest(), entry["sha256"], entry["path"])


if __name__ == "__main__":
    unittest.main()
