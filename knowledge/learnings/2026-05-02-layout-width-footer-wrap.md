# Learning — 2026-05-02 — Layout width + footer wrapping responsive

## Contexto

Se pidió:

1. ampliar moderadamente el ancho general de la home,
2. mantener el footer en una línea cuando hay espacio,
3. hacer fallback responsive cuando no entra, sin perder el estilo previo (incluyendo `En Criollo` neón solo a la izquierda).

## Decisión técnica

- Se aumentó el contenedor principal de `max-w-3xl` a `max-w-4xl` en las secciones clave (`header`, hero, app y footer container).
- Para el footer se usó:
  - `flex-col` por defecto (mobile-first),
  - `sm:flex-row sm:flex-wrap` en pantallas más grandes.

Esto permite que:

- si hay ancho suficiente, izquierda y derecha queden en fila,
- si no hay ancho suficiente, el layout envuelva naturalmente (fallback visual equivalente a columna/stack), evitando overflow.

## Alternativas consideradas

1. **Solo breakpoint (`sm:flex-row` sin wrap)**
   - Más simple, pero puede apretar/romper en textos largos.
2. **Grid con columnas fijas/fraccionales**
   - Válido, pero menos natural para “si no entra, bajá”.
3. **Flex con wrap (elegida)**
   - Mejor comportamiento adaptativo con contenidos variables e i18n.

## Conceptos aplicados

- Enfoque **mobile-first** de Tailwind.
- `max-width` para controlar legibilidad sin perder fluidez.
- `flex-wrap` para fallback responsivo no intrusivo.
- Conservación de estilo semántico/visual de marca (`var(--neon)` solo en la parte izquierda).

## Referencias

- Tailwind CSS — Max Width: https://tailwindcss.com/docs/max-width
- Tailwind CSS — Flex Wrap: https://tailwindcss.com/docs/flex-wrap
- Tailwind CSS — Responsive Design: https://tailwindcss.com/docs/responsive-design
