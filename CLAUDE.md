# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a configuration repository for Claude Code plugins. It contains reusable plugin profiles that can be synced across multiple projects and computers via GitHub. The repository does not contain application code - it contains plugin configurations, model-invoked skills, standing rules, hooks, specialized agents, and MCP server configurations.

## Architecture

### Plugin System

This repository uses Claude Code's plugin architecture where:

1. **Plugin profiles** are self-contained directories with a `.claude-plugin/plugin.json` file
2. **Plugins are registered** in project `.claude/settings.json` files via `extraKnownMarketplaces` and `enabledPlugins`
3. **Multiple plugins can be composed** together in a single project
4. **Configuration is additive** - all plugins load together with project-specific settings

### Repository Structure

```
claude-configs/
├── .claude-plugin/
│   └── marketplace.json             # Marketplace manifest (lists bundled plugins)
├── profile-al-development/          # AL/Business Central development profile
│   ├── .claude-plugin/
│   │   └── plugin.json              # Plugin metadata (name, version, author, agents)
│   ├── .mcp.json                    # MCP server configuration (4 servers)
│   ├── CLAUDE.md                    # Lead-as-Manager profile instructions
│   ├── agents/                      # Standalone agents
│   │   └── al-repo-summarizer.md    # (workflow specialists are spawned by skills)
│   ├── skills/                      # 18 model-invoked skills (/-prefixed)
│   │   ├── init-context/  interview/  plan/  develop/  fix/  test/  document/
│   │   ├── compile/  publish/  run-tests/  local-bc/  al-symbols/  al-mutate/
│   │   └── build-tools/  review-checklists/  bc-source/  verify-tests/
│   ├── rules/                       # 5 auto-loaded AL guardrail files
│   │   ├── al-engineering.md        # Always loaded
│   │   ├── al-architecture.md  al-naming.md  al-conventions.md
│   ├── hooks/                       # hooks.json + al-hook-record.js + al-hook-compile.js
│   ├── .dev-templates/              # Template for /init-context
│   ├── *.md                         # Shared reference docs (tdd-workflow, workflow-routing,
│   │                                #   proportional-planning, task-coordination, feedback-resolution)
│   └── README.md                    # Profile documentation
├── .gitignore
└── README.md                        # Repository overview and setup
```

## Key Concepts

### Document-Driven Development (AL Profile)

The AL profile implements a document-driven workflow where:

1. **Agents write to files, not chat** - Keeps main conversation clean
2. **Shared task context** - Agents read prior outputs via the `.dev/<task-slug>/` directory
3. **Persistent documentation** - Full audit trail in markdown files
4. **User approval gates** - Stop between major phases for validation

### Lead-as-Manager Pattern

The main session is an **engineering manager** — it never writes code itself. Each skill
spawns specialist teammate agents (often in parallel) and synthesizes their output:

```
User Request
    ↓
Lead classifies complexity → invokes the matching skill
    ↓
/plan      → 2-3 architect agents debate → lead synthesizes → 02-solution-plan.md
    ↓ (approval gate)
/develop   → N developer agents (parallel modules) → 4 reviewer specialists
             (security, AL expert, performance, test coverage)
    ↓ (approval gate)
/test      → 4 test engineers in parallel (unit, integration, scenario, edge case)
    ↓
/verify-tests → adversarial verification (mutation sweeps, assertion audit)
```

All artifacts land in `.dev/<task-slug>/` (`01-requirements.md`, `02-solution-plan.md`,
`03-code-review.md`, `session-log.md`, …); `project-context.md` stays at the `.dev/` root.

### MCP Server Integration

The AL profile configures six MCP servers in `.mcp.json`:

1. **BC Code Intelligence MCP** (`bc-code-intelligence-mcp`)
   - BC specialist consultations via structured personas
   - Uses the server's built-in embedded knowledge base (17 specialists)

2. **Microsoft Docs MCP** (`microsoft_docs_mcp`)
   - Official AL/BC documentation lookup
   - HTTP-based MCP server

3. **AL Dependency MCP** (`al-mcp-server`)
   - Symbols of the current project's dependencies
   - Object navigation, event discovery, dependency analysis (runs via npx)

4. **BC Source MCP** (`bc-source-mcp`)
   - Full base-app source history across BC versions/localizations
   - Drives the `/bc-source` skill (runs via npx)

5. **BCQuality MCP** (`bcquality-mcp`)
   - BCQuality best-practice rule corpus (microsoft/community/custom layers)
   - Custom layer = DI fork (`BCQUALITY_REPO_URL`); drives `/bcquality-citation` (runs via npx)

6. **ALCOPS MCP** (`alcops`)
   - AL code-quality analysis and automated fixes

Other MCP servers (e.g. NAB AL Tools) may be supplied by your user or project settings — they
are intentionally **not** bundled in this plugin's `.mcp.json`.

## Common Development Tasks

### Adding a New Plugin Profile

```bash
cd ~/claude-configs
mkdir -p profile-name/{.claude-plugin,skills,agents,rules}

# Create plugin.json
cat > profile-name/.claude-plugin/plugin.json <<EOF
{
  "name": "profile-name",
  "description": "Brief description",
  "version": "1.0.0",
  "author": {
    "name": "Gabriel Lachana"
  }
}
EOF

# Add configuration files
# - profile-name/CLAUDE.md
# - profile-name/skills/<skill-name>/SKILL.md
# - profile-name/agents/*.md
# - profile-name/rules/*.md (optional auto-loaded guardrails)
# - profile-name/.mcp.json (if needed)

# Register the new plugin in .claude-plugin/marketplace.json

git add profile-name/ .claude-plugin/marketplace.json
git commit -m "Add profile-name plugin"
git push
```

### Updating an Existing Plugin

```bash
cd ~/claude-configs

# Edit files (e.g., profile-al-development/CLAUDE.md)
# Make improvements to agents, skills, rules, or instructions

git add profile-al-development/
git commit -m "Improve [specific aspect]"
git push

# On other computers
git pull  # Changes immediately available to all projects
```

### Creating a Skill

Skills are model-invoked (and `/`-invocable) capabilities stored as `skills/<skill-name>/SKILL.md`, with YAML frontmatter declaring `name` and `description`:

```markdown
---
name: skill-name
description: One-line summary used to decide when this skill is relevant.
---

# Skill: skill-name

Brief description of what this skill does.

## Implementation

[Detailed instructions for Claude on how to execute this skill]
```

### Creating an Agent

Agents are autonomous subprocesses stored in `agents/*.md`:

```markdown
# Agent: agent-name

Role description and purpose.

## Input

What this agent reads (e.g., .dev/01-requirements.md)

## Output

What this agent produces (e.g., .dev/02-solution.md)

## Process

[Detailed steps the agent should follow]
```

### Testing Plugin Changes

```bash
# In a test AL project
cd ~/path/to/test-project

# Ensure plugin is enabled in .claude/settings.json
cat .claude/settings.json

# Start Claude Code and test the change
claude

# Test a specific skill
/skill-name "test input"
```

## Configuration Hierarchy

Claude Code loads configurations in this order (later overrides earlier):

1. Enterprise managed settings (if configured)
2. User settings (`~/.claude/settings.json`)
3. User plugins (registered in user settings)
4. **Project settings** (`.claude/settings.json`)
5. **Project plugins** (enabled in project settings) ← This repository's plugins load here
6. Local settings (`.claude/settings.local.json` - gitignored)

## File Naming Conventions

- **Skills**: `skills/skill-name/SKILL.md` (kebab-case directory)
- **Agents**: `agents/agent-name.md` (kebab-case)
- **Rules**: `rules/al-*.md` (kebab-case, auto-loaded)
- **Config**: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json`
- **Documentation**: `CLAUDE.md` (uppercase), `README.md`

## MCP Configuration Structure

MCP servers are configured in `.mcp.json` at the plugin root:

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio|http|sse",
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "VAR_NAME": "value"
      }
    }
  }
}
```

## Git Workflow

This repository should be cloned to `~/claude-configs/` and kept synchronized:

```bash
# Initial setup
cd ~
git clone git@github.com:YOUR_USERNAME/claude-configs.git

# Regular sync
cd ~/claude-configs
git pull  # Get updates from other computers
# ... make changes ...
git add .
git commit -m "Descriptive message"
git push  # Share with other computers
```

## Security Considerations

- Never commit credentials, API keys, or certificates
- Use `.gitignore` to prevent accidental commits
- Keep authentication in project-local files (`.env`, gitignored)
- The `.gitignore` already excludes common sensitive patterns

## AL Profile Specifics

### Approval Gates

The AL profile implements mandatory approval gates in workflows:

1. After requirements analysis - user must approve before solution planning
2. After solution planning - user must approve before implementation
3. After code review - user must approve before testing

These gates prevent wasted work and ensure user validation at each phase.

### Iteration Pattern

The `/develop` skill uses iterative refinement:

```
developer agent(s) → code
    ↓
4 reviewer specialists (security, AL expert, performance, test coverage) → review
    ↓
If Critical/Serious issues → ITERATE back to developer agent(s)
If Minor issues → continue to compile/diagnostics
```

See the `feedback-resolution.md` reference doc for severity levels and exit conditions.

### AL Compilation

Use the `/compile` skill, which wraps the `al-compile` CLI. It:

- Auto-detects the VS Code AL extension and uses the matching compiler version
- Auto-detects workspace structure (single vs multi-app)
- Auto-finds all `.alpackages` directories
- Auto-applies ruleset files
- Includes standard analyzers by default
- Writes diagnostics to the task folder

Always use `/compile` (or `al-compile`) instead of manual AL compiler commands. The `Stop`
hook also auto-compiles at turn end via `al-hook-compile.js`.

## Plugin Version Management

Plugins use semantic versioning in `plugin.json`:

- **Major**: Breaking changes (e.g., renamed skills, removed agents)
- **Minor**: New features (e.g., new skills, enhanced agents)
- **Patch**: Bug fixes, documentation improvements

Update the version in `plugin.json` and document changes in the profile's README.md.

## Troubleshooting

### Plugin Not Loading

1. Verify registration in project `.claude/settings.json`
2. Check `extraKnownMarketplaces` path is absolute
3. Validate `plugin.json` syntax
4. Run `/config` in Claude Code to see loaded plugins

### MCP Server Issues

1. Check `.mcp.json` syntax
2. Verify executable paths (e.g., `bc-code-intelligence-mcp` in PATH)
3. Test MCP servers independently
4. Check environment variables are set correctly

### Skill Not Found

1. Ensure the plugin is enabled in project settings
2. Each skill must live in `skills/<skill-name>/SKILL.md` with valid `name`/`description` frontmatter
3. Skill names are kebab-case
4. Restart the Claude Code session if needed

### Changes Not Appearing

1. Settings and CLAUDE.md hot-reload automatically
2. For skill/agent changes, start a new Claude Code session
3. Verify changes are committed and pushed
4. On other computers, verify `git pull` was run

## Best Practices

1. **Test before pushing** - Verify changes work in a test project
2. **Clear commit messages** - Describe what changed and why
3. **Update documentation** - Keep READMEs in sync with changes
4. **Semantic versioning** - Increment version in plugin.json
5. **Backward compatibility** - Avoid breaking changes when possible
6. **Scope plugins narrowly** - One technology/domain per plugin
7. **Document agent inputs/outputs** - Clear data flow in agent definitions
8. **Use approval gates** - Stop for user validation at major decision points
