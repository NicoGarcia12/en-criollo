# Playbook — Baseline npm + Vercel para proyectos Next.js

## Objetivo

Establecer una base reproducible para proyectos Next.js desplegados en Vercel usando npm.

## Reglas de baseline

1. Usar un solo package manager por repo (`npm`).
2. Mantener `package-lock.json` versionado.
3. Evitar lockfiles múltiples (`pnpm-lock.yaml`, `yarn.lock`) salvo estrategia explícita.
4. Definir `engines.node` en `package.json` para alinear local/CI/Vercel.
5. Evitar sobreconfigurar `vercel.json` cuando los defaults de Next.js alcanzan.

## Node recomendado (política LTS N/N-1)

- Para Next.js 16: mínimo `20.9`.
- Rango sugerido de proyecto: `>=20.9 <25`.

## package.json (ejemplo)

```json
{
  "engines": {
    "node": ">=20.9 <25"
  },
  "packageManager": "npm@10"
}
```

## Vercel

- Si es un Next.js estándar, no hace falta `vercel.json`.
- Si se define `engines.node`, prevalece sobre la selección del dashboard.

## Checklist de migración pnpm -> npm

- [ ] Reemplazar `packageManager` a npm (o remover si se prefiere autodetección).
- [ ] Ejecutar `npm install` para crear `package-lock.json`.
- [ ] Eliminar `pnpm-lock.yaml`.
- [ ] Limpiar docs/scripts/config con referencias a pnpm.
- [ ] Correr quality gate local:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test --if-present`

## Referencias

- Next.js 16 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Vercel Node.js versions: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Vercel project configuration: https://vercel.com/docs/project-configuration
- npm package-lock: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json
