---
name: bc-source
description: Look up Business Central base application source code (tables, pages, codeunits, events) across all versions and localizations. Use this to verify object structures, find event publishers, check field definitions, or compare an object across BC versions.
---

# /bc-source — BC Base App Source Lookup

Reference for BC base application AL source code, served by the **`bc-source-mcp`** server
(data: `StefanMaron/MSDyn365BC.Sandbox.Code.History`, 545 branches across v23-v29 and 47+
localizations). Use this when you need to verify table structures, find event publishers,
check page layouts, read standard implementations, or compare an object across versions.

## Prefer the MCP tools

The `bc-source-mcp` server returns **parsed, targeted** results (object slices, procedure
bodies, typed event lists, FTS snippets) instead of raw file dumps — this keeps the main
context clean and works identically on Windows/macOS/Linux. Drive the MCP tools first; only
fall back to git+grep if the server is unavailable (see end).

> **Which source tool?** Use **`bc-source-mcp`** (this skill) to read base-app *source
> history* across versions. Use **`al-mcp-server`** when you only need the symbols of the
> *current project's actual dependencies* (what compiles). They overlap on "find an event in
> the base app" — prefer `bc-source-mcp` when you need the implementation or a specific version.

## Pick the branch

The server is branch-scoped. Determine the customer's BC version from `app.json`
(`application` / `platform` / `runtime`), then target the branch.

Branch naming: `{country}-{major}` — `w1` (worldwide), `us`, `de`, `fr`, … e.g. `w1-27`, `us-26`.

```
bc_list_versions          # available BC versions / vNext variants
bc_list_localizations     # country codes (w1, us, de, fr, …)
bc_list_branches          # full branch inventory (545)
bc_cache_status           # what is already indexed locally
```

First access to a branch triggers indexing (~10 s); subsequent lookups are <100 ms.

## Common use cases → tools

### Read an object (table, page, codeunit, …)
```
bc_get_object  { branch: "w1-27", type: "table", name: "Purchase Header" }
# large file? request a line range instead of the whole object
bc_get_object  { branch: "w1-27", type: "table", name: "Purchase Header", startLine: 1, endLine: 120 }
```

### Find the right event to subscribe to
```
bc_get_event_publishers  { branch: "w1-27", type: "codeunit", name: "Approvals Mgmt." }
# returns Integration/Business/Internal events with signatures — no grep guessing
```

### Inspect a specific procedure
```
bc_get_procedure  { branch: "w1-27", type: "codeunit", name: "Approvals Mgmt.", procedure: "CheckApprovalPossible" }
# signature + body + attributes
```

### Search the base app
```
bc_search_fts   { branch: "w1-27", query: "OnAfterCheckApprovalPossible" }   # full-text, snippets
bc_search_code  { branch: "w1-27", pattern: "OnAfterCheck.*ApprovalPossible", type: "codeunit" }   # regex (ripgrep)
```

### Verify a field exists / check field properties
```
bc_get_object   { branch: "w1-27", type: "table", name: "Customer" }
# inspect fields, DataClassification, OptionMembers, etc.
```

### Discover what exists
```
bc_list_apps     { branch: "w1-27" }
bc_list_objects  { branch: "w1-27", type: "page", filter: "Purchase" }
```

### Compare an object across versions / localizations
```
bc_find_object_across_branches  { type: "table", name: "Sales Header" }
# presence + variations across indexed branches
```

### Cache admin (rarely needed)
```
bc_refresh       # re-fetch + re-index (also rebuilds FTS after server updates)
bc_prune_cache   # remove worktrees to reclaim disk
```

## Typical use cases

1. **Verify a field exists** on a table before writing a table extension
2. **Find the right event** to subscribe to (typed publisher list, not a grep)
3. **Check field types/properties** (DataClassification, OptionMembers, …)
4. **Understand data flow** by reading codeunit procedures
5. **Find page controls** to place extension fields
6. **Compare behaviour** of an object between BC versions

## Fallback (no MCP server)

If `bc-source-mcp` is not available, clone the matching branch and grep manually. On Windows,
run these via the Bash tool (Git Bash), not PowerShell.

```bash
# Shallow single-branch clone
git clone -b w1-27 --single-branch --depth 1 \
  https://github.com/StefanMaron/MSDyn365BC.Sandbox.Code.History.git \
  /tmp/bc-source 2>/dev/null || echo "Already cloned"

# Find objects / events (base app lives in BaseApp/Source/)
grep -rl 'table 38 ' /tmp/bc-source/BaseApp/Source/ | head -5
grep -rn 'IntegrationEvent' /tmp/bc-source/BaseApp/Source/**/ApprovalsMgmt.Codeunit.al
```

File pattern within BaseApp: `{ObjectName}.Table.al`, `.Page.al`, `.Codeunit.al`, `.Report.al`, `.Enum.al`.
</content>
