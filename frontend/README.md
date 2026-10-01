# Frontend

Next.js App Router + TypeScript client. Install with `npm ci`, then `npm run dev`. Open `http://localhost:3000`.

The dashboard uses shared editor, requirements, analysis, research, assignment, and UI components. `/api` is proxied to the Express API. Without API availability, assignments fall back to browser demo state. Username/password sign-in uses an HttpOnly cookie from the backend; Supabase SSO can be added separately.

Checks: `npm run typecheck`, `npm run build`. Tiptap package versions are pinned as one matching release group in the lockfile.
