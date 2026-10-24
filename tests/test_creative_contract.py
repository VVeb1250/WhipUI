"""Phase B static contract tests; not a design-quality benchmark."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CreativeContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entry = (ROOT / "whip-ui/SKILL.md").read_text(encoding="utf-8")
        cls.art = (ROOT / "whip-ui/references/art-direction.md").read_text(encoding="utf-8")
        cls.qa = (ROOT / "whip-ui/references/rendered-qa.md").read_text(encoding="utf-8")
        cls.cases = [json.loads(line) for line in
                     (ROOT / "tests/behavior-cases.jsonl").read_text(encoding="utf-8").splitlines()
                     if line.strip()]

    def test_creative_fork_is_bounded_and_conditional(self):
        self.assertIn("2–3", self.entry)
        self.assertIn("CREATE", self.entry)
        self.assertIn("REDESIGN", self.entry)
        self.assertIn("Skip exploration for", self.entry)
        self.assertIn("Do not generate three code implementations", self.art)

    def test_preservation_gates(self):
        for route in ("MATCH", "EXTEND", "REPAIR", "POLISH"):
            with self.subTest(route=route):
                self.assertIn(route, self.art)
        self.assertIn("No creative reinterpretation of approved work", self.entry)

    def test_product_anchor_and_first_render_critique(self):
        self.assertIn("product-specific visual anchor", self.entry)
        self.assertIn("First-render concept critique", self.art)
        self.assertIn("reuse the first screenshots", self.qa)
        self.assertIn("not", self.qa.lower())

    def test_new_behavior_scenarios_are_unique(self):
        ids = [c["id"] for c in self.cases]
        self.assertEqual(len(ids), len(set(ids)))
        expected = {"T21", "T22", "T23", "T24", "T25", "T26", "T27"}
        self.assertTrue(expected.issubset(set(ids)))
        for case in self.cases:
            self.assertTrue(case.get("key_assertions"))
            self.assertTrue(case.get("expected_route"))


if __name__ == "__main__":
    unittest.main()
