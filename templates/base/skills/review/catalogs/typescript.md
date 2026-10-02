---
name: typescript
axis: language
composes_with: [javascript]
activates_on:
  extensions: [".ts", ".tsx"]
  paths: []
  markers:
    - file: "tsconfig.json"
artifact_shape: any
tools: []
substitutes: []
---

# TypeScript

Applies to new or modified TypeScript files. Composes with `javascript`: TypeScript compiles to JavaScript and the JavaScript rules hold for it, so they are not repeated here.

> **Extraction note.** The rules below were embedded in the audit protocol as part of check *3.4 Strict Typing — JavaScript / TypeScript* before the catalog library existed. They are reproduced here unchanged, with their original severities, so that a TypeScript change produces the same set of findings as it did before the extraction.

## Rules

### Typing

- Use of `any` without a justification comment → **MINOR**
- Missing explicit types on public function parameters or returns where inferable → **MINOR**

## Tooling notes

No static analysis tool is declared for this catalog. A project that runs `tsc --noEmit` or ESLint with type-aware rules can declare it in its own `quality-profile.md`, which is additive.
