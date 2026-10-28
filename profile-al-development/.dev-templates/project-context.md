# Project Context (Auto-Maintained)

**Last Updated:** [timestamp] by [agent-name]

> **Purpose:** This document is the project's memory. ALL agents read this FIRST before doing any exploration or searches. Agents update this when they learn new information. This prevents redundant codebase exploration and speeds up all workflows.

## Project Overview

**App Name:** [App Name]
**Publisher:** [Publisher]
**Version:** [Version]
**Base App Objects Used:** [Key tables/pages extended]

## Development Policies

> Set by the user (asked by `/init-context`). Agents apply them; they never change them on their own.

**Extensibility Level:** [PTE | Product] — `PTE` when not declared
- `PTE`: client-specific app — integration events at the entry/exit of major business processes, or on request.
- `Product`: reusable app (AGF/ISV) — events at every stable business boundary, extensible enums + interfaces for behavior variants.

**Test Policy:** [none | light | full] — `none` when not declared
- `none`: no test app. No tests are written; reviews produce a manual acceptance checklist instead.
- `light`: test app with tests on the critical business rules, run with `al-runner` (no BC test environment required).
- `full`: test app covering every business area touched, run with `al-runner` for the fast loop and on BC (sandbox, ALTool/CI or container) as the reference; adversarial verification; characterization before refactors.

Whatever the policy, code is written the same way: readable and testable without overhead (see `rules/al-architecture.md`).

## Directory Structure

```
src/
├── Tables/           # [list key tables]
├── TableExtensions/  # [list extensions]
├── Pages/            # [list pages]
├── PageExtensions/   # [list extensions]
├── Codeunits/        # [list codeunits by purpose]
├── Reports/          # [list reports]
└── Enums/            # [list enums]
```

## Key Objects Registry

### Tables & Extensions
| Object | ID | Purpose | Key Fields |
|--------|--|----|-----------|
| [Name] | 50100 | [Purpose] | [Field1, Field2] |

### Pages & Extensions
| Object | ID | Extends/Standalone | Purpose |
|--------|----|--------------------|---------|
| [Name] | 50100 | [Base Page] | [Purpose] |

### Codeunits
| Object | ID | Purpose | Key Procedures |
|--------|----|--------------------|---------|
| [Name] | 50100 | [Purpose] | [Proc1(), Proc2()] |

## Architectural Patterns

### Validation Pattern
- **Location:** [Codeunit/Table]
- **Approach:** [Event subscribers / OnValidate / etc]
- **Example:** [Specific implementation reference]

### Extension Pattern
- **Fields:** [How new fields are added]
- **Events:** [How events are used]
- **Subscribers:** [Where subscribers are placed]

### Error Handling
- **Pattern:** [Error() vs Message() usage]
- **Validation Messages:** [Naming convention]

## Base App Integration Points

### Tables We Extend
- **Customer (18):** [fields added, events subscribed]
- **Sales Header (36):** [fields added, events subscribed]

### Events We Subscribe To
- **Table 18 OnBeforeInsert:** [Purpose]
- **Codeunit 80 OnBeforePostSalesDoc:** [Purpose]

### Procedures We Call
- **Customer.CalcAvailableCredit():** [When/why used]

## Business Rules Map

> One row per business rule: the single place that carries it. Read this before adding or changing
> logic — if the rule is listed, change it there instead of writing a variant elsewhere.
> Update it whenever a rule is added, moved or removed.

| Business Rule | Owner (Object.Procedure) | Used By |
|---------------|--------------------------|---------|
| [Vendor/agreement is valid for ordering] | [Codeunit 50110 "PROJ Vendor Agreement Mgt.".IsAgreementValid()] | [Purchase release, requisition] |

## Common Code Locations

### Where to find:
- **Credit validation:** Codeunit 50100.CheckCreditLimit()
- **Email validation:** Table Ext 50100.ValidateEmail()
- **Posting logic:** Event subscriber in Codeunit 50101
- **UI extensions:** PageExt 50100-50105

## Dependencies

### Internal Dependencies
- [Codeunit X depends on Codeunit Y]

### External Dependencies
- [None / List external apps]

## Testing Infrastructure

### Test Codeunits
| Name | ID | Covers |
|------|----|----|
| [Name] | 50200 | [What it tests] |

### Test Data Setup
- **Location:** [Where test setup code lives]
- **Patterns:** [How tests are structured]

## Recent Changes Log

### [Date] - [Agent Name]
- Added: [What was added]
- Modified: [What changed]
- Learned: [New patterns discovered]

---

## Instructions for Agents

**BEFORE doing ANY Glob/Grep searches or exploration:**
1. Read this document completely
2. Check if the information you need is already here
3. Only search if information is missing or unclear
4. UPDATE this document after you learn something new about the project

**When updating:**
- Append to relevant sections (don't rewrite everything)
- Add timestamp and your agent name
- Be concise but specific
- Include file paths and object IDs

This document is your first stop - use it to save time!
