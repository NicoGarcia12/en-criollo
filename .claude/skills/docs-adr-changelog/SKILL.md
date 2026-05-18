---
name: docs-adr-changelog
description: "Skill para documentación técnica — ADRs, CHANGELOG, README, JSDoc/TSDoc, comentarios de código."
---

# Skill: Documentación Técnica

Skill para mantener documentación de proyecto: ADRs (Architecture Decision Records),
CHANGELOG, README, y documentación de código con JSDoc/TSDoc.

---

## Paso 0 — Verificar qué existe

Antes de crear documentación, verificar:

```
Archivos a buscar:
- README.md
- CHANGELOG.md
- docs/decisions/ o ubicación documental existente del proyecto (usar `knowledge/` solo como legado explícito)
- JSDoc/TSDoc configurado (tsdoc.json, typedoc.json)
```

**No duplicar documentación existente. Actualizar lo que ya existe.**

### Política de memoria y documentación

- **Memoria operativa principal**: registrar avances, decisiones, aprendizajes y resúmenes de sesión en Engram.
- **No recrear `knowledge/` por defecto**: usar `knowledge/` solo como legado/fuente a migrar o cuando el usuario pida explícitamente documentación versionada allí.
- **Reusable/general**: documentar patrones reutilizables en documentación versionada (`docs/`, ADR, runbook, guía o changelog) solo cuando corresponda.
- **Control pre-push**: verificar que Engram tenga resumen/observaciones relevantes y que la documentación versionada pedida por la tarea esté completa.

### Regla de evidencia y supuestos

- No inventar datos: documentar solo con evidencia verificable (código, commits, issues, docs oficiales).
- Si falta información crítica, hacer las preguntas necesarias antes de cerrar el documento.
- Si igual se necesita avanzar, agregar sección `Supuestos` con marca explícita y alcance.

---

## Parte 1 — ADR (Architecture Decision Records)

### Qué es un ADR

Un ADR documenta una decisión arquitectónica importante:
- POR QUÉ se tomó la decisión (no solo QUÉ)
- Qué alternativas se evaluaron
- Cuáles son las consecuencias

Además, debe explicitar estado de soporte LTS `N`/`N-1` de la tecnología involucrada.

### Template

```markdown
# ADR-NNN: Título descriptivo de la decisión

## Estado
Aceptado | Propuesto | Deprecado | Reemplazado por ADR-XXX

## Fecha
2024-01-15

## Contexto
Describir el problema o la necesidad que motivó esta decisión.
Incluir restricciones, requisitos y contexto técnico relevante.

## Decisión
Describir la decisión tomada de forma clara y concreta.
"Vamos a usar X para Y porque Z."

## Referencia LTS
Indicar si la decisión está en LTS `N`, LTS `N-1` o fuera de ventana.
Si está fuera de ventana, incluir mensaje estándar:
`LEGACY FALLBACK: componente fuera de ventana LTS N/N-1; se mantiene por compatibilidad temporal hasta plan de migración aprobado.`

## Alternativas evaluadas

### Alternativa 1: [nombre]
- **Pros**: ...
- **Contras**: ...

### Alternativa 2: [nombre]
- **Pros**: ...
- **Contras**: ...

## Consecuencias

### Positivas
- ...

### Negativas
- ...

### Riesgos
- ...
```

### Ejemplo real

```markdown
# ADR-001: Usar Prisma como ORM

## Estado
Aceptado

## Fecha
2024-01-15

## Contexto
El proyecto necesita un ORM para acceder a MySQL desde Express + TypeScript.
El equipo tiene experiencia con Sequelize pero busca mejor DX y type-safety.

## Decisión
Vamos a usar Prisma 5 como ORM porque ofrece:
- Schema declarativo que genera tipos TypeScript automáticamente
- Migraciones integradas
- Prisma Studio para debugging visual

## Alternativas evaluadas

### Sequelize 6
- **Pros**: Maduro, conocido por el equipo
- **Contras**: Tipado TypeScript débil, API verbose

### TypeORM
- **Pros**: Decorators familiares, soporta Active Record y Data Mapper
- **Contras**: Mantenimiento irregular, bugs históricos con TypeScript

## Consecuencias

### Positivas
- Type-safety completo: queries tipados a partir del schema
- Un solo archivo (schema.prisma) como fuente de verdad

### Negativas
- Curva de aprendizaje para el equipo
- No soporta todas las features de SQL avanzado (CTEs limitados)

### Riesgos
- Vendor lock-in al schema format de Prisma
```

### Naming y ubicación

```
docs/decisions/
├── ADR-001-prisma-como-orm.md
├── ADR-002-jwt-para-autenticacion.md
├── ADR-003-github-actions-para-ci.md
└── ADR-004-docker-para-deploy.md
```

---

## Parte 2 — CHANGELOG

### Formato (basado en Keep a Changelog)

```markdown
# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Endpoint POST /api/users para crear usuarios
- Validación de email con class-validator

### Changed
- Migrar de Sequelize a Prisma como ORM

### Fixed
- Error 500 al intentar login con email inexistente

## [1.1.0] - 2024-01-15

### Added
- Autenticación JWT con refresh tokens
- Rate limiting en endpoints de auth
- Middleware de logging con timestamps

### Changed
- Actualizar Express de 4.18 a 4.19

### Security
- Migrar de MD5 a bcrypt para hashing de passwords

## [1.0.0] - 2024-01-01

### Added
- Setup inicial del proyecto con Express + TypeScript
- CRUD de usuarios
- Conexión a MySQL con Prisma
- Docker Compose para desarrollo local
```

### Categorías permitidas

| Categoría | Cuándo usar |
|-----------|------------|
| `Added` | Nueva funcionalidad |
| `Changed` | Cambio en funcionalidad existente |
| `Deprecated` | Feature que será removida en el futuro |
| `Removed` | Feature removida |
| `Fixed` | Corrección de bug |
| `Security` | Corrección de vulnerabilidad |

### Reglas para CHANGELOG

1. **Cada versión tiene su sección**. Orden cronológico inverso (más reciente arriba).
2. **`[Unreleased]`** al tope con cambios que aún no se liberaron.
3. **Formato de fecha**: `YYYY-MM-DD` (ISO 8601).
4. **Escrito para humanos**, no para máquinas. Lenguaje claro.
5. **Una entrada por cambio significativo**. No listar cada commit.

---

## Parte 3 — README.md

### Template para proyecto

```markdown
# Nombre del Proyecto

Descripción breve (1-2 oraciones) de qué hace el proyecto.

## Tech Stack

- **Frontend**: Angular 17 / React 18
- **Backend**: Express 4
- **Base de datos**: MySQL 8 / PostgreSQL 16
- **ORM**: Prisma 5
- **Auth**: JWT
- **Deploy**: Docker + Railway

## Requisitos previos

- Node.js 20+
- npm 10+
- MySQL 8+ (o Docker)

## Instalación

\`\`\`bash
# Clonar el repo
git clone https://github.com/usuario/proyecto.git
cd proyecto

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar en desarrollo
npm run dev
\`\`\`

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de la DB | `mysql://user:pass@localhost:3306/mydb` |
| `JWT_SECRET` | Secret para firmar tokens | `tu-secret-seguro-aqui` |
| `PORT` | Puerto del servidor | `3000` |

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia en modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Inicia en modo producción |
| `npm test` | Corre tests unitarios |
| `npm run lint` | Corre ESLint |

## Estructura del proyecto

\`\`\`
src/
├── handlers/        ← HTTP layer
├── controllers/     ← Business logic
├── helpers/         ← Data access
├── middlewares/     ← Auth, errors, logging
├── routes/          ← Route definitions
├── types/           ← TypeScript interfaces
└── utils/           ← Pure utility functions
\`\`\`

## API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/register` | Registro | No |
| GET | `/api/users` | Listar usuarios | Sí |
| GET | `/api/users/:id` | Obtener usuario | Sí |

## Licencia

MIT
```

---

## Parte 4 — TSDoc / JSDoc

### TSDoc en TypeScript

```typescript
/**
 * Crea un nuevo usuario en la base de datos.
 *
 * Valida que el email no esté duplicado antes de crear.
 * El password se hashea con bcrypt antes de guardar.
 *
 * @param input - Datos del usuario a crear
 * @returns El usuario creado (sin password)
 * @throws {@link AppError} Con status 409 si el email ya existe
 *
 * @example
 * ```typescript
 * const user = await controller.create({
 *     name: 'Nico',
 *     email: 'nico@example.com',
 *     password: 'securepass123',
 * });
 * ```
 */
public async create(input: CreateUserRequest): Promise<UserResponse> {
    // ...
}
```

### Qué documentar con TSDoc

| Documentar | No documentar |
|-----------|--------------|
| Funciones públicas de services/controllers | Getters/setters obvios |
| Interfaces de API (DTOs, request/response) | Implementaciones internas triviales |
| Funciones utilitarias reutilizables | Código que se explica solo por su nombre |
| Comportamiento no obvio | Cada línea de código |
| Excepciones que puede lanzar | |
| Efectos secundarios | |

### Comentarios de código

```typescript
// BIEN: explica el POR QUÉ
// Usamos un delay de 100ms porque el screen reader necesita
// detectar el cambio en el DOM antes de anunciar el nuevo contenido
setTimeout(() => { liveRegion.textContent = message; }, 100);

// MAL: explica el QUÉ (ya se ve en el código)
// Incrementar el contador en 1
counter++;

// BIEN: documenta una decisión no obvia
// bcrypt salt rounds = 12: balance entre seguridad y performance
// (10 = ~100ms, 12 = ~300ms, 14 = ~1s por hash)
const SALT_ROUNDS = 12;
```

---

## Reglas obligatorias

1. **README siempre actualizado** con instalación, scripts y variables de entorno.
2. **CHANGELOG actualizado** con cada release o cambio significativo.
3. **ADR para decisiones arquitectónicas** (ORM, framework, auth, deploy, etc.).
4. **TSDoc en funciones públicas** de services y controllers.
5. **Comentarios explican POR QUÉ**, no QUÉ.
6. **No documentar lo obvio**. Si el nombre de la función es suficiente, no agregar JSDoc.
7. **Formato consistente**. Keep a Changelog para CHANGELOG, template estándar para ADRs.
8. **`.env.example`** siempre presente y actualizado (sin valores reales).
9. **Política LTS N/N-1**: toda decisión/versionado técnico debe incluir referencia LTS; si no cumple, usar mensaje estándar de legacy fallback.
10. **Trazabilidad híbrida**: cuando aplique, entregar salida legible + estructurada portable con IDs consistentes (planner/tareas/ADR).
11. **Supuestos explícitos**: si hay huecos de información, registrar sección `Supuestos` y qué falta validar.

## Checklist

- [ ] README con instalación, scripts, variables de entorno y estructura
- [ ] CHANGELOG con formato Keep a Changelog
- [ ] ADRs para decisiones arquitectónicas importantes
- [ ] TSDoc en funciones públicas no triviales
- [ ] `.env.example` actualizado
- [ ] Comentarios explican el "por qué", no el "qué"
- [ ] Documentación revisada después de cada cambio significativo
- [ ] Engram tiene resumen/observaciones relevantes antes de push
- [ ] Referencia LTS `N`/`N-1` incluida (o fallback legacy estándar)
- [ ] IDs de trazabilidad consistentes entre formato legible y estructurado
