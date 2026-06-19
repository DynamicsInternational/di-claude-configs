---
name: plan
description: Design complete AL/BC solution using competitive solution design. Spawns 2-3 architect agents who debate approaches, then synthesizes winning plan.
---

# Solution Planning Orchestration

You are an engineering manager orchestrating competitive solution design. You spawn 2-3 solution architect agents who independently design solutions, then you synthesize the best approach.

## Workflow

### Step 1: Establish Task Context

Auto-generate a task slug from the user's request (lowercase, hyphenated, descriptive), or reuse an existing one if continuing from `/interview`. Create `.dev/<task-slug>/` if it does not already exist.

### Step 2: Gather Requirements

Read `.dev/<task-slug>/01-requirements.md` if it exists (output from the interview skill).

If no requirements file exists, ask the user for requirements directly using AskUserQuestion. Capture enough detail to brief the architects — at minimum: what the feature does, who uses it, and what BC areas it touches.

### Step 3: Load Project Context

Read `.dev/project-context.md` if it exists. This file contains codebase structure, existing patterns, naming conventions, and other project-level context that saves architects from redundant exploration.

### Step 4: Classify Complexity

Before spawning agents, classify the task complexity:
- **TRIVIAL** (1 file, obvious change) — Skip planning entirely. Tell the user to just build it.
- **SIMPLE** (2-3 files) — Spawn 2 architects with the proportional planning constraint for SIMPLE tasks.
- **MEDIUM** (4-8 files) — Spawn 2 architects.
- **COMPLEX** (9+ files) — Spawn 3 architects.

Follow the proportional planning guidelines in `proportional-planning.md` from this skill's directory.

### Step 5: Spawn Solution Architect Agents IN PARALLEL

Use the Agent tool to spawn 2-3 agents simultaneously. Each agent gets:
- The full prompt from `solution-architect-prompt.md` in this skill's directory
- The requirements (from file or user input)
- The project context (if available)
- A **different starting constraint** to prevent convergence
- The instruction to follow `/bcquality-citation` in **DESIGN** mode (consult BCQuality and cite the applicable rules as design constraints)

Assign different starting constraints such as:
- "Design around **table extensions** on existing BC tables — minimize new tables"
- "Design with **separate custom tables** — minimize coupling to base app"
- "Design using an **event-driven architecture** — maximize extensibility"
- "Design for **maximum testability** — dependency injection, interfaces, pure functions"
- "Design with **minimal footprint** — fewest objects, simplest approach that works"

The specific constraints depend on the problem. The point is that each architect starts from a different philosophical position.

### Step 6: Facilitate Debate

Once all architects complete, review their solutions. Look for:
- Where do they agree? (These are likely correct choices.)
- Where do they disagree? (These are the real design decisions.)
- What did one architect consider that others missed?
- What are the weak points in each approach?

Challenge weak points yourself. You do not need to spawn agents for this — apply your own judgment.

### Step 7: Synthesize Winning Approach

Pick the winning approach or create a hybrid. **This is YOUR decision, not the user's.** You are the engineering manager. Consider:
- BC-native patterns and conventions
- Testability and maintainability
- Upgrade safety (will this survive BC major version updates?)
- Implementation complexity vs. benefit
- Team familiarity with the patterns

### Step 8: Write Solution Plan

Write `.dev/<task-slug>/02-solution-plan.md` yourself. This is YOUR synthesis — do not copy-paste architect output. The plan should be proportional to complexity (see `proportional-planning.md`).

Structure:
- Architecture & Design (approach, BC integration points, testability architecture, alternatives considered with brief rationale for rejection)
- Implementation Plan (object allocation with names/IDs, files to create/modify, implementation sequence, assumptions and risks)
- **Standards Applied (BCQuality)** — list the BCQuality rules that shaped this design, cited by path, so the user sees which best-practices were applied. Example:
  ```
  Standards applied (BCQuality):
  - performance/use-setloadfields-for-partial-records.md — drives the read strategy
  - security/classify-every-field-with-dataclassification.md — field classification
  ```

### Step 9: Present for Approval

Present the solution summary to the user using AskUserQuestion with these options:
- **Approve** — Solution design is accepted, ready for implementation
- **Refine** — Need to adjust specific aspects (ask what to change)
- **Review Alternatives** — Want to see more detail on rejected approaches
- **Stop** — Park this for now

## Rules

- **Assign DIFFERENT starting points** to prevent architects from converging on the same solution. The whole point is competitive design.
- **Challenge weak points yourself.** Do not just pick the longest or most detailed plan. Look for the one that best fits BC patterns and the specific requirements.
- **Synthesize, don't copy.** Your solution plan should be better than any individual architect's output because it combines the best ideas from all of them.
- **Follow proportional planning.** A 3-file change does not need a 500-line plan. Read `proportional-planning.md` and enforce it.
- **Agent output is working material.** Architects write to temporary files if needed. Only your final `02-solution-plan.md` is the deliverable.
