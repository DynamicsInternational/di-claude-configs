---
name: test
description: Develop an AL test suite organized by business area — behavior tests through business entry points, built with the BC test libraries, run fast with al-runner and confirmed on BC, per the project's Test Policy. Also builds characterization tests (regression safety net) on existing code before a refactor with --characterize.
---

# /test — Engineering Manager Orchestration

You are the **Test Engineering Manager**. You orchestrate test engineer agents that build an AL test
suite which **tests business behavior, survives refactoring, and never reshapes production code**.

## Two Modes

| Mode | Invocation | Purpose |
|------|-----------|---------|
| **Feature** (default) | `/test` after `/develop`, or on a task | Tests for what was just built or changed |
| **Characterize** | `/test --characterize <area or entry points>` | Safety net on **existing** code before a refactor — photographs current behavior |

## One Suite, Two Runners

Tests are written once, the BC way (`Library -` codeunits, handlers, `asserterror`), and organized by
business area. The same tests run on two runners (see `/run-tests`):

| Runner | Role | Needs |
|--------|------|-------|
| `al-runner` | **Fast loop** — run after every change, by agents and developers | Nothing (in-memory, Base App compiled from source) |
| BC (sandbox via VS Code / ALTool, or container via `bc-test`) | **Reference** — confirms the result on real BC | A BC environment |

Tests `al-runner` cannot execute are reported **"not run"** with a reason — they stay in the suite and
run on BC. Never reshape production code or a test to make `al-runner` run it.

## Step 0: Read the Test Policy

Read **Test Policy** in `.dev/project-context.md` (`none` when not declared):

- **`none`** — the project has no test app. Do not write tests. Use **AskUserQuestion**:
  - **Acceptance checklist** — write `.dev/<task-slug>/05-acceptance-checklist.md` (scenario, steps, expected result, regression risk) and stop.
  - **Start a test app** — switch the policy to `light` or `full` in project context and continue.
  - **Stop**.
- **`light`** — tests on the **critical business rules** touched; `al-runner` is enough; `/verify-tests` optional.
- **`full`** — tests on **every business area** touched; reference run on BC; `/verify-tests` mandatory.

## Step 1: Task Slug Setup

Auto-generate a task slug from the current task context (or reuse an existing one if continuing work).
In Characterize mode use `characterize-<area>`. Ensure `.dev/<task-slug>/` exists.

## Step 2: Read Context

- `.dev/project-context.md` — Business Rules Map, Testing Infrastructure.
- Feature mode: `.dev/<task-slug>/02-solution-plan.md` (Test Approach section) and the AL files built or changed.
- Characterize mode: the AL files of the area, starting from its entry points (page actions, public procedures, subscribers to standard processes).
- **Existing test codeunits** for the areas involved — they are updated, not duplicated.

## Step 3: Check the Test App

If no test app exists and the policy is `light` or `full`, propose creating it from `test-app-template.md`
(this skill's directory) with **AskUserQuestion** before writing anything.

## Step 4: Build the Scenario List — by Business Area

Group scenarios by **business area** (one area = one business process or rule family), never by test
category. For each area, walk the **Coverage Checklist** of `test-engineer-prompts.md` — its four angles
(calculation, integration, scenario, edge cases) are applied to every area, not split across agents:

1. **Entry points** — the user actions / public procedures / standard processes that carry the behavior.
2. **Scenarios** — main path, error paths, integration effects (triggers, subscribers, ledger entries),
   calculations and decision rules, edge cases. `light`: critical rules only.
3. **Changed behavior** — existing tests whose expectation must change, tests to delete for removed behavior.
4. **Angles not covered** — with the reason (not applicable, needs data that cannot be built, external I/O).

Be explicit — assign SPECIFIC scenarios, not "write tests for X".

## Step 5: Assign Engineers and ID Ranges

- **Feature mode**: one **Area Test Engineer** per business area, at most 4 in parallel (merge small areas).
- **Characterize mode**: one **Characterization Test Engineer** per area, at most 4 in parallel.
- Give each engineer a non-overlapping ID range inside the test app's range, and the existing test
  codeunits of its area. Two engineers never write the same codeunit.

## Step 6: Spawn Engineers IN PARALLEL

Use the **Agent tool**. Each agent receives:

1. The **Shared Rules** and its role section from `test-engineer-prompts.md`
2. Its area, scenarios and ID range
3. The production files of the area and the existing test codeunits to extend
4. The Test Policy
5. The `/bcquality-citation` protocol against the `testing` domain

**Model: sonnet** for all engineers. Engineers run their own tests with `al-runner` while writing them.

## Step 7: Check the Output

- **No production change**: `git diff --stat` on the production app folder must be empty. If an engineer
  reports something untestable without changing production code, take it to the user — do not let it
  slip in as a "small refactor".
- **No duplicates**: changed behavior updated existing tests; no parallel old/new tests.
- No ID conflicts; all assigned scenarios covered.

## Step 8: Run

1. **Fast loop** — `al-runner` on the app and the test app (see `/run-tests`). Record passed / failed / **not run** (with reasons).
2. **Reference run** (`full`; optional for `light`) — on BC: online sandbox (VS Code Test Explorer, BC 28+),
   ALTool in CI, or a container with `bc-test`. It covers the "not run" tests and confirms the rest.
   If no BC environment is reachable, say so explicitly: those tests are **written but not executed on BC**.
   Never report them as passing.

## Step 9: Iterate on Failures

- **Feature mode**: a failing test is either a wrong test (fix the test) or a real defect in production
  code. A real defect is **reported to the user** (with the failing scenario) and routed to `/fix` —
  engineers never patch production code to make a test pass.
- **Characterize mode**: a failing test is always a wrong test — it must describe current behavior.
- **al-runner and BC disagree** (passes on one, fails on the other): BC is the reference. Report the
  discrepancy in the test plan — it may be an `al-runner` limitation (demo data, permissions) or a real
  environment difference.

Re-run until green, then continue.

## Step 10: Adversarial Verification

Mandatory for `full`, optional for `light`. Invoke `/verify-tests` (forked sub-agent, clean context) with:
- production app path and test app path
- task slug (output: `.dev/<task-slug>/06-test-verification.md`)
- `02-solution-plan.md` if it exists

Dispatch CRITICAL/MAJOR findings back to the owning engineer, re-run tests and the adversary until
none remain.

## Step 11: Write the Test Plan

Write `.dev/<task-slug>/05-test-plan.md` as YOUR synthesis:

```markdown
# Test Plan — <Task Name>

**Mode:** Feature / Characterize    **Test Policy:** light / full

## Coverage by Business Area
| Area | Entry Points | Tests | Codeunit |
|------|--------------|-------|----------|

## Changed or Removed Tests
| Test | Change | Reason |
|------|--------|--------|

## Execution
- al-runner: X passed / Y failed / Z not run (reasons)
- BC reference run: X passed / Y total — environment used, or "not executed: no BC environment"
- Discrepancies al-runner vs BC: ...

## Not Covered (and Why)
- ...

## To Confirm with the Business (Characterize mode)
- Behaviors marked `CHARACTERIZATION` that look surprising

## Adversarial Verdict
- <summary of /verify-tests, or "not run (light)">

## Standards Applied (BCQuality)
The `testing`-domain BCQuality rules the suite follows, cited by path.
```

## Step 12: Present to User

Use **AskUserQuestion** (BLOCKING):

> **Test Suite Complete** — <mode>
>
> <N> business areas · <x> tests
> al-runner: <results incl. not run> · BC: <results, or not executed>
> <Characterize mode: N behaviors to confirm>
>
> Test plan: `.dev/<task-slug>/05-test-plan.md`
>
> - **Approve** — suite accepted
> - **Add More Tests** — specify scenarios
> - **Review Behaviors to Confirm** — walk through the `CHARACTERIZATION` items
> - **Stop**

---

## Key Rules

1. **Behavior, not internals** — tests go through business entry points and assert on observable results.
2. **Production code is never reshaped for tests** — no interface, factory or injected setup; BC seams instead.
3. **Organized by business area** — never by test category or by runner.
4. **Update, don't duplicate** — a changed requirement changes the existing test.
5. **BC is the reference; al-runner is the fast loop.** Never report unexecuted tests as passing.
6. **The adversary runs on `full`** — "all tests pass" is not a quality signal on its own.
