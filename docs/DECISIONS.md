# Decisions

Why AgileSDD Plus is built the way it is. Each decision names its **origin**:

- **AgileSDD**: kept from the original scaffold.
- **devAgent**: adapted from the devAgent multi-agent OpenSpec pipeline.
- **Plus**: new in this fork.

## Starting point

AgileSDD and devAgent solve opposite halves of the same problem.

AgileSDD is a lean, product-shaped loop (roadmap → epic → user stories → tasks) with the human PM approving every step and a tiny context footprint. It had no acceptance criteria, no definition of done, no independent quality check, no living record of current behavior, and several template bugs.

devAgent is a rigorous per-change pipeline (seven phases on top of OpenSpec) with independent judges, deterministic verdicts and stack-aware audits. It has no product layer (no roadmap, epics or stories), it is heavy (the Claude Code command alone is ~60 KB, roughly 15k tokens per session, plus ~35 KB for the QA judge), it reconciles specs to code after the fact, and it maintains three near-duplicate platform variants by hand.

AgileSDD Plus keeps the AgileSDD loop as the backbone and imports only the devAgent mechanisms that raise quality without adding ceremony.

## D1. The agile loop stays the backbone (AgileSDD)

`Spec → Plan → Tasks → Implement → Review`, one epic per sprint, one user story at a time, PM approval at each phase, state kept in readable markdown (`ROADMAP.md`, `TASKS.md` markers) instead of JSON.

Trade-off: no machine-checked state machine. Accepted because a solo developer or a student team needs to read and edit the state by hand.

## D2. Short constitution, per-phase playbook (Plus)

`AGENTS.md` keeps only the rules that apply in every phase (~6 KB). The step-by-step procedure moved to `docs/METHODOLOGY.md`, and agents read only the section of the current phase (0.6–2 KB each). This also fixes the dangling reference to `docs/METHODOLOGY.md` in 0.8.0.

Trade-off: one more file. Accepted because a typical session now loads roughly 10 KB of process instead of 14 KB (AgileSDD) or 60+ KB (devAgent), which matters most with small, fast models.

## D3. Acceptance criteria per user story (Plus, inspired by OpenSpec scenarios)

Every US carries `ACn.m` criteria in Given/When/Then. Tasks name the criteria they cover and every criterion must be covered. Review checks each criterion against code and tests.

Without this, "spec driven" only meant "markdown first": nothing in the spec was verifiable.

## D4. Definition of Ready and Definition of Done (Plus)

Explicit entry criteria for a US (testable AC, no blocking question, small enough) and exit criteria for a task (tests, comments, docs). They turn several scattered rules of 0.8.0 into two checklists.

## D5. Independent reviewer with file pointers (devAgent)

devAgent's most valuable lesson: the producer must not judge its own work in the same context. The `sdd-reviewer` subagent starts with a fresh context and receives **file paths, not summaries**, because paraphrased context is where scope drift hides.

devAgent also learned (its `orchestrator-as-producer` change) that splitting *producers* into separate agents degrades results, since the user's intent is lost at each hand-off. So Plus has exactly one producer (the main session) and one judge.

Trade-off: one extra agent call per user story. Mode `auto` by default; `manual` or `none` at install time.

## D6. Deterministic verdict; silence is not approval (devAgent)

`REJECTED` (any CRITICAL), `CHANGES_REQUESTED` (any MAJOR), `APPROVED` otherwise. A check that could not run is `N/A` with a reason and never counts as a pass; if tests cannot run, the verdict is `NOT_VERIFIED`. devAgent arrived at this after a run where a missing catalog library produced an approval for code that had barely been audited.

## D7. Scope fence (devAgent)

Strict on new or modified code, observation-only on untouched code. Without it, any project with technical debt would fail every review.

## D8. Stack audit catalogs, plus Java (devAgent + Plus)

Language and framework rules live in `skills/review/catalogs/`, one file per stack, composed by the files a change touches. Copied from devAgent (including the C# and MAUI catalogs) and extended with `java`, `spring-boot` and `swing`.

Trade-off: ~70 KB of catalogs in the scaffold, but the reviewer only reads the ones a change activates.

## D9. Spec review mode (devAgent)

`/sdd-review spec EPICX` checks an epic before planning, including devAgent's implementability test: could someone who did not write the spec implement it from the spec alone?

## D10. Agreement section (devAgent Phase 0)

devAgent writes the outcome of its exploration phase to a file the judge reads, so artifacts are checked against what was agreed, not only against themselves. Plus keeps this as the `Agreement` section of each epic, filled by `grill-me`.

devAgent's trigger phrase (`start phase 1`) was not imported: AgileSDD already requires explicit PM approval to leave each phase. `grill-me` adopted the related rule that generic agreement ("ok") does not close a phase.

## D11. Close step and living spec (Plus, inspired by OpenSpec sync)

Per-epic files record history. After ten epics nobody should have to replay all of them to know how login works today. `specs/CAPABILITIES.md` describes current behavior per capability and is updated only when an epic closes, together with `docs/CHANGELOG.md` and a three-line retro (keep / change / action). This also defines the "Update docs" step that 0.8.0 drew in its diagram but never specified.

devAgent's Reconciliation phase (rewrite specs to match the code) was rejected: in a docs-first method, the docs are corrected *before* behavior changes, and the Close step only records what was really built.

## D12. Closed epics are read-only, enforced (devAgent + Plus)

devAgent made main specs and archived changes read-only and, in its Antigravity variant, enforced it with a hook. Plus applies the same idea to closed epics and enforces it in Claude Code with `sdd-guard`, a dependency-free PreToolUse hook that reads `ROADMAP.md`. It fails open: a broken guard never blocks a session.

## D13. Backlog, autonomy mode and change classification (Plus, partly devAgent)

- Backlog in `ROADMAP.md`, where deferred review findings and ideas wait (devAgent's "defer" option for minor issues).
- Autonomy mode per US: the PM can skip per-task approvals; blockers and the review gate still stop the agent.
- Change classification during implement/review: scope change, implementation change or bug (devAgent's intent classification, reduced to three cases).

## D14. Thin, generated platform adapters (Plus, lesson from devAgent)

devAgent maintains three ~50 KB variants of the same orchestrator and has to grep them to keep them aligned. Plus generates small slash commands and reviewer agents for Claude Code, Antigravity and OpenCode from one definition in `src/platforms.cjs`; each one only points to `skills/*/SKILL.md`, the single source of truth.

New commands carry the `sdd-` prefix because Claude Code already ships a `/review` command. Antigravity workflows declare only `description`, following devAgent's warning that malformed workflow frontmatter can disable every slash command.

## D15. Reviewer model (Plus)

devAgent pins its Claude Code judges to `opus` so judgment does not degrade when the session runs on a cheaper model. Plus defaults to `sonnet` so the reviewer works on every Claude plan; independence comes from the fresh context and file pointers. Raise it to `opus` in `.claude/agents/sdd-reviewer.md` when your plan allows it.

## D16. TDD and debugging (mattpocock/skills + devAgent)

`tdd` keeps the vertical-slice approach and adds devAgent's "see it fail first" step. devAgent's rule of not applying TDD to bug fixes was rejected: a bug fix starts with a regression test. `debugging` is devAgent's root-cause protocol, shortened.

## D17. Templates stay in English (AgileSDD)

Templates and status markers stay in English so changes can be compared with upstream AgileSDD. Each project declares its own documentation language in `AGENTS.md` during EPIC0.

## Not imported from devAgent, on purpose

- The OpenSpec CLI dependency and its delta-spec format: powerful, but it adds a hard tool dependency and a change-centric model that competes with epics and stories.
- The seven-phase pipeline per change, iteration loops of five rounds, `status.json` and its recovery logic.
- Automatic documentation generation with governance rules G1–G9: valuable for larger teams, too much ceremony for this scaffold.
