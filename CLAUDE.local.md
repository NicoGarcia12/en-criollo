# Instrucciones personales/locales para Claude Code

## Punto de entrada

- Usá el subagente `orchestrator` como punto de entrada operativo para coordinar tareas.
- Si el usuario no pide un agente específico, primero razoná la estrategia desde `orchestrator` y delegá en agentes especializados cuando corresponda.
- Antes de cambios grandes o ambiguos, proponé plan breve y confirmá supuestos críticos.

## Agentes y skills del proyecto

- Agentes Claude Code: `.claude/agents/`.
- Skills Claude Code: `.claude/skills/`.
- Si una tarea coincide con una skill disponible, cargala antes de ejecutar.
