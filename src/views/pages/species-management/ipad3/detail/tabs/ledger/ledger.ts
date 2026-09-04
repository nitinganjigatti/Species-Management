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
// Transfer In / Out events wait on real movement data — site moves are net-zero at the
// organization level and the sidecars carry no movement history to derive them from.

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

export type LedgerEventKind = 'birth' | 'acquisition' | 'death' | 'disposal' | 'reclass' | 'census'
export const EVENT_LABEL: Record<LedgerEventKind, string> = {
  birth: 'Birth',
  acquisition: 'Acquisition',
  death: 'Death',
  disposal: 'Disposal',
  reclass: 'Sex Reclassified',
  census: 'Census Update'
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

export type LedgerPreset = 'last_1y' | 'last_2y' | 'last_3y' | 'all'
export const LEDGER_PRESETS: { key: LedgerPreset; label: string }[] = [
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

    events.push({ ...base, id: `${a.antzId}:in`, kind, date: clampDate(entry, now), cls: entryCls, delta: 1 })

    if (sexedLater) {
      const reclassAt = clampDate(new Date(entry.getTime() + (180 + ((h >> 8) % 540)) * DAY), now)
      events.push({
        ...base,
        id: `${a.antzId}:rc`,
        kind: 'reclass',
        date: reclassAt,
        cls,
        fromCls: 'undetermined',
        delta: 0
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

const presetStart = (preset: LedgerPreset, now: Date): Date | null => {
  if (preset === 'all') return null
  const years = preset === 'last_1y' ? 1 : preset === 'last_2y' ? 2 : 3
  const d = new Date(now.getFullYear(), now.getMonth() - years * 12 + 1, 1)

  return d
}

export const computeLedger = (
  all: LedgerEvent[],
  preset: LedgerPreset,
  /** Site scope — MULTI-select (2026-09-04); empty/null = all sites. */
  sites: string[] | null,
  now = new Date()
): LedgerComputed => {
  const universe = sites?.length ? all.filter(e => e.site && sites.includes(e.site)) : all
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
    addRows: [...kindRows(ADD_KINDS), ...kindRows(['reclass']), ...kindRows(['census']).filter(r => r.total !== 0 || Object.values(r.byClass).some(Boolean))],
    cutRows: kindRows(CUT_KINDS),
    months: cumulative ? seasonal : chronoKeys.map(k => chronoMap.get(k)!),
    rows: rows.slice().reverse()
  }
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
  const universe = sites?.length ? all.filter(e => e.site && sites.includes(e.site)) : all
  const rangeStart = boundary === 'opening' ? presetStart(preset, now) : null
  const live = new Map<string, { entry: LedgerEvent; cls: LedgerClass }>()

  for (const e of universe) {
    if (boundary === 'opening' && rangeStart && e.date >= rangeStart) break
    if (e.kind === 'reclass') {
      const rec = live.get(e.aid)
      if (rec) rec.cls = e.cls
    } else if (e.delta > 0 && !live.has(e.aid)) {
      live.set(e.aid, { entry: e, cls: e.cls })
    } else if (e.delta < 0 && e.kind !== 'census') {
      live.delete(e.aid)
    }
  }

  return Array.from(live.values())
    .filter(r => !cls || r.cls === cls)
    .map(r => ({ ...r.entry, cls: r.cls }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

/* ── formatting ──────────────────────────────────────────────────────────── */

export const ddMMMyyyy = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MONTHS_3[d.getMonth()]} ${d.getFullYear()}`

export const monthYearLabel = (d: Date) => `${MONTHS_3[d.getMonth()]} ${d.getFullYear()}`

export const signed = (n: number) => (n > 0 ? `+${n.toLocaleString()}` : n < 0 ? `−${Math.abs(n).toLocaleString()}` : '—')
