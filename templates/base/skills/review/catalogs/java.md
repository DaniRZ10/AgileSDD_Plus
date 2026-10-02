---
name: java
axis: language
composes_with: []
activates_on:
  extensions: [".java"]
  paths: []
  markers:
    - file: "pom.xml"
    - file: "build.gradle"
    - file: "build.gradle.kts"
artifact_shape: any
tools:
  - name: maven-compile
    detect: "mvn -v"
    scoped_invocation: "mvn -q -DskipTests compile"
    scope_note: "compiles the whole project; only warnings and errors whose file:line belongs to the diff count"
  - name: gradle-compile
    detect: "gradle -v"
    scoped_invocation: "gradle -q compileJava"
    scope_note: "compiles the whole project; only findings inside the diff count"
substitutes:
  - check: strict-typing
    reason: "Java is statically typed; the equivalent risks are raw generic types, unchecked casts and nullability, audited below"
---

# Java

Applies to new or modified Java files, from plain console or desktop programs to layered applications. This catalog says nothing about layers; a framework catalog (`spring-boot`, `swing`) supplies them when active.

## Rules

### Types and generics

- Raw generic types in new code (`List` instead of `List<Cell>`) → **MAJOR**
- Unchecked cast, or `@SuppressWarnings("unchecked")` without a comment justifying it → **MAJOR**
- `Object` as parameter or return type where a concrete type or a generic is determinable → **MINOR**

### Null handling

- A method returning `null` for a collection instead of an empty collection → **MAJOR**
- `Optional.get()` without a guard (`isPresent`, `orElse*`, `ifPresent`) → **MAJOR**
- `Optional` used as a field or parameter type → **MINOR**

### Error handling

- Empty `catch` block, or a handler that only calls `printStackTrace()` and continues as if nothing happened → **MAJOR**
- Catching `Throwable` or `Error` → **MAJOR**
- Wrapping an exception and rethrowing it without the original cause → **MAJOR**
- Catching `Exception` where the specific exception is determinable → **MINOR**
- Throwing a bare `RuntimeException` or `Exception` instead of a specific or domain exception → **MINOR**

### Resource management

- An `AutoCloseable` (streams, readers, `Scanner` over a file, JDBC `Connection` / `Statement` / `ResultSet`) opened without try-with-resources or a guaranteed close → **MAJOR**

### Objects and equality

- Comparing `String` or boxed numbers with `==` → **MAJOR**
- Overriding `equals` without `hashCode`, or the reverse → **MAJOR**
- Public mutable fields (non-`final`, non-constant) on classes that hold state → **MAJOR**
- Mutable `static` state shared across the application (non-`final` static fields) → **MAJOR**
- Modifying a collection while iterating it with for-each → **MAJOR**

### Security

- SQL built by concatenating external input into a JDBC `Statement` instead of a `PreparedStatement` with parameters → **CRITICAL**
- `Runtime.exec` / `ProcessBuilder` receiving external input without validation → **CRITICAL**
- Deserializing untrusted data with `ObjectInputStream` → **CRITICAL**
- Credentials or tokens hardcoded in source → **MAJOR**

### Concurrency

- Mutable state shared between threads without synchronization or concurrent types → **MAJOR**
- Busy waiting or `Thread.sleep` used as synchronization → **MAJOR**

### Conventions

- Casing that breaks Java conventions (classes `PascalCase`, methods and variables `camelCase`, constants `UPPER_SNAKE_CASE`) → **MINOR**
- `System.out.println` / `printStackTrace` for diagnostics in a project that already uses a logger → **MINOR**

## Tooling notes

The compiler's silence does not exempt any rule above: most of them compile cleanly. Warnings such as `unchecked` or `rawtypes` in the diff confirm the corresponding rule.
