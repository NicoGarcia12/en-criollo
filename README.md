# en-criollo

Aplicacion web con Next.js orientada a generar y presentar contenido "en criollo" con una UX moderna, integracion con SDK de AI y despliegue listo para Vercel.

## Que hace este proyecto

- Ofrece una interfaz web para crear y consumir contenido con lenguaje claro.
- Centraliza metadata y URL canonica en una sola fuente de verdad via `NEXT_PUBLIC_SITE_URL`.
- Usa fallback seguro para canonical cuando no hay variable publica definida (`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, o `http://localhost:3000`).

## Stack principal

- `Next.js 16` + `React 19` + `TypeScript`
- `Tailwind CSS 4` para estilos
- `Jest` + Testing Library para tests
- `ESLint` + `Prettier` para calidad y formato
- SDKs de AI (`ai`, `@ai-sdk/*`) para integraciones de modelo

## Requisitos

- `Node.js >=20.9 <25`
- `npm 10` (definido en `packageManager`)

## Instalacion

```bash
npm install
```

Opcional para produccion/canonical:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"
```

## Comandos

- Desarrollo (hot reload): `npm run dev` (alias actual de inicio local: `npm start`)
- Build de produccion: `npm run build`
- Servidor de produccion (post-build): `npm run start:prod`
- Lint: `npm run lint`
- Lint con auto-fix: `npm run lint:fix`
- Formato: `npm run format`
- Verificacion de formato: `npm run format:check`
- Type checking: `npm run typecheck`
- Tests: `npm run test`
- Quality gate rapido (sin build): `npm run quality:gate:fast`
- Quality gate completo: `npm run quality:gate`

Politica permanente de calidad: `format`, `format:check`, `lint` y `lint:fix` procesan solo archivos trackeados por Git (`git ls-files`) y excluyen siempre `.opencode/**`.

## Flujo recomendado de calidad

1. Durante desarrollo: `npm run format` y `npm run lint:fix` cuando haga falta.
2. Antes de abrir PR: `npm run quality:gate:fast`.
3. Antes de merge/release: `npm run quality:gate`.

`quality:gate:fast` corre, en orden: `format:check` -> `lint` -> `typecheck`.
`quality:gate` corre: `quality:gate:fast` -> `build`.

Nota: al evaluar solo archivos trackeados, los archivos no versionados no bloquean CI ni el flujo local hasta que se agregan al index.

## Estructura basica de carpetas

- `app/`: rutas, layouts y paginas (App Router)
- `components/`: componentes reutilizables de UI
- `lib/`: utilidades, helpers y logica compartida
- `docs/`: documentacion tecnica y playbooks
- `public/`: assets estaticos

## Documentacion relacionada

- Playbook canonico de quality gate: `docs/canonical-quality-gate-playbook.md`
- Entrada anti-drift en knowledge: `docs/knowledge/canonical-quality-gate-playbook.md`
