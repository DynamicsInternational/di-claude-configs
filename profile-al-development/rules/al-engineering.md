---
description: AL development engineering principles — always loaded
---

# Engineering Principles

## Best Solution First

Always design the best-engineered solution first. Never default to a shortcut, workaround, or "good enough" approach without first establishing what the correct solution is.

If the ideal solution's effort does not warrant the gain, propose a downscoped alternative — but only after presenting the ideal. The user decides which to pursue, not you.

**No shortcuts. No hacks. No temporary fixes left in place.**

## Approval Gates

Stop and get explicit user approval before proceeding when:

- The correct solution requires **refactoring beyond the immediate task scope** (structural changes, moving responsibilities between objects, changing interfaces)
- The correct solution introduces **breaking changes** to any public procedure signature, interface, or integration event
- The scope of work is significantly larger than what was asked

Describe: what the ideal solution is, what it touches, what breaks. Then wait.

## DRY — Strictly Enforced

Zero tolerance for duplicate logic. Before writing any procedure, check whether the logic already exists.

- Extract shared logic to a dedicated procedure or codeunit before writing it a second time
- One source of truth for every business rule — if the rule changes, exactly one place changes
- Duplication in tests is acceptable only for readability; duplication in production code is not

## SOLID — Pragmatically Applied

**Single Responsibility**: each codeunit has one reason to change; each procedure does exactly one thing. If a procedure needs "and" to describe what it does, split it.

**Open/Closed**: extend behavior via integration events and interfaces. Do not modify existing logic to accommodate new requirements — add an extension point.

**Liskov**: every implementation of an interface must be fully substitutable. No partial implementations, no "not supported" stubs in production code.

**Interface Segregation**: keep interfaces small and focused. Do not bundle unrelated operations into one interface.

**Dependency Inversion**: codeunits depend on interfaces, not on concrete implementations. Concrete types are resolved at the factory or composition root, not inline.
