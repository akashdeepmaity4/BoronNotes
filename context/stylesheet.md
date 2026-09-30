# Visual Stylesheet

This document is the design specification for the app shell and its interface behavior. It is the source of truth for the visual language and the UI implementation constraints.

## 1. Hard rules

These instructions must be followed exactly when creating or adjusting the interface:

- Do not change the palette or color variables.
- Do not introduce new accent colors.
- Keep the dark-first desktop shell and the light override intact.
- Keep the styling flat, compact, and VS Code-inspired.
- Favor subtle hover states, not loud effects.
- Preserve the current structure: header, sidebar, workspace, and editor.
- Use small motion and short transitions only.
- Keep the UI highly readable and practical rather than decorative.

---

## 2. Design intent

The interface should feel like a lightweight, desktop coding environment:

- compact and efficient
- familiar to developers
- minimal but polished
- structurally clear
- calm and flat
- tuned for productivity, not visual drama

The visual tone is practical, modern, and restrained. It should resemble a desktop IDE shell rather than a web app dashboard.

---

## 3. Theme system

### Dark default

```css
:root {
  --bg-dark: #181818;
  --bg-sidebar: #191919;
  --bg-hover: #2a2d2e;
  --bg-active: #37373d;
  --Boron-accent: #e3a004;
  --Boron-accent-light: #f9d88c;
  --Boron-accent-hover: #ffcf6e;
  --text-main: #cccccc;
  --text-muted: #858585;
  --border-color: #2b2b2b;
}
```

### Light override

```css
.root-light {
  --bg-dark: #ffffff;
  --bg-sidebar: #f3f3f3;
  --bg-hover: #e8e8e8;
  --bg-active: #d6d6d6;
  --text-main: #222222;
  --text-muted: #666666;
  --border-color: #cccccc;
  color-scheme: light;
}
```

### Dark variant

```css
.root-dark {
  --bg-primary: #383838;
  --bg-secondary: #252526;
  --bg-active: #37373d;
  --text-main: #d4d4d4;
  --text-muted: #858585;
  --border-color: #333333;
  color-scheme: dark;
}
```

### Required color behavior

- Keep every visual change within these values.
- Do not replace the accent with a different hue.
- Do not introduce gradients, vivid highlights, or saturated UI surfaces.
- Use accent color only for app emphasis, selection, and brand-level moments.

---

## 4. Typography

Use a clean system font stack:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

### Scale

- header text: 12px
- menu and explorer rows: 13px
- sidebar title: 15–16px
- active file title: 18px
- tool icons: around 20px

### Weights

- default: 400
- selected labels: 500
- folder rows and titles: 600–700

### Line-height

- keep compact UI and code-adjacent spacing
- editor and text-friendly surfaces should keep comfortable reading rhythm without being airy or decorative

---

## 5. Layout system

### Shell structure

The app should remain a simple desktop two-pane layout:

- header bar at the top
- sidebar on the left
- main workspace area on the right

```css
body {
  background-color: var(--bg-dark);
  color: var(--text-main);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
```

### Header

- height: 30px
- low-contrast chrome
- bottom border using `--border-color`
- compact gap spacing

### Sidebar

- width: 240px expanded
- width: 48px collapsed
- flat border-right separators
- compact row heights and tight alignment

### Workspace

- fills remaining space
- neutral background
- no decorative framing or heavy panels

---

## 6. Component styling

## 6.1 Header and menu items

Menu headers and controls should be flat and minimal.

```css
.app-header {
  height: 30px;
  background-color: var(--bg-dark);
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  gap: 15px;
}

.menu-item {
  cursor: pointer;
  color: #cbcbcb;
  background: none;
  border: none;
  padding: 2px 6px;
}

.menu-item:hover {
  color: var(--text-main);
  background-color: var(--bg-hover);
  border-radius: 4px;
}
```

### Rule

- Header controls should not look like pills or colorful controls.
- The visual language stays quiet and utilitarian.

---

## 6.2 Dropdowns

Dropdowns should behave like compact IDE menus.

```css
.app-dropdown-menu {
  position: absolute;
  background: var(--bg-sidebar);
  border: 1px solid var(--border-color);
  min-width: 210px;
  z-index: 1000;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
}
```

### Requirements

- keep rows compact and readable
- use subtle hover fills
- close on outside click
- do not make dropdowns look like cards or popovers with large shadows

---

## 6.3 Sidebar and explorer

The sidebar is the main visual anchor for the app. It should resemble a file explorer with VS Code cues, but it must remain understated.

```css
.sidebar {
  width: 240px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.18s ease;
  user-select: none;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 48px;
}
```

### Explorer row behavior

- rows should be compact and low-noise
- hover uses subtle `--bg-hover` fill
- selected row uses `--bg-active`
- the active file should have a small accent indicator or highlighted background

```css
.tree-file {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 24px;
  border-radius: 4px;
  color: var(--text-main);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.tree-file.active {
  background-color: var(--bg-active);
  color: var(--Boron-accent-hover);
  font-weight: 500;
}
```

### Folder rows

- use a slightly more muted tone than files
- keep the height compact
- use visual grouping rather than heavy decoration

### Icon treatment

- file icons should be small and icon-like
- folder icons should be distinct but neutral
- no loud color-coding beyond the existing palette

---

## 6.4 Action buttons

Toolbar and sidebar action buttons should be minimal command controls.

```css
.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.action-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-hover);
}
```

### Action button rule

Do not make action buttons look like large UI tiles or call-to-action buttons. They are utility controls.

---

## 6.5 Workspace and editor shell

The editing surface should feel more like a code canvas than a card layout.

```css
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-dark);
  overflow: hidden;
}
```

### Rules

- keep the editor and surrounding shell flat
- avoid heavy shadows or extra framing
- separate panels with thin borders only
- respect a calm desktop visual rhythm

---

## 7. Motion and animation

The interface should feel smooth but not decorative.

### Standard timings

- hover transitions: 0.15s ease
- sidebar collapse: 0.18s ease
- active state transitions: short and subtle
- save success flash: small and temporary

### Motion rules

- no large transforms
- no exaggerated bounce or glide
- no flashy visual effects
- motion should clarify state, not entertain the user

---

## 8. State styling

### Hover

- background `var(--bg-hover)`
- text becomes lighter
- keep contrast crisp without overemphasis

### Selected state

- background `var(--bg-active)`
- text color stays readable and calm
- accent is used sparingly

### Hidden state

```css
.hidden {
  display: none !important;
}
```

---

## 9. Visual summary

This app’s visual identity should be:

- desktop-coded and compact
- quiet and controlled
- practically styled rather than ornate
- built from a single restrained accent system
- comfortably legible in both dark and light modes

The shell should feel like a development environment, not a marketing landing page.

---

## 10. Implementation constraints for future edits

When making UI changes, do not do the following:

- do not replace the palette
- do not add bright secondary accent colors
- do not use heavy shadows or neon glows
- do not make the explorer look like a dashboard or card grid
- do not increase visual noise or make the app more playful
- do not break the compact VS Code-style structure

The visual system is intentionally minimal and practical. Preserve that character in every adjustment.

---

## 11. Reference CSS block

```css
:root {
  --bg-dark: #181818;
  --bg-sidebar: #191919;
  --bg-hover: #2a2d2e;
  --bg-active: #37373d;
  --Boron-accent: #e3a004;
  --Boron-accent-light: #f9d88c;
  --Boron-accent-hover: #ffcf6e;
  --text-main: #cccccc;
  --text-muted: #858585;
  --border-color: #2b2b2b;
}

.root-light {
  --bg-dark: #ffffff;
  --bg-sidebar: #f3f3f3;
  --bg-hover: #e8e8e8;
  --bg-active: #d6d6d6;
  --text-main: #222222;
  --text-muted: #666666;
  --border-color: #cccccc;
  color-scheme: light;
}

body {
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.sidebar {
  width: 240px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
}

.tree-file.active {
  background-color: var(--bg-active);
  color: var(--Boron-accent-hover);
}

.action-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-main);
}
```

This is the design baseline for the current app. It is the visual standard for all future modifications to the shell, sidebar, actions, and explorer behavior.

```css
.sidebar.collapsed {
  width: 48px;
}
```

### Header and actions

- sidebar title uses accent color
- actions are small icon buttons with hover fill
- collapse behavior hides non-essential content cleanly

### File rows

```css
.tree-file {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 24px;
  border-radius: 4px;
  color: var(--text-main);
  transition: background-color 0.15s ease;
}
```

### Active row

```css
.tree-file.active {
  background-color: var(--bg-active);
  color: var(--Boron-accent-hover);
  font-weight: 500;
}
```

### Folder rows

- slightly more muted than files
- compact and clearly grouped
- can expand and collapse with a small visual cue

### Explorer icons

Use SVG icons that are consistent in size and subdued in tone. Do not use heavy color-coded file icons; keep them neutral and crisp.

---

## 6.4 Action buttons

Sidebar actions and toolbar items are compact command controls.

```css
.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.action-btn:hover {
  color: var(--text-main);
  background-color: var(--bg-hover);
}
```

### Behavior

- hover: subtle background+text lightness shift
- no large shadows or heavy glows
- keep the icon crisp and centered

---

## 6.5 Editor and workspace surfaces

The editor area is a clean canvas with a subtle surrounding border or outline.

```css
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-dark);
  overflow: hidden;
}
```

The editor should feel like a code canvas, not a card interface:

- flat background
- minimal border or focus ring
- accent line only when relevant
- line numbers and content separated cleanly

---

## 6.6 Viewer badges and read-only states

Viewer badges appear on asset/document preview panes and should look like understated status pills.

```css
.viewer-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--bg-active);
  color: var(--text-main);
  font-size: 11px;
  letter-spacing: 0.03em;
  opacity: 0.85;
}
```

These should be quiet and semi-utility oriented, not flashy.

---

## 7. States and interaction patterns

### Hover

- text becomes lighter
- background fills with `--bg-hover`
- buttons stay crisp and compact

### Focus

- use accent border or selected highlight
- retain the same subtle, minimal flavor

### Active selection

- selected row uses `--bg-active`
- accent text or accent bar indicates the active item
- avoid over-saturation

### Hidden / disabled

Use `.hidden` as the universal collapse utility:

```css
.hidden {
  display: none !important;
}
```

---

## 8. Animation system

The app uses short, quiet transitions rather than dramatic motion.

### Timing values

- hover: `0.15s ease`
- width collapse/expand: `0.18s ease`
- save flash: short transient effect, around 600ms
- row transitions: fast and almost imperceptible

### Motion examples

```css
transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
```

### Motion rules

- no cartoonish motion
- no large-scale transforms
- no long fades or overshooting animations
- motion should clarify state, not distract from the content

---

## 9. Design tokens summary

| Token | Purpose | Example |
| --- | --- | --- |
| `--bg-dark` | main background | `#181818` |
| `--bg-sidebar` | sidebar background | `#191919` |
| `--bg-hover` | hover surfaces | `#2a2d2e` |
| `--bg-active` | selected state | `#37373d` |
| `--Boron-accent` | accent emphasis | `#e3a004` |
| `--text-main` | primary text | `#cccccc` |
| `--text-muted` | secondary text | `#858585` |
| `--border-color` | separators and outlines | `#2b2b2b` |

---

## 10. Visual checklist

Use this checklist when implementing or revisiting the UI:

- [ ] dark default feels comfortable and low-noise
- [ ] sidebar remains compact and legible
- [ ] accent color is used sparingly
- [ ] rows, buttons, and menus are aligned and consistent
- [ ] active/hover states are subtle but visible
- [ ] motion remains short and restrained
- [ ] all separators use thin, low-contrast borders
- [ ] the explorer reads like a real coding sidebar, not a generic nav
- [ ] light theme preserves the same personality

---

## 11. Reference CSS block

This is the compact design foundation used by the app.

```css
:root {
  --bg-dark: #181818;
  --bg-sidebar: #191919;
  --bg-hover: #2a2d2e;
  --bg-active: #37373d;
  --Boron-accent: #e3a004;
  --Boron-accent-light: #f9d88c;
  --Boron-accent-hover: #ffcf6e;
  --text-main: #cccccc;
  --text-muted: #858585;
  --border-color: #2b2b2b;
}

.root-light {
  --bg-dark: #ffffff;
  --bg-sidebar: #f3f3f3;
  --bg-hover: #e8e8e8;
  --bg-active: #d6d6d6;
  --text-main: #222222;
  --text-muted: #666666;
  --border-color: #cccccc;
  color-scheme: light;
}

body {
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.sidebar {
  width: 240px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
}

.tree-file.active {
  background-color: var(--bg-active);
  color: var(--Boron-accent-hover);
}

.action-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-main);
}
```

This stylesheet is the visual identity baseline for the current app and should be treated as the design standard for the shell, explorer, controls, and desktop-like chrome.
