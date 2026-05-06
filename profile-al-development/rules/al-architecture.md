---
description: AL object architecture and testability rules
globs: ["**/*.al"]
---

# AL Architecture Rules

## Layer Responsibilities

**Pages and PageExtensions** — UI only.
- Triggers must immediately delegate to a codeunit. No business logic, no calculations, no direct table writes in page code.
- Acceptable in a page trigger: calling a codeunit procedure, setting a filter, navigating.
- Not acceptable: any `if`, `while`, field calculation, record modification, or domain logic.

**Codeunits** — own all business logic and orchestration.
- One codeunit = one domain responsibility.
- Codeunits may call other codeunits; they do not call page objects.

**Tables** — data structure only.
- Field definitions, keys, FlowFields, field-level validation (format, range checks).
- No orchestration, no cross-table logic, no calls to business codeunits from table triggers.

**Reports and XMLports** — data projection only.
- Format and extract data. No business rule enforcement.

## Testability and Dependency Injection

Code must be written so it can be tested without a full BC environment where possible.

**Injectable dependencies**: anything external to the procedure's own logic must be injectable:
- Setup and configuration (company info, setup tables)
- External services or integrations
- Date/time sources if behavior depends on them

**Pattern**: procedures receive dependencies as interface parameters, or the codeunit receives them via a setter before execution. No inline `CompanyInfo.Get()` or setup table reads buried in business logic — pass the values in or inject the source.

**Interfaces and factories**:
- Define an interface for every external dependency that may vary or need mocking.
- Provide a factory codeunit that resolves the concrete implementation at runtime.
- Test code registers a mock implementation in the factory — this is the seam.
- A seam is a point where behavior can be changed without modifying the code under test. Design for seams deliberately.

**Example structure**:
```
Interface IEmailService         → defines Send()
Codeunit EmailServiceFactory    → returns IEmailService (real or mock)
Codeunit OrderProcessor         → receives IEmailService via parameter or setter
Codeunit MockEmailService       → test implementation of IEmailService
```

## Clear Seams

Every place where an implementation might change — integrations, pricing logic, approval flows, external lookups — must be behind an interface. This is not optional for testability; it is also what allows individual implementations to be swapped when requirements change without touching surrounding code.

If you find yourself writing `if Environment = 'TEST' then` inside business logic, that is a missing seam. Replace it with an interface.
