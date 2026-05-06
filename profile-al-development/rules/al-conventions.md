---
description: AL field, page, and documentation conventions
globs: ["**/*.al"]
---

# AL Conventions

## Required Field Properties

- **`DataClassification`** must be set on every table field. Use `CustomerContent`, `EndUserIdentifiableInformation`, `SystemMetadata`, etc. Never leave `ToBeClassified` in production code.
- **`ApplicationArea = All`** on all page fields and actions unless there is a specific reason to restrict.
- **`Caption`** must be set on every field, action, and page — they are user-facing.

## Triggers

- No empty triggers. If a trigger has no code, remove it entirely.
- Page triggers must delegate immediately to a codeunit — no business logic in page code.
- Table triggers handle field-level validation only — no cross-table orchestration.

## XML Documentation

- All public procedures need `/// <summary>` XML doc comments.
- Document every parameter, return value, and any non-obvious behavior.
