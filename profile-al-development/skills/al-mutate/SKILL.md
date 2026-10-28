---
name: al-mutate
description: Run mutation testing against an AL project using al-mutate (MSDyn365BC.AL.Mutate). Identifies test gaps by applying AST-based mutations and checking whether the test suite catches them via al-runner. No BC instance required. Produces mutations.json and report.md.
---

# /al-mutate — AL Mutation Testing

## Tool Location

`al-mutate` is installed globally in the Docker image (MSDyn365BC.AL.Mutate NuGet package).

**Check if available:**
```bash
al-mutate --help
```

**Full AI agent guide (read this for detailed usage):**
```bash
al-mutate --guide
```

## How It Works

`al-mutate` uses `al-runner` internally — no running BC instance is required. It:
1. Verifies the git working tree is clean (aborts if dirty)
2. Runs baseline tests with `al-runner` (aborts if they fail)
3. Applies AST-based mutations one at a time (compile → test → restore via git)
4. Writes `mutations.json` (append-only) and `report.md`
5. Prints the mutation score

## Prerequisites

- Clean git working tree (enforced — aborts if dirty)
- A test suite that `al-runner` can execute. Tests it reports **not run** cannot kill mutations here;
  `/verify-tests` covers their rules with sampled mutations on BC.
- Check which `al-runner` version `al-mutate` drives (`al-mutate --guide`): AL Runner v2 is frozen,
  v3 runs far more of the Base App.
- No BC instance required

## CLI Reference

```bash
# Scan only — list mutation candidates without executing (safe, no side effects)
al-mutate scan ./src

# Full run — apply mutations and test
al-mutate run ./src --tests ./test/src

# With stubs (for repos with unsupported BC objects)
al-mutate run ./src --tests ./test/src --stubs ./test/stubs

# Limit mutation count (quick CI check)
al-mutate run ./src --tests ./test/src --max 50

# Custom timeout per mutation (seconds)
al-mutate run ./src --tests ./test/src --timeout 30

# Replay previously-survived mutations (after fixing tests)
al-mutate replay mutations.json --tests ./test/src

# Custom log output path
al-mutate run ./src --tests ./test/src --log .dev/task-slug/mutations.json
```

## Mutation Statuses

| Status | Meaning |
|--------|---------|
| KILLED | Tests caught the mutation — good |
| SURVIVED | Tests missed it — test gap |
| COMPILE_ERROR | Mutation broke AL syntax — excluded from score |
| TIMED_OUT | Test run exceeded --timeout — excluded from score |
| OBSOLETE | Source line no longer exists — stale entry |

Score = Killed / (Killed + Survived) × 100%

## Output Files

| File | Description |
|------|-------------|
| `mutations.json` | Append-only log of all mutations across runs |
| `report.md` | Human-readable report with score and survivors |

## Typical Workflow

```bash
# First run — discover test gaps
al-mutate run ./src --tests ./test/src

# Review report.md for survived mutations
# Add tests, commit, then verify fixes:
al-mutate replay mutations.json --tests ./test/src
```

## Handling Results

**Score ≥ 80%:** Healthy test suite. Review survivors for business-critical logic.

**Score < 80%:** Significant gaps. Read `report.md` — each survived mutation points to a missing test. Fix tests, commit, then re-run with `al-mutate replay`.

**COMPILE_ERROR count is high:** May indicate operator misconfiguration. Check `report.md`.

## Integration with /verify-tests

`/verify-tests` calls this tool for its mutation sweep phase. You can also invoke `/al-mutate` directly for a standalone mutation run without the full adversarial audit.

## Troubleshooting

**`Aborted: uncommitted changes detected`**
Commit or stash all changes before running. The tool requires a clean working tree to safely restore mutated files via git checkout.

**`Baseline failed`**
Tests must be green before mutation testing. Run `/run-tests` with `al-runner` to diagnose.

**`You must install or update .NET to run this application`**
The container image may be missing the .NET 8 runtime. `MSDyn365BC.AL.Mutate` targets .NET 8 — it must be present alongside .NET 9.
