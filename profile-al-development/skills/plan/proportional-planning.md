# Proportional Planning Guidelines

Planning effort must be proportional to task complexity. Over-planning simple tasks wastes time and creates noise. Under-planning complex tasks causes rework. Get the balance right.

## Complexity Tiers

### TRIVIAL (1 file, obvious change)

**Skip planning entirely.** Just build it. Examples: adding a field to an existing table extension, fixing a typo in a caption, updating a tooltip.

No requirements document. No solution plan. No architect agents. Just do the work.

### SIMPLE (2-3 files)

**Total plan: 100-150 lines.**

- Brief requirements: 50-75 lines
- Brief solution: 50-75 lines

What to include:
- What you're building (1 paragraph)
- Object list (table with type, name, purpose)
- Key fields or business rules (bullet list)
- Implementation sequence (numbered list, 3-5 steps)

What to skip:
- ASCII diagrams
- Alternative approaches analysis
- User stories or personas
- Detailed state machines
- Mermaid flowcharts

### MEDIUM (4-8 files)

**Total plan: 200-400 lines.**

- Requirements: 100-150 lines
- Solution: 100-250 lines

What to include:
- Brief architecture overview (2-3 paragraphs)
- Object allocation table
- Key design decisions with brief rationale
- Reuse & Extension (existing code modified in place) and Test Approach (per Test Policy)
- Implementation sequence
- One minimal diagram only if data flow is genuinely confusing

What to skip:
- Multiple alternative designs with detailed pros/cons
- Extensive user stories
- Diagrams for obvious relationships
- Paragraph-length justifications for standard patterns

### COMPLEX (9+ files)

**Total plan: 400-800 lines.**

- Requirements: 150-300 lines
- Solution: 300-600 lines

What to include:
- Full architecture description
- Comprehensive object allocation
- Reuse & Extension (existing procedures modified in place, business rules added/changed/removed)
- Test Approach per Test Policy (entry points, pure calculations, scenarios) — no interfaces or mocks planned for testing
- Key alternatives considered with rationale for rejection (brief)
- Integration points and data flow
- Implementation sequence with dependencies
- Risk assessment
- Diagrams where they genuinely clarify (not decorate)

Even COMPLEX plans should not exceed 800 lines total. If your plan is longer, you're describing implementation, not architecture.

## Red Flags — Signs of Over-Planning

Watch for these anti-patterns:

- **ASCII diagrams for 3-file changes.** If you can describe the architecture in 2 sentences, you don't need a diagram.
- **Alternative approaches analysis for obvious patterns.** If you're adding a table extension and a page extension, there is no "alternative approach" to debate.
- **User stories for field additions.** "As a sales manager, I want to see the discount percentage on the sales order" — this adds nothing the requirement didn't already say.
- **500+ line plans for simple features.** If the plan is longer than the implementation will be, something has gone wrong.
- **Mermaid diagrams for CRUD operations.** Create, Read, Update, Delete does not need a flowchart.
- **Testability architecture for a single FlowField.** Not everything needs dependency injection analysis.

## Good vs. Bad: A Concrete Example

### The Task

Add a "Blocked" boolean field to a custom table, with a check that prevents posting when blocked.

### BAD: The 946-Line Plan

```markdown
# Requirements Document (387 lines)

## 1. Executive Summary
The organization requires the ability to block records from being processed
in downstream operations. This document outlines the comprehensive requirements
for implementing a blocking mechanism...

## 2. User Stories
- As a purchasing manager, I want to block vendors so that...
- As an accounts payable clerk, I want to see which vendors are blocked so that...
- As a system administrator, I want to audit block/unblock actions so that...
[12 more user stories]

## 3. Functional Requirements
### 3.1 Field Requirements
#### 3.1.1 Blocked Field
The system shall provide a Boolean field named "Blocked" on the Vendor Card...
[detailed field specification spanning 40 lines]

### 3.2 Validation Requirements
#### 3.2.1 Posting Validation
[flowchart of validation logic]
[state diagram]
[decision matrix]

## 4. Non-Functional Requirements
### 4.1 Performance
The blocked check shall execute in under 50ms...
[performance specifications for a boolean check]

## 5. Acceptance Criteria
[25 acceptance criteria for a boolean field]

---

# Solution Design (559 lines)

## Architecture Overview
[3 paragraphs describing the architecture of adding a boolean field]

## Alternative Approaches
### Option A: Boolean Field
[detailed analysis]
### Option B: Enum with Multiple Block States
[detailed analysis of an approach nobody asked for]
### Option C: Separate Blocking Table
[detailed analysis of severe over-engineering]

## Comparison Matrix
| Criteria | Option A | Option B | Option C |
[15-row comparison table]

## Testability Architecture
### Dependencies
- Database access for reading Blocked field
- Posting routine integration
### Interfaces
- IBlockValidator
- IPostingBlockCheck
### Mock Strategy
[detailed mocking plan for a boolean check]

## Data Flow Diagram
[ASCII art showing data flowing through a boolean field]

## Implementation Plan
[detailed 30-step implementation plan]
```

### GOOD: The 120-Line Proportional Plan

```markdown
# Plan: Add Blocked Field to Vendor Processing

## What We're Building
Add a "Blocked" boolean to the custom vendor setup table. Check it before posting
and show a clear error. Surface the field on the vendor setup card and list.

## Objects

| Type | Name | Change |
|------|------|--------|
| TableExt | PROJ Vendor Setup | Add "Blocked" Boolean field |
| PageExt | PROJ Vendor Setup Card | Add Blocked field to General group |
| PageExt | PROJ Vendor Setup List | Add Blocked column |
| Codeunit | PROJ Vendor Posting Check | Add blocked check (subscribe to OnBeforePost) |

## Key Rules
- Blocked = true prevents posting with error 'Vendor %1 is blocked for processing.'
- Field visible on card and list, editable with modify permission
- Subscribe to OnBeforePostVendorDocument event

## Sequence
1. Add field to table extension
2. Add check to posting codeunit (event subscriber)
3. Add field to page extensions
4. Add test: post with blocked=true, verify error
5. Add test: post with blocked=false, verify success

## Acceptance Criteria
- [ ] Blocked vendor cannot be posted — clear error message
- [ ] Unblocked vendor posts normally — no regression
- [ ] Field visible and editable on card and list
```

The second plan has everything a developer needs. The first plan has 826 lines of noise.

## Enforcement

When reviewing architect output or your own plans, count the lines. If a SIMPLE task plan exceeds 200 lines, cut it. If a MEDIUM task plan exceeds 500 lines, cut it. If any plan exceeds 800 lines, something is wrong.

Ask yourself: "Could a competent AL developer build this from my plan?" If yes, stop writing. If no, add only what's missing — don't add what's obvious.
