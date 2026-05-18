---
name: tailwind-css
description: "Skill para implementar Tailwind CSS — utility classes, responsive design, customización, dark mode. MODO LEARNING."
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill: Tailwind CSS

Skill para implementar estilos con Tailwind CSS.
**MODO LEARNING**: incluye explicaciones de las clases y conceptos.

---

## Paso 0 — Verificar versión

| Feature | Versión mínima | Estable desde |
|---------|---------------|---------------|
| JIT mode (por defecto) | 3.0 | 3.0 |
| Arbitrary values `[...]` | 3.0 | 3.0 |
| `@apply` directive | 1.0 | 3.0 |
| Container queries | 3.2 | 3.2 |
| CSS-first config | 4.0 | 4.0 |
| `@theme` directive | 4.0 | 4.0 |

**IMPORTANTE**: Tailwind 4 cambió fundamentalmente la configuración (de `tailwind.config.js` a CSS-first). Verificar versión antes de configurar.

## Regla global de versionado (LTS)

- Si la versión mayor actual es N, usar N-1 como LTS de referencia estable.
- Si una API o patrón nuevo no aplica por versión, usar alternativa compatible legacy e informar exactamente: "No está la versión LTS requerida para aplicar este patrón nuevo; implemento alternativa compatible legacy".
- Si falta contexto crítico (versión, framework, alcance, constraints), hacer todas las preguntas necesarias antes de ejecutar o recomendar cambios.

---

## Instalación

### Con npm (Tailwind 3.x)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configuración básica (v3)

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // recomendado para control explicito del proyecto
    content: [
        "./src/**/*.{html,ts,tsx,jsx,astro}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                secondary: '#64748b',
            },
        },
    },
    plugins: [],
};
```

### CSS base

```css
/* styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Clases fundamentales

### Layout

```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">
    <div>Izquierda</div>
    <div>Derecha</div>
</div>

<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div>Card 1</div>
    <div>Card 2</div>
    <div>Card 3</div>
</div>

<!-- Container centrado -->
<div class="container mx-auto px-4">
    Contenido centrado con padding
</div>
```

### Espaciado (spacing scale: 1 unit = 0.25rem = 4px)

```html
<!-- Padding -->
<div class="p-4">          <!-- padding: 1rem (16px) en todos los lados -->
<div class="px-6 py-2">    <!-- padding horizontal 1.5rem, vertical 0.5rem -->
<div class="pt-8">         <!-- padding-top: 2rem -->

<!-- Margin -->
<div class="m-4">          <!-- margin: 1rem en todos los lados -->
<div class="mt-auto">      <!-- margin-top: auto (empujar al fondo) -->
<div class="space-y-4">    <!-- gap vertical entre hijos directos -->
```

### Tipografía

```html
<h1 class="text-3xl font-bold text-gray-900">Título</h1>
<p class="text-base text-gray-600 leading-relaxed">Párrafo</p>
<span class="text-sm font-medium text-blue-600">Enlace</span>
<p class="truncate">Texto que se corta con elipsis...</p>
```

### Responsive (mobile-first)

```html
<!-- Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Ocultar en mobile, mostrar en desktop -->
<nav class="hidden md:block">Navegación desktop</nav>

<!-- Breakpoints: sm(640px) md(768px) lg(1024px) xl(1280px) 2xl(1536px) -->
```

### Dark mode

```html
<!-- Clase dark: (requiere darkMode: 'class' y clase dark en el root) -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <h1 class="text-black dark:text-white">Título</h1>
</div>
```

- Si `darkMode: 'class'`, las clases `dark:*` solo aplican cuando existe la clase `dark` en el root (`html` o contenedor raíz).
- Si `darkMode: 'media'`, las clases `dark:*` aplican por preferencia del sistema operativo/navegador.
- Recomendación del proyecto: usar `darkMode: 'class'` para control explícito y evitar activaciones accidentales.

---

## Patrones de componentes

### Card

```html
<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
    <h3 class="text-lg font-semibold text-gray-900">Título</h3>
    <p class="mt-2 text-sm text-gray-600">Descripción del card.</p>
    <button class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Acción
    </button>
</div>
```

### Form

```html
<form class="space-y-4">
    <div>
        <label class="block text-sm font-medium text-gray-700" for="email">Email</label>
        <input
            id="email"
            type="email"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
    </div>
    <button
        type="submit"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        Enviar
    </button>
</form>
```

### Navbar responsive

```html
<nav class="bg-white shadow">
    <div class="container mx-auto flex items-center justify-between px-4 py-3">
        <a href="/" class="text-xl font-bold">Logo</a>
        <div class="hidden md:flex items-center gap-6">
            <a href="/about" class="text-gray-600 hover:text-gray-900">Acerca</a>
            <a href="/contact" class="text-gray-600 hover:text-gray-900">Contacto</a>
        </div>
        <!-- Botón hamburguesa (mobile) -->
        <button class="md:hidden">Menu</button>
    </div>
</nav>
```

---

## Extracting components con @apply

Cuando las clases se repiten mucho, extraer a una clase CSS:

```css
/* Solo usar @apply cuando realmente hay repetición significativa */
@layer components {
    .btn-primary {
        @apply rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors;
    }

    .input-field {
        @apply block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
    }
}
```

---

## Reglas obligatorias

1. **TW1 - Mobile-first**: Diseñar para mobile y agregar breakpoints para pantallas más grandes.
2. **TW2 - Utility-first**: Preferir clases utility inline; usar `@apply` solo con repetición significativa.
3. **TW3 - `@apply` con salida**: Si `@apply` se usa por transición/migración, justificar y documentar plan de remoción/migración.
4. **TW4 - Spacing scale**: Evitar valores arbitrarios como `p-[13px]` si existe `p-3`; aceptar excepción justificada cuando diseño/sistema lo requiera.
5. **TW5 - `content` completo**: Incluir todos los archivos que usen clases Tailwind.
6. **TW6 - Motion consistente**: Agregar `transition-*` cuando se usa `hover:`/`focus:` para evitar cambios bruscos.
7. **TW7 - Regla Tailwind + Bootstrap (nivel app)**: No mezclar Tailwind y Bootstrap en la misma app por defecto. Excepción solo para migración explícita pedida por el usuario y con plan de salida documentado.
8. **TW8 - SCSS + Tailwind permitido**: Se permite combinar SCSS con Tailwind para evitar repetición (tokens, utilidades y wrappers), manteniendo excepciones al mínimo y justificadas.
9. **TW9 - Dark mode por defecto y seguro**: Incluir soporte dark por defecto; usar tokens/paleta del tema propio como fuente de verdad; permitir `dark:*` cuando aporte; evitar colores hardcodeados fuera de paleta.
10. **TW10 - Políticas globales vigentes**: Mantener regla LTS, preguntas críticas cuando falte contexto y cierre operativo documental al finalizar.

## Checklist

- [ ] `content` en config incluye todos los archivos relevantes
- [ ] Responsive: funciona en mobile, tablet y desktop
- [ ] Dark mode configurado con estrategia explícita (`class` recomendado) y sin activación accidental
- [ ] Tokens/paleta del tema propio usados como fuente de verdad (sin hardcodear colores fuera de paleta)
- [ ] No hay clases arbitrarias innecesarias
- [ ] `@apply` solo para clases genuinamente repetidas
- [ ] No se mezcla Tailwind + Bootstrap en la misma app (salvo migración explícita con plan de salida)

## Cierre operativo documental

- Registrar en Engram lo implementado/recomendado.
- Si surge un patrón reusable/general, documentarlo versionado solo si corresponde.
- Antes de push, verificar que Engram tenga resumen/observaciones relevantes y completar faltantes.
