# Glossary

Short terms used in this project.

- `PM`: Product Manager, the person who defines and confirms scope. The human you communicate with.
- `Epic`: a larger unit of work that groups related user stories. One epic per sprint.
- `US`: User Story, a user-facing slice of value written as `As a X, I want Y, so I can Z`.
- `AC`: Acceptance Criterion of a US, written as Given/When/Then and identified as `ACn.m` (US n, criterion m).
- `DoR` / `DoD`: Definition of Ready / Definition of Done, both in `AGENTS.md`.
- `Spec`: the phase where the epic, its user stories and their acceptance criteria are defined.
- `Plan`: the phase where the order of the user stories is set.
- `Tasks`: the phase where each user story is split into small actions traced to its AC.
- `Implement`: the phase where the work is built and verified.
- `Verification`: the checks performed inside `Implement` (tests, DoD) before review.
- `Review`: the phase where each US is checked against its acceptance criteria and approved by the PM.
- `Close`: the end of `Review`, where docs are reconciled and the retro is written.
- `Reviewer`: an independent, read-only agent (`sdd-reviewer`) that judges a US with a fresh context.
- `Scope fence`: reviews are strict on new or modified code and only observe pre-existing code.
- `Capability`: something the system does today, described in `specs/CAPABILITIES.md`.
- `Backlog`: ideas and deferred items in `docs/ROADMAP.md` that are not epics yet.
