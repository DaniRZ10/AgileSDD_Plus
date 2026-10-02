---
name: php
axis: language
composes_with: []
activates_on:
  extensions: [".php"]
  paths: []
  markers:
    - file: "composer.json"
artifact_shape: any
tools: []
substitutes: []
---

# PHP

Applies to new or modified PHP files.

> **Extraction note.** The rules below were embedded in the audit protocol as check *3.3 Strict Typing — PHP 8+* before the catalog library existed. They are reproduced here **unchanged, with their original severities**, so that a PHP change produces the same set of findings as it did before the extraction. New PHP rules may be added later; they were deliberately not added during the extraction, so that any difference in findings would point at the extraction itself rather than at new rules.

## Rules

### Strict typing (PHP 8+)

- Missing type hint on a function or method parameter → **MAJOR**
- Missing return type declaration on a function or method → **MAJOR**
- Missing typed property declaration on a class property → **MAJOR**
- Use of `mixed` where a specific type is determinable → **MINOR**

## Tooling notes

No static analysis tool is declared for this catalog. Projects that run one (PHPStan, Psalm) can declare it in their own `quality-profile.md`; per the precedence rules that profile is additive and cannot relax anything here.
