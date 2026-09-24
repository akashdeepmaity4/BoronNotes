# BORON NOTES

![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-3.0.0-brightgreen)
![ParentProduct](https://img.shields.io/badge/aBoronCodeProduct-darkblue)

Boron Notes is a stripped-down version of Boron Code. It is an ultra-lightweight standard text editor which allows the user to create and edit any text-based file. It is fully local, keeping your files 100% safe inside your own local storage. Boron Notes is also a Markdown note-taking application made to be a lite alternative to Obsidian.

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=blue)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) 

## FEATURES

1. Native dark mode and Industry-standard IDE inspired look.
1. Minimal, snappy, reliable. Easy to get into even as a beginner.
1. Fully locally ran. Your notes stay ON YOUR DEVICE

## HIGHLIGHTS

1. It is completely local, meaning you can access your files at any time
1. It is very lightweight, suitable for mobile devices or low-end computers.
1. Can be locally run on all major OSs, but .exe application can ONLY be run on windows.


## SHORTCUTS


| Shortcut | Action | Implementation |
| --- | --- | --- |
| `Ctrl + N` | New file in root/target directory | Triggers sidebar buttons or fallback prompt |
| `Ctrl + Shift + N` | Fresh window ("No file open") | Resets active file state and clears editor canvas |
| `Ctrl + `` | Open default Bash or CMD terminal | Calls `POST /open-terminal` |
| `Ctrl + S` | Save active file | Calls `POST /save-file` |
| `Ctrl + Z` | Undo inside editor | Executes `document.execCommand('undo')` |
| `Ctrl + Y` | Redo inside editor | Executes `document.execCommand('redo')` |
| `Ctrl + X` | Cut selected text | Executes `document.execCommand('cut')` |
| `Ctrl + C` | Copy selected text | Executes `document.execCommand('copy')` |
| `Ctrl + V` | Paste copied text | Standard native canvas paste |
| `Ctrl + K` -> `Ctrl + O` | Open directory picker | Triggers folder input picker |
| `Ctrl + O` | Open single file picker | Triggers file input picker |

## How to Use

1. Download the codebase to a directory named 'BoronNotes'. This will act as the root directory.
1. Open 'remakeexecutable.sh' and change line 2 to the location of BoronNotes root directory. 
1. Run 'remakeexecutable.sh' via Bash to make a safe application.

### OR

1. Download the codebase to a directory named 'BoronNotes'. This will act as the root directory.
1. Run 'launcher.py' via python in Command Prompt/ Bourne Again Shell (Bash).
1. This opens a native webapp.

### OR

1. Download the codebase to a directory named 'BoronNotes'. This will act as the root directory.
1. Run 'app/app.py' via python.
1. Navigate to http://localhost:5000 in your browser.



## Dependencies

- Python 3.x (3.14 recommended)
- Bash (To automate the application making process. Highly recommended)
- Flask (Non-Negotiable to run the app)
- Pyinstaller (If you want .exe application)
- Pywebview (If you want to run the Webapp natively)



### Install Dependencies

```bash
pip install -r requirements.txt
```
