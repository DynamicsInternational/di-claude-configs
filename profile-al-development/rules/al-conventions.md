---
description: AL field, page, and documentation conventions
globs: ["**/*.al"]
---

# AL Conventions

> Field-level data classification, captions, and most performance/style rules now live in the
> **BCQuality** corpus (consult via `/bcquality-citation`). This file keeps only the conventions
> that are workflow-specific or not covered there.

## ApplicationArea

Set a page-level default where all fields share the same area (almost always `ApplicationArea = All` on the page). Fields that match the page default do not need to repeat it. Only set `ApplicationArea` on individual fields or actions when they differ from the page default.

## Triggers

- No empty triggers. If a trigger has no code, remove it entirely.

## Comments and XML Documentation

Comments explain **why**; the code shows **what** and **how**.

- Every procedure (local, internal or public) gets a short `/// <summary>` — one or two lines saying
  why it exists or which business rule it carries. If it takes three sentences to describe, the
  procedure probably does too much.
- `<param>` / `<returns>` only when they add information the name and type do not give: unit or
  allowed values, `var` semantics (read / modified), meaning of a Boolean, side effects (database
  write, `Commit`, UI). Never paraphrase the name (`<param name="CustomerNo">The customer number.</param>`).
- Inline comments only for a non-obvious reason: a BC platform constraint, an edge case, a functional choice.
- **No ticket history in code** (no "ADO #1234 — changed on…" narratives, no author/date blocks).
  History belongs to commit messages and work items.
- **No commented-out code.** Delete it; git keeps it.
- **A comment that no longer matches the code is a defect.** When you change a procedure's behavior,
  update its summary and comments in the same change.

## Compiler Diagnostics

The compile hook enforces errors as hard stops. Warnings and infos from any analyzer — whether or not they are part of the configured hook — must also be addressed:

- **Errors**: must be fixed before the turn ends (enforced by hook).
- **Warnings**: must be fixed. No warning may be left in place without resolution.
- **Infos**: must be considered. Fix them unless the effort is clearly disproportionate to the gain. When in doubt, fix it — infos exist because the analyzer author considered them worth flagging.

Do not suppress diagnostics with pragmas unless there is a documented, specific reason. A suppressed warning is not a fixed warning.
