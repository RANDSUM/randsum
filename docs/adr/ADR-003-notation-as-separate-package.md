# ADR-003: Notation as separate zero-dependency package

## Status

Accepted

## Context

Dice notation parsing was originally embedded within `@randsum/roller`. Some consumers wanted notation validation, parsing, or formatting without the full roll engine -- for example, form validation in a character sheet app or notation display in documentation tooling.

## Decision

Extract notation parsing into `@randsum/notation` as a standalone zero-dependency package. The roller imports and re-exports notation's public API so that roller consumers get notation functionality without an extra install.

## Consequences

- Consumers who only need notation parsing get a smaller install with zero transitive dependencies.
- Clear architectural boundary: notation handles syntax, roller handles execution.
- Roller re-exports notation's API, so existing roller consumers are unaffected.
- Trade-off: releases must be coordinated between notation and roller when notation's API changes, since roller depends on it.
- Trade-off: two packages to maintain instead of one, with version alignment expectations.
