"""
create route creation manualy
"""

import json
import os
import tempfile
import unittest
import zipfile

import app.app as app_module


class CreateRoutesTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix='Boronnotes-test-')
        app_module.STORAGE_PATH = self.temp_dir
        self.client = app_module.app.test_client()

    def test_create_file_in_storage_root(self):
        response = self.client.post(
            '/create-file',
            json={'target_dir': self.temp_dir, 'name': 'new-note.md'}
        )
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body['status'], 'success')
        self.assertTrue(os.path.exists(os.path.join(self.temp_dir, 'new-note.md')))

    def test_create_folder_in_storage_root(self):
        response = self.client.post(
            '/create-folder',
            json={'target_dir': self.temp_dir, 'name': 'nested-folder'}
        )
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body['status'], 'success')
        self.assertTrue(os.path.isdir(os.path.join(self.temp_dir, 'nested-folder')))

    def test_load_config_redirects_to_storage_folder(self):
        temp_root = tempfile.mkdtemp(prefix='Boronnotes-config-')
        config_path = os.path.join(temp_root, 'config.json')
        with open(config_path, 'w', encoding='utf-8') as handle:
            json.dump({'storage_path': temp_root}, handle)

        app_module.PROJECT_ROOT = temp_root
        app_module.CONFIG_FILE = config_path

        config = app_module.load_config()
        self.assertEqual(config['storage_path'], os.path.join(temp_root, 'storage'))

    def test_extract_docx_text_without_external_dependencies(self):
        docx_path = os.path.join(self.temp_dir, 'native.docx')
        with zipfile.ZipFile(docx_path, 'w') as zf:
            zf.writestr(
                '[Content_Types].xml',
                '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
            )
            zf.writestr(
                'word/document.xml',
                '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello</w:t></w:r></w:p><w:p><w:r><w:t>World</w:t></w:r></w:p></w:body></w:document>'
            )

        extracted = app_module.extract_docx_text(docx_path)
        self.assertIn('Hello', extracted)
        self.assertIn('World', extracted)

    def test_docx_file_content_returns_extracted_text(self):
        docx_path = os.path.join(self.temp_dir, 'preview.docx')
        with zipfile.ZipFile(docx_path, 'w') as zf:
            zf.writestr(
                'word/document.xml',
                '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Alpha</w:t></w:r></w:p><w:p><w:r><w:t>Beta</w:t></w:r></w:p></w:body></w:document>'
            )

        response = self.client.post('/file-content', json={'path': 'preview.docx'})
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body['kind'], 'view_only')
        self.assertIn('Alpha', body['content'])
        self.assertIn('Beta', body['content'])

    def test_run_file_executes_python_script(self):
        script_path = os.path.join(self.temp_dir, 'hello.py')
        with open(script_path, 'w', encoding='utf-8') as handle:
            handle.write('print("hello from script")\n')

        response = self.client.post('/run-file', json={'path': 'hello.py'})
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body['status'], 'success')
        self.assertIn('hello from script', body['stdout'])


if __name__ == '__main__':
    unittest.main()
