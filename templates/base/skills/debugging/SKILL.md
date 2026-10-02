---
name: debugging
description: Root-cause-first debugging for failing tests, bugs and behavior that does not match the spec.
mode: {{skillMode}}
---

# Debug

Use when a test fails unexpectedly, a bug is reported, or behavior does not match an acceptance criterion.

## Flow

1. **Reproduce** the problem reliably and isolate the smallest case. If you cannot reproduce it, say what you tried and stop: do not fix blind.
2. **Write a failing test** that captures it (regression test), when the behavior is testable.
3. **Trace** backwards from the failure point: inputs, state and the decision point where the wrong path was taken.
4. **Find the root cause** by asking "why" until the answer is a defect, not a symptom. Name the file and function.
5. **Fix the root cause** with the minimal change. Consider side effects.
6. **Verify**: the regression test passes and the whole suite is green.

## Do Not

- Suppress errors (empty catch blocks, broad try/except) to make a symptom disappear.
- Hardcode values to make a test pass.
- Fix more than the root cause in the same change; propose the rest as new tasks.

## Output

A short report: symptom, reproduction, root cause (file/function), fix applied, verification result.

## Modes

- `auto`: use it whenever a test fails for a reason you do not immediately understand.
- `manual`: on `/sdd-debug`.
