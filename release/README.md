# TaskLedger (Release Package)

This folder contains **end-user** instructions and startup scripts intended to be shipped with GitHub Releases.

> Repo root `README.md` is for development.  
> This `release/README.md` is for users who just downloaded the release zip.

## What you download

The release zip should contain (at minimum):

- `dist/` (built web files)
- `tools/serve-dist.mjs` (local static server)
- `release/` (this folder: scripts + instructions)

## Prerequisite (Windows/macOS)

Install **Node.js 16+** (LTS recommended).  
After installation, verify in Terminal / PowerShell:

```bash
node -v
```

## Start (Windows)

1. Unzip the release zip to a folder (avoid paths with special permissions).
2. Double-click:
   - `release/windows/start-taskledger.bat`
3. Open your browser:
   - `http://127.0.0.1:4173`

### Enable auto-start on login (Windows)

Double-click (or right-click → Run with PowerShell):

- `release/windows/install-autostart.ps1`

To uninstall:

- `release/windows/uninstall-autostart.ps1`

> If PowerShell blocks scripts, run this once (current user) and try again:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

## Start (macOS)

1. Unzip the release zip.
2. Right-click and open (first time) or run in Terminal:

```bash
chmod +x release/macos/*.command
./release/macos/start-taskledger.command
```

3. Open your browser:
   - `http://127.0.0.1:4173`

### Enable auto-start on login (macOS)

Run:

```bash
chmod +x release/macos/*.command
./release/macos/install-autostart.command
```

To uninstall:

```bash
./release/macos/uninstall-autostart.command
```

## Change port / host

Default: `127.0.0.1:4173`

You can change by setting environment variables before starting:

- `HOST` (default `127.0.0.1`)
- `PORT` (default `4173`)
- `DIST_DIR` (optional, if `dist/` is not in the expected location)

## Troubleshooting

- If `node` is not found, install Node.js and reopen Terminal/PowerShell.
- If port `4173` is in use, set `PORT` to another value.
- If the page is blank, make sure the release zip includes the `dist/` folder (built output).

