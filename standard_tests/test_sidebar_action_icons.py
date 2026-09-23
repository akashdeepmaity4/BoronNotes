import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = (ROOT / 'templates' / 'index.html').read_text(encoding='utf-8')
JS = (ROOT / 'static' / 'js' / 'main.js').read_text(encoding='utf-8')


class SidebarActionIconTests(unittest.TestCase):
    def test_sidebar_buttons_are_action_tagged(self):
        self.assertIn('data-action="new-file"', HTML)
        self.assertIn('data-action="new-folder"', HTML)

    def test_sidebar_binding_uses_data_action_not_emoji_text(self):
        self.assertNotIn("textContent.includes('➕')", JS)
        self.assertNotIn("textContent.includes('📁')", JS)
        self.assertTrue(
            "querySelector('[data-action=\"new-file\"]')" in JS or 'dataset.action' in JS
        )
        self.assertTrue(
            "querySelector('[data-action=\"new-folder\"]')" in JS or 'dataset.action' in JS
        )


if __name__ == '__main__':
    unittest.main()
