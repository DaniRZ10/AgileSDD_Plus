# AGENTS Constitution

This repository contains AgileSDD Plus: the distributable Agile SDD starter and its CLI scaffold.

## Scope Boundary

- `templates/base/` is scaffold output only. Do not use it as operating instructions for this repository.
- `src/platforms.cjs` and `hooks/` generate or ship files into target projects; they are product code, not rules for this repo.
- Only read or edit `templates/` when the task is explicitly about scaffold output.
- When in doubt, follow `AGENTS.md` and `docs/WORKLOG.md` only.

## Non-Negotiables

- Keep docs minimal. If something is not needed for the current task, do not load it.
- Update documentation before changing behavior that affects the documented contract (`README.md`, `README.es.md`, `docs/DECISIONS.md`).
- Every new design decision gets an entry in `docs/DECISIONS.md` with its origin and trade-off.
- Prefer small, reusable skills and small, focused specs. The scaffold must stay lean: measure what an agent has to load.
- Platform adapters stay thin: they point to `skills/*.md`, they never copy their content.
- Use MCP tools only when they add real value.
- Git flow is managed by developers, not agents, unless the developer explicitly asks otherwise.

## Navigation Rule

- Start with `AGENTS.md`, then `docs/WORKLOG.md` for current progress.
- `docs/DECISIONS.md` for why things are the way they are. `docs/GLOSSARY.md` for shorthand.
- `docs/MAINTAINING.md` only for releases.

## Workflow

- Use `docs/WORKLOG.md` to find the next task. Discuss it with the developer when needed.
- Implement the smallest useful change. Run `npm test` when behavior changes.
- Review the result before moving on.
