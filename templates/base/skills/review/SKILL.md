---
name: review
description: Independent, read-only review of a user story against its acceptance criteria (or of an epic spec before planning), with a deterministic verdict.
mode: {{skillMode}}
---

# Review

An independent judge. The producer (the main session) wrote the spec and the code; the reviewer checks them with a **fresh context**, reading files from disk. It never produces and never fixes.

## How It Runs

- Preferred: the `sdd-reviewer` subagent (installed per platform), invoked by the main session.
- No subagents available: run it in a new chat with only this file and the pointers below. Never review your own work in the same context that produced it and call it independent.
- The caller passes **file pointers, not summaries**: the epic file, `TASKS.md`, `PLAN.md`, `docs/ARCHITECTURE.md`, and the list of files changed for the US (for example from `git status` / `git diff --name-only`). Paraphrased context is where scope drift hides.

## Hard Rules

- Read-only on code and specs. The only file you write is `specs/EPICX/REVIEW.md` (append a section; never rewrite previous ones).
- Do not invoke other agents. Do not run commands that modify files (formatters with write mode, migrations, installs).
- **Silence is not approval.** A check you could not run is reported `N/A` with its reason, never `PASS`. If something essential could not be verified, the verdict is `NOT_VERIFIED`.
- **Scope fence.** Be strict only with files new or modified for this US. Problems in untouched code go to `Observations` and never affect the verdict.

## Mode `us` (default): `/sdd-review EPICX/USn`

1. **Tests.** Run the test command from `docs/ARCHITECTURE.md`. Failing tests → CRITICAL. No test command or it cannot run → `NOT_VERIFIED` (say what is missing).
2. **Tasks.** Every task of the US is implemented in the code, not just ticked.
3. **Acceptance criteria traceability.** One row per AC of the US: where it is implemented and which test proves it.

   | AC | Implementation | Test | Status |
   | --- | --- | --- | --- |
   | AC2.1 | `src/x.py:load()` | `tests/test_x.py::test_load` | PASS |

   AC not implemented → MAJOR. AC implemented but no test covers it → MAJOR. Behavior beyond the AC and the `Agreement` of the epic (scope creep) → MAJOR.
4. **Quality of new or modified code** (core, applies to every language):
   - Function longer than 20 lines or nesting deeper than 3 levels → MAJOR.
   - Logic duplicated from existing code that should be reused → MAJOR.
   - Generic names without meaning (`handle`, `process`, `data`, `doIt`) → MAJOR.
   - External input interpolated into SQL or shell commands → CRITICAL. Secrets logged or exposed in errors → MAJOR. Missing input validation at a public entry point → MAJOR.
   - Main methods without a comment where one would help, changed behavior without tests → MINOR / MAJOR respectively (Definition of Done).
   - Layer rules from `docs/ARCHITECTURE.md` broken (for example data access in a controller) → CRITICAL.
5. **Stack catalogs** (if `skills/review/catalogs/` exists): read its `README.md`, activate the catalogs whose `activates_on` match the changed files (plus framework catalogs whose markers exist in the repository), and apply their rules with their severities. A changed file no catalog covers → `N/A — no catalog for <extension>`, and keep reviewing by reading. If the catalogs folder exists but holds no catalog, say the installation is incomplete; do not report every file as `N/A`.
6. **Docs drift.** A documented contract (`docs/ARCHITECTURE.md`, README, API docs) contradicted by the change → MAJOR.

## Mode `spec`: `/sdd-review spec EPICX`

Check the epic before it leaves `spec`:

- Every US follows the template and meets the Definition of Ready in `AGENTS.md`.
- Every AC is testable (Given/When/Then, observable result). Vague words ("fast", "user-friendly") without a measure → MAJOR.
- **Implementability:** could a developer who did not write this spec implement it from the spec alone? Every gap that needs unwritten knowledge → MAJOR.
- Consistency with the `Agreement`, `Non-Goals`, `specs/SPECS.md` and `specs/CAPABILITIES.md` (contradictions, duplicated capabilities) → MAJOR.

## Verdict (mechanical, no discretion)

- `REJECTED`: at least one CRITICAL.
- `CHANGES_REQUESTED`: no CRITICAL, at least one MAJOR.
- `APPROVED`: no CRITICAL and no MAJOR (MINOR allowed).
- `NOT_VERIFIED`: an essential check could not run. It is not a verdict on the code; it says what is missing.

`N/A` rows never count as approvals. Observations on untouched code never count.

## Report Format (append to `specs/EPICX/REVIEW.md`)

```markdown
## USn - Review k (YYYY-MM-DD)

**Verdict:** APPROVED | CHANGES_REQUESTED | REJECTED | NOT_VERIFIED

### Tests
<command, result>

### Acceptance Criteria
<traceability table>

### Findings (new or modified code)
1. [CRITICAL|MAJOR|MINOR] `file:line` - problem - required correction

### Observations (untouched code, non-blocking)
- ...

### N/A
- <check> - <reason>
```

Write the report in the documentation language declared in `AGENTS.md`. Return to the caller only the verdict and the numbered findings.
