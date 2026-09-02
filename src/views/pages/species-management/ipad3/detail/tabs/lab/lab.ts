/*
 * Lab (LIMS) rollup for ONE species — derived from the clinical sidecar we already load, same
 * style as hospital.ts. Every clinical episode raises an illness-driven lab request (doctor,
 * hospital case, lab center and tests decided by deterministic hashes), and each animal gets a
 * chance of routine screening requests, so testing reads ~half illness-driven / half preventive.
 * Pure functions, no React. TODO(API): swap buildLabRequests for the real species-scoped lab
 * endpoint when the LIMS backend lands — the rollup shapes below are the intended contract.
 */
import type { ClinicalRecord, SpeciesClinical } from 'src/lib/api/species-management/detail'

export const LAB_THRESHOLDS = {
  repeatSameTest: 3, // same test on one animal ≥ this many times → "repeat same-test" signal
  repeatWindowDays: 180, // …and those repeats must fall inside this rolling window (3 tests over 3 years ≠ chronic)
  agingPendingDays: 5, // pending/in-progress older than this → "aging" signal
  hotMult: 1.3 // a cut's top entry ≥ this × the average → highlighted coral
} as const

// Deterministic pseudo-hash so every derived value is stable across renders (no Math.random).
const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }

  return (h >>> 0) / 0xffffffff // 0..1
}

/* Same hospital + doctor universe as the Hospital tab so the two tabs tell one story. */
const HOSPITALS = [
  'Pinecrest Veterinary Hospital',
  'Brightwater Animal Care Center',
  'Riverside Wildlife Hospital',
  'Hillcrest Veterinary Clinic'
]
const DOCTORS = [
  'Dr. Meera Nair',
  'Dr. Arjun Rao',
  'Dr. Kavya Menon',
  'Dr. Dev Patel',
  'Dr. Sana Iyer',
  'Dr. Rohit Shetty',
  'Dr. Priya Kulkarni',
  'Dr. Vikram Bose',
  'Dr. Anita Desai'
]
const LABS = [
  { name: 'Central Diagnostic Lab', baseTat: 1.6 },
  { name: 'NorthPoint Referral Lab', baseTat: 3.0 },
  { name: 'Riverside In-house Lab', baseTat: 2.2 },
  { name: 'Brightwater Path Lab', baseTat: 2.6 },
  { name: 'Hillcrest Micro Lab', baseTat: 3.4 },
  { name: 'State Vet Reference Lab', baseTat: 4.2 }
]

/** Test catalog — name, owning department, and how its dept affects turnaround. */
const TEST_CATALOG = [
  { name: 'CBC', dept: 'Haematology', tatAdd: 0 },
  { name: 'Liver panel', dept: 'Biochemistry', tatAdd: 0.4 },
  { name: 'Glucose', dept: 'Biochemistry', tatAdd: 0.2 },
  { name: 'Kidney panel', dept: 'Biochemistry', tatAdd: 0.4 },
  { name: 'Fecal exam', dept: 'Parasitology', tatAdd: 0.2 },
  { name: 'Culture & sensitivity', dept: 'Microbiology', tatAdd: 2.8 },
  { name: 'Leptospira serology', dept: 'Serology', tatAdd: 0.6 },
  { name: 'Cortisol', dept: 'Endocrinology', tatAdd: 1.2 }
] as const
export type LabDept = (typeof TEST_CATALOG)[number]['dept']

const REJECT_REASONS = ['Haemolysed', 'Insufficient volume', 'Contaminated', 'Clotted'] as const

/* Only these tests can return a detection (positive/detected) — matches the production
 * `completed_positive` / `completed_detected` status vocabulary. */
const DETECTABLE = new Set(['Leptospira serology', 'Fecal exam', 'Culture & sensitivity'])

export type LabTestResult = 'normal' | 'high' | 'low' | 'positive' | 'detected'
export type LabRequestStatus = 'completed' | 'in_progress' | 'pending' | 'cancelled'

export interface LabTest {
  name: string
  dept: LabDept
  status: LabRequestStatus
  result?: LabTestResult // only when completed
}

export interface LabRequest {
  id: string // LR-00156/26 — the LIMS request-id format
  aid: string
  name: string
  site: string
  enclosure: string
  date: string
  doctor: string
  hospital?: string // originating hospital case; undefined = routine / screening
  lab: string // processing lab center
  urgent: boolean
  status: LabRequestStatus
  tests: LabTest[]
  containers: number
  rejected?: { reason: (typeof REJECT_REASONS)[number]; resubmitted: boolean }
  tatDays: number // request → all results (completed requests)
}

export interface RepeatSameTest {
  aid: string
  name: string
  site: string
  enclosure: string
  test: string
  times: number
  spanDays: number
  lastResult: LabTestResult
  requests: LabRequest[]
}

export interface LabRollup {
  requests: LabRequest[] // windowed, newest first
  totals: { completed: number; inProgress: number; pending: number; cancelled: number; urgent: number }
  avgTatDays: number
  testsTotal: number
  testsDone: number
  detections: { test: string; result: LabTestResult; requests: LabRequest[] }[]
  detectionCount: number
  repeatSameTest: RepeatSameTest[]
  rejectedRequests: LabRequest[]
  resubmitsOpen: number
  rejectReasons: { reason: string; count: number; topSite?: string }[]
  agingPending: LabRequest[] // pending/in-progress older than agingPendingDays
  agingUrgent: number
  byDoctor: { name: string; requests: number; urgent: number; topTest: string; hot: boolean; items: LabRequest[] }[]
  bySite: { site: string; requests: number; animals: number; rejected: number; hot: boolean; items: LabRequest[] }[]
  byHospital: { name: string; requests: number; cases: number; routine: boolean; hot: boolean; items: LabRequest[] }[]
  byLab: { name: string; tests: number; pending: number; tatDays: number; items: LabRequest[] }[]
  departments: { dept: string; tests: number; done: number; running: number; tatDays: number }[]
  abnormalByTest: { test: string; abnormal: number; total: number; pct: number }[]
  containersTotal: number
  containersRejected: number
}

const pick = <T,>(arr: readonly T[], h: number): T => arr[Math.floor(h * arr.length) % arr.length]

const REQUEST_YEAR_SUFFIX = (d: string) => {
  const t = new Date(d)

  return isNaN(t.getTime()) ? '26' : String(t.getFullYear()).slice(2)
}

/** One request's tests — 1..3 picks, biased so common panels dominate. */
const deriveTests = (aid: string, date: string, screening: boolean): LabTest[] => {
  const h = (salt: string) => hash(`${aid}|${date}|${salt}`)
  const n = screening ? 1 + Math.floor(h('tn') * 2) : 1 + Math.floor(h('tn') * 3) // screening 1–2, illness 1–3
  const start = Math.floor(h('tp') * TEST_CATALOG.length)
  const tests: LabTest[] = []
  for (let i = 0; i < n; i++) {
    const cat = TEST_CATALOG[(start + i * 3) % TEST_CATALOG.length]
    tests.push({ name: cat.name, dept: cat.dept, status: 'pending' })
  }

  return tests
}

/** Result mix on a completed test — mostly normal; detections only on detectable tests. */
const deriveResult = (aid: string, date: string, test: string): LabTestResult => {
  const h = hash(`${aid}|${date}|${test}|res`)
  if (DETECTABLE.has(test) && h > 0.965) return h > 0.985 ? 'positive' : 'detected'
  if (h > 0.86) return 'high'
  if (h > 0.78) return 'low'

  return 'normal'
}

const buildOne = (
  seq: number,
  rec: Pick<ClinicalRecord, 'aid' | 'name' | 'site' | 'enclosure'>,
  date: string,
  opts: { hospital?: string; urgent: boolean },
  now: Date
): LabRequest => {
  const { aid } = rec
  const h = (salt: string) => hash(`${aid}|${date}|${salt}`)
  const lab = pick(LABS, h('lab') * h('lab')) // squared hash → long-tail: Central ~40%, then descending
  const tests = deriveTests(aid, date, !opts.hospital)

  // Lifecycle from recency: recent requests are still moving, older ones are done (or cancelled).
  const ageDays = Math.max(0, (now.getTime() - new Date(date).getTime()) / 86400000)
  let status: LabRequestStatus
  if (h('cx') > 0.96) status = 'cancelled'
  else if (ageDays < 3) status = h('st') > 0.5 ? 'pending' : 'in_progress'
  else if (ageDays < 8) status = h('st') > 0.75 ? 'in_progress' : 'completed'
  else status = 'completed'

  const maxTatAdd = tests.reduce((m, t) => Math.max(m, TEST_CATALOG.find(c => c.name === t.name)?.tatAdd ?? 0), 0)
  const tatDays = Math.round((lab.baseTat + maxTatAdd + h('tat') * 1.2) * 10) / 10

  for (const t of tests) {
    t.status = status === 'cancelled' ? 'cancelled' : status
    if (status === 'completed') t.result = deriveResult(aid, date, t.name)
  }

  const rejectedRoll = h('rej')
  const rejected =
    status !== 'cancelled' && rejectedRoll > 0.93
      ? { reason: pick(REJECT_REASONS, h('rr')), resubmitted: h('rs') > 0.45 }
      : undefined

  return {
    id: `LR-${String(100 + seq).padStart(5, '0')}/${REQUEST_YEAR_SUFFIX(date)}`,
    aid,
    name: rec.name,
    site: rec.site,
    enclosure: rec.enclosure,
    date,
    doctor: pick(DOCTORS, h('dr')),
    hospital: opts.hospital,
    lab: lab.name,
    urgent: opts.urgent,
    status,
    tests,
    containers: tests.length + (h('cn') > 0.6 ? 1 : 0),
    rejected,
    tatDays
  }
}

/** Every lab request for the species — UNWINDOWED (the trend windows itself; computeLab
 *  windows to the page period). Deterministic: same clinical input → same requests. */
export const buildLabRequests = (clinical: SpeciesClinical | null | undefined, now: Date): LabRequest[] => {
  if (!clinical) return []
  const recs: ClinicalRecord[] = [
    ...(clinical.programs?.symptoms?.records ?? []),
    ...(clinical.programs?.diagnosis?.records ?? [])
  ]

  const requests: LabRequest[] = []
  let seq = 0

  // Illness-driven: every clinical episode raises a request from its hospital case.
  for (const r of recs) {
    const urgent = r.severity === 'High' || hash(`${r.aid}|${r.date}|u`) > 0.9
    requests.push(
      buildOne(seq++, r, r.date, { hospital: pick(HOSPITALS, hash(r.aid)), urgent }, now)
    )
    // Bad first sample sometimes means a follow-up request two weeks later (chronic monitoring).
    if (hash(`${r.aid}|${r.date}|fu`) > 0.72) {
      const d = new Date(r.date)
      d.setDate(d.getDate() + 14 + Math.floor(hash(`${r.aid}|${r.date}|fd`) * 21))
      if (d <= now) {
        requests.push(buildOne(seq++, r, d.toISOString().slice(0, 10), { hospital: pick(HOSPITALS, hash(r.aid)), urgent: false }, now))
      }
    }
  }

  // Routine / screening: each animal seen in the sidecar gets a chance of annual screenings.
  const seen = new Map<string, ClinicalRecord>()
  for (const r of recs) if (!seen.has(r.aid)) seen.set(r.aid, r)
  for (const [aid, r] of seen) {
    for (let year = 0; year < 3; year++) {
      if (hash(`${aid}|scr|${year}`) > 0.45) continue // ~45% of animals screened in a given year
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - year)
      d.setMonth(Math.floor(hash(`${aid}|scrm|${year}`) * 12), 1 + Math.floor(hash(`${aid}|scrd|${year}`) * 27))
      if (d > now) continue
      requests.push(buildOne(seq++, r, d.toISOString().slice(0, 10), { urgent: false }, now))
    }
  }

  return requests.sort((a, b) => (a.date < b.date ? 1 : -1))
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Requests bucketed per month — same axis format as the Hospital trend. */
export const monthlyLabRequests = (
  requests: LabRequest[],
  monthsBack: number | null,
  now: Date
): { labels: string[]; values: number[]; perMonth: LabRequest[][] } => {
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const byMonth = new Map<string, LabRequest[]>()
  for (const r of requests) {
    const t = new Date(r.date)
    if (isNaN(t.getTime()) || t > now) continue
    const k = key(t)
    const list = byMonth.get(k)
    if (list) list.push(r)
    else byMonth.set(k, [r])
  }

  let start: Date
  if (monthsBack != null) start = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1)
  else {
    const keys = [...byMonth.keys()].sort()
    if (!keys.length) return { labels: [], values: [], perMonth: [] }
    const [y, m] = keys[0].split('-').map(Number)
    start = new Date(y, m - 1, 1)
  }

  const labels: string[] = []
  const values: number[] = []
  const perMonth: LabRequest[][] = []
  for (let d = new Date(start); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const list = byMonth.get(key(d)) ?? []
    labels.push(`${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`)
    values.push(list.length)
    perMonth.push(list)
  }

  return { labels, values, perMonth }
}

export const computeLab = (
  clinical: SpeciesClinical | null | undefined,
  inWin: (s?: string) => boolean,
  now: Date
): LabRollup | null => {
  if (!clinical) return null

  const requests = buildLabRequests(clinical, now).filter(r => inWin(r.date))
  if (!requests.length) {
    return null
  }

  const totals = {
    completed: requests.filter(r => r.status === 'completed').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    pending: requests.filter(r => r.status === 'pending').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
    urgent: requests.filter(r => r.urgent).length
  }

  const done = requests.filter(r => r.status === 'completed')
  const avgTatDays = done.length ? Math.round((done.reduce((s, r) => s + r.tatDays, 0) / done.length) * 10) / 10 : 0

  const allTests = requests.flatMap(r => r.tests.map(t => ({ t, r })))
  const testsTotal = allTests.length
  const testsDone = allTests.filter(x => x.t.status === 'completed').length

  /* ── detections — production `completed_positive` / `completed_detected` vocabulary ── */
  const detMap = new Map<string, { result: LabTestResult; requests: LabRequest[] }>()
  for (const { t, r } of allTests) {
    if (t.result !== 'positive' && t.result !== 'detected') continue
    let e = detMap.get(t.name)
    if (!e) {
      e = { result: t.result, requests: [] }
      detMap.set(t.name, e)
    }
    e.requests.push(r)
  }
  const detections = [...detMap.entries()].map(([test, e]) => ({ test, ...e }))
  const detectionCount = detections.reduce((s, d) => s + d.requests.length, 0)

  /* ── repeat same-test animals — the chronic-case signal ── */
  const rptMap = new Map<string, { rec: LabRequest; test: string; items: LabRequest[] }>()
  for (const { t, r } of allTests) {
    const k = `${r.aid}|${t.name}`
    let e = rptMap.get(k)
    if (!e) {
      e = { rec: r, test: t.name, items: [] }
      rptMap.set(k, e)
    }
    e.items.push(r)
  }
  // Only repeats inside a rolling window count as chronic — take each animal+test pair's
  // densest run of requests within repeatWindowDays and threshold on THAT count.
  const windowMs = LAB_THRESHOLDS.repeatWindowDays * 86400000
  const repeatSameTest: RepeatSameTest[] = [...rptMap.values()]
    .map(e => {
      const sorted = [...e.items].sort((a, b) => (a.date < b.date ? -1 : 1))
      const times = sorted.map(r => new Date(r.date).getTime())
      let bestFrom = 0
      let bestTo = -1
      let from = 0
      for (let to = 0; to < times.length; to++) {
        while (times[to] - times[from] > windowMs) from++
        if (to - from > bestTo - bestFrom) {
          bestFrom = from
          bestTo = to
        }
      }

      return { e, windowItems: sorted.slice(bestFrom, bestTo + 1) }
    })
    .filter(x => x.windowItems.length >= LAB_THRESHOLDS.repeatSameTest)
    .map(({ e, windowItems }) => {
      const dates = windowItems.map(r => new Date(r.date).getTime())
      const latest = windowItems[windowItems.length - 1]
      const lastTest = latest.tests.find(t => t.name === e.test)

      return {
        aid: e.rec.aid,
        name: e.rec.name,
        site: e.rec.site,
        enclosure: e.rec.enclosure,
        test: e.test,
        times: windowItems.length,
        spanDays: Math.max(1, Math.round((dates[dates.length - 1] - dates[0]) / 86400000)),
        lastResult: lastTest?.result ?? 'normal',
        requests: windowItems
      }
    })
    .sort((a, b) => b.times - a.times)

  /* ── sample quality ── */
  const rejectedRequests = requests.filter(r => r.rejected)
  const resubmitsOpen = rejectedRequests.filter(r => r.rejected && !r.rejected.resubmitted).length
  const rrMap = new Map<string, { count: number; sites: Map<string, number> }>()
  for (const r of rejectedRequests) {
    const reason = r.rejected!.reason
    let e = rrMap.get(reason)
    if (!e) {
      e = { count: 0, sites: new Map() }
      rrMap.set(reason, e)
    }
    e.count++
    e.sites.set(r.site, (e.sites.get(r.site) ?? 0) + 1)
  }
  const rejectReasons = [...rrMap.entries()]
    .map(([reason, e]) => ({
      reason,
      count: e.count,
      topSite: [...e.sites.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    }))
    .sort((a, b) => b.count - a.count)

  /* ── aging pending ── */
  const agingPending = requests
    .filter(r => (r.status === 'pending' || r.status === 'in_progress') && (now.getTime() - new Date(r.date).getTime()) / 86400000 > LAB_THRESHOLDS.agingPendingDays)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const agingUrgent = agingPending.filter(r => r.urgent).length

  /* ── the four cuts ── */
  const topBy = <K extends string>(keyOf: (r: LabRequest) => K) => {
    const m = new Map<K, LabRequest[]>()
    for (const r of requests) {
      const k = keyOf(r)
      const list = m.get(k)
      if (list) list.push(r)
      else m.set(k, [r])
    }

    return m
  }

  const dMap = topBy(r => r.doctor)
  const avgDoc = dMap.size ? requests.length / dMap.size : 0
  const byDoctor = [...dMap.entries()]
    .map(([name, items]) => {
      const testCount = new Map<string, number>()
      for (const r of items) for (const t of r.tests) testCount.set(t.name, (testCount.get(t.name) ?? 0) + 1)

      return {
        name,
        requests: items.length,
        urgent: items.filter(r => r.urgent).length,
        topTest: [...testCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
        hot: items.length >= avgDoc * LAB_THRESHOLDS.hotMult,
        items
      }
    })
    .sort((a, b) => b.requests - a.requests)

  const sMap = topBy(r => r.site)
  const avgSite = sMap.size ? requests.length / sMap.size : 0
  const bySite = [...sMap.entries()]
    .map(([site, items]) => ({
      site,
      requests: items.length,
      animals: new Set(items.map(r => r.aid)).size,
      rejected: items.filter(r => r.rejected).length,
      hot: items.length >= avgSite * LAB_THRESHOLDS.hotMult,
      items
    }))
    .sort((a, b) => b.requests - a.requests)

  const hMap = topBy(r => r.hospital ?? 'Routine / screening')
  const hospEntries = [...hMap.entries()].filter(([k]) => k !== 'Routine / screening')
  const avgHosp = hospEntries.length ? hospEntries.reduce((s, [, v]) => s + v.length, 0) / hospEntries.length : 0
  const byHospital = [...hMap.entries()]
    .map(([name, items]) => ({
      name,
      requests: items.length,
      cases: name === 'Routine / screening' ? 0 : new Set(items.map(r => r.aid)).size,
      routine: name === 'Routine / screening',
      hot: name !== 'Routine / screening' && items.length >= avgHosp * LAB_THRESHOLDS.hotMult,
      items
    }))
    .sort((a, b) => (a.routine ? 1 : b.routine ? -1 : b.requests - a.requests))

  const lMap = topBy(r => r.lab)
  const byLab = [...lMap.entries()]
    .map(([name, items]) => ({
      name,
      tests: items.reduce((s, r) => s + r.tests.length, 0),
      pending: items.filter(r => r.status === 'pending' || r.status === 'in_progress').reduce((s, r) => s + r.tests.length, 0),
      tatDays: (() => {
        const d = items.filter(r => r.status === 'completed')

        return d.length ? Math.round((d.reduce((s, r) => s + r.tatDays, 0) / d.length) * 10) / 10 : 0
      })(),
      items
    }))
    .sort((a, b) => b.tests - a.tests)

  /* ── departments ── */
  const depMap = new Map<string, { tests: number; done: number; running: number; tatSum: number; tatN: number }>()
  for (const { t, r } of allTests) {
    let e = depMap.get(t.dept)
    if (!e) {
      e = { tests: 0, done: 0, running: 0, tatSum: 0, tatN: 0 }
      depMap.set(t.dept, e)
    }
    e.tests++
    if (t.status === 'completed') {
      e.done++
      e.tatSum += r.tatDays
      e.tatN++
    } else if (t.status === 'in_progress') e.running++
  }
  const departments = [...depMap.entries()]
    .map(([dept, e]) => ({
      dept,
      tests: e.tests,
      done: e.done,
      running: e.running,
      tatDays: e.tatN ? Math.round((e.tatSum / e.tatN) * 10) / 10 : 0
    }))
    .sort((a, b) => b.tests - a.tests)

  /* ── abnormal share per test ── */
  const abMap = new Map<string, { abnormal: number; total: number }>()
  for (const { t } of allTests) {
    if (t.status !== 'completed' || !t.result) continue
    let e = abMap.get(t.name)
    if (!e) {
      e = { abnormal: 0, total: 0 }
      abMap.set(t.name, e)
    }
    e.total++
    if (t.result !== 'normal') e.abnormal++
  }
  const abnormalByTest = [...abMap.entries()]
    .map(([test, e]) => ({ test, abnormal: e.abnormal, total: e.total, pct: e.total ? Math.round((e.abnormal / e.total) * 100) : 0 }))
    .filter(x => x.total >= 3)
    .sort((a, b) => b.pct - a.pct)

  const containersTotal = requests.reduce((s, r) => s + r.containers, 0)
  const containersRejected = rejectedRequests.length // one bad container per rejected request

  return {
    requests,
    totals,
    avgTatDays,
    testsTotal,
    testsDone,
    detections,
    detectionCount,
    repeatSameTest,
    rejectedRequests,
    resubmitsOpen,
    rejectReasons,
    agingPending,
    agingUrgent,
    byDoctor,
    bySite,
    byHospital,
    byLab,
    departments,
    abnormalByTest,
    containersTotal,
    containersRejected
  }
}
