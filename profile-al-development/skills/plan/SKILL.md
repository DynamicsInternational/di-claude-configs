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

### Step 3b: Standard-First Gate (fit-gap) — MANDATORY

Before any design, challenge the request against the standard product. Architects must never
design something that configuration, a process change, no-code tooling or an installed app
already covers.

1. If `.dev/<task-slug>/01b-fit-gap.md` exists and has a filled `## Decisions` section, read it and continue.
2. Otherwise, run the `/fit-gap` workflow (see `../fit-gap/SKILL.md`: spawn the functional
   consultant agent, challenge its output, get the user's decision).
3. Skip only in the cases listed in the fit-gap skill ("When to Skip": bug fix, refactoring,
   performance, compliance/upgrade, TRIVIAL, or explicit user skip). State the reason in one line.

Outcome:
- **No residual gap** (everything covered at L0-L2, or user chose Stop) → do NOT spawn architects.
  Tell the user the request is covered by the standard and point to `01b-fit-gap.md`. Done.
- **Residual gap exists** → the scope of this plan is **only** the gaps marked for development
  in `01b-fit-gap.md` (plus any fit the user explicitly overrode in `## Decisions`).

### Step 3c: Locate the Existing Feature — MANDATORY

Most requests extend or change something the app already does. Before designing, find where the
residual gap lands in the existing code:
- Check the **Business Rules Map** in `.dev/project-context.md`, then search the workspace for the
  business concepts of the request (LSP references, Grep).
- List the existing objects/procedures that already carry the rules involved.

If the gap **modifies or extends an existing feature**, the plan runs in **Extension mode**:
- The default design is to change the owning code in place; new objects only for what genuinely does not exist.
- A changed requirement replaces the old behavior (code and tests) — no parallel variant kept behind a flag.
- Every architect receives the existing objects list and the constraint "extend in place".

### Step 4: Classify Complexity

Classify the complexity of the **residual gap**, not of the original request. A request that
sounded COMPLEX may shrink to SIMPLE once the standard covers most of it.
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
- The fit-gap file `.dev/<task-slug>/01b-fit-gap.md` (if produced) — design **only** the residual gaps it lists; every object must trace to a gap ID
- The existing objects found in Step 3c, and the Extension mode flag if it applies
- The project's **Extensibility Level** and **Test Policy** (from project context; `PTE` / `none` when not declared)
- A **different starting constraint** to prevent convergence
- The instruction to follow `/bcquality-citation` in **DESIGN** mode (consult BCQuality and cite the applicable rules as design constraints)

**One architect ALWAYS gets the standard-first constraint:**
- "Design **standard-first** — the least code that covers the residual gaps. Reuse standard
  objects, events, setup and installed apps; prefer driving a standard mechanism with thin glue
  code over re-implementing behaviour (e.g. location blocking = dimension value `Blocked` + sync
  from the Location Card, not subscribers on every document). Prefer L3 over L4. You may
  conclude that part of a gap needs no code — say so and explain how."

**In Extension mode, a second architect ALWAYS gets the extend-in-place constraint:**
- "Design by **modifying the existing code in place** — change the procedures that already carry
  the rules, add new objects only for what does not exist. Show which existing procedures change and how."

Assign the other architect(s) different starting constraints such as:
- "Design **idiomatic BC and readable** — the base-app way: one codeunit per business process, flows readable top to bottom, setup read where needed, no layers"
- "Design around **table extensions** on existing BC tables — minimize new tables"
- "Design with **separate custom tables** — minimize coupling to base app"
- "Design for **extensibility within the declared Extensibility Level** — events at stable business boundaries, extensible enums + interfaces for behavior variants"
- "Design with **minimal footprint** — fewest objects, simplest approach that works"

The specific constraints depend on the problem. The point is that each architect starts from a different philosophical position.
Never assign a constraint that asks for interfaces, dependency injection or mocks for testability
— testability comes from simple structure (see the `al-architecture` rule → Testable Without Overhead).

### Step 6: Facilitate Debate

Once all architects complete, review their solutions. Look for:
- Where do they agree? (These are likely correct choices.)
- Where do they disagree? (These are the real design decisions.)
- What did one architect consider that others missed?
- What are the weak points in each approach?

Challenge weak points yourself. You do not need to spawn agents for this — apply your own judgment.

**Over-development check** — for every proposed object, ask:
- Which gap ID does it cover? No gap ID → cut it.
- Does it spread checks/subscribers across many places when a standard mechanism (dimensions
  and their `Blocked` flag, posting groups, workflows, allowed posting dates…) already enforces
  that everywhere and could simply be driven? → replace by glue code feeding the standard.
- Does it re-implement something the standard or an installed app already does (a setup table
  duplicating a standard setup, a custom log duplicating Change Log, a custom approval duplicating
  Workflows)? → cut it or justify explicitly.
- Is the added complexity (new table, interface, factory) proportional to the gap? If the
  standard-first architect covers the same gaps with fewer objects, the burden of proof is on
  the bigger design.
- Does it re-implement a rule the app already carries (Step 3c)? → modify the owner instead.
- Does it add layers: a procedure or codeunit that only forwards, an interface with a single
  implementation, a factory, an event our own app subscribes to? → cut the layer.
- Are the published events within the declared Extensibility Level, at business boundaries? → cut the others.

### Step 7: Synthesize — Start From the Smallest Design

**This is YOUR decision, not the user's.** You are the engineering manager.

Synthesis is **subtractive, not a union** of the proposals:
1. Take the **smallest design that covers every residual gap** (fewest objects, shortest call
   chains, fewest published events and interfaces) — usually the standard-first or extend-in-place
   proposal — as the base.
2. Import an element from another proposal **only** if it covers a gap the base misses, or removes a
   concrete, stated risk (upgrade, performance, security, data integrity). Record each import with its
   gap ID or risk in the plan. "More robust", "more extensible" or "cleaner separation" are not reasons.
3. Never merge two mechanisms for the same need (e.g. an event and an interface for one variation point).

Then check the result against:
- BC-native patterns and conventions
- Readability and ease of change — a developer must follow each business action without jumping through layers; the next brick must slot in by modifying, not stacking
- Upgrade safety (will this survive BC major version updates?)
- Implementation complexity vs. benefit — **default to the standard-first design** unless another
  approach brings a concrete, stated benefit for the residual gaps
- **Long-term maintenance for the client** — upgrade safety across BC major versions, surface
  touched in standard processes, isolation/removability. The goal is not zero custom code but
  the smallest footprint that covers the need well; a justified richer design is acceptable
- Team familiarity with the patterns

### Step 8: Write Solution Plan

Write `.dev/<task-slug>/02-solution-plan.md` yourself. This is YOUR synthesis — do not copy-paste architect output. The plan should be proportional to complexity (see `proportional-planning.md`).

Structure:
- Architecture & Design (approach, BC integration points, alternatives considered with brief rationale for rejection)
- **Reuse & Extension** — existing objects/procedures reused or modified in place (from Step 3c and the Business Rules Map), and the business rules this plan adds, changes or removes with their owning procedure. "None — new feature" only when Step 3c found nothing.
- **Test Approach** — per the project's Test Policy: `none` → key acceptance scenarios to verify manually; `light` → the critical business rules to test through their entry points; `full` → every business scenario to test through its entry points (behavior, not internals). No interfaces or injection planned for testing.
- **Gap Traceability** — table mapping each gap ID from `01b-fit-gap.md` to the objects that cover it. Every object appears at least once; every gap marked for development is covered.
- **Minimal Option** — the standard-first alternative (objects count, what it does NOT cover) if it was not retained, so the user can still choose it
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
- **Minimal Option** — Switch to the standard-first alternative
- **Refine** — Need to adjust specific aspects (ask what to change)
- **Review Alternatives** — Want to see more detail on rejected approaches
- **Stop** — Park this for now

## Rules

- **Standard first, not standard only.** Never design before the fit-gap gate (Step 3b). Scope = residual gap only. Specific development is fine when justified — keep its footprint and maintenance cost minimal.
- **No object without a gap ID.** Untraceable objects are over-development — cut them.
- **Modify before adding.** When the gap touches an existing feature, changing its code in place is the default; a new layer next to it needs a stated reason.
- **Assign DIFFERENT starting points** to prevent architects from converging on the same solution. The whole point is competitive design.
- **Challenge weak points yourself.** Do not just pick the longest or most detailed plan. Look for the one that best fits BC patterns and the specific requirements.
- **Synthesize from the minimum.** Your plan should be better than any individual architect's output because it is the smallest design that covers the gaps — not because it combines everything each of them proposed.
- **Follow proportional planning.** A 3-file change does not need a 500-line plan. Read `proportional-planning.md` and enforce it.
- **Agent output is working material.** Architects write to temporary files if needed. Only your final `02-solution-plan.md` is the deliverable.
