---
name: maui
axis: framework
composes_with: [csharp]
activates_on:
  extensions: [".xaml", ".xaml.cs"]
  paths:
    - "**/Platforms/Android/**"
    - "**/Platforms/iOS/**"
  markers:
    - file: "*.csproj"
      contains: "Microsoft.Maui"
artifact_shape: any
---

# .NET MAUI

Applies to new or modified .NET MAUI UI, application lifecycle, navigation, platform integration, and resource code. This catalog covers MAUI-specific concerns; language-level C# rules remain the responsibility of `csharp.md`.

## Rules

### Architecture and separation

- UI code containing substantial business logic that belongs in services or ViewModels → **MAJOR**
- Business rules duplicated between pages/ViewModels instead of being centralized in an appropriate service/domain component → **MAJOR**
- Direct database access from a UI page when an application service/repository abstraction is already used by the project → **MAJOR**

### MVVM and bindings

- A ViewModel is bypassed for state or business logic that is expected to be exposed through the ViewModel → **MAJOR**
- Binding to a mutable UI state without a reliable notification mechanism where the UI must react to changes → **MAJOR**
- Event handlers containing substantial business logic instead of delegating to an appropriate command/service → **MINOR**
- Binding paths that reference renamed or removed properties without corresponding updates → **MAJOR**

### Navigation and lifecycle

- Navigation logic that bypasses the application's established navigation mechanism → **MAJOR**
- Long-running work started from a page lifecycle method without cancellation or lifecycle awareness → **MAJOR**
- Resources, subscriptions, or handlers retained after a page/view is disposed or no longer needed → **MAJOR**
- Blocking the UI thread with synchronous I/O or long-running computation → **CRITICAL**

### Platform-specific code

- Android/iOS-specific behavior implemented in shared code through brittle runtime checks when a platform abstraction or platform folder is appropriate → **MAJOR**
- Platform-specific code added without isolating it under the appropriate platform-specific area or abstraction → **MAJOR**
- Platform API usage without handling the platform's required permission, lifecycle, or failure conditions → **MAJOR**

### UI and resources

- Hard-coded repeated UI values where an existing resource/style mechanism should be used → **MINOR**
- Missing accessibility semantics for an interactive control where the platform/UI framework supports them → **MINOR**
- Large or duplicated UI definitions that should reasonably be extracted into reusable components → **MINOR**

### Async and data access

- Network, database, or file I/O executed synchronously on the UI thread → **CRITICAL**
- Fire-and-forget asynchronous work without deliberate error handling and lifecycle consideration → **MAJOR**
- Repeated data loading caused by lifecycle events without an explicit reason or caching strategy → **MINOR**

## Tooling notes

- C# language rules are supplied by `csharp.md`; do not duplicate them here.
- This catalog focuses on MAUI-specific architecture and runtime behavior.
- Platform-specific findings should be interpreted together with the Android/iOS rules when dedicated platform catalogs are present.
