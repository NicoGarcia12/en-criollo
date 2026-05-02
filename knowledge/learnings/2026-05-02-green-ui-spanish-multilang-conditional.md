# Learning — GREEN UI español + multilenguaje condicional

## Contexto
Se implementó una corrección orientada a tests RED para reforzar propuesta de valor, consistencia idiomática de UI y reglas de salida multilenguaje en prompts de API.

## Conceptos aplicados
- **Single-locale UI (es)**: se dejó la interfaz únicamente en español para evitar fricción de producto y ambigüedad de navegación.
- **Copy de valor explícito**: el subtítulo ahora comunica claramente dos jobs-to-be-done:
  1) entender mensajes de otras personas,
  2) responder opcionalmente cuando la persona no sabe cómo.
- **Prompting condicional por idioma de entrada**:
  - Si el input parece español → pedir salida **solo en español** y **sin duplicar**.
  - Si el input no parece español → pedir salida en **español + idioma original**.
- **Presentación para usuario final**: se agregó instrucción de **estructura clara**, con bloques/etiquetas legibles y sin códigos de idioma crudos.
- **Branding de footer**: marca visual “En Criollo” en color tokenizado (`var(--neon)`) para mantener consistencia de diseño.

## Decisiones de implementación
- Se priorizó un enfoque **mínimo y compatible** con la arquitectura existente (sin refactors grandes).
- La detección de idioma se resolvió con heurística liviana (`isLikelySpanish`) para cumplir el objetivo de negocio y tests actuales.

## Alternativas consideradas
1. **Detector de idioma externo (librería/API)**
   - Pro: mayor precisión estadística.
   - Contra: más dependencia, mayor complejidad y costo.
2. **Heurística local (elegida)**
   - Pro: simple, rápida, suficiente para el criterio RED/GREEN actual.
   - Contra: puede tener falsos positivos/negativos en casos borde.

## Referencias oficiales
- React (componentes y hooks): https://react.dev/reference/react
- Next.js App Router y Route Handlers: https://nextjs.org/docs/app
- Vercel AI SDK (`generateText`): https://ai-sdk.dev/docs
