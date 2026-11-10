# Skill Audit — 2026-11-10

Audit of the AI agent skills installed on this machine (`/home/tl-wr840n`), performed as part of
housekeeping for The Global Altar Watch. No project source files were changed.

## 1. Inventory before

56 separate skill roots, ~2,900 skill directories, **~130 MB** in the five active roots.

| Root | Entries | Role |
| --- | --- | --- |
| `~/.agents/skills` | 357 | Canonical store; read by Freebuff and Claude |
| `~/.claude/skills` | 356 | Symlinks + full copies of the canonical store |
| `~/.config/opencode/skills` | 305 | OpenCode copy |
| `~/.freebuff/skills` | 283 | Stale copy |
| `~/.gemini/skills` | 286 | Copy for a CLI that is not installed |
| 34 other roots | 16 each | The same 16-skill bundle replicated per agent tool |

Installed agent CLIs found on `PATH`: `claude`, `opencode`, `freebuff`, `continue`.
The other ~34 tool directories belonged to agent tools that are not installed.

## 2. Findings

1. **Bulk-duplicated bundle.** 34 roots each held an identical 16-skill bundle
   (`academic-paper`, `better-auth-best-practices`, `bun-runtime`, `cloudflare-deploy`,
   `color-expert`, `deep-research`, `design-mobile-apps`, `docx`, `find-skills`, `i18next`,
   `nextjs-best-practices`, `playwright-cli`, `powerpoint-ppt`, `react-i18next`, …) for CLIs
   that were never installed. Pure disk and indexing waste.
2. **Untracked compliance corpus.** `~/.agents/.skill-lock.json` records only **61** skills.
   The ~280 GDPR / HIPAA / CCPA / CPRA / DPIA / consent / cookie / retention / breach / audit
   skills were **bulk copies with no install record** — none came from a deliberate
   `npx skills add`, and none are referenced by this project or by any local agent config.
3. **Mirror drift.** `.claude`, `.freebuff` and `.config/opencode` each carried their own full
   copies of that corpus rather than linking to the canonical store, so the same skills were
   loaded (and paid for in prompt space) several times over.

## 3. Actions taken

All removals were **moves into a dated backup**, not deletions.

- Archived 39 duplicate roots for uninstalled CLIs (~56 MB): `.adal`, `.aider-desk`, `.augment`,
  `.bob`, `.codeartsdoer`, `.codebuddy`, `.codeium/windsurf`, `.codemaker`, `.codestudio`,
  `.commandcode`, `.config/crush`, `.config/devin`, `.config/goose`, `.factory`, `.forge`,
  `.iflow`, `.junie`, `.kilocode`, `.mcpjam`, `.mux`, `.neovate`, `.openhands`, `.pi/agent`,
  `.pochi`, `.qoder`, `.qwen`, `.roo`, `.rovodev`, `.snowflake/cortex`, `.tabnine/agent`,
  `.trae-cn`, `.trae`, `.vibe`, `.zencoder`, `.gemini`, `.grok`, `.kiro`, `.kode`, `.openclaw`.
- Archived 286 compliance/legal skills from the canonical store, plus the mirrored copies:
  283 from `~/.claude/skills`, 282 from `~/.freebuff/skills`, 282 from
  `~/.config/opencode/skills`.
- Repopulated `.claude`, `.freebuff` and `.config/opencode` as symlinks to
  `~/.agents/skills` so the roots cannot drift again.

Deliberately left alone: `~/openaccountants/skills` (belongs to that repository, not a tool
root), `~/.hermes`, `~/.config/GenOffice`, and the small hand-picked roots (`.codex`, `.cursor`,
`.copilot`, `.antigravity`, `.config/gemini`) whose contents are project-relevant
(`i18next`, `pdf`, `notifications-push`, …). The project-local
`.agents/skills/i18n-translation-guide` was not touched.

## 4. State after

| Root | Entries |
| --- | --- |
| `~/.agents/skills` | 75 |
| `~/.claude/skills` | 75 (symlinks) |
| `~/.freebuff/skills` | 75 (symlinks) |
| `~/.config/opencode/skills` | 80 (75 linked + 5 OpenCode-only) |
| `~/.continue/skills` | 55 (names all duplicate the canonical set) |

Active roots: **~130 MB → 22 MB**. Verification: 0 dangling symlinks, every canonical skill
present in every mirror, 0 compliance skills remaining in any active root,
`git status` shows no project changes from the audit.

### Skills kept (75)

`academic-paper`, `academic-paper-reviewer`, `academic-pipeline`, `ask-matt`, `autoresearch`,
`better-auth-best-practices`, `blindspot-pass`, `brainstorm-prototypes`,
`build-awwwards-quality-sites`, `bun-runtime`, `change-quiz`, `chief-of-staff`,
`claude-handoff`, `clerk-nextjs-skills`, `cloudflare-deploy`, `code-review`, `codebase-design`,
`color-expert`, `deep-research`, `design-mobile-apps`, `diagnosing-bugs`, `docx`,
`domain-modeling`, `find-skills`, `git-guardrails-claude-code`, `grill-me`, `grill-with-docs`,
`grilling`, `handoff`, `i18next`, `implement`, `implement-spec`, `implementation-notes`,
`implementation-plan`, `improve-codebase-architecture`, `interview-me`, `loop-me`, `magnitude`,
`migrate-to-shoehorn`, `mql5-indicator-patterns`, `nextjs-app-router-patterns`,
`nextjs-best-practices`, `notifications-push`, `pdf`, `pitch-packager`, `playwright-cli`,
`powerpoint-ppt`, `pr`, `presentation-design`, `prototype`, `react-i18next`, `reference-hunt`,
`research`, `retro`, `scaffold-exercises`, `setup-matt-pocock-skills`, `setup-pre-commit`,
`setup-ts-deep-modules`, `soccer-analyst`, `taste-skill`, `tdd`, `teach`, `to-questionnaire`,
`to-spec`, `to-tickets`, `triage`, `vercel-react-best-practices`, `wait-what`, `wayfinder`,
`web-push-notifications`, `wizard`, `writing-beats`, `writing-for-agents`, `writing-fragments`,
`writing-shape`.

`soccer-analyst` and `mql5-indicator-patterns` were kept because they had been installed
deliberately into nine tool roots each; remove them if that was not intentional.

## 5. Backup and restore

Backup: `~/skill-audit-backup-20261110` (85 MB) containing `README.md`, `MANIFEST.txt`, and the
original directory tree.

Restore everything removed from the canonical store:

```bash
cp -a ~/skill-audit-backup-20261110/.agents/skills/. ~/.agents/skills/
```

Restore a single skill (for example the GDPR corpus skill `gdpr-valid-consent`):

```bash
cp -a ~/skill-audit-backup-20261110/.agents/skills/gdpr-valid-consent ~/.agents/skills/
ln -s ../../.agents/skills/gdpr-valid-consent ~/.claude/skills/gdpr-valid-consent
```

Restore an entire duplicated tool root (for example `.trae`):

```bash
cp -a ~/skill-audit-backup-20261110/.trae/skills ~/.trae/skills
```

Alternatively reinstall from source, e.g.
`npx skills add <owner/repo> --skill <name> -g`.

## 6. Known leftovers

- `~/.agents/.skill-lock.json` still lists `image-to-code` and `logo-design`, which have no
  directory in any root. This predates the audit.
- `~/.continue/skills` keeps 55 physical copies of skills that also exist in the canonical
  store; they were left because nothing is loaded twice from them, but they could be replaced
  with symlinks for the same drift protection as the other mirrors.
- `.gemini`, `.grok`, `.kiro`, `.kode`, `.openclaw` roots were removed wholesale; reinstalling
  those CLIs will recreate their default skill directories.
