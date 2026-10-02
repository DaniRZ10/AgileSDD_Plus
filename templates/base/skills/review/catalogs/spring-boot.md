---
name: spring-boot
axis: framework
composes_with: [java]
activates_on:
  extensions: []
  paths:
    - "**/controller/**"
    - "**/service/**"
    - "**/repository/**"
    - "**/entity/**"
    - "**/model/**"
    - "**/dto/**"
  markers:
    - file: "pom.xml"
      contains: "spring-boot"
    - file: "build.gradle"
      contains: "org.springframework.boot"
    - file: "build.gradle.kts"
      contains: "org.springframework.boot"
artifact_shape: layered
---

# Spring Boot

Placement of responsibilities in a Spring Boot application. Java language rules live in `java.md`.

## Layer vocabulary

| Role | In Spring Boot |
|---|---|
| Orchestration | `@RestController` / `@Controller` classes |
| Domain | `@Service` classes and domain logic |
| Persistence | `@Repository` classes and Spring Data interfaces (`JpaRepository`, `CrudRepository`) |
| Domain models | `@Entity` classes and plain domain objects |

## Rules

### Layers

- A controller injecting or calling a repository directly → **CRITICAL**
- Business rules (calculations, validations beyond input format, state transitions) inside a controller → **CRITICAL**
- A controller accepting or returning `@Entity` objects instead of DTOs → **MAJOR**
- `@Transactional` on a controller → **MAJOR** (the transaction boundary belongs to the service)

### Spring mechanics

- `@Transactional` on a private method, or on a method only called from the same class (the proxy never sees it) → **MAJOR**
- A `@RequestBody` DTO with constraint annotations received without `@Valid` / `@Validated` → **MAJOR**
- Field injection (`@Autowired` on fields) instead of constructor injection in new classes → **MINOR**
- Client errors (not found, invalid input) surfacing as HTTP 500 because no exception mapping exists (`@ControllerAdvice`, `ResponseStatusException`) → **MINOR**

### Persistence

- `@Query` (JPQL or `nativeQuery`) built by concatenating external input instead of parameters → **CRITICAL**
- `FetchType.EAGER` on a collection relationship → **MAJOR**
- Secrets (database passwords, API keys) committed in `application.properties` / `application.yml` instead of environment variables or a secret store → **MAJOR**

## Query-in-loop patterns

- A repository method (`findById`, `findBy...`, `save`) called inside a loop over results → confirmed query-in-loop
- A lazy relationship accessed for each element of a list without `JOIN FETCH` or `@EntityGraph` → potential N+1
