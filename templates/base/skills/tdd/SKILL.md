---
name: tdd
description: Build or change code with a red-green-refactor loop, one vertical slice at a time.
mode: {{skillMode}}
---

# TDD

Use when implementing a feature or a fix whose behavior tests can express.

## Flow

1. Pick one acceptance criterion or one behavior of the task.
2. Write the smallest failing test against the public interface. **Run it and see it fail** for the expected reason; a test that never failed proves nothing.
3. Make it pass with the least code. No extra functionality beyond what the test demands.
4. Refactor while keeping the suite green.
5. Repeat for the next behavior: happy path first, then edge cases and errors.

## Scope

- New or changed behavior: always test first.
- Bug fixes: start with a regression test that reproduces the bug, then fix.
- Pre-existing code you are not changing: do not add tests or refactor it "to make it testable". You may note the gap as an observation.

## Keep It Lean

- Test behavior, not internals. Prefer integration-style tests over mocks of your own code.
- Never mark a task `[<]` with failing or skipped tests, or with tests without real assertions.
- Report what was tested: tests written, edge cases covered, suite result.

## Modes

- `auto`: apply it to every task that adds or changes behavior.
- `manual`: start a TDD pass on `/tdd`.
