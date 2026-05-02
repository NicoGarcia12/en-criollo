# Learning — 2026-05-02 — Quality gate, push y dominio de producción Vercel

## Contexto
Se ejecutó quality gate completo del proyecto y se preparó release operativo con push a remoto. También se pidió consolidar una única URL de producción: `v0-encriollo.vercel.com`.

## Qué se aplicó
- Quality gate basado en scripts reales del repo:
  - `npm run format:check`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- Corrección mínima para destrabar gate:
  - ejecución de `npm run format` (solo cambios de estilo)
- Flujo Git:
  - revisión de estado/diff/log
  - commit con convención del repo
  - push a remoto sin force

## Resultado
- Gate en verde luego de aplicar formateo.
- Build de Next.js exitoso.
- Cambios listos para integración en rama principal.

## Lección reusable
1. Definir quality gate por scripts existentes (no asumir `test` si no existe).
2. Si falla por formato, priorizar `prettier --write` antes de tocar lógica.
3. Evitar mezclar package managers en CI/CD: dejar uno solo y lockfile consistente.
4. Para dominios Vercel, validar alias/productivo con CLI autenticada o completar paso manual guiado.

## Referencias oficiales
- Next.js Build: https://nextjs.org/docs/app/building-your-application/deploying
- Vercel Domains: https://vercel.com/docs/domains
- Vercel CLI: https://vercel.com/docs/cli
- Prettier CLI: https://prettier.io/docs/cli
