# AGENTS Constitution

This project follows a lean, docs-first SDD Agile workflow. This file is the constitution: short on purpose. The step-by-step playbook for each phase lives in `docs/METHODOLOGY.md`; read only the section of the phase you are in.

## Non-Negotiables

- Read `docs/ROADMAP.md` first in every new chat or agent start.
- Treat docs as the source of truth. If something changes, the docs change first.
- Keep context small. If something is not needed for the current task, do not load it.
- Never guess business content, scope, or domain specifics. If they are not documented, ask the PM a focused question.
- Be honest: when something is not achievable, say so and propose an alternative instead of forcing it.
- Prefer small, reusable skills and small, focused specs.
- Use MCP tools only when they add real value.
- Git flow is managed by developers, not agents, unless the developer explicitly asks otherwise. Agents may suggest a commit message when a task reaches `[<]`.
- **Project Bootstrapping (EPIC0):** scaffold files, templates, `README.md` and `package.json` are placeholders. Do not infer the project's specs, architecture or roadmap from them. Run an interactive Q&A with the PM (`grill-me`) before writing `specs/SPECS.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` or `AGENTS.md`.
- When in doubt, ask before acting.

## Language

- Documentation language for this project: `//TBD in EPIC0 [T3]` (default: the language the PM writes in).
- Code, identifiers and code comments follow `docs/ARCHITECTURE.md` (default: English).
- Status markers, IDs (`EPICX`, `USn`, `ACn.m`, `Tn`) and file names never change with the language.

## Navigation Rule

Load only the minimum context required:

1. `docs/ROADMAP.md`: locate the current epic and its status (`spec`, `plan`, `tasks`, `implement`, `review`).
2. `docs/METHODOLOGY.md`: read only the section of that phase.
3. `specs/EPICX/` files needed for the current step. Do not open unrelated epics, plans or tasks.
4. `docs/GLOSSARY.md` only when a term is unclear. `docs/ARCHITECTURE.md` before implementing or reviewing.
5. `specs/CAPABILITIES.md` when you need to know what the system already does today.
6. Skills: read `skills/README.md` first, then a single `SKILL.md` only when the task calls for it.

Then report the current state to the PM and propose the next step.

## Status Legend

Epics (in `docs/ROADMAP.md`): `new` → `spec` → `plan` → `tasks` → `implement` → `review` → `done`.

Plan and task files: `WIP` or `closed`.

Tasks (in `specs/EPICX/TASKS.md`):

- `[ ]` pending
- `[-]` in progress
- `[!]` blocked
- `[<]` ready for review
- `[>]` review in progress
- `[x]` done (implemented, verified, reviewed and approved by the PM)

`[Tn]` after the status is the task id (`[ ] [T3]`). `[Blocked by Tn, Tm]` lists blocking tasks. `(AC n.m)` at the end of a task names the acceptance criteria it covers.

## Definition of Ready (a US may enter `tasks`)

- Written as `As a X, I want Y, so I can Z`.
- Has at least one testable acceptance criterion (`ACn.m`, Given/When/Then).
- No open question blocks it, and its dependencies are named.
- Small enough to be split into tasks that each fit in one working session.

## Definition of Done (a task may be marked `[<]`)

- The smallest useful change that satisfies the task, inside the scope of its US.
- Tests added or updated for the changed behavior (edge cases included) and the whole suite passing.
- Main methods or functions commented where it improves readability.
- Docs updated if the change affects a documented contract.
- A US is done (`[x]`) only when its acceptance criteria are verified and the PM approves it.

## Write Scope

- Writable: the code, `docs/`, and the folder of the **current** epic.
- Read-only history: the folders of epics marked `done`. A change to past behavior becomes a new US or epic; never rewrite a closed epic. In Claude Code this rule is enforced by the `sdd-guard` hook (`.claude/settings.json`).
- `specs/CAPABILITIES.md` is only updated when an epic is closed (see `Review` in the methodology).
- Reviewers (the `review` skill / `sdd-reviewer` agent) never edit code or specs. They only write `specs/EPICX/REVIEW.md`.

## Change Classification

When the PM asks for a change during `implement` or `review`, classify it before acting and say which one it is:

- **Scope change** (what the system does): update the epic and its acceptance criteria first, then tasks. If it does not fit the current epic, propose it for the backlog in `docs/ROADMAP.md`.
- **Implementation change** (how it is built): add or update a task in the current US.
- **Bug**: reproduce it, add a failing test, fix the root cause (`debugging` skill if installed).

## Workflow

One sprint = one epic: `Spec -> Plan -> Tasks -> Implement -> Review (+ close)`. One user story at a time unless the PM says otherwise. Act as a senior product manager in `spec`, `plan`, `tasks` and `review`, and as a senior developer in `implement`. Details: `docs/METHODOLOGY.md`.

## Skills And Triggers

- `auto` skills may be used proactively when the task matches their policy; `manual` skills only on request.
- `/grillme` clarification · `/zoomout` consistency review · `/tdd` red-green-refactor · `/sdd-review` independent review · `/sdd-debug` root-cause debugging · `/sdd` resume the workflow.
- If the user asks to close `spec` or `plan`, stop using `grill-me` for that artifact. If the user asks to move on to `implement`, stop using `zoom-out`.

## Roles

- PM (human): defines and confirms scope, approves every phase transition and every US.
- Producer agent (the main session): writes specs, plans, tasks, code and docs.
- Reviewer agent (`sdd-reviewer`, optional): independent, read-only judgment with a fresh context. It never produces.
- The developer owns final approval and Git, especially for changes that affect scope or behavior.
