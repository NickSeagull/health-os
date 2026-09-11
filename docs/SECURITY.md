# Security

> ⚠️ **Not a medical device. Not medical advice. Non-commercial project.**
> Provided “as is,” without warranties. Use at your own risk.
> All demo data is fictional. Full terms are in [DISCLAIMER.md](../DISCLAIMER.md) (in the repository root).
> 🚨 In an emergency, call emergency services.

Threat model, protection design, and operating rules. This document describes both what is protected and what is not — the second matters more for medical data.

The rules below grew out of a security audit of the working system. Four critical dashboard vulnerabilities were practically confirmed: they allowed arbitrary files to be read from disk, including configuration with live API keys, and files to be written outside the project. All have been fixed; the sections below explain which mechanisms fixed them and why.

---

## Block 1. Principle: data does not leave the device

Health-OS assumes that a person’s medical data must not leave their machine. This is an architectural decision, not a setting that can be enabled or disabled.

The distinction matters. A setting may be forgotten, disabled “temporarily,” or lost during reinstallation. An architectural decision works differently: violating it requires a deliberate action that is visible.

This is expressed in the design as follows:

| Mechanism | What it does | Why this way |
|-----------|--------------|--------------|
| Repository without a remote | There is nowhere to push | Not “pushing is forbidden,” but physically nowhere to push. The barrier does not depend on discipline |
| Inverted `.gitignore` | All `Data/` contents are ignored; exceptions are named explicitly | An error means a file is not included in git, rather than causing a leak |
| Originals outside version control | PDFs, scans, and DICOM are not indexed by git | They contain PHI in raw form and persist in history after any deletion |
| Dashboard on loopback | `127.0.0.1`, with no network access | The dashboard has no authentication, and needs none while it is unreachable from outside |
| Prompts without PII | No agent contains patient data | Prompts become stale while data updates; facts live only in `Data/` |
| `600` and `go-rwx` permissions | Only the owner can read data and secrets | A second system user or unrelated process has no access by default |

### What still leaves the device

An honest qualification is needed, or the previous table would mislead. The system is built around a cloud model, and ordinary operation sends some data outward.

| Destination | What leaves | When |
|-------------|-------------|------|
| Anthropic API | `Data/` contents that enter context: lab results, profile, visit history | Whenever a skill or agent is called. This is the primary channel — a consilium necessarily sends medical data to the model |
| Todoist | Task names and descriptions: examination plans, physician specialties | Only if the integration is enabled |
| Google Calendar | Event names: dates and visit types | Only if the integration is enabled |
| WHOOP | Nothing outbound — incoming metrics only | Only if the integration is enabled |

Two practical conclusions follow:

1. **“Data does not leave the device” refers to storage, not processing.** Files remain local, while the cloud model reasons over them.
2. **Every MCP integration expands the perimeter.** Todoist and Calendar are optional for this reason: they can remain disabled and the system will still work. This is a deliberate choice that you make.

---

## Block 2. Inverted `.gitignore`

A conventional `.gitignore` lists what to hide. Here it is the reverse: everything is hidden and exceptions are named explicitly.

```gitignore
Data/**

!Data/**/
!Data/**/.gitkeep
!Data/**/README.md
!Data/**/*.example.json
!Data/**/*.demo.json
!Data/labs/_marker-aliases.json
!Data/specialists/*.json
```

### Why the direction of the error matters more than its likelihood

Errors occur in every scheme. The question is where they lead.

With the conventional approach (“list what to hide”), a forgotten line means a file containing medical data enters git. You may notice months later, and git history is permanent: deleting the file in a new commit does not remove it from earlier history.

With the inverted approach, a forgotten line means a needed support file **does not** enter the repository. This is found immediately — something is missing after the first clone — and fixed by adding one line. The damage is zero.

Both approaches fail equally often. The first fails toward a leak; the second toward inconvenience.

### Why `!Data/**/` is needed

This is the non-obvious detail without which the design does not work. Git does not look inside an ignored directory: once a directory is excluded as a whole, no exception can unignore a file inside it.

`!Data/**/` unignores the directories themselves while leaving their files ignored. Only then do the targeted exceptions for templates and registries take effect.

Check that the safeguard works:

```bash
echo '{}' > Data/__probe.json
git check-ignore -v Data/__probe.json    # should print a rule
rm Data/__probe.json
```

`setup.sh` performs the same check automatically on every run and reports an error if `Data/` has somehow become open.

### What is outside `Data/`

`Cache/`, `Archive/`, `Inbox/`, and `Goals/` are protected the same way — their contents are ignored, leaving only `.gitkeep`. This is not a formality: `Cache/` stores active context and session logs whose concentration of medical information is comparable to the data itself.

---

## Block 3. Original documents

PDFs, scans, photographs, and DICOM are excluded from version control by extension:

```gitignore
*.pdf
*.dcm
*.jpg
*.jpeg
*.png
*.heic
*.tif
*.tiff
*.dicom
```

There are two reasons, and both matter.

**First: PHI concentration.** Structured `Data/labs/2026-03-15_cbc.json` contains numbers and marker names. The original form from the same laboratory contains the patient’s name, date of birth, policy number, facility address, stamp, and physician signature. When processing the document, the system extracts the clinical content and leaves the identifying wrapper behind — provided the form itself does not enter the repository.

**Second: irreversibility.** Git stores history. A file deleted today remains in every commit where it existed. History cleanup is technically possible, but it rewrites every hash and gives no certainty of completeness: copies remain in `reflog`, packed objects, and clones if any were made. Prevention is simpler than cleanup.

The only exception is `Dashboard/public/**`, including interface icons and static assets. By definition, it contains no medical content.

The originals do not disappear: `/inbox` moves them to `Archive/`, which is also outside git. They remain on disk with the same permissions as the other data.

---

## Block 4. Dashboard

The dashboard is the only system component that listens on the network and therefore the only one with a real attack surface.

### Loopback only

```json
"dev": "next dev --turbopack -H 127.0.0.1",
"start": "next start -H 127.0.0.1"
```

By default, Next.js listens on `0.0.0.0` — all interfaces. The audit confirmed this in practice: a request to `/api/profile` from another device on the same Wi-Fi network returned the full medical profile. In a café, coworking space, or guest network, the profile would be available to nearby devices wherever the laptop was opened.

The `-H 127.0.0.1` flag closes this completely: the socket is bound to the loopback interface, so nothing outside can connect regardless of what happens in application code.

**The dashboard has no authentication, and while it is on loopback it does not need any.** If you ever decide to open external access — by changing `-H`, using a tunnel, or using a reverse proxy — authentication becomes mandatory before anything else.

Check the current binding:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

It should be `127.0.0.1:3000`, not `*:3000`.

### Path traversal and `resolveWithin`

Routes such as `/api/labs/[file]` receive a filename from the URL. A naïve implementation joins it to the data directory:

```ts
path.join(LABS_DIR, filename)     // do not do this
```

`path.join` does not protect you. It collapses `..`, but the result can leave the base directory: `path.join("/Data/labs", "../../../.claude.json")` returns a path to a file in the home directory. The audit used this to read configurations with live API keys and write files outside the project — including replacing a hook to achieve arbitrary command execution.

The only correct resolver is `resolveWithin` in `Dashboard/lib/data/utils.ts`. Each check closes a specific bypass:

```ts
export function resolveWithin(
  baseDir: string,
  filename: string,
  allowedExtensions?: string[]
): string {
  // 1. Decode first, or %2F..%2F bypasses separator checks
  const decoded = decodeURIComponent(filename);

  // 2. A null byte truncates the path at the system-call level
  if (decoded.includes("\0")) throw new Error("invalid filename: null byte");

  const base = path.resolve(baseDir);
  const target = path.resolve(base, decoded);

  // 3. The trailing separator is required: without it, /Data/labs-secret
  //    would pass the /Data/labs prefix check
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error("path escapes base directory");
  }

  // 4. Extension allowlist — an .md route must not serve .env
  if (allowedExtensions?.length) { /* ... */ }

  return target;
}
```

Rule for all new code: **a path built with user input is resolved only through `resolveWithin`.** Direct `path.join` with external data is a defect, not a stylistic preference.

On reads, the exception is caught and converted to `404`. On writes, it is deliberately rethrown — an attempt to write outside the data directory must fail loudly rather than silently pretending everything is fine.

### Input validation

The second layer is `Dashboard/lib/data/validation.ts`. It solves a different problem: preventing input that would corrupt the data.

- **`isPlainFilename`** rejects a `[file]` parameter containing path separators or upward traversal before the filesystem is accessed. `resolveWithin` would reject it too, but with an exception — exposing a 500 with internal error text. Invalid input is a `400`, not a server failure.
- **`Validator`** checks types, required fields, enum values, calendar-valid dates, and that dates are not in the future. Errors are collected and returned together.
- **`RANGES`** defines broad physiological bounds: a weight of 8.25 instead of 82.5 and hemoglobin of 15.8 instead of 158 do not enter a trend. This is not diagnosis; it protects against a misplaced decimal.
- **Merge instead of replacement.** A PUT body is merged into the existing file rather than replacing it: an editor that does not know fields such as `pdf_path` or `studies[]` would erase them on every save.
- **The `version` field is never reset** — schema migration depends on it.

### What the dashboard does not have

- **Request-body size limits.** A giant POST can exhaust the process’s memory.
- **Access auditing.** Nothing records who read what.

Both are acceptable because the server is accessible only from this machine. Change that condition and the conclusion changes too.

### CSRF — before and after

The old document said that the absence of CSRF protection was acceptable “precisely because the server is accessible only from this machine.” **That reasoning was wrong**, and it is worth examining because the mistake is common.

Loopback binding protects against an attacker **on the network**. It does nothing against CSRF because the victim’s browser runs on the same machine: a page open in another tab can call `127.0.0.1:3000` and reach the same server. Locality is not a mitigating circumstance here; it is the **necessary condition for the attack**.

The vulnerability was practically confirmed. This request:

```
PUT /api/profile
Origin: https://evil.example
Content-Type: text/plain
```

returned `{"success":true}` and overwrote the `basic` block of the profile — date of birth, sex, height, and emergency contact. Without date of birth, age logic, pediatric mode, and all age-specific references break. The `text/plain` type is deliberate: it is a “simple” request and does not trigger a preflight, so the browser sends it without first asking the server.

There were thirteen mutating routes, and none checked `Origin`.

**Closed in `Dashboard/middleware.ts`** — one point for all `/api/*` routes:

| Vector | Check |
|--------|-------|
| CSRF from a browser tab | Mutating methods compare `Origin` and `Sec-Fetch-Site`. The browser sets them itself; a page cannot forge them |
| DNS rebinding | An attacker’s domain resolving to `127.0.0.1` bypasses loopback binding but arrives with a foreign `Host`; it is checked separately |

A request without `Origin` and `Sec-Fetch-Site` is allowed: it is `curl` or a script, not a browser. It is not a CSRF vector, and someone already executing commands on the machine does not need to bypass the dashboard.

Verified: the attack above and three other vectors receive `403`; legitimate dashboard requests from `127.0.0.1` and `localhost` work.

---

## Block 5. Keys and secrets

| Rule | Why |
|------|-----|
| `.mcp.json` — outside git, permission `600` | The file contains tokens. `600` blocks other system users and processes running outside your account |
| Keys never enter prompts, tasks, or commits | Anything in a prompt goes to the cloud. Anything in a commit remains in history |
| Service tokens go in the servers’ own configuration, not spread across files | One secrets file is easier to protect and revoke |
| `.env`, `*.key`, `*.pem`, `credentials.json` go in `.gitignore` | Cheap protection against putting a file in the project root “just for a minute” |

Check permissions:

```bash
ls -l .mcp.json                  # expected -rw-------
find Data -type f ! -perm 600 | head
```

Also check the Claude Code configuration in the home directory. It stores MCP-server environment variables in plain text, and its default permissions may be `644` — meaning any system user and any process can read it:

```bash
ls -l ~/.claude.json
chmod 600 ~/.claude.json
```

This file is outside the project, so `setup.sh` does not touch it, but it was the target of the path-traversal exploit in the audit.

**Passwords instead of tokens are a separate bad idea.** A token can be revoked with one click and has limited permissions; a password opens the entire account. If an integration supports OAuth or an API key, use that.

---

## Block 6. Threat model

Likelihood and impact are assessed for the typical scenario: one personal machine, one user, and a local repository without a remote.

| Scenario | Likelihood | Impact | Current protection | Sufficient |
|----------|------------|--------|--------------------|------------|
| Device stolen while powered off | low | critical | OS disk encryption — FileVault, LUKS, BitLocker | **yes**, if encryption is enabled |
| Device stolen while powered on and unlocked | low | critical | No second barrier: data is stored in plain text | **no** |
| Accidental `git push` from the project | very low | critical | Remote physically absent; `Data/` covered by `.gitignore`; `setup.sh` checks both | **yes** |
| Publishing a repository with uncleared data | medium | critical | Inverted `.gitignore`, automatic `setup.sh` check | **partially** — manual checklist needed, Block 8 |
| Sharing a screenshot with the IDE open | medium | high | No technical protection. It only helps that medical data is in `Data/`, not the root | **no** |
| Another OS user accesses the machine | low | high | `chmod -R go-rwx Data`, `.mcp.json` is `600` | **yes** for unprivileged users |
| Physical access to an unlocked machine | low | critical | None: file permissions protect against other accounts, not against you | **no** |
| Dashboard running on a public network | medium | critical | Binding to `127.0.0.1` in `dev` and `start` | **yes**, while `-H` is unchanged |
| Malicious browser tab calls `127.0.0.1` | medium | high | Path traversal closed, input validated, mutating requests check `Origin` and `Sec-Fetch-Site` | **yes** |
| DNS rebinding: foreign domain resolves to `127.0.0.1` | low | high | `Host` header checked for loopback interface | **yes** |
| Data sent to the cloud through MCP and agents | certainty 100% | medium | Deliberate tradeoff: integrations are optional and the channel is documented | **partially** — controlled by your choice |
| Integration token compromised | medium | medium | `600` permissions, tokens outside git | **partially** — revocation remains manual |
| Leak through `Cache/` and `Archive/` when sharing the directory | medium | high | Both are outside git but stored in plain text on disk | **no** when copying the entire directory |

The three “no” rows share a boundary: they are limits of the model rather than implementation defects. The system protects data from the network and from git. It does not protect it from someone who already has access to your unlocked machine.

---

## Block 7. What the system does not protect

A direct list prevents false expectations.

**No application-level encryption.** Files in `Data/` are ordinary JSON, CSV, and Markdown in plain text. Any process running under your account can read them without obstacles. At rest, confidentiality relies entirely on operating-system disk encryption. If it is off, turn it on; it is the only real protection when a device is lost.

```bash
# macOS
fdesetup status

# Linux (LUKS)
lsblk -o NAME,FSTYPE,MOUNTPOINT | grep crypt
```

**No access audit.** The system does not log who read what or when. It is impossible to establish after the fact whether data was copied.

**No multi-user mode.** One directory is for one person. There are no roles, access partitions, or separation of family-member data. Permissions are arranged so only the directory owner can read the data; this is the only separation layer.

**No protection from a compromised machine.** A malicious process under your account gets everything: data, tokens, and history. No project mechanism resists this.

**No certification or regulatory compliance.** Health-OS is a personal tool, not a health-information system. HIPAA, GDPR as a processor, and ISO 27001 are neither claimed nor implied. The system is not intended for professional use with other people’s data.

**No backup.** Local git protects against accidental edits but not disk loss. Backups are your responsibility and must go to encrypted storage.

---

## Block 8. Checklist before sharing

### Before publishing or handing over the repository

```bash
# 1. Nothing from working directories is tracked
git ls-files | grep -E '^(Data|Cache|Archive|Inbox|Goals)/'
# Expected: only *.example.*, *.demo.*, README.md, .gitkeep
#           and registries Data/labs/_marker-aliases.json, Data/specialists/*.json

# 2. No original documents in the working tree or history
git ls-files | grep -iE '\.(pdf|jpe?g|png|heic|tiff?|dcm|dicom)$'
git log --all --pretty=format: --name-only --diff-filter=A \
  | sort -u | grep -iE '\.(pdf|jpe?g|png|heic|dcm)$'
# Expected: empty, except Dashboard/public/

# 3. No secrets
git ls-files | grep -E '(\.mcp\.json|\.env|\.key|\.pem|credentials\.json)$'
git log --all -p | grep -inE 'sk-[a-z0-9]{10}|ghp_|Bearer [A-Za-z0-9]{20}' | head

# 4. No absolute paths containing your username
grep -rIn "$HOME" --exclude-dir=node_modules --exclude-dir=.git . | head

# 5. No personal data in tracked files
git ls-files -z | xargs -0 grep -lniE 'surname|insurance policy|social security number|date of birth' | head
```

If any check finds something, **do not publish the cleaned repository; create a new one.** Git history is permanent, and cleaning it reliably is usually harder than starting over. The right order is a new directory, `git init`, copying only code, and a first commit.

### Before a screenshot

- Close dashboard tabs showing the profile, lab results, and visits.
- Collapse the IDE file tree or remove it from the frame — filenames in `Data/labs/` alone reveal what you may be ill with.
- Check that `Cache/active-context.md` and `MEMORY.md` are not visible: they contain current diagnoses and examination plans in concentrated form.
- Check the terminal history in the frame — commands often contain filenames with dates and specialties.
- Notification panels and the window title also appear in the frame.

### Before screen sharing

Deploy the demo set in a separate directory and show that:

```bash
git clone <repository> /tmp/health-os-demo
cd /tmp/health-os-demo && ./setup.sh --demo
```

Fictional-patient data looks like real data and lets you show everything, including a consilium.

---

## Block 9. Suspected leak

Actions, from fastest to slowest.

**1. Assess the channel.** What may have left: the repository, one file, a screenshot, dashboard access from the network, or an integration token. Everything else depends on this.

**2. Revoke tokens first.** This is the only truly reversible action and the only one where speed matters.

- Todoist: Settings → Integrations → Developer → revoke and issue a new token.
- Google: account access-management page → revoke the application’s access.
- Anthropic and other services — through their consoles.
- After revocation, update `.mcp.json` and check permissions: `chmod 600 .mcp.json`.

**3. If a git repository leaked.** Remove it from public access, but do not consider that a solution: forks, clones, and search-engine caches remain. Assume that anything in a public repository has spread. In practice, do not try to “clean history and restore”; create a new repository from scratch and publish only code.

**4. If the dashboard was accessible from the network.** Check the binding (`lsof`, Block 4) and restore `-H 127.0.0.1`. It is impossible to determine whether anyone connected because there is no access audit. Assume the worst: that `Data/` contents may have been read and configuration tokens compromised, and revoke them.

**5. If a separate data file leaked.** Medical data cannot be “revoked,” which is its fundamental difference from a password. The realistic action is to understand the scope: what was in the file, who may have received it, and what practical harm could result. In most everyday scenarios the harm is reputational rather than operational, but you decide whom to notify.

**6. Check that it will not happen again.** Run the complete Block 8 checklist and `./setup.sh` — it checks repository isolation and `.gitignore` behavior.

---

## Block 10. Rules for people adding code

Before accepting a new route, script, or skill that works with files:

1. **Is the path built from user input?** If so, does it use `resolveWithin` rather than `path.join`?
2. **Is input validated before writing?** Check type, required fields, enum, calendar-valid date, and physiological range.
3. **Does the change expand external access?** A new listening socket, outbound request, or integration changes the threat model, which must be reread.
4. **Does patient data appear where it should not:** agent prompts, commits, logs, or task names in external services?
5. **Does the change weaken `.gitignore`?** Every new exception in the `Data/` section requires an explanation of why that file definitively contains no personal data.

---

⚕️ This document describes data protection, not medical decisions. Consult a physician for treatment decisions.

---

## Agent permissions

Before profiles, `.claude/settings.json` allowed `Bash`, `Write`, `Edit`, `WebFetch`, and `WebSearch` without confirmation, and the `deny` list was empty. For a repository containing medical files, this was excessive: an agent reading a submitted PDF could execute any shell command.

Permissions are now minimal:

| List | Contents | Purpose |
|------|----------|---------|
| `allow` | Read, search, and write **only** in `Data/`, `Cache/`, `Archive/`, `Inbox/`, and `Goals/`; read pages from nine medical domains | Ordinary work requires no confirmation |
| `ask` | `Bash`, `WebSearch` | Every shell command and search requires your permission |
| `deny` | Write to `.claude/**`, `.git/**`; read `~/.ssh`, `~/.claude`, `~/.aws`, `~/.gnupg`, any `.env*`, `.mcp.json`; `curl`, `wget`, `nc`, `ssh`, `scp`, `rsync`, `git push`, `git remote add` | Barrier that works under any settings |

The key property is: **`deny` and explicit `ask` apply in every mode**, including permission-bypass mode. `allow` means nothing in that mode, so the real protection comes from the other two lists. The ban on writing to `.claude/**` means the agent cannot expand its own permissions: this is a rule that protects itself.

### What these rules do not do

This is listed honestly because protection with unnamed boundaries is more dangerous than no protection.

- **Wrappers bypass Bash bans.** `Bash(curl:*)` blocks `curl …`, but not `sudo curl …`, `bash -c "curl …"`, or `python3 -c "import urllib…"`. Claude Code strips only a fixed set of wrappers before matching — `timeout`, `nice`, `nohup`, and similar — and `sudo` is not among them. The real barrier here is `ask` on `Bash`: every unrecognized command still asks for permission
- **File bans do not see third-party processes.** `Read(**/.env*)` stops reading through built-in tools and recognized commands such as `cat`, but not a Python script that opens the file itself
- **`Edit` bans do not cover Bash.** `git commit` and `rm` through the shell can affect `.git` and `.claude` — otherwise ordinary repository operations would break
- **`Bash(git push:*)` is fragile**: an extra space or an absolute path to the binary may not match the pattern. The real safeguard is that the repository has no remote by design
- **Session hooks do not pass through these rules** — they run in a shell outside tool calls, so a `deny` on `.claude/**` does not break them

### Sandbox

When working with real medical data, enable the built-in Claude Code sandbox — it isolates the filesystem and network for shell commands at the operating-system level rather than through instructions.

It is **off by default**. Enable it with `/sandbox` or with `"sandbox": {"enabled": true}`. This is what closes the `sudo` and third-party-interpreter bypasses listed above.

It is intentionally not included in the project settings: the sandbox changes shell behavior for the entire session, so this is the user’s choice rather than a repository-imposed default.
