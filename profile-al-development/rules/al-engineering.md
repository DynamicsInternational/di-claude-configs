---
description: AL development engineering principles — injected into every AL session and subagent
---

# Engineering Principles

## Readability First

Code is read far more often than it is written — by consultants, by other developers, and by the
next agent working on the next ticket. The target is code a BC developer can follow top to bottom
without jumping through layers. When a principle below conflicts with readability, readability wins.

- **Write idiomatic BC code**, the way the base application is written: a codeunit owns a business
  process, its procedures read as a sequence of business steps, setup is read where it is needed.
  Do not import patterns from C#/Java (repositories, service locators, a factory per dependency).
- **No pass-through procedures.** A procedure must earn its existence: it holds logic, names a
  non-obvious business concept, is called from two or more places, or is a required public
  entry point / event publisher. A procedure whose body only forwards its parameters to another
  procedure is deleted and its caller calls the target directly.
- **Keep the call chain shallow.** A business action should be understandable within a few hops
  of our own code. Do not bounce between objects (A → B → A). Prefer one cohesive procedure of
  reasonable length over a chain of tiny ones.
- **Split by cohesion, not by line count.** Extract a procedure when the block is a distinct
  business step, is reused, or isolates a pure calculation — never only to make a procedure shorter.
  Deep nesting (more than 3 levels) is the real signal; fix it with early exits first.
- **Explicit signatures.** No more than two Boolean parameters; beyond that, use an enum, an
  option record, or separate procedures. A caller must be readable without opening the callee.
- **No hidden state.** `SingleInstance` codeunits are not used to carry state between calls
  unless the need is documented in the codeunit's summary.

## Modify, Don't Pile Up

Client projects evolve brick by brick: a need is added, then changed two days later, then
adjusted again. The code must absorb these changes without growing a new layer each time.

- **Find before you write.** Before adding logic, locate where the business rule already lives
  (project context "Business Rules Map", LSP references, search on the business concept).
  If it exists, **change it there** — do not write a parallel variant next to it.
- **When a requirement changes, change the code that carries it.** Rewrite the existing rule,
  update its summary and its tests. Do not keep the old path alive behind a flag "just in case".
- **Open/Closed applies to the public surface only** — integration events, public procedures and
  interfaces consumed by other apps. Internal code is meant to be modified.
- **Remove what you replace.** Dead procedures, unused variables, obsolete events with no
  subscriber in our apps (and not part of the published extensibility surface) are deleted in the
  same change.

## DRY — Rule of Three

- One source of truth for every business rule: if the rule changes, exactly one place changes.
  Duplicated business decisions (the same eligibility check, the same filter) are a defect.
- Do not abstract speculatively. Two similar blocks are tolerated; extract on the third
  occurrence, or immediately when it is the same business rule.
- Duplication in tests is acceptable for readability.

## Best Solution First — Proportionate

Design the correct solution, not a shortcut — but "correct" means the **simplest design that
fully solves the need and stays easy to change**. Abstractions, events and interfaces have a
reading and maintenance cost; add them only when the need is present, not anticipated.

**No hacks. No temporary fixes left in place.**

## Approval Gates

Stop and get explicit user approval before proceeding when:

- The correct solution requires **refactoring beyond the immediate task scope** (structural changes, moving responsibilities between objects, changing interfaces)
- The correct solution introduces **breaking changes** to any public procedure signature, interface, or integration event
- The scope of work is significantly larger than what was asked

Describe: what the ideal solution is, what it touches, what breaks. Then wait.
