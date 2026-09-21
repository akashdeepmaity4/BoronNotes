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