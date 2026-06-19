---
name: bcquality-citation
description: Protocol for grounding AL/BC work in the BCQuality best-practice corpus (Microsoft + community + Dynamics International custom layers) served by the bcquality-mcp server, and citing it by path. Use during design, code generation, and review so decisions and findings are backed by traceable BCQuality rules.
---

# /bcquality-citation — Ground AL work in the BCQuality corpus

`bcquality-mcp` exposes Microsoft's **BCQuality** rule corpus (domains: performance, security,
privacy, style, testing, ui, upgrade) across three layers with increasing precedence:
**`microsoft` < `community` < `custom`**. The `custom` layer is the Dynamics International fork
(`DynamicsInternational/BCQuality`) — when a rule exists there it **overrides** the Microsoft/
community version. This is how DI house standards take priority everywhere.

Use this protocol whenever an agent **designs, generates, reviews, or tests** AL code. It is a
*pull* source: it has zero effect unless an agent actively queries it. The standing `rules/`
files remain the always-on guardrails; BCQuality provides depth, examples, and citations.

## When to use which source
- **`rules/`** (auto-loaded) — terse non-negotiable guardrails (engineering, architecture, naming/affix, diagnostics). Always present, offline, deterministic.
- **`bcquality-mcp`** (this skill) — deep, evolving, **citable** best-practices + `.good.al`/`.bad.al` examples. Pulled on demand at decision points.
- **`bc-code-intelligence-mcp`** — open-ended *expert consultation* (personas, architecture reasoning). Use for "how should I approach this?", not for rule citation.

## Three modes

### DESIGN — planners / architects (`/plan`)
Before committing to an approach, pull the applicable rule set once for the whole task:
```
bcquality_get_applicable_for_context  { goal: "<feature goal>", bcVersion: <from app.json> }
```
Record the returned rule paths as constraints in `02-solution-plan.md`. This is the flagship
call — it returns scored, layer-deduplicated rules with inline sections, ready to consume.

### GENERATE — developers (`/develop`, `/fix`)
Before writing a module, retrieve rules + concrete patterns for that module's concern:
```
bcquality_search_knowledge  { query: "<concern>", domain: "<domain>" }
bcquality_get_examples      { path: "<rule path>" }   # .good.al / .bad.al
```
`/fix` stays lightweight: only query when the fix touches a flagged concern (perf, security, privacy).

### CHECK — reviewers / test reviewers (`/develop`, `/test`, `/verify-tests`)
Verify the code against the relevant domain and **cite every finding by path**:
```
bcquality_list_knowledge  { domain: "<domain>", bcVersion: <n> }
bcquality_get_knowledge   { path: "<rule path>" }
```

## Citation contract
Every design constraint, generated decision, or review finding grounded in BCQuality MUST carry
its source path so the reasoning is traceable:

```
references:
  - performance/use-setloadfields-for-partial-records.md
  - security/classify-every-field-with-dataclassification.md
```

A finding without a `references` path is an opinion, not a BCQuality-backed rule — label it as such.

## Surface references in user-facing deliverables
Citations must not stay buried in agent chatter — they belong in the documents the user reads.
Every synthesized deliverable carries a **Standards Applied (BCQuality)** section (or a `BCQuality
Ref` column on its finding tables) listing the rule paths that shaped the work:

| Deliverable | Where the references go |
|---|---|
| `02-solution-plan.md` (`/plan`) | "Standards Applied (BCQuality)" section |
| `03-code-review.md` (`/develop`) | `BCQuality Ref` column on issue tables + "Standards Applied" section |
| `05-test-plan.md` (`/test`) | "Standards Applied (BCQuality)" section |
| `06-test-verification.md` (`/verify-tests`) | "Standards Applied (BCQuality)" section |

Always flag which references came from the **`custom`** (Dynamics International) layer, so the user
can tell house standards from Microsoft/community guidance.

## Agent → domain mapping
| Agent / role | BCQuality domain(s) |
|---|---|
| Architect (`/plan`) | `get_applicable_for_context` (all, scoped by goal) |
| Developer (`/develop`, `/fix`) | domain(s) of the module + `get_examples` |
| Security reviewer | `security`, `privacy` |
| Performance reviewer | `performance` |
| AL-expert reviewer | `style`, `ui`, `upgrade` |
| Test coverage reviewer / test engineers (`/test`, `/verify-tests`) | `testing` |

## Optimization — cache per task
The **first** agent that queries BCQuality in a task writes the applicable rule set to
`.dev/<task-slug>/bcquality-context.md`. Subsequent agents in the same task **read that file
first** and only query the server for gaps. This preserves context, avoids redundant calls, and
removes run-to-run scoring variance within a task.

## Maintenance notes
- The corpus is pulled from `DynamicsInternational/BCQuality` (configured via `BCQUALITY_REPO_URL`).
- After publishing new rules to the fork, call `bcquality_refresh` to re-index without restarting.
- `bcquality_status` reports the active commit and per-layer article counts.
- DI house rules belong in the fork's `/custom/` layer — they then override Microsoft automatically.
</content>
