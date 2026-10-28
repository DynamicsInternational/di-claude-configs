# Test App Template

Reference used by `/test` when a project with Test Policy `light` or `full` has no test app yet.
Create it only after the user approved it.

## Layout

```
<repo>/
├── app/                      ← the production app (existing; may be the repo root)
└── test/
    ├── app.json
    ├── .alpackages/
    └── src/
        ├── ItemImport/       ← one folder per business area
        │   └── ItemImportTests.Codeunit.al
        └── DeferredPosting/
            └── DeferredPostingTests.Codeunit.al
```

If the workspace is a multi-root `.code-workspace`, add the `test` folder to it.

## app.json

- **Own app id, name `<App Name> Tests`**, same publisher, same `platform`/`application`/`runtime` as the production app.
- **ID range**: a dedicated range, distinct from the production app (agree it with the user; record it in project context).
- **Dependencies**:
  - the production app (id, name, publisher, version from its `app.json`);
  - the Microsoft test toolkit apps the tests use — typically **Library Assert**, **Any**,
    **Library Variable Storage**, **Tests-TestLibraries** (holds `Library - Sales`, `Library - ERM`, …).
  Take each id, publisher and version **from the symbols available for the target BC version**
  (`/al-symbols`, `.alpackages`, or the container's test toolkit) — never write them from memory.

## Test codeunit conventions

- One codeunit per business area: `"<Affix> <Area> Tests"`; characterization suites: `"<Affix> <Area> Characterization"`.
- `Subtype = Test;` and `RequiredTestIsolation` set (used by the VS Code Test Explorer).
- `TestPermissions = Disabled;` only on codeunits that do not assert permission behavior; permission
  tests use `Restrictive` and lower the context explicitly (see `test-engineer-prompts.md`).
- A local `Initialize()` holding the area's shared setup, called first in each test.
- Under ~100 tests and ~2 minutes per codeunit (Microsoft guidance); split the area beyond that.

## Running

See `/run-tests`:
- **Fast loop** — `al-runner` on the app and the test app, no BC needed.
- **Reference** — BC: online sandbox from the VS Code Test Explorer (BC 28+), ALTool in CI, or a container with `bc-test`.

## Project context

After creating the test app, update `.dev/project-context.md`:
- **Test Policy** (`light` or `full`)
- **Testing Infrastructure**: test app path, ID range, business-area folders, the BC environment used as reference, how to run each runner.
