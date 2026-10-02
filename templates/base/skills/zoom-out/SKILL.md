---
name: zoom-out
description: Step back and re-evaluate scope, architecture or direction before committing to implementation.
mode: {{skillMode}}
---

# Zoom Out

Use when the work feels too local, the design is unstable, or a change could ripple across the project.

## Flow

- Summarize the higher-level problem in two or three sentences.
- Check the tasks against `docs/ARCHITECTURE.md`, `specs/CAPABILITIES.md` and the existing code: duplicated responsibilities, broken conventions, shared abstractions that should be reused.
- List a few viable approaches when there is a real choice.
- Call out long-term maintainability and context cost.
- Recommend the smallest option if uncertainty remains.

## Auto Policy

- Use automatically just before `implement`, when stories and tasks are defined and work moves from definition to delivery.
- Stop when the PM explicitly wants to move on to `implement`.
- Do not use automatically if no architecture, consistency or cross-cutting risk is visible.

## Manual Trigger

- `/zoomout` forces a consistency review before implementation.

## Keep It Lean

- Do not overexplore. Prefer decision support over exhaustive analysis.
- Return to the concrete task once the direction is clear.
