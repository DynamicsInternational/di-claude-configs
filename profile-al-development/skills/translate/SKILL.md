---
name: translate
description: Translate an AL project's XLIFF localization files using the NAB AL Tools MCP. Defaults to French (fr-FR); accepts any target language when specified. Syncs the generated .g.xlf, fills untranslated units while preserving AL placeholders and locked/translated states, applies the BC glossary for terminology consistency, and saves back to the language XLF. Runs at the end of the development cycle.
---

# /translate — AL XLIFF Localization

Translate the project's user-facing text (captions, tooltips, labels) into one or more target
languages using the **`nab-al-tools`** MCP server. **Default target: French (`fr-FR`).** Other
languages are translated only when the user specifies them (e.g. `/translate de-DE es-ES`).

You are the engineering manager — drive the MCP tools; do not hand-edit XLF files.

## Prerequisites

- The app compiles and the **`.g.xlf`** generation file exists under `Translations/` (the AL
  compiler emits it when `"features": ["TranslationFile"]` / `GenerateCaptions` is enabled in
  `app.json`). If no `.g.xlf` exists, run `/compile` first and tell the user to enable the
  translation file feature.

## Target languages

- No argument → **`fr-FR`**.
- One or more language codes as arguments → translate each (e.g. `fr-FR`, `de-DE`, `nl-NL`).
- Read `.dev/project-context.md` for any project-mandated languages and honour them too.

## Workflow (per target language)

1. **Ensure the language XLF exists** — `createLanguageXlf` to generate `<App>.<lang>.xlf`,
   matching base-application translations where possible for consistency.
2. **Sync with source** — `refreshXlf` to merge the latest `.g.xlf` into the target XLF,
   **preserving existing translations and locked states**.
3. **List the work** — `getTextsToTranslate` (paginated) to get the untranslated/needs-review units.
4. **Load terminology** — `getGlossaryTerms` for the BC terminology pairs; use them so the same
   source term always maps to the same target term. `getTextsByKeyword` to find specific strings.
5. **Translate** — produce translations that:
   - **Preserve every AL placeholder verbatim** (`%1`, `%2`, `#1`, `{0}`, FieldCaption substitutions). Never translate or reorder placeholders incorrectly.
   - **Never touch locked units** (`translate="no"` / locked state).
   - Respect the glossary terms.
   - Keep BC-appropriate, professional phrasing.
6. **Save** — `saveTranslatedTexts` to persist the batch (respecting the tool's size limits;
   paginate if needed).
7. **Validate** — `getTranslatedTextsByState` to confirm nothing is left in `needs-review`
   unintentionally; `getTranslatedTextsMap` to spot inconsistent translations of the same source.

## Output

Write a short summary to `.dev/<task-slug>/07-translation.md` (or report inline if no task folder):

```markdown
# Translation Summary — <Task Name>

| Language | Units translated | Left needs-review | Glossary applied |
|----------|------------------|-------------------|------------------|
| fr-FR    | N                | 0                 | yes              |

## Notes
- Placeholders preserved: yes
- Locked units untouched: yes
- Files updated: Translations/<App>.fr-FR.xlf
```

## Rules

- **Default to `fr-FR`** when no language is given; never silently skip translation.
- **Placeholders are sacrosanct** — a translation that drops or corrupts `%1`/`#1` is a defect.
- **Do not re-translate locked or already-final units** unless the user explicitly asks.
- **Use the glossary** — terminology consistency across the app matters more than literal phrasing.
- **Idempotent** — re-running should only fill gaps, never overwrite good existing translations.
</content>
