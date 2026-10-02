# Changelog

## 0.9.0 - 2026-10-02

First release of AgileSDD Plus, a fork of AgileSDD 0.8.0 merged with the quality discipline of devAgent. Details and rationale in `docs/DECISIONS.md`.

### Added

- Acceptance criteria (`ACn.m`, Given/When/Then) for every user story, traced from tasks and checked in review.
- Definition of Ready and Definition of Done in the constitution.
- `docs/METHODOLOGY.md`: per-phase playbook, read one section at a time.
- `Close` step: living spec `specs/CAPABILITIES.md`, `docs/CHANGELOG.md` and a three-line retro.
- Backlog section in the roadmap, autonomy mode per user story, change classification (scope / implementation / bug).
- `review` skill and `sdd-reviewer` subagent: independent, read-only review with a deterministic verdict.
- Audit catalogs (from devAgent) plus new `java`, `spring-boot` and `swing` catalogs.
- `debugging` skill; stricter `tdd` skill (see it fail first, regression tests for bugs).
- Thin adapters for Claude Code, Antigravity and OpenCode (`--platforms`), and `CLAUDE.md` importing `AGENTS.md`.
- `sdd-guard` hook for Claude Code: closed epics are read-only.

### Fixed

- Dangling reference to `docs/METHODOLOGY.md`; leftover "Program Planner" title; `open` vs `WIP`/`closed` status; `tdd` auto mode inconsistency; architecture template describing the methodology instead of the project; undefined "Update docs" step.
- The Visual Studio `.gitignore` silently ignored any `debug/` folder (a template would be packaged but never committed).

### Changed

- Package renamed to `create-agile-sdd-plus` (the original `create-agile-sdd` belongs to its author).
- Test suite: 5 → 14 tests.
