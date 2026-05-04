# forensic-audit-saas — CLAUDE.md

> **Note for Claude:** The developer on this project is a Python developer. Explain TypeScript/Next.js concepts using Python analogies wherever helpful.

---

## Project Overview

A SaaS platform for forensic auditing. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Supabase (auth + database), and shadcn/ui.

---

## Project Structure

```
forensic-audit-saas/
├── src/
│   ├── app/                   # Next.js App Router — think of each folder as a Flask Blueprint
│   │   ├── layout.tsx         # Root layout — like a Flask app factory / base Jinja2 template
│   │   ├── page.tsx           # "/" route — equivalent to @app.route("/")
│   │   └── dashboard/
│   │       └── page.tsx       # "/dashboard" route
│   ├── components/
│   │   └── ui/                # shadcn/ui primitives — pre-built React components
│   ├── lib/
│   │   ├── engine/            # Core business logic — like a Python `services/` or `utils/` package
│   │   │   └── github.ts      # GitHub API fetcher
│   │   ├── supabase/          # Supabase client factories
│   │   │   ├── client.ts      # Browser-side client (like a module-level singleton)
│   │   │   └── server.ts      # Server-side client (uses cookies — Next.js server context)
│   │   └── utils.ts           # General helpers (cn = classnames utility)
│   └── middleware.ts           # Runs before every request — like Flask @app.before_request
├── .env.local                 # Environment variables — equivalent to .env loaded by python-dotenv
├── components.json            # shadcn/ui config
└── CLAUDE.md                  # This file
```

---

## TypeScript ↔ Python Analogies

| TypeScript / Next.js concept | Python equivalent |
|---|---|
| `interface Repo { id: number }` | `@dataclass` or `TypedDict` |
| `async function fetchRepos(): Promise<Repo[]>` | `async def fetch_repos() -> list[Repo]` |
| `'use client'` directive | marks a module as running in the browser (no server context) |
| Server Component (default) | runs like a normal Python script — no JS shipped to client |
| Client Component (`'use client'`) | code that runs in the browser — like a Flask template with inline JS |
| `export default function Page()` | the main entry-point function of a module |
| `props: { username: string }` | function argument with type hint `username: str` |
| `Record<string, string>` | `dict[str, str]` |
| `T \| null` | `Optional[T]` |
| `Array<T>` / `T[]` | `list[T]` |
| `Promise<T>` | `Coroutine[T]` / `asyncio` awaitable |
| `?.` optional chaining | `getattr(obj, "field", None)` |
| `??` nullish coalescing | `value or default` |
| `enum` | `Enum` from `enum` module |
| `zod` schema validation | `pydantic` model |
| `next/navigation useRouter` | Flask `redirect()` / `url_for()` |
| Supabase `supabase.from("table").select()` | SQLAlchemy `session.query(Table).all()` |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values.

```
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
GITHUB_USERNAME=                 # GitHub username to display repos for
```

`NEXT_PUBLIC_` prefix = variable is exposed to the browser (like Flask's `app.config` vs a secret).

---

## Key Patterns

### Supabase Auth (server-side)
`src/lib/supabase/server.ts` creates a cookie-based Supabase client. Use it inside Server Components and Route Handlers — never in `'use client'` files.

### Supabase Auth (client-side)
`src/lib/supabase/client.ts` exports a singleton browser client. Use inside Client Components.

### GitHub Engine
`src/lib/engine/github.ts` — a pure async function. No React, no Next.js — just fetch + types. Think of it as a Python `services/github_service.py`.

### Styling
Tailwind CSS v4 utility classes. shadcn/ui components live in `src/components/ui/` and can be customised freely.
