---
name: react-development
description: "Skill para desarrollo React + Next.js + Redux — componentes funcionales, hooks, SSR/SSG, estado global. MODO LEARNING."
---

# Skill: Desarrollo React + Next.js + Redux

Skill para desarrollo frontend con React, Next.js y Redux Toolkit.
**MODO LEARNING**: incluye explicaciones didácticas y comentarios educativos.

---

## Paso 0 — Verificar versiones

| Feature | Versión mínima | Estable desde |
|---------|---------------|---------------|
| Hooks (`useState`, `useEffect`) | React 16.8 | 16.8 |
| Concurrent Mode / Suspense | React 18 | 18.0 |
| Server Components | React 18 + Next.js 13 | Next.js 14 |
| `use()` hook | React 19 | 19.0 |
| `useActionState` | React 19 | 19.0 |
| `useFormStatus` | React 19 | 19.0 |
| App Router | Next.js 13 | 14.0 |
| Server Actions | Next.js 14 | 14.0 |
| RTK Query | Redux Toolkit 1.6 | 2.0 |

**Consultar Context7 antes de usar APIs de versiones recientes.**

Regla LTS para adopción de APIs nuevas: si la mayor actual es `N`, tomar `N-1` como LTS de referencia estable. Adoptar APIs/patrones nuevos cuando estén soportados por la versión del proyecto y por ese baseline LTS; si no, justificar fallback compatible legacy.

---

## Parte 1 — React Core

### Componentes funcionales (única forma aceptada)

```tsx
// Props tipadas con interface
interface UserCardProps {
    name: string;
    email: string;
    onSelect: (email: string) => void;
}

// Componente funcional con desestructuración de props
export function UserCard({ name, email, onSelect }: UserCardProps): JSX.Element {
    return (
        <div className="card">
            <h3>{name}</h3>
            <p>{email}</p>
            <button onClick={() => onSelect(email)}>Seleccionar</button>
        </div>
    );
}
```

### Hooks fundamentales

```tsx
import { useState, useEffect, useMemo, useCallback } from 'react';

export function UserList(): JSX.Element {
    // useState: estado local del componente
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<string>('');

    // useEffect: efectos secundarios (fetch, suscripciones, DOM)
    useEffect(() => {
        const controller = new AbortController();

        async function fetchUsers(): Promise<void> {
            try {
                const response = await fetch('/api/users', { signal: controller.signal });
                const data: User[] = await response.json();
                setUsers(data);
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();

        // Cleanup: se ejecuta al desmontar o antes de re-ejecutar
        return () => controller.abort();
    }, []); // [] = solo al montar

    // useMemo: valor calculado, se recalcula solo cuando cambian las dependencias
    const filteredUsers = useMemo(
        () => users.filter((u: User) => u.name.includes(filter)),
        [users, filter]
    );

    // useCallback: función estable, no se recrea en cada render
    const handleSelect = useCallback((id: number) => {
        console.log('Selected:', id);
    }, []);

    if (loading) return <p>Cargando...</p>;

    return (
        <div>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} />
            {filteredUsers.map((user: User) => (
                <UserCard key={user.id} {...user} onSelect={() => handleSelect(user.id)} />
            ))}
        </div>
    );
}
```

### Custom hooks

```tsx
// Hook reutilizable para fetch de datos
function useFetch<T>(url: string): { data: T | null; loading: boolean; error: string | null } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchData(): Promise<void> {
            try {
                setLoading(true);
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: T = await res.json();
                setData(json);
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        return () => controller.abort();
    }, [url]);

    return { data, loading, error };
}
```

---

## Parte 2 — Next.js (App Router preferido)

Si el proyecto está en Pages Router, mantener compatibilidad y no forzar migración a App Router salvo pedido explícito.

### Estructura de carpetas

```
app/
├── layout.tsx              ← Layout raíz (Server Component)
├── page.tsx                ← Página principal (/)
├── loading.tsx             ← UI de loading (Suspense boundary)
├── error.tsx               ← UI de error ('use client')
├── not-found.tsx           ← Página 404
├── globals.css
├── users/
│   ├── page.tsx            ← /users (Server Component)
│   ├── [id]/
│   │   └── page.tsx        ← /users/:id
│   └── loading.tsx
└── api/
    └── users/
        └── route.ts        ← API route /api/users
```

### Server Components (por defecto)

```tsx
// app/users/page.tsx — Server Component (NO 'use client')
// Se ejecuta en el servidor, puede hacer fetch directo
interface User {
    id: number;
    name: string;
    email: string;
}

export default async function UsersPage(): Promise<JSX.Element> {
    // Fetch en el servidor — no necesita useEffect
    const res = await fetch('https://api.example.com/users', {
        next: { revalidate: 60 } // ISR: revalida cada 60 segundos
    });
    const users: User[] = await res.json();

    return (
        <div>
            <h1>Usuarios</h1>
            {users.map((user: User) => (
                <div key={user.id}>{user.name}</div>
            ))}
        </div>
    );
}
```

### Client Components (cuando se necesitan hooks/eventos)

```tsx
'use client'; // Obligatorio para usar hooks, eventos, browser APIs

import { useState } from 'react';

export function SearchBar(): JSX.Element {
    const [query, setQuery] = useState<string>('');

    return (
        <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
        />
    );
}
```

### Server Actions

```tsx
// app/actions.ts
'use server';

export async function createUser(formData: FormData): Promise<void> {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    // Validar y guardar en DB
    await db.user.create({ data: { name, email } });
}

// app/users/new/page.tsx
import { createUser } from '../actions';

export default function NewUserPage(): JSX.Element {
    return (
        <form action={createUser}>
            <input name="name" required />
            <input name="email" type="email" required />
            <button type="submit">Crear</button>
        </form>
    );
}
```

---

## Parte 3 — Redux Toolkit

### Setup del store

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { userReducer } from './userSlice';

export const store = configureStore({
    reducer: {
        users: userReducer,
    },
});

// Tipos inferidos del store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks tipados — usar ESTOS en vez de useSelector/useDispatch
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Crear un slice

```typescript
// store/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User { id: number; name: string; email: string; }

interface UserState {
    items: User[];
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    items: [],
    loading: false,
    error: null,
};

// Async thunk para fetch
export const fetchUsers = createAsyncThunk<User[]>(
    'users/fetchAll',
    async () => {
        const res = await fetch('/api/users');
        return res.json();
    }
);

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        addUser: (state, action: PayloadAction<User>) => {
            state.items.push(action.payload); // Immer permite "mutación"
        },
        removeUser: (state, action: PayloadAction<number>) => {
            state.items = state.items.filter((u: User) => u.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => { state.loading = true; })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Error';
            });
    },
});

export const { addUser, removeUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
```

---

## Reglas obligatorias

1. **Nunca usar class components**. Solo funcionales.
2. **Evitar `any`**. Si aparece un caso excepcional, justificarlo en contexto y dejar plan de remoción.
3. **Siempre cleanup en useEffect**. Retornar función de limpieza.
4. **`useMemo`/`useCallback` solo con beneficio real** de performance.
5. **Server Components por defecto** en Next.js — `'use client'` solo si se necesitan hooks/eventos/browser APIs.
6. **Hooks tipados del store** (`useAppSelector`, `useAppDispatch`) en vez de los genéricos.
7. **Nunca mutar estado directamente** fuera de slices (Immer solo funciona dentro de reducers).
8. **Compatibilidad por router**: App Router preferido; en proyectos Pages Router no migrar sin pedido explícito.
9. **Compatibilidad por versión + LTS**: si no está disponible la versión/LTS requerida para un patrón nuevo, implementar alternativa legacy y explicitar el motivo.

## Checklist

- [ ] Componentes funcionales con TypeScript estricto
- [ ] useEffect con cleanup y dependencias correctas
- [ ] Props tipadas con interfaces
- [ ] Next.js: Server Components por defecto
- [ ] Redux: hooks tipados, slices con PayloadAction tipado
- [ ] Se evita `any`; si hay excepciones, están justificadas y con plan de remoción
