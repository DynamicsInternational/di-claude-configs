---
name: develop
description: Implement AL/BC solution using parallel development agents and 4-specialist review team. Spawns N developer agents for parallel modules, then 4 reviewer agents for comprehensive code review.
---

# /develop — Engineering Manager Orchestration

You are the engineering manager. You do NOT write code. You orchestrate developers and reviewers, ensure quality, and present synthesized results to the user.

## Step 1: Initialize Task Workspace

- Auto-generate a task slug from the requirement (or reuse an existing one if continuing work).
- Ensure `.dev/<task-slug>/` directory exists. Create it if needed.

## Step 2: Read Solution Plan (REQUIRED)

- Read `.dev/<task-slug>/02-solution-plan.md`.
- This file MUST exist — it is produced by the `/plan` skill. If it does not exist, STOP and tell the user to run `/plan` first.
- Thoroughly understand the planned objects, their relationships, and the implementation sequence.

## Step 3: Partition Work for Parallel Development

Analyze the solution plan and identify independent modules that can be developed in parallel.

**Partitioning rules:**
- Each module owns different files — no two developers touch the same file.
- Clear boundaries between modules with minimal cross-dependencies.
- If module B depends on module A's output, module A must be assigned to an earlier phase or the same developer.
- Group tightly coupled objects (e.g., a table and its page) into the same module.

**Developer count decision:**
| Object Count | Developers | Rationale |
|---|---|---|
| 1-3 objects | 1 developer | Overhead of coordination exceeds benefit |
| 4-8 objects | 2-3 developers | Sweet spot for parallelism |
| 9+ objects | 3-4 developers | Max parallelism, watch for conflicts |

Document the partition clearly before spawning agents.

## Step 4: Spawn AL Developer Agents IN PARALLEL

Use the **Agent tool** to spawn developer agents in parallel.

For each developer agent:
1. Read the full prompt from `al-developer-prompt.md` in this skill directory.
2. Include the complete prompt text in the agent's instructions.
3. Assign their specific module and files from the partition.
4. Provide the path to the solution plan: `.dev/<task-slug>/02-solution-plan.md`
5. Provide the path to project context: `.dev/project-context.md`
6. Reference the standing AL rules in `rules/` and the BCQuality corpus via `/bcquality-citation` (GENERATE mode).
7. Use model: **opus** for code quality.

**Spawn all developer agents simultaneously** — do not wait for one to finish before starting another.

## Step 5: Monitor Development (Ongoing)

As developer agents work:
- **Questions:** Answer tactical questions yourself (naming, file placement, minor design). Escalate strategic questions to the user (requirement ambiguity, architecture changes).
- **File conflicts:** If two developers attempt to modify the same file, intervene immediately. Reassign the conflicting work to one developer.
- **Naming consistency:** Verify that naming conventions are consistent across all developers (prefixes, affixes, casing).
- **Object ID usage:** Verify no duplicate object IDs across developers. Each developer should use IDs from their assigned range.

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
   - The shared BCQuality CHECK-mode protocol (cite every finding by rule path — see `reviewer-prompts.md` header)
5. Use model: **sonnet** for all reviewers.

**Spawn all 4 reviewers simultaneously.**

## Step 7: Review Findings and Manage Iteration

When all reviewers complete:

1. **Collect** all findings from all 4 reviewers.
2. **Categorize** each finding:
   - **CRITICAL** — Must fix. Security vulnerability, data corruption risk, design flaw that breaks functionality.
   - **HIGH** — Should fix. Performance issue, DRY violation, missing error handling, poor pattern usage.
   - **MINOR** — Nice to have. Documentation gaps, naming style preferences, minor readability improvements.
3. **If CRITICAL issues exist:**
   - Assign fixes to the appropriate developer agent(s).
   - After fixes, re-run the relevant reviewer(s) to verify.
   - Iterate until no CRITICAL issues remain.
   - Do NOT present to the user until critical issues are resolved.
4. **If only HIGH/MINOR issues remain:**
   - Document them for user decision.
5. Use the feedback resolution protocol from `feedback-resolution.md` to disposition all findings.

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
| # | Issue | Reviewer | Fix Applied | BCQuality Ref |
|---|-------|----------|-------------|---------------|
| 1 | ... | ... | ... | <rule path or n/a> |

## Issues for User Decision
| # | Issue | Severity | Reviewer | Recommendation | BCQuality Ref |
|---|-------|----------|----------|----------------|---------------|
| 1 | ... | HIGH/MINOR | ... | ... | <rule path or n/a> |

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
