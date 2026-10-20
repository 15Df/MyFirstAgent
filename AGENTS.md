# AGENTS.md

## Permissions (set in `opencode.json`)
- `external_directory: deny` — never attempt to read or list paths outside this directory (parent, siblings, absolute paths).
- `bash: {"*": "ask"}` — every shell command prompts for approval. Prefer Read/Glob/Grep over Bash, and avoid shell commands that are not strictly necessary.

## Requesting permission
Every Bash call is gated, so before invoking one, write a short request in the conversation with all four parts:
1. **Command** — the exact command and working directory.
2. **Why** — what it verifies or produces, and why Read/Glob/Grep/Edit cannot do it.
3. **Risk** — read-only vs. writes/deletes, and the exact paths affected.
4. **Rollback** — the concrete undo (restore saved original content, remove created paths, or `git checkout -- <path>` only after confirming the file is tracked and the tree is otherwise clean), or "Not needed — read-only".

For write-capable commands, capture the original content/paths first so the stated rollback is actually possible. Never promise a rollback that depends on unavailable tooling or unverified git state. Apply the same reason/rollback note to destructive file operations (delete/overwrite), even though they do not trigger a prompt.

## What this directory is
- Static calculator site in vanilla HTML/CSS/JS: `index.html`, `styles.css`, `script.js`. No build step, package manager, dependencies, tests, lint, or CI.
- Run by opening `index.html` in a browser (or `python3 -m http.server`); there is no JS runtime installed for automated checks.
- Any referenced project (e.g. an `E2E/` Python repo) lives outside this directory and cannot be inspected from here.

## Working here
- Do not infer or invent project structure, commands, or dependencies; verify only against files present in this directory.
- Editing this directory normally means updating the site files, `opencode.json`, or this file.
