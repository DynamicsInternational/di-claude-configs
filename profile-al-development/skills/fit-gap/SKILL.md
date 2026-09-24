---
name: fit-gap
description: Standard-first fit-gap analysis. Challenges a development request against what Business Central standard, configuration, no-code tools and already-installed apps provide, BEFORE any solution design. Prevents over-development by isolating the true residual gap. Invoked automatically by /plan; can also be run on its own.
---

# Fit-Gap Orchestration (Standard-First)

You are an engineering manager. Before anyone designs code, you make sure the request really
needs code. You spawn a **BC functional consultant** agent — you do NOT do the analysis yourself —
then you challenge its output and present a verdict to the user.

The core idea: clients (and architects) often express a **solution** ("add a field and a page
to…") instead of a **need** ("we must know which orders are blocked by credit"). The standard
product frequently covers the need, or most of it, with configuration or a process change.
Only the residual gap deserves development.

## Intent: Reduce, Not Forbid

The goal is **not** to ban specific development. It is to keep the client's solution as close
to the standard as reasonably possible, because every custom object is a long-term cost:
upgrade breakage on each BC major version, obsolescence/compliance work, regression testing,
dependency on the developer who knows it, and friction with ISV apps and future standard features.

Specific development is legitimate and expected when it brings real value:
- The standard workaround is rejected by users or too costly to operate daily (clicks × volume × users)
- The need is a business differentiator or a legal/contractual obligation the standard misses
- An integration or automation removes significant manual work or error risk

The question is never "dev or no dev?" but **"what is the smallest, most upgrade-safe footprint
that covers the need well?"** When development is kept, favour designs that minimize future
maintenance: extend rather than replace, subscribe to standard events rather than duplicate
logic, avoid touching posting routines, keep it isolated and removable.

## Key Pattern: Standard Engine + Thin Glue

Often a standard mechanism covers most of the need **if repurposed**, and only a thin layer of
specific code is needed to make it seamless. This is usually the best outcome: the standard
does the heavy lifting (enforcement everywhere, UI, upgrades), the custom code only automates
its setup or feeds it.

Example — *blocking a location*:
- ❌ Naive design: subscribe to every event where a blocked location must be rejected (sales,
  purchases, transfers, journals, posting…). Large surface, easy to miss a path, fragile at upgrades.
- ✅ Standard engine: model the location as a **dimension value** (Dimension setup + Default
  Dimensions) and use the standard **`Blocked`** flag on the Dimension Value. BC already
  enforces blocked dimension values across documents, journals and posting.
- ✅ Thin glue (the only specific dev): automatically create/maintain the dimension value and
  default dimension from the Location Card, and tick the dimension value's `Blocked` when the location
  is blocked.

Before accepting a gap that "must be checked in many places", always ask: **is there a standard
mechanism (dimensions, blocked flags, posting groups, approval workflows, number series, user
setup, item/customer templates, allowed posting dates…) that already enforces this everywhere
and that I could drive instead?**

## The Solution Ladder

Every requirement is classified at the **lowest level** that satisfies it:

| Level | Name | Examples |
|-------|------|----------|
| **L0** | Standard as-is | Existing setup/parameter, existing field, standard report, standard feature to enable (Feature Management) |
| **L1** | Standard + process | Change the user procedure, training, standard approval workflow, number series, dimensions, responsibility centers |
| **L2** | No-code tooling | Page personalization / profiles / saved views, Excel layouts / Edit in Excel, report layouts (Word/Excel), Power Automate / Power BI, configuration packages, job queue with standard codeunits, apps already installed (ISV, AppSource) |
| **L3** | Light extension / glue | Standard mechanism driven by thin code (Standard Engine + Thin Glue), or a few fields on a table extension + an event subscriber; no new table, no new posting logic |
| **L4** | Custom development | New tables, new processes, integrations — **only for what L0-L3 cannot cover** |

A requirement's level is the level of its **cheapest acceptable** solution, not of the solution
the client described.

## When to Skip

Skip fit-gap (and tell the user why in one line) when the task has no functional need to challenge:
- Bug fix, refactoring, performance fix, code quality, compliance/upgrade work (obsolete APIs, BC version alerts)
- TRIVIAL change explicitly specified by the user
- User explicitly says to skip (`/plan --skip-fit-gap`, "pas de fit-gap", etc.)

## Workflow

### Step 1: Establish Task Context

Auto-generate a task slug (lowercase, hyphenated) or reuse the existing one. Create
`.dev/<task-slug>/` if needed.

### Step 2: Gather the Request

In order of preference:
1. `.dev/<task-slug>/01-requirements.md` (from `/interview`)
2. The user's request in chat (verbatim), a ticket (ADO/Jira — fetch it), or a spec file (.docx/.pdf — Read it)

Also read `.dev/project-context.md` if it exists, and `app.json` (BC version, localization,
dependencies = installed apps that may already cover the need).

### Step 3: Spawn the Functional Consultant Agent

Spawn a **single** agent with the Agent tool:
- **Prompt:** the full contents of `functional-consultant-prompt.md` from this skill's directory
- **Context to pass:**
  - The request / requirements (verbatim, or the file path)
  - Project context path (if any), BC version and localization from `app.json`
  - The task slug and output path: `.dev/<task-slug>/01b-fit-gap.md`

### Step 4: Challenge the Output

Read `01b-fit-gap.md` and push back where needed. Send the agent back with targeted instructions
if any of these fail:
- **Evidence** — every L0-L2 claim cites something verifiable (standard object/field/page, doc URL,
  installed app). "BC probably handles this" is rejected.
- **Lowest level really tried** — every L3/L4 requirement explains *why* L0, L1 and L2 fail
  (concrete limitation, or an operating cost quantified in volume/users — a vague "less
  convenient" is not enough).
- **Standard engine considered** — for any gap that implies checks/logic "in many places",
  the analysis looked for a standard mechanism to drive instead (see Key Pattern). If none, say why.
- **Justified and maintainable** — every L3/L4 states the value it brings and its maintenance
  impact. Anything flagged "Élevé" must say why a less invasive option was not possible.
- **Need vs solution** — the prescribed solutions were reformulated into needs. If a requirement
  still reads like a design ("add a table…"), it was not challenged.
- **Honesty both ways** — do not force a standard fit that degrades the need. A workaround that
  users will reject is a gap, not a fit. Record such trade-offs explicitly.
- **Localization** — the standard claimed exists in the project's localization (e.g. FR) and
  BC version.

### Step 5: Present the Verdict

Summarize to the user (concise, not the full document):
- Coverage breakdown (how many requirements at each level)
- Reformulated needs that changed the scope
- The residual gap (L3/L4 items) — this is what `/plan` would design
- Trade-offs the user must accept for the standard options

Then ask with AskUserQuestion:
- **Standard / minimal option** — Go with L0-L2 where proposed; only the residual gap goes to `/plan`
- **Develop specific items** — User overrides some fits (ask which, and record the business reason in `01b-fit-gap.md` under "Decisions")
- **Refine** — The analysis missed something (ask what)
- **Stop** — Everything is covered by the standard, or park the request

Record the decision in the `## Decisions` section of `01b-fit-gap.md` (date, choice, reason).
This file becomes the input contract for `/plan`: architects design **only** the gaps marked
for development.

## Rules

- **Spawn the consultant** — do not do the analysis yourself.
- **Evidence over opinion.** No citation, no fit.
- **The residual gap is the deliverable.** Downstream skills only design what is listed there.
- **Do not pre-design.** Fit-gap names *what* is missing, never *how* to build it (no object allocation).
- **Reduce, don't forbid.** A justified L3/L4 is a valid outcome. The failure mode to avoid is unjustified or oversized development, not development itself.
- **Maintenance is the yardstick.** When two options cover the need, prefer the one with the lower long-term maintenance cost for the client.
- **Keep it proportional.** A 2-requirement request gets a half-page fit-gap, not a report.
