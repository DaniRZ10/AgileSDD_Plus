# Audit Catalog Library

The technology-specific rules the `review` skill applies to new or modified code. Adapted from the catalog library of `devAgent` (MIT), where each catalog is one file and adding a stack never requires touching an agent definition.

## Why catalogs exist

The core checks of `skills/review/SKILL.md` are true of any code (complexity, duplication, naming, injection). Everything that depends on a language or framework (typing, layer vocabulary, escaping, resource handling) lives here, so a Java change is audited with Java rules and a Python change with Python rules. Whatever no catalog covers is reported **N/A with a reason**, never as PASS: a check that did not run must never look like one that passed.

## Layer roles used by framework catalogs

Framework catalogs map their own names to three roles. The severities are fixed by the review skill:

- **Orchestration** (controllers, endpoints, handlers, UI listeners): only orchestrates. Business logic or direct data access here → **CRITICAL**.
- **Domain** (services, domain classes): business logic only. Raw queries here → **CRITICAL**. A domain model depending on an external service → **CRITICAL**.
- **Persistence** (repositories and equivalents): owns queries. A query executed inside a loop with no batching → **CRITICAL**.

## The three axes

Catalogs are **orthogonal and compose**. They do not nest.

```
  LANGUAGE            FRAMEWORK          TEMPLATE ENGINE
  what is legal       where each         where the escaping
  and dangerous       thing belongs      happens
  ─────────────       ─────────────      ───────────────
  php.md         ←──→ symfony.md    ←──→ twig.md
                      laravel.md    ←──→ blade.md
  python.md      ←──→ (none yet)
  csharp.md      ←──→ (none yet)
  javascript.md
  typescript.md  ──── composes with javascript.md
  css.md
```

A framework catalog carries **only** the placement of responsibilities for that framework. The rules of the language it runs on live once, in the language catalog, and the framework catalog declares that it composes with it.

The reason is duplication. If `symfony.md` and `laravel.md` each carried PHP's typing rules, a correction to those rules would have to be applied twice and would drift. 

### A language catalog is a complete configuration on its own

A project using a language with no framework — a Python package, a C# console application, a library — is fully covered by its language catalog. The absence of a framework catalog is **the correct configuration for that project**, not a gap. The reviewer must not warn about it and must not degrade the verdict because of it.

## Catalog file format

A catalog is a markdown file with YAML frontmatter. The frontmatter is what the detection reads; the body is what the auditor applies.

```yaml
---
name: aspnet                    # unique id, matches the filename
axis: framework                 # language | framework | template
composes_with: [csharp]         # catalogs activated together with this one
activates_on:
  extensions: []                # file extensions in the diff that activate it
  paths: []                     # path patterns in the diff that activate it
  markers:                      # repository files/contents that activate the framework
    - file: "*.csproj"
      contains: "Microsoft.AspNetCore"
artifact_shape: layered         # layered | flat | any — see below
tools:                          # optional; static analysis this stack offers
  - name: dotnet-analyzers
    detect: "dotnet --version"
    scoped_invocation: "dotnet build <project> -warnaserror"
    scope_note: "compiles the whole solution — filter output by diff file:line"
substitutes:                    # optional; conditional checks this stack replaces
  - check: strict-typing
    reason: "the compiler enforces types; the risk here is nullability"
---
```

### Frontmatter fields

| Field | Meaning |
|---|---|
| `name` | Catalog id. Referenced by other catalogs in `composes_with`. |
| `axis` | Which axis the catalog belongs to. A catalog must not carry rules belonging to another axis. |
| `composes_with` | Catalogs activated transitively with this one. Declared **here**, never inferred by the detection. |
| `activates_on` | The signals that activate the catalog: extensions and paths of files **in the diff**, plus repository `markers`. For a framework catalog a present marker activates it on its own — see *Activation* below. |
| `artifact_shape` | `layered` if the catalog implies a layered architecture, `flat` if it does not, `any` if it says nothing either way. |
| `tools` | Static analysis available for this stack. Optional. |
| `substitutes` | Conditional checks this catalog declares not applicable, with the reason. Optional. |

`composes_with` is declared in the catalog and never derived by the agent. That is what keeps stack knowledge out of the agent definitions: adding a catalog is adding a file.

### Body sections

The body carries the rules the auditor applies. Use these headings:

- `## Rules` — the checks, each with its severity (`CRITICAL`, `MAJOR`, `MINOR`) and enough context that a reader can find the violation. Group them under `###` subheadings.
- `## Layer vocabulary` — framework catalogs only: what plays the role of orchestration, domain, and persistence in this framework.
- `## Tooling notes` — how to read the tools' output and what its scope limitation is.

## Activation

A **language** catalog activates when a file in the diff matches its `extensions` or `paths`.

A **framework** catalog activates when a language catalog it composes with is already active *and* the repository contains one of its `markers`. The marker is sufficient on its own: the diff's files do **not** additionally have to match the framework catalog's `paths`.

That ordering is deliberate. A framework's real file layout is always larger than any list a catalog can enumerate — Symfony code lives in `src/Service/`, `src/Form/`, `src/EventSubscriber/`, `src/Security/` and in whatever else the project invents — and a missing entry fails *silently*: the language catalog activates, the framework one does not, and the change is audited with no layer vocabulary at all. The marker (`composer.json` containing `symfony/framework-bundle`, or `bin/console`) answers "is this a Symfony repository?" once, correctly, regardless of which directory the change touched.

`paths` remain useful as a secondary signal where no marker exists, and as documentation of where the framework's code normally lives. Keep them broad, but never rely on them for correctness.

When markers of **two or more** framework catalogs composing with the same language match, the framework is unresolved: only the language catalog activates, and the report names the frameworks left unresolved. The auditor never picks one.

## Substituting a conditional check

A catalog may declare a **conditional** check of the generic protocol not applicable to its stack and supply the equivalent for that stack. It must state the reason: the reason is printed in the report next to the N/A status.

**A substitution only covers the files of the catalog that declares it.** It is scoped to a set of files, not to a check across the whole run. `twig` substituting `layer-integrity` says "a template has no layers" — it says nothing about a controller that happens to be in the same change, and it must not exempt one. When a change mixes files of a substituting catalog with files the check does apply to, the auditor applies the check to the latter and splits the report row so both states are visible.

A file that activates several catalogs takes the substitution if any of them declares it — `.blade.php` activates both `blade` and `php`, is genuinely a template, and `blade`'s substitution holds for it. The other catalogs' remaining rules still apply to that file.

```yaml
substitutes:
  - check: strict-typing
    reason: "the compiler enforces type declarations; the equivalent risk is nullability"
```

Two limits, both enforced by the protocol:

- **The unconditional core cannot be substituted.** Complexity, DRY, semantic naming, and the injection vectors that do not depend on HTML apply to every artifact in every language. A catalog that tries to declare one of them not applicable does not disable it — the check still runs and the attempt is recorded in the report.
- **Only catalogs may substitute.** Project rules in `docs/ARCHITECTURE.md` are additive: they can add rules and tighten existing ones, never switch one off.

## The three layers of precedence

```
  1. Core checks          (skills/review/SKILL.md)   never disabled
  2. Catalogs             (this directory)           may substitute conditional checks
  3. Project rules        (docs/ARCHITECTURE.md)     additive only
```

Project rules can add checks or tighten existing ones; if one contradicts or relaxes a core or catalog rule, the stricter one applies and the conflict is noted in the report.

## Adding a catalog

1. Create `<name>.md` here with the frontmatter above.
2. Declare its `axis`, what it `composes_with`, and what activates it.
3. Write the rules under `## Rules` with an explicit severity each.
4. If the stack offers static analysis, declare it under `tools` with a **diff-scoped** invocation.
5. If a conditional check of the protocol does not apply to this stack, declare it under `substitutes` with a reason.

Nothing else changes: not the review skill, not the reviewer agents.

## Current coverage

| Axis | Catalogs |
|---|---|
| Language | `php`, `python`, `csharp`, `java`, `javascript`, `typescript`, `css` |
| Framework | `symfony`, `laravel` (PHP) · `maui` (C#) · `spring-boot`, `swing` (Java) |
| Template | `twig`, `blade` |

A language catalog is a complete configuration on its own; a framework catalog is a new file whenever one is needed.
