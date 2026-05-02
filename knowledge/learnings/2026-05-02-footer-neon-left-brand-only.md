# Learning — Footer: color neón solo en marca izquierda

## Contexto
Se corrigió una aplicación de estilo donde el color verde neón estaba aplicado al elemento incorrecto del footer.

## Qué se aplicó
- Se limitó el estilo `var(--neon)` exclusivamente al texto de marca **"En Criollo"** en el bloque izquierdo del footer.
- Se dejó intacto el bloque derecho (`footer.made`) en contenido y estilo.
- Se eliminó el elemento extra que estaba coloreado a la derecha para evitar afectar el layout/intención original.

## Conceptos React/Next.js usados
- Renderizado declarativo en JSX para aplicar estilos puntuales (`<span style={{ color: "var(--neon)" }}>`).
- Transformación mínima de string (`replace`) para mantener i18n y evitar duplicar texto de disclaimer.
- Cambio de alcance acotado en `app/page.tsx` sin tocar componentes no relacionados.

## Alternativas consideradas
1. **Aplicar clase/estilo al `<p>` completo izquierdo**
   - Descartado: colorea más texto del pedido.
2. **Crear key i18n separada para marca + disclaimer**
   - Válido a futuro, pero excede el alcance de la corrección puntual.
3. **Mantener el elemento derecho “En Criollo” y colorearlo**
   - Descartado: era justamente el problema reportado.

## Documentación oficial relacionada
- React (JSX y composición de UI): https://react.dev/learn/writing-markup-with-jsx
- Next.js App Router (componentes en `app/`): https://nextjs.org/docs/app
