---
name: testing-jest
description: Skill para escribir y diagnosticar tests unitarios con Jest — Angular, React, Express y más.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill: Testing con Jest

Skill para escribir, ejecutar y diagnosticar tests unitarios con Jest.
Cubre Angular, React, Express y Node.js en general.
Para tests E2E, cargar la skill `testing-e2e`.

---

## Paso 0 — Verificar versiones del proyecto

**ANTES de escribir cualquier test**, leer `package.json` del proyecto y extraer:

| Dependencia | Para qué verificar |
|------------|-------------------|
| `jest` | API disponible (v29 vs v30) |
| `ts-jest` / `@swc/jest` | Transformer configurado |
| `@angular/core` | Signal inputs, standalone, inject() |
| `@angular-builders/jest` | Config builder Angular |
| `@angular/material` | Si el componente usa Material |
| `react` | Versión de React (18 vs 19) |
| `@testing-library/react` | API de testing React |
| `express` | Middleware signature |
| ORM (`prisma`, `sequelize`, `typeorm`) | Mock del client |

---

## Paso 1 — Determinar tipo de test

| Objetivo | Stack | Patrón |
|----------|-------|--------|
| Componente Angular | Angular | TestBed + ComponentFixture |
| Servicio Angular | Angular | TestBed + mock de HttpClient |
| Componente React | React | render + screen (@testing-library/react) |
| Hook React | React | renderHook (@testing-library/react) |
| Handler Express | Express | Supertest o mock de req/res |
| Controller Express | Express | Test directo con mock de helper |
| Helper/Repository | Node.js | Mock de ORM client |

---

## Paso 1.1 — Si es feature nueva: aplicar TDD

Cuando el pedido sea "agregar feature" o "nuevo comportamiento", el orden es:

1. Escribir tests primero (RED).
2. Ejecutar tests y confirmar que fallan por la razon correcta.
3. Recien despues implementar (GREEN).
4. Cerrar con refactor manteniendo verde (REFACTOR).

Checklist rapido TDD:
- [ ] Hay al menos un test de comportamiento nuevo antes del codigo de implementacion.
- [ ] Se vio fallo inicial del test.
- [ ] Se documenta que cambio de RED a GREEN.

---

## Paso 2 — Consultar documentación

**ANTES de escribir el test**, usar los MCPs disponibles:

1. **Context7**: Buscar patterns de testing para la versión específica.
2. **GitHub Grep**: Buscar ejemplos reales de tests similares.
3. **Leer tests existentes del proyecto**: Buscar `*.spec.ts` cercanos para consistencia.

---

## Tests de Angular

### Estructura del archivo spec

```typescript
describe('MiComponente', () => {
    let component: MiComponente;
    let fixture: ComponentFixture<MiComponente>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MiComponente], // standalone
            providers: [
                { provide: MiServicio, useValue: mockMiServicio }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MiComponente);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
```

### Patrones de mock (Angular)

```typescript
// Mock de servicio con Observable
const mockServicio: Pick<MiServicio, 'obtener' | 'guardar'> = {
    obtener: jest.fn().mockReturnValue(of(valorMock)),
    guardar: jest.fn().mockReturnValue(of(void 0))
};

// Mock de ActivatedRoute
const mockRoute = {
    params: of({ id: '123' }),
    snapshot: { paramMap: convertToParamMap({ id: '123' }) }
};

// Testing con Signal inputs (Angular 17.2+)
fixture.componentRef.setInput('nombre', 'valor');
fixture.detectChanges();
```

### Errores comunes Angular

| Error | Causa | Solución |
|-------|-------|----------|
| `NullInjectorError` | Falta provider en TestBed | Agregar mock del servicio |
| `No provider for Router` | Falta provider de routing | Usar `provideRouter([])` |
| `Changed after checked` | `detectChanges()` mal ubicado | Mover al lugar correcto |
| `Timeout` en async | Observable no completa | Verificar que el mock emite y completa |
| `input is required` | Signal input sin valor | Usar `fixture.componentRef.setInput()` |

---

## Tests de React

### Estructura del archivo spec

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MiComponente } from './MiComponente';

describe('MiComponente', () => {
    it('renderiza el título', () => {
        render(<MiComponente title="Hola" />);
        expect(screen.getByText('Hola')).toBeInTheDocument();
    });

    it('llama al callback al hacer click', () => {
        const onClick = jest.fn();
        render(<MiComponente title="Test" onClick={onClick} />);

        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('maneja estado async', async () => {
        render(<MiComponente />);

        await waitFor(() => {
            expect(screen.getByText('Datos cargados')).toBeInTheDocument();
        });
    });
});
```

### Testing de hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useContador } from './useContador';

describe('useContador', () => {
    it('incrementa el contador', () => {
        const { result } = renderHook(() => useContador());

        act(() => {
            result.current.incrementar();
        });

        expect(result.current.count).toBe(1);
    });
});
```

### Errores comunes React

| Error | Causa | Solución |
|-------|-------|----------|
| `act() warning` | State update fuera de act | Envolver en `act()` o usar `waitFor` |
| `not wrapped in act(...)` | Async update no esperado | Usar `waitFor()` de @testing-library |
| `Unable to find element` | Query incorrecta | Verificar role/text/testid |
| `TypeError: X is not a function` | Mock incompleto | Agregar el método faltante al mock |

---

## Tests de Express/Node.js

### Testing de Controllers

```typescript
describe('UserController', () => {
    let controller: UserController;

    interface UserControllerDeps {
        findByEmail: UserHelper['findByEmail'];
        create: UserHelper['create'];
    }

    let mockHelper: jest.Mocked<UserControllerDeps>;

    beforeEach(() => {
        mockHelper = {
            findByEmail: jest.fn(),
            create: jest.fn()
        };
        controller = new UserController(mockHelper);
    });

    it('debería crear un usuario', async () => {
        mockHelper.findByEmail.mockResolvedValue(null);
        mockHelper.create.mockResolvedValue({ id: 1, name: 'Test', email: 'test@mail.com', password: 'hashed' });

        const result = await controller.create({ name: 'Test', email: 'test@mail.com', password: '123456' });

        expect(result).toEqual({ id: 1, name: 'Test', email: 'test@mail.com' });
        expect(result).not.toHaveProperty('password');
    });
});
```

### Testing de Handlers con mocks

```typescript
describe('UserHandler', () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    it('debería responder 400 si faltan campos', async () => {
        const mockReq = { body: { name: 'Test' } } as Request;
        // Cast acotado: el handler en este caso solo usa body/status/json.
        await handler.create(mockReq, mockRes as Response, jest.fn());

        expect(mockRes.status).toHaveBeenCalledWith(400);
    });
});
```

---

## Paso 3 — Ejecutar y verificar

1. **Angular**: `npx jest --testPathPattern=<archivo>` o `npx nx test <proyecto>`
2. **React**: `npx jest --testPathPattern=<archivo>`
3. **Express**: `npx jest --testPathPattern=<archivo>`
4. **Si falla**: Diagnosticar usando las tablas de errores comunes arriba
5. **Si el error no está en las tablas**: Buscar en Context7 o GitHub Grep

## Politicas operativas globales

### Quality gate antes de push/deploy

1. Preguntar si querés correr quality gate antes de push/deploy.
2. Si aceptás: format, lint, tipado (si aplica) y tests.
3. Si rechazás: continuar con una advertencia breve de riesgo.

### LTS N/N-1 y fallback legacy

Para Jest, priorizar APIs compatibles con versiones LTS N/N-1 del proyecto.

Si la API nueva no esta soportada en la version detectada, usar fallback legacy compatible y reportar este mensaje estandar: **"Se aplico fallback legacy por compatibilidad LTS (N/N-1)."**

### Fallback de tooling/MCP

Si tooling o MCPs no estan disponibles, continuar con analisis/checks disponibles y documentar limitaciones explicitamente.

### Ambiguedad critica en diagnostico

Si hay ambiguedad critica de entorno, config o fixtures, hacer todas las preguntas necesarias antes de cerrar el diagnostico.

### Cierre con conocimiento dual

Al cierre, registrar:
- resumen de sesión y aprendizajes en Engram
- documentación reusable/general versionada solo si corresponde

## Checklist antes de hacer PR

- [ ] Todos los tests pasan (`jest --coverage`)
- [ ] Mocks tipados, no `as any` sin justificación
- [ ] Happy path y error paths testeados
- [ ] No hay tests que dependen de estado global mutable
- [ ] No hay `console.log` en tests
- [ ] Si fue feature nueva, se siguio flujo TDD (RED → GREEN → REFACTOR)

## Referencias

Consultar via Context7:
- Jest API
- Angular Testing Guide (versión del proyecto)
- React Testing Library
- `jest-mock-extended`
