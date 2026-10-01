# Backend API

Express 5 + TypeScript API. Run PostgreSQL first, then `npm ci`, `npm run migrate`, `npm run seed`, `npm run dev`. The API defaults to port 4000.

Use `npm run typecheck` and `npm run build`. See `../docs/api.md` for routes and response contracts. Student passwords are bcrypt-hashed and sessions use signed HttpOnly cookies. Development-only `DEV_USER_ID` access must not be exposed publicly.
