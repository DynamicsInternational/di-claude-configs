---
name: al-coding-standards
description: Detailed AL coding examples — correct vs incorrect snippets for naming, namespaces, affixes, SetLoadFields, FieldCaption errors, and integration events. Invoke when you need a worked example, not just a rule reminder.
user-invocable: false
---

# AL Coding Standards — Examples

Standing rules for AL code are loaded automatically from the `rules/` directory:

- `rules/al-naming.md` — PascalCase, namespaces, affixes
- `rules/al-data-access.md` — SetLoadFields, FlowFields, error messages, integration events
- `rules/al-conventions.md` — DataClassification, ApplicationArea, Caption, triggers, XML docs
- `rules/al-architecture.md` — layer responsibilities, testability, seams
- `rules/al-engineering.md` — best-solution-first, DRY, SOLID, approval gates

This skill exists for detailed worked examples. When you need to see correct vs incorrect AL side-by-side, read [personal-coding-standards.md](./personal-coding-standards.md).

Topics covered with full code examples:

1. PascalCase naming — variables, procedures, parameters
2. Namespace hierarchy and custom-table fields without affixes
3. Table extension fields with **suffix** affix (AppSource cop)
4. SetLoadFields with `Get` and `FindSet`
5. Error handling with `FieldCaption` and `Label` constants
6. Integration events around a core operation
