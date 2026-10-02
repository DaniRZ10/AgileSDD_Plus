---
name: laravel
axis: framework
composes_with: [php]
activates_on:
  extensions: []
  paths: ["app/Http/Controllers/**", "app/Models/**", "app/Services/**", "app/Http/Requests/**", "app/Http/Middleware/**", "app/Console/Commands/**", "app/Jobs/**", "app/Providers/**", "routes/**", "database/migrations/**"]
  markers:
    - file: "composer.json"
      contains: "laravel/framework"
    - file: "artisan"
artifact_shape: layered
tools: []
substitutes: []
---

# Laravel

Applies to new or modified files of a Laravel application. Composes with `php`: the language rules live in that catalog and are not repeated here.

> **Scope note.** The previous protocol carried a single layer vocabulary phrased in Symfony's terms (`EntityManager`, `QueryBuilder`, Entities) and applied it to any PHP project. A Laravel change was therefore audited against names that do not exist in it. This catalog states the equivalent roles in Laravel's own terms; the roles and their severities are the ones the protocol already defined.

## Layer vocabulary

| Role in the protocol | In Laravel |
|---|---|
| Orchestration | Controllers |
| Domain | Services, actions, domain classes |
| Persistence | Repositories, Eloquent query builder, `DB` facade |
| Domain model | Eloquent models |
| Input boundary | Form Requests, DTOs |
| Output boundary | API Resources, response objects |

## Rules

### Layer integrity

- **Controllers**: must only orchestrate. Must use Form Requests or DTOs for input, and API Resources or response objects for output. Building Eloquent queries or using the `DB` facade directly in a controller is a **CRITICAL** violation. Business logic in a controller is a **CRITICAL** violation.
- **Services / actions**: business logic only. A direct database query — raw SQL, `DB` facade, or an Eloquent query that belongs in a Repository — is a **CRITICAL** violation.
- **Repositories**: complex queries must reside here. Raw SQL or complex filtering logic in a Service is a **CRITICAL** violation.
- **Models**: rich in internal state logic — accessors, mutators, scopes, relationships. Must never depend on external services; injecting a service into a model is a **CRITICAL** violation.

### Query-in-loop vocabulary

- An Eloquent query or `DB` call executed inside a loop → **CRITICAL**
- A relationship accessed inside a loop without eager loading (`with`, `load`) → **CRITICAL** — this is the canonical Eloquent N+1
- Retrieving full models where `select` of specific columns suffices → **MAJOR**
- `all()` followed by in-memory filtering that the database could have done → **MAJOR**

### Mass assignment

- A model without `$fillable` or `$guarded` populated from request input → **CRITICAL**
- `$guarded = []` combined with population from request input → **CRITICAL**

## Tooling notes

No static analysis tool is declared for this catalog.
