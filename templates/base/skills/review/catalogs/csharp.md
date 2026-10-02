---
name: csharp
axis: language
composes_with: []
activates_on:
  extensions: [".cs"]
  paths: []
  markers:
    - file: "*.csproj"
    - file: "*.sln"
    - file: "Directory.Build.props"
artifact_shape: any
tools:
  - name: dotnet-analyzers
    detect: "dotnet --version"
    scoped_invocation: "dotnet build -warnaserror"
    scope_note: "compiles the whole solution; only findings whose file:line belongs to the change diff count for this catalog"
  - name: dotnet-format
    detect: "dotnet format --version"
    scoped_invocation: "dotnet format --verify-no-changes --include <diff-files>"
    scope_note: "style and formatting only; does not replace the quality audit"
substitutes:
  - check: strict-typing
    reason: "C# requires declared static types for parameters, returns, fields, and local declarations; the relevant escape hatches are dynamic, object, unchecked casts, and nullability, which are audited below"
---

# C#

Applies to new or modified C# files.

This is the **language-level** catalog. It covers C# and .NET code-quality concerns that are independent of a particular application framework. It does not define layer placement or framework architecture. Framework-specific concerns belong in composing framework catalogs.

The catalog complements, rather than duplicates, the .NET SDK/Roslyn analyzers. Microsoft documents .NET code-analysis categories covering Design, Documentation, Globalization, Interoperability, Maintainability, Naming, Performance, Reliability, Security, Style, and Usage. The SDK includes these analyzers, but the set enabled by default depends on the configured analysis mode/level. The audit therefore must not treat a clean `dotnet build` as proof that every catalog rule has been checked.

## Rules

### Nullability

- A project or file has nullable reference types disabled where the surrounding project enables them → **MAJOR**
- A new or modified public API accepts or returns a reference type whose nullability contract is not expressed → **MAJOR**
- The null-forgiving operator `!` is introduced without a demonstrable invariant or justification → **MAJOR**
- A value known or reported by the compiler as possibly null is dereferenced without a valid guard → **CRITICAL**
- A nullable value is converted to a non-nullable value without a guard, default, or other justified invariant → **MAJOR**

### Type safety and escape hatches

- `dynamic` is used where a static type is determinable → **MAJOR**
- `object` is used as a parameter, return type, field, or local where a specific type or generic abstraction is determinable → **MAJOR**
- An unchecked cast from external or otherwise untrusted data is used where pattern matching, `as`, validation, or a typed conversion is appropriate → **MAJOR**
- `var` obscures the type in a way that materially reduces readability or hides an important conversion → **MINOR**
- Reflection or runtime type inspection is introduced where normal static typing is sufficient → **MINOR**; **MAJOR** when it bypasses a security or correctness boundary

### Asynchrony and concurrency

- `async void` is used anywhere other than an event handler → **CRITICAL**
- `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` is used on a `Task` in code that can execute under a synchronization context → **CRITICAL**
- An `async` method contains no meaningful `await` and does not intentionally implement an asynchronous API → **MAJOR**
- A returned `Task` is discarded without an explicit, justified fire-and-forget boundary and appropriate exception handling → **MAJOR**
- Long-running or cancellable public asynchronous operations do not accept or propagate a `CancellationToken` where cancellation is materially relevant → **MINOR**
- Cancellation is swallowed, converted into an unrelated failure, or ignored after a cancellation boundary without justification → **MAJOR**
- Shared mutable state is accessed concurrently without an explicit synchronization strategy or thread-safe abstraction → **MAJOR**; **CRITICAL** when it can cause security-sensitive or data-corrupting races

### Resource management

- An `IDisposable` or `IAsyncDisposable` resource is created without `using`, `await using`, ownership transfer, or another deterministic release path → **MAJOR**
- A type owns a disposable field but does not implement or otherwise provide deterministic disposal of that owned resource → **MAJOR**
- `HttpClient` is instantiated per request/call instead of being reused through an appropriate lifetime strategy → **MAJOR**
- Streams, database connections, commands, readers, transactions, or other disposable I/O objects are left to finalization/GC for normal cleanup → **MAJOR**
- Disposal ownership is ambiguous across components and can result in use-after-dispose or leaked resources → **MAJOR**

### Error handling

- `catch { }` or `catch (Exception) { }` silently discards the exception → **MAJOR**
- `throw ex;` or equivalent explicit rethrow resets the original stack trace → **MAJOR**
- A broad `catch (Exception)` is used where a narrower exception boundary is determinable and handling differs by exception type → **MINOR**
- Exceptions are caught and converted to a success result without preserving failure information → **MAJOR**
- Exceptions are used for routine control flow where a normal result/validation path is available → **MINOR**
- Sensitive information such as credentials, tokens, personal data, or connection strings is written to logs or exception messages → **CRITICAL**
- A library/application swallows cancellation as a normal exception and continues work → **MAJOR**

### API and type design

- A public API exposes mutable implementation collections when a read-only or intentionally encapsulated abstraction is sufficient → **MINOR**
- A public API exposes implementation details that unnecessarily couple callers to a concrete type → **MINOR**
- A public method has excessive parameters that indicate a missing cohesive value object/options type → **MINOR**
- A public API introduces a breaking change without evidence that compatibility was intentionally considered → **MAJOR**
- A type implements `IDisposable` incorrectly or violates the expected dispose pattern → **MAJOR**
- A type hierarchy or interface abstraction is introduced without a demonstrable substitutability/contract benefit → **MINOR**
- A public API uses nullable reference types inconsistently with the established project contract → **MAJOR**

### Reliability and correctness

- Code relies on behavior that can produce invalid casts, invalid sequence operations, or invalid assumptions about collection contents → **MAJOR**
- `stackalloc` or other stack-sensitive allocation is used in a loop or with an unbounded/externally controlled size → **MAJOR**
- A collection is modified while it is being enumerated unless the operation is explicitly supported and safe → **MAJOR**
- A value type is compared using reference identity when value equality is required → **MAJOR**
- A method accepts parameters that are never used and the unused parameter is not required by an interface/delegate contract → **MINOR**
- `GC.SuppressFinalize` is used incorrectly or the dispose/finalizer contract is inconsistent → **MAJOR**
- A potentially failing operation is performed without validating a required precondition, range, state, or external result → **MAJOR**
- A retry, timeout, or transient-failure mechanism can cause duplicate side effects without idempotency or compensation → **MAJOR**

### Security

- SQL, command, shell, or other executable input is constructed by interpolation or concatenation from external/untrusted data → **CRITICAL**
- `Process.Start` or equivalent process execution receives arguments derived from external input without strict validation/allow-listing → **CRITICAL**
- External data is deserialized using a binary or type-permissive mechanism that can instantiate attacker-controlled types → **CRITICAL**
- Secrets, passwords, API keys, tokens, or connection credentials are hard-coded in source code → **CRITICAL**
- Sensitive data is logged, included in exception messages, or exposed through diagnostic output → **CRITICAL**
- Cryptographic algorithms, hashes, or random generators unsuitable for the security purpose are used → **MAJOR**; **CRITICAL** when this creates a direct security boundary failure
- Certificate validation is bypassed or TLS validation is disabled without a narrowly justified test-only boundary → **CRITICAL**
- File paths derived from external input are used without validation/canonicalization against the permitted root → **CRITICAL**
- Reflection, dynamic loading, or expression compilation consumes externally controlled type/member names or code without a strict trust boundary → **CRITICAL**
- Security-sensitive decisions rely on client-controlled values without server/trusted-source validation → **CRITICAL**
- A security-sensitive operation lacks an explicit authorization/ownership check where the surrounding application requires one → **CRITICAL**
- Sensitive configuration is read from an insecure source when a platform/application secret mechanism is available → **MAJOR**

### Data access and query construction

These rules are language-level because they apply to C# data-access code regardless of whether the concrete provider is SQL Server, SQLite, or another database. Provider/framework-specific rules belong in their respective catalogs.

- SQL or database commands are constructed through string concatenation/interpolation with external or variable input → **CRITICAL**
- A database query is executed inside a loop when a set-based operation or batching strategy is reasonably available → **MAJOR**
- A database connection, command, reader, transaction, or equivalent disposable object has no deterministic lifetime → **MAJOR**
- Synchronous database I/O is introduced into an otherwise asynchronous I/O path without a justified reason → **MAJOR**
- An unbounded query result is materialized into memory where filtering, paging, projection, or streaming is reasonably available → **MAJOR**
- The same query is executed repeatedly when its result could be reused within the operation without changing semantics → **MAJOR**
- A transaction boundary is missing where multiple writes must be atomic according to the operation's documented behavior → **MAJOR**
- External query/data-access failures are caught and silently converted into successful results → **MAJOR**

### Performance

- String concatenation is repeatedly performed in a loop where `StringBuilder` or another suitable approach materially reduces allocations → **MAJOR**
- A deferred `IEnumerable`/query is enumerated multiple times when the source may execute work or perform I/O on each enumeration → **MAJOR**
- `ToList()`/`ToArray()` materializes a sequence solely to enumerate it once immediately afterwards → **MINOR**
- A LINQ pipeline performs unnecessary intermediate allocations/materialization → **MINOR**
- A large collection is repeatedly searched linearly where a dictionary/set or equivalent indexed structure is appropriate → **MAJOR**
- An allocation-heavy operation occurs in a hot or repeated path without justification → **MINOR**
- A synchronous/blocking operation is introduced into a high-throughput asynchronous path → **MAJOR**
- A large object or collection is copied unnecessarily when a read-only/view/span/memory-based alternative is appropriate → **MINOR**
- A performance-sensitive path uses reflection, dynamic dispatch, or repeated parsing/conversion where a cached/static alternative is reasonably available → **MINOR**

### Maintainability and complexity

- A method has excessive cyclomatic or cognitive complexity and the complexity is caused by avoidable branching → **MAJOR**
- A type or method has excessive responsibility such that unrelated changes repeatedly require modifying the same unit → **MAJOR**
- Significant duplicated logic is introduced where a cohesive reusable abstraction would be clearer → **MAJOR**
- Dead or unreachable code is introduced or knowingly retained without a documented compatibility reason → **MINOR**
- A method/type is excessively large and the size prevents meaningful reasoning, testing, or reuse → **MAJOR**
- Deep nesting materially reduces readability where guard clauses or decomposition would preserve behavior → **MINOR**
- Magic constants or repeated literal values encode business/technical policy that should be named or centralized → **MINOR**
- An abstraction is introduced solely to wrap a single operation without improving testability, ownership, policy, or reuse → **MINOR**

### Globalization and culture

- Culture-sensitive parsing/formatting is used where the required culture is not explicit → **MAJOR**
- `ToString`, parsing, comparison, case conversion, or formatting is used for protocol/storage/invariant data without an explicit invariant or protocol culture → **MAJOR**
- User-facing text is produced in code in a way that bypasses the project's established localization mechanism → **MINOR**
- Case-insensitive or culture-sensitive comparisons are used for identifiers, keys, protocol values, or security decisions without an explicit comparison policy → **MAJOR**
- Date/time values are converted or persisted without an explicit understanding of UTC/local/offset semantics → **MAJOR**

### Platform compatibility

- Platform-specific APIs are called without the appropriate compatibility annotation, guard, or project-specific platform contract → **MAJOR**
- Code assumes Windows, Android, iOS, macOS, Linux, or another platform without making that dependency explicit → **MAJOR**
- A platform-specific implementation leaks into a platform-independent layer without a documented boundary → **MINOR**

### Naming and language conventions

- Types, methods, and properties do not follow the project's established C# naming convention → **MINOR**
- Interfaces do not follow the established interface naming convention unless a documented exception exists → **MINOR**
- Names are misleading about nullability, mutability, asynchronous behavior, ownership, or side effects → **MAJOR**
- A new abbreviation or acronym is introduced inconsistently with established project terminology → **MINOR**
- Boolean members use names that obscure their true meaning or polarity → **MINOR**

### Documentation and public contracts

- A new public API introduces non-obvious behavior, lifecycle, ownership, threading, cancellation, or nullability semantics without appropriate documentation → **MINOR**
- Public XML documentation is required by the project's analyzer/configuration policy and the change introduces missing documentation → **MINOR**
- Comments merely restate obvious code instead of explaining a non-obvious invariant, constraint, or trade-off → **MINOR**
- A comment claims behavior that the implementation no longer provides → **MAJOR**

## Analyzer baseline

The catalog must use the .NET analyzers as an automated baseline where they are available. The exact enabled rule set is project-dependent and must be established from the project's `AnalysisLevel`, `AnalysisMode`, `.editorconfig`, `Directory.Build.props`, `Directory.Build.targets`, and analyzer configuration.

At minimum, the auditor should inspect analyzer output for the changed files across these .NET categories:

- Design
- Documentation
- Globalization
- Interoperability
- Maintainability
- Naming
- Performance
- Reliability
- Security
- Usage
- Style, when style enforcement is part of the project's quality policy

A clean build is not sufficient evidence that all categories were checked because the .NET SDK does not enable every rule by default.

If the project explicitly enables `latest-Recommended`, `latest-all`, category-level `AnalysisMode...`, or equivalent analyzer configuration, the resulting analyzer output should be treated as the automated baseline for the enabled rules.

If the project uses a pinned `AnalysisLevel`, respect that pinned level rather than silently changing it during QA.

### Analyzer findings

- A new CRITICAL or security-relevant analyzer finding in a changed file → **CRITICAL**
- A new analyzer finding classified by the project as an error → **MAJOR** unless the finding represents a security/correctness failure that warrants **CRITICAL**
- A new warning from an enabled quality rule → **MAJOR**
- A new style-only finding → **MINOR**, unless the project explicitly defines a stricter policy
- Existing findings outside the change diff do not count against the change, but must not be misrepresented as introduced findings

### Compiler baseline

- Compiler errors in changed code → **CRITICAL**
- New nullable/compiler warnings that indicate a possible runtime correctness problem → **MAJOR**; **CRITICAL** when the resulting dereference or behavior is demonstrably unsafe
- The audit must distinguish pre-existing diagnostics from diagnostics introduced by the change

## Tooling notes

- The Roslyn/.NET analyzers are the primary automated mechanism for the categories above. The .NET SDK includes the analyzers, but only a subset is enabled by default. Microsoft documents `AnalysisLevel` and `AnalysisMode` as the mechanisms that determine the active rule set.
- Do not change the project's `AnalysisLevel`, `AnalysisMode`, `.editorconfig`, or analyzer package versions merely to make QA pass. Such a change is itself a project-level change and must be governed by OpenSpec.
- `dotnet build -warnaserror` compiles the whole solution. Filter diagnostics by `file:line` against the change diff before using them in the verdict.
- `dotnet format --verify-no-changes --include <diff-files>` is a style/formatting check. Style findings must not be treated as equivalent to security, reliability, or correctness findings.
- If `Microsoft.CodeAnalysis.NetAnalyzers` is installed explicitly, respect its configured version and project policy rather than assuming the SDK version.
- The project may use `.editorconfig`, `.globalconfig`, `Directory.Build.props`, or `Directory.Build.targets` to configure analysis. These files are part of the effective analyzer configuration and should be inspected when relevant.
- If analyzer tooling is unavailable, the auditor must still perform the manual rules above. Missing tooling is not evidence of compliance.
- If a rule is already enforced by a project analyzer and no manual judgment is required, do not duplicate the same finding merely because the catalog also describes the underlying principle.
- Framework-specific rules must be supplied by composing framework catalogs. This catalog does not define MAUI, ASP.NET Core, EF Core, Entity Framework, Blazor, WPF, WinUI, Xamarin, or other framework architecture.

## Scope boundary

This catalog intentionally does **not** define:

- application/business-domain rules
- layer placement or architecture
- MAUI-specific rules
- ASP.NET Core-specific rules
- EF Core-specific behavior
- SQLite-specific behavior
- database-schema rules
- insurance/inventory/business rules

Those concerns belong in OpenSpec specifications or in appropriate composing catalogs.

## Reference baseline

The catalog is aligned conceptually with the Microsoft .NET code-analysis model:

- .NET code analysis and analyzer configuration
- .NET analyzer rule categories
- `AnalysisLevel` / `AnalysisMode`
- Roslyn/.NET analyzers
- `.editorconfig` / `.globalconfig` analyzer configuration

The catalog is not a copy of Microsoft's analyzer rule list. Analyzer IDs and enabled rules are expected to evolve with the project's .NET SDK/analyzer version; the catalog defines the audit policy while the configured analyzers provide automated evidence.
