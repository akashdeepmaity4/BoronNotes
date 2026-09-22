# UI UX & logic

## Sidebar

### Markup — templates/index.html:

```html
div.app-body                    ← flex row: sidebar | workspace
├─ aside.sidebar #sidebar       ← the sliding rail
│  ├─ div.sidebar-header
│  │  ├─ svg.logo-icon #logoBtn     ← the green chevron; expands
│  │  ├─ span.sidebar-title #notesToggleBtn "Notes"  ← collapses
│  │  └─ div.sidebar-actions
│  │     ├─ button.action-btn ➕    ← new file
│  │     └─ button.action-btn 📁    ← new folder
│  └─ div.tree-view             ← file tree, populated at runtime
└─ main.workspace               ← editor + viewers
```


- NOTE - Everything is static HTML; the tree is filled in by JS via renderNativeTreeUI(). The animation is two independent transitions. The collapse is a width transition, not a translate or display toggle.


### style - static/css/style.css:

```css
.app-body        { display: flex; overflow: hidden; }

.sidebar         { width: 240px;
                   flex-shrink: 0;              /* never squeezed by flexbox   */
                   border-right: 1px solid var(--border-color);
                   display: flex; flex-direction: column;
                   transition: width 0.2s ease; }   /* ← the animation          */

.sidebar.collapsed { width: 48px; }

.sidebar.collapsed .sidebar-title,
.sidebar.collapsed .sidebar-actions,
.sidebar.collapsed .tree-view { display: none !important; }
```

### So when the class flips, three things happen at once:

- The rail animates 240px → 48px over 0.2s, easing.

- The contents vanish instantly, not animated — display: none is not an animatable property, so the title, action buttons and tree disappear on frame one while the rail is still wide.

- The workspace slides left to fill the freed space. Because .app-body is display: flex and .sidebar has flex-shrink: 0, the main.workspace (flex: 1) absorbs all remaining width automatically. There is no JS driving the workspace at all — no width calculation, no transform. It's purely a flexbox reflow reacting to the rail's width.

- What remains at 48px: the sidebar's padding: 0 12px inside .sidebar-header, plus the 20px SVG with flex-shrink: 0. The 48px is hand-tuned so the logo still fits with breathing room.


### evenlisteners - static/js/main.js:

```javascript
// --- Sidebar Mechanics ---
if (notesToggleBtn) {
  notesToggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
}
if (logoBtn) {
  logoBtn.addEventListener('click', () => sidebar.classList.remove('collapsed'));
}
```

- notesToggleBtn (the "Notes" text) → classList.toggle('collapsed'). This is the only thing that closes the sidebar, and the only bidirectional control.

- logoBtn (the green chevron) → classList.remove('collapsed'). Expand only — clicking it when already open does nothing. That's deliberate: the logo stays visible when collapsed, so it serves as the "reopen" affordance.

### Creation target semantics - static/js/main.js:

- `getCreateTargetDir()` resolves the destination in this order: current active file's directory, current open root folder, selected directory, then the native fallback for an empty state.
- `Ctrl+N` creates a new file, and `Ctrl+Shift+N` creates a new folder.
- When a file is open, both actions target the file's parent directory; when a directory is open, they target that directory root instead; if no tree item is active, they defer to the OS-native file-picker flow.
- This mirrors the normal Explorer behavior and prevents creation from silently landing in a stale or unrelated path.



> Both 1. and 2. are guarded with if (el), so a missing element degrades to a no-op rather than a null crash.

- Extra listeners that touch the sidebar indirectly
These aren't on the sidebar element itself but do affect it:

1. .action-btn buttons (found by scanning text for ➕ / 📁 — a fragility worth noting): the ➕ opens createNewFilePrompt(), the 📁 calls fetch('/create-folder').

1. Document-level click → closeAllDropdowns(). Unrelated to the sidebar's width, but it's the same click-dispatch flow.

1. logoBtn is inside .sidebar-header, which is not hidden when collapsed — that's why the expand affordance survives.


```javascript
// --- Logic hardcoded with emojies not classes ---
if (btn.textContent.includes('➕') || btn.textContent.includes('+')) actionNewFile = btn;
if (btn.textContent.includes('📁')) actionNewFolder = btn;
```

## Terminal Launch — `Ctrl + \``

### listener — static/js/main.js:

```javascript
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
```

- Matches on both `e.key === '\`'` and `e.code === 'Backquote'`, so it works regardless of keyboard layout or modifier state.
- It is a plain `preventDefault()` + `fetch`, not a keydown-hold or toggle. There is no UI element for the terminal — the shortcut is the only entry point.
- The response is checked as `data.status !== 'success'`, which is the `{status, message}` contract shared with `/save-file` and `/file-content` (see the sidebar note on route conventions).

### Backend — app/app.py:

- Route `POST /open-terminal`. Resolves a shell in three steps, first match wins: `bash` on `PATH`, then Git Bash at its default install roots, then `cmd.exe`.
- The working directory is `STORAGE_PATH`, falling back to the process CWD if that directory does not exist.
- On Windows the process is spawned detached with `CREATE_NEW_CONSOLE` — an interactive shell needs its own console for stdin; otherwise it inherits the app's console and exits immediately.
- Returns `{ status, message, shell, path }`. `shell` is one of `bash`, `git-bash`, `cmd`.

> The `analysis/` note in this file previously flagged `/create-folder` as a fetch with no backend route. The same applied to `/open-terminal`, `/run-file` and `/create-file`. `/open-terminal` is now implemented; the other three remain missing.
