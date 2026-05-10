# How to use Needs & Values

A personal reflection tool that bridges the gap between core beliefs (Values) and the day-to-day environmental requirements that let those beliefs actually live (Needs). Local-first: the browser's `localStorage` (key `values-mapper-v2`) is the source of truth. An optional Bun + SQLite sidecar (see *Backup*) writes periodic snapshots to disk for safekeeping — no account, no telemetry.

## The loop

Every entry is one row in this loop:

> **Value → Friction → Need → Workability**

- **Value** — the belief, virtue, or commitment you care about (e.g. *Compassion*, *Curiosity*, *Health*).
- **Friction** — what's currently in the way of living that value.
- **Need** — the non-negotiable environmental or internal requirement that, if met, would let the value thrive.
- **Workability** — how well your current life is actually serving that value, on a 1–5 ACT-Bullseye scale.

The aim is not to enumerate values; it's to find where you're starving and name the smallest condition that would feed you.

## Adding values

Three ways:

1. **Library** — click the file-input icon (top-right), open the **Library** tab, click chips from the five categories your care sheet defines. Already-imported values are grayed and struck through.
2. **Paste** — same modal, **Paste** tab, one value per line. Imports dedupe against existing entries.
3. **Manual `+`** — bottom of the list adds a blank row.

The first time you load the app, five seeded rows appear with rich pre-fills (Compassion, Curiosity, Health, Inner Harmony, Peace). Subsequent loads respect whatever you've put in.

## The lens workflow

Every row exposes the same six-step pipeline. You can run it inline (per-row drawer) or in **Focus mode** (full-screen wizard). Click `+ Apply Lenses` on a row to open the inline panel, or click `Focus →` (or any chip in Matrix view) to open the wizard. A small 6-segment **completeness bar** beside the lens toggle shows `2/6` / `3/6` etc., turning emerald when all six steps are filled.

| Step | Lens | Question | What it asks for |
| ---- | ---- | -------- | ---------------- |
| 1 | **Diagnose** — [ACT Workability](https://contextualconsulting.co.uk/knowledge/therapy-approaches/workability-in-act/) | How stuck is this value right now? | A 1–5 dot rating |
| 2 | **Locate** — [NVC Universal Needs](https://baynvc.org/basics-of-nonviolent-communication/) | What's starving underneath the friction? | One or more chip selections from 7 categories |
| 3 | **Anchor** — Madanes [6 Core Human Needs](https://madanesinstitute.com/the-6-human-needs/) | Which fundamental driver does this serve? | One of: Comfort, Variety, Significance, Connection, Growth, Contribution |
| 4 | **Reframe** — [Stanford Life Design](https://cgoe.stanford.edu/news-perspectives/2020/life-design) | Where does this live in your engagement/energy? Which kind of problem is it? What's the prototype? | Two 1–5 dot-strings (Engagement, Energy), problem type (Open / Stuck / Reality), reframe note (Stuck) or acceptance note (Reality), prototype mode (Talk / Do) + action (Open or Stuck-with-reframe) |
| 5 | **Contextualize** — [Nagoski (Come As You Are)](https://www.lovehealgrow.com/sexual-desire-brakes-and-accelerators/) + optional [Sander T. Jones (Cultivating Connection)](https://sandertjones.com/media) | What conditions accelerate or brake this? Is another person involved? | Two short notes (Accelerators / Brakes); plus an optional `Interpersonal Friction` toggle that gates a short relational check |
| 6 | **Synthesize** | Compose all of the above into a single Need sentence. | One click — `Replace` overwrites your Need, `Append` adds to it |

The synthesis is deterministic (templated, not LLM-generated). It reads like:

> Reliable access to *empathy, connection, and contribution*, so *compassion* can show up in everyday life. This serves my deeper need for *contribution*. Iterating via: *weekly volunteer hours.*

You can always edit the resulting Need text directly.

### Derived indicators (no input needed)

Underneath the Robbins step, two read-only footnotes appear:

- **SDT profile** — Self-Determination Theory (Deci & Ryan): `autonomy ●○○ · competence ●●○ · relatedness ●●●`. Computed from your NVC tags and selected core need. Tells you which of the three innate psychological needs your value is touching.
- **Maslow highest active layer** — Maslow's Hierarchy: `physiological / safety / belonging / esteem / self-actualization`. The highest layer reached by your NVC selections. A quick check that you're not piling everything onto self-actualization while ignoring shelter or belonging.
- **Jones · freedoms at stake** *(only when the relational lens is active)* — Sander T. Jones's 13 Fundamental Freedoms (Bandwidth Allocation, Informed Consent, Privacy, Self-Determination, Authentic Expression, Boundaries, Pacing, Embodiment, Truth-Telling, Care for Self, Time / Space, Reciprocity, Restoration). Computed from your NVC selections; surfaces which relational rights are in play.

### Interpersonal Friction (optional)

At the bottom of step 5 there's a small `[ ] Interpersonal Friction` checkbox. **Most entries are solo reflections**, so it stays off by default and the rest of this lens stays out of your way. Tick it whenever another person is part of the friction — it runs a short check on whether the Need you're drafting is a *clean boundary* or has slipped into being an *overreaching rule*.

When active, two questions appear:

1. **Source** — pick one of three:
   - **Inherent Right Violated** → assert an external boundary (you don't need their agreement).
   - **Agreement Violated** → renegotiate or repair a prior agreement together.
   - **Neither / Painful Emotion** → internal work; no one else has to change.
2. **Boundary checklist** — does the Need (a) limit your *own* behavior, (b) honor a value rather than prevent your fear, (c) read as a request with room for "no", (d) preserve their autonomy?

A live status next to the checklist reads `clean boundary` (emerald) when all four are ticked, or `overreaching · 2/4` (red) the moment any are unticked. The synthesizer (step 6) appends a single **Accountability** clause to your Need draft — naming the source you chose, plus, if any checklist items failed, the specific reframings the Need still needs.

The whole section is `print:hidden`; the print summary instead emits a one-line `Relational source: … · boundary 3/4 (overreaching)` so reflections still land cleanly on paper.

## The three views

- **List** (default) — all entries stacked, each editable in place with its own lens panel.
- **Matrix** — a true 2-axis Alignment Matrix. Rows are the 6 Core Human Needs; columns are the 5 ACT Workability bands (1 stuck → 5 working). Cells are tinted faintly by workability and contain values as clickable chips. Click any chip to open that value in **Focus mode**. Two trays beneath the grid catch edge cases: *"Workability not yet rated"* and *"Core Need not yet assigned"*.
- **Focus** — a full-viewport wizard for one value at a time. Six steps mirror the lens taxonomy: *Diagnose* (Workability + Friction), *Locate* (NVC), *Anchor* (Robbins, with descriptions visible as cards), *Reframe* (Stanford — Wayfinding, problem type, reframe/acceptance, Talk/Do prototype), *Contextualize* (Nagoski accelerators/brakes), *Synthesize* (templated draft on the left, your editable Need on the right). Keyboard: `Esc` closes, `←/→` navigate (when not typing in a field). Click any progress segment to jump.

## Printing / exporting

The Printer icon triggers the browser print dialog. The interactive controls are hidden in print; what remains is a clean editorial layout with each row's value, friction, need, NVC tags, and a small text summary of the lens data (workability, core need, Stanford problem type / reframe / acceptance / prototype, accelerators, brakes, and — when the relational lens is active — the interpersonal source and boundary checklist score). Useful for journaling exports or PDF saves.

## Tips

- Treat workability and Need as separate questions. Even values you score 5/5 on still benefit from articulating the Need — that's how you protect what's already working.
- The synthesis is meant as a *draft*. Editing it after it lands is the point; the lenses are scaffolding, not a verdict.
- "Unmapped" entries in the Matrix view are values without a Core Need set. Use the Matrix `Map →` to assign one in two clicks, or open the Robbins lens row in List view.
- Duplicates are detected case-insensitively. Library chips for already-added values gray out; pasted duplicates are dropped silently with a count in the modal footer.
- If a Need feels like it's about *someone else's* behavior, tick **Interpersonal Friction** in step 5. If the boundary checklist comes back red (`overreaching · 2/4`), the Need is currently a rule for them, not a boundary for you — a signal to redraft.

## Frameworks reference

The lenses already in the app:

- **NVC Universal Needs** — Marshall Rosenberg, *Nonviolent Communication* (2003). The chip vocabulary names what's starving underneath surface complaints. Categories used here: Connection, Physical, Honesty, Play, Peace, Autonomy, Meaning.
- **ACT Workability / Bullseye** — Acceptance and Commitment Therapy (Steven Hayes et al.). The 1–5 dot is a compressed Bullseye — how on-target your current behavior is with respect to the named value.
- **Robbins 6 Core Human Needs** — Tony Robbins / Chloe Madanes. Six fundamental drivers (Comfort, Variety, Significance, Connection, Growth, Contribution). The argument: every behavior, including dysfunctional ones, serves at least one of these.
- **Stanford Life Design** — Bill Burnett & Dave Evans, *Designing Your Life* (2016). The Reframe lens implements three of the book's central tools, gated by problem type. **Wayfinding / Good Time Journal** (Ch. 3) — rate Engagement (flow intensity) and Energy (gain vs. drain) on 1–5 hairline scales; Energy < 3 is flagged as a drain. **Problem Framing** (Ch. 1) — choose one of: *Open* (a real problem you can prototype against), *Stuck* (sticky and recurring — needs a reframe before it can be prototyped), *Reality* (a fact of life to accept and navigate around, not solve). The UI reacts: *Reality* hides the prototype and reveals a serif-italic acceptance note ("How will I navigate around it?"); *Stuck* shows the reframe field first and locks the prototype until "How might I…" has been written; *Open* shows the prototype directly. **Prototyping** (Ch. 6) — name a *Life Design Prototype* and tag its mode as either *Talk* (gather data through a story — a Life Design Interview with someone who has already lived this) or *Do* (gather data through an experience — try it for a day). Placeholders rotate to match: *"Who has already lived this? Note who you'll interview."* for Talk, or *"How can you try this for a day? Note your smallest experiment."* for Do.
- **Nagoski Accelerators / Brakes** — Emily Nagoski, *Come As You Are* (2015). Originally a sexual-response model; we use it generically: name the contexts that turn a value on (accelerators) and the ones that shut it down (brakes).
- **Sander T. Jones · Cultivating Connection** *(optional, gated)* — a relational accountability lens hidden by default behind an `Interpersonal Friction` checkbox at the bottom of step 5. When active, it asks two things. First, the **Personal Responsibility Loop**: classify the source as *Inherent Right Violated* (assert an external boundary), *Agreement Violated* (collaborative repair), or *Neither / Painful Emotion* (internal work). Second, the **4-question Boundary Checklist**: does the need (1) limit my own behavior, (2) honor the value rather than prevent fear, (3) frame as a request not a demand, (4) preserve their autonomy? All four ticked → flagged as a *clean boundary*; otherwise → *overreaching rule*. The synthesis appends an *Accountability* clause naming both the source and any failed checks.
- **Self-Determination Theory** *(derived)* — Deci & Ryan. Three innate needs: autonomy, competence, relatedness. Computed from your NVC tags as a balance check.
- **Maslow's Hierarchy** *(derived)* — Abraham Maslow (1943). Five layers from physiological to self-actualization. Computed from your NVC tags as a "highest active layer" indicator.

Frameworks deliberately not in the app (worth knowing, but redundant or too heavy for the editorial surface):

- **Schwartz's Theory of Basic Values** — 10 universal value types across cultures. Academically rigorous; overlaps Robbins.
- **VIA Character Strengths** — 24 strengths across 6 virtues. Useful as a discovery tool but its taxonomy duplicates Robbins for our purposes.
- **Ikigai** — what you love / are good at / world needs / can be paid for. Better suited to vocational design than daily-needs surfacing.
- **Polyvagal Theory** — physiological state as context. Nagoski accelerators/brakes already covers the practical surface.
- **Logotherapy / "Will to Meaning"** — Viktor Frankl. Captured implicitly via the Robbins *Significance* and *Contribution* drivers.

## Backup (optional Bun + SQLite sidecar)

The browser's `localStorage` can be wiped by clearing site data, switching browsers, or running incognito. To guard against that, the repo ships a tiny backup server using `Bun.serve()` + `bun:sqlite`.

**Run it:**

```sh
bun run server   # listens on http://localhost:5174
```

The DB lives at `data/backups.db` (gitignored). Schema is one table — `snapshots(id, created_at, count, payload)` — where `payload` is the full `Mapping[]` JSON. No migrations: every snapshot is a complete tree, so old snapshots stay readable forever.

**In the app:**

- A subtle **Backup** chip in the header shows the most recent snapshot ("Last backup: 3m ago") or `Backup offline` if the server isn't running. Clicking it forces a snapshot now.
- Auto-backup runs **debounced 5s after edits stop** when the server is reachable. If the server is down, the app keeps working — only the safety net is missing.
- Click the chip to open a tiny **Restore** menu listing recent snapshots. Picking one replaces your current entries (after a confirm).

**Endpoints:**

- `POST /api/snapshots` — body `{ entries: Mapping[] }` → `{ id, createdAt, count }`
- `GET /api/snapshots` → list `[{ id, createdAt, count }]` (most recent 50)
- `GET /api/snapshots/:id` → `{ id, createdAt, count, entries }`

The server is intentionally local-only — bind on `127.0.0.1`, no auth, no users. If you want to host it remotely, add auth before doing so.

## Data & migration

- Storage key: `values-mapper-v2`. Format: `Mapping[]` (see [src/App.tsx](src/App.tsx)).
- Seed flag: `values-mapper-seed-v1`. Set to `'1'` after the first-run seed runs once. Delete both keys to re-seed.
- Schema additions are additive — old entries continue to load with `undefined` for new optional fields. The migration in `migrateMapping()` handles both legacy `designConstraint`/`designNote` (folded into `lifeDesign`) and legacy enum values (`'actionable'/'anchor'/'gravity'` → `'open'/'stuck'/'reality'`, `prototype.type 'interview'/'experience'` → `prototype.mode 'talk'/'do'`).
