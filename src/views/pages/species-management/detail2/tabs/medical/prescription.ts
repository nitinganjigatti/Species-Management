/*
 * Prescription (curative medicine) rollup for ONE species — derived from the clinical sidecar we
 * already load, same style as lab.ts / hospital.ts. Every clinical episode (symptom / diagnosis)
 * raises 1–2 medicine courses (medicine, duration and doses decided by deterministic hashes), so
 * an animal's prescriptions line up with its clinical story. Unlike the preventive programs there
 * is NO schedule here — nothing can be overdue or upcoming; the frame is usage + recency.
 * Pure functions, no React. TODO(API): swap buildPrescriptionProgram for the real species-scoped
 * prescription endpoint (prescriptions → medical_record_animals join) when it lands.
 */
import type {
  ClinicalRecord,
  PreventiveDoseSpec,
  PreventiveSite,
  PreventiveType,
  PreventiveTypeAnimal,
  SpeciesClinical
} from 'src/lib/api/species-management/detail'

// Deterministic pseudo-hash so every derived value is stable across renders (no Math.random).
const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }

  return (h >>> 0) / 0xffffffff // 0..1
}

/** Curative medicine catalog — route + standard dose. perKg doses scale with animal weight. */
const RX_CATALOG: { name: string; route: string; dose: PreventiveDoseSpec }[] = [
  { name: 'Meloxicam', route: 'Oral', dose: { qty: 0.2, unit: 'mg', perKg: true } },
  { name: 'Enrofloxacin', route: 'Injection', dose: { qty: 5, unit: 'mg', perKg: true } },
  { name: 'Amoxicillin-Clavulanate', route: 'Oral', dose: { qty: 12.5, unit: 'mg', perKg: true } },
  { name: 'Tramadol', route: 'Oral', dose: { qty: 2, unit: 'mg', perKg: true } },
  { name: 'Metronidazole', route: 'Oral', dose: { qty: 25, unit: 'mg', perKg: true } },
  { name: 'Ceftriaxone', route: 'Injection', dose: { qty: 20, unit: 'mg', perKg: true } },
  { name: 'Electral', route: 'Oral', dose: { qty: 21.8, unit: 'g' } },
  { name: 'Vitamin B-Complex', route: 'Injection', dose: { qty: 2, unit: 'ml' } },
  { name: 'Ondansetron', route: 'Injection', dose: { qty: 0.5, unit: 'mg', perKg: true } },
  { name: 'Silymarin', route: 'Oral', dose: { qty: 140, unit: 'mg' } },
  { name: 'Tolfenamic Acid', route: 'Injection', dose: { qty: 4, unit: 'mg', perKg: true } },
  { name: 'Furosemide', route: 'Oral', dose: { qty: 2, unit: 'mg', perKg: true } }
]

/** A scheduled dose that did NOT happen — skipped (withheld with a reason) or stopped
 *  (course discontinued early). Mirrors the hospital module's per-slot statuses. */
export interface RxMissedDose {
  aid: string
  name: string
  site: string
  date: string
  kind: 'skipped' | 'stopped'
  reason: string
}

/** One medicine's species-level rollup. Shaped as a PreventiveType (status fields zeroed — no
 *  schedule exists) so the Most Used section, month drills and dose-history sheets reuse as-is. */
export interface RxMedicine extends PreventiveType {
  route: string
  courses: number // prescriptions written
  dosesGiven: number
  dosesMissed: number
  given30: number // distinct animals with a dose in the last 30 days
  given60: number // …last 60 days (cumulative — includes the 30-day animals)
  lastGiven?: string
  missedPerMonth: number[] // aligned to RxProgram.months — skipped + stopped doses
  missed: RxMissedDose[] // newest first
}

/** One prescription (course): an animal put on one medicine from one clinical episode. */
export interface RxCourse {
  aid: string
  name: string
  site: string
  medicine: string
  route: string
  start: string
  doses: number
  last: string // newest dose date of the course
}

export interface RxProgram {
  months: string[] // "Aug '23" labels — every medicine's dosesPerMonth aligns to these
  medicines: RxMedicine[]
  courses: RxCourse[]
  summary: {
    prescriptions: number
    animalsTreated: number
    given30: number
    given60: number
    medicinesUsed: number
    dosesMissed: number
  }
  /** Minimal site rows for the Most Used site filter (animals = treated there). */
  sites: PreventiveSite[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_MS = 86400000

/* The hospital module requires a reason on every skip, and a note on every stop. */
const SKIP_REASONS = ['Animal refused feed', 'Vomited after dose', 'Under anaesthesia', 'Animal not accessible', 'Vet advised hold']
const STOP_REASONS = ['Recovered early', 'Adverse reaction', 'Treatment changed']

const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

/** How many medicines one clinical episode prescribes (1–2, rarely 3). */
const coursesFor = (h: number) => (h > 0.92 ? 3 : h > 0.55 ? 2 : 1)

export const buildPrescriptionProgram = (clinical: SpeciesClinical | null | undefined): RxProgram | null => {
  const records: ClinicalRecord[] = [
    ...(clinical?.programs?.symptoms?.records ?? []),
    ...(clinical?.programs?.diagnosis?.records ?? [])
  ]
  if (!records.length) return null

  const now = Date.now()
  const today = iso(now)

  // trailing 36 months, oldest first — same label format the preventive sidecar uses
  const months: string[] = []
  const monthIdx = new Map<string, number>()
  for (let i = 35; i >= 0; i--) {
    const d = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - i, 1)
    monthIdx.set(monthLabel(d), months.length)
    months.push(monthLabel(d))
  }

  interface Agg {
    cat: (typeof RX_CATALOG)[number]
    courses: number
    dosesGiven: number
    dosesMissed: number
    dosesPerMonth: number[]
    missedPerMonth: number[]
    missed: RxMissedDose[]
    lastGiven: string
    // per animal: dose dates (desc later), site, weight
    animals: Map<string, { name: string; site: string; doses: string[]; weightKg: number }>
  }
  const byMed = new Map<string, Agg>()
  const courses: RxCourse[] = []
  const treated = new Map<string, { last: string }>() // aid → newest dose overall
  const in30 = new Set<string>()
  const in60 = new Set<string>()

  for (const r of records) {
    const seed = `rx|${r.aid}|${r.type}|${r.date}`
    const n = coursesFor(hash(seed))
    // n distinct medicines for this episode, hash-picked with a stride so pairs vary
    const first = Math.floor(hash(seed + '|m') * RX_CATALOG.length)
    for (let ci = 0; ci < n; ci++) {
      const cat = RX_CATALOG[(first + ci * 5) % RX_CATALOG.length]
      const h = hash(`${seed}|${cat.name}`)
      const durationDays = 3 + Math.floor(h * 8) // 3–10 day course, one dose a day
      const startT = new Date(r.date).getTime()
      if (isNaN(startT) || startT > now) continue

      // ~8% of courses stop early (discontinued from a mid-course dose onward); ~10% of the
      // remaining scheduled doses are skipped — mirrors the hospital grid's slot statuses.
      const stopped = hash(`${seed}|${cat.name}|stop`) < 0.08
      const stopAt = stopped ? 2 + Math.floor(hash(`${seed}|${cat.name}|stopAt`) * Math.max(1, durationDays - 2)) : Infinity
      const stopReason = STOP_REASONS[Math.floor(hash(`${seed}|${cat.name}|stopWhy`) * STOP_REASONS.length)]

      const doseDates: string[] = []
      const missedNow: RxMissedDose[] = []
      for (let d = 0; d < durationDays; d++) {
        const t = startT + d * DAY_MS
        if (t > now) break
        const dd = iso(t)
        if (d >= stopAt) {
          missedNow.push({ aid: r.aid, name: r.name, site: r.site, date: dd, kind: 'stopped', reason: stopReason })
        } else if (d > 0 && hash(`${seed}|${cat.name}|d${d}`) < 0.1) {
          const reason = SKIP_REASONS[Math.floor(hash(`${seed}|${cat.name}|why${d}`) * SKIP_REASONS.length)]
          missedNow.push({ aid: r.aid, name: r.name, site: r.site, date: dd, kind: 'skipped', reason })
        } else {
          doseDates.push(dd)
        }
      }
      if (!doseDates.length) continue

      let agg = byMed.get(cat.name)
      if (!agg) {
        agg = {
          cat,
          courses: 0,
          dosesGiven: 0,
          dosesMissed: 0,
          dosesPerMonth: months.map(() => 0),
          missedPerMonth: months.map(() => 0),
          missed: [],
          lastGiven: '',
          animals: new Map()
        }
        byMed.set(cat.name, agg)
      }
      agg.courses++
      agg.dosesGiven += doseDates.length
      agg.dosesMissed += missedNow.length
      agg.missed.push(...missedNow)
      const last = doseDates[doseDates.length - 1]
      if (last > agg.lastGiven) agg.lastGiven = last
      for (const dd of doseDates) {
        const mi = monthIdx.get(monthLabel(new Date(dd)))
        if (mi != null) agg.dosesPerMonth[mi]++
        const age = (now - new Date(dd).getTime()) / DAY_MS
        if (age <= 30) in30.add(r.aid)
        if (age <= 60) in60.add(r.aid)
      }
      for (const m of missedNow) {
        const mi = monthIdx.get(monthLabel(new Date(m.date)))
        if (mi != null) agg.missedPerMonth[mi]++
      }

      const weightKg = Math.round((4 + hash(`w|${r.aid}`) * 56) * 10) / 10
      const an = agg.animals.get(r.aid) ?? { name: r.name, site: r.site, doses: [], weightKg }
      an.doses.push(...doseDates)
      agg.animals.set(r.aid, an)

      const t = treated.get(r.aid)
      if (!t || last > t.last) treated.set(r.aid, { last })
      courses.push({ aid: r.aid, name: r.name, site: r.site, medicine: cat.name, route: cat.route, start: r.date, doses: doseDates.length, last })
    }
  }
  if (!byMed.size) return null

  const cutoff = (days: number) => iso(now - days * DAY_MS)
  const d30 = cutoff(30)
  const d60 = cutoff(60)

  const medicines: RxMedicine[] = Array.from(byMed.values())
    .map(agg => {
      const animals: PreventiveTypeAnimal[] = Array.from(agg.animals.entries()).map(([aid, a]) => {
        const doses = [...new Set(a.doses)].sort().reverse() // newest first, deduped
        const amounts = doses.map(() =>
          agg.cat.dose.perKg ? Math.round(agg.cat.dose.qty * a.weightKg * 10) / 10 : agg.cat.dose.qty
        )

        return {
          aid,
          name: a.name,
          site: a.site,
          status: 'covered' as const,
          lastGiven: doses[0],
          doses,
          amounts,
          weightKg: a.weightKg
        }
      })
      const siteMap = new Map<string, number>()
      for (const a of animals) siteMap.set(a.site, (siteMap.get(a.site) ?? 0) + 1)

      return {
        name: agg.cat.name,
        schedule: agg.cat.route,
        intervalDays: 0,
        dose: agg.cat.dose,
        coveragePct: 100,
        covered: animals.length,
        due: 0,
        overdue: 0,
        never: 0,
        tracked: animals.length,
        sitesAffected: siteMap.size,
        sitesTotal: siteMap.size,
        sites: Array.from(siteMap.entries()).map(([site, n]) => ({ site, animals: n, coveragePct: 100, overdue: 0 })),
        coverageTrend: months.map(() => 0),
        dosesPerMonth: agg.dosesPerMonth,
        animals,
        route: agg.cat.route,
        courses: agg.courses,
        dosesGiven: agg.dosesGiven,
        dosesMissed: agg.dosesMissed,
        given30: animals.filter(a => (a.lastGiven ?? '') >= d30).length,
        given60: animals.filter(a => (a.lastGiven ?? '') >= d60).length,
        lastGiven: agg.lastGiven || undefined,
        missedPerMonth: agg.missedPerMonth,
        missed: agg.missed.sort((a, b) => (a.date < b.date ? 1 : -1))
      }
    })
    .sort((a, b) => b.tracked - a.tracked)

  // site rows for the Most Used filter — animals treated per site (only fields the filter reads)
  const siteAnimals = new Map<string, Set<string>>()
  for (const m of medicines)
    for (const a of m.animals) (siteAnimals.get(a.site) ?? siteAnimals.set(a.site, new Set()).get(a.site)!).add(a.aid)
  const sites: PreventiveSite[] = Array.from(siteAnimals.entries())
    .map(([site, set]) => ({
      site,
      animals: set.size,
      enclosures: 0,
      coveragePct: 0,
      overdue: 0,
      aging: { d0_30: 0, d30_90: 0, d90plus: 0 },
      topGap: null,
      trendPct: 0,
      spark: []
    }))
    .sort((a, b) => b.animals - a.animals)

  courses.sort((a, b) => (a.start < b.start ? 1 : -1)) // newest first

  return {
    months,
    medicines,
    courses,
    summary: {
      prescriptions: courses.length,
      animalsTreated: treated.size,
      given30: in30.size,
      given60: in60.size,
      medicinesUsed: medicines.length,
      dosesMissed: medicines.reduce((s, m) => s + m.dosesMissed, 0)
    },
    sites
  }
}

/** Per-animal rollup for the status sheet's Animals tab. */
export interface RxAnimalRollup {
  aid: string
  name: string
  site: string
  medicines: string[]
  courses: number
  lastGiven: string
}

export const rollupAnimals = (rx: RxProgram): RxAnimalRollup[] => {
  const map = new Map<string, RxAnimalRollup>()
  for (const cr of rx.courses) {
    const cur = map.get(cr.aid)
    if (cur) {
      cur.courses++
      if (!cur.medicines.includes(cr.medicine)) cur.medicines.push(cr.medicine)
      if (cr.last > cur.lastGiven) cur.lastGiven = cr.last
    } else {
      map.set(cr.aid, { aid: cr.aid, name: cr.name, site: cr.site, medicines: [cr.medicine], courses: 1, lastGiven: cr.last })
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.lastGiven < b.lastGiven ? 1 : -1))
}

export const today = () => iso(Date.now())
