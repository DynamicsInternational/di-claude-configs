---
name: build-tools
description: Quick reference for AL build pipeline. Auto-load when compilation, deployment, or testing is mentioned. For running commands, use /compile, /publish, or /run-tests.
user-invocable: false
---

# Build Tools Quick Reference

## Standard Cycles

**Fast test loop (no BC required — al-runner, whole suite):**
```
/compile → al-runner test ./app ./test
```

**Reference test run (BC required — sandbox, ALTool or container):**
```
/compile → /publish → /run-tests (bc-test)
```

Or as shell commands:
```bash
# Fast loop
al-compile && al-runner test ./app ./test

# Reference run in a container
al-compile && bc-publish && bc-test
```

## Tool Summary

| Tool | Purpose | Skill | BC Required? |
|------|---------|-------|-------------|
| `al-compile` | Compile AL project with analyzers | `/compile` | No |
| `al-runner` | Run the test suite in memory (fast loop, Base App compiled from source) | `/run-tests` | No |
| `lethal` (LethAL) | Mutation testing to validate test quality | `/al-mutate` | Yes for `bcdev` (authoritative); no for `al-runner-v3` (not on Windows) |
| `bc-publish` | Deploy .app to BC server | `/publish` | Yes |
| `bc-test` | Run full integration tests via BC OData API | `/run-tests` | Yes |

## Config

`bc-publish` and `bc-test` read from `.bcconfig.json` in project root. Create with `bc-publish --init`.

`al-runner` works directly from AL source directories — no config file needed. LethAL reads `lethal.config.json` (`lethal init`).

See individual skills (`/compile`, `/publish`, `/run-tests`, `/al-mutate`) for full options and usage.
