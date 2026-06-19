# Claude Code Configuration Repository

This repository contains reusable Claude Code plugin configurations for streamlining development workflows across multiple projects and computers.

## Overview

This setup allows you to:
- Maintain consistent Claude Code configurations across all your projects
- Sync improvements across multiple computers via GitHub
- Compose multiple plugin profiles for specific project needs
- Keep project-specific customizations separate from shared configurations

## Repository Structure

```
claude-configs/
├── .claude-plugin/
│   └── marketplace.json       # Marketplace manifest (lists bundled plugins)
├── profile-al-development/    # AL (Business Central) development profile
│   ├── .claude-plugin/
│   │   └── plugin.json        # Plugin metadata
│   ├── CLAUDE.md              # Lead-as-Manager profile instructions
│   ├── skills/                # Model-invoked skills for AL (/-prefixed)
│   ├── agents/                # Custom subagents for AL
│   ├── rules/                 # Auto-loaded AL guardrails
│   ├── hooks/                 # Auto-compile hooks
│   └── .mcp.json              # AL MCP server configuration
├── .gitignore
└── README.md (this file)
```

## Quick Start Configuration

The plugins work out of the box. The AL profile's `.mcp.json` bundles six MCP servers
(BC Code Intelligence, Microsoft Docs, AL Dependency, BC Source, BCQuality, ALCOPS); any extra
servers you need go in your own user or project settings, not in the plugin.

All paths use `~`, which expands to your home directory automatically.

## Setup Instructions

### Initial Setup (First Computer)

1. **Clone this repository:**
   ```bash
   cd ~
   git clone git@github.com:YOUR_USERNAME/claude-configs.git
   ```

2. **That's it!** The plugins are now available on your computer. You'll enable them per-project (see next section).

### Setup on Additional Computers

Simply clone the repository:
```bash
cd ~
git clone git@github.com:YOUR_USERNAME/claude-configs.git
```

Plugins will be available for use in your projects immediately.

### Using Plugins in Projects

In each project where you want to use these plugins, create or edit `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "local": {
      "source": {
        "source": "directory",
        "path": "~/claude-configs"
      }
    }
  },
  "enabledPlugins": {
    "profile-al-development@local": true
  }
}
```

**Note:** The `~` expands to your home directory automatically.

#### Compose Multiple Profiles

As you add more profiles, you can combine them in a single project:
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
    "profile-al-development@my-configs": true,
    "profile-al-testing@my-configs": true,
    "profile-devops@my-configs": true
  }
}
```

## Workflow for Updating Configurations

### Making Improvements

When you discover a useful pattern or want to improve the configuration:

```bash
cd ~/claude-configs

# Edit files (e.g., profile-al-development/CLAUDE.md)
# Add new commands, update patterns, etc.

git add .
git commit -m "Add pattern for handling table extensions"
git push
```

### Syncing to Other Computers

On your other computer(s):

```bash
cd ~/claude-configs
git pull
```

All your projects immediately benefit from the updates without any additional configuration.

## Available Plugins

### profile-al-development

AL (Application Language) development configuration for Microsoft Dynamics 365 Business Central.

**Includes:**
- AL coding conventions and naming standards
- Best practices for table extensions, events, and error handling
- Performance optimization patterns
- Testing guidelines
- AL MCP server configuration

**Documentation:** See `profile-al-development/README.md`

## Adding New Plugins

To create a new plugin profile:

1. **Create plugin directory:**
   ```bash
   cd ~/claude-configs
   mkdir -p profile-name/{.claude-plugin,skills,agents,rules}
   ```

2. **Create plugin.json:**
   ```json
   {
     "name": "profile-name",
     "description": "Brief description of what this profile provides",
     "version": "1.0.0",
     "author": {
       "name": "Your Name"
     }
   }
   ```

3. **Add configuration files:**
   - `CLAUDE.md` - Memory/instructions
   - `skills/<skill-name>/SKILL.md` - Model-invoked skills
   - `agents/*.md` - Custom subagents
   - `rules/*.md` - Auto-loaded guardrails (optional)
   - `.mcp.json` - MCP server configuration (optional)

4. **Register and document:**
   - Add the plugin to `.claude-plugin/marketplace.json`
   - Create `profile-name/README.md`
   - Update this main README

5. **Commit and push:**
   ```bash
   git add profile-name
   git commit -m "Add profile-name plugin"
   git push
   ```

## Project-Specific Customizations

While plugins provide shared configuration, each project can still have its own customizations:

**Project directory structure:**
```
your-project/
├── .claude/
│   ├── settings.json        # Enable plugins + project-specific settings
│   ├── settings.local.json  # Personal overrides (gitignored)
│   ├── CLAUDE.md            # Project-specific instructions
│   └── commands/            # Project-only commands
```

**How it works:**
1. Plugin configurations load first (from `~/claude-configs/`)
2. Project configurations merge on top (from `your-project/.claude/`)
3. Project settings can override plugin defaults
4. All configurations are additive (commands, skills, etc. from all sources are available)

## Configuration Hierarchy

Claude Code loads configurations in this order (later overrides earlier):

1. **Enterprise managed settings** (if configured)
2. **User settings** (`~/.claude/settings.json`)
3. **User plugins** (registered in user settings)
4. **Project settings** (`.claude/settings.json`)
5. **Project plugins** (enabled in project settings)
6. **Local settings** (`.claude/settings.local.json` - gitignored)

## Security Best Practices

- Never commit sensitive data (credentials, API keys, certificates)
- Use `.gitignore` to prevent accidental commits of sensitive files
- Keep authentication in project-local files (`.env`, gitignored)
- Use permission rules in `settings.json` to deny access to sensitive paths

## Troubleshooting

### Plugin not loading

1. Check plugin registration in `~/.claude/settings.json`
2. Verify path is absolute (not relative)
3. Run `/config` in Claude Code to see loaded plugins
4. Check plugin.json syntax is valid JSON

### Conflicts between plugins

- Commands from different plugins are namespaced automatically
- CLAUDE.md files from all plugins are merged
- Settings follow precedence rules (project > user > plugin)

### Changes not appearing

1. Settings hot-reload automatically (no restart needed)
2. For CLAUDE.md changes, start a new session
3. Verify you committed and pushed changes
4. On other computer, verify you pulled latest changes

## Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Plugin System Documentation](https://docs.claude.com/claude-code/plugins)
- [Configuration Guide](https://docs.claude.com/claude-code/configuration)

## Contributing

This is a personal configuration repository. If you're working in a team:
- Fork this repository for your own configurations
- Or create a team repository with shared configurations
- Use pull requests to review configuration changes

## License

Personal configuration repository. Use as you see fit.
