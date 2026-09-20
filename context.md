# INTRODUCTION TO FILE

This file is to be treated as the file truth about anything in this project.

## USE 

#### This is a note taking + document viewer application.

1. This can create, alter, modify, delete files with the below extensions:

- Plain text - .txt
- Markdown - .md
- Comma seperated values - .csv
- JSON packets - .json
- HTML documents - .html

1. This can ONLY open, view and delete files with the below extensions:

- Image files - .png .jpg .jpeg 
- PDF documents - .pdf

## STYLING

### Design Language

- VS Code-inspired desktop shell: compact 12–13px chrome, 20px editor text areas, flat surfaces, hairline 1px borders.
- Single accent colour (`veritas-green`) used sparingly — branding, focus rings, active states, dropdown highlights.
- Two themes driven entirely by CSS custom properties on `:root`, `.root-dark` and `.root-light`. Theme is toggled by adding `.root-light` to `<body>`.
- Dark theme is the default (the `:root` values).
- System font stack for UI: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`; `monospace` is used only for line numbers.

### Colour Palette

#### Core Tokens (`:root`, dark default)

- Background / chrome
  - `--bg-dark`: `#181818` — app + header + workspace background
  - `--bg-sidebar`: `#191919` — sidebar background
  - `--bg-hover`: `#2a2d2e` — hover surface for menus, tree rows, tool icons
  - `--bg-active`: `#37373d` — active/selected surface (also tile trees, viewer badges)
- Brand
  - `--veritas-green`: `#00bd61` — primary accent (logo, titles, focus border, dropdown hover, selection)
  - `--veritas-green-hover`: `#3cff00` — brighter accent for hover on brand text / active tree file
- Text
  - `--text-main`: `#cccccc` — default body text
  - `--text-muted`: `#858585` — secondary text, icons, line numbers
- Border
  - `--border-color`: `#2b2b2b` — all hairline separators and dashed editor outline

#### Dark Theme Overrides (`.root-dark`)

- `--bg-primary`: `#383838`
- `--bg-secondary`: `#252526`
- `--bg-active`: `#37373d`
- `--text-main`: `#d4d4d4`
- `--text-muted`: `#858585`
- `--border-color`: `#333`
- `color-scheme`: `dark`

#### Light Theme Overrides (`.root-light`)

- `--bg-dark`: `#ffffff`
- `--bg-sidebar`: `#f3f3f3`
- `--bg-hover`: `#e8e8e8`
- `--bg-active`: `#d6d6d6`
- `--text-main`: `#222`
- `--text-muted`: `#666`
- `--border-color`: `#cccccc`
- `color-scheme`: `light`

#### Hard-coded Colours (theme-independent)

- `#ffffff` — app title text, dropdown hover text, `::selection` text
- `#cbcb` — menu item resting colour
- `#f9f9f9` / `#707070` / `#000` — dropdown menu surface, border, text
- `#d0d0d0` — dropdown divider
- `#888` — disabled dropdown item text
- `#ededed` / `#ccc` / `#000` — settings subpanel surface, border, text
- `#0078d7` → `#005a9e` — subpanel button and its hover
- `#fff` — document viewer iframe background
- `#28a745` (JS) — save-success flash on the save button
- `--veritas-green` on `.tool-icon:hover` — tool icons light up green on hover

### Typography

- Base UI size: `12px` (header), `13px` (dropdowns, tree, settings rows), `15px` (editor), `20px` (tool icons), `24px` (`.canvas-heading`).
- Weights: `400` default, `500` active tree file, `600` app title / folder rows / editor title, `bold` sidebar title / canvas heading.
- Editor line height: `1.6`.

### Layout & Spacing

- Header: `30px` tall, `0 10px` padding, `15px` gap, bottom hairline.
- Sidebar: `240px` expanded, `48px` collapsed (`.collapsed`), `width 0.2s ease` transition.
- Sidebar header / editor header: `45px` tall.
- Editor region: `padding: 20px`, height `calc(100vh - 75px)`.
- Radius scale: `3px` (small controls), `4px` (menus, editor), `999px` (pill badges).

### Components

- **App header** — flat bar holding the title and the File / Edit / View / Settings dropdown triggers.
- **Dropdowns** (`.app-dropdown-menu`) — absolutely positioned, `min-width: 210px`, light surface, `z-index: 1000`, `2px 2px 5px rgba(0,0,0,0.2)` shadow; items highlight with `--veritas-green` + white text; `.hidden` force-hides.
- **Sidebar tree** — folder rows (muted, 600) and file rows (main text, indented `28px`, hover surface); `.active` file uses `--bg-active` + `--veritas-green-hover`.
- **Editor** (`.text-canvas`) — dashed `--border-color` outline, transparent background, solid `--veritas-green` on focus.
- **Line numbers** (`.line-numbers`) — monospace, right-aligned, muted, `border-right` separator, `user-select: none`, toggled via `.hidden`.
- **Asset viewer** (`.asset-viewer`) — centred `<img>`, `object-fit: contain`, inert (`pointer-events: none`, `user-select: none`, `-webkit-user-drag: none`).
- **Document viewer** (`.doc-viewer`) — column flex with a full-bleed `<iframe>` on `#fff`; `.doc-fallback` link for non-previewable formats.
- **Viewer badge** (`.viewer-badge`) — pill in the top-right, uppercase `11px`, `letter-spacing: 0.03em`, `opacity: 0.85`, signalling read-only state.
- **Save flash** — save button background flips to `#28a745` for 600 ms, then reverts.

### Interaction Conventions

- Hover: text lightens (`--text-muted` → `--text-main`) and/or gains `--bg-hover`.
- Focus: `--veritas-green` border on the editable canvas.
- Selection: `::selection` = white on `--veritas-green`.
- Motion: short, subtle — `0.1s ease` for transforms, `0.2s ease` for the sidebar width.
- `.hidden` is the universal visibility switch (`display: none !important`).

# TEMPORARY 



How the sidebar is built
Markup — templates/index.html lines 120–134:

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
Everything is static HTML; the tree is filled in by JS via renderNativeTreeUI().

How it moves — the animation is two independent transitions
The collapse is a width transition, not a translate or display toggle.

css

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
...1 lines truncated. Use the buttons above to view or insert the full code.

So when the class flips, three things happen at once:

The rail animates 240px → 48px over 0.2s, easing.
The contents vanish instantly, not animated — display: none is not an animatable property, so the title, action buttons and tree disappear on frame one while the rail is still wide. That's why the text doesn't compress or fade; it's gone before the width finishes closing.
The workspace slides left to fill the freed space. Because .app-body is display: flex and .sidebar has flex-shrink: 0, the main.workspace (flex: 1) absorbs all remaining width automatically. There is no JS driving the workspace at all — no width calculation, no transform. It's purely a flexbox reflow reacting to the rail's width.
What remains at 48px: the sidebar's padding: 0 12px inside .sidebar-header, plus the 20px SVG with flex-shrink: 0. The 48px is hand-tuned so the logo still fits with breathing room.

The event listeners
Exactly two, both plain click handlers in static/js/main.js lines 565–571:

javascript

// --- Sidebar Mechanics ---
if (notesToggleBtn) {
  notesToggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
}
if (logoBtn) {
  logoBtn.addEventListener('click', () => sidebar.classList.remove('collapsed'));
}
#notesToggleBtn (the "Notes" text) → classList.toggle('collapsed'). This is the only thing that closes the sidebar, and the only bidirectional control.
#logoBtn (the green chevron) → classList.remove('collapsed'). Expand only — clicking it when already open does nothing. That's deliberate: the logo stays visible when collapsed, so it serves as the "reopen" affordance.
Both are guarded with if (el), so a missing element degrades to a no-op rather than a null crash.

Notably absent: there is no transitionend listener, no state variable tracking open/closed (the class is the state), no resize handler, and no keyboard shortcut. The sidebar's entire state lives in one CSS class on one element.

Extra listeners that touch the sidebar indirectly
These aren't on the sidebar element itself but do affect it:

.action-btn buttons (found by scanning text for ➕ / 📁 — a fragility worth noting): the ➕ opens createNewFilePrompt(), the 📁 calls fetch('/create-folder'). Both are wired at lines 1014–1041.
Document-level click → closeAllDropdowns(). Unrelated to the sidebar's width, but it's the same click-dispatch flow.
#logoBtn is inside .sidebar-header, which is not hidden when collapsed — that's why the expand affordance survives.
Honest caveats
The action buttons are matched by emoji, not by ID or class:
javascript

if (btn.textContent.includes('➕') || btn.textContent.includes('+')) actionNewFile = btn;
if (btn.textContent.includes('📁')) actionNewFolder = btn;
If the emoji is ever swapped or a font fails to render it, the buttons silently stop working. An id or data-action would be sturdier. 2. The collapse animation is asymmetric — the rail's width eases while its contents snap. It reads fine at 200ms, but it is not a "contents collapse" animation. If you ever lengthen the duration, the mismatch will become visible. 3. display: none !important on the tree means the tree's scroll position is lost on collapse in some browsers, since the element is removed from layout. On expand, renderNativeTreeUI isn't re-run — the DOM is preserved, so it usually restores, but this is a browser-dependent detail I did not test.

I read all of this from the source; I did not run the app for this question since you asked for a description rather than a change. If you'd like, I can drive it in a browser and capture the actual frame-by-frame width values during the 200ms transition to confirm the flex reflow behaves as described.