---
name: grill-me
description: Stress-test an idea, epic, user story or plan with focused questions before writing specs or code.
mode: {{skillMode}}
---

# Grill Me

Use when the PM needs help turning an idea into a clear epic, user story, acceptance criteria or plan.

## Goal

Remove ambiguity with the smallest useful set of questions, and leave a written agreement that later phases and reviewers can check against.

## Auto Policy

- Use automatically at the start of `spec` and `plan`, and for every EPIC0 bootstrap task.
- Use automatically when a new epic or user story appears and still needs scope sharpening.
- Use automatically when acceptance criteria, constraints or dependencies are unclear.
- Stop when the PM explicitly asks to close `spec` or `plan`. Generic agreement ("ok", "sounds good") answers the current question; it does not close the phase.
- Do not use for trivial edits, already-specified implementation work, or when the PM wants execution now.

## Manual Trigger

- `/grillme` forces a clarification pass even if the agent would not have selected it.

## Process

- Ask **one question at a time**, and offer your recommended answer with a one-line reason. The PM can accept it, correct it or skip.
- Read the existing docs and code first; never ask something the repository already answers.
- Cover: outcome, actors, constraints, dependencies, non-goals, edge cases and how we will know it works (acceptance criteria).
- Surface tradeoffs and hidden edge cases; propose alternatives when one exists.
- Write nothing to specs while grilling. Stop once the next artifact can be written without guessing.

## Do Not

- Start implementing.
- Ask endless or bundled questions.
- Collect details that do not change a decision.

## Output

- A concise summary of the clarified scope, ready to be written into the epic (`Problem`, `Non-Goals`, `User Stories`, acceptance criteria).
- The `Agreement` section of the epic: decisions taken, risks, open questions.
- The best next step: spec, plan or task split.
