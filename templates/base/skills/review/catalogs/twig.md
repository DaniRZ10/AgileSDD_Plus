---
name: twig
axis: template
composes_with: [symfony]
activates_on:
  extensions: [".twig"]
  paths: ["templates/**"]
  markers:
    - file: "composer.json"
      contains: "twig/twig"
artifact_shape: flat
tools: []
substitutes:
  - check: layer-integrity
    reason: "a template is a presentation artifact with no orchestration, domain, or persistence layer"
---

# Twig

Applies to new or modified Twig templates.

> **New coverage.** The previous protocol classified unescaped HTML output as **CRITICAL** but never opened a template file — the check looked at PHP code, not at the view, which is where the XSS actually lives. This catalog is the first coverage of Twig templates, so a change touching them will now produce findings where it previously produced none.

## Rules

### Output escaping

- `|raw` applied to any value that can carry external input → **CRITICAL**
- `autoescape` disabled for a block that renders external input → **CRITICAL**
- A value rendered into an HTML attribute without the `html_attr` escaping strategy → **CRITICAL**
- A value rendered inside a `<script>` block without the `js` escaping strategy → **CRITICAL**
- A value rendered into a URL context without the `url` escaping strategy → **MAJOR**
- `|raw` on a value the change itself constructs from trusted parts → **MINOR**, requiring a comment stating why it is safe

Twig escapes for HTML by default. The findings above are the cases where that default is bypassed or where the context is not HTML and the default is therefore the wrong strategy.

### Logic in templates

- A database query or service call invoked from a template → **CRITICAL**
- Business logic — computation, branching on domain rules — that belongs in the controller or in a Twig extension → **MAJOR**
- Nesting of control structures deeper than 3 levels → **MAJOR**, matching the unconditional core's nesting threshold

### Duplication

- A markup block duplicated where an existing partial, `include`, `embed`, or macro should be reused → **MAJOR**, referencing the existing one

## Tooling notes

No static analysis tool is declared for this catalog. `bin/console lint:twig` validates syntax only and says nothing about the rules above.
