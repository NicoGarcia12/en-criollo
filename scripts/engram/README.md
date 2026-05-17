# Scripts Engram (manuales) — agentes-ia

Estos scripts implementan:

- `engram-export-all`: migración final full de `knowledge/` hacia Engram local
- `engram-push`: sync **local -> repo** con prechecks estrictos de git + commit
- `engram-pull`: sync **repo -> local** con prechecks estrictos de git + pull

## Reglas finales aplicadas

- `knowledge/` se migra completo a Engram local.
- No se genera backup.
- Antes de importar se ejecuta `secret-scan`; si aparece un posible secreto, el proceso se bloquea, explica el hallazgo y recomienda revisar/redactar antes de reintentar. En ese caso no se importa ni se sube nada.
- Durante la ejecución real se crean manifest/estado temporal (`.engram-migration-*`) y se eliminan si la migración termina OK.
- Si la migración termina OK, `knowledge/` se elimina del proyecto.
- Siempre hay reporte: en ejecución real se escribe `engram-migration-report.json`; en `--dry-run`/`-DryRun` el reporte se muestra por consola para respetar que dry-run no escribe.
- `engram-push` usa commit asistido en modo interactivo: propone 1 o 2 mensajes, permite escribir otro y pregunta si querés usar inglés. En modo no interactivo usa un mensaje default para no bloquear CI.

## Variables útiles

- `AGENTES_IA_REPO_DIR`: ruta del repo central `agentes-ia`
- `ENGRAM_LOCAL_DIR`: ruta de Engram local (default: `~/.engram`)
- `ENGRAM_PRIMARY_BRANCHES`: ramas candidatas principal (default: `main master`)
- `GH_TOKEN` o `GITHUB_TOKEN`: token opcional para consultas a GitHub API, útil para evitar rate limits o habilitar checks de updates autenticados.

> Nota: `ENGRAM_EXTRA_KNOWLEDGE_DIRS` queda deprecada para `engram-export-all`; la regla final migra `knowledge/` completo, no un subconjunto configurable.

## Uso rápido (Bash)

```bash
chmod +x ./scripts/engram/*.sh
./scripts/engram/setup-engram-env.sh
engram-export-all
engram-push
engram-pull
```

Dry-run sin escrituras ni borrados:

```bash
./scripts/engram/engram-export-all.sh --dry-run
```

## Uso rápido (PowerShell)

```powershell
./scripts/engram/setup-engram-env.ps1
./scripts/engram/engram-export-all.ps1
./scripts/engram/engram-push.ps1
./scripts/engram/engram-pull.ps1
```

Dry-run sin escrituras ni borrados:

```powershell
./scripts/engram/engram-export-all.ps1 -DryRun
```

## Warning de GitHub API 403 en Engram

Si Engram muestra un warning similar a:

```text
GitHub API returned 403 Forbidden
```

no significa que la migración haya fallado. En este flujo, ese warning solo indica que una consulta a GitHub API no pudo autenticarse o quedó limitada por rate limit. El efecto esperado es que Engram no pueda hacer el check remoto de updates o evitar el rate limit de GitHub; la migración local de `knowledge/` a Engram no queda bloqueada por esto.

Para reducir ese warning, configurá un token de GitHub en una variable de entorno. Usá `GH_TOKEN` como nombre preferido; `GITHUB_TOKEN` también suele ser reconocido por herramientas del ecosistema GitHub.

### Windows PowerShell

Variable temporal, solo para la terminal actual:

```powershell
$env:GH_TOKEN = "<tu_token_github>"
engram --version
```

Variable persistente para tu usuario de Windows:

```powershell
[Environment]::SetEnvironmentVariable("GH_TOKEN", "<tu_token_github>", "User")
```

Después de setearla como persistente, cerrá y abrí una terminal nueva antes de volver a correr Engram.

Si preferís usar el nombre alternativo:

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "<tu_token_github>", "User")
```

### Linux/macOS shell

Variable temporal, solo para la sesión actual:

```bash
export GH_TOKEN="<tu_token_github>"
engram --version
```

Variable persistente para tu usuario. Agregá una línea como esta al archivo de perfil de tu shell (`~/.bashrc`, `~/.zshrc` o equivalente):

```bash
export GH_TOKEN="<tu_token_github>"
```

Luego recargá el perfil o abrí una terminal nueva:

```bash
source ~/.bashrc
# o, si usás zsh:
source ~/.zshrc
```

Si preferís usar el nombre alternativo, reemplazá `GH_TOKEN` por `GITHUB_TOKEN`.

### Scopes del token

- Para repos públicos y checks de releases/updates, normalmente alcanza con un token de solo lectura. En tokens fine-grained, limitá el acceso a los repos necesarios y usá permisos de lectura mínimos, por ejemplo `Metadata: read` y, si la herramienta lo requiere, `Contents: read`.
- Para repos privados, otorgá acceso solo a los repos necesarios y mantené permisos de lectura, salvo que tu flujo documentado requiera otra cosa.
- En tokens clásicos, evitá scopes amplios. Usá el mínimo equivalente a lectura de repos públicos/privados según corresponda.

Nunca pegues el token en archivos versionados (`README.md`, scripts, `.env` commiteado, configs del repo, etc.) y nunca lo commitees. Si necesitás documentar el setup, usá placeholders como `<tu_token_github>`.

## Docs oficiales

- Engram repo: https://github.com/gentleman-programming/engram
- Engram README: https://github.com/gentleman-programming/engram/blob/main/README.md
- Engram Agent Setup: https://github.com/gentleman-programming/engram/blob/main/docs/AGENT-SETUP.md
