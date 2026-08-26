/*
 * Hospital rollup for ONE species — derived from the clinical sidecar we already load (no new
 * data file). An "admission" is modelled from a clinical episode that needed hospital care:
 * every clinical episode maps to a hospital case, its length = the episode's durationDays, and a
 * deterministic hash on the animal id decides which hospital treated it and whether a surgery
 * (hospital or field) happened. Pure functions, no React — same testable style as signals.ts.
 */
import type { ClinicalRecord, SpeciesClinical } from 'src/lib/api/species-management/detail'

export const HOSPITAL_THRESHOLDS = {
  longStayDays: 7, // currently-admitted longer than this → "long stay"
  repeatAdmissions: 2, // this many admissions (12 mo) for one animal → "repeatedly hospitalised"
  hotMult: 1.3, // a hospital's caseload ≥ this × the average → "running hot"
  minCaseload: 2 // …and at least this many animals (one case ≠ a hotspot)
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

const HOSPITALS = [
  'Pinecrest Veterinary Hospital',
  'Brightwater Animal Care Center',
  'Riverside Wildlife Hospital',
  'Hillcrest Veterinary Clinic'
]

/* Surgery catalogs — deterministic picks by hash; complication rule MUST match computeHospital's
 * complications() (hash `${aid}|${admittedOn}|c` > 0.85) so the tab counts and the record agree. */
const SURGERY_NAMES = [
  'Exploratory laparotomy',
  'Wound debridement & closure',
  'Fracture fixation',
  'Abscess drainage',
  'Dental extraction',
  'Soft-tissue mass removal'
]
const SURGERY_APPROACHES = ['Ventral midline', 'Lateral', 'Dorsal', 'Minimally invasive']
const SURGEONS = ['Dr. Meera Nair', 'Dr. Arjun Rao', 'Dr. Kavya Menon', 'Dr. Dev Patel']
const ANESTHETISTS = ['Dr. Sana Iyer', 'Dr. Rohit Shetty']
const ANAESTHESIAS = ['Isoflurane (gas) · Ketamine induction', 'Sevoflurane (gas) · Propofol induction']
const COMPLICATIONS = [
  'Mild intra-operative bleeding — controlled',
  'Transient hypotension under anaesthesia — stabilised'
]

const pad2 = (n: number) => String(n).padStart(2, '0')

const deriveSurgeryDetail = (aid: string, admittedOn: string): SurgeryDetail => {
  const h = (salt: string) => hash(`${aid}|${admittedOn}|${salt}`)
  const startMin = 9 * 60 + Math.floor(h('st') * 6 * 60) // 09:00–15:00
  const durationMin = 35 + Math.floor(h('du') * 120) // 35–155 min
  const endMin = startMin + durationMin
  const hasComplication = hash(`${aid}|${admittedOn}|c`) > 0.85 // same rule as complications()

  return {
    name: SURGERY_NAMES[Math.floor(h('nm') * SURGERY_NAMES.length) % SURGERY_NAMES.length],
    typeOfSurgery: h('ty') > 0.6 ? 'Emergency' : 'Elective',
    approach: SURGERY_APPROACHES[Math.floor(h('ap') * SURGERY_APPROACHES.length) % SURGERY_APPROACHES.length],
    surgeon: SURGEONS[Math.floor(h('sg') * SURGEONS.length) % SURGEONS.length],
    secondarySurgeon: h('s2') > 0.6 ? SURGEONS[Math.floor(h('s3') * SURGEONS.length) % SURGEONS.length] : undefined,
    anesthetist: ANESTHETISTS[Math.floor(h('an') * ANESTHETISTS.length) % ANESTHETISTS.length],
    anaesthesia: ANAESTHESIAS[Math.floor(h('ad') * ANAESTHESIAS.length) % ANAESTHESIAS.length],
    startTime: `${pad2(Math.floor(startMin / 60))}:${pad2(startMin % 60)}`,
    endTime: `${pad2(Math.floor(endMin / 60))}:${pad2(endMin % 60)}`,
    durationMin,
    complications: hasComplication ? COMPLICATIONS[Math.floor(h('ct') * COMPLICATIONS.length) % COMPLICATIONS.length] : undefined,
    dietInstructions: 'Soft diet for 5 days · water ad lib',
    activityRestrictions: 'Enclosure rest for 7 days — no group release',
    notes: 'Recovery uneventful. Suture review in 10 days.'
  }
}

/** Full surgery record for an admission — mock values derived deterministically, but SHAPED
 *  like the real Antz hospital module's `SurgeryDetails` (surgery.ts) so a live-API swap is 1:1. */
export interface SurgeryDetail {
  name: string // surgery_name (from the Surgery Master catalog)
  typeOfSurgery: 'Elective' | 'Emergency'
  approach: string // surgical_approach
  surgeon: string
  secondarySurgeon?: string
  anesthetist: string
  anaesthesia: string
  startTime: string
  endTime: string
  durationMin: number
  complications?: string
  dietInstructions: string
  activityRestrictions: string
  notes: string
}

/** One derived hospital admission for an animal. */
export interface Admission {
  aid: string
  name: string
  site: string // origin site (where the animal lives)
  enclosure: string
  hospital: string // treating hospital
  condition: string
  admittedOn: string // = episode onset
  durationDays: number
  status: 'active' | 'resolved'
  outcome?: 'died'
  surgery?: 'hospital' | 'field' // whether a surgery happened, and where
  surgeryDetail?: SurgeryDetail
}

/** Per-animal rollup across all its admissions. */
export interface HospAnimal {
  aid: string
  name: string
  site: string
  enclosure: string
  admissions: Admission[]
  admissionCount: number
  currentlyAdmitted: boolean
  currentStayDays: number // days of the still-active admission (0 if none active)
  died: boolean
}

export interface HospitalRollup {
  animalCount: number
  hospitalisedNow: number // animals with an active admission
  inpatientNow: number
  outpatientNow: number
  repeatCount: number // animals with ≥ repeatAdmissions
  repeatWorst: number // highest admission count on any one animal
  longStay: HospAnimal[] // currently admitted > longStayDays, longest first
  mortality: Admission[] // admissions that ended in death, in window
  mortalityRate: number // deaths / total admissions (%)
  animals: HospAnimal[] // every animal that has ≥1 admission
  admissions: Admission[] // flat list
  byHospital: { name: string; animals: number; longStay: number; deaths: number; hot: boolean }[]
  repeatBySite: { site: string; animals: number; admissions: number }[]
  surgery: { total: number; hospital: number; field: number; hospitalComplications: number; fieldComplications: number }
}

/**
 * Build the species hospital rollup from clinical records. `inWin` filters admissions to the
 * active period (matches every other tab). Deterministic: same input → same output.
 */
/** Every clinical episode (symptom or diagnosis) mapped to an admission — UNWINDOWED.
 *  The admissions trend uses this directly (it has its own 1Y/2Y/All tabs); computeHospital
 *  windows it to the page period. */
export const buildAdmissions = (clinical: SpeciesClinical | null | undefined): Admission[] => {
  if (!clinical) return []
  const recs: ClinicalRecord[] = [
    ...(clinical.programs?.symptoms?.records ?? []),
    ...(clinical.programs?.diagnosis?.records ?? [])
  ]

  return recs.map(r => {
    const h = hash(`${r.aid}|${r.date}`)
    const surgery = h > 0.82 ? (h > 0.93 ? 'field' : 'hospital') : undefined

    return {
      aid: r.aid,
      name: r.name,
      site: r.site,
      enclosure: r.enclosure,
      hospital: HOSPITALS[Math.floor(hash(r.aid) * HOSPITALS.length) % HOSPITALS.length],
      condition: r.type,
      admittedOn: r.date,
      durationDays: r.durationDays,
      status: r.status,
      outcome: r.outcome,
      surgery,
      surgeryDetail: surgery ? deriveSurgeryDetail(r.aid, r.date) : undefined
    }
  })
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Admissions bucketed per month — labels like "Aug '25" (the module's month/year axis format).
 *  `monthsBack` null = from the first admission; perMonth carries the admissions for drills. */
export const monthlyAdmissions = (
  admissions: Admission[],
  monthsBack: number | null,
  now: Date
): { labels: string[]; values: number[]; perMonth: Admission[][] } => {
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const byMonth = new Map<string, Admission[]>()
  for (const a of admissions) {
    const t = new Date(a.admittedOn)
    if (isNaN(t.getTime()) || t > now) continue
    const k = key(t)
    const list = byMonth.get(k)
    if (list) list.push(a)
    else byMonth.set(k, [a])
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
  const perMonth: Admission[][] = []
  for (let d = new Date(start); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const list = byMonth.get(key(d)) ?? []
    labels.push(`${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`)
    values.push(list.length)
    perMonth.push(list)
  }

  return { labels, values, perMonth }
}

/** Length-of-stay distribution — fixed buckets, items carried for chart drills. */
export const LOS_BUCKETS = [
  { label: '1–3 d', min: 0, max: 3 },
  { label: '4–7 d', min: 4, max: 7 },
  { label: '8–14 d', min: 8, max: 14 },
  { label: '15–30 d', min: 15, max: 30 },
  { label: '30 d +', min: 31, max: Infinity }
] as const

export const losBuckets = (admissions: Admission[]): { label: string; items: Admission[] }[] =>
  LOS_BUCKETS.map(b => ({ label: b.label, items: admissions.filter(a => a.durationDays >= b.min && a.durationDays <= b.max) }))

export const computeHospital = (clinical: SpeciesClinical | null | undefined, inWin: (s?: string) => boolean): HospitalRollup | null => {
  if (!clinical) return null

  // Every clinical episode (symptom or diagnosis) with real duration is treated as an admission.
  const admissions: Admission[] = buildAdmissions(clinical).filter(a => inWin(a.admittedOn))

  // Roll up per animal.
  const byAid = new Map<string, HospAnimal>()
  for (const a of admissions) {
    let g = byAid.get(a.aid)
    if (!g) {
      g = { aid: a.aid, name: a.name, site: a.site, enclosure: a.enclosure, admissions: [], admissionCount: 0, currentlyAdmitted: false, currentStayDays: 0, died: false }
      byAid.set(a.aid, g)
    }
    g.admissions.push(a)
    g.admissionCount++
    if (a.status === 'active') {
      g.currentlyAdmitted = true
      g.currentStayDays = Math.max(g.currentStayDays, a.durationDays)
    }
    if (a.outcome === 'died') g.died = true
  }
  const animals = [...byAid.values()]

  const activeAnimals = animals.filter(a => a.currentlyAdmitted)
  // Inpatient vs outpatient: deterministic split — longer active stays are inpatient.
  const inpatientNow = activeAnimals.filter(a => a.currentStayDays >= 2).length

  const repeats = animals.filter(a => a.admissionCount >= HOSPITAL_THRESHOLDS.repeatAdmissions)
  const longStay = activeAnimals
    .filter(a => a.currentStayDays > HOSPITAL_THRESHOLDS.longStayDays)
    .sort((x, y) => y.currentStayDays - x.currentStayDays)
  const mortality = admissions.filter(a => a.outcome === 'died')

  // By hospital.
  const hMap = new Map<string, { animals: Set<string>; longStay: number; deaths: number }>()
  for (const a of animals) {
    for (const ad of a.admissions) {
      let e = hMap.get(ad.hospital)
      if (!e) {
        e = { animals: new Set(), longStay: 0, deaths: 0 }
        hMap.set(ad.hospital, e)
      }
      e.animals.add(a.aid)
      if (ad.outcome === 'died') e.deaths++
    }
    if (a.currentStayDays > HOSPITAL_THRESHOLDS.longStayDays) {
      const e = hMap.get(a.admissions.find(ad => ad.status === 'active')?.hospital ?? a.admissions[0].hospital)
      if (e) e.longStay++
    }
  }
  const hEntries = [...hMap.entries()].map(([name, e]) => ({ name, animals: e.animals.size, longStay: e.longStay, deaths: e.deaths }))
  const avgLoad = hEntries.length ? hEntries.reduce((s, e) => s + e.animals, 0) / hEntries.length : 0
  const byHospital = hEntries
    .map(e => ({ ...e, hot: e.animals >= avgLoad * HOSPITAL_THRESHOLDS.hotMult && e.animals >= HOSPITAL_THRESHOLDS.minCaseload }))
    .sort((a, b) => b.animals - a.animals)

  // Repeat by origin site — which sites keep sending animals back.
  const sMap = new Map<string, { animals: Set<string>; admissions: number }>()
  for (const a of repeats) {
    let e = sMap.get(a.site)
    if (!e) {
      e = { animals: new Set(), admissions: 0 }
      sMap.set(a.site, e)
    }
    e.animals.add(a.aid)
    e.admissions += a.admissionCount
  }
  const repeatBySite = [...sMap.entries()]
    .map(([site, e]) => ({ site, animals: e.animals.size, admissions: e.admissions }))
    .sort((a, b) => b.admissions - a.admissions)

  // Surgery split.
  const surgeryAdms = admissions.filter(a => a.surgery)
  const sHosp = surgeryAdms.filter(a => a.surgery === 'hospital')
  const sField = surgeryAdms.filter(a => a.surgery === 'field')
  const complications = (list: Admission[]) => list.filter(a => hash(`${a.aid}|${a.admittedOn}|c`) > 0.85).length

  return {
    animalCount: clinical.animalCount,
    hospitalisedNow: activeAnimals.length,
    inpatientNow,
    outpatientNow: activeAnimals.length - inpatientNow,
    repeatCount: repeats.length,
    repeatWorst: animals.reduce((m, a) => Math.max(m, a.admissionCount), 0),
    longStay,
    mortality,
    mortalityRate: admissions.length ? Math.round((mortality.length / admissions.length) * 1000) / 10 : 0,
    animals,
    admissions,
    byHospital,
    repeatBySite,
    surgery: {
      total: surgeryAdms.length,
      hospital: sHosp.length,
      field: sField.length,
      hospitalComplications: complications(sHosp),
      fieldComplications: complications(sField)
    }
  }
}
