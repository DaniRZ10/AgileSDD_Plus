---
name: swing
axis: framework
composes_with: [java]
activates_on:
  extensions: []
  paths:
    - "**/view/**"
    - "**/ui/**"
    - "**/gui/**"
  markers:
    - file: "**/*.java"
      contains: "javax.swing"
artifact_shape: any
---

# Swing

Desktop applications built with Swing, usually organized as model / view / controller. Java language rules live in `java.md`.

## Layer vocabulary

| Role | In a Swing application |
|---|---|
| Orchestration | Listeners (`ActionListener`, `MouseListener`...) and controller classes |
| Domain | Model classes: the application or game logic, independent of the UI |
| Persistence | Classes that read or write files or databases |
| Domain models | Plain model objects (no `javax.swing` / `java.awt` imports) |

## Rules

- Swing components created or modified outside the Event Dispatch Thread (no `SwingUtilities.invokeLater` when starting the UI, UI updates from worker threads) → **MAJOR**
- Long-running work on the Event Dispatch Thread (file or network I/O, heavy computation, `Thread.sleep` inside a listener) instead of a `SwingWorker` or background thread → **MAJOR**
- Application logic inside listeners or inside `JFrame` / `JPanel` subclasses instead of model classes → **CRITICAL**
- Model classes importing `javax.swing` or `java.awt` → **MAJOR**
- Absolute positioning with `setLayout(null)` for windows meant to be resized → **MINOR**
