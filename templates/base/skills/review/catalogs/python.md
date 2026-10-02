---
name: python
axis: language
composes_with: []
activates_on:
  extensions: [".py", ".pyi"]
  paths: []
  markers:
    - file: "pyproject.toml"
    - file: "setup.py"
    - file: "requirements.txt"
artifact_shape: any
tools:
  - name: mypy
    detect: "mypy --version"
    scoped_invocation: "mypy <diff-files>"
    scope_note: "follows imports by default; findings outside the diff files are excluded from the verdict"
  - name: ruff
    detect: "ruff --version"
    scoped_invocation: "ruff check <diff-files>"
    scope_note: "reads the project's own configuration, which may be permissive — silence does not exempt the rules below"
substitutes: []
---

# Python

Applies to new or modified Python files. Python is used both in layered applications and in scripts, packages, and command-line tools; this catalog says nothing about layers. When the change contains no layered architecture, the layer checks are reported N/A by the protocol, and everything here still applies.

The risk profile of a Python script is not a reduced version of a web application's. HTML escaping usually does not apply; **command injection is the everyday vector**, because invoking system processes is routine.

## Rules

### Typing

- Missing type annotation on a public function or method parameter → **MAJOR**
- Missing return annotation on a public function or method → **MAJOR**
- Use of `Any` without a comment justifying it → **MINOR**
- A function returning nothing without `-> None` → **MINOR**
- Type comments or stubs that contradict the runtime signature → **MAJOR**

Python's typing is optional and not enforced at runtime, so absence of annotation is not a syntax matter but a documentation and safety one. Where the project runs `mypy`, its findings confirm; its silence does not exempt (a project may run it non-strict).

### Error handling

- Bare `except:` → **MAJOR** — swallows `KeyboardInterrupt` and `SystemExit` along with real errors
- `except Exception: pass`, or any handler whose body discards the error without logging or re-raising → **MAJOR**
- Catching a broad exception where the specific one is determinable → **MINOR**
- Raising a bare `Exception` instead of a specific or domain exception → **MINOR**

### Resource management

- Opening a file, socket, lock, or connection without a context manager (`with`) or an equivalent guaranteed release → **MAJOR**
- A `finally` block that can itself raise and mask the original error → **MAJOR**

### Mutable defaults and shared state

- Mutable default argument (`def f(x=[])`, `{}`, `set()`) → **MAJOR** — the default is created once and shared across calls
- Module-level mutable state written by functions → **MAJOR** where it is not an explicit, documented singleton

### Deserialization and dynamic execution

- `pickle`, `marshal`, or `shelve` reading data that is not fully under the project's control → **CRITICAL**
- `yaml.load` without a safe loader → **CRITICAL**
- `eval`, `exec`, or `__import__` on any value derived from external input → **CRITICAL**

### Command and query injection

- `subprocess` with `shell=True` where any part of the command derives from external input → **CRITICAL**
- `os.system` with an interpolated value → **CRITICAL**
- SQL built by f-string, `%`, `.format()`, or concatenation instead of parameters → **CRITICAL**
- `subprocess` with `shell=True` on a fully static command → **MINOR** (unnecessary shell)

### Correctness traps

- Equality comparison between floats → **MINOR**, suggest a tolerance
- `is` used to compare values rather than identity → **MAJOR**
- Mutating a collection while iterating over it → **MAJOR**
- A generator or iterator consumed twice → **MAJOR**

### Naming

Names follow the language convention (`snake_case` for functions and variables, `PascalCase` for classes). A name that violates the convention is **MINOR**; the semantic-naming rules of the unconditional core apply on top of this and are unaffected by casing.

## Tooling notes

- `mypy` follows imports, so it reports beyond the diff files. Findings outside the change do not count toward the verdict; they may be recorded as observations.
- `ruff` reads the project's `pyproject.toml`. A permissive configuration means its silence carries no information — apply the rules above by reading regardless.
- Neither tool covers the deserialization, command-injection, or resource-management rules above under a default configuration. Do not treat a clean run as coverage of those.
