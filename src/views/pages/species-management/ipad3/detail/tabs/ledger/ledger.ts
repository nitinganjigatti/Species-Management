// iPad 3 Ledger tab — data derivation (2026-09-03).
// The species inventory ledger: opening stock + everything IN − everything OUT = closing
// stock (the ZIMS-style census reconciliation), gender-wise across the five classes
// M / F / UD / ID / G. The species sidecars carry no per-animal event history, so events
// derive DETERMINISTICALLY from the real animal list (lab.ts precedent, 2026-09-02):
// real fields (accessionType / accessionDate / birthDate / gender / site) beat synthesis,
// hashes fill only the gaps, and everything is stable across renders and tabs.
// TIME BUCKETS follow the 2026-09-03 time-axis standard (Ledger = the reference
// implementation): preset ≤ 12 months → chronological months; whole-multi-year presets
// (2Y/3Y/All) → the cumulative Jan–Dec seasonal view, drill sheets grouped by year.
// TRANSFERS (2026-09-04): the sidecars carry no movement history, so site→site moves
// synthesize deterministically (~8% of individual animals) as ONE raw neutral 'transfer'
// event (fromSite → toSite, delta 0). resolveEvents() re-reads that event per site scope:
// org-wide it stays neutral (net-zero — lists hide it); crossing INTO a selected scope it
// becomes transfer_in (+1), OUT of it transfer_out (−1); internal to a multi-site
// selection it stays neutral (list-only, never counted).

import type { AnimalRecord } from 'src/types/species-management/detail'

/* ── vocabulary ──────────────────────────────────────────────────────────── */

export type LedgerClass = 'male' | 'female' | 'undetermined' | 'indetermined' | 'group'
export const LEDGER_CLASSES: LedgerClass[] = ['male', 'female', 'undetermined', 'indetermined', 'group']
export const CLASS_SHORT: Record<LedgerClass, string> = {
  male: 'M',
  female: 'F',
  undetermined: 'UD',
  indetermined: 'ID',
  group: 'G'
}
export const CLASS_LABEL: Record<LedgerClass, string> = {
  male: 'Male',
  female: 'Female',
  undetermined: 'Undetermined',
  indetermined: 'Indetermined',
  group: 'Group'
}

export type LedgerEventKind =
  | 'birth'
  | 'acquisition'
  | 'death'
  | 'disposal'
  | 'reclass'
  | 'census'
  | 'transfer'
  | 'transfer_in'
  | 'transfer_out'
export const EVENT_LABEL: Record<LedgerEventKind, string> = {
  birth: 'Birth',
  acquisition: 'Acquisition',
  death: 'Death',
  disposal: 'Disposal',
  reclass: 'Sex Reclassified',
  census: 'Census Update',
  transfer: 'Transfer',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out'
}
export const ADD_KINDS: LedgerEventKind[] = ['birth', 'acquisition']
export const CUT_KINDS: LedgerEventKind[] = ['death', 'disposal']

export interface LedgerEvent {
  id: string
  aid: string
  name?: string
  kind: LedgerEventKind
  date: Date
  site?: string
  enclosure?: string
  /** The class column this event lands in (for reclass: the TO class). */
  cls: LedgerClass
  /** Reclass only — the class the animal leaves. */
  fromCls?: LedgerClass
  /** Transfers only — the site the animal leaves / lands at. */
  fromSite?: string
  toSite?: string
  /** Signed change to the TOTAL count (0 for reclass; ±n for census). */
  delta: number
  /** Census / group events — the group's size after the update. */
  groupCount?: number
  age?: string
  weight?: string
  chip?: string
  ring?: string
  gender?: string
  /** Former (exited) animals synthesize their identity; live rows keep the real record. */
  former?: boolean
}

export type LedgerPreset = 'last_1m' | 'last_1y' | 'last_2y' | 'last_3y' | 'all'
export const LEDGER_PRESETS: { key: LedgerPreset; label: string }[] = [
  { key: 'last_1m', label: 'Last 30 Days' },
  { key: 'last_1y', label: 'Last 12 Months' },
  { key: 'last_2y', label: 'Last 2 Years' },
  { key: 'last_3y', label: 'Last 3 Years' },
  { key: 'all', label: 'All Time' }
]

/* ── deterministic hash (the lab.ts / detailUi idiom) ────────────────────── */

const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0

  return h
}

const DAY = 86_400_000
const clampDate = (d: Date, max: Date) => (d.getTime() > max.getTime() ? max : d)

const classOf = (gender?: string): LedgerClass => {
  const g = (gender || '').toLowerCase()
  if (g === 'male') return 'male'
  if (g === 'female') return 'female'
  if (g === 'group') return 'group'
  if (g.startsWith('indeterm')) return 'indetermined'

  return 'undetermined'
}

const parseDate = (s?: string): Date | undefined => {
  if (!s) return undefined
  const d = new Date(s)

  return isNaN(d.getTime()) ? undefined : d
}

/* ── event derivation ────────────────────────────────────────────────────── */

/**
 * Every CURRENT animal contributes its entry event (real accession fields first);
 * sexed adults hash-picked as "sexed later" contribute a UD→sex reclass; groups get
 * census updates; and a hash-picked set of FORMER animals (entered AND exited in the
 * past) supplies the deaths/disposals — so closing stock always reconciles back to the
 * live holding count.
 */
export const deriveLedgerEvents = (animals: AnimalRecord[], now = new Date()): LedgerEvent[] => {
  const events: LedgerEvent[] = []
  const sitePool = Array.from(new Set(animals.map(a => a.site).filter(Boolean))) as string[]
  const enclPool = Array.from(new Set(animals.map(a => a.enclosure).filter(Boolean))) as string[]

  animals.forEach(a => {
    const h = hash(a.antzId)
    const cls = classOf(a.gender)

    // entry date: real accession date > birth date > deterministic within the last ~5 years
    const entry =
      parseDate(a.accessionDate) ||
      parseDate(a.birthDate) ||
      new Date(now.getTime() - ((h % 1825) + 30) * DAY)

    // entry kind: the real accession type decides; hashes only fill blanks
    const acc = (a.accessionType || '').toLowerCase()
    const kind: LedgerEventKind = acc
      ? /birth|born|hatch/.test(acc)
        ? 'birth'
        : 'acquisition'
      : h % 100 < 55
      ? 'birth'
      : 'acquisition'

    // A sexed animal that was born here often entered UNSEXED — the reclass event is what
    // keeps the gender columns honest (UD shrinks, M/F grow, total unchanged).
    const sexedLater = kind === 'birth' && (cls === 'male' || cls === 'female') && (h >> 5) % 100 < 60
    const entryCls: LedgerClass = sexedLater ? 'undetermined' : cls

    const base = {
      aid: a.antzId,
      name: a.name,
      site: a.site,
      enclosure: a.enclosure,
      age: a.age,
      weight: a.weight,
      chip: a.chip,
      ring: a.ring,
      gender: a.gender
    }

    const reclassAt = sexedLater ? clampDate(new Date(entry.getTime() + (180 + ((h >> 8) % 540)) * DAY), now) : undefined

    // Transfers (2026-09-04): a hash-picked ~8% of individual animals moved site→site
    // once — the ENTRY happens at fromSite and the raw neutral transfer (delta 0) lands
    // them at their real current site, so per-site membership stays coherent under any
    // site scope (resolveEvents turns the move directional per selection).
    const th = hash(`${a.antzId}:tx`)
    const tx =
      sitePool.length > 1 && cls !== 'group' && a.site && th % 100 < 8
        ? (() => {
            // >>> not >> — a signed shift on a hash ≥ 2^31 goes NEGATIVE, indexes
            // sitePool[-n] = undefined and back-dates the move before its entry.
            let from = sitePool[(th >>> 3) % sitePool.length]
            if (from === a.site) from = sitePool[((th >>> 3) + 1) % sitePool.length]

            return { from, at: clampDate(new Date(entry.getTime() + (60 + ((th >>> 5) % 640)) * DAY), now) }
          })()
        : null

    events.push({
      ...base,
      id: `${a.antzId}:in`,
      kind,
      date: clampDate(entry, now),
      cls: entryCls,
      delta: 1,
      ...(tx && { site: tx.from })
    })

    if (sexedLater && reclassAt) {
      events.push({
        ...base,
        id: `${a.antzId}:rc`,
        kind: 'reclass',
        date: reclassAt,
        cls,
        fromCls: 'undetermined',
        delta: 0,
        // the class column moves at the site the animal stood at that day
        ...(tx && reclassAt.getTime() < tx.at.getTime() && { site: tx.from })
      })
    }

    if (tx) {
      events.push({
        ...base,
        id: `${a.antzId}:tx`,
        kind: 'transfer',
        date: tx.at,
        // class at transfer time — before a later reclass the animal still rides UD
        cls: reclassAt && tx.at.getTime() < reclassAt.getTime() ? entryCls : cls,
        delta: 0,
        fromSite: tx.from,
        toSite: a.site
      })
    }

    // Group records: counts move by CENSUS, not by individual events.
    if (cls === 'group') {
      const n = 1 + ((h >> 3) % 2)
      for (let i = 0; i < n; i++) {
        const at = clampDate(new Date(entry.getTime() + (120 + ((h >> (4 + i * 3)) % 700)) * DAY), now)
        const delta = ((h >> (6 + i * 2)) % 10 < 7 ? 1 : -1) * (1 + ((h >> (9 + i)) % 4))
        events.push({ ...base, id: `${a.antzId}:cs${i}`, kind: 'census', date: at, cls: 'group', delta })
      }
    }
  })

  // Former animals — every death/disposal once entered too, so the math closes.
  animals.forEach((a, i) => {
    const h = hash(`${a.antzId}:former`)
    if (h % 100 >= 16) return
    const aid = `AH-${String(2400 + i)}`
    const cls: LedgerClass = h % 100 < 38 ? 'male' : h % 100 < 76 ? 'female' : h % 100 < 92 ? 'undetermined' : 'indetermined'
    const site = sitePool.length ? sitePool[(h >> 4) % sitePool.length] : undefined
    const enclosure = enclPool.length ? enclPool[(h >> 6) % enclPool.length] : undefined
    const entry = new Date(now.getTime() - ((h % 1700) + 160) * DAY)
    const exit = clampDate(new Date(entry.getTime() + (90 + ((h >> 7) % 900)) * DAY), now)
    const inKind: LedgerEventKind = (h >> 9) % 100 < 55 ? 'birth' : 'acquisition'
    const outKind: LedgerEventKind = (h >> 11) % 100 < 70 ? 'death' : 'disposal'
    const base = { aid, site, enclosure, former: true }

    events.push({ ...base, id: `${aid}:in`, kind: inKind, date: entry, cls, delta: 1 })
    events.push({ ...base, id: `${aid}:out`, kind: outKind, date: exit, cls, delta: -1 })
  })

  // DEMO SHOWCASE DAY (user call 2026-09-05): one recent day carrying EVERY statement
  // event kind, so the day-row grammar ("chips + ×N + +N more") has a live example near
  // the top of the table. Deliberately NET ZERO — a neonate born and dead the same day,
  // an acquisition disposed the same day, a group census +1 against a census −1 — so the
  // closing stock and every other day's running balance stay exactly as they were.
  if (animals.length) {
    const dh = hash(`${animals[0].antzId}:demo`)
    const demoDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4)
    const at = (mins: number) => new Date(demoDay.getTime() + mins * 60_000)
    const site = sitePool.length ? sitePool[dh % sitePool.length] : undefined
    const enclosure = enclPool.length ? enclPool[(dh >>> 3) % enclPool.length] : undefined
    const nb = { aid: `AH-${2300 + (dh % 50)}`, site, enclosure, former: true }
    const aq = { aid: `AH-${2360 + ((dh >>> 4) % 30)}`, site, enclosure, former: true }
    const aqCls: LedgerClass = (dh >>> 5) % 2 ? 'male' : 'female'

    events.push({ ...nb, id: `${nb.aid}:in`, kind: 'birth', date: at(9 * 60), cls: 'undetermined', delta: 1 })
    events.push({ ...nb, id: `${nb.aid}:out`, kind: 'death', date: at(18 * 60), cls: 'undetermined', delta: -1 })
    events.push({ ...aq, id: `${aq.aid}:in`, kind: 'acquisition', date: at(10 * 60), cls: aqCls, delta: 1 })
    events.push({ ...aq, id: `${aq.aid}:out`, kind: 'disposal', date: at(17 * 60), cls: aqCls, delta: -1 })

    const groups = animals.filter(a => classOf(a.gender) === 'group')
    if (groups.length) {
      const g1 = groups[0]
      const g2 = groups[groups.length - 1]
      const gBase = (g: AnimalRecord) => ({ aid: g.antzId, name: g.name, site: g.site, enclosure: g.enclosure })
      events.push({ ...gBase(g1), id: `${g1.antzId}:csdemoA`, kind: 'census', date: at(11 * 60), cls: 'group', delta: 1 })
      events.push({ ...gBase(g2), id: `${g2.antzId}:csdemoB`, kind: 'census', date: at(12 * 60), cls: 'group', delta: -1 })
    }
  }

  return events.sort((x, y) => x.date.getTime() - y.date.getTime())
}

/* ── the ledger computation (one chronological scan) ─────────────────────── */

export type ClassCounts = Record<LedgerClass, number>
const zeroCounts = (): ClassCounts => ({ male: 0, female: 0, undetermined: 0, indetermined: 0, group: 0 })

export interface GridRow {
  kind: LedgerEventKind
  byClass: ClassCounts // signed
  total: number // signed (0 for reclass)
}

export interface MonthBucket {
  /** Axis label — chronological: "Jan" + year "26"; cumulative: "Jan" only. */
  label: string
  year?: string
  /** Month index 0-11 (cumulative view) or the real month start (chronological). */
  monthIndex: number
  start?: Date
  adds: number
  cuts: number
  /** Running total at month end — chronological view only. */
  closing?: number
}

export interface LedgerComputed {
  rangeStart: Date | null
  cumulative: boolean
  opening: ClassCounts
  closing: ClassCounts
  openingTotal: number
  closingTotal: number
  additionsTotal: number
  reductionsTotal: number
  addRows: GridRow[]
  cutRows: GridRow[]
  months: MonthBucket[]
  /** In-range events, NEWEST first, each carrying the running total after it. */
  rows: (LedgerEvent & { balance: number })[]
}

const MONTHS_3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const presetStart = (preset: LedgerPreset, now: Date): Date | null => {
  if (preset === 'all') return null
  if (preset === 'last_1m') return new Date(now.getTime() - 30 * DAY)
  const years = preset === 'last_1y' ? 1 : preset === 'last_2y' ? 2 : 3
  const d = new Date(now.getFullYear(), now.getMonth() - years * 12 + 1, 1)

  return d
}

/* ── site-scope resolution ───────────────────────────────────────────────────
   Transfers are net-zero at the organization level — a raw 'transfer' event only
   becomes DIRECTIONAL under a site scope. All sites: everything passes through, raw
   transfers stay neutral (delta 0 — list surfaces hide them). Site(s) selected:
   crossing INTO the scope = transfer_in (+1), OUT of it = transfer_out (−1), internal
   to a multi-site selection = neutral (list-only), fully outside = dropped. */
export const resolveEvents = (all: LedgerEvent[], sites: string[] | null): LedgerEvent[] => {
  if (!sites?.length) return all

  const out: LedgerEvent[] = []
  for (const e of all) {
    if (e.kind === 'transfer') {
      const fromIn = !!e.fromSite && sites.includes(e.fromSite)
      const toIn = !!e.toSite && sites.includes(e.toSite)
      if (toIn && !fromIn) out.push({ ...e, kind: 'transfer_in', delta: 1, site: e.toSite })
      else if (fromIn && !toIn) out.push({ ...e, kind: 'transfer_out', delta: -1, site: e.fromSite })
      else if (fromIn && toIn) out.push(e)
    } else if (e.site && sites.includes(e.site)) {
      out.push(e)
    }
  }

  return out
}

export const computeLedger = (
  all: LedgerEvent[],
  preset: LedgerPreset,
  /** Site scope — MULTI-select (2026-09-04); empty/null = all sites. */
  sites: string[] | null,
  now = new Date()
): LedgerComputed => {
  const universe = resolveEvents(all, sites)
  const rangeStart = presetStart(preset, now)
  const cumulative = preset !== 'last_1y'

  const counts = zeroCounts()
  let total = 0
  const opening = zeroCounts()
  let openingTotal = 0
  let openingTaken = rangeStart === null // all-time: opening = 0 baseline

  const grid = new Map<LedgerEventKind, GridRow>()
  const rowOf = (k: LedgerEventKind) => {
    let r = grid.get(k)
    if (!r) {
      r = { kind: k, byClass: zeroCounts(), total: 0 }
      grid.set(k, r)
    }

    return r
  }

  let additionsTotal = 0
  let reductionsTotal = 0
  const rows: (LedgerEvent & { balance: number })[] = []

  // chronological month buckets (12, anchored at now) for the Last-12-Months view
  const chronoKeys: string[] = []
  const chronoMap = new Map<string, MonthBucket>()
  if (!cumulative) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      chronoKeys.push(key)
      chronoMap.set(key, {
        label: MONTHS_3[d.getMonth()],
        year: String(d.getFullYear()).slice(-2),
        monthIndex: d.getMonth(),
        start: d,
        adds: 0,
        cuts: 0,
        closing: 0
      })
    }
  }
  const seasonal: MonthBucket[] = MONTHS_3.map((label, monthIndex) => ({ label, monthIndex, adds: 0, cuts: 0 }))

  universe.forEach(e => {
    const inRange = rangeStart === null || e.date >= rangeStart
    if (!openingTaken && inRange) {
      // first in-range event — freeze the opening balance
      LEDGER_CLASSES.forEach(c => (opening[c] = counts[c]))
      openingTotal = total
      openingTaken = true
    }

    // apply the event to the running counters
    if (e.kind === 'reclass') {
      if (e.fromCls) counts[e.fromCls] -= 1
      counts[e.cls] += 1
    } else {
      counts[e.cls] += e.delta
      total += e.delta
    }

    if (!inRange) return

    // reconciliation grid
    const r = rowOf(e.kind)
    if (e.kind === 'reclass') {
      if (e.fromCls) r.byClass[e.fromCls] -= 1
      r.byClass[e.cls] += 1
    } else {
      r.byClass[e.cls] += e.delta
      r.total += e.delta
      if (e.delta > 0) additionsTotal += e.delta
      else reductionsTotal += -e.delta
    }

    // month buckets
    if (e.delta !== 0) {
      if (cumulative) {
        const b = seasonal[e.date.getMonth()]
        if (e.delta > 0) b.adds += e.delta
        else b.cuts += -e.delta
      } else {
        const b = chronoMap.get(`${e.date.getFullYear()}-${e.date.getMonth()}`)
        if (b) {
          if (e.delta > 0) b.adds += e.delta
          else b.cuts += -e.delta
        }
      }
    }

    rows.push({ ...e, balance: total })
  })

  // universe fully applied — anything still pending means no in-range events at all
  if (!openingTaken) {
    LEDGER_CLASSES.forEach(c => (opening[c] = counts[c]))
    openingTotal = total
  }

  // chronological closing per month = running balance replayed against month ends
  if (!cumulative) {
    let bal = openingTotal
    const byKey = new Map<string, number>()
    rows.forEach(r => {
      byKey.set(`${r.date.getFullYear()}-${r.date.getMonth()}`, r.balance)
    })
    chronoKeys.forEach(key => {
      const b = chronoMap.get(key)!
      const last = byKey.get(key)
      if (last != null) bal = last
      b.closing = bal
    })
  }

  const kindRows = (kinds: LedgerEventKind[]) =>
    kinds.map(k => grid.get(k) ?? { kind: k, byClass: zeroCounts(), total: 0 })

  return {
    rangeStart,
    cumulative,
    opening,
    closing: { ...counts },
    openingTotal,
    closingTotal: total,
    additionsTotal,
    reductionsTotal,
    // Transfer rows exist only under a site scope — org-wide they are net-zero noise.
    addRows: [
      ...kindRows(ADD_KINDS),
      ...(sites?.length ? kindRows(['transfer_in']) : []),
      ...kindRows(['reclass']),
      ...kindRows(['census']).filter(r => r.total !== 0 || Object.values(r.byClass).some(Boolean))
    ],
    cutRows: [...kindRows(CUT_KINDS), ...(sites?.length ? kindRows(['transfer_out']) : [])],
    months: cumulative ? seasonal : chronoKeys.map(k => chronoMap.get(k)!),
    rows: rows.slice().reverse()
  }
}

/* ── the bank-statement rows (demo review 2026-09-04; day-rows 2026-09-05) ────
   The Ledger sub-tab = a bank statement of the species count: ONE ROW PER DAY,
   latest first. The row DESCRIBES every event of that day (kind + count chips,
   "+N more" past the cap) and In / Out carry the day's totals — Subhash's
   description rule: "how many got in with which event, how many got out with
   what event". Count-changing events only (reclass and neutral transfers don't
   move the number). */

export interface StatementEventGroup {
  kind: LedgerEventKind
  count: number
  delta: number
}

export interface StatementRow {
  id: string
  date: Date
  /** The day's events grouped by kind, in occurrence order. */
  groups: StatementEventGroup[]
  /** Day totals — everything IN (+) and OUT (absolute). */
  inCount: number
  outCount: number
  /** Running total after the day's last event. */
  balance: number
  events: LedgerEvent[]
}

export const statementRows = (
  all: LedgerEvent[],
  preset: LedgerPreset,
  sites: string[] | null,
  now = new Date()
): StatementRow[] => {
  const universe = resolveEvents(all, sites)
  const start = presetStart(preset, now)
  let total = 0
  const rows: StatementRow[] = []
  const byKey = new Map<string, StatementRow>()

  for (const e of universe) {
    // Reclass sits out (count-neutral bookkeeping) — but TRANSFERS always show (user
    // call 2026-09-05: the ledger has EVERYTHING): neutral ones ride as delta-0 rows
    // (no In/Out), directional ones count. Reconciliation keeps its site-scope gate.
    if (e.delta === 0 && e.kind !== 'transfer') continue
    total += e.delta
    if (start && e.date < start) continue
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`
    let r = byKey.get(key)
    if (!r) {
      r = { id: key, date: e.date, groups: [], inCount: 0, outCount: 0, balance: total, events: [] }
      byKey.set(key, r)
      rows.push(r)
    }
    let g = r.groups.find(x => x.kind === e.kind)
    if (!g) {
      g = { kind: e.kind, count: 0, delta: 0 }
      r.groups.push(g)
    }
    g.count += 1
    g.delta += e.delta
    if (e.delta > 0) r.inCount += e.delta
    else r.outCount += -e.delta
    r.balance = total
    r.events.push(e)
  }

  return rows.reverse() // latest first
}

/* ── stock membership (Opening / Closing drills) ─────────────────────────────
   The animals composing the stock at a boundary — each listed via its ENTRY event
   (the chip + date a stock row wears). Classes follow reclass events through time. */
export const stockRows = (
  all: LedgerEvent[],
  preset: LedgerPreset,
  sites: string[] | null,
  boundary: 'opening' | 'closing',
  cls?: LedgerClass,
  now = new Date()
): LedgerEvent[] => {
  const rangeStart = boundary === 'opening' ? presetStart(preset, now) : null
  // All-time opening = the 0 baseline — nobody was in stock before the first event.
  if (boundary === 'opening' && !rangeStart) return []
  const universe = resolveEvents(all, sites)
  const live = new Map<string, { entry: LedgerEvent; cls: LedgerClass; site?: string }>()

  for (const e of universe) {
    if (boundary === 'opening' && rangeStart && e.date >= rangeStart) break
    if (e.kind === 'reclass') {
      const rec = live.get(e.aid)
      if (rec) rec.cls = e.cls
    } else if (e.kind === 'transfer') {
      // neutral move (org-wide, or internal to the selection) — membership holds, site updates
      const rec = live.get(e.aid)
      if (rec) rec.site = e.toSite
    } else if (e.delta > 0 && !live.has(e.aid)) {
      // a transfer_in IS the entry into the scope — the row wears the transfer chip + date
      live.set(e.aid, { entry: e, cls: e.cls, site: e.site })
    } else if (e.delta < 0 && e.kind !== 'census') {
      live.delete(e.aid)
    }
  }

  return Array.from(live.values())
    .filter(r => !cls || r.cls === cls)
    .map(r => ({ ...r.entry, cls: r.cls, site: r.site }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

/* ── formatting ──────────────────────────────────────────────────────────── */

export const ddMMMyyyy = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MONTHS_3[d.getMonth()]} ${d.getFullYear()}`

export const monthYearLabel = (d: Date) => `${MONTHS_3[d.getMonth()]} ${d.getFullYear()}`

export const signed = (n: number) => (n > 0 ? `+${n.toLocaleString()}` : n < 0 ? `−${Math.abs(n).toLocaleString()}` : '—')
