# Maintaining

Release checklist for `create-agile-sdd-plus`.

## Publish a new npm version

1. Choose the next version number (semver) and update `package.json`.
2. Add the release to `CHANGELOG.md`.
3. Run `npm test` and `npm pack --dry-run`; check that `templates/`, `hooks/` and `src/` are in the tarball.
4. `npm login`, then `npm publish`.
5. Verify with `npx create-agile-sdd-plus@latest --help` and a fresh scaffold.
6. Tag the commit (`vX.Y.Z`) and create the GitHub release with the same notes.

## Reminders

- Never republish the same version number.
- When changing a skill, check its adapters in `src/platforms.cjs` still describe it correctly.
- When adding a catalog, list it in the coverage table of `templates/base/skills/review/catalogs/README.md` (a test enforces it).
- Before claiming support for a platform format, test it in a real installation and update the verification table in the README.
