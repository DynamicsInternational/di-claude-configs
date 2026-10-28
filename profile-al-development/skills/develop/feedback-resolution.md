# Feedback Resolution Protocol

Structured disposition protocol for managing review findings across iteration cycles.

---

## Severity Levels

### CRITICAL
Blocks progress. Must be fixed before code can be accepted.
- Security vulnerability (data exposure, permission escalation, injection risk)
- Data corruption risk (wrong table operations, missing validation on destructive actions)
- Design flaw that breaks core functionality (wrong architecture, missing essential component)
- Compilation error

### SERIOUS
Significant risk. Should be fixed unless there is a documented reason not to.
- Performance issue that will degrade under production load
- DRY violation (duplicated logic that will diverge over time), including the same business rule implemented in several places
- Over-abstraction that hurts readability: pass-through procedures, deep call chains, interfaces/factories with a single implementation, events outside business boundaries or beyond the Extensibility Level
- Parallel variant added next to an existing rule instead of changing it in place
- Wrong or outdated comment (misleads the next reader)
- Missing error handling on user-facing operations
- Incorrect BC pattern that will cause upgrade or integration issues

### MINOR
Improvement suggestion. Can be deferred without risk.
- Documentation gaps (missing procedure summary, incomplete ToolTips)
- Naming style inconsistencies (not wrong, but not ideal)
- Minor readability improvements
- Additional test scenarios that are nice-to-have

---

## Dispositions

Every finding from every reviewer must receive exactly one disposition:

### ACCEPT-FIX
Will fix now in this iteration.
- Assign to a developer.
- Track until fix is verified.
- Re-review after fix.

### ACCEPT-DEFER
Valid finding, but will fix later.
- Requires a tracking note (what, where, why deferred).
- Add to `.dev/<task-slug>/04-deferred-issues.md`.
- Must include estimated effort and risk of deferral.

### ACKNOWLEDGE
Noted and accepted as-is.
- The finding is valid but the current approach is acceptable.
- Brief explanation of why the trade-off is acceptable.
- No action required.

### DISMISS
Not applicable to this context.
- **Requires written reasoning.** You cannot dismiss without explanation.
- Common reasons: reviewer misunderstood the pattern, finding applies to a different BC version, requirement explicitly allows the flagged behavior.

---

## Rules

1. **CRITICAL findings must be ACCEPT-FIX.** No exceptions. You cannot defer, acknowledge, or dismiss a CRITICAL finding.
2. **DISMISS requires reasoning.** Every dismissed finding must include a one-sentence explanation of why it does not apply.
3. **ACCEPT-DEFER requires a tracking note.** Deferred issues must be documented with enough context to fix them later without re-investigating.
4. **All findings must be dispositioned.** No finding can be left without a disposition. If unsure, escalate to the user rather than ignoring it.
5. **Dispositions are final per iteration.** Once a finding is dispositioned, it does not change unless new information emerges in a subsequent review.

---

## Disposition Reporting Format

After all findings are dispositioned, produce a summary table:

```markdown
## Disposition Summary

| # | Finding | Reviewer | Severity | Disposition | Action / Reasoning |
|---|---------|----------|----------|-------------|-------------------|
| 1 | Missing SetLoadFields on Customer.Get | Performance | SERIOUS | ACCEPT-FIX | Assigned to Dev-1, fix in Customer Mgt. codeunit |
| 2 | Pass-through procedure `ValidateOrder` only forwards to `CheckCreditLimit` | AL Expert | SERIOUS | ACCEPT-FIX | Assigned to Dev-1, inline and call `CheckCreditLimit` directly |
| 3 | ToolTip could be more descriptive | AL Expert | MINOR | ACKNOWLEDGE | Current ToolTip is adequate for MVP |
| 4 | Potential SQL injection via SetFilter | Security | CRITICAL | ACCEPT-FIX | Assigned to Dev-2, add input sanitization |
| 5 | Unused local variable | AL Expert | MINOR | DISMISS | Variable is used in a conditional branch the reviewer missed (line 45) |
```

---

## Exit Condition

The review-fix cycle is complete when ALL of the following are true:

1. Every finding from every reviewer has a disposition.
2. No findings with disposition ACCEPT-FIX remain (all fixes have been applied and verified).
3. Each reviewer whose CRITICAL/SERIOUS findings were fixed confirms: **"APPROVED"**.
4. All ACCEPT-DEFER items are documented in `.dev/<task-slug>/04-deferred-issues.md`.

---

## Stall Prevention

If the same finding appears **3 or more times** across review iterations without resolution:

1. **Stop the review loop.**
2. Document the stalled finding with full context:
   - What the finding is.
   - What fixes were attempted.
   - Why the fixes did not resolve it.
3. **Escalate to the user** via AskUserQuestion with the stall report.
4. Wait for user direction before continuing.

This prevents infinite loops where a developer "fixes" an issue but the reviewer keeps flagging it.

---

## Iteration Tracking

Track review iterations in the code review report:

```markdown
## Review Iterations

### Iteration 1
- Findings: 12 (3 Critical, 5 Serious, 4 Minor)
- Dispositions: 3 ACCEPT-FIX, 2 ACCEPT-DEFER, 4 ACKNOWLEDGE, 3 DISMISS (with reasoning)
- Fixes applied: 3
- Status: Re-review needed for Critical fixes

### Iteration 2
- Findings: 2 (0 Critical, 1 Serious, 1 Minor)
- Dispositions: 1 ACCEPT-FIX, 1 ACKNOWLEDGE
- Fixes applied: 1
- Status: APPROVED by all reviewers
```
