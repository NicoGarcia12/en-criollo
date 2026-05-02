# Learning — Estandarización deploy Vercel + npm (2026-05-02)

## Objetivo

Dejar el proyecto reproducible para deploy en Vercel y migrar de pnpm a npm sin rastros residuales.

## Qué se aplicó

- Se fijó runtime en `package.json`:
  - `engines.node: ">=20.9 <25"`
  - Justificación: Next.js 16 requiere Node >=20.9 y Vercel soporta 20.x/22.x/24.x.
- Se migró package manager:
  - `packageManager` pasó de `pnpm@9` a `npm@10`.
- Se generó lockfile de npm:
  - `package-lock.json` creado con `npm install`.
- Se eliminó lockfile de pnpm:
  - `pnpm-lock.yaml` eliminado.
- Se revisó configuración de Vercel:
  - `vercel.json` eliminado para usar defaults oficiales de Next.js en Vercel (evita sobreconfig innecesaria).
- Se limpiaron referencias a pnpm en documentación operativa.

## Validaciones ejecutadas (quality gate local)

- `npm install` ✅
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run test --if-present` ✅ (sin salida: no hay script `test` definido)

## Riesgos / observaciones

- `npm install` reportó 2 vulnerabilidades moderadas en árbol de dependencias (no bloqueante para build). Recomendado revisar con `npm audit`.
- En entorno local se usó Node `v24.15.0` + npm `11.12.1`; la configuración del proyecto admite también Node 20/22 por rango de engines.

## Referencias oficiales

- Next.js v16 (requerimiento Node >=20.9): https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js instalación (system requirements): https://nextjs.org/docs/app/getting-started/installation
- Vercel Node.js versions / `engines.node`: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- npm lockfile: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json
