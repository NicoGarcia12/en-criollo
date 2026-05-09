# Canonical quality gate playbook

Objetivo: validar rapido que la URL canonica quede bien configurada con una sola fuente de verdad (`NEXT_PUBLIC_SITE_URL`) y fallback seguro.

## 1) Preparar variables

1. Crear o actualizar `.env.local` con:
   - `NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"`
2. Verificar que no haya slash final obligatorio ni rutas en esa URL.
3. Si no seteas `NEXT_PUBLIC_SITE_URL`, el sistema cae a `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL` (si existen) y luego a `http://localhost:3000`.

## 2) Ejecutar quality gate (exacto con npm)

1. `npm install`
2. `npm run quality:gate:fast`
3. `npm run quality:gate`

`quality:gate:fast` ejecuta en orden `format:check`, `lint` y `typecheck`.

Politica permanente: `format`, `format:check`, `lint` y `lint:fix` corren solo sobre archivos trackeados por Git (`git ls-files`) y excluyen `.opencode/**` en todo entorno (local y CI).

`quality:gate` ejecuta `quality:gate:fast` y luego `build`.

## 3) Verificar resultado canonico

1. Levantar app local: `npm run dev`
2. Abrir `http://localhost:3000`
3. Inspeccionar HTML y confirmar:
   - `<link rel="canonical" href="https://tu-dominio.com/" />` cuando `NEXT_PUBLIC_SITE_URL` esta seteada.
   - fallback a `http://localhost:3000/` cuando no existe `NEXT_PUBLIC_SITE_URL`.

## 4) Criterio de aprobacion

- `npm run quality:gate:fast` en verde para validacion rapida local.
- `npm run quality:gate` en verde para validacion completa.
- Canonical presente en layout global.
- Canonical consistente entre entornos (local/staging/prod) via env publica.
