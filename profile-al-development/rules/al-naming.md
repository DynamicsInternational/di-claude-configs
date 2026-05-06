---
description: AL naming conventions, namespaces, and affix rules
globs: ["**/*.al"]
---

# AL Naming Rules

## PascalCase Everywhere

PascalCase for ALL identifiers — objects, variables, fields, procedures, parameters, properties. No exceptions. No spaces or special characters in any identifier name.

## Namespaces

- Root namespace segment is the AppSource registered affix (e.g. `ABC`).
- Build a hierarchy beneath it: `namespace ABC.Sales;`, `namespace ABC.Sales.Documents;`.
- The namespace is what provides uniqueness — object names do NOT carry the affix.

## Affix Rules (AppSource Cop Alignment)

| Context | Object Name Affix | Field Name Affix |
|---|---|---|
| Custom table | No | No |
| Table extension | No | **Yes, suffix only** |
| Custom page | No | N/A |
| Page extension | No | N/A |
| Codeunit / Enum / Interface | No | N/A |
| Enum extension | No | **Yes, suffix only** |

- **Never use prefix affixes on extension fields.** AppSource requires suffix.
- Example: `"Loyalty Tier ABC"` — correct. `"ABC Loyalty Tier"` — wrong.
- Extension *object* names also exclude the affix — the namespace handles uniqueness.

For detailed examples, invoke the `al-coding-standards` skill.
