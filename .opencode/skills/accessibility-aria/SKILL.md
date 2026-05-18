---
name: accessibility-aria
description: "Skill para accesibilidad web — WCAG 2.2 (compatible 2.1 AA), roles ARIA, formularios, navegación por teclado, screen readers."
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill: Accesibilidad Web (WCAG + ARIA)

Skill para implementar accesibilidad en aplicaciones web.
Basado en WCAG 2.2 con compatibilidad explícita con WCAG 2.1 nivel AA. Aplica a Angular, React y HTML/CSS general.

---

## Paso 0 — Verificar contexto

| Aspecto | Qué verificar |
|---------|---------------|
| Framework | Angular, React, HTML puro |
| Component library | Angular Material, MUI, Headless UI |
| Formularios | Reactive Forms, React Hook Form, HTML nativo |
| Navegación | Router (SPA), páginas estáticas |
| Target WCAG | A, AA (recomendado), AAA |

**Angular Material y MUI incluyen ARIA por defecto — verificar que no se está rompiendo.**

## Regla global de versionado (LTS)

- Si la versión mayor actual es N, usar N-1 como LTS de referencia estable.
- Si una API o patrón nuevo no aplica por versión, usar alternativa compatible legacy e informar exactamente: "No está la versión LTS requerida para aplicar este patrón nuevo; implemento alternativa compatible legacy".
- Si falta contexto crítico (versión, framework, alcance, constraints), hacer todas las preguntas necesarias antes de ejecutar o recomendar cambios.

## Priorización de hallazgos (severidad)

| Severidad | Criterio | SLA sugerido |
|-----------|----------|--------------|
| **Bloqueante** | Impide tarea crítica (login, checkout, submit) o incumplimiento legal directo AA | Hotfix / release inmediata |
| **Alta** | Bloquea flujo principal para parte de usuarios (teclado o SR) sin workaround razonable | Próximo sprint |
| **Media** | Afecta comprensión/eficiencia, con workaround posible | 1-2 sprints |
| **Baja** | Mejora incremental de UX accesible, no bloqueante | Backlog priorizado |

Regla de uso: siempre reportar severidad + impacto + evidencia reproducible (pasos, pantalla, lector, browser).

---

## Parte 1 — Principios WCAG (POUR)

| Principio | Significado | Ejemplos |
|-----------|------------|---------|
| **Perceivable** | La info debe ser presentable en formas que el usuario pueda percibir | Alt text, contraste, captions |
| **Operable** | La UI debe ser operable | Teclado, tiempo suficiente, sin seizures |
| **Understandable** | La info y la UI deben ser comprensibles | Lenguaje claro, errores descriptivos |
| **Robust** | El contenido debe ser interpretable por tecnologías asistivas | HTML semántico, ARIA correcta |

---

## Parte 2 — HTML semántico (la base)

```html
<!-- BIEN: HTML semántico → accesibilidad gratis -->
<header>
    <nav aria-label="Navegación principal">
        <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/about">Acerca de</a></li>
        </ul>
    </nav>
</header>

<main>
    <h1>Título de la página</h1>
    <section aria-labelledby="users-heading">
        <h2 id="users-heading">Usuarios</h2>
        <article>...</article>
    </section>
</main>

<aside aria-label="Barra lateral">
    ...
</aside>

<footer>
    <p>&copy; 2024 Mi App</p>
</footer>

<!-- MAL: divs para todo → 0 semántica, 0 accesibilidad -->
<div class="header">
    <div class="nav">
        <div class="link" onclick="navigate('/')">Inicio</div>
    </div>
</div>
```

### Landmarks ARIA

| Elemento HTML | Rol ARIA implícito | Cuándo agregar `aria-label` |
|--------------|-------------------|---------------------------|
| `<header>` | `banner` | Si hay más de uno |
| `<nav>` | `navigation` | Siempre (describir qué navega) |
| `<main>` | `main` | No necesita |
| `<aside>` | `complementary` | Siempre |
| `<footer>` | `contentinfo` | Si hay más de uno |
| `<section>` | `region` | Si tiene `aria-labelledby` o `aria-label` |
| `<form>` | `form` | Si tiene `aria-label` o `aria-labelledby` |

### Regla: no ARIA innecesaria

- Si HTML semántico resuelve el caso, no agregar ARIA extra.
- Evitar redundancias como `role="button"` en `<button>` o `role="navigation"` en `<nav>`.
- ARIA se usa para cerrar gaps semánticos reales, no para "decorar" componentes.

---

## Parte 3 — Formularios accesibles

### Labels asociados

```html
<!-- BIEN: label asociado con for/id -->
<label for="user-email">Email</label>
<input id="user-email" type="email" name="email" required
       aria-describedby="email-hint email-error">
<span id="email-hint" class="hint">Usá tu email institucional</span>
<span id="email-error" class="error" role="alert" aria-live="assertive">
    <!-- Se llena dinámicamente cuando hay error -->
</span>

<!-- MAL: input sin label →screen reader no sabe qué es -->
<input type="email" placeholder="Email">
<!-- placeholder NO es sustituto de label -->
```

### Angular Reactive Forms

```typescript
// component.ts
@Component({
    template: `
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field">
                <label for="name">Nombre</label>
                <input id="name" formControlName="name"
                       [attr.aria-invalid]="form.get('name')?.invalid && form.get('name')?.touched"
                       [attr.aria-describedby]="form.get('name')?.errors ? 'name-error' : null">
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                    <span id="name-error" role="alert" class="error">
                        El nombre es obligatorio
                    </span>
                }
            </div>

            <button type="submit" [disabled]="form.invalid"
                    [attr.aria-disabled]="form.invalid">
                Guardar
            </button>
        </form>
    `
})
export class UserFormComponent {
    public form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
    });

    public constructor(private readonly fb: FormBuilder) {}
}
```

### React Forms

```tsx
function LoginForm(): JSX.Element {
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');

    return (
        <form onSubmit={handleSubmit} aria-label="Formulario de login">
            <div>
                <label htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'email-error' : undefined}
                    required
                />
                {error && (
                    <span id="email-error" role="alert">
                        {error}
                    </span>
                )}
            </div>

            <button type="submit">Iniciar sesión</button>
        </form>
    );
}
```

### Estrategia de errores de formulario (campo + resumen + foco)

Patrón mínimo obligatorio:

1. Mostrar error por campo junto al input (`aria-describedby`, `aria-invalid`).
2. Mostrar resumen de errores al inicio del formulario cuando falla submit.
3. Mover foco al resumen y luego al primer campo inválido si el usuario confirma navegación.

```html
<div id="form-error-summary" role="alert" aria-live="assertive" tabindex="-1">
    Revisá los campos marcados antes de continuar.
</div>
```

---

## Parte 4 — Navegación por teclado

### Focus management

```typescript
// Angular: mover foco después de una acción
@ViewChild('notification') notificationRef!: ElementRef;

public onSave(): void {
    this.saveData();
    // Mover foco al mensaje de confirmación
    this.notificationRef.nativeElement.focus();
}
```

```tsx
// React: mover foco
const headingRef = useRef<HTMLHeadingElement>(null);

useEffect(() => {
    // Después de navegar, mover foco al título de la página
    headingRef.current?.focus();
}, []);

return <h1 ref={headingRef} tabIndex={-1}>Nueva página</h1>;
// tabIndex={-1} permite foco programático pero no con Tab
```

### Patrón SPA accesible (cambio de ruta)

- En cada navegación SPA: actualizar `document.title` con el contexto de página.
- Mover foco al `h1` de la vista (preferido) o al `main` con `tabIndex="-1"`.
- Mantener skip link funcional también después de cambio de ruta.

### Checklist para modal/dialog

- Abrir modal: foco inicial en título (`h2`) o primer control interactivo.
- Mientras está abierto: trap de foco con `Tab`/`Shift+Tab` dentro del modal.
- `Escape` cierra siempre, salvo excepción funcional explícita documentada.
- Al cerrar: devolver foco al trigger que abrió el modal.
- No permitir interacción/foco con contenido de fondo mientras el modal está activo.

### Orden de tab correcto

```html
<!-- tabIndex values -->
<!-- tabIndex="0": incluir en orden natural de Tab -->
<!-- tabIndex="-1": focusable programáticamente, no con Tab -->
<!-- tabIndex > 0: evitar; solo usar por excepción justificada y con plan de remoción/migración -->

<!-- Skip link (primer elemento de la página) -->
<a href="#main-content" class="skip-link">
    Saltar al contenido principal
</a>

<nav>...</nav>

<main id="main-content" tabindex="-1">
    <!-- Contenido principal -->
</main>
```

```css
/* Skip link: visible solo con foco */
.skip-link {
    position: absolute;
    left: -9999px;
    top: auto;
}

.skip-link:focus {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    padding: 1rem;
    background: #000;
    color: #fff;
}
```

### Keyboard patterns para componentes custom

| Componente | Teclas esperadas |
|-----------|-----------------|
| Botón | Enter, Space → activar |
| Link | Enter → navegar |
| Modal | Escape → cerrar, Tab trap |
| Menú | Arrow keys → navegar, Escape → cerrar |
| Tabs | Arrow keys → cambiar tab, Tab → salir del grupo |
| Accordion | Enter/Space → abrir/cerrar |
| Combobox | Arrow keys → navegar, Enter → seleccionar |

Guía mínima para componentes custom complejos:

- `tablist/tabs`: usar roving tabindex, `aria-selected`, `aria-controls` y relación `id` ↔ `tabpanel`.
- `menu`: foco en primer item al abrir, flechas para navegar items, `Home/End` opcional recomendado.
- `combobox`: distinguir input vs lista emergente, exponer estado expandido y opción activa (`aria-activedescendant` cuando aplique).

---

## Parte 5 — Live regions (notificaciones)

```html
<!-- aria-live anuncia cambios al screen reader -->

<!-- Notificaciones importantes (interrumpe lo que esté leyendo) -->
<div role="alert" aria-live="assertive">
    Error: el formulario tiene campos inválidos
</div>

<!-- Notificaciones informativas (espera a que termine de leer) -->
<div aria-live="polite">
    3 resultados encontrados
</div>

<!-- Status bar -->
<div role="status" aria-live="polite">
    Guardando...
</div>
```

```typescript
// Angular: servicio para notificaciones accesibles
@Injectable({ providedIn: 'root' })
export class AriaNotificationService {
    private readonly liveRegion: HTMLElement;

    public constructor() {
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.classList.add('sr-only'); // Visually hidden
        document.body.appendChild(this.liveRegion);
    }

    public announce(message: string): void {
        this.liveRegion.textContent = '';
        // Timeout para que el screen reader detecte el cambio
        setTimeout(() => {
            this.liveRegion.textContent = message;
        }, 100);
    }
}
```

---

## Parte 6 — Imágenes y media

```html
<!-- Imagen informativa: alt descriptivo -->
<img src="chart.png" alt="Gráfico de ventas: 50% incremento en Q4 2024">

<!-- Imagen decorativa: alt vacío (screen reader la ignora) -->
<img src="decorative-line.png" alt="">

<!-- Ícono con significado -->
<button aria-label="Eliminar usuario">
    <svg aria-hidden="true"><!-- ícono de basura --></svg>
</button>

<!-- Video con subtítulos -->
<video controls>
    <source src="video.mp4" type="video/mp4">
    <track kind="captions" src="captions.vtt" srclang="es" label="Español" default>
</video>
```

---

## Parte 7 — Contraste y color

```
Requisitos WCAG AA:
- Texto normal (< 18px): ratio mínimo 4.5:1
- Texto grande (>= 18px bold o >= 24px): ratio mínimo 3:1
- Componentes UI y gráficos: ratio mínimo 3:1

Herramientas:
- Chrome DevTools → Accessibility panel
- axe DevTools extension
- Lighthouse accessibility audit

Validación obligatoria sobre diseño real:
- Medir contraste contra tokens/paleta del proyecto (no contra colores "de ejemplo").
- Verificar estados `default`, `hover`, `focus`, `disabled`, `error` y variantes de tema habilitadas en producto.
```

```css
/* No depender SOLO del color para transmitir información */
/* MAL: solo color rojo para error */
.error { color: red; }

/* BIEN: color + ícono + texto */
.error {
    color: #d32f2f;
    border-left: 3px solid #d32f2f;
}
.error::before {
    content: "⚠ ";  /* Indicador visual además del color */
}
```

---

## Parte 8 — QA/CI y entorno

### Testing mínimo de accesibilidad (QA/CI)

- Ejecutar auditoría automática en CI con axe, Lighthouse o equivalente.
- Umbral sugerido de gate: Lighthouse Accessibility >= 90 y 0 violaciones críticas en axe.
- Complementar con smoke manual en teclado + screen reader en al menos un flujo crítico.

### Matriz dev vs prod (reducción de falsos positivos)

| Entorno | Objetivo | Criterio de decisión |
|---------|----------|----------------------|
| **Dev** | Detección temprana y feedback rápido | Permitir warnings; no bloquear por issues bajos/medios aislados |
| **CI pre-merge** | Control de regresiones | Bloquear por bloqueantes/altos o caída del umbral definido |
| **Prod (post-release)** | Priorización real por impacto de usuario | Triaging por severidad + tráfico + criticidad del flujo |

Regla: en producción, priorizar primero lo bloqueante/alto en journeys críticos; en dev, enfocarse en prevenir deuda nueva.

---

## Reglas obligatorias

1. **HTML semántico primero**. ARIA es el complemento, no el reemplazo.
2. **No ARIA innecesaria** cuando el HTML nativo ya cubre semántica/comportamiento.
3. **Toda imagen informativa tiene `alt`**. Decorativas: `alt=""`.
4. **Todo input tiene `<label>` asociado**. `placeholder` NO es label.
5. **Errores de formulario por campo + resumen + foco al primer error**.
6. **Navegable 100% con teclado**. Sin trampas de foco fuera de modales.
7. **Skip link** como primer elemento de la página.
8. **Contraste mínimo 4.5:1** para texto normal (WCAG AA), validado sobre tokens/paleta real.
9. **No depender solo del color** para transmitir información.
10. **`aria-live` para contenido dinámico** (notificaciones, loading, resultados).
11. **SPA accesible**: actualizar `title` + foco a `h1/main` en cada cambio de ruta.
12. **Modal/dialog accesible**: trap de foco, `Escape`, retorno al trigger.
13. **Testing mínimo en QA/CI** con umbral y criterio por severidad.

## Checklist

- [ ] HTML semántico (header, nav, main, section, article, footer)
- [ ] Landmarks con `aria-label` descriptivos
- [ ] Inputs con labels asociados (`for`/`id`)
- [ ] Sin ARIA redundante/innecesaria sobre elementos semánticos
- [ ] Errores de formulario por campo + resumen + foco al primer inválido
- [ ] Skip link implementado
- [ ] Focus management en navegación SPA (`title` + foco a `h1/main`)
- [ ] Modales con focus trap + Escape + retorno al trigger
- [ ] Contraste >= 4.5:1 verificado contra tokens/paleta real
- [ ] Imágenes con alt text apropiado
- [ ] Navegación por teclado completa en componentes nativos y custom (tabs/menu/combobox)
- [ ] Live regions para contenido dinámico
- [ ] QA/CI con Lighthouse/axe (o equivalente) y umbral definido
- [ ] Hallazgos priorizados por severidad (bloqueante/alto/medio/bajo) y entorno (dev/prod)

## Cierre operativo documental

- Registrar en Engram lo implementado/recomendado.
- Si surge un patrón reusable/general, documentarlo versionado solo si corresponde.
- Antes de push, verificar que Engram tenga resumen/observaciones relevantes y completar faltantes.
