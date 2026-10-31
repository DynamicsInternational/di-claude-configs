# TDD RED-GREEN-REFACTOR Protocol

Shared reference for the `/test` and `/develop` skills. This defines the strict TDD workflow that must be followed when TDD mode is active.

## Core TDD Principles

1. **RED --> GREEN --> REFACTOR --> repeat**
2. **NEVER** implement logic before the user confirms the test FAILS
3. **NEVER** skip approval gates between phases
4. **NEVER** batch multiple cycles — one test at a time
5. **ALWAYS** use AskUserQuestion at phase gates (BLOCKING — do not proceed without user response)

---

## Phase 1: RED — Write Failing Test

The goal is to write a test that fails for the RIGHT reason (missing logic, not compilation errors).

### Steps

1. **Write the test codeunit** following the spec and assigned test scenarios. The test exercises **business behavior through a business entry point**:
   - a business flow → BC test with `Library -` codeunits, asserting on the resulting data;
   - a pure calculation → in-memory test calling the function with values.
   No mock repositories, no interfaces or injected setup added for the test — control the context with test data, setup records, `WorkDate()`, handlers or manually bound subscribers (see the `al-architecture` rule).
2. **Changing an existing behavior?** Do not add a parallel test. Update the expectation of the existing test so it now fails, and skip the stub step — the existing code is the RED baseline.
3. **New behavior:** create MINIMAL production code stubs — enough to compile, but NO actual logic
   - Procedures return default values (0, '', false)
   - No business rules, no calculations, no validations
4. **Compile:**
   ```bash
   al-compile
   ```
5. **Publish:**
   ```bash
   bc-publish
   ```
6. **Run the test:**
   ```bash
   bc-test -o .dev/<task-slug>/test-results-red.txt
   ```
7. **HARD STOP** — Use AskUserQuestion:

   > **RED Phase Complete**
   >
   > Test **FAILED** as expected.
   > Results saved to `.dev/<task-slug>/test-results-red.txt`
   >
   > - **Approve** — Test failed correctly, proceed to GREEN phase
   > - **Test PASSED unexpectedly** — TDD VIOLATION, investigate
   > - **Need troubleshooting** — Help me debug

8. **If the test PASSED in RED phase: STOP IMMEDIATELY.**
   This is a TDD violation. The test is either:
   - Testing something already implemented (not a new behavior)
   - Not actually asserting the right thing
   - Using wrong expectations

   Do NOT proceed to GREEN. Investigate and fix the test first.

---

## Phase 2: GREEN — Make It Pass

The goal is to write the MINIMUM production code that makes the test pass. No more, no less.

### Steps

1. **Implement ACTUAL production logic** — replace the stubs from RED phase with real code, or change the existing code in place when the behavior already lived somewhere
2. **Compile, publish, and run the test:**
   ```bash
   al-compile && bc-publish && bc-test -o .dev/<task-slug>/test-results-green.txt
   ```
3. **HARD STOP** — Use AskUserQuestion:

   > **GREEN Phase Complete**
   >
   > Test **PASSED**.
   > Results saved to `.dev/<task-slug>/test-results-green.txt`
   >
   > - **Approve** — Test passes correctly, proceed to REFACTOR phase
   > - **Test still FAILS** — Need to iterate on implementation
   > - **Need troubleshooting** — Help me debug

4. **If the test still fails:** iterate on the implementation until it passes. Do NOT move to REFACTOR until GREEN.

---

## Phase 3: REFACTOR — Improve Quality

The goal is to improve code quality WITHOUT changing behavior. All tests must continue to pass.

### Steps

1. **Refactor production code** toward readability (see the `al-engineering` rule):
   - Inline pass-through procedures; extract only distinct business steps or pure calculations
   - Remove duplication and dead code; flatten nesting with early exits
   - Improve variable and procedure names
   - Update procedure summaries so they still say why the code exists
   - Optimize performance (remove redundant calls, simplify logic)

2. **Refactor test code:**
   - Extract shared setup into helper procedures
   - Improve test names if needed
   - Add or improve assertion messages

3. **Do NOT change behavior** — no new features, no new edge cases, no bug fixes

4. **Compile, publish, and run ALL tests** (not just the current one):
   ```bash
   al-compile && bc-publish && bc-test -o .dev/<task-slug>/test-results-refactor.txt
   ```

5. **HARD STOP** — Use AskUserQuestion:

   > **REFACTOR Phase Complete**
   >
   > All tests **PASS**.
   > Results saved to `.dev/<task-slug>/test-results-refactor.txt`
   >
   > - **Approve** — Refactoring looks good, start next TDD cycle
   > - **Some tests FAILED** — Revert refactoring immediately
   > - **Need troubleshooting** — Help me debug

6. **If tests broke during refactoring:** revert ALL refactoring changes immediately. The refactoring introduced a behavior change, which is not allowed.

---

## TDD Log Documentation

Maintain `.dev/<task-slug>/03-tdd-log.md` throughout the TDD process. Update it after each phase completion.

### Format

```markdown
# TDD Log — <Task Name>

## Cycle 1: <Feature/Behavior Name>

### RED Phase
- **Test:** `<TestProcedureName>`
- **Test Codeunit:** `<ID> "<Name>"`
- **Status:** FAILED (as expected)
- **Error:** `<The assertion/error message>`
- **Stubs created:** `<List of stub procedures>`

### GREEN Phase
- **Production code:** `<Files modified>`
- **Logic implemented:** `<Brief description>`
- **Test status:** PASSED
- **All tests status:** X/X passing

### REFACTOR Phase
- **Improvements:** `<What was refactored>`
- **All tests status:** X/X passing

---

## Cycle 2: <Feature/Behavior Name>
...
```

---

## Summary of Hard Stops

Every TDD cycle has **exactly 3 hard stops** where user approval is required:

| Phase | Gate | Expected State | Action if Unexpected |
|-------|------|---------------|---------------------|
| RED | After test run | Test FAILS | If PASSES: TDD violation, stop and investigate |
| GREEN | After implementation | Test PASSES | If FAILS: iterate implementation, do not skip |
| REFACTOR | After cleanup | ALL tests PASS | If any FAIL: revert refactoring immediately |

**Three hard stops per test. No exceptions.**

---

## When to Use TDD vs. Standard Testing

| Approach | When to Use |
|----------|------------|
| **TDD (this protocol)** | New features, complex business logic, critical calculations, when user explicitly requests TDD |
| **Standard testing (`/test` skill)** | Existing code that needs test coverage, bulk test creation, when speed is more important than TDD discipline |

The `/test` skill can operate in either mode. TDD mode is activated when the user requests it or when the develop skill triggers test-first development.
