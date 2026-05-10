# luminosity · Needs & Values

A local-first, editorial reflection tool for mapping `Value → Friction → Need → Workability` across the values you care about. Built around five established frameworks (NVC, ACT, Robbins, Stanford Life Design, Nagoski) with a deterministic synthesis step that drafts your Need sentence from your selections.

End-user docs live in [HOWTO.md](HOWTO.md). This file is for working on the codebase.

---

## Stack

- **Runtime / package manager**: [Bun](https://bun.com) (the `vite` dev server and `bun:sqlite` backup sidecar both run under Bun).
- **Bundler**: Vite 8.
- **Frontend**: React 19 + TypeScript (strict, with `DOM` and `DOM.Iterable` libs enabled).
- **Styling**: Tailwind v4 via PostCSS — CSS-first config in [src/style.css](src/style.css) using `@source` declarations. **No `tailwind.config.js`** — see [CLAUDE.md](CLAUDE.md).
- **Persistence**: browser `localStorage` (primary) + optional `bun:sqlite` sidecar for off-browser snapshots.

---

## Quick start

```sh
bun install
bun run dev          # http://localhost:5173
bun run server       # http://127.0.0.1:5174 (optional backup sidecar)
```

The app is fully functional without the sidecar — `localStorage` is the source of truth. Run `bun run server` in a second terminal if you want timestamped SQLite snapshots written to `data/backups.db`.

| Script             | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `bun run dev`      | Vite dev server with HMR                         |
| `bun run build`    | Production build to `dist/`                      |
| `bun run preview`  | Serve the built bundle                           |
| `bun run server`   | Backup sidecar (`bun --hot server.ts`)           |
| `bunx tsc --noEmit`| Strict typecheck (no emit, used in CI)           |

---

## Project layout

```text
src/
  App.tsx          UI root: header, list/matrix/focus views, lens panel,
                   import modal, BackupChip, print layout. Contains the
                   Mapping interface, all React components, and the
                   localStorage migration path.
  data.ts          Static data: VALUE_LIBRARY, VALUE_DETAILS, NVC_CATEGORIES,
                   NVC_TO_SDT, NVC_TO_MASLOW, CORE_NEEDS, seedPersonalValues().
                   No React, no I/O. Pure data exports.
  derive.ts        Pure functions over a Mapping: lensCompletion(), deriveNeed(),
                   sdtProfile(), maslowHighest(), hasAnyLensData(), formatList().
                   No React, no I/O. Easy to test.
  backup.ts        Typed fetch client for the sidecar (ping, createSnapshot,
                   listSnapshots, fetchSnapshot) + relTime() formatter.
  useBackup.ts     React hook: status pinging, debounced auto-snapshot,
                   restore. Returns BackupState consumed by BackupChip.
  index.tsx        ReactDOM bootstrap.
  style.css        Tailwind v4 entry + @theme tokens.
  env.d.ts         Ambient `*.css` module decl for side-effect imports.

server.ts          Bun.serve sidecar with bun:sqlite. CORS-restricted to
                   the local Vite origin. SQLite file at data/backups.db.
HOWTO.md           End-user guide: the loop, the lens workflow, the views,
                   backup, frameworks reference.
CLAUDE.md          Bun-first conventions for tooling agents.
```

---

## Architecture

### The data model

Everything is one shape:

```ts
// src/App.tsx
export interface Mapping {
  id: string;
  value: string;
  need: string;
  friction: string;

  // Lens fields (all optional, all additive)
  workability?: number;          // 1–5 (ACT Bullseye)
  nvcNeeds?: string[];           // selected NVC universal needs
  coreNeed?: string;             // one of CORE_NEEDS (Robbins)
  lifeDesign?: LifeDesignLens;   // Stanford: wayfinding, problem frame,
                                 //   reframe/acceptance note, prototype
  accelerators?: string;         // Nagoski
  brakes?: string;               // Nagoski
}
```

Persisted as `Mapping[]` under `localStorage` key `values-mapper-v2`. Every entry source (seed, paste, library, manual) creates the same shape with the lens fields starting `undefined`.

**Schema additions are additive.** Don't break existing localStorage; if you must rename or restructure, extend `migrateMapping()` in [src/App.tsx](src/App.tsx) with a new branch. Two migrations are already in there as templates: legacy `designConstraint`/`designNote` → `lifeDesign`, and old enum values (`'actionable' | 'anchor' | 'gravity'` → `'open' | 'stuck' | 'reality'`, `prototype.type` → `prototype.mode`).

### The derive layer

[src/derive.ts](src/derive.ts) is the only place that turns a `Mapping` into something else:

- `lensCompletion(entry)` — returns `{ steps[6], filled, total }` driving the per-row completeness bar and the focus-mode progress bar.
- `deriveNeed(entry)` — deterministic, templated synthesis. Reads `nvcNeeds`, `coreNeed`, `lifeDesign.problemFrame`, `lifeDesign.acceptanceNote`/`reframeNote`, `lifeDesign.prototype`, `accelerators`, `brakes`. Returns the draft Need sentence shown in step 6.
- `sdtProfile(entry)` — derived Self-Determination Theory profile (autonomy/competence/relatedness counts) from NVC tags + core need.
- `maslowHighest(entry)` — derived highest-active Maslow layer from NVC tags.

Pure, no React, no I/O. Add new derived indicators here.

### The backup sidecar

[server.ts](server.ts) is a single-file Bun server using `Bun.serve()` routes:

```http
GET  /api/health           → { ok: true }
POST /api/snapshots        body: { entries }      → { id, createdAt, count }
GET  /api/snapshots        → [{ id, createdAt, count }, …] (most recent 50)
GET  /api/snapshots/:id    → { id, createdAt, count, entries }
```

Schema is one table:

```sql
CREATE TABLE snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  count INTEGER NOT NULL,
  payload TEXT NOT NULL  -- JSON-stringified Mapping[]
);
```

Each snapshot is a complete tree, so old snapshots stay readable through any future schema change. Bound to `127.0.0.1` only; CORS limited to `localhost:5173` and `127.0.0.1:5173`. Override via env: `BACKUP_PORT`, `BACKUP_ALLOWED_ORIGINS`.

Frontend integration is in [src/useBackup.ts](src/useBackup.ts) — pings every 30s, debounced auto-snapshot 5s after entries change, status surfaces in the `BackupChip` in the header.

---

## Cookbook: adding a new lens

The lens scaffolding has six parallel touch points. Follow this checklist when adding e.g. a Maslow input lens or a Schwartz axis:

1. **Schema** ([src/App.tsx](src/App.tsx)): add an optional field to `Mapping`.
2. **Migration** if you're renaming or restructuring an existing field: add a branch to `migrateMapping()`. Skip this if your field is a clean addition.
3. **Vocabulary** ([src/data.ts](src/data.ts)): add any constant arrays/maps the lens needs (chip lists, descriptions, mappings to derived axes).
4. **Derive** ([src/derive.ts](src/derive.ts)):
   - Update `lensCompletion()` if the new lens should count as a step.
   - Update `hasAnyLensData()` to include it.
   - Update `deriveNeed()` if it should affect the synthesized sentence.
5. **List-view UI** ([src/App.tsx](src/App.tsx) `EntrySection`): add a new `<LensRow label="N · Verb · Framework">` block inside the lens panel.
6. **Focus-mode UI** ([src/App.tsx](src/App.tsx) `FocusStep`): add a step branch and corresponding entry in `FOCUS_STEPS` / `FOCUS_PROMPTS`.
7. **Print summary** ([src/App.tsx](src/App.tsx) `EntrySection`'s `print:block` block): emit a summary line when the field is set.
8. **Docs**: update the lens-workflow table in [HOWTO.md](HOWTO.md).

Existing lenses are good models — the **Stanford Life Design** lens (wayfinding + problem framing + reframe/acceptance + Talk/Do prototype) exercises every one of these steps if you want a worked example.

---

## Conventions

- **Bun, not Node.** Default to Bun for everything (test, run, install, http). See [CLAUDE.md](CLAUDE.md) for the full preference list.
- **Editorial UI.** Hairline borders (`border-[0.5px] border-gray-200`), tracking-wide tiny caps for labels (`text-[10px] uppercase tracking-[0.25em]`), serif italic for headings (`font-serif italic`). Avoid generic gray container boxes; prefer left-border grouping. Pink-700 is the secondary-text accent on the cream background; orange is reserved for "Need" semantics; red for genuine warnings; emerald for completion.
- **Tailwind v4.** No `tailwind.config.js`. All theme tokens live in [src/style.css](src/style.css)'s `@theme` block. New scanned paths go in `@source` lines there.
- **Strict TypeScript.** `noUncheckedIndexedAccess` is on, so `arr[0]` is `T | undefined` — handle it.
- **Print discipline.** Interactive controls use `print:hidden`. Each `EntrySection` carries a `hidden print:block` summary that emits all set lens fields as plain text. Before merging UI changes, hit the print preview.
- **No tests yet.** `derive.ts` is the natural starting point — small pure functions with clear inputs and outputs. Use `bun test`.
