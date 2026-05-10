import { Database } from 'bun:sqlite';
import { mkdirSync, existsSync } from 'node:fs';

const DATA_DIR = './data';
const DB_PATH = `${DATA_DIR}/backups.db`;
const PORT = Number(process.env.BACKUP_PORT ?? 5174);
const ALLOWED_ORIGINS = (process.env.BACKUP_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',');
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;
const RECENT_LIMIT = 50;

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    count INTEGER NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS snapshots_created_at_idx ON snapshots(created_at DESC);
`);

const insert = db.prepare(
  'INSERT INTO snapshots (created_at, count, payload) VALUES (?, ?, ?) RETURNING id, created_at, count'
);
const listRecent = db.prepare(
  `SELECT id, created_at, count FROM snapshots ORDER BY created_at DESC LIMIT ${RECENT_LIMIT}`
);
const fetchOne = db.prepare(
  'SELECT id, created_at, count, payload FROM snapshots WHERE id = ?'
);

const corsHeaders = (origin: string | null) => {
  const ok = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0]!,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  } as Record<string, string>;
};

const json = (data: unknown, init: ResponseInit & { origin?: string | null } = {}) => {
  const { origin, headers, ...rest } = init;
  return new Response(JSON.stringify(data), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin ?? null),
      ...(headers as Record<string, string> | undefined),
    },
  });
};

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  routes: {
    '/api/health': {
      GET: (req) => json({ ok: true }, { origin: req.headers.get('origin') }),
      OPTIONS: (req) => new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) }),
    },
    '/api/snapshots': {
      GET: (req) => {
        const rows = listRecent.all() as Array<{ id: number; created_at: number; count: number }>;
        return json(
          rows.map(r => ({ id: r.id, createdAt: r.created_at, count: r.count })),
          { origin: req.headers.get('origin') }
        );
      },
      POST: async (req) => {
        const origin = req.headers.get('origin');
        const len = Number(req.headers.get('content-length') ?? 0);
        if (len > MAX_PAYLOAD_BYTES) {
          return json({ error: 'payload too large' }, { status: 413, origin });
        }
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return json({ error: 'invalid JSON' }, { status: 400, origin });
        }
        const entries = (body as { entries?: unknown })?.entries;
        if (!Array.isArray(entries)) {
          return json({ error: 'entries must be an array' }, { status: 400, origin });
        }
        const payload = JSON.stringify(entries);
        if (payload.length > MAX_PAYLOAD_BYTES) {
          return json({ error: 'payload too large' }, { status: 413, origin });
        }
        const row = insert.get(Date.now(), entries.length, payload) as {
          id: number;
          created_at: number;
          count: number;
        };
        return json({ id: row.id, createdAt: row.created_at, count: row.count }, { status: 201, origin });
      },
      OPTIONS: (req) => new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) }),
    },
    '/api/snapshots/:id': {
      GET: (req) => {
        const origin = req.headers.get('origin');
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          return json({ error: 'invalid id' }, { status: 400, origin });
        }
        const row = fetchOne.get(id) as
          | { id: number; created_at: number; count: number; payload: string }
          | null;
        if (!row) return json({ error: 'not found' }, { status: 404, origin });
        let entries: unknown[] = [];
        try {
          entries = JSON.parse(row.payload);
        } catch {
          return json({ error: 'corrupt payload' }, { status: 500, origin });
        }
        return json(
          { id: row.id, createdAt: row.created_at, count: row.count, entries },
          { origin }
        );
      },
      OPTIONS: (req) => new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) }),
    },
  },
  fetch(req) {
    return json({ error: 'not found' }, { status: 404, origin: req.headers.get('origin') });
  },
});

console.log(`backup server listening on http://${server.hostname}:${server.port}`);
console.log(`db: ${DB_PATH}`);
console.log(`allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
