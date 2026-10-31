---
description: AL object architecture, extensibility and testability rules
paths:
  - "**/*.al"
---

# AL Architecture Rules

## Layer Responsibilities

**Pages and PageExtensions** — UI and UI control only.
- Acceptable: calling out to a codeunit, setting filters, navigating, visibility expressions, style expressions, and other logic that directly controls what the user sees or how the UI behaves.
- Not acceptable: business logic, calculations, domain rules, or direct table writes.

**Tables** — data structure and record-level behavior.
- Field definitions, keys, FlowFields, field-level validation (format, range checks).
- Record-centric logic (defaulting, simple checks on the current record) may live in table procedures. Process logic and cross-table orchestration belong in codeunits.
- Do not create a table procedure that only forwards to a codeunit — call the codeunit directly.

**Codeunits** — own business processes and orchestration.
- One codeunit = one business process or domain area, named after it. Avoid both one-procedure micro-codeunits and catch-all codeunits spanning unrelated domains (including a single subscriber codeunit for every domain).
- Codeunits may call other codeunits.
- Codeunits generally do not open pages. The exception is codeunits whose explicit responsibility is UI routing — opening, redirecting, or conditionally navigating to pages. This is a narrow exception, not a general pattern.

**Reports and XMLports** — data projection only.
- Format and extract data. No business rule enforcement.

## Extensibility: Integration Events

Published events are the app's extensibility contract with other apps. They are valuable, and they
are a commitment: once published, a signature cannot change without breaking subscribers.

The density depends on the **Extensibility Level** declared in `.dev/project-context.md`
(`PTE` when not declared):
- `PTE` (client-specific app): publish events at the entry and exit of major business processes, or when explicitly requested.
- `Product` (reusable app, AGF/ISV): publish events at every stable business boundary listed below, and use extensible enums + interfaces for behavior variants.

**Where events belong** — stable business boundaries:
- Entry/exit of a business process, on its public procedure (`OnBefore<Process>` / `OnAfter<Process>`).
- Construction of a record a third party may want to enrich (`OnBeforeInsert<Entity>(var Rec)`, field transfer).
- A decision point a third party may legitimately adjust — prefer passing the result by `var` (`OnAfterCalc<Value>(var Amount)`) over replacing the whole procedure.

**Where events do not belong**: local plumbing procedures, inside loops at every step, systematically in OnBefore/OnAfter pairs, or as an internal call mechanism our own app subscribes to (call the code directly instead).

**`IsHandled`** lets a subscriber bypass our logic, which freezes that logic. Use it only when full replacement is a real, stated use case.

**Readability**: raise events at the start or end of a procedure, not interleaved with the logic; group publishers at the bottom of the codeunit.

## Interfaces

Use an interface only when one of these is true **today**:
- Two or more real implementations exist or are required (typically an extensible enum implementing the interface — the BC-idiomatic way to let others plug in a behavior).
- The dependency is external I/O (HTTP service, file, e-mail) and must be isolated.

Never create an interface, factory or provider only to make code mockable. BC offers its own test
seams (see below).

## Testable Without Overhead

All code must be easy to test later, whether or not the project has a test app today. This comes
from simple structure, not from injection:

1. **Clear business entry points**: a user action calls one codeunit procedure that carries the business action — the natural target of a test.
2. **Pure calculations as functions**: values in, result out, no global or hidden state.
3. **No UI in the middle of logic**: `Confirm`/`Message` at the edges, or switchable by a parameter.
4. **No `Commit` in the middle of a process** unless the process design requires it and it is documented.
5. **`WorkDate()` over `Today()`** when the date has a business meaning.
6. **Explicit errors** with labels and `FieldCaption`, so `asserterror` + `GetLastErrorText` can check them.
7. **Events at business boundaries** double as test seams.
8. **External I/O grouped in one place**, so it can be isolated if ever needed.

Setup tables are read where they are needed (`Setup.Get()` inline is fine): tests control setup by
writing the setup record, and test isolation rolls it back.

**BC test seams** — prefer these over interfaces: setup/test data, `WorkDate()`, manually bound
test subscribers (`EventSubscriberInstance = Manual` + `BindSubscription`), UI handlers
(`ConfirmHandler`, `MessageHandler`, `ModalPageHandler`, `RequestPageHandler`), and HTTP interception
in test codeunits where the platform supports it.

If you find yourself writing `if Environment = 'TEST' then` inside business logic, use one of these seams instead.
