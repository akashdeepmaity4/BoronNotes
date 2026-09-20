import os
import re
import sys
import json
import html
import base64
import mimetypes
from flask import render_template as r
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, redirect, url_for, send_file
'''
KEEP DEBUG FALSE!
'''

# ---------------------------------------------------------------------------
# Supported file types (strict allowlist)
#
#   PLAIN        -> treated as raw plain text (no reformatting).
#   STRUCTURED   -> treated as text but indentation is normalized/preserved.
#   ASSET        -> image, displayed non-editable (read-only asset).
#   VIEW_ONLY    -> documents (pdf, docx, gdoc) shown strictly read-only.
# ---------------------------------------------------------------------------
PLAIN_TEXT_EXTS = {'txt', 'md', 'markdown', 'csv', 'tsv'}
STRUCTURED_TEXT_EXTS = {'json', 'html', 'htm'}
ASSET_EXTS = {'png', 'jpg', 'jpeg'}
VIEW_ONLY_EXTS = {'pdf', 'doc', 'docx', 'gdoc'}

# Union used for quick membership tests / pickers.
SUPPORTED_EXTS = (
    PLAIN_TEXT_EXTS | STRUCTURED_TEXT_EXTS | ASSET_EXTS | VIEW_ONLY_EXTS
)

# Extensions that may be written back to disk by the editor.
WRITABLE_EXTS = PLAIN_TEXT_EXTS | STRUCTURED_TEXT_EXTS
# 2-space indentation for these, 4-space for everything else.
TWO_SPACE_EXTS = {'html', 'htm', 'json', 'yaml', 'yml', 'js', 'ts'}


def get_ext(filename):
    # Lower-case extension (without dot) of *filename*, or '' if none."
    if not filename:
        return ''
    return os.path.splitext(filename)[1].lower().lstrip('.')


def is_supported(filename):
    return get_ext(filename) in SUPPORTED_EXTS

def classify(filename):
    # Map a filename to: 'plain', 'structured', 'asset', 'view_only'
    # or None when the extension is unsupported."
    ext = get_ext(filename)
    if ext in PLAIN_TEXT_EXTS:
        return 'plain'
    if ext in STRUCTURED_TEXT_EXTS:
        return 'structured'
    if ext in ASSET_EXTS:
        return 'asset'
    if ext in VIEW_ONLY_EXTS:
        return 'view_only'
    return None

def is_editable(filename):
    # Only plain / structured text files may be modified in the editor."
    return classify(filename) in ('plain', 'structured')

# Resource path for PyInstaller
def resource_path(relative_path):
    """Get absolute path to resource, works for dev and PyInstaller."""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))
        if os.path.basename(base_path) == 'app':
            base_path = os.path.dirname(base_path)
    return os.path.join(base_path, relative_path)

app = Flask(__name__,
            template_folder=resource_path('templates'),
            static_folder=resource_path('static'))

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_FILE = os.path.join(PROJECT_ROOT, 'config.json')

def load_config():
    if not os.path.exists(CONFIG_FILE):
        default = {"storage_path": os.path.join(PROJECT_ROOT, 'storage')}
        with open(CONFIG_FILE, 'w') as f:
            json.dump(default, f, indent=2)
        return default
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def save_config(config_data):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config_data, f, indent=2)

config = load_config()
STORAGE_PATH = config.get('storage_path', os.path.join(PROJECT_ROOT, 'storage'))

if not os.path.exists(STORAGE_PATH):
    os.makedirs(STORAGE_PATH)

# Main functionality
def parse(text):
    return text

def to_markdown(text):
    return text

def indent_text(content, ext):
    # Normalize indentation while *preserving* the structure of the file.
    #
    # JSON is re-serialized with its canonical indent (and therefore keeps the
    # exact nesting the author wrote). HTML is NOT re-parsed (that would mangle
    # user markup); instead every existing line is preserved verbatim so the
    # original indentation survives the round-trip.
    if ext == 'json':
        try:
            parsed = json.loads(content)
        except (ValueError, TypeError):
            # Invalid JSON: fall back to the raw text untouched.
            return content
        return json.dumps(parsed, indent=2, ensure_ascii=False)

    if ext in ('html', 'htm'):
        # Keep the document exactly as authored - indentation included.
        return content
    return content

def get_preview(content, max_chars=140):
    # ... (unchanged)
    snippet_lines = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        stripped = re.sub(r'^#{1,6}\s*', '', stripped)
        stripped = re.sub(r'^[-*]\s+(\[[ xX]\]\s*)?', '', stripped)
        stripped = re.sub(r'^\d+\.\s+', '', stripped)
        stripped = re.sub(r'^>\s*', '', stripped)
        stripped = stripped.strip('`')
        stripped = re.sub(r'\*\*(.*?)\*\*', r'\1', stripped)
        stripped = re.sub(r'\*(.*?)\*', r'\1', stripped)
        stripped = re.sub(r'~~(.*?)~~', r'\1', stripped)
        if stripped.startswith('```') or stripped == '---':
            continue
        snippet_lines.append(stripped)
        if len(' '.join(snippet_lines)) >= max_chars:
            break

    text = ' '.join(snippet_lines).strip()
    if len(text) > max_chars:
        text = text[:max_chars].rsplit(' ', 1)[0] + '…'
    return text or "(empty note)"

#routing
@app.route('/')
def home():
    # Only surface files whose extension is on the allowlist. Assets and
    # view-only documents are intentionally not listed as editable notes.
    filenames = [
        f for f in os.listdir(STORAGE_PATH)
        if is_editable(f)
    ]
    if not filenames:
        return r('index.html')

    projects = []
    for fname in filenames:
        filepath = os.path.join(STORAGE_PATH, fname)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            preview = get_preview(content)
        except OSError:
            preview = "(unable to read file)"
        projects.append({'filename': fname, 'preview': preview})

    return r('index.html', projects=projects)

@app.route('/new')
def new_project():
    return r('index.html', filename='', content='')

@app.route('/edit/<filename>')
def edit_project(filename):
    filename = secure_filename(filename)
    # Unsupported / non-editable extensions (images, pdf, documents, unknown)
    # must never be opened in the editor.
    if not filename or not is_editable(filename):
        return redirect(url_for('home'))

    filepath = os.path.join(STORAGE_PATH, filename)
    if os.path.dirname(filepath) != STORAGE_PATH:
        return redirect(url_for('home'))
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        return r('index.html', filename=filename, content=content)
    return redirect(url_for('home'))

@app.route('/api/parse', methods=['POST'])
def parse_text():
    data = request.get_json() or {}
    raw_text = data.get('text', '')
    parsed_html = parse(raw_text)
    return jsonify({'html': parsed_html})

@app.route('/format-content', methods=['POST'])
def format_content():
    # Return a text file's content tuned to its extension.
    #   plain       (txt / md / csv) -> raw, untouched text.
    #   structured  (json / html)    -> text whose indentation is preserved.
    #   asset       (png / jpg ...)  -> rejected: images are not editable.
    #   view_only   (pdf / docs)     -> rejected: strictly read-only.
    data = request.get_json() or {}
    content = data.get('content', '')
    extension = (data.get('extension') or '').lower().lstrip('.')
    filename = data.get('filename', '')
    if not extension and filename:
        extension = get_ext(filename)

    kind = classify(f"x.{extension}")
    if kind in (None, 'asset', 'view_only'):
        return jsonify({
            'status': 'unsupported',
            'error': f'".{extension}" files cannot be opened in the editor. '
                     'Allowed: .txt .md .csv .json .html .png .jpg .jpeg .pdf'
        }), 400
    if kind == 'structured':
        content = indent_text(content, extension)
    # 'plain' -> returned verbatim.
    return jsonify({'status': 'success', 'content': content,
                    'kind': kind, 'editable': True})

@app.route('/file-content', methods=['POST'])
def file_content():
    # Read a single file from disk with the appropriate handling.
    # Images are served as data URLs (assets, never editable); PDFs / documents
    # are resolved to a URL that only ever renders them read-only.
    data = request.get_json() or {}
    rel_path = data.get('path', '')
    if not rel_path:
        return jsonify({'status': 'error', 'message': 'No path supplied'}), 400
    abs_path = os.path.abspath(os.path.join(STORAGE_PATH, rel_path))
    if os.path.commonpath([abs_path, os.path.abspath(STORAGE_PATH)]) \
            != os.path.abspath(STORAGE_PATH):
        return jsonify({'status': 'error', 'message': 'Path escapes storage'}), 400
    if not os.path.isfile(abs_path):
        return jsonify({'status': 'error', 'message': 'File not found'}), 404
    filename = os.path.basename(abs_path)
    kind = classify(filename)
    if kind is None:
        return jsonify({
            'status': 'error',
            'message': f'".{get_ext(filename)}" is not a supported file type.'
        }), 415
    name = os.path.basename(abs_path)

    if kind == 'asset':
        mime = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        with open(abs_path, 'rb') as f:
            encoded = base64.b64encode(f.read()).decode('ascii')
        return jsonify({
            'status': 'success', 'kind': 'asset', 'name': name,
            'editable': False,
            'src': f'data:{mime};base64,{encoded}',
        })

    if kind == 'view_only':
        return jsonify({
            'status': 'success', 'kind': 'view_only', 'name': name,
            'editable': False,
            'src': url_for('raw_file', filepath=rel_path),
        })

    with open(abs_path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    if kind == 'structured':
        text = indent_text(text, get_ext(filename))
    return jsonify({
        'status': 'success', 'kind': kind, 'name': name,
        'editable': True, 'content': text, 'extension': get_ext(filename),
    })

@app.route('/file-raw')
def raw_file():
    # Stream a view-only document (e.g. PDF) for read-only viewing.
    # Only files with a view-only extension may be requested, so this route can
    # never be used to pull arbitrary files off disk.
    rel_path = request.args.get('filepath', '')
    if not rel_path or not is_supported(rel_path) or is_editable(rel_path):
        return jsonify({'error': 'Not a viewable document'}), 403
    abs_path = os.path.abspath(os.path.join(STORAGE_PATH, rel_path))
    storage = os.path.abspath(STORAGE_PATH)
    if os.path.commonpath([abs_path, storage]) != storage \
            or not os.path.isfile(abs_path):
        return jsonify({'error': 'File not found'}), 404
    mimetype = mimetypes.guess_type(abs_path)[0] or 'application/octet-stream'
    return send_file(abs_path, mimetype=mimetype)

@app.route('/api/save', methods=['POST'])
def save_project():
    data = request.get_json() or {}
    filename = data.get('filename')
    content = data.get('content', '')

    if not filename:
        return jsonify({'error': 'Filename is required'}), 400

    filename = secure_filename(filename)
    if not filename:
        return jsonify({'error': 'Invalid filename'}), 400

    # Enforce the allowlist: only plain / structured text files are writable.
    if not is_editable(filename):
        ext = get_ext(filename)
        filename = f"{os.path.splitext(filename)[0] or 'untitled'}.md" \
            if not ext else filename
        if not is_editable(filename):
            return jsonify({
                'error': f'".{ext}" files cannot be saved. '
                         'Allowed: .txt .md .csv .json .html'
            }), 400
    filepath = os.path.join(STORAGE_PATH, filename)
    if os.path.dirname(filepath) != STORAGE_PATH:
        return jsonify({'error': 'Invalid filename'}), 400
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(to_markdown(content))
    return jsonify({'success': True, 'filename': filename})

@app.route('/get_storage_path', methods=['GET'])
def get_storage_path():
    return jsonify({'path': STORAGE_PATH})

@app.route('/set_storage_path', methods=['POST'])
def set_storage_path():
    global STORAGE_PATH
    data = request.get_json()
    if not data or 'path' not in data:
        return jsonify({'success': False, 'error': 'Missing path'}), 400

    new_path = data['path'].strip()
    if not new_path:
        return jsonify({'success': False, 'error': 'Path cannot be empty'}), 400

    if not os.path.exists(new_path):
        return jsonify({'success': False, 'error': f'Path "{new_path}" does not exist on server'}), 400
    if not os.access(new_path, os.W_OK):
        return jsonify({'success': False, 'error': f'Path "{new_path}" is not writable'}), 400

    STORAGE_PATH = new_path
    config['storage_path'] = new_path
    save_config(config)

    return jsonify({'success': True, 'path': new_path})

if __name__ == '__main__':
    app.run(debug=False)
