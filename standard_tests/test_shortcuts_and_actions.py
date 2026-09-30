import os
import tempfile
import unittest

import app.app as app_module

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class ShortcutAndActionTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix='Boronnotes-shortcuts-')
        app_module.STORAGE_PATH = self.temp_dir
        self.client = app_module.app.test_client()

    def test_new_file_shortcut_and_repeated_triggers_exist(self):
        html_path = os.path.join(ROOT, 'templates', 'index.html')
        js_path = os.path.join(ROOT, 'static', 'js', 'main.js')
        html = open(html_path, encoding='utf-8').read()
        js = open(js_path, encoding='utf-8').read()

        self.assertIn('data-action="new-file"', html)
        self.assertIn('data-action', js)
        self.assertIn('Ctrl+N', html)
        self.assertIn("if (isCtrl && !e.shiftKey && key === 'n')", js)
        self.assertIn('createNewFilePrompt()', js)
        self.assertIn('actionNewFile', js)

    def test_new_folder_shortcut_and_repeated_triggers_exist(self):
        html_path = os.path.join(ROOT, 'templates', 'index.html')
        js_path = os.path.join(ROOT, 'static', 'js', 'main.js')
        html = open(html_path, encoding='utf-8').read()
        js = open(js_path, encoding='utf-8').read()

        self.assertIn('data-action="new-folder"', html)
        self.assertIn('data-action', js)
        self.assertIn('Ctrl+Shift+N', html)
        self.assertIn("if (isCtrl && e.shiftKey && key === 'n')", js)
        self.assertIn('createNewFolderPrompt()', js)
        self.assertIn('actionNewFolder', js)

    def test_save_action_has_multiple_entry_points(self):
        html_path = os.path.join(ROOT, 'templates', 'index.html')
        js_path = os.path.join(ROOT, 'static', 'js', 'main.js')
        html = open(html_path, encoding='utf-8').read()
        js = open(js_path, encoding='utf-8').read()

        self.assertIn('id="saveFileBtn"', html)
        self.assertIn('data-action="save"', html)
        self.assertIn('saveCurrentFile()', js)
        self.assertIn("if (isCtrl && !e.shiftKey && key === 's')", js)

        response = self.client.post('/save-file', json={'path': 'save.md', 'content': 'hello'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(os.path.exists(os.path.join(self.temp_dir, 'save.md')))

    def test_editor_edit_actions_have_shortcut_handlers(self):
        js_path = os.path.join(ROOT, 'static', 'js', 'main.js')
        js = open(js_path, encoding='utf-8').read()

        self.assertIn("document.execCommand('undo')", js)
        self.assertIn("document.execCommand('redo')", js)
        self.assertIn("document.execCommand('cut')", js)
        self.assertIn("document.execCommand('copy')", js)
        self.assertIn("document.execCommand('paste')", js)
        self.assertIn("document.execCommand('selectAll')", js)

        self.assertIn("getAttribute('data-action')", js)
        self.assertIn("case 'undo'", js)
        self.assertIn("case 'redo'", js)
        self.assertIn("case 'cut'", js)
        self.assertIn("case 'copy'", js)
        self.assertIn("case 'paste'", js)
        self.assertIn("case 'select-all'", js)

    def test_open_file_and_directory_picker_shortcuts_exist(self):
        html_path = os.path.join(ROOT, 'templates', 'index.html')
        js_path = os.path.join(ROOT, 'static', 'js', 'main.js')
        html = open(html_path, encoding='utf-8').read()
        js = open(js_path, encoding='utf-8').read()

        self.assertIn('id="filePicker"', html)
        self.assertIn('id="folderPicker"', html)
        self.assertIn('data-action="open-file"', html)
        self.assertIn('promptOpenFile()', js)
        self.assertIn("if (key === 'o')", js)
        self.assertIn('if (ctrlKPressed)', js)
        self.assertIn('folderPicker.click()', js)

    def test_terminal_action_uses_backend_route(self):
        js_path = os.path.join(ROOT, 'static', 'js', 'main.js')
        js = open(js_path, encoding='utf-8').read()

        self.assertIn("fetch('/open-terminal'", js)
        self.assertIn("if (isCtrl && (e.key === '`' || e.code === 'Backquote'))", js)

        response = self.client.post('/open-terminal', json={'path': self.temp_dir})
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body['status'], 'success')
        self.assertIn(body['path'], [self.temp_dir, os.path.abspath(self.temp_dir)])

    def test_run_action_is_supported_and_executable(self):
        js_path = os.path.join(ROOT, 'static', 'js', 'main.js')
        js = open(js_path, encoding='utf-8').read()
        self.assertIn("getAttribute('data-action')", js)
        self.assertIn("fetch('/run-file'", js)
        self.assertIn("actionName.includes('run')", js)

        script_path = os.path.join(self.temp_dir, 'hello.py')
        with open(script_path, 'w', encoding='utf-8') as handle:
            handle.write('print("hello from shortcut test")\n')

        response = self.client.post('/run-file', json={'path': 'hello.py'})
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body['status'], 'success')
        self.assertIn('hello from shortcut test', body['stdout'])


if __name__ == '__main__':
    unittest.main()
