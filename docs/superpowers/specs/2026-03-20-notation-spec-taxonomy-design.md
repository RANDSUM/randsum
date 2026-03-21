# RANDSUM Dice Notation Spec Taxonomy Design

**Status:** Approved
**Date:** 2026-03-20
**Author:** 5-expert consensus (Taxonomy Specialist, Dice Fanatic, VTT Developer, Spec Analyst, Information Scientist)

## Goal

Create a formal specification document (`RANDSUM_DICE_NOTATION_SPEC.md`) for the RANDSUM dice notation system, replacing ad-hoc category groupings with a rigorous faceted classification. Implement Conditional Explode as the first feature designed under the new taxonomy.

## Key Design Decisions

### 1. Faceted Classification (not hierarchical)

The system uses 4 independent classification facets:

| Facet | Values | Type |
|-------|--------|------|
| Derivation Status | Primitive, Alias, Macro | Closed |
| Pipeline Stage | 1 (Deterministic), 2 (Stochastic), 3 (Total) | Closed |
| Operational Verb | Clamp, Map, Filter, Substitute, Generate, Accumulate, Scale, Reinterpret | Open |
| Output Channel | Pool, Total | Closed (derived from Stage) |

### 2. Eight Verbs (down from 10)

Removed Dispatch (control flow, not transformation) and Order (display, not pipeline).

### 3. Sort, Annotations, Repeat exit modifier taxonomy

- Sort -> Presentation Directive
- Annotations -> Notation Metadata
- Repeat -> Parser Directive

Still documented in the modifier reference, just categorized differently.

### 4. Conditional Explode (`!{condition}`)

Extends explosion trigger from "max value" to any Condition Expression. Passes all Four Gates. Backward compatible (bare `!` = `!{=max}`).

### 5. Conformance Levels

4 tiers: Core -> Pool -> Advanced -> Full.

### 6. Condition Expression

Formally named shared sub-grammar: `{>N}`, `{<N}`, `{>=N}`, `{<=N}`, `{=N}`, `{N}`.

## Spec Document Structure

See plan at `docs/superpowers/plans/2026-03-20-notation-spec-taxonomy.md` for Task 1 which details all 10 sections + 4 appendices.

## Implementation Plan

Plan: `docs/superpowers/plans/2026-03-20-notation-spec-taxonomy.md`

8 tasks:
1. Write the formal spec document
2. Define ExplodeOptions type
3. Implement shared condition matcher
4. Implement Conditional Explode
5. Implement Conditional Compound and Penetrate
6. Update existing notation doc
7. Update internal doc references
8. Run full validation
