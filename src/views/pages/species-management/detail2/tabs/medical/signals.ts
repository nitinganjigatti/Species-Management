/*
 * Health-signal + insight computation for the Medical tab (Overview signals band and the
 * Insights sub-tab). Pure functions over the clinical/preventive sidecars — no React, so
 * every rule is unit-testable and the period filter composes via the caller's `inWin`.
 */
import type { ClinicalRecord, SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'

export const INSIGHT_THRESHOLDS = {
  repeatEpisodes: 3, // episodes (any condition) in window → repeat-sick
  relapseEpisodes: 2, // same condition on the same animal → relapse
  relapseGapDays: 14, // min gap between same-condition onsets to count as a return, not a re-log
  spreadStepDays: 21, // max days between consecutive onsets of one enclosure chain
  spreadMinAnimals: 3, // distinct animals for a chain to signal
  outbreakMinAnimals: 3, // distinct animals, same site + category…
  outbreakSpanDays: 30, // …within this many days → outbreak cluster
  stuckDays: 21, // active this long without resolving → stuck
  undiagnosedDays: 7, // symptom active this long with no assessment → undiagnosed
  paretoShare: 0.6, // care-load: smallest animal group covering this share of events
  hotspotHotMult: 1.3, // site sick-share ≥ this × collection average → "running hot"
  hotspotMinSick: 2 // …and at least this many sick animals (one animal ≠ a hotspot)
} as const

export type SignalSeverity = 'critical' | 'watch' | 'review'
export type SignalKey =
  | 'spreading'
  | 'outbreak'
  | 'repeat'
  | 'relapse'
  | 'worsening'
  | 'stuck'
  | 'undiagnosed'
  | 'deaths'

/** One row inside a signal drawer — an animal plus why it's listed. */
export interface SignalAnimal {
  aid: string
  name: string
  site: string
  enclosure: string
  condition?: string // the symptom/condition — drawer renders it prominent, date beside it
  detail: string // extra caption, e.g. "5 illnesses · 4 conditions" / "Open 34 days"
  pill?: string // right-side status pill, e.g. "Active · 26 d"
  pillTone?: 'error' | 'warning' | 'success' | 'neutral'
  date?: string // latest relevant onset (drawer sort + display)
}

/** A same-condition transmission chain inside one enclosure (spreading / outbreak groups). */
export interface SignalChain {
  site: string
  enclosure: string
  type: string
  category: string
  firstOnset: string
  lastOnset: string
  activeCount: number
  animals: SignalAnimal[]
}

export interface HealthSignal {
  key: SignalKey
  label: string
  severity: SignalSeverity
  icon: string
  count: number // the headline number on the card
  hint: string // one-line card copy naming the worst offender
  explainer: string // drawer subtitle: what the signal means + the acted-on threshold
  animals: SignalAnimal[]
  chains?: SignalChain[]
}

type InWin = (s?: string) => boolean

const allRecords = (clinical: SpeciesClinical | null | undefined, inWin: InWin): ClinicalRecord[] => {
  const out: ClinicalRecord[] = []
  for (const key of ['symptoms', 'diagnosis'] as const) {
    for (const r of clinical?.programs?.[key]?.records ?? []) if (inWin(r.date)) out.push(r)
  }

  return out
}

const daysBetween = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000

/** "2026-06-12" → "12 Jun 2026" (module-standard date display). */
export const fmtDate = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)

  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const newestFirst = (a: SignalAnimal, b: SignalAnimal) => ((a.date ?? '') < (b.date ?? '') ? 1 : -1)

/** Plain-language bout summary — "Pneumonia · 3 times" / "Sick 5 times · Lameness, Wound, …".
 *  Lists EVERY distinct condition — the sheet row caption wraps, never truncates. */
const episodeSummary = (recs: ClinicalRecord[]) => {
  const types = [...new Set(recs.map(r => r.type))]

  return types.length === 1 ? `${types[0]} · ${recs.length} times` : `Sick ${recs.length} times · ${types.join(', ')}`
}

/* ── the 8 signals ─────────────────────────────────────────────────────────── */

export const computeSignals = (
  clinical: SpeciesClinical | null | undefined,
  inWin: InWin
): HealthSignal[] => {
  const T = INSIGHT_THRESHOLDS
  const recs = allRecords(clinical, inWin)
  const symptomRecs = (clinical?.programs?.symptoms?.records ?? []).filter(r => inWin(r.date))
  const diagnosisAids = new Set((clinical?.programs?.diagnosis?.records ?? []).map(r => r.aid))

  const byAnimal = new Map<string, ClinicalRecord[]>()
  for (const r of recs) {
    if (!byAnimal.has(r.aid)) byAnimal.set(r.aid, [])
    byAnimal.get(r.aid)!.push(r)
  }

  /* spreading — same condition, same enclosure, consecutive onsets ≤ spreadStepDays apart */
  const chainMap = new Map<string, ClinicalRecord[]>()
  for (const r of recs) {
    const k = `${r.site}|${r.enclosure}|${r.type}`
    if (!chainMap.has(k)) chainMap.set(k, [])
    chainMap.get(k)!.push(r)
  }
  const chains: SignalChain[] = []
  for (const group of chainMap.values()) {
    const sorted = [...group].sort((a, b) => (a.date < b.date ? -1 : 1))
    // walk onsets; keep the longest run whose consecutive gaps stay within the step
    let run: ClinicalRecord[] = []
    let best: ClinicalRecord[] = []
    for (const r of sorted) {
      if (!run.length || daysBetween(run[run.length - 1].date, r.date) <= T.spreadStepDays) run.push(r)
      else {
        if (run.length > best.length) best = run
        run = [r]
      }
    }
    if (run.length > best.length) best = run
    const aids = [...new Set(best.map(r => r.aid))]
    if (aids.length < T.spreadMinAnimals) continue
    const active = best.filter(r => r.status === 'active')
    if (!active.length) continue // fully resolved chains are history, not a containment call
    const f = best[0]
    chains.push({
      site: f.site,
      enclosure: f.enclosure,
      type: f.type,
      category: f.category ?? 'General',
      firstOnset: best[0].date,
      lastOnset: best[best.length - 1].date,
      activeCount: active.length,
      animals: best.map((r, i) => ({
        aid: r.aid,
        name: r.name,
        site: r.site,
        enclosure: r.enclosure,
        condition: r.type,
        detail: i === 0 ? 'Index case' : '',
        pill: r.status === 'active' ? `Active · ${r.durationDays} d` : 'Resolved',
        pillTone: r.status === 'active' ? 'error' : 'success',
        date: r.date
      }))
    })
  }
  chains.sort((a, b) => (a.lastOnset < b.lastOnset ? 1 : -1))

  /* outbreak — same site + category, ≥ N distinct animals inside the span window */
  const outbreakMap = new Map<string, ClinicalRecord[]>()
  for (const r of recs) {
    const k = `${r.site}|${r.category ?? 'General'}`
    if (!outbreakMap.has(k)) outbreakMap.set(k, [])
    outbreakMap.get(k)!.push(r)
  }
  const outbreaks: SignalChain[] = []
  for (const group of outbreakMap.values()) {
    const sorted = [...group].sort((a, b) => (a.date < b.date ? -1 : 1))
    // sliding window over onsets: any span-days stretch touching enough distinct animals
    for (let i = 0; i < sorted.length; i++) {
      const windowRecs = sorted.filter(
        r => r.date >= sorted[i].date && daysBetween(sorted[i].date, r.date) <= T.outbreakSpanDays
      )
      const aids = [...new Set(windowRecs.map(r => r.aid))]
      if (aids.length >= T.outbreakMinAnimals && windowRecs.some(r => r.status === 'active')) {
        const f = windowRecs[0]
        // skip clusters that are really just one spreading chain (already signalled there)
        const isChainDupe = chains.some(
          c => c.site === f.site && windowRecs.every(r => r.enclosure === c.enclosure && r.type === c.type)
        )
        if (!isChainDupe) {
          outbreaks.push({
            site: f.site,
            enclosure: [...new Set(windowRecs.map(r => r.enclosure))].length > 1 ? 'Multiple enclosures' : f.enclosure,
            type: [...new Set(windowRecs.map(r => r.type))].join(' · '),
            category: f.category ?? 'General',
            firstOnset: windowRecs[0].date,
            lastOnset: windowRecs[windowRecs.length - 1].date,
            activeCount: windowRecs.filter(r => r.status === 'active').length,
            animals: windowRecs.map(r => ({
              aid: r.aid,
              name: r.name,
              site: r.site,
              enclosure: r.enclosure,
              condition: r.type,
              detail: '',
              pill: r.status === 'active' ? `Active · ${r.durationDays} d` : 'Resolved',
              pillTone: r.status === 'active' ? 'error' : 'success',
              date: r.date
            }))
          })
        }
        break // one cluster per site+category is enough of a flag
      }
    }
  }

  /* repeat-sick — ≥ N episodes of anything */
  const repeat: SignalAnimal[] = []
  for (const list of byAnimal.values()) {
    if (list.length < T.repeatEpisodes) continue
    const latest = [...list].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    repeat.push({
      aid: latest.aid,
      name: latest.name,
      site: latest.site,
      enclosure: latest.enclosure,
      detail: episodeSummary(list),
      pill: `${list.length} times`,
      pillTone: 'warning',
      date: latest.date
    })
  }
  repeat.sort((a, b) => parseInt(b.pill ?? '0') - parseInt(a.pill ?? '0'))

  /* relapse — same condition returning on the same animal after a real gap */
  const relapse: SignalAnimal[] = []
  for (const list of byAnimal.values()) {
    const byType = new Map<string, ClinicalRecord[]>()
    for (const r of list) {
      if (!byType.has(r.type)) byType.set(r.type, [])
      byType.get(r.type)!.push(r)
    }
    for (const [type, tr] of byType) {
      if (tr.length < T.relapseEpisodes) continue
      const sorted = [...tr].sort((a, b) => (a.date < b.date ? -1 : 1))
      const hasGap = sorted.some((r, i) => i > 0 && daysBetween(sorted[i - 1].date, r.date) >= T.relapseGapDays)
      if (!hasGap) continue
      const latest = sorted[sorted.length - 1]
      relapse.push({
        aid: latest.aid,
        name: latest.name,
        site: latest.site,
        enclosure: latest.enclosure,
        condition: type,
        detail: `${tr.length} times`,
        pill: latest.status === 'active' ? 'Active again' : 'Resolved',
        pillTone: latest.status === 'active' ? 'error' : 'success',
        date: latest.date
      })
      break // one relapsing condition is enough to list the animal once
    }
  }
  relapse.sort(newestFirst)

  /* worsening — active case whose severity climbed from a lower start */
  const worsening: SignalAnimal[] = recs
    .filter(r => r.status === 'active' && r.severityFrom && r.severity && r.severityFrom !== r.severity)
    .map(r => ({
      aid: r.aid,
      name: r.name,
      site: r.site,
      enclosure: r.enclosure,
      condition: r.type,
      detail: `${r.severityFrom} → ${r.severity}`,
      pill: `Active · ${r.durationDays} d`,
      pillTone: 'error' as const,
      date: r.date
    }))
    .sort(newestFirst)

  /* stuck — active too long */
  const stuck: SignalAnimal[] = recs
    .filter(r => r.status === 'active' && r.durationDays >= T.stuckDays)
    .map(r => ({
      aid: r.aid,
      name: r.name,
      site: r.site,
      enclosure: r.enclosure,
      condition: r.type,
      detail: `Open ${r.durationDays} days`,
      pill: `${r.durationDays} d`,
      pillTone: 'warning' as const,
      date: r.date
    }))
    .sort((a, b) => parseInt(b.pill ?? '0') - parseInt(a.pill ?? '0'))

  /* undiagnosed — week-old active symptom, animal has no assessment at all */
  const undiagnosedMap = new Map<string, ClinicalRecord>()
  for (const r of symptomRecs) {
    if (r.status !== 'active' || r.durationDays < T.undiagnosedDays || diagnosisAids.has(r.aid)) continue
    const prev = undiagnosedMap.get(r.aid)
    if (!prev || r.durationDays > prev.durationDays) undiagnosedMap.set(r.aid, r)
  }
  const undiagnosed: SignalAnimal[] = [...undiagnosedMap.values()]
    .map(r => ({
      aid: r.aid,
      name: r.name,
      site: r.site,
      enclosure: r.enclosure,
      condition: r.type,
      detail: `${r.durationDays} days, no assessment`,
      pill: `${r.durationDays} d`,
      pillTone: 'warning' as const,
      date: r.date
    }))
    .sort((a, b) => parseInt(b.pill ?? '0') - parseInt(a.pill ?? '0'))

  /* illness deaths — episode ended in death */
  const deaths: SignalAnimal[] = recs
    .filter(r => r.outcome === 'died')
    .map(r => ({
      aid: r.aid,
      name: r.name,
      site: r.site,
      enclosure: r.enclosure,
      condition: r.type,
      detail: '',
      pill: 'Died',
      pillTone: 'error' as const,
      date: r.date
    }))
    .sort(newestFirst)

  const signals: HealthSignal[] = [
    {
      key: 'spreading',
      label: 'Spreading — contain',
      severity: 'critical',
      icon: 'mdi:share-variant',
      count: chains.length,
      hint: chains.length
        ? `${chains[0].type} moving through ${chains[0].enclosure} · ${chains[0].animals.length} animals`
        : '',
      explainer: `The same condition is appearing across enclosure-mates within ${T.spreadStepDays} days of each other. Isolate the still-active animals to break the chain.`,
      animals: chains.flatMap(c => c.animals),
      chains
    },
    {
      key: 'outbreak',
      label: 'Same illness in site',
      severity: 'critical',
      icon: 'mdi:radar',
      count: outbreaks.length,
      hint: outbreaks.length
        ? `${outbreaks[0].animals.length} ${outbreaks[0].category.toLowerCase()} cases at ${outbreaks[0].site} within ${T.outbreakSpanDays} days`
        : '',
      explainer: `${T.outbreakMinAnimals}+ animals at one site fell sick with the same body-system category inside ${T.outbreakSpanDays} days — a shared cause (environment, feed, contagion) is likely.`,
      animals: outbreaks.flatMap(c => c.animals),
      chains: outbreaks
    },
    {
      key: 'repeat',
      label: 'Repeat-sick animals',
      severity: 'watch',
      icon: 'mdi:repeat',
      count: repeat.length,
      hint: repeat.length ? `${T.repeatEpisodes}+ illnesses each · worst ${repeat[0].name} (${repeat[0].pill})` : '',
      explainer: `Animals that fell sick ${T.repeatEpisodes}+ separate times in this window — fragile animals that need a deeper look, whatever each illness was.`,
      animals: repeat
    },
    {
      key: 'relapse',
      label: 'Relapse',
      severity: 'watch',
      icon: 'mdi:restart-alert',
      count: relapse.length,
      hint: relapse.length ? `Same condition returning · ${relapse[0].condition} in ${relapse[0].name}` : '',
      explainer: `The same condition came back on the same animal after a ${T.relapseGapDays}+ day gap — treatment may not be holding, or the cause was never removed.`,
      animals: relapse
    },
    {
      key: 'worsening',
      label: 'Worsening',
      severity: 'watch',
      icon: 'mdi:trending-up',
      count: worsening.length,
      hint: worsening.length ? `${worsening[0].name} · ${worsening[0].condition} ${worsening[0].detail}` : '',
      explainer: 'Active cases whose severity has climbed since they were first reported — getting worse under care.',
      animals: worsening
    },
    {
      key: 'stuck',
      label: 'Stuck cases',
      severity: 'watch',
      icon: 'mdi:timer-sand',
      count: stuck.length,
      hint: stuck.length ? `Active >${T.stuckDays} days · longest ${stuck[0].pill} (${stuck[0].name})` : '',
      explainer: `Cases still active after ${T.stuckDays} days — these animals are not recovering on the current course.`,
      animals: stuck
    },
    {
      key: 'undiagnosed',
      label: 'Undiagnosed',
      severity: 'review',
      icon: 'mdi:magnify',
      count: undiagnosed.length,
      hint: undiagnosed.length ? `Oldest symptom ${undiagnosed[0].pill} without an assessment` : '',
      explainer: `Animals with a symptom active for ${T.undiagnosedDays}+ days and no clinical assessment on record — nobody has examined them yet.`,
      animals: undiagnosed
    },
    {
      key: 'deaths',
      label: 'Illness deaths',
      severity: 'review',
      icon: 'mdi:heart-pulse',
      count: deaths.length,
      hint: deaths.length ? `${deaths[0].name} · ${deaths[0].condition}` : '',
      explainer: 'Illnesses in this window that ended in death rather than recovery — case review recommended.',
      animals: deaths
    }
  ]

  return signals
}

/* ── insights (the 7 analytics) ────────────────────────────────────────────── */

export interface InsightBarRow {
  label: string
  value: number
  display: string
  sub?: string
  cases?: number // hotspots/recovery: case count behind the number
  housed?: number // hotspots: census denominator
  sickAnimals?: number // hotspots: distinct sick animals at the site
  topCondition?: string // hotspots: the site's most frequent condition in the window
  overdueTotal?: number // preventive link: how many were overdue in total
  escalated?: number // conversion: cases that became a diagnosis
  totalCases?: number // conversion: symptom case total
  animals: SignalAnimal[] // the drill-down list behind the row
}

export interface SpeciesInsights {
  population: number
  /** % of population with any episode in the window + delta vs the previous equal window. */
  morbidity: { pct: number; prevPct: number | null; sickAnimals: number }
  trend: { label: string; value: number }[] // monthly % of population sick (trailing 12 mo)
  trendAnimals: SignalAnimal[][] // per trend bucket, the animals behind the point
  risingStreak: number // consecutive month-over-month rises ending at the latest month
  hotspots: InsightBarRow[] // % of each site's animals that fell sick, worst first
  hotspotAvg: number // collection-wide % of housed animals that fell sick (the benchmark)
  recovery: InsightBarRow[] // avg days-to-resolve, by condition
  seasonality: { label: string; value: number; animals: SignalAnimal[] }[] // calendar-month onsets
  conversion: InsightBarRow[] // % of each symptom type that escalated to a diagnosis
  preventiveLink: InsightBarRow[] // sick-while-overdue counts per preventive program
  pareto: { topCount: number; sharePct: number; totalEvents: number; coveredEvents: number; rows: InsightBarRow[] }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const toAnimalRow = (r: ClinicalRecord, detail?: string): SignalAnimal => ({
  aid: r.aid,
  name: r.name,
  site: r.site,
  enclosure: r.enclosure,
  condition: r.type,
  detail: detail ?? '',
  pill: r.status === 'active' ? `Active · ${r.durationDays} d` : r.outcome === 'died' ? 'Died' : 'Resolved',
  pillTone: r.status === 'active' || r.outcome === 'died' ? 'error' : 'success',
  date: r.date
})

/** Distinct animals per row, newest episode wins the display. */
const distinctAnimals = (rows: SignalAnimal[]): SignalAnimal[] => {
  const seen = new Map<string, SignalAnimal>()
  for (const a of rows) if (!seen.has(a.aid) || (seen.get(a.aid)!.date ?? '') < (a.date ?? '')) seen.set(a.aid, a)

  return [...seen.values()].sort(newestFirst)
}

export const computeInsights = (
  clinical: SpeciesClinical | null | undefined,
  preventive: SpeciesPreventive | null | undefined,
  inWin: InWin,
  windowBounds: { from: Date | null; to: Date },
  now: Date
): SpeciesInsights => {
  const T = INSIGHT_THRESHOLDS
  const recs = allRecords(clinical, inWin)
  const population = clinical?.animalCount ?? preventive?.animalCount ?? 0

  /* morbidity + delta vs the previous equal-length window */
  const sickNow = new Set(recs.map(r => r.aid))
  let prevPct: number | null = null
  if (windowBounds.from) {
    const span = windowBounds.to.getTime() - windowBounds.from.getTime()
    const prevFrom = windowBounds.from.getTime() - span
    const prevTo = windowBounds.from.getTime()
    const prevAids = new Set<string>()
    for (const key of ['symptoms', 'diagnosis'] as const) {
      for (const r of clinical?.programs?.[key]?.records ?? []) {
        const t = new Date(r.date).getTime()
        if (t >= prevFrom && t < prevTo) prevAids.add(r.aid)
      }
    }
    prevPct = population ? Math.round((prevAids.size / population) * 1000) / 10 : null
  }
  const morbidity = {
    pct: population ? Math.round((sickNow.size / population) * 1000) / 10 : 0,
    prevPct,
    sickAnimals: sickNow.size
  }

  /* monthly sickness-rate trend (trailing 12 months, distinct animals / population) */
  const trend: { label: string; value: number }[] = []
  const trendAnimals: SignalAnimal[][] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthRecs = recs.filter(r => {
      const rd = new Date(r.date)

      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
    })
    const aids = distinctAnimals(monthRecs.map(r => toAnimalRow(r)))
    trend.push({
      label: `${MONTH_LABELS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      value: population ? Math.round((aids.length / population) * 1000) / 10 : 0
    })
    trendAnimals.push(aids)
  }

  // Rising streak: consecutive month-over-month increases ending at the latest bucket.
  let risingStreak = 0
  for (let i = trend.length - 1; i > 0; i--) {
    if (trend[i].value > trend[i - 1].value) risingStreak++
    else break
  }

  /* site hotspots — share of each site's animals that fell sick (census from the sidecar) */
  const { rows: hotspots, avg: hotspotAvg } = computeHotspots(clinical, inWin)

  /* recovery time by condition (resolved, excluding deaths) */
  const byType = new Map<string, ClinicalRecord[]>()
  for (const r of recs) {
    if (r.status !== 'resolved' || r.outcome === 'died') continue
    if (!byType.has(r.type)) byType.set(r.type, [])
    byType.get(r.type)!.push(r)
  }
  const recovery: InsightBarRow[] = [...byType.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([type, list]) => {
      const avg = Math.round(list.reduce((s, r) => s + r.durationDays, 0) / list.length)

      return {
        label: type,
        value: avg,
        display: `${avg}d`,
        sub: `${list.length} resolved cases`,
        cases: list.length,
        animals: list.map(r => toAnimalRow(r, `Resolved in ${r.durationDays} days`)).sort(newestFirst)
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  /* seasonality — onsets per calendar month across the window */
  const seasonality = MONTH_LABELS.map(label => ({ label, value: 0, animals: [] as SignalAnimal[] }))
  for (const r of recs) {
    const m = new Date(r.date).getMonth()
    seasonality[m].value++
    seasonality[m].animals.push(toAnimalRow(r))
  }
  for (const s of seasonality) s.animals = distinctAnimals(s.animals)

  /* symptom → diagnosis conversion: same animal diagnosed within 45 days of the symptom */
  const CONVERT_DAYS = 45
  const diagByAid = new Map<string, ClinicalRecord[]>()
  for (const r of clinical?.programs?.diagnosis?.records ?? []) {
    if (!diagByAid.has(r.aid)) diagByAid.set(r.aid, [])
    diagByAid.get(r.aid)!.push(r)
  }
  const sympByType = new Map<string, ClinicalRecord[]>()
  for (const r of (clinical?.programs?.symptoms?.records ?? []).filter(r => inWin(r.date))) {
    if (!sympByType.has(r.type)) sympByType.set(r.type, [])
    sympByType.get(r.type)!.push(r)
  }
  const conversion: InsightBarRow[] = [...sympByType.entries()]
    .filter(([, list]) => list.length >= 3)
    .map(([type, list]) => {
      const escalated = list.filter(s =>
        (diagByAid.get(s.aid) ?? []).some(d => d.date >= s.date && daysBetween(s.date, d.date) <= CONVERT_DAYS)
      )
      const pct = Math.round((escalated.length / list.length) * 100)

      return {
        label: type,
        value: pct,
        display: `${pct}%`,
        sub: `${escalated.length} of ${list.length} cases`,
        escalated: escalated.length,
        totalCases: list.length,
        animals: distinctAnimals(escalated.map(r => toAnimalRow(r, `Diagnosed within ${CONVERT_DAYS} days`)))
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  /* preventive ↔ sickness — fell sick while overdue on a program */
  const sickAids = new Set(recs.map(r => r.aid))
  const latestRec = new Map<string, ClinicalRecord>()
  for (const r of recs) {
    const prev = latestRec.get(r.aid)
    if (!prev || prev.date < r.date) latestRec.set(r.aid, r)
  }
  const preventiveLink: InsightBarRow[] = (['vaccination', 'deworming', 'supplements'] as const)
    .map(key => {
      const overdueAids = new Set(
        (preventive?.programs?.[key]?.records ?? []).filter(r => r.status === 'overdue').map(r => r.aid)
      )
      const both = [...sickAids].filter(aid => overdueAids.has(aid))
      const label = `Overdue ${key}`

      return {
        label,
        value: both.length,
        display: String(both.length),
        sub: `of ${overdueAids.size} overdue animals`,
        overdueTotal: overdueAids.size,
        animals: both
          .map(aid => {
            const r = latestRec.get(aid)!

            // sheet title already says "Overdue <program>" — rows carry only condition + date
            return toAnimalRow(r)
          })
          .sort(newestFirst)
      }
    })
    .sort((a, b) => b.value - a.value)

  /* care-load pareto */
  const perAnimal = new Map<string, ClinicalRecord[]>()
  for (const r of recs) {
    if (!perAnimal.has(r.aid)) perAnimal.set(r.aid, [])
    perAnimal.get(r.aid)!.push(r)
  }
  const ranked = [...perAnimal.entries()].sort((a, b) => b[1].length - a[1].length)
  const totalEvents = recs.length
  let cum = 0
  let topCount = 0
  for (const [, list] of ranked) {
    cum += list.length
    topCount++
    if (totalEvents && cum / totalEvents >= T.paretoShare) break
  }
  const pareto = {
    topCount: totalEvents ? topCount : 0,
    sharePct: totalEvents ? Math.round((cum / totalEvents) * 100) : 0,
    totalEvents,
    coveredEvents: totalEvents ? cum : 0,
    rows: ranked.slice(0, 10).map(([aid, list]) => {
      const latest = [...list].sort((a, b) => (a.date < b.date ? 1 : -1))[0]

      return {
        label: latest.name,
        value: list.length,
        display: String(list.length),
        sub: episodeSummary(list),
        animals: [
          {
            aid,
            name: latest.name,
            site: latest.site,
            enclosure: latest.enclosure,
            detail: episodeSummary(list),
            pill: `${list.length} events`,
            pillTone: 'warning' as const,
            date: latest.date
          }
        ]
      }
    })
  }

  return {
    population,
    morbidity,
    trend,
    trendAnimals,
    risingStreak,
    hotspots,
    hotspotAvg,
    recovery,
    seasonality,
    conversion,
    preventiveLink,
    pareto
  }
}

/* ── standalone site hotspots (Overview card + computeInsights) ────────────── */

export interface HotspotsResult {
  rows: InsightBarRow[] // one per site — % of its animals sick, worst first
  avg: number // collection-wide % of housed animals that fell sick
  sickTotal: number // distinct sick animals across the collection in the window
}
export const computeHotspots = (clinical: SpeciesClinical | null | undefined, inWin: InWin): HotspotsResult => {
  const recs = allRecords(clinical, inWin)
  const siteCensus = new Map((clinical?.sites ?? []).map(s => [s.name, s.animals]))
  const bySite = new Map<string, ClinicalRecord[]>()
  for (const r of recs) {
    if (!bySite.has(r.site)) bySite.set(r.site, [])
    bySite.get(r.site)!.push(r)
  }
  const censusTotal = [...siteCensus.values()].reduce((s, n) => s + n, 0)
  const sickTotal = new Set(recs.map(r => r.aid)).size
  const avg = censusTotal ? Math.round((sickTotal / censusTotal) * 100) : 0
  const rows: InsightBarRow[] = [...bySite.entries()]
    .map(([site, list]) => {
      const housed = siteCensus.get(site) ?? 0
      const animals = distinctAnimals(list.map(r => toAnimalRow(r)))
      const pct = housed ? Math.round((animals.length / housed) * 100) : 0
      const perType = new Map<string, number>()
      for (const r of list) perType.set(r.type, (perType.get(r.type) ?? 0) + 1)
      const top = [...perType.entries()].sort((a, b) => b[1] - a[1])[0]

      return {
        label: site,
        value: pct,
        display: `${pct}%`,
        sub: `${animals.length} of ${housed} animals`,
        cases: list.length,
        housed,
        sickAnimals: animals.length,
        topCondition: top?.[0],
        animals
      }
    })
    .sort((a, b) => b.value - a.value)

  return { rows, avg, sickTotal }
}

/* ── standalone sickness trend (Insights hero) ─────────────────────────────── */

/** Sick-animal COUNTS per month over the requested span (12/24/36 months, or null = all
 *  history, capped at 10 years). Independent of the page window — the hero chart has its own
 *  1Y·2Y·3Y·All tabs. */
export interface SickTrend {
  labels: string[]
  values: number[]
  animals: SignalAnimal[][]
}
export const computeSickTrend = (clinical: SpeciesClinical | null | undefined, months: number | null, now: Date): SickTrend => {
  const recs = allRecords(clinical, () => true)

  let span = months
  if (span == null) {
    let earliest = now.getTime()
    for (const r of recs) {
      const t = new Date(r.date).getTime()
      if (!isNaN(t) && t < earliest) earliest = t
    }
    const e = new Date(earliest)
    span = Math.max(12, Math.min((now.getFullYear() - e.getFullYear()) * 12 + (now.getMonth() - e.getMonth()) + 1, 120))
  }

  const byMonth = new Map<string, ClinicalRecord[]>()
  for (const r of recs) {
    const d = new Date(r.date)
    if (isNaN(d.getTime())) continue
    const k = `${d.getFullYear()}-${d.getMonth()}`
    if (!byMonth.has(k)) byMonth.set(k, [])
    byMonth.get(k)!.push(r)
  }

  const labels: string[] = []
  const values: number[] = []
  const animals: SignalAnimal[][] = []
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const aids = distinctAnimals((byMonth.get(`${d.getFullYear()}-${d.getMonth()}`) ?? []).map(r => toAnimalRow(r)))
    labels.push(`${MONTH_LABELS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`)
    values.push(aids.length)
    animals.push(aids)
  }

  return { labels, values, animals }
}
