---
name: symfony
axis: framework
composes_with: [php]
activates_on:
  extensions: []
  paths: ["src/Controller/**", "src/Entity/**", "src/Repository/**", "src/Service/**", "src/Form/**", "src/EventSubscriber/**", "src/Command/**", "src/MessageHandler/**", "src/Security/**", "config/**"]
  markers:
    - file: "composer.json"
      contains: "symfony/framework-bundle"
    - file: "bin/console"
artifact_shape: layered
tools: []
substitutes: []
---

# Symfony

Applies to new or modified files of a Symfony application. Composes with `php`: the language rules live in that catalog and are not repeated here.

> **Extraction note.** The layer vocabulary below was embedded in the audit protocol as check *3.1 Layer Integrity (PHP projects)* before the catalog library existed. It is reproduced here **unchanged, with its original severities**, so that a Symfony change produces the same set of findings as it did before the extraction.

## Layer vocabulary

What plays each role in this framework:

| Role in the protocol | In Symfony |
|---|---|
| Orchestration | Controllers |
| Domain | Services and domain classes |
| Persistence | Repositories, Doctrine `EntityManager`, `QueryBuilder` |
| Domain model | Entities |
| Input boundary | DTOs and Request objects |
| Output boundary | Serializers and response objects |

## Rules

### Layer integrity

- **Controllers**: must only orchestrate. Must use DTOs or Request objects for input. Must use Serializers or response objects for output. Direct access to `EntityManager` or the ORM persistence layer is a **CRITICAL** violation. Business logic in a controller is a **CRITICAL** violation.
- **Services / domain classes**: business logic only. A direct database query — raw SQL, or an ORM call that belongs in a Repository — is a **CRITICAL** violation.
- **Repositories**: complex queries must reside here, via `QueryBuilder` or equivalent. Raw SQL or complex filtering logic in a Service is a **CRITICAL** violation.
- **Entities**: rich in internal state logic. Must never depend on external services — injecting a service into an entity constructor is a **CRITICAL** violation.

### Query-in-loop vocabulary

For the conditional query-in-loop check of the protocol, the patterns to look for in this framework:

- A repository call or `EntityManager` operation executed inside a loop → **CRITICAL**
- Full entity hydration where only a subset of fields is needed → **MAJOR**
- A lazy-loaded association traversed inside a loop → **MAJOR**, noted as "potential N+1 — verify with profiling"

## Tooling notes

No static analysis tool is declared for this catalog.
