# AgileSDD Plus

*[Read in English](README.md)*

Un *starter* ligero e instalable para desarrollar software con agentes de IA siguiendo **Agile + Spec Driven Development**, con un **revisor independiente** que comprueba cada historia de usuario contra sus criterios de aceptación.

Fusiona dos proyectos:

- **[AgileSDD](https://github.com/titozeio/AgileSDD)**: un flujo ligero y orientado a producto (roadmap → épicas → historias de usuario → tareas) en el que el PM humano aprueba cada paso.
- **devAgent**: un pipeline multiagente sobre OpenSpec cuyas mejores ideas son los jueces independientes, los veredictos deterministas y los catálogos de auditoría por stack.

AgileSDD Plus mantiene el ciclo ágil como columna vertebral e incorpora solo los mecanismos de calidad que no añaden ceremonia. Cada decisión y su origen están en [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Inicio rápido

```bash
npx github:DaniRZ10/AgileSDD_Plus mi-proyecto
cd mi-proyecto
```

> Aún no está publicado en npm: se instala directamente desde GitHub (requiere Git y Node 18 o superior).

Abre tu agente (Claude Code, Antigravity u OpenCode) y escribe `/sdd`. El agente lee el roadmap, ve que `EPIC0` está en `implement` y empieza a entrevistarte para rellenar specs, arquitectura y roadmap. No adivina nada: los ficheros del scaffold son plantillas.

```bash
npx github:DaniRZ10/AgileSDD_Plus . --force                      # instalar en un repo existente sobrescribiendo el scaffold
npx github:DaniRZ10/AgileSDD_Plus mi-proyecto --yes              # sin preguntas, valores recomendados
npx github:DaniRZ10/AgileSDD_Plus mi-proyecto --no-skills        # solo la skill obligatoria grill-me
npx github:DaniRZ10/AgileSDD_Plus mi-proyecto --platforms claude,antigravity   # o all / none
```

Nunca se sobrescriben ficheros existentes salvo con `--force`.

## El ciclo

Un sprint = una épica. Una historia de usuario cada vez.

| Fase | Qué ocurre | Salida |
| --- | --- | --- |
| Spec | Aclarar con `grill-me` (una pregunta cada vez) y escribir historias con criterios de aceptación `ACn.m` (Given/When/Then) | El PM está de acuerdo y cada historia cumple la Definition of Ready |
| Plan | Ordenar las historias por valor y dependencias | El PM aprueba |
| Tasks | Dividir cada historia en tareas pequeñas trazadas a sus criterios | El PM aprueba |
| Implement | El cambio útil más pequeño por tarea, tests primero, Definition of Done | El PM pasa la épica a revisión |
| Review | Revisor independiente por historia y después revisión del PM | El PM aprueba cada historia |
| Close | Actualizar el spec vivo `specs/CAPABILITIES.md`, el changelog y una retro de tres líneas | Épica `done` |

## Comandos

| Comando | Para qué | Modo por defecto |
| --- | --- | --- |
| `/sdd` | retomar el flujo desde el roadmap | siempre |
| `/grillme` | aclarar alcance, una pregunta cada vez | `auto` (obligatoria) |
| `/zoomout` | revisión de coherencia antes de implementar | `manual` |
| `/tdd` | rojo-verde-refactor | `manual` |
| `/sdd-review EPIC2/US1` o `/sdd-review spec EPIC2` | revisión independiente | `auto` |
| `/sdd-debug` | depuración buscando la causa raíz | `manual` |

Los comandos son envoltorios mínimos generados para cada plataforma que solo apuntan a `skills/*/SKILL.md`: una única fuente de verdad, sin variantes duplicadas.

## El revisor independiente

Antes de que el PM revise una historia, la sesión principal pasa al subagente `sdd-reviewer` **rutas de ficheros, no resúmenes**. Con contexto limpio, el revisor ejecuta los tests, construye una tabla de trazabilidad (criterio → implementación → test), audita solo el código nuevo o modificado, aplica los catálogos del stack y devuelve un veredicto mecánico (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED` o `NOT_VERIFIED`) que añade a `specs/EPICX/REVIEW.md`. Un check que no se ha podido ejecutar es `N/A` con motivo, nunca `PASS`.

Catálogos incluidos: PHP, Python, C#, Java, JavaScript, TypeScript, CSS · Symfony, Laravel, MAUI, Spring Boot, Swing · Twig, Blade.

## Barreras

- **Las épicas cerradas son de solo lectura.** En Claude Code, el hook `sdd-guard` bloquea ediciones en `specs/EPICn/` cuando el roadmap marca esa épica como `done`. No tiene dependencias y, si falla, deja pasar: nunca te bloquea la sesión.
- **Docs primero.** Un cambio de alcance actualiza la épica y sus criterios antes que el código.
- **Git es del desarrollador.** Los agentes sugieren el mensaje de commit (`[EPICX][Tn] resumen`) y no hacen commits salvo que se les pida.

## Estado por plataforma

Claude Code está construido sobre los formatos documentados y pendiente de un piloto completo. Los adaptadores de Antigravity y OpenCode siguen el formato que usa devAgent y aún no se han verificado en una instalación real. Cualquier agente que lea `AGENTS.md` puede seguir el flujo sin adaptadores.

El revisor usa `sonnet` en Claude Code y `flash` en Antigravity; súbelos (`opus`, `pro`) en el fichero del agente si tu plan lo permite.

## Frente a los originales

Frente a AgileSDD 0.8 añade criterios de aceptación verificables, Definition of Ready/Done, revisor independiente, catálogos de auditoría, spec vivo, cierre con retro, barrera de épicas cerradas y adaptadores multiplataforma, y corrige sus fallos de plantilla. Frente a devAgent añade la capa de producto (roadmap, épicas, historias), carga unas seis veces menos contexto por sesión y no depende de ninguna herramienta externa.

devAgent sigue siendo mejor en tres cosas: deltas de spec validados por la CLI de OpenSpec, jueces de otra familia de modelos (variante OpenCode) y documentación automática con reglas de gobierno. La comparativa completa está en el [README en inglés](README.md#how-it-compares) y en [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Desarrollo

```bash
npm test                                   # 14 tests, Node 18+, sin dependencias
node ./bin/create-agile-sdd-plus.cjs ../proyecto-de-prueba
```

## Créditos

- **AgileSDD**, de Sergio Montes ([titozeio/AgileSDD](https://github.com/titozeio/AgileSDD), MIT): el flujo, el scaffold y la CLI sobre los que se construye este fork.
- **devAgent**, de antoniov-sandiez y colaboradores (MIT): catálogos de auditoría y protocolos de revisión y depuración.
- **[mattpocock/skills](https://github.com/mattpocock/skills)**, de Matt Pocock (MIT): las skills originales `grill-me`, `zoom-out` y `tdd`.

## Licencia

MIT. Ver [`LICENSE`](LICENSE).
