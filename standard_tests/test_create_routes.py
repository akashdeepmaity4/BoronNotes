"""
create route creation manualy
"""

import os
import tempfile
import unittest

import app.app as app_module


class CreateRoutesTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix='veritasnotes-test-')
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


if __name__ == '__main__':
    unittest.main()
