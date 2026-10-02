# Worklog

Short repo-level tracking for the scaffold itself. `templates/base/` is product output, not instructions for this repo.

Status legend: `[ ]` pending · `[-]` in progress · `[x]` done · `[!]` blocked

## Current Goal

Validate 0.9.0 in a real project before calling it 1.0.

## TODO Tasks

- [ ] Pilot: run EPIC0 and one product epic end to end in a real repository with Claude Code; record friction here.
- [ ] Verify the Antigravity adapter (`.agent/workflows`, `.agent/agents` frontmatter) in a real installation.
- [ ] Verify the OpenCode adapter (`permission.edit` patterns of the reviewer) in a real installation.
- [ ] Decide whether to port `sdd-guard` to Antigravity hooks once their payload shape is confirmed.
- [ ] Measure the context an agent loads per phase and keep it under the 0.9.0 baseline.
- [ ] Consider an `--update` mode that refreshes skills and adapters without touching project docs.

## Tasks Done

- [x] Forked AgileSDD 0.8.0 and analysed devAgent (OpenSpec multi-agent pipeline) for reusable discipline.
- [x] Fixed the template bugs of 0.8.0 (see `CHANGELOG.md`).
- [x] Split the constitution: short `AGENTS.md` + per-phase `docs/METHODOLOGY.md`.
- [x] Added acceptance criteria, DoR/DoD, backlog, autonomy mode, change classification and the Close step.
- [x] Added the `review` skill, `sdd-reviewer` adapters and the audit catalogs (+ java, spring-boot, swing).
- [x] Added `debugging`, improved `tdd`, and the `sdd-guard` hook for Claude Code.
- [x] Generated platform adapters from a single definition (`src/platforms.cjs`).
- [x] Tests: references between docs, catalog integrity, gitignore trap, platform selection, guard behavior.
