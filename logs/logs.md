# LOGS

## INSTRUCTIONS - 

Log the changes for [Version] using our markdown format. Keep each - bullet point strictly under 15 words—focus only on the final code state, not your debugging trial-and-error. Ensure you update the evergreen architecture and style context files if these changes alter core logic.


## Format -

1. "### text" -> Day and Version - Date

2. "- text" -> changes noted in the smallest possible way without losing detail

3. "> text" -> file tampered with - D/W/A/C(delete,lines rewritten,append at last,changed directory or file location), multiple values seperates by comma

## NOTE - 

DO NOT log changes in this file, .gitignore, env, LICENSE, requirements.txt, *.md files and standard_tests, or any documentation files. 

### C1 - 22-09-2026

- Save As now writes to chosen path, then removes original.
- Editor state now uses single source of truth.
- Opening files now clears previous buffer completely.
- Save-file route now handles rename cleanup safely.
- Delete-file route now removes backend originals safely.
- File picker branch now removes previous handle or backend file.

> static/js/main.js - W
> app/app.py - W,A

### C2 - 23-09-2026

- File creation routes now exist for files and folders.
- Ctrl+N now creates files in active target directory.
- Ctrl+Shift+N now creates folders in active target directory.
- Creation targets now resolve from active file, folder, or fallback.
- Names and extensions are validated before writing.
- File menu includes new-folder action.

> static/js/main.js - W,A
> app/app.py - W,A
> templates/index.html - W,A

### C3 - 28-09-2026

- Sidebar now behaves like a compact VS Code explorer.
- File and folder rows include custom SVG type icons.
- UI hover states are more precise and editor-like.
- Sidebar collapse and active states feel more desktop-native.
- Context docs now capture reusable logic and architecture.
- Visual stylesheet now documents the app’s design constraints clearly.

> static/css/style.css - W
> static/js/main.js - W
> static/icons/folder.svg - A
> static/icons/file-generic.svg - A
> static/icons/file-js.svg - A
> static/icons/file-ts.svg - A
> static/icons/file-python.svg - A
> static/icons/file-json.svg - A
> static/icons/file-html.svg - A
> static/icons/file-css.svg - A
> static/icons/file-markdown.svg - A
> static/icons/file-yaml.svg - A
> static/icons/file-text.svg - A
> static/icons/file-xml.svg - A
> context/common-logic.md - A
> context/core-architecture.md - A
> context/stylesheet.md - W