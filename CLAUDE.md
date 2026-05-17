
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## Backend APIs (used by the sidecar at `server.ts`)

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile.
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

This repo uses **Vite** as the dev server and bundler (running under Bun). `bun run dev` boots `vite`, `bun run build` produces the production bundle. Don't replace this with Bun's HTML-imports path — the deploy target (Netlify) is wired for Vite output, and we use first-class Vite plugins (`@vitejs/plugin-react`, `@tailwindcss/vite`).

Tailwind v4 is CSS-first: no `tailwind.config.js`. Theme tokens and `@source` declarations live in `src/style.css`. Don't add a PostCSS config — the Tailwind Vite plugin is the only path; Lightning CSS handles vendor prefixing.

The backup sidecar (`server.ts`) is the only place where Bun's server APIs are used directly — see *Backend APIs* above. It's local-only and currently dev-gated in the UI (see [HOWTO.md](HOWTO.md#optional-bun--sqlite-sidecar-development-only)).
