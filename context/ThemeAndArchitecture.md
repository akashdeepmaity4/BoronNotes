# WHAT IS THIS FILE

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

### PowerShell / Shell Launch

- `Ctrl + \`` launches a terminal at the current storage root (`STORAGE_PATH`).
- Shell resolution is a three-step fallback, first match wins:
  1. `bash` resolved through `PATH` → launched `--login`
  2. **Git Bash** at default install roots (`%ProgramFiles%`, `%ProgramFiles(x86)%`, `%LOCALAPPDATA%\Programs`) under `Git\bin\bash.exe` or `Git\usr\bin\bash.exe` → launched `--login -i`
  3. `cmd.exe` from `%ComSpec%` → launched with `/K cd /d "<storage root>"`
- The terminal is spawned detached via `CREATE_NEW_CONSOLE` (Windows) so an interactive shell gets its own stdin.
- Endpoint `POST /open-terminal` returns `{ status, message, shell, path }`; on failure `status` is `error` with a human-readable `message`. The front-end alerts on any non-`success` status.
- No terminal available (no bash, no Git Bash, no cmd) → HTTP 500 with an explanatory message.
