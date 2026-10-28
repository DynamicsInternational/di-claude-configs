---
name: run-tests
description: Execute AL test codeunits. al-runner runs the whole test app in memory as the fast loop (no BC required, Base App compiled from source); BC — online sandbox via VS Code / ALTool, or a container via bc-test — is the reference run.
---

# /run-tests — Execute AL Tests

## One Suite, Two Runners

Tests are written once, the BC way (`Library -` codeunits, handlers, `asserterror`). The same suite runs on:

| Runner | Role | BC required? | Speed |
|--------|------|-------------|-------|
| `al-runner` | **Fast loop** — after every change, by agents and developers | No | Seconds |
| BC (sandbox / ALTool / container) | **Reference** — the result that counts before merge or release | Yes | Minutes |

`al-runner` is a fast approximation, not Business Central. Its own author recommends running the suite
at least once on a Microsoft-supported environment before shipping. **Never reshape production code or a
test to make `al-runner` run it** — a test it cannot run is simply confirmed on BC.

## al-runner (fast loop)

**AL Runner v3** (Rust, `aldevtools/BusinessCentral.AL.Runner`) compiles the Microsoft apps (System
Application, Base Application, test libraries) from source and executes AL in memory. According to its
documentation it runs table/page/codeunit triggers, posting routines, integration and business events,
subscribers (including manual binding), `TestPage`, UI handlers, `[HttpClientHandler]`, and the CRONUS
demo company.

**Install / use** (check `al-runner --help` and the manual at aldev.tools/al-runner for the exact CLI):
```bash
mise use -g github:aldevtools/BusinessCentral.AL.Runner
al-runner test ./app ./test
```

**Results** — each test is **passed**, **failed**, or **not run** with a reason (an unsupported feature is
never silently defaulted). Report the three counts; list "not run" reasons.

**Known limits** (check the manual for the current list):
- Alpha: results may change between builds; part of Microsoft's own tests are still "not run".
- Demo data differs from Microsoft's test database (empty number series, missing posting setups) —
  tests that rely on demo data instead of building their own fail here first.
- All permissions are granted: permission tests are only meaningful on BC.
- Refused by design: e-mail, OData/SOAP/API endpoints (call the page/codeunit instead), job queue,
  multi-user locking, multi-company, file dialogs, report rendering (the dataset works).
- License: Business Source License 1.1 — free for developing and testing BC extensions.

AL Runner **v2** (`dotnet tool MSDyn365BC.AL.Runner`) is frozen. If a project still uses it, its CLI is
`al-runner --packages .alpackages ./src ./test` with exit codes 0 = passed, 1 = failures,
2 = runner limitations only, 3 = compilation error.

## BC (reference run)

Pick what the project has, in this order of preference:

1. **Online sandbox from VS Code** (BC 28+) — Test Explorer, profile *Publish & Run*; *Coverage (Procedure)*
   adds per-procedure coverage. Isolation comes from `RequiredTestIsolation` on each test codeunit.
2. **ALTool** (command line / CI) — compiles, deploys and runs the test project, structured JSON results.
   Check `altool --help` for the syntax available in your AL tools version.
3. **Container** — `bc-test` (from bc-linux or bc-tools) after publishing the app then the test app
   (`/publish`, `/local-bc`); the default for large suites and CI gates per Microsoft.

Never run tests on a production environment.

## Behavior

1. Run `al-runner` first; then the BC reference run when requested, when the Test Policy is `full`, or
   before a merge.
2. Parse `$ARGUMENTS` and pass them through to the selected runner.
3. If there is an active task folder (`.dev/<task-slug>/`), capture output to `.dev/<task-slug>/test-results.txt`.

## Handling Results

- **All passing:** report counts per runner. Note "Tests green on al-runner" / "on BC" — never one for the other.
- **Not run (al-runner):** not a failure; list the reasons. Those tests must pass on BC before claiming the suite is green.
- **al-runner and BC disagree:** BC is the reference. Report the discrepancy (often demo data or permissions).
- **BC unreachable:** say the reference run was not executed. Never report those tests as passing.
- **Real failures:** list each failed test with codeunit, method name, and error message. Offer to analyze.
- **No tests found:** check that test codeunits use `Subtype = Test` and procedures have `[Test]`.
