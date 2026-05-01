# Playbook — Quedar exactamente como en esta sesión

_Última actualización: 2026-05-01_

## 1) Cómo llegar a la sesión (contexto y trazabilidad)

### Archivos clave de esta sesión
- Registro detallado de la sesión:
  - `knowledge/sessions/opencode-session-2026-05-01.md`
- Resumen diario operativo:
  - `knowledge/daily/2026-05-01.md`

### Commit principal de cierre
- Commit: `bd15869`
- Mensaje: `feat: cerrar branding final y robustecer manejo de errores`

### Qué incluye ese estado
- Logo final integrado en header + favicon:
  - `public/gaucho-logo-final.png`
  - `app/page.tsx`
  - `app/layout.tsx`
- Robustez de errores en submit/API:
  - `components/encriollo/unified-form.tsx`
  - `components/encriollo/unified-result.tsx`
  - `app/api/encriollo/route.ts`
  - `lib/i18n/dictionary.ts`

---

## 2) Clonar/actualizar repo y dejarlo en este estado

```bash
git clone git@github.com:NicoGarcia12/en-criollo.git
cd en-criollo
git checkout main
git pull
```

Si querés verificar que estás en el commit de referencia:

```bash
git log --oneline -n 10
```

Buscá `bd15869` en la lista.

---

## 3) ¿Instalar con npm o pnpm?

### Respuesta corta
- **Usar `pnpm`**.

### Por qué
- Este proyecto ya está normalizado para `pnpm`.
- Hay lockfile de pnpm (`pnpm-lock.yaml`).
- En sesiones previas se removió `package-lock.json` para evitar conflictos de resolución.

### Instalación y ejecución

```bash
pnpm install
pnpm dev
```

Quality gate recomendado:

```bash
pnpm lint
pnpm typecheck
```

---

## 4) Cómo sincronizar agentes y skills otra vez

Este repo guarda skills en:
- `.opencode/skills/`

Skills disponibles hoy:
- `react-development`
- `tailwind-css`
- `testing-e2e`
- `typescript-strict`

### Recomendación práctica de sincronización
1. Confirmá que existe `.opencode/skills/` y sus `SKILL.md`.
2. Si trabajás en otra máquina, traé siempre `main` actualizado.
3. Si tenés un repo “hub” de agentes (por ej. `agentes-ia`), copiá cambios reutilizables desde acá hacia ese hub (y viceversa) manteniendo versiones alineadas.
4. Si OpenCode no “ve” un skill nuevo, reiniciá sesión/IDE para refrescar el inventario de skills.

### Checklist rápido
- [ ] `git pull` en `en-criollo`
- [ ] verificar `.opencode/skills/*/SKILL.md`
- [ ] validar que el orchestrator liste los skills esperados
- [ ] correr un prompt corto por skill para smoke test

---

## 5) Configurar Vercel como está ahora

### Estado actual conocido
- Proyecto que funciona en producción:
  - `v0-encriollo-ai-assistant`
- Team:
  - `nicogarcia12s-projects`
- URL producción:
  - `https://v0-encriollo.vercel.app/`

### Enlazar repo local al proyecto correcto

```bash
vercel link
```

Seleccionar:
- Scope/team: `nicogarcia12s-projects`
- Project: `v0-encriollo-ai-assistant`

Esto actualiza `.vercel/project.json` con el proyecto correcto.

### Variables de entorno
En Vercel, configurar al menos:
- `GROQ_API_KEY`

Si no está, la API `/api/encriollo` puede fallar en runtime.

### Deploy

```bash
vercel
vercel --prod
```

---

## 6) Problemas comunes y solución rápida

### “No veo cambios de icono/logo/favicons”
1. Hard refresh (`Ctrl+F5`)
2. Cerrar y abrir pestaña
3. Reiniciar `pnpm dev`
4. Verificar ruta directa del asset (`/gaucho-logo-final.png`)

### “404 en archivo nuevo de /public”
1. Parar dev server
2. Borrar `.next`
3. Levantar de nuevo con `pnpm dev`

### “Errores de API rompen UI”
- Ya se robusteció en:
  - `unified-form.tsx` (network/server/invalid JSON)
  - `unified-result.tsx` (render seguro de texto largo)

---

## 7) Comando mínimo para arrancar igual que hoy

```bash
pnpm install && pnpm dev
```

Y para validar estado:

```bash
pnpm lint && pnpm typecheck
```
