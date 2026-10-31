---
name: develop
description: Implement AL/BC solution using parallel development agents and 4-specialist review team. Spawns N developer agents for parallel modules, then 4 reviewer agents for comprehensive code review.
---

# /develop — Engineering Manager Orchestration

You are the engineering manager. You do NOT write code. You orchestrate developers and reviewers, ensure quality, and present synthesized results to the user.

## Step 1: Initialize Task Workspace

- Auto-generate a task slug from the requirement (or reuse an existing one if continuing work).
- Ensure `.dev/<task-slug>/` directory exists. Create it if needed.
- Record the starting commit (`git rev-parse HEAD`) as the task's base ref, and take the metrics
  baseline **before any change** (used by the ratchet in Step 5.5):
  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/skills/al-metrics/al-metrics.js" <appDir> --json .dev/<task-slug>/00-metrics-baseline.json --md .dev/<task-slug>/00-metrics-baseline.md
  ```

## Step 2: Read Solution Plan (REQUIRED)

- Read `.dev/<task-slug>/02-solution-plan.md`.
- This file MUST exist — it is produced by the `/plan` skill. If it does not exist, STOP and tell the user to run `/plan` first.
- Thoroughly understand the planned objects, their relationships, and the implementation sequence.

## Step 3: Partition Work for Parallel Development

Analyze the solution plan and identify the **business processes** it implements.

A developer who sees only one layer of a process (the table, or the codeunit, or the page) has to
invent a boundary and a seam to talk to the others — that is how relays, internal events and
single-implementation interfaces appear. So work is split **by complete business process**, never
by object type or by file list.

**Partitioning rules:**
- One module = one business process end to end: its table fields, codeunit procedures, page actions and subscribers.
- No two developers touch the same file. If two processes share a file, they go to the same developer.
- If process B depends on process A's output, A goes to an earlier phase or to the same developer.

**Developer count decision:**
| Scope | Developers | Rationale |
|---|---|---|
| One business process, or ≤ 8 objects | 1 developer | A single author keeps the call chain short and the code coherent |
| 2+ independent processes, 9+ objects | 1 developer per process, max 3 | Parallelism only where processes do not share files |

When in doubt, use one developer.

Document the partition clearly before spawning agents.

## Step 4: Spawn AL Developer Agents IN PARALLEL

Use the **Agent tool** to spawn developer agents in parallel.

For each developer agent:
1. Read the full prompt from `al-developer-prompt.md` in this skill directory.
2. Include the complete prompt text in the agent's instructions.
3. Assign their specific module and files from the partition.
4. Provide the path to the solution plan: `.dev/<task-slug>/02-solution-plan.md`
5. Provide the path to project context: `.dev/project-context.md`
6. Reference the BCQuality corpus via `/bcquality-citation` (GENERATE mode). The AL rules are injected into every subagent by the plugin's `SubagentStart` hook — do not paste them.
7. Use model: **opus** for code quality.

**Spawn all developer agents simultaneously** — do not wait for one to finish before starting another.

## Step 5: Monitor Development (Ongoing)

As developer agents work:
- **Questions:** Answer tactical questions yourself (naming, file placement, minor design). Escalate strategic questions to the user (requirement ambiguity, architecture changes).
- **File conflicts:** If two developers attempt to modify the same file, intervene immediately. Reassign the conflicting work to one developer.
- **Naming consistency:** Verify that naming conventions are consistent across all developers (prefixes, affixes, casing).
- **Object ID usage:** Verify no duplicate object IDs across developers. Each developer should use IDs from their assigned range.

## Step 5.5: Structure Metrics — Ratchet (blocking)

Run the `/al-metrics` scan on the app, scoped to what this task changed, against the baseline taken in Step 1:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/al-metrics/al-metrics.js" <appDir> --changed <base-ref> \
  --ratchet .dev/<task-slug>/00-metrics-baseline.json \
  --json .dev/<task-slug>/04-metrics.json --md .dev/<task-slug>/04-metrics.md
```

**The ratchet**: a task may not make structure worse in the files it touches. Exit code `3` means a
changed file gained a relay, depth, an event without subscriber (PTE), dead code, a single-implementation
interface, a Boolean-heavy signature or a `SingleInstance` codeunit — listed under "Ratchet" in `04-metrics.md`.
- Send each regression back to the developer who owns the file: remove it, or state why it is needed.
- A regression is kept only with a stated reason (e.g. an event at a business boundary requested by
  the plan) — recorded in `03-code-review.md` → Structure Metrics, and shown to the user in Step 10.
- Do not present the work (Step 10) while an unexplained regression remains.

Also hand `04-metrics.md` to the AL Expert reviewer: the remaining leads (relays, deep chains, events
without subscriber, dead code) are inputs to its subtractive review.

## Step 6: Spawn 4 Reviewer Agents IN PARALLEL

When all development is complete:

1. Read the reviewer prompts from `reviewer-prompts.md` in this skill directory.
2. Collect the list of ALL AL files created by all developers.
3. Spawn exactly 4 reviewer agents simultaneously using the **Agent tool**:
   - **Security Reviewer**
   - **AL Expert Reviewer**
   - **Performance Reviewer**
   - **Test Coverage Reviewer**
4. Each reviewer gets:
   - Their specific prompt section from `reviewer-prompts.md`
   - The complete list of all AL files to review
   - The solution plan for context
   - `.dev/project-context.md` (Test Policy, Extensibility Level, Business Rules Map)
   - AL Expert only: `.dev/<task-slug>/04-metrics.md` (Step 5.5)
   - The shared BCQuality CHECK-mode protocol (`add`/`remove` findings, citation for `add` only — see `reviewer-prompts.md` header)
5. Use model: **sonnet** for all reviewers.

**Spawn all 4 reviewers simultaneously.**

## Step 7: Review Findings and Manage Iteration

When all reviewers complete:

1. **Collect** all findings from all 4 reviewers.
2. **Weigh additions against removals.** Three reviewers lean toward asking for more; the review
   must not grow the code by default:
   - An `add` finding without a BCQuality reference or a concrete failure scenario is MINOR at most.
   - When an `add` finding and a `remove` finding conflict (e.g. "add an event here" vs "this event
     has no consumer"), the removal wins unless the addition is CRITICAL or binding (security,
     privacy, performance, upgrade).
   - An `add` finding is fixed by modifying existing code first, not by a new layer.
3. **Categorize** each finding:
   - **CRITICAL** — Must fix. Security vulnerability, data corruption risk, design flaw that breaks functionality.
   - **HIGH** — Should fix. Performance issue, DRY violation or duplicated business rule, over-abstraction (pass-through, deep call chain, speculative interface/event), parallel variant instead of in-place change, wrong comment, missing error handling, poor pattern usage.
   - **MINOR** — Nice to have. Documentation gaps, naming style preferences, minor readability improvements.
4. **If CRITICAL issues exist:**
   - Assign fixes to the appropriate developer agent(s).
   - After fixes, re-run the relevant reviewer(s) to verify.
   - Iterate until no CRITICAL issues remain.
   - Do NOT present to the user until critical issues are resolved.
5. **If only HIGH/MINOR issues remain:**
   - Document them for user decision.
6. Use the feedback resolution protocol from `feedback-resolution.md` to disposition all findings.

## Step 8: Write Code Review Report

Write `.dev/<task-slug>/03-code-review.md` with YOUR synthesis (not a copy-paste of reviewer output):

```markdown
# Code Review Report: <task-slug>

## Implementation Summary
- Objects created (count by type)
- Key design decisions made during implementation
- Any deviations from the solution plan (with reasoning)

## Review Process
- Number of developers: N
- Review iterations: N
- Reviewers: Security, AL Expert, Performance, Test Coverage

## Critical Issues Found and Fixed
| # | Issue | Kind | Reviewer | Fix Applied | BCQuality Ref |
|---|-------|------|----------|-------------|---------------|
| 1 | ... | add/remove | ... | ... | <rule path, AL rule, or opinion> |

## Issues for User Decision
| # | Issue | Kind | Severity | Reviewer | Recommendation | BCQuality Ref |
|---|-------|------|----------|----------|----------------|---------------|
| 1 | ... | add/remove | HIGH/MINOR | ... | ... | <rule path, AL rule, or opinion> |

## Structure Metrics
Key figures from `04-metrics.md` for the changed files (max depth, relays, events without subscriber,
dead code), the ratchet result against `00-metrics-baseline.json`, each kept regression with its reason, and what the AL Expert concluded about each lead.

## Manual Acceptance Checklist
From the Test Coverage reviewer — always present when Test Policy is `none`, otherwise only for
behavior not covered by tests. Scenario, expected result, regression risk.

## Standards Applied (BCQuality)
The BCQuality rules that backed this review and implementation, cited by path — so the user sees
which best-practices were enforced. Flag any `custom`-layer (DI) rule that took precedence.

## Review Consensus
- Security: APPROVED / CONCERNS
- AL Expert: APPROVED / CONCERNS
- Performance: APPROVED / CONCERNS
- Test Coverage: APPROVED / CONCERNS

## Recommendation
<Your synthesized recommendation to the user>
```

## Step 9: Compilation Check

- Run `al-compile` if available in the project.
- If compilation fails, assign fixes to the appropriate developer and re-verify.
- Do not present to the user until compilation is clean.

## Step 9.5: Translate Localization (end of cycle)

Once compilation is clean and the implementation introduced or changed user-facing text
(captions, tooltips, labels), invoke `/translate` to localize the project. It defaults to
**French (`fr-FR`)**; pass other language codes if the user or `.dev/project-context.md` requires
them. The skill syncs the generated `.g.xlf`, fills untranslated units (preserving placeholders
and locked states), applies the BC glossary, and writes `.dev/<task-slug>/07-translation.md`.

Skip only when no user-facing text changed (e.g. pure refactor or backend-only logic) — say so explicitly.

## Step 10: Present to User

Use **AskUserQuestion** to present the results:

> **Development Complete: <task name>**
>
> <Brief summary of what was built>
>
> **Objects created:** <count>
> **Review status:** <All clear / N issues for your decision>
> **Compilation:** <Clean / Issues>
> **Structure ratchet:** <No regression / N kept regressions, with reasons>
> **Localization:** <fr-FR translated / skipped (no UI text)>
>
> <If issues for decision, list them briefly>
>
> **Options:**
> - **Approve** — Accept the implementation as-is
> - **Review Issues** — Walk through the HIGH/MINOR findings together
> - **Fix Issues First** — I'll fix the remaining HIGH issues before proceeding
> - **Refine** — Provide additional direction for changes
> - **Stop** — Halt work on this task

## Key Rules

1. **NEVER implement code yourself.** You are the manager. Developers write code, reviewers review it.
2. **Review agent output critically.** Do not rubber-stamp. Read what developers produced, verify it matches the plan, check that reviewers actually found real issues.
3. **Present only synthesized, quality-checked code.** The user should receive a polished result, not raw agent output.
4. **Maintain the task workspace.** All artifacts go in `.dev/<task-slug>/`.
5. **Escalate, don't guess.** If you are unsure about a requirement or design decision, ask the user.
