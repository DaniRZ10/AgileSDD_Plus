---
name: css
axis: language
composes_with: []
activates_on:
  extensions: [".css", ".scss", ".sass", ".less"]
  paths: []
  markers: []
artifact_shape: flat
tools: []
substitutes:
  - check: layer-integrity
    reason: "stylesheets have no orchestration, domain, or persistence layer"
  - check: query-in-loop
    reason: "stylesheets do not access data sources"
---

# CSS

Applies to new or modified stylesheets, including the preprocessor dialects.

> **New coverage.** The previous protocol named CSS in its title — *"web PHP/JS/CSS projects"* — without defining a single check for it. This catalog is the first actual coverage of stylesheets, so a change touching CSS will now produce findings where it previously produced none. That is the intended correction of a gap, not a regression.

## Rules

### Specificity and cascade

- `!important` without a comment justifying it → **MAJOR** — it removes the ability to override downstream
- Selector nesting deeper than 3 levels → **MAJOR** — matches the nesting threshold of the unconditional core
- ID selectors used for styling rather than for anchoring → **MINOR**
- A selector qualified by tag name where the class alone suffices (`div.card`) → **MINOR**

### Duplication

The DRY rule of the unconditional core applies to stylesheets as it does to code. In addition:

- A literal value repeated across rules where the project defines a custom property or preprocessor variable for it → **MAJOR**, referencing the existing token
- A block of declarations duplicated instead of reusing an existing class or mixin → **MAJOR**

### Hard-coded values

- Color, spacing, font size, or breakpoint written as a literal where the project has a design token for it → **MAJOR**
- Magic numeric value with no comment explaining where it comes from → **MINOR**

### Layout and robustness

- Fixed pixel height on a container holding text content → **MAJOR** — breaks on overflow and on user font scaling
- `z-index` value outside the project's declared scale, or an arbitrary large value → **MAJOR**
- A rule relying on source order rather than on explicit specificity → **MINOR**

### Naming

Class names follow the project's existing convention. A name that describes appearance rather than purpose (`.red-box`, `.mt-10-blue`) → **MINOR**; the semantic-naming rules of the unconditional core apply on top of this.

### Dead rules

- A selector that matches nothing in the templates or components touched by the change → **MINOR**, noting that confirmation across the whole project is out of the change's scope

## Tooling notes

No static analysis tool is declared for this catalog. A project that runs Stylelint can declare it in its own `quality-profile.md`, which is additive.
