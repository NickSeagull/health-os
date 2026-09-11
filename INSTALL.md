# Installation

> ⚠️ **Not a medical device. Not medical advice. Non-commercial project.**
> Provided “as is,” without warranties. Use at your own risk.
> All demo data is fictional. Full terms are in [DISCLAIMER.md](DISCLAIMER.md) (in the repository root).
> 🚨 In an emergency, call emergency services.

Step-by-step Health-OS installation. It takes about twenty minutes; roughly half of that is optional integrations that can be postponed.

The system is arranged so that each step adds a capability without being required for the previous steps. The system works without the dashboard. It works without MCP integrations. It also works without session hooks — only automatic recovery of interrupted sessions is lost.

---

## Quick path

If you already know what you are doing:

```bash
git clone <repository> health-os
cd health-os
./setup.sh
```

Then open the directory in Claude Code and run `/onboarding`.

Everything else in this document covers details, checks, and what to do when something fails.

---

## Block 1. Requirements

> **Operating system: macOS or Linux.** Installation, session hooks, and sample checks are written in bash and use POSIX utilities. On Windows, the project works **through WSL2** — install it and run all commands inside the Linux environment. Native Windows is not supported.

| What | Why | Minimum | How to check |
|-----|-----|---------|--------------|
| [Claude Code](https://claude.com/claude-code) | System engine: skills, agents, file operations | current version | `claude --version` |
| `git` | Local data version control | 2.x | `git --version` |
| `jq` | Parse JSON in session hooks | 1.6+ | `jq --version` |
| `python3` | Data-integrity checks | **3.10+** | `python3 --version` |
| Node.js + npm | Dashboard only | 20+ | `node -v && npm -v` |

All at once:

```bash
claude --version; git --version; jq --version; python3 --version; node -v
```

`setup.sh` treats `python3`, `jq`, and `git` as mandatory — it stops if any is missing. Node is checked softly: if it is absent or below version 20, the script warns and continues because the system works without the dashboard.

### Installing missing components

```bash
# macOS
brew install jq python3 node

# Debian / Ubuntu
sudo apt install jq python3 nodejs npm

# Fedora
sudo dnf install jq python3 nodejs
```

If the distribution repositories contain an old Node version, install it through [nvm](https://github.com/nvm-sh/nvm), or the dashboard will not build.

---

## Block 2. Cloning

```bash
git clone <repository> health-os
cd health-os
```

**The directory name matters.** The session-save hook runs only when the working-directory path contains the substring `health-os` — this keeps it from writing breadcrumbs while working on other projects. If you use another directory name, everything works except interrupted-session recovery. Block 9 explains how to change this.

---

## Block 3. Running `setup.sh`

```bash
./setup.sh
```

The script is idempotent: it never overwrites existing files. Running it again is safe and useful — it also serves as an installation-state check.

What happens:

1. **Environment check.** `python3`, `jq`, and `git` are mandatory; if any is missing, the script stops with a non-zero exit code. Node is checked for version 20+ and a mismatch produces a warning.
2. **Deploy data files.** Every `*.example.json`, `*.example.csv`, and `*.example.jsonl` template in `Data/` is copied to a file without the `example` suffix. Existing files are skipped with the note “already exists, leaving it alone.” The end reports counts of “created / existing preserved.”
3. **MCP configuration.** `.mcp.json.example` is copied to `.mcp.json` with permission `600`. The template contains placeholders, not keys — enter your own values manually.
4. **Restrict permissions.** `chmod -R go-rwx Data` makes the data directory accessible only to its owner. `.mcp.json` is set to `600`. Hooks receive the executable bit.
5. **Repository isolation.** If `.git` is absent, `git init` runs. The script then checks that the repository has no remote and reports an explanatory error if one exists. It creates a test file in `Data/`, and `git check-ignore` confirms that `.gitignore` actually covers the data directory. The test file is removed.

### Demo mode

```bash
./setup.sh --demo
```

The same process, but `*.demo.*` templates are deployed — data for a fictional patient. This is useful for exploring the system before entering your own data.

When you are done, clear the data directory using the command in “Switching from demo to your own data” and run `./setup.sh` without the flag. The script will not overwrite demo data by itself: it cannot tell where an existing file came from.

---

## Block 4. Session hooks

Hooks restore context between sessions: when a response ends, a breadcrumb is saved; when a new session starts, the system notices unfinished sessions and stale context.

The scripts live in `.claude/hooks/`, but Claude Code learns about them only from project settings. Check whether `.claude/settings.json` exists:

```bash
cat .claude/settings.json
```

If it does not exist, create it:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": ".claude/hooks/session-save.sh", "timeout": 5000 }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": ".claude/hooks/session-restore.sh", "timeout": 5000 }
        ]
      }
    ]
  }
}
```

Restart Claude Code — hook settings are read at startup.

This step is optional. Without it, only automatic detection of interrupted sessions is lost; `/day`, `/wrap-up`, and `/recover-sessions` still work without hooks, manually.

---

## Block 5. First launch

Open the directory in Claude Code and run:

```
/onboarding
```

The skill conducts a discovery interview and fills `Data/profile.json` and `Data/context/environment.json`. Leave anything you do not know blank — missing values go into `_needs_input` and surface later. Invented values are worse than blanks: the system will build conclusions on them.

The detailed first-days path is in [docs/ONBOARDING.md](docs/ONBOARDING.md).

---

## Block 6. Dashboard

The dashboard is optional. It shows marker trends, medication cards, the dental chart, and progress toward goals — the same information skills provide as text, but easier to inspect visually.

```bash
cd Dashboard
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

**Loopback only.** The `dev` and `start` scripts in `Dashboard/package.json` run with `-H 127.0.0.1`. This is a security boundary: the dashboard has no authentication, and binding to an external interface immediately exposes the entire medical profile to every device on the same network. Do not change `-H` without reading [docs/SECURITY.md](docs/SECURITY.md).

For a production build if the dev server seems slow:

```bash
npm run build
npm run start
```

`start` is also bound to `127.0.0.1`.

---

## Block 6a. Dashboard environment variables

Two dashboard sections — “Tasks” and “WHOOP” — call external services. Without keys they return `502` with an explanation; the other eleven sections work without any configuration.

```bash
cd Dashboard
cp .env.example .env.local
chmod 600 .env.local
```

Open `.env.local` and fill in what you need:

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `TODOIST_API_TOKEN` | “Tasks” section | Todoist → Settings → Integrations → Developer |
| `TODOIST_PROJECT_ID` | Project to display | Visible in the project URL in the web version |
| `WHOOP_EMAIL`, `WHOOP_PASSWORD` | “WHOOP” section | Account credentials |
| `HEALTH_OS_WHOOP_DIR` | WHOOP cache directory | Defaults to `Cache/whoop` |

> **About the WHOOP password.** It is stored in the file as plain text. This is acceptable on your own machine with permission `600`, but if you do not want that, leave the fields blank and use the WHOOP MCP server (Block 7). The dashboard section will remain empty; everything else will work.

`.env.local` is excluded from git.

---

## Block 6b. Switching from demo to your own data

Demo and working data **must not be mixed**. If you deploy demo over existing files or vice versa, the indexes will diverge from the directory contents and the integrity check will start failing.

The correct order is to clear `Data/` completely first:

```bash
find Data -type f ! -name '.gitkeep' ! -name 'README.md' \
  ! -name '_marker-aliases.json' ! -path '*specialists*' \
  ! -name '*.example.*' ! -name '*.demo.*' ! -name '*.reference.*' -delete

./setup.sh
```

The command removes everything deployed, including `.md` visit protocols, and preserves templates, the marker reference, and the specialty map.

Check that the state is consistent:

```bash
python3 .claude/scripts/check-integrity.py
```

---

## Block 6c. Updating an installation made before profiles existed

Previously all data lived directly in `Data/`. It is now distributed across profiles: `Data/profiles/<id>/`. A separate script performs the migration.

First inspect what will be migrated — by default the script changes nothing:

```bash
./.claude/scripts/migrate-to-profiles.sh
```

Make a backup. **The migration cannot be undone:**

```bash
cp -R Data Data.backup-$(date +%Y%m%d)
```

Run it:

```bash
./.claude/scripts/migrate-to-profiles.sh --apply
```

The script moves data into the `owner` profile, creates the active-profile pointer, and runs the integrity check. System-wide registries — `Data/labs/_marker-aliases.json`, `Data/specialists/` — and the shared wiki remain in place because they are common to everyone.

To add a family member after migration, use `/profiles create` in Claude Code.

---

## Block 7. MCP integrations

All three integrations are optional and independent. The system is fully usable without any of them — they add data and automation but their absence breaks nothing.

Configuration lives in `.mcp.json`. The file is excluded from git and must have permission `600`:

```bash
chmod 600 .mcp.json
```

All three servers are **disabled** in the template: their names begin with an underscore (`_whoop`, `_todoist`, `_google-calendar`). To enable an integration, remove the underscore from the key name and restart Claude Code.

### WHOOP — sleep, recovery, and strain metrics

This gives agents objective sleep and recovery data — information that otherwise has to be recalled from subjective impressions.

The WHOOP MCP server is not included. Install it separately and put the absolute path to its entry point in `args`.

```json
"whoop": {
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/whoop-mcp/index.ts"],
  "env": {}
}
```

Store credentials in the server’s own configuration (usually an `.env` beside it, permission `600`) rather than in `.mcp.json`, so the secret is not spread across two files.

### Todoist — health tasks

Follow-up visits, lab follow-ups, and milestone deadlines. Get the token in Todoist: Settings → Integrations → Developer.

```json
"todoist": {
  "command": "npx",
  "args": ["-y", "@doist/todoist-mcp"],
  "env": { "TODOIST_API_KEY": "<your token>" }
}
```

Remember that task names are sent to Todoist servers. “Make an endocrinology appointment” is medical information. If that is unacceptable, leave the integration disabled.

### Google Calendar — visits and revaccinations

```json
"google-calendar": {
  "command": "npx",
  "args": ["-y", "@cocal/google-calendar-mcp"],
  "env": {}
}
```

The first launch opens a browser for OAuth authorization. No keys need to be entered.

### Check

In Claude Code:

```
/mcp
```

The command shows connected servers and their status. Project MCP servers require explicit confirmation on first launch — if a server does not appear, check whether you declined the request.

---

## Block 8. Checking the installation

None of the checks below changes anything.

### Files and isolation

```bash
./setup.sh
```

Expected: all data files are marked “already exists”; the final count is `created: 0`.

```bash
git check-ignore -v Data/profile.json
```

Expected: a line like `.gitignore:13:Data/**	Data/profile.json` — the line number may differ; the important part is that a rule is found. If the command prints nothing and returns code 1, the safeguard is not working; **do not enter data** until you understand why.

```bash
git remote -v
```

Expected: empty output. Any remote is a reason to stop and determine where it came from.

```bash
git status --porcelain | grep -E '^\?\? (Data|Archive|Cache|Inbox)/' | head
```

Expected: empty output; working directories must not even appear as untracked.

### System composition

```bash
ls .claude/agents/*.md | wc -l      # 13
ls -d .claude/skills/*/ | wc -l     # 21
ls .claude/shared/*.md | wc -l      # 7
```

```bash
bash -n .claude/hooks/*.sh && echo "hook syntax is OK"
```

### Hooks

Dry run, without Claude Code:

```bash
printf '{"session_id":"install-check","cwd":"%s","transcript_path":""}' "$PWD" \
  | .claude/hooks/session-save.sh
ls .claude/hooks/pending-sessions/
```

Expected: `install-check.json`. Remove it after the check:

```bash
rm .claude/hooks/pending-sessions/install-check.json
```

If the file does not appear, the directory name is almost always the cause: the hook exits silently when the path has no `health-os` substring. See Block 9.

### Dashboard

With `npm run dev` running:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/api/profile
```

Expected: `200`.

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Expected address: `127.0.0.1:3000`. If you see `*:3000`, the server is listening on all interfaces; fix it before using the machine on another network.

Regression check for escaping the data directory:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  'http://127.0.0.1:3000/api/labs/..%2F..%2F..%2F.mcp.json'
```

Expected: a code other than `200` (`404` or `400`) and no file contents in the response body. `200` with contents means `resolveWithin` protection is not working — see [docs/SECURITY.md](docs/SECURITY.md).

---

## Block 9. If something goes wrong

### `setup.sh` stops at the environment check

```
  ✗ jq — required for session hooks
  ✗ Required dependencies are missing.
```

The script identifies what is missing. Install it (Block 1) and run again. It is idempotent; a second run will not break anything.

### `node: command not found` or version below 20

```
  ! node v18.19.0 — dashboard requires 20+
```

This is a warning, not an error: installation continues and the system works; only the dashboard will fail to build. Update through nvm:

```bash
nvm install 22
nvm use 22
node -v
```

If `npm install` fails on native modules after changing versions, remove `Dashboard/node_modules` but do not touch `Dashboard/package-lock.json` — reinstall from scratch:

```bash
rm -rf Dashboard/node_modules
cd Dashboard && npm install
```

### `setup.sh` complains about a remote

```
  ✗ The repository has a remote: origin  git@github.com:...
```

Health-OS is designed to work without a remote: there is nowhere to push by design, and this is the main barrier against accidental publication of medical data. Remove it:

```bash
git remote remove origin
```

If you deliberately need a remote — for example, to receive project updates — see Block 10.

### Port 3000 is occupied

```
Error: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

Find the process:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Run on another port:

```bash
npm run dev -- -p 3001
```

The `-H 127.0.0.1` flag remains in effect because it is part of the `dev` script.

### Hooks do not run

Check in order, stopping at the first mismatch:

1. **Are hooks registered?** `cat .claude/settings.json` — it must contain `Stop` and `SessionStart` sections (Block 4). Without this, the scripts merely sit on disk.
2. **Was Claude Code restarted** after changing settings?
3. **Is the executable bit set?** `ls -l .claude/hooks/*.sh` should show `-rwxr-xr-x`. Fix with `chmod +x .claude/hooks/*.sh`.
4. **Is `jq` installed?** Both scripts parse their payload with it and exit silently without it.
5. **Does the path contain `health-os`?** This is the most common cause. `session-save.sh` checks:

   ```bash
   if [[ -z "$CWD" || "$CWD" != *"health-os"* ]]; then exit 0; fi
   ```

   Rename the project directory or adjust this line to your name.

6. **Linux.** The project was written on macOS, and the hooks use BSD syntax: `stat -f%m` in `session-restore.sh` and `date -r` in `session-save.sh`. Linux needs `stat -c%Y` and `date -d @<epoch>`. Without this change the hooks do not crash, but the context-freshness check always fires and the session start time remains empty.

### Dashboard does not see data

Sections are empty and charts are missing even though files exist in `Data/`.

1. **Run from `Dashboard/`.** Data paths are built from the process working directory: `DATA_ROOT` in `Dashboard/lib/data/paths.ts` is `process.cwd()/../Data`. Running from the project root points the dashboard one directory too high.
2. **Check that files were created rather than left as templates.** `ls Data/*.json` — if you see only `*.example.json`, `setup.sh` did not complete.
3. **Check that JSON is valid.** One broken file empties the corresponding section, not the whole dashboard:

   ```bash
   for f in Data/*.json Data/*/*.json; do jq -e . "$f" >/dev/null || echo "broken: $f"; done
   ```

4. **WHOOP section is empty.** The metrics-cache path is set in `Dashboard/lib/data/paths.ts` by `WHOOP_ROOT` and points by default to an external directory you probably do not have. Other sections are unaffected. Adjust the constant to your cache location or ignore the section.

### `Cache/alerts` and `Archive/processed` are missing after cloning

This follows from the `.gitignore` design: `Cache/*` and `Archive/*` ignore nested directories completely, and `.gitkeep` inside them is not included in the repository. Git cannot unignore a file inside an ignored directory.

Create them manually:

```bash
mkdir -p Cache/alerts Cache/sessions Archive/processed
```

Skills and the dashboard create missing directories when writing, so this is mainly an ordering issue rather than a functionality issue.

### Permissions prevent operation

`setup.sh` runs `chmod -R go-rwx Data` — only the owner can read the data directory. If you work as another user or run the dashboard under another account, access will fail. This is intentional; access can be restored, but consider whether a second user truly needs access to the medical record.

---

## Block 10. Updating to a new project version

Your data and the project code are physically separate, so an update replaces code without touching data.

| Updated | Never touched |
|---------|---------------|
| `.claude/agents/`, `.claude/skills/`, `.claude/shared/`, `.claude/rules/`, `.claude/hooks/` | `Data/` |
| `Dashboard/` — except `node_modules/` and `.next/` | `Cache/`, `Archive/`, `Inbox/`, `Goals/` |
| `setup.sh`, `.gitignore`, `README.md`, `docs/`, `CLAUDE.md` | `.mcp.json`, `.claude/settings.json` |

### Method one — copying (recommended)

This does not require a remote and therefore does not create accidental-push risk.

```bash
# 1. Fresh version in a separate directory
git clone <repository> /tmp/health-os-new

# 2. Back up data before everything else
tar czf ~/health-os-backup-$(date +%F).tar.gz Data Cache Archive Goals .mcp.json

# 3. Replace code
cd ~/health-os
rsync -a --delete /tmp/health-os-new/.claude/agents/  .claude/agents/
rsync -a --delete /tmp/health-os-new/.claude/skills/  .claude/skills/
rsync -a --delete /tmp/health-os-new/.claude/shared/  .claude/shared/
rsync -a --delete /tmp/health-os-new/.claude/rules/   .claude/rules/
rsync -a --delete --exclude 'pending-sessions/' \
      /tmp/health-os-new/.claude/hooks/   .claude/hooks/
rsync -a --delete /tmp/health-os-new/docs/            docs/
rsync -a --exclude 'node_modules/' --exclude '.next/' \
      /tmp/health-os-new/Dashboard/       Dashboard/
cp /tmp/health-os-new/{setup.sh,.gitignore,README.md,INSTALL.md,CLAUDE.md} .

# 4. Bring it to a working state
./setup.sh
cd Dashboard && npm install
```

`--delete` in the `.claude/` commands is intentional: if a skill or agent was removed in the new version, the old file must go too, otherwise the system will reference something no longer documented.

At step 4, `setup.sh` installs new data templates if the update introduced new entities and leaves existing files alone.

### Method two — upstream without push permission

For those more comfortable with git. This gives a proper update `git log` but requires discipline.

```bash
git remote add upstream <repository>
git remote set-url --push upstream DISABLED   # push becomes technically impossible
git fetch upstream
git merge upstream/main
```

Check that the safeguard is present:

```bash
git push upstream          # should fail with an error about DISABLED
```

On the next run, `setup.sh` will report a remote as an error — that is expected in this configuration. Confirm that push is really disabled and that your local repository does not version anything from `Data/`, `Cache/`, or `Archive/`:

```bash
git ls-files | grep -E '^(Data|Cache|Archive|Inbox)/'
```

The output should contain only `*.example.*`, `*.demo.*`, `README.md`, and system registries.

### After any update

1. `./setup.sh` — install new templates and check isolation.
2. Read changes in `.claude/shared/data-schemas.md`: if the schema changed, old data files remain valid, but new records will use the new schema.
3. Check data invariants — the commands at the end of `data-schemas.md`, in “Invariants.”

---

## Block 11. Removal

Health-OS installs nothing outside its directory. To remove the system, delete the directory — but first decide what to do with the data.

```bash
# Save data separately
tar czf ~/health-data-$(date +%F).tar.gz Data Archive Goals

# Remove the project
cd .. && rm -rf health-os
```

Check separately:

- `.claude/settings.json` — if you added hooks, its entries point to deleted scripts;
- global MCP configuration, if you copied servers from `.mcp.json` into user settings;
- service tokens granted to integrations — revoke them if you no longer use them.

---

⚕️ The system does not diagnose and does not replace a physician. If there are signs of an emergency, call emergency services.
