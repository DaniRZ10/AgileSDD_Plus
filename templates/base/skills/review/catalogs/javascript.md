---
name: javascript
axis: language
composes_with: []
activates_on:
  extensions: [".js", ".mjs", ".cjs", ".jsx"]
  paths: []
  markers:
    - file: "package.json"
artifact_shape: any
tools: []
substitutes: []
---

# JavaScript

Applies to new or modified JavaScript files.

> **Extraction note.** The rule below was embedded in the audit protocol as part of check *3.4 Strict Typing — JavaScript / TypeScript* before the catalog library existed. It is reproduced here unchanged, with its original severity, so that a JavaScript change produces the same set of findings as it did before the extraction.

## Rules

### Typing

- Complex functions without JSDoc type annotations → **MINOR**

## Tooling notes

No static analysis tool is declared for this catalog. A project that runs ESLint or a type checker over plain JavaScript can declare it in its own `quality-profile.md`, which is additive.
