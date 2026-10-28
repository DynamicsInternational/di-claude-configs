---
name: al-metrics
description: Measure over-structure in an AL app — call depth, relay (pass-through) procedures, events without subscriber, dead code, comment noise (<param> lines, ticket history), single-implementation interfaces, Boolean parameter lists. Static, fast, no BC needed. Used at the end of /develop (informative, never blocking), for a baseline before a refactor, and to compare two versions of the plugin.
---

# /al-metrics — AL Structure Metrics

A static scan of the app's `.al` files that points the reviewer at over-structure. It is an
**approximation** (regex-based, no compiler): it never fails a task, it shows where to look.

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/al-metrics/al-metrics.js" <appDir> [options]
```

| Option | Effect |
|--------|--------|
| `--level pte\|product` | Extensibility Level — read from `.dev/project-context.md` when omitted |
| `--changed <git-ref>` | Detail sections only list findings in `.al` files changed since `<git-ref>` (totals stay app-wide) |
| `--json <file>` | Full result (metrics + details) |
| `--md <file>` | Markdown summary (otherwise printed) |
| `--baseline <metrics.json>` | Show the delta of each metric against a previous JSON |

## What It Measures

| Metric | What it catches | How |
|--------|-----------------|-----|
| Max call depth / deepest chains | Logic spread over long call chains | Longest chain of the app's own procedures from an entry point (trigger, subscriber, uncalled procedure) |
| Relay procedures | Pass-through procedures | Body is one statement that is only a call to another procedure (`exit(F(x))` included; `exit(F(x) = 1)` is not) |
| Events without subscriber | Speculative extensibility | `IntegrationEvent`/`BusinessEvent` with no subscriber in the app; `IsHandled` publishers counted |
| Dead local/internal procedures | Code left behind | Never called anywhere in the app |
| Unreferenced public procedures | Possible dead code or public API | Never called in the app — check before removing |
| Comment ratio, `/// <param>` lines, history comments | Comment noise | Comment lines vs code; ticket numbers, dates, "modified on/by" |
| Single-implementation interfaces | Abstraction without a second implementation | `interface` implemented by 0 or 1 object |
| Procedures with ≥3 Boolean params | Positional flag lists | Count of `Boolean` parameters |
| SingleInstance codeunits | Hidden state | `SingleInstance = true` |

Thresholds (the ⚠ marks) live in the script only — they are never rules or targets.

## Reading the Results

- **Events without subscriber**: expected on a `Product` app (public extensibility); on a `PTE` each
  one needs a concrete consumer or a reason (see `rules/al-architecture.md`).
- **Relays and deep chains**: candidates for inlining — check that the intermediate procedure does not
  carry a business name worth keeping (a named predicate, a real seam).
- **Dead code**: name-based detection; procedures called through `Codeunit.Run`, reflection or another
  app are not seen. Confirm before deleting.
- **Unreferenced public procedures**: may be API for other apps — never delete on this signal alone.

## Uses

- **End of `/develop`**: scan with `--changed <base-ref>` and hand the summary to the AL Expert reviewer
  (subtractive review). Informative only.
- **Baseline before a refactor**: `--json .dev/metrics-baseline.json`, then compare later with `--baseline`.
- **Plugin A/B**: same request implemented with two plugin versions, compare both JSONs.
