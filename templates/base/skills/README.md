# Skills

This project includes a small skills bundle. `grill-me` is always installed; the rest are optional.

## Credits

`grill-me`, `zoom-out` and `tdd` are adapted from `mattpocock/skills` (MIT). `review` and `debugging`, and the audit catalogs under `review/catalogs/`, are adapted from `devAgent` (MIT).

## Installed

{{skillsList}}

## Mode Policy

- `auto`: the agent may use the skill proactively when the task matches the policy in the skill file.
- `manual`: the agent loads the skill only when the user asks for it or the task clearly calls for it.
- `none`: the skill was not installed.

## Triggers

- `/grillme` clarification during `spec` and `plan`.
- `/zoomout` consistency review before `implement`.
- `/tdd` red-green-refactor pass.
- `/sdd-review <EPICX/USn>` independent review of a user story (or `/sdd-review spec <EPICX>` for the spec).
- `/sdd-debug` root-cause debugging of a failing test or a bug.
- `/sdd` resume the workflow from `docs/ROADMAP.md`.

The slash commands are thin wrappers installed for each platform chosen at install time (`.claude/commands/`, `.agent/workflows/`, `.opencode/commands/`). They only point here: these `SKILL.md` files are the single source of truth.

New commands carry the `sdd-` prefix so they never collide with built-in commands of the host tool (Claude Code already ships its own `/review`).
