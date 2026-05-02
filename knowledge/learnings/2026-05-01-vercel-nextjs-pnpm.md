# Learning — Configuración Vercel para Next.js + npm

## Qué se aplicó

- Se agregó packageManager: "npm@10" en package.json para fijar el package manager esperado por Vercel.
- Se creó vercel.json mínimo con schema oficial y framework: "nextjs".
- Se validó que los scripts base de Next.js ya estaban correctos (dev, build, start).

## Por qué

- Vercel autodetecta Next.js y lockfile, pero declarar packageManager reduce ambigüedad entre entornos locales/CI.
- Un vercel.json mínimo deja explícito el framework sin sobreconfigurar build/output, evitando romper defaults de Next.js en Vercel.

## Variables de entorno detectadas

- OPENAI_API_KEY (scripts de test y posible uso de runtime).
- VERCEL_URL (usada en script de test; en runtime Vercel la inyecta automáticamente).
- NODE_ENV (automática en Vercel).

## Documentación oficial consultada

- Vercel Builds & Framework Detection: https://vercel.com/docs/fundamentals/builds
- Vercel Build Command config: https://vercel.com/docs/builds/configure-a-build
- Vercel vercel.json: https://vercel.com/docs/project-configuration/vercel-json
- Next.js deploy docs: https://nextjs.org/docs/app/building-your-application/deploying
