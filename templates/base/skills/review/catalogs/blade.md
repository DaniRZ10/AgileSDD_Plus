---
name: blade
axis: template
composes_with: [laravel]
activates_on:
  extensions: [".blade.php"]
  paths: ["resources/views/**"]
  markers:
    - file: "composer.json"
      contains: "laravel/framework"
artifact_shape: flat
tools: []
substitutes:
  - check: layer-integrity
    reason: "a template is a presentation artifact with no orchestration, domain, or persistence layer"
---

# Blade

Applies to new or modified Blade templates.

> **New coverage.** As with Twig, the previous protocol classified unescaped output as **CRITICAL** without ever opening a template. This catalog is the first coverage of Blade templates.

> **Detection note.** A Blade template's extension is `.blade.php`, which also matches the `php` catalog's `.php` extension. Both activate: the file is audited as a template, and the PHP language rules apply to any PHP expression it contains.

## Rules

### Output escaping

- `{!! !!}` (unescaped echo) applied to any value that can carry external input → **CRITICAL**
- A value rendered inside a `<script>` block with `{{ }}` instead of `@json` → **CRITICAL** — HTML escaping is the wrong strategy in a JavaScript context
- A value rendered into an HTML attribute without quoting → **CRITICAL**
- `{!! !!}` on a value the change itself constructs from trusted parts → **MINOR**, requiring a comment stating why it is safe
- `@php` blocks embedding logic in the view → **MAJOR**

Blade escapes with `{{ }}` by default. The findings above are the cases where that default is bypassed or where the rendering context is not HTML.

### Logic in templates

- An Eloquent query or service call invoked from a template → **CRITICAL**
- A relationship traversed in a loop inside a template without eager loading → **CRITICAL** — the N+1 is triggered by the view
- Business logic that belongs in the controller, an action, or a view composer → **MAJOR**
- Nesting of control structures deeper than 3 levels → **MAJOR**

### Duplication

- A markup block duplicated where an existing component, `@include`, or layout section should be reused → **MAJOR**, referencing the existing one

## Tooling notes

No static analysis tool is declared for this catalog.
