# AL Development Profile — Lead-as-Manager

**Version:** 5.2.0

Claude Code profile for Microsoft Dynamics 365 Business Central AL development. The main session acts as an **engineering manager** that orchestrates specialist teammate agents — it never writes code itself. Work is parallelized across agent teams, documented to files, and gated by user approval.

## Overview

This profile implements a **Lead-as-Manager** workflow backed by **skills** (model-invoked, prefixed with `/`), standing **rules** (auto-loaded AL guardrails), and **hooks** (auto-compile). Output is document-driven: agents write detailed results to `.dev/<task-slug>/`, returning only concise summaries to keep the main conversation clean.

## Key Features

- **Lead-as-Manager orchestration** — Main session spawns specialist teammates for parallel work
- **Competitive solution design** — 2-3 architect agents debate approaches, the lead synthesizes
- **Parallel implementation** — N developer agents work different modules concurrently
- **Parallel review** — 4 specialists (security, AL expert, performance, test coverage)
- **Parallel test development** — 4 test engineers (unit, integration, scenario, edge case)
- **Smart complexity routing** — TRIVIAL / SIMPLE / MEDIUM / COMPLEX → matching skill
- **Project memory** — `.dev/project-context.md` cuts 40-60% off workflow runtime
- **Standing AL rules** — Naming, architecture, data access, conventions auto-loaded
- **MCP integration** — BC Code Intelligence, Microsoft Docs, AL Dependency, ALCOPS

## Quick Start

### Enable in Your AL Project

In your AL project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "my-configs": {
      "source": {
        "source": "directory",
        "path": "~/claude-configs"
      }
    }
  },
  "enabledPlugins": {
    "profile-al-development@my-configs": true
  }
}
```

The `~` expands to your home directory automatically.

### One-Time Setup (recommended)

```
/init-context
```

Builds `.dev/project-context.md` (object ranges, prefix, dependencies, patterns) — read first by every workflow, saving 40-60% per run.

## Workflow Routing

Classify each request by complexity, then invoke the matching skill:

| Complexity | Criteria | Route | Time |
|------------|----------|-------|------|
| TRIVIAL | Single file, obvious fix | `/fix` | 2-5 min |
| SIMPLE | 2-3 files, pattern exists | `/fix` or `/plan` → `/develop` | 5-15 min |
| MEDIUM | 4-8 files, design decisions | `/plan` → `/develop` | 20-40 min |
| COMPLEX | 9+ files, new architecture | `/interview` → `/plan` → `/develop` → `/test` | 45-90+ min |

## Available Skills

Invoke with `/`. Skills marked *(reference)* are auto-loaded knowledge rather than runnable workflows.

### Workflow Skills
- `/init-context` — One-time project context setup
- `/interview` — Deep requirements gathering (structured interview specialist)
- `/plan` — Competitive solution design (2-3 architects debate, lead synthesizes)
- `/develop` — Parallel implementation + 4-specialist code review
- `/fix` — Lightweight 3-tier bug fix (no approval gates)
- `/test` — Parallel test development (4 test engineers)
- `/document` — Technical documentation generation (docs-writer specialist)
- `/verify-tests` — Adversarial test verification (mutation sweeps, assertion audit)

### Build & Test Skills
- `/compile` — Run `al-compile` with analyzers, write diagnostics to the task folder
- `/publish` — Deploy the compiled `.app` to a BC server via `bc-publish`
- `/run-tests` — Execute test codeunits (`al-runner` for pure logic, `bc-test` for integration)
- `/local-bc` — Manage a local BC instance for dev/testing
- `/al-symbols` — Download dependency symbol packages from Microsoft NuGet feeds
- `/al-mutate` — Mutation testing to surface test-suite gaps (no BC instance required)

### Knowledge & Lookup Skills
- `build-tools` *(reference)* — Build pipeline quick reference (auto-loads on compile/deploy/test)
- `review-checklists` *(reference)* — Quality checklists for plans, code, and tests
- `bc-source` — Look up BC base application source (tables, pages, codeunits, events)
- `bcquality-citation` *(reference)* — Ground design/code/review in the BCQuality rule corpus and cite it by path

## Agents

This profile ships **one** standalone agent; the workflow specialists (architects, developers, reviewers, test engineers, docs-writer) are spawned dynamically by the skills above.

- **al-repo-summarizer** — Summarizes an AL repository's structure and purpose without reading every file

## Standing Rules (auto-loaded)

Files in `rules/` provide AL guardrails without any skill invocation:

| Rule | Loaded when |
|------|-------------|
| `al-engineering.md` | Always |
| `al-architecture.md` | An `*.al` file is in context |
| `al-naming.md` | An `*.al` file is in context |
| `al-conventions.md` | An `*.al` file is in context |

Field classification, captions, and most performance/style rules are deferred to the BCQuality
corpus (consulted on demand via `/bcquality-citation`) rather than duplicated as static rules.

## Hooks

`hooks/hooks.json` registers:
- **PostToolUse** (`Edit`/`Write`) → `al-hook-record.js` records touched files
- **Stop** → `al-hook-compile.js` auto-compiles the AL project at turn end

## Task Folder Convention

All workflow output goes to `.dev/<task-slug>/`, where `<task-slug>` is auto-generated from the request:

```
.dev/
├── project-context.md              # Shared across all tasks (read first)
├── credit-limit-validation/        # Task-specific folder (preserved)
│   ├── 01-requirements.md
│   ├── 02-solution-plan.md
│   ├── 03-code-review.md
│   └── session-log.md
└── email-field-fix/
    └── fix-summary.md
```

- A new `.dev/<task-slug>/` is created per workflow — existing task folders are never reused
- `project-context.md` stays at the `.dev/` root, shared across tasks

## MCP Server Configuration

This profile configures six MCP servers in `.mcp.json`:

| Server | Type | Purpose |
|--------|------|---------|
| `bc-code-intelligence-mcp` | stdio | BC specialist consultations (built-in embedded knowledge base, 17 specialists) |
| `microsoft_docs_mcp` | http | Official AL/BC documentation lookup |
| `al-mcp-server` | stdio (npx) | Symbols of the **current project's dependencies** — object navigation, event discovery, dependency analysis |
| `bc-source-mcp` | stdio (npx) | Full base-app **source history** across BC versions/localizations (drives `/bc-source`) |
| `bcquality-mcp` | stdio (npx) | BCQuality best-practice rule corpus (microsoft/community/**custom** layers; drives `/bcquality-citation`). Set to the DI fork via `BCQUALITY_REPO_URL` |
| `alcops` | stdio | AL code-quality analysis and fixes |

`al-mcp-server` vs `bc-source-mcp` overlap on base-app event/object discovery: prefer
`bc-source-mcp` when you need the implementation or a specific version, `al-mcp-server` when
you only need what the current project actually compiles against. Other servers (e.g. NAB AL
Tools, BCQuality) may be supplied by your user or project settings.

## Directory Structure

```
profile-al-development/
├── .claude-plugin/
│   └── plugin.json           # Plugin metadata
├── .mcp.json                 # MCP server configuration (6 servers)
├── CLAUDE.md                 # Lead-as-Manager profile instructions
├── README.md                 # This file
├── agents/
│   └── al-repo-summarizer.md # Standalone repo-summary agent
├── skills/                   # 18 model-invoked skills (see above)
├── rules/                    # 4 auto-loaded AL rule files
├── hooks/                    # hooks.json + al-hook-record.js + al-hook-compile.js
├── .dev-templates/
│   └── project-context.md    # Template for /init-context
└── *.md                      # Shared reference docs (tdd-workflow, workflow-routing,
                              #   proportional-planning, task-coordination, feedback-resolution)
```

## AL Coding Standards

Enforced via the `rules/` files (see `CLAUDE.md` and the rule files for the complete set):

- **PascalCase** naming with object affixes
- **Table extensions** over base modifications
- **Event subscribers** for base app integration
- **SetLoadFields** for query performance
- **XML documentation** on public procedures
- **DataClassification** on all fields

## Recommended Hooks (notifications)

Desktop notifications when Claude needs attention or finishes. Add to your **user or project** settings (`~/.claude/settings.json` or `.claude/settings.json`), not the plugin:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send -t 5000 'Claude Code' 'Done: Ready for input'"
          }
        ]
      }
    ]
  }
}
```

Replace `notify-send` with your OS notification command (e.g. PowerShell `BurntToast` on Windows).

## Requirements

- Claude Code CLI
- AL Language extension
- BC development environment
- CLI tooling on PATH for build/test skills: `al-compile`, `bc-publish`, `bc-test`, `al-runner`
- MCP servers (optional but recommended): BC Code Intelligence, Microsoft Docs, AL Dependency, ALCOPS

## Contributing

Improvements benefit all your AL projects:

```bash
cd ~/claude-configs
git add profile-al-development/
git commit -m "Improve [aspect]"
git push
```

On other computers: `git pull`.

## Resources

- [AL Language Documentation](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-programming-in-al)
- [BC Best Practices](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-best-practices)
- [Claude Code Documentation](https://docs.claude.com/claude-code)

---

**Lead-as-Manager AL development with parallel agent teams and a document-driven workflow.**
</content>
</invoke>
