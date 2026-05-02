# Learning — Next.js scripts: `start` en dev y `start:prod` en producción

## Contexto

En este repo, `npm start` estaba apuntando a `next start` (modo producción), lo que generaba confusión porque no había hot reload durante desarrollo.

## Decisión aplicada

- `start` ahora ejecuta `next dev` para priorizar experiencia de desarrollo con watch/HMR.
- Se agregó `start:prod` para dejar explícito el arranque productivo con `next start`.
- `build` se mantiene en `next build` y `dev` en `next dev`.

## Concepto clave

- `next dev`: servidor de desarrollo con **Hot Module Reloading (HMR)**.
- `next start`: servidor de producción, requiere build previo (`next build`).

## Convención resultante

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next dev",
    "start:prod": "next start"
  }
}
```

## Referencias oficiales

- Next.js CLI (`next dev`, `next start`): https://nextjs.org/docs/app/api-reference/cli/next
- Next.js Docs (overview): https://nextjs.org/docs
