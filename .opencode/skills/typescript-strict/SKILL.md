---
name: typescript-strict
description: Skill para escribir TypeScript estricto, tipado y mantenible en entornos productivos.
allowed-tools: Read, Write, Bash(tsc *)
---

# Skill: TypeScript Estricto

Esta skill define cómo trabajar TypeScript con seguridad de tipos estricta.
Prioriza firmas explícitas, modelos claros y errores detectados en compilación.
Sirve tanto para código nuevo como para migrar JavaScript a TypeScript sin perder trazabilidad.

## Flujo recomendado

1. Leer las reglas obligatorias (sección siguiente).
2. Revisar los patrones de diseño tipado.
3. Aplicar cambios de tipado incremental.
4. Validar con `tsc --noEmit` cuando corresponda.

## Scope por tipo de proyecto

- **Frontend**: tipar UI state, props, forms y consumo de API; validar boundary en fetch/SDK.
- **Backend**: tipar handlers, casos de uso, repositorios y contratos I/O; validar input en borde HTTP/eventos.
- **Shared**: priorizar tipos de contrato reutilizables (DTOs, enums, utilidades puras) sin acoplar framework.

## Regla global de versionado (LTS)

- Si la versión mayor actual es N, usar N-1 como LTS de referencia estable.
- Si una API o patrón nuevo no aplica por versión, usar alternativa compatible legacy e informar exactamente: "No está la versión LTS requerida para aplicar este patrón nuevo; implemento alternativa compatible legacy".

---

## Reglas obligatorias

1. **Evitar `any`** como regla general; permitir excepción justificada con comentario `// REASON: ...` y dejar plan de remoción/migración (`// TODO(ts-migrate): ...`).
2. **Declarar tipos de retorno** en funciones públicas y exportadas.
3. **Evitar `@ts-ignore`** como solución por defecto — si es necesario, usar `@ts-expect-error` con justificación.
4. **Tipar parámetros**, objetos de dominio y contratos de API siempre.
5. **Clases con modificadores de acceso explícitos** (`public`, `private`, `protected`, `readonly`).
6. **Preferir inmutabilidad** (`readonly`, `as const`, `Readonly<T>`) cuando el dato no debe mutar.
7. **Borde externo estricto**: tratar datos externos como `unknown` por defecto y validar/parsear antes del tipo final.
8. **Excepción de borde**: solo si el contrato está totalmente controlado y documentado (misma base, versionado y tests de contrato).
9. **Prohibido cast en cadena** (`as unknown as X`) salvo bloqueo técnico documentado con `// REASON:` y plan de remoción `// TODO(ts-migrate: ID): ...`.
10. **Si falta contexto crítico** (versión, framework, alcance, constraints), hacer todas las preguntas necesarias antes de ejecutar o recomendar cambios.

## Reglas de organización

### Matriz `interface` vs `type`

| Caso | Preferir | Nota breve |
|---|---|---|
| Contrato de objeto extensible (domain/API) | `interface` | Mejor para `extends` y declaration merging |
| Uniones discriminadas | `type` | Sintaxis directa y legible |
| Alias primitivo/tupla/utilidad (`Pick`, `Record`, etc.) | `type` | Composición más clara |
| Contrato público estable de capa | `interface` | Semántica de contrato |

- Alias de dominio con nombres claros y estables (no `IData`, sí `UserProfile`).

---

## Patrones de diseño tipado

### Patrón 1: Contratos primero

- Definir tipos e interfaces **antes** de implementar.
- Usar modelos de entrada y salida separados para APIs (`CreateUserRequest` / `UserResponse`).
- No reutilizar el mismo tipo para request y response.

### Patrón 2: Errores tipados

- Patrón estándar: `Result` + `DomainError`.

```typescript
type DomainErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'UNEXPECTED';

type DomainError = {
    code: DomainErrorCode;
    message: string;
    cause?: unknown;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };
```

- Evitar excepciones opacas cuando puede devolverse un resultado tipado.
- Los errores de dominio no se modelan como `string` sueltos.

### Patrón 3: Abstracciones chicas

- Preferir **funciones puras** sobre clases innecesarias.
- Si se usa clase, mantener API pública pequeña y cohesionada.
- Una clase no debería tener más de 5-7 métodos públicos.

### Patrón 4: Migración incremental (JS → TS)

- Fase 1 (baseline): `allowJs` + `checkJs` selectivo + tipos en bordes.
- Fase 2 (strict core): activar `strict` en módulos críticos y remover `any` no justificados.
- Fase 3 (hardening): cerrar casts temporales, subir cobertura de tipos y tests de contrato.
- Criterio de done breve: `tsc --noEmit` OK, TODOs de migración con owner/ID, sin `as unknown as X` abiertos.

### Patrón 5: Naming por capas

- API: `XRequest`, `XResponse`.
- Transporte interno/externo: `XDto`.
- Persistencia/dominio: `XEntity`.
- UI/view: `XViewModel`.

### Patrón 6: Deuda de tipado rastreable

- Formato obligatorio: `TODO(ts-migrate: ID): descripcion corta`.
- Ejemplo: `// TODO(ts-migrate: TS-142): remover cast temporal en adapter legacy`.

### Patrón 7: Tests de tipos en contratos criticos

```typescript
declare const input: CreateUserRequest;

createUser(input);

// @ts-expect-error: email es obligatorio en contrato publico
createUser({ name: 'Ada' });
```

- Usar `@ts-expect-error` para asegurar que una violacion de contrato efectivamente falle en compilacion.

---

## Utilidades de tipado recomendadas

```typescript
// Hacer todas las propiedades required
type Strict<T> = Required<T>;

// Pick solo lo que necesitás para un mock o DTO parcial
type PartialService = Pick<UserService, 'getById' | 'create'>;

// Record para mapeos tipados
type StatusLabels = Record<'active' | 'inactive' | 'pending', string>;

// Extract para filtrar uniones
type ActiveStatus = Extract<UserStatus, 'active' | 'verified'>;
```

## Perfiles de strictness

- **Baseline**: `strictNullChecks` + `noImplicitAny`; minimo para codigo nuevo y modulos en migracion.
- **Strict**: `strict: true`; perfil por defecto para backend/shared y frontend core.
- **Hardcore**: strict + reglas extras (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`) en dominios criticos.

## Checklist antes de hacer PR

- [ ] `tsc --noEmit` pasa sin errores
- [ ] No hay `any` sin comentario justificativo
- [ ] Funciones públicas tienen tipo de retorno explícito
- [ ] Datos externos (API, localStorage, params) entran como `unknown` y se validan/parsean
- [ ] No hay `as unknown as X` sin excepcion documentada + TODO(ts-migrate: ID)
- [ ] Interfaces y types tienen nombres descriptivos de dominio
- [ ] Contratos criticos tienen al menos un test de tipos (`@ts-expect-error`)

## Cierre operativo documental

- Registrar en Engram lo implementado/recomendado.
- Si surge un patrón reusable/general, documentarlo versionado solo si corresponde.
- Antes de push, verificar que Engram tenga resumen/observaciones relevantes y completar faltantes.
