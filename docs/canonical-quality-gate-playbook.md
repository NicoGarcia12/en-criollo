# Canonical quality gate playbook

Objetivo: validar rapido que la URL canonica quede bien configurada con `NEXT_PUBLIC_SITE_URL` y fallback seguro.

## 1) Preparar variables

1. Crear o actualizar `.env.local` con:
   - `NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"`
2. Verificar que no haya slash final obligatorio ni rutas en esa URL.

## 2) Ejecutar quality gate (exacto con npm)

1. `npm install`
2. `npm run typecheck`
3. `npm run build`

## 3) Verificar resultado canonico

1. Levantar app local: `npm run dev`
2. Abrir `http://localhost:3000`
3. Inspeccionar HTML y confirmar:
   - `<link rel="canonical" href="https://tu-dominio.com/" />` cuando `NEXT_PUBLIC_SITE_URL` esta seteada.
   - fallback a `http://localhost:3000/` cuando no existe `NEXT_PUBLIC_SITE_URL`.

## 4) Criterio de aprobacion

- `typecheck` y `build` en verde.
- Canonical presente en layout global.
- Canonical consistente entre entornos (local/staging/prod) via env publica.
