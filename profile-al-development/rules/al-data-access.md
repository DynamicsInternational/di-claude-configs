---
description: AL data access and error handling patterns
globs: ["**/*.al"]
---

# AL Data Access Rules

## SetLoadFields Before Record Retrieval

Always call `SetLoadFields` before `Get`, `FindFirst`, `FindLast`, or `FindSet`. Load only the fields you actually use. Reading a full record to access a single field is a defect.

## FlowFields

Use `CalcFields` explicitly. Do not rely on `AutoCalcFields` — it hides cost and loads more than needed.

## Error Messages

- Use `FieldCaption` (not hardcoded field names) so errors respect translations.
- Define error text as a `Label` constant with a `Comment` documenting `%1`/`%2` substitutions.
- Error messages must be actionable — say what went wrong AND how to fix it.

## Integration Events

Raise `[IntegrationEvent(false, false)]` events at meaningful extension points — typically `OnBefore...` and `OnAfter...` around the core operation. Keep the event procedure body empty.

For detailed code examples, invoke the `al-coding-standards` skill.
