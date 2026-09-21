document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const sidebar = document.getElementById('sidebar');
  const notesToggleBtn = document.getElementById('notesToggleBtn');
  const logoBtn = document.getElementById('logoBtn');
  const textCanvas = document.getElementById('textCanvas');
  const treeContainer = document.querySelector('.tree-view');
  const saveFileBtn = document.getElementById('saveFileBtn');
  const activeFileName = document.getElementById('activeFileName');

  // File Pickers
  const filePicker = document.getElementById('filePicker');
  const folderPicker = document.getElementById('folderPicker');
  const nativeFilePicker = document.getElementById('native-file-picker');

  // Read-only viewers
  const assetViewer = document.getElementById('assetViewer');
  const assetImage = document.getElementById('assetImage');
  const assetBadge = document.getElementById('assetBadge');
  const docViewer = document.getElementById('docViewer');
  const docFrame = document.getElementById('docFrame');
  const docFallback = document.getElementById('docFallback');
  const docDownloadLink = document.getElementById('docDownloadLink');

  // Markdown preview pane
  const markdownPreview = document.getElementById('markdownPreview');
  const markdownBody = document.getElementById('markdownBody');
  const markdownBadge = document.getElementById('markdownBadge');

  // --- Supported file types (mirror of the server-side allowlist) ---
  //   plain      : treated as raw plain text
  //   structured : text whose indentation is preserved (json/html)
  //   asset      : image, shown non-editable as an asset
  //   viewOnly   : document, strictly read-only
  const PLAIN_EXTS = ['txt', 'md', 'markdown', 'csv', 'tsv'];
  const STRUCTURED_EXTS = ['json', 'html', 'htm'];
  const ASSET_EXTS = ['png', 'jpg', 'jpeg'];
  const VIEW_ONLY_EXTS = ['pdf', 'doc', 'docx', 'gdoc'];
  const EDITABLE_EXTS = [...PLAIN_EXTS, ...STRUCTURED_EXTS];
  const SUPPORTED_EXTS = [
    ...PLAIN_EXTS, ...STRUCTURED_EXTS, ...ASSET_EXTS, ...VIEW_ONLY_EXTS
  ];
  const PICKER_ACCEPT = SUPPORTED_EXTS.map(ext => `.${ext}`).join(',');
  const UNSUPPORTED_MSG =
    'That file type is not supported.\n\nAllowed types: ' +
    SUPPORTED_EXTS.map(ext => `.${ext}`).join(' ');

  function getExtension(name) {
    if (!name || name.indexOf('.') === -1) return '';
    return name.split('.').pop().toLowerCase();
  }

  function classifyExtension(ext) {
    if (PLAIN_EXTS.includes(ext)) return 'plain';
    if (STRUCTURED_EXTS.includes(ext)) return 'structured';
    if (ASSET_EXTS.includes(ext)) return 'asset';
    if (VIEW_ONLY_EXTS.includes(ext)) return 'viewOnly';
    return null;
  }

  function isEditableExtension(ext) {
    return EDITABLE_EXTS.includes(ext);
  }

  function isSupportedName(name) {
    return classifyExtension(getExtension(name)) !== null;
  }

  // Only these extensions get the Ctrl+Shift+V preview.
  const MARKDOWN_EXTS = ['md', 'markdown'];

  function isMarkdownActive() {
    if (currentFilePath === null && textCanvas && textCanvas.innerHTML.trim() === '') return false;
    return MARKDOWN_EXTS.includes(currentFileExt);
  }

  // Keep the pickers locked to the allowlist.
  [filePicker, nativeFilePicker].forEach(picker => {
    if (picker) picker.setAttribute('accept', PICKER_ACCEPT);
  });

  // The picker actually used for "Open" (Ctrl+O / File > Open).
  // Prefer the plain picker: it is the one that reliably delivers a `change`
  // event in every host we support (browser and pywebview/WebView2 alike).
  const activeFilePicker = filePicker || nativeFilePicker;

  // Single entry point for opening a file, so the menu item and Ctrl+O can
  // never drift apart again.
  function promptOpenFile() {
    const picker = activeFilePicker || nativeFilePicker || filePicker;
    if (!picker) {
      alert('File open is unavailable in this environment.');
      return;
    }
    picker.value = '';   // allow re-picking the same file after a failed open
    picker.click();
  }

  // Hidden Fallback File Picker for Save As (Browser Context)
  let saveAsFallbackPicker = document.getElementById('saveAsFallbackPicker');
  if (!saveAsFallbackPicker) {
    saveAsFallbackPicker = document.createElement('input');
    saveAsFallbackPicker.type = 'file';
    saveAsFallbackPicker.id = 'saveAsFallbackPicker';
    saveAsFallbackPicker.style.display = 'none';
    saveAsFallbackPicker.setAttribute('nwsaveas', '');
    document.body.appendChild(saveAsFallbackPicker);
  }

  // Header Dropdown Elements
  const fileMenuBtn = document.getElementById('file-menu-btn');
  const fileDropdown = document.getElementById('file-dropdown');
  const editMenuBtn = document.getElementById('edit-menu-btn');
  const editDropdown = document.getElementById('edit-dropdown');
  const viewMenuBtn = document.getElementById('view-menu-btn');
  const viewDropdown = document.getElementById('view-dropdown');
  const settingsMenuBtn = document.getElementById('settings-menu-btn');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const helpMenuBtn = document.getElementById('help-menu-btn');
  const helpDropdown = document.getElementById('help-dropdown');

  const themeStatusText = document.getElementById('theme-status-text');
  const linesStatusText = document.getElementById('lines-status-text');

  // Settings Sub-Panel Elements
  const fontSettingsToggle = document.getElementById('font-settings-toggle');
  const fontSettingsPanel = document.getElementById('font-settings-panel');
  const fontSizeInput = document.getElementById('fontSizeInput');
  const applyFontSizeBtn = document.getElementById('applyFontSizeBtn');
  const boldToggle = document.getElementById('boldToggle');
  const italicToggle = document.getElementById('italicToggle');

  // Base GitHub Repository URL
  const GITHUB_REPO_URL = 'https://github.com/akashdeepmaity4/VeritasCode/blob/main';

  // Line Numbers Sidebar Container Setup
  const gridContainer = document.querySelector('.editor-grid-container');
  let lineNumbersContainer = document.querySelector('.line-numbers');

  if (gridContainer && !lineNumbersContainer) {
    lineNumbersContainer = document.createElement('div');
    lineNumbersContainer.className = 'line-numbers hidden';
    lineNumbersContainer.contentEditable = 'false';
    lineNumbersContainer.setAttribute('aria-hidden', 'true');
    gridContainer.insertBefore(lineNumbersContainer, textCanvas);
  }

  // Set Default View Menu Labels
  if (themeStatusText) themeStatusText.textContent = 'Enable Light Mode';
  if (linesStatusText) linesStatusText.textContent = 'Show Line Numbers';

  // Sidebar Action Buttons
  const actionButtons = document.querySelectorAll('.action-btn');
  let actionNewFile = null;
  let actionNewFolder = null;

  actionButtons.forEach(btn => {
    if (btn.textContent.includes('➕') || btn.textContent.includes('+')) actionNewFile = btn;
    if (btn.textContent.includes('📁')) actionNewFolder = btn;
  });

  // State Variables
  let currentRootDir = null;
  let selectedTargetDir = null;
  let currentFilePath = null;
  let currentFileExt = 'md';
  let fileHandle = null;

  let ctrlKPressed = false;
  let ctrlKTimeout = null;

  // --- Utility Functions ---
  function normalizePath(pathStr) {
    return pathStr ? pathStr.replace(/\\/g, '/') : null;
  }

  function sanitizeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/  /g, '&nbsp;&nbsp;')
      .replace(/\r?\n/g, '<br>');
  }

  // --- Read-only / editable mode switching ---
  function hideAllViewers() {
    if (assetViewer) assetViewer.classList.add('hidden');
    if (docViewer) docViewer.classList.add('hidden');
    // Opening or switching to another file must exit preview mode, or a stale
    // rendered pane would sit over the new document.
    if (typeof markdownPreviewOn !== 'undefined' && markdownPreviewOn &&
        markdownPreview) {
      markdownPreview.classList.add('hidden');
      markdownPreviewOn = false;
    }
    if (markdownPreview) markdownPreview.classList.add('hidden');
    if (textCanvas) textCanvas.classList.remove('hidden');
    if (lineNumbersContainer) lineNumbersContainer.classList.add('hidden');
  }

  // Decide how a given extension should be presented.
  function applyClassification(name, src, ext, content) {
    const kind = classifyExtension(ext);
    currentFileExt = ext;

    if (kind === 'asset') {
      showAsset(name, src);
      return;
    }
    if (kind === 'viewOnly') {
      showDocument(name, src, ext);
      return;
    }

    // plain / structured text -> editable canvas
    hideAllViewers();
    setEditable(true);
    if (activeFileName) activeFileName.textContent = name;
    if (textCanvas) {
      textCanvas.replaceChildren();
      // Preserve the exact text (including indentation) character for character,
      // only translating whitespace to non-breaking spaces so leading
      // indentation stays visible inside the editor.
      const lines = String(content === undefined ? '' : content).split('\n');
      lines.forEach((line, index) => {
        if (index > 0) textCanvas.appendChild(document.createElement('br'));
        textCanvas.appendChild(document.createTextNode(
          line.replace(/\t/g, '\u00a0\u00a0\u00a0\u00a0').replace(/ /g, '\u00a0')
        ));
      });
    }
    updateLineNumbers();
  }

  // Load a File object picked from disk (File API), enforcing the allowlist.
  function openPickedFile(file) {
    const name = file.name;
    if (!isSupportedName(name)) {
      alert(UNSUPPORTED_MSG);
      return;
    }

    const ext = getExtension(name);
    const kind = classifyExtension(ext);
    currentFilePath = file.path
      ? normalizePath(file.path)
      : normalizePath(`${currentRootDir || '.'}/${name}`);
    fileHandle = null;

    // Binary types are read as data URLs; text types as text.
    const reader = new FileReader();
    if (kind === 'asset') {
      reader.onload = (event) => applyClassification(name, event.target.result, ext);
      reader.readAsDataURL(file);
    } else if (kind === 'viewOnly') {
      // Documents are view-only; PDFs stream read-only, others offer a link.
      applyClassification(name, URL.createObjectURL(file), ext);
    } else {
      reader.onload = (event) => {
        const rawContent = event.target.result;
        fetch('/format-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: rawContent, extension: ext, filename: name })
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'success') {
              applyClassification(name, null, ext, data.content);
            } else {
              alert(data.error || UNSUPPORTED_MSG);
            }
          })
          .catch(() => applyClassification(name, null, ext, rawContent));
      };
      reader.readAsText(file);
    }
  }

  function setEditable(isEditable) {
    if (textCanvas) textCanvas.setAttribute('contenteditable', isEditable ? 'true' : 'false');
    if (saveFileBtn) {
      saveFileBtn.disabled = !isEditable;
      saveFileBtn.style.opacity = isEditable ? '' : '0.4';
      saveFileBtn.style.cursor = isEditable ? '' : 'not-allowed';
    }
  }

  // Render an image asset: visible but never editable.
  function showAsset(name, src) {
    hideAllViewers();
    setEditable(false);
    if (textCanvas) textCanvas.classList.add('hidden');
    if (lineNumbersContainer) lineNumbersContainer.classList.add('hidden');
    if (assetBadge) assetBadge.textContent = `Read-only asset — ${name}`;
    if (assetImage) assetImage.src = src;
    if (assetViewer) assetViewer.classList.remove('hidden');
    if (activeFileName) activeFileName.textContent = name;
  }

  // Render a document (pdf/docx/gdoc) strictly for viewing.
  function showDocument(name, src, ext) {
    hideAllViewers();
    setEditable(false);
    if (textCanvas) textCanvas.classList.add('hidden');
    if (lineNumbersContainer) lineNumbersContainer.classList.add('hidden');

    const inlineCapable = ['pdf', 'txt'].includes(ext);
    if (docFrame) {
      docFrame.src = inlineCapable ? src : 'about:blank';
      docFrame.classList.toggle('hidden', !inlineCapable);
    }
    if (docFallback) docFallback.hidden = inlineCapable;
    if (docDownloadLink) docDownloadLink.href = src;
    if (docViewer) docViewer.classList.remove('hidden');
    if (activeFileName) activeFileName.textContent = name;
  }

  // -----------------------------------------------------------------------
  // Markdown preview (Ctrl+Shift+V)
  //
  // Rendered in-process so the app stays fully offline: no CDN, no new
  // dependency. Output is HTML-escaped first and only a fixed, known set of
  // tags is produced, so a document cannot inject script into the preview.
  // -----------------------------------------------------------------------
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Inline spans: code, bold, italic, strikethrough, links, images.
  function renderInline(text) {
    let out = escapeHTML(text);

    // Inline code first, and shield its contents from other rules by swapping
    // each span for a placeholder we substitute back at the very end.
    const codeSpans = [];
    out = out.replace(/`([^`]+)`/g, (m, code) => {
      codeSpans.push(code);
      return '\u0000CODE' + (codeSpans.length - 1) + '\u0000';
    });

    // Images before links: the syntax differs only by a leading '!'.
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      (m, alt, src, title) => {
        const t = title ? ' title="' + title + '"' : '';
        return '<img src="' + src + '" alt="' + alt + '"' + t + '>';
      });

    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      (m, label, href, title) => {
        const t = title ? ' title="' + title + '"' : '';
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer"' + t + '>' + label + '</a>';
      });

    out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    out = out.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    out = out.replace(/(^|[^_\w])_([^_\n]+)_(?=[^_\w]|$)/g, '$1<em>$2</em>');
    out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Restore inline code, escaping it as text content.
    out = out.replace(/\u0000CODE(\d+)\u0000/g,
      (m, i) => '<code>' + escapeHTML(codeSpans[Number(i)]) + '</code>');

    return out;
  }

  // Block level: headings, fenced code, lists, blockquotes, tables, rules.
  function renderMarkdown(source) {
    const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let i = 0;

    const listStack = [];   // open <ul>/<ol> tags
    const closeLists = () => {
      while (listStack.length) html.push(listStack.pop());
    };

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code block
      const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
      if (fence) {
        closeLists();
        const lang = fence[1];
        i++;
        const buf = [];
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++; // consume the closing fence
        const cls = lang ? ' class="language-' + escapeHTML(lang) + '"' : '';
        html.push('<pre><code' + cls + '>' +
          escapeHTML(buf.join('\n')) + '</code></pre>');
        continue;
      }

      // Horizontal rule
      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
        closeLists();
        html.push('<hr>');
        i++;
        continue;
      }

      // ATX heading
      const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (heading) {
        closeLists();
        const level = heading[1].length;
        html.push('<h' + level + '>' + renderInline(heading[2]) +
          '</h' + level + '>');
        i++;
        continue;
      }

      // Blockquote (consecutive '>' lines)
      if (/^\s*>/.test(line)) {
        closeLists();
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        html.push('<blockquote>' + renderMarkdown(buf.join('\n')) +
          '</blockquote>');
        continue;
      }

      // Table (header row + separator row)
      if (line.indexOf('|') !== -1 && i + 1 < lines.length &&
          /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
        closeLists();
        const cells = (row) => row.replace(/^\s*\||\|\s*$/g, '')
          .split('|').map(c => c.trim());
        const head = cells(line);
        i += 2;
        const body = [];
        while (i < lines.length && lines[i].indexOf('|') !== -1 &&
               lines[i].trim() !== '') {
          body.push(cells(lines[i]));
          i++;
        }
        let t = '<table><thead><tr>';
        head.forEach(c => { t += '<th>' + renderInline(c) + '</th>'; });
        t += '</tr></thead><tbody>';
        body.forEach(row => {
          t += '<tr>';
          row.forEach(c => { t += '<td>' + renderInline(c) + '</td>'; });
          t += '</tr>';
        });
        t += '</tbody></table>';
        html.push(t);
        continue;
      }

      // Task list / bullet list / ordered list
      const bullet = line.match(/^\s*([-*+])\s+(.*)$/);
      const ordered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (bullet || ordered) {
        const want = ordered ? 'ol' : 'ul';
        if (listStack.length === 0 || listStack[listStack.length - 1] !== '</' + want + '>') {
          closeLists();
          html.push('<' + want + '>');
          listStack.push('</' + want + '>');
        }
        let content = (bullet ? bullet[2] : ordered[2]);
        const task = content.match(/^\[([ xX])\]\s+(.*)$/);
        if (task) {
          const checked = task[1].toLowerCase() === 'x' ? ' checked' : '';
          html.push('<li><input type="checkbox" disabled' + checked + '>' +
            renderInline(task[2]) + '</li>');
        } else {
          html.push('<li>' + renderInline(content) + '</li>');
        }
        i++;
        continue;
      }

      // Blank line
      if (line.trim() === '') {
        closeLists();
        i++;
        continue;
      }

      // Paragraph (consecutive non-blank, non-structural lines)
      closeLists();
      const buf = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== '' &&
             !/^\s*(#{1,6}\s|>|```)/.test(lines[i]) &&
             !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) &&
             !/^\s*([-*_])\s*(\1\s*){2,}$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      // Render each source line as inline markdown, THEN join with <br>.
      // Doing it the other way round would let renderInline escape the tag.
      html.push('<p>' + buf.map(renderInline).join('<br>') + '</p>');
    }

    closeLists();
    return html.join('\n');
  }

  let markdownPreviewOn = false;

  function showMarkdownPreview() {
    if (!markdownPreview || !markdownBody) return;
    markdownBody.innerHTML = renderMarkdown(getPlainTextFromCanvas());
    markdownPreview.classList.remove('hidden');
    if (textCanvas) textCanvas.classList.add('hidden');
    if (lineNumbersContainer) lineNumbersContainer.classList.add('hidden');
    setEditable(false);
    markdownPreviewOn = true;
    if (markdownBadge) {
      markdownBadge.textContent =
        'Markdown preview — Ctrl+Shift+V for raw text';
    }
  }

  function hideMarkdownPreview() {
    if (!markdownPreview) return;
    markdownPreview.classList.add('hidden');
    if (textCanvas) textCanvas.classList.remove('hidden');
    setEditable(true);
    updateLineNumbers();
    markdownPreviewOn = false;
  }

  // Ctrl+Shift+V behaviour: toggle, and ONLY for markdown files.
  function toggleMarkdownPreview() {
    if (!isMarkdownActive()) return;   // other extensions: nothing at all
    if (markdownPreviewOn) hideMarkdownPreview();
    else showMarkdownPreview();
  }

  function getPlainTextFromCanvas() {
    if (!textCanvas) return '';
    let text = textCanvas.innerText;
    if (typeof text !== 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = textCanvas.innerHTML
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<p>/gi, '\n')
        .replace(/<\/p>/gi, '');
      text = temp.textContent || temp.innerText || '';
    }
    return text.replace(/\u00A0/g, ' ');
  }

  // --- Sidebar Mechanics ---
  if (notesToggleBtn) {
    notesToggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
  }
  if (logoBtn) {
    logoBtn.addEventListener('click', () => sidebar.classList.remove('collapsed'));
  }

  // --- Save Button Binding ---
  if (saveFileBtn) {
    saveFileBtn.addEventListener('click', () => saveCurrentFile());
  }

  // --- Dropdown Navigation ---
  function bindMenuToggle(btn, dropdown) {
    if (!btn || !dropdown) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const container = btn.closest('.menu-dropdown-container');
      const isHidden = dropdown.classList.contains('hidden');
      closeAllDropdowns();
      if (isHidden) {
        dropdown.classList.remove('hidden');
        if (container) container.classList.add('active');
      }
    });
  }

  bindMenuToggle(fileMenuBtn, fileDropdown);
  bindMenuToggle(editMenuBtn, editDropdown);
  bindMenuToggle(viewMenuBtn, viewDropdown);
  bindMenuToggle(settingsMenuBtn, settingsDropdown);
  bindMenuToggle(helpMenuBtn, helpDropdown);

  document.addEventListener('click', () => closeAllDropdowns());

  function closeAllDropdowns() {
    document.querySelectorAll('.app-dropdown-menu').forEach(menu => menu.classList.add('hidden'));
    document.querySelectorAll('.menu-dropdown-container').forEach(c => c.classList.remove('active'));
    if (fontSettingsPanel) fontSettingsPanel.classList.add('hidden');
  }

  if (fontSettingsPanel) {
    fontSettingsPanel.addEventListener('click', (e) => e.stopPropagation());
  }

  if (fontSettingsToggle && fontSettingsPanel) {
    fontSettingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      fontSettingsPanel.classList.toggle('hidden');
    });
  }

  if (applyFontSizeBtn && fontSizeInput && textCanvas) {
    applyFontSizeBtn.addEventListener('click', () => {
      const size = fontSizeInput.value;
      if (size && size >= 8 && size <= 72) {
        textCanvas.style.fontSize = `${size}px`;
      }
    });
  }

  if (boldToggle && textCanvas) {
    boldToggle.addEventListener('change', (e) => {
      textCanvas.style.fontWeight = e.target.checked ? 'bold' : 'normal';
    });
  }

  if (italicToggle && textCanvas) {
    italicToggle.addEventListener('change', (e) => {
      textCanvas.style.fontStyle = e.target.checked ? 'italic' : 'normal';
    });
  }

  // --- File Dropdown Router ---
  if (fileDropdown) {
    fileDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item || item.classList.contains('disabled')) return;

      const action = item.dataset.action;
      closeAllDropdowns();

      switch (action) {
        case 'new-file':
          if (actionNewFile) actionNewFile.click();
          else createNewFilePrompt();
          break;
        case 'open-file':
          promptOpenFile();
          break;
        case 'save':
          saveCurrentFile();
          break;
        case 'save-as':
          triggerSaveAsFile();
          break;
        case 'save-copy-as':
          triggerSaveCopyAsFile();
          break;
        case 'print-window':
          window.print();
          break;
        case 'close-window':
          resetEditorState();
          break;
        case 'exit-app':
          if (window.pywebview && window.pywebview.api && window.pywebview.api.close) {
            window.pywebview.api.close();
          } else {
            window.close();
          }
          break;
      }
    });
  }

  // --- Edit Dropdown Router ---
  if (editDropdown) {
    editDropdown.addEventListener('click', async (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item || item.classList.contains('disabled')) return;

      const action = item.dataset.action;
      closeAllDropdowns();

      if (textCanvas) textCanvas.focus();

      switch (action) {
        case 'undo':
          document.execCommand('undo');
          break;
        case 'redo':
          document.execCommand('redo');
          break;
        case 'cut':
          document.execCommand('cut');
          break;
        case 'copy':
          document.execCommand('copy');
          break;
        case 'paste':
          try {
            if (navigator.clipboard && navigator.clipboard.readText) {
              const text = await navigator.clipboard.readText();
              const formatted = sanitizeHTML(text);
              document.execCommand('insertHTML', false, formatted);
            } else {
              document.execCommand('paste');
            }
          } catch (err) {
            document.execCommand('paste');
          }
          break;
        case 'select-all':
          document.execCommand('selectAll');
          break;
      }
    });
  }

  // --- Line Numbers Generator ---
  function updateLineNumbers() {
    if (!lineNumbersContainer || lineNumbersContainer.classList.contains('hidden')) return;
    if (!textCanvas) return;

    const lines = textCanvas.innerHTML.split(/<div>|<br\s*\/?>|<p>/gi);
    const lineCount = Math.max(1, lines.length);

    let numsHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      numsHtml += `<span>${i}</span>`;
    }
    lineNumbersContainer.innerHTML = numsHtml;
  }

  // --- View Dropdown Router ---
  if (viewDropdown) {
    viewDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item || item.classList.contains('disabled')) return;

      const action = item.dataset.action;
      closeAllDropdowns();

      switch (action) {
        case 'toggle-theme':
          const isLight = document.body.classList.toggle('root-light');
          if (themeStatusText) {
            themeStatusText.textContent = isLight ? 'Enable Dark Mode' : 'Enable Light Mode';
          }
          break;
        case 'toggle-line-numbers':
          if (lineNumbersContainer) {
            const isVisible = lineNumbersContainer.classList.toggle('hidden');
            const shown = !isVisible;
            if (shown) updateLineNumbers();
            if (linesStatusText) {
              linesStatusText.textContent = shown ? 'Hide Line Numbers' : 'Show Line Numbers';
            }
          }
          break;
      }
    });
  }

  // --- Help Dropdown Router ---
  if (helpDropdown) {
    helpDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item || item.classList.contains('disabled')) return;

      const action = item.dataset.action;
      closeAllDropdowns();

      let targetUrl = '';

      switch (action) {
        case 'setup-usage':
          targetUrl = `${GITHUB_REPO_URL}/setupandusage.md`;
          break;
        case 'license':
          targetUrl = `${GITHUB_REPO_URL}/LICENSE.md`;
          break;
        case 'faqs':
          targetUrl = `${GITHUB_REPO_URL}/FAQs.md`;
          break;
      }

      if (targetUrl) {
        if (window.pywebview && window.pywebview.api && window.pywebview.api.open_external_url) {
          window.pywebview.api.open_external_url(targetUrl);
        } else {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      }
    });
  }

  // Shared handler for every "open a single file" picker.
  // One implementation, so the menu item, Ctrl+O and any picker behave the
  // same and cannot diverge.
  function handleSingleFilePicked(input) {
    try {
      const file = input.files && input.files[0];
      if (!file) {
        // The dialog closed without a selection. This is normal when the
        // user cancels, so stay quiet - but log it to make the difference
        // between "cancelled" and "failed" visible during debugging.
        console.debug('[open] no file selected (dialog cancelled)');
        return;
      }

      const normalizedFileName = normalizePath(file.name);
      if (normalizedFileName.startsWith('.git') || normalizedFileName.includes('/.git/')) {
        alert('Accessing .git files is restricted.');
        return;
      }

      // Strict allowlist: unsupported extensions are refused here.
      if (!isSupportedName(file.name)) {
        alert(UNSUPPORTED_MSG);
        return;
      }

      openPickedFile(file);
    } catch (err) {
      console.error('[open] failed to open picked file:', err);
      alert('Could not open that file: ' + (err && err.message ? err.message : err));
    } finally {
      // Always clear the input so the same file can be picked again and a
      // second `change` event will fire.
      try { input.value = ''; } catch (_) { /* ignore */ }
    }
  }

  // Bind the shared handler to both single-file inputs.
  [filePicker, nativeFilePicker].forEach(input => {
    if (!input) return;
    input.addEventListener('change', (e) => handleSingleFilePicked(e.target));
  });

  function showSaveIndicator() {
    if (!saveFileBtn) return;
    const originalBg = saveFileBtn.style.backgroundColor;
    saveFileBtn.style.backgroundColor = '#28a745';
    setTimeout(() => {
      saveFileBtn.style.backgroundColor = originalBg;
    }, 600);
  }

  // --- Save / Save As / Save Copy Helpers ---
  async function saveCurrentFile(isAutoSave = false) {
    // Assets (images) and documents (pdf/docs) are read-only: never persist.
    if (!isEditableExtension(currentFileExt)) {
      if (!isAutoSave) {
        alert('This file type is read-only and cannot be saved from here.');
      }
      return;
    }

    const plainContent = getPlainTextFromCanvas();

    // 1. Direct Save via File System Access API (Browser Mode)
    if (fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(plainContent);
        await writable.close();
        if (!isAutoSave) showSaveIndicator();
        return;
      } catch (err) {
        console.error('Error saving via File Handle:', err);
      }
    }

    // 2. Direct Save via Backend / File Path (pywebview or local server context)
    if (currentFilePath) {
      fetch('/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentFilePath,
          content: plainContent
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            if (!isAutoSave) showSaveIndicator();
          } else {
            if (!isAutoSave) alert(`Save Failed: ${data.message}`);
          }
        })
        .catch(err => {
          console.error('Error saving file:', err);
          if (!isAutoSave) alert(`Save Failed: ${err}`);
        });
      return;
    }

    // 3. Fallback: If no current file path or file handle and NOT auto-save, trigger Save As
    if (!isAutoSave) {
      triggerSaveAsFile();
    }
  }

  async function triggerSaveAsFile() {
    let targetPath = null;
    const plainContent = getPlainTextFromCanvas();

    // Option A: pywebview Native Dialog
    if (window.pywebview && window.pywebview.api && window.pywebview.api.save_file_dialog) {
      targetPath = await window.pywebview.api.save_file_dialog();
      if (!targetPath) return;
      targetPath = normalizePath(targetPath);

      fetch('/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: targetPath,
          content: plainContent
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            currentFilePath = targetPath;
            fileHandle = null;
            const fileName = targetPath.split('/').pop();
            if (activeFileName) activeFileName.textContent = fileName;
            showSaveIndicator();
          } else {
            alert(`Save Failed: ${data.message}`);
          }
        })
        .catch(err => console.error('Error in save as:', err));
      return;
    }

    // Option B: Standard Browser Mode (File System Access API)
    if ('showSaveFilePicker' in window) {
      try {
        const defaultName = activeFileName && activeFileName.textContent !== 'No file open'
          ? activeFileName.textContent
          : `untitled.${currentFileExt}`;
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [{
            description: 'Editable text files',
            accept: { 'text/plain': ['.txt', '.md', '.csv', '.json', '.html'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(plainContent);
        await writable.close();
        fileHandle = handle;
        currentFilePath = null;
        if (activeFileName) activeFileName.textContent = handle.name;
        showSaveIndicator();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('File System Access API Save As failed:', err);
      }
    }

    // Option C: Fallback Prompt to save to backend / workspace
    const defaultName = activeFileName && activeFileName.textContent !== 'No file open'
      ? activeFileName.textContent
      : `untitled.${currentFileExt}`;
    const fileNamePrompt = prompt('Save file as:', defaultName);
    if (!fileNamePrompt) return;

    // Saving is only ever allowed for editable text types.
    if (!isEditableExtension(getExtension(fileNamePrompt))) {
      alert('Files can only be saved as .txt, .md, .csv, .json or .html.');
      return;
    }

    const targetDir = currentRootDir || '.';
    const targetPathStr = normalizePath(`${targetDir}/${fileNamePrompt}`);

    fetch('/save-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: targetPathStr,
        content: plainContent
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          currentFilePath = targetPathStr;
          fileHandle = null;
          if (activeFileName) activeFileName.textContent = fileNamePrompt;
          showSaveIndicator();
        } else {
          // Download fallback
          const blob = new Blob([plainContent], { type: 'text/plain;charset=utf-8' });
          const downloadLink = document.createElement('a');
          downloadLink.download = fileNamePrompt;
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.click();
          URL.revokeObjectURL(downloadLink.href);
        }
      })
      .catch(err => console.error('Error in save fallback:', err));
  }

  async function triggerSaveCopyAsFile() {
    let copyPath = null;
    const plainContent = getPlainTextFromCanvas();

    if (window.pywebview && window.pywebview.api && window.pywebview.api.save_file_dialog) {
      copyPath = await window.pywebview.api.save_file_dialog();
      if (!copyPath) return;
      copyPath = normalizePath(copyPath);

      fetch('/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: copyPath,
          content: plainContent
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status !== 'success') {
            alert(`Save Copy Failed: ${data.message}`);
          }
        })
        .catch(err => console.error('Error in save copy as:', err));
      return;
    }

    // Browser Context
    const blob = new Blob([plainContent], { type: 'text/plain;charset=utf-8' });
    const downloadLink = document.createElement('a');
    const defaultName = activeFileName ? activeFileName.textContent : `copy.${currentFileExt}`;

    downloadLink.download = `copy_${defaultName !== 'No file open' ? defaultName : `untitled.${currentFileExt}`}`;
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.click();
    URL.revokeObjectURL(downloadLink.href);
  }

  function resetEditorState() {
    currentFilePath = null;
    fileHandle = null;
    currentFileExt = 'md';
    if (activeFileName) activeFileName.textContent = 'No file open';
    if (textCanvas) textCanvas.innerHTML = '';
    markdownPreviewOn = false;
    hideAllViewers();
    setEditable(true);
    updateLineNumbers();
  }

  let autoSaveTimeout = null;
  function triggerAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      if (currentFilePath || fileHandle) {
        saveCurrentFile(true);
      }
    }, 1000);
  }

  // --- Canvas Behavior ---
  if (textCanvas) {
    textCanvas.addEventListener('input', () => {
      updateLineNumbers();
      triggerAutoSave();
    });

    textCanvas.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        // Only HTML gets a 2-space indent; every other editable file gets 4.
        const twoSpaceExts = ['html', 'htm'];
        const spaceCount = twoSpaceExts.includes(currentFileExt) ? 2 : 4;
        const indentSpaces = '\u00a0'.repeat(spaceCount);

        const range = sel.getRangeAt(0);
        const tabNode = document.createTextNode(indentSpaces);
        range.insertNode(tabNode);

        range.setStartAfter(tabNode);
        range.setEndAfter(tabNode);
        sel.removeAllRanges();
        sel.addRange(range);
        updateLineNumbers();
      }
    });

    textCanvas.addEventListener('paste', (e) => {
      e.preventDefault();
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const text = clipboardData.getData('text/plain');
      const formatted = sanitizeHTML(text);

      document.execCommand('insertHTML', false, formatted);
      updateLineNumbers();
    });
  }

  // --- Keyboard Shortcuts Listener ---
  document.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // Ctrl + Shift + V: toggle Markdown preview.
    // Only .md / .markdown files respond; every other extension is a no-op
    // (and we must NOT preventDefault, so normal paste still works there).
    if (isCtrl && e.shiftKey && key === 'v') {
      if (isMarkdownActive()) {
        e.preventDefault();
        toggleMarkdownPreview();
      }
      return;
    }

    // Alt + Shift + S: Save Copy As
    if (e.altKey && e.shiftKey && key === 's') {
      e.preventDefault();
      triggerSaveCopyAsFile();
      return;
    }

    // Ctrl + P: Print Window
    if (isCtrl && key === 'p') {
      e.preventDefault();
      window.print();
      return;
    }

    // Ctrl + Shift + S: Save As
    if (isCtrl && e.shiftKey && key === 's') {
      e.preventDefault();
      triggerSaveAsFile();
      return;
    }

    // Ctrl + S: Save File Directly
    if (isCtrl && !e.shiftKey && key === 's') {
      e.preventDefault();
      saveCurrentFile();
      return;
    }

    // Ctrl + N: New File
    if (isCtrl && !e.shiftKey && key === 'n') {
      e.preventDefault();
      if (actionNewFile) actionNewFile.click();
      else createNewFilePrompt();
      return;
    }

    // Ctrl + Shift + N: Reset Editor Canvas
    if (isCtrl && e.shiftKey && key === 'n') {
      e.preventDefault();
      resetEditorState();
      return;
    }

    // Ctrl + ` : Launch Terminal
    if (isCtrl && (e.key === '`' || e.code === 'Backquote')) {
      e.preventDefault();
      fetch('/open-terminal', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.status !== 'success') alert(`Terminal Error: ${data.message}`);
        })
        .catch(err => console.error('Terminal execution error:', err));
      return;
    }

    // Editor Text Controls
    if (document.activeElement === textCanvas || (textCanvas && textCanvas.contains(document.activeElement))) {
      if (isCtrl && !e.shiftKey && key === 'z') {
        e.preventDefault();
        document.execCommand('undo');
        updateLineNumbers();
        return;
      }
      if (isCtrl && key === 'y') {
        e.preventDefault();
        document.execCommand('redo');
        updateLineNumbers();
        return;
      }
      if (isCtrl && key === 'x') {
        e.preventDefault();
        document.execCommand('cut');
        updateLineNumbers();
        return;
      }
      if (isCtrl && key === 'c') {
        e.preventDefault();
        document.execCommand('copy');
        return;
      }
      if (isCtrl && key === 'a') {
        e.preventDefault();
        document.execCommand('selectAll');
        return;
      }
    }

    // Ctrl + K Chaining
    if (isCtrl && key === 'k') {
      e.preventDefault();
      ctrlKPressed = true;
      clearTimeout(ctrlKTimeout);
      ctrlKTimeout = setTimeout(() => { ctrlKPressed = false; }, 1200);
      return;
    }

    // Open Pickers
    if (key === 'o') {
      if (ctrlKPressed) {
        e.preventDefault();
        ctrlKPressed = false;
        clearTimeout(ctrlKTimeout);
        if (folderPicker) folderPicker.click();
      } else if (isCtrl) {
        e.preventDefault();
        promptOpenFile();
      }
    }
  });

  // --- Execution Icon Handler ---
  const toolIcons = document.querySelectorAll('.tool-icon');
  toolIcons.forEach(btn => {
    if (btn.textContent.includes('▶')) {
      btn.addEventListener('click', () => {
        if (!currentFilePath) {
          alert('No saved disk file active to run.');
          return;
        }

        fetch('/run-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: currentFilePath })
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'error') {
              alert(`Execution Error: ${data.message}`);
            } else {
              alert(data.stdout || data.stderr || 'Execution completed with no output.');
            }
          })
          .catch(err => console.error('Error running script:', err));
      });
    }
  });

  // --- Directory Actions & Tree ---

  if (folderPicker) {
    folderPicker.addEventListener('change', (e) => {
      try {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Some hosts (notably WebView2 on Windows) do not populate
        // webkitRelativePath. Fall back to the file name so a folder still
        // renders a flat list instead of silently doing nothing.
        const relPathOf = (file) => {
          const raw = file.webkitRelativePath || file.name || '';
          return normalizePath(raw) || '';
        };

        const firstRel = relPathOf(files[0]);
        const hasRelativePaths = firstRel.indexOf('/') !== -1;
        const rootName = hasRelativePaths
          ? firstRel.split('/')[0]
          : 'Selected Folder';
        currentRootDir = rootName;

        const treeData = {};

        files.forEach(file => {
          const relativePath = relPathOf(file);
          if (!relativePath) return;

          if (relativePath.includes('/.git/') || relativePath.startsWith('.git/')) {
            return;
          }

          const parts = relativePath.split('/');
          // Drop the root segment only when a real relative path was given.
          if (hasRelativePaths && parts.length > 1 && parts[0] === rootName) {
            parts.shift();
          }
          if (parts.length === 0) return;

          let current = treeData;
          parts.forEach((part, index) => {
            if (index === parts.length - 1) {
              current[part] = { __type__: 'file', fileObj: file };
            } else {
              if (!current[part]) {
                current[part] = { __type__: 'dir', children: {} };
              }
              current = current[part].children;
            }
          });
        });

        if (Object.keys(treeData).length === 0) {
          alert('No files could be read from that folder.');
          return;
        }

        renderNativeTreeUI(rootName, treeData);
      } catch (err) {
        console.error('[folder] failed to read folder:', err);
        alert('Could not open that folder: ' +
              (err && err.message ? err.message : err));
      } finally {
        try { folderPicker.value = ''; } catch (_) { /* ignore */ }
      }
    });
  }

  function createNewFilePrompt() {
    const fileName = prompt('Enter new file name:');
    if (!fileName) return;

    const normalizedName = normalizePath(fileName);
    if (normalizedName === '.git' || normalizedName.startsWith('.git/')) {
      alert('Cannot create .git files.');
      return;
    }

    // New files must use one of the editable text extensions.
    if (!isEditableExtension(getExtension(fileName))) {
      alert('New files must be .txt, .md, .csv, .json or .html.');
      return;
    }

    const target = selectedTargetDir || currentRootDir;
    if (!target) {
      triggerSaveAsFile();
      return;
    }

    fetch('/create-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_dir: target, name: fileName })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          currentFilePath = normalizePath(`${target}/${fileName}`);
          fileHandle = null;
          currentFileExt = fileName.split('.').pop().toLowerCase();
          if (activeFileName) activeFileName.textContent = fileName;
          if (textCanvas) textCanvas.innerHTML = '';
          updateLineNumbers();
        } else {
          alert(data.message);
        }
      });
  }

  if (actionNewFile) actionNewFile.addEventListener('click', createNewFilePrompt);

  if (actionNewFolder) {
    actionNewFolder.addEventListener('click', () => {
      const folderName = prompt('Enter new folder name:');
      if (!folderName) return;

      const normalizedFolder = normalizePath(folderName);
      if (normalizedFolder === '.git') {
        alert('Cannot create .git folder.');
        return;
      }

      const target = selectedTargetDir || currentRootDir;
      if (!target) {
        alert('Select or open a folder target first.');
        return;
      }

      fetch('/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_dir: target, name: folderName })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status !== 'success') alert(data.message);
        });
    });
  }

  function renderNativeTreeUI(rootDirName, treeData) {
    if (!treeContainer) return;
    treeContainer.replaceChildren();

    const rootHeader = document.createElement('button');
    rootHeader.className = 'tree-folder';
    rootHeader.style.cssText = 'display:block; width:100%; text-align:left; background:none; border:none; cursor:pointer; color:inherit; padding:4px 12px; font-weight:bold;';
    rootHeader.textContent = `^ ${rootDirName}`;

    treeContainer.appendChild(rootHeader);
    const treeList = createNativeTreeNodes(treeData);
    treeContainer.appendChild(treeList);
  }

  function clearTreeSelections() {
    if (!treeContainer) return;
    const allButtons = treeContainer.querySelectorAll('button');
    allButtons.forEach(btn => btn.style.backgroundColor = 'transparent');
  }

  function createNativeTreeNodes(nodeObj) {
    const container = document.createElement('div');

    Object.keys(nodeObj).forEach(key => {
      const node = nodeObj[key];

      if (node.__type__ === 'file') {
        const fileBtn = document.createElement('button');
        fileBtn.className = 'tree-file';
        fileBtn.style.cssText = 'display:block; width:100%; text-align:left; background:none; border:none; cursor:pointer; color:inherit; padding:4px 12px 4px 28px;';
        fileBtn.textContent = `📄 ${key}`;

        fileBtn.addEventListener('click', (e) => {
          e.stopPropagation();

          // Strict allowlist: skip files whose extension isn't supported.
          if (!isSupportedName(key)) {
            alert(UNSUPPORTED_MSG);
            return;
          }

          clearTreeSelections();
          fileBtn.style.backgroundColor = 'var(--bg-active, #2a2d32)';

          const pathVal = node.fileObj
            ? (node.fileObj.path || node.fileObj.webkitRelativePath)
            : null;
          currentFilePath = pathVal
            ? normalizePath(pathVal)
            : normalizePath(`${currentRootDir || '.'}/${key}`);

          openPickedFile(node.fileObj);
        });

        container.appendChild(fileBtn);
      } else if (node.__type__ === 'dir') {
        const folderBtn = document.createElement('button');
        folderBtn.className = 'tree-folder';
        folderBtn.style.cssText = 'display:block; width:100%; text-align:left; background:none; border:none; cursor:pointer; color:inherit; padding:4px 12px; font-weight:600;';
        folderBtn.textContent = `^ ${key}`;

        const childGroup = createNativeTreeNodes(node.children);
        childGroup.style.display = 'block';

        folderBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearTreeSelections();
          folderBtn.style.backgroundColor = 'var(--bg-active, #2a2d32)';

          const isHidden = childGroup.style.display === 'none';
          childGroup.style.display = isHidden ? 'block' : 'none';
          folderBtn.textContent = `${isHidden ? '^' : 'v'} ${key}`;
        });

        container.appendChild(folderBtn);
        container.appendChild(childGroup);
      }
    });

    return container;
  }
});