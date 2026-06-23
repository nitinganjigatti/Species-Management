# Species Management — Roadmap (single source of truth)

_Last updated: 2026-06-23. When we feel lost, we open THIS file._

## Operating rules
1. **One flow at a time, closed end-to-end** (scope → design → build → verify → commit) before starting the next. No jumping.
2. This doc is the **anchor** — every flow, its status, its locked scope. Nothing lives only in chat.
3. Inside each flow, break into small confirmable sub-steps.
4. Constraints (unchanged): **frontend-only**, all data from **`Dump20260622.sql`** → static JSON; **on-system** (antz components, theme tokens, MUI Typography, `mdi:` icons); commit only when asked.

## The flows (we only work the top unfinished one)

| # | Flow | Status | Notes |
|---|------|--------|-------|
| 1 | **Dashboard** (all-species overview, the keystone) | **v1 BUILT (uncommitted)** | Direction A "Vital Signs". **v2 candidates (logged 2026-06-24):** Category mix · CITES mix · Population-size bands (critically-few signal) · Husbandry coverage gauges (microchipped/ringed/sexed — data being prepped by background agent → `dashboard-extras.json`) · Site/Cluster distribution · over-capacity + vaccination-due alerts · reverse-analytics. |
| 2 | **Listing / Collection** ("Species List") | **v1 BUILT (uncommitted)** | Table style kept. Built: incoming URL filters (facets + alert via dashboard.json ids) · visible removable chips + Clear all · posture strip (filtered-set stats + single-sex/critically-few) · management column order + readiness chip (sex cols dropped) · option counts. **Deferred:** Site/Cluster filter (no site field in list.json), top-bar quick facets, gallery toggle, husbandry stats (bg agent). |
| 3 | **Detail gaps** | **DONE (uncommitted)** | 3-band shell (Stats → Notifications/Alerts → Tabs) + decluttered alerts band; mortality month-drill + carcass + **deaths gender/age (real)**; vaccination estimator; **Pharmacy (real, 100 species)**; physical sub-types (already rendered). **Lab/Surgery/Anaesthesia: NO data in dump — built as empty states, user will supply data later.** Data via `scripts/build-medical-extras.js` (adds pharmacy + deaths.byGender/ageAtDeath to detail files). |
| 4 | **Cross-species analytics** (reverse) | not started | "which species died Dec–Jan", "which lost weight last week → wrong food vs disease", disease trends, predictive. Grows out of the dashboard's "needs-attention" layer. |
| 5 | **Combination playground** | not started | freeform stacked filters ("cannibalism + multiple sites + pedigree → show"). Evolution of the listing's filters. |
| 6 | **Relationships** (NOT a full family-tree module) | not started, **not blocked** | Lightweight relationships for *some* animals/species on **synthetic/dummy data** (egg-style deterministic generator; enclosures may hold multiple bloodlines). Payoff = filtering/segmentation. Labelled demo data; swap real sire/dam later. Also includes the **enclosure-wise spatial view** (site→enclosure→species/animals). |

## Drill contract (decided)
- **Composition items** (IUCN, taxonomy class, breeding split, category) → **species listing, pre-filtered** to that segment (chip shown).
- **Alert items** (overdue assessment, ±10% weight, etc.) → **(a) filtered species listing** of the species containing flagged animals (count badge), then drill into a species to see the animals. Keeps one drill path: dashboard → listing → species → animal.
- This means the **listing must accept an incoming filter** (URL/state) — the contract between Flow 1 and Flow 2.

## Flow 1 — Dashboard: version split
**Concept:** answers "state of the whole collection?" + "what needs attention?" and **routes** every number into a pre-filtered listing. It never *becomes* the detail.

**Three stacked layers:**
- **Layer 1 — Headline KPIs** (collection at a glance)
- **Layer 2 — Needs Attention** (alert rollups; the answer-first command center)
- **Layer 3 — Explore** (a few key compositions = entry filters)

**v1 (build now, lean):** ~6 headline KPIs · alert rollups we already compute (assessment alerts + over-capacity + deaths-spike) · 4 compositions (IUCN, taxonomy-by-class, breeding splits, births/deaths trend) · everything clickable → (pre-)filtered listing.

**Deferred to v2/v3 (same flow):** exhaustive per-parameter panels (medical/eggs/lab/pharmacy rollups), reverse-analytics query widgets, predictive.

**Data:** extractor pre-aggregates one `public/species-data/dashboard.json` from the same dump; each aggregate carries its filter key for routing.

## Reminders / ledger
- **Dashboard v1 built (uncommitted).** REMINDER: add v2 alerts (over-capacity — needs enclosure-capacity data; vaccination-due — needs estimator) and wire the Species List to READ the incoming URL filters (`Conservation`/`Class`/`Readiness`/`alert`) — that's Flow 2.
- After Dashboard ships: **remind user to add the other notifications/alerts** (deaths spike, vaccination due, etc.) beyond assessment alerts.
- Vitals-band treatment mockups live in `.superpowers/brainstorm/` (A = lead metric + chips, B = domain cards, C = gauges) — revisit in Flow 3.
- Everything still **uncommitted**; commit when the user asks.
