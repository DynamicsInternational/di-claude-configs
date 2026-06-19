---
name: test
description: Develop comprehensive test suite using 4 parallel test engineer agents. Covers unit, integration, scenario, and edge case testing.
---

# /test — Engineering Manager Orchestration

You are the **Test Engineering Manager**. You orchestrate 4 parallel test engineer agents to build a comprehensive AL test suite covering unit, integration, scenario, and edge case tests.

## Step 1: Task Slug Setup

Auto-generate a task slug from the current task context (or reuse an existing one if continuing work). Ensure the `.dev/<task-slug>/` directory exists.

```
mkdir -p .dev/<task-slug>/
```

## Step 2: Read Context

Read ALL implemented AL files and `.dev/<task-slug>/02-solution-plan.md` to understand:

- What objects exist (tables, codeunits, pages, enums, interfaces)
- What business logic is implemented
- What events are published/subscribed
- What workflows exist
- What validations are in place

Use Glob to find all `.al` files in `src/` or `app/`, then Read each one.

## Step 3: Identify and Categorize Test Scenarios

Analyze the implemented code and categorize every testable behavior into exactly 4 types:

| Type | What to Test |
|------|-------------|
| **UNIT** | Calculation methods, validation logic, data transformations, pure functions, individual business rules in isolation |
| **INTEGRATION** | Table-Codeunit interactions, event subscribers, multi-object workflows, API integrations, BC base app integration points |
| **SCENARIO** | Complete user workflows, UI to Logic to Database flows, real-world use cases, multi-step business processes, happy path scenarios |
| **EDGE CASE** | Null/empty inputs, boundary values (0, negative, MaxInt, MaxDecimal), error conditions, invalid data, concurrent access, special cases (currency rounding, date boundaries) |

Create a concrete list of specific test scenarios for each category. Be explicit — assign SPECIFIC scenarios, not just "write tests."

## Step 4: Assign Object ID Ranges

Assign non-overlapping ID ranges to avoid conflicts between the 4 engineers:

| Engineer | ID Range | Purpose |
|----------|----------|---------|
| Unit Test Engineer | 50100–50199 | Unit test codeunits |
| Integration Test Engineer | 50200–50299 | Integration test codeunits |
| Scenario Test Engineer | 50300–50399 | Scenario test codeunits |
| Edge Case Test Engineer | 50400–50499 | Edge case test codeunits |

Adjust ranges based on the project's `app.json` ID range and any already-used IDs. Check for conflicts before assigning.

## Step 5: Spawn 4 Test Engineer Agents IN PARALLEL

Use the **Agent tool** to spawn all 4 engineers simultaneously. Each agent receives:

1. Their specific section from `test-engineer-prompts.md`
2. The full list of implemented AL files (with paths)
3. Their assigned test scenarios (from Step 3)
4. Their assigned ID range (from Step 4)
5. The project's `app.json` context (name, ID range, dependencies)

**Model: sonnet** for all 4 agents.

Each agent prompt must include:
- The test scenarios assigned to them (specific, not vague)
- The AL files they need to read
- Their ID range
- The output path: `.dev/<task-slug>/` for any intermediate files
- Instruction to write test codeunits to the project's test directory (e.g., `test/` or `src/test/`)
- The `/bcquality-citation` protocol against the `testing` domain (apply and cite the rules — see `test-engineer-prompts.md` header)

## Step 6: Monitor Test Development

After agents complete, verify:

- **No ID conflicts** — scan all created test codeunits for duplicate IDs
- **All assigned scenarios covered** — diff assigned vs. implemented
- **Consistent patterns** — all use `[Test]` attribute, Arrange-Act-Assert, proper naming
- **No compilation issues** — check for obvious syntax problems

If agents asked technical questions (how to mock, which fixtures, which BC objects to use), answer them and re-dispatch.

## Step 7: Run bc-test on All Test Codeunits

```bash
bc-test -o .dev/<task-slug>/test-results.txt
```

- If **ALL passing** --> proceed to Step 9
- If **some failing** --> proceed to Step 8

Use `--failures-only` flag if you only need to see failures:
```bash
bc-test --failures-only -o .dev/<task-slug>/test-results-failures.txt
```

## Step 8: Iterate on Failures

For each failing test:

1. **Identify the owner** by test codeunit ID:
   - 50100–50199 --> Unit Test Engineer
   - 50200–50299 --> Integration Test Engineer
   - 50300–50399 --> Scenario Test Engineer
   - 50400–50499 --> Edge Case Test Engineer

2. **Dispatch fix** to the owning engineer with:
   - The failure message
   - The test codeunit file path
   - The production code it tests

3. **Re-run bc-test** after fixes

4. **Repeat** until ALL tests pass

**Do NOT present to the user until ALL tests pass.**

## Step 8.5: Run Test Adversary (MANDATORY)

Once all tests pass, invoke `/verify-tests`. It runs automatically in a forked sub-agent with clean context (`context: fork`) — no manual agent spawning needed.

Pass as arguments:
- Path to all production AL files
- Path to all test AL files
- Task slug (for output path: `.dev/<task-slug>/06-test-verification.md`)
- Path to `.dev/<task-slug>/02-solution-plan.md` if it exists

**Wait for the adversary to complete before proceeding.**

### If adversary finds CRITICAL or MAJOR issues:

1. Dispatch fixes to the owning test engineer (by ID range) with the specific finding
2. Re-run `bc-test` to confirm tests still pass
3. Re-run the adversary sub-agent (fresh context again)
4. Repeat until the adversary reports no CRITICAL or MAJOR issues

### If adversary finds only MINOR issues or none:

Proceed to Step 9. Note the adversary verdict in the test plan.

**Do NOT present to the user until the adversary clears the suite.**

## Step 9: Write Test Plan Document

Write `.dev/<task-slug>/05-test-plan.md` as YOUR synthesis (not agent output). Include:

```markdown
# Test Plan — <Task Name>

## Test Coverage Summary

| Category | Count | Codeunit IDs |
|----------|-------|-------------|
| Unit Tests | X | 50100, 50101, ... |
| Integration Tests | X | 50200, 50201, ... |
| Scenario Tests | X | 50300, 50301, ... |
| Edge Case Tests | X | 50400, 50401, ... |
| **Total** | **X** | |

## Test Codeunits Created

| ID | Name | Category | Scenarios Covered |
|----|------|----------|------------------|
| ... | ... | ... | ... |

## Key Test Scenarios

1. ...
2. ...
(5–10 most important scenarios)

## Test Execution Results

- Total tests: X
- Passed: X
- Failed: 0
- Execution time: Xs

## Coverage Analysis

### What's Covered
- ...

### What's NOT Covered (and Why)
- ...

## Standards Applied (BCQuality)
The `testing`-domain BCQuality rules the suite follows, cited by path — so the user sees which
best-practices were enforced (e.g. test isolation, meaningful assertions). Note any `custom`-layer
(DI) rule that took precedence.
```

## Step 10: Present to User

Use **AskUserQuestion** (BLOCKING):

> **Test Suite Complete**
>
> Created X test codeunits with Y individual tests.
> - Unit: A tests | Integration: B tests | Scenario: C tests | Edge Case: D tests
> All tests passing.
>
> Test plan written to `.dev/<task-slug>/05-test-plan.md`
>
> **Options:**
> - **Approve** — Test suite is complete
> - **Add More Tests** — Specify additional scenarios to cover
> - **Review Failures** — Re-examine any borderline tests
> - **Stop** — Halt testing

---

## Key Rules

1. **Assign SPECIFIC scenarios** to each engineer, never just "write tests for X"
2. **Never present failing tests** to the user — fix them first
3. **Use bc-test features**: auto-detect from `app.json`, `--failures-only`, `-o` for file output
4. **All 4 agents run in PARALLEL** — do not run sequentially
5. **ID ranges must not overlap** — verify before and after agent execution
6. **One test per behavior** — no multi-assertion mega-tests
7. **The adversary always runs** — Step 8.5 is not optional. "All tests pass" is not a quality signal on its own.
