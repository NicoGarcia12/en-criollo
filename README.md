# en-criollo

Desarrollado para participar en [Zero to Agent](https://community.vercel.com/hackathons/zero-to-agent), hackathon de Vercel, En Criollo busca llevar a lenguaje mas natural y mas "criollo" mensajes tecnicos (y tambien mensajes que no lo son, pero igual cuestan de entender). Cuando toca responder, muchas veces no solo no entendemos lo que nos dicen: tampoco sabemos que decir por incomodidad, falta de informacion u otros motivos. Esta herramienta ayuda justo en ese punto.

## Stack principal

- `Next.js 16` + `React 19` + `TypeScript`
- `Tailwind CSS 4` para estilos
- `Jest` + Testing Library para tests
- `ESLint` + `Prettier` para calidad y formato
- SDKs de AI (`ai`, `@ai-sdk/*`) para integraciones de modelo

## Requisitos

- `Node.js >=20.9 <25`
- `npm 10` (definido en `packageManager`)

## Instalacion local

```bash
npm install
```

Crear `.env.local` en la raiz del proyecto con estas variables:

```bash
# Requerida para llamadas al proveedor LLM (nombre genérico)
LLM_API_KEY="tu_api_key"

# Cadena de modelos (en orden de intento/fallback)
LLM_MODEL_CHAIN="modelo-principal,modelo-secundario"

# Base URL OpenAI-compatible (opcional, default: https://api.openai.com/v1)
LLM_BASE_URL="https://api.groq.com/openai/v1"

# Opcional en local (si no esta, usa http://localhost:3000)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Ejemplos prácticos de proveedor OpenAI-compatible

### Ejemplo A — Groq (OpenAI-compatible)

```bash
LLM_API_KEY="gsk_xxx"
LLM_BASE_URL="https://api.groq.com/openai/v1"
LLM_MODEL_CHAIN="llama-3.3-70b-versatile,llama-3.1-8b-instant"
```

### Ejemplo B — OpenAI API oficial

```bash
LLM_API_KEY="sk-proj-xxx"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_MODEL_CHAIN="gpt-4o-mini,gpt-4.1-mini"
```

## ¿Qué pasa si la clave o modelos están mal?

- Si falta `LLM_API_KEY`: la API devuelve error de configuración.
- Si `LLM_MODEL_CHAIN` está vacío/inválido: la API devuelve error de configuración.
- Si un modelo falla (429/5xx/timeout o respuesta vacía): se intenta el siguiente modelo de la cadena.
- Si fallan todos los modelos: el endpoint responde `502` con código `LLM_FALLBACK_EXHAUSTED` y traza de intentos.

Comandos base:

```bash
# validar calidad
npm run quality:gate

# levantar local
npm run dev

# build de produccion
npm run build

# ejecutar build localmente
npm run start:prod

# tests
npm test

# calidad rápida (formato + lint + tipos)
npm run quality:gate:fast
```