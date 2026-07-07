/*
 * build-species-clinical.js
 * ---------------------------------------------------------------------------
 * Generates DUMMY clinical data (Symptoms / Diagnosis) for every species, as
 * lazy per-species sidecars:
 *     public/species-data/clinical/<tsn_id>.json
 *
 * Frontend-only demo data. The dump HAS complaints/diagnosis tables, but they
 * are anonymised and sparse — this synthesises taxon-appropriate, deterministic
 * data (seeded per tsn_id, "today" fixed) so re-runs are byte-stable and the two
 * type-first Medical tabs have something realistic to render. Same JSON shape a
 * future real-extraction can drop into.
 *
 * Run:  node --max-old-space-size=2048 scripts/build-species-clinical.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'public', 'species-data')
const OUT = path.join(ROOT, 'clinical')
const TODAY = new Date('2026-07-03T00:00:00Z')
const DAY = 86400000
const RECORD_CAP = 800 // per program: case rows kept for the drill table
const ANIMAL_CAP = 20000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── deterministic RNG (mulberry32) ────────────────────────────────────────
function rngFrom(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const iso = d => new Date(d).toISOString().slice(0, 10)
const addDays = (d, n) => new Date(d.getTime() + n * DAY)
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
const pickWeighted = (rng, pairs) => {
  const total = pairs.reduce((s, p) => s + p[1], 0)
  let r = rng() * total
  for (const [v, w] of pairs) {
    r -= w
    if (r <= 0) return v
  }
  return pairs[pairs.length - 1][0]
}

// ── catalogs ────────────────────────────────────────────────────────────────
const SYMPTOMS_BY_CLASS = {
  Mammalia: ['Lameness', 'Diarrhoea', 'Skin lesion', 'Inappetence', 'Lethargy', 'Coughing', 'Nasal discharge', 'Wound'],
  Aves: ['Feather loss', 'Lethargy', 'Nasal discharge', 'Diarrhoea', 'Lameness', 'Inappetence', 'Laboured breathing'],
  Reptilia: ['Inappetence', 'Skin shedding issue', 'Lethargy', 'Mouth rot', 'Swelling', 'Regurgitation'],
  Amphibia: ['Skin lesion', 'Lethargy', 'Bloating', 'Inappetence', 'Discolouration'],
  Actinopterygii: ['Fin rot', 'Lethargy', 'Discolouration', 'Buoyancy issue', 'Skin lesion']
}
const DEFAULT_SYMPTOMS = ['Lethargy', 'Inappetence', 'Skin lesion', 'Wound', 'Swelling']

const DIAGNOSES_BY_CLASS = {
  Mammalia: ['Enteritis', 'Pododermatitis', 'Pneumonia', 'Parasitism', 'Arthritis', 'Dermatitis', 'Abscess', 'Colic'],
  Aves: ['Aspergillosis', 'Bumblefoot', 'Enteritis', 'Parasitism', 'Feather cyst', 'Air sacculitis'],
  Reptilia: ['Stomatitis', 'Metabolic bone disease', 'Dysecdysis', 'Respiratory infection', 'Parasitism', 'Abscess'],
  Amphibia: ['Chytridiomycosis', 'Red-leg syndrome', 'Parasitism', 'Nutritional deficiency'],
  Actinopterygii: ['Fin rot', 'Ich', 'Columnaris', 'Swim bladder disorder', 'Parasitism']
}
const DEFAULT_DIAGNOSES = ['Enteritis', 'Parasitism', 'Dermatitis', 'Abscess', 'Respiratory infection']

const PROGNOSES = [
  ['Favourable', 6],
  ['Guarded', 3],
  ['Doubtful', 2],
  ['Poor', 1],
  ['Grave', 0.5]
]
// Symptom severity (user spec: Low / Medium / High), skewed to milder cases.
const SEVERITIES = [
  ['Low', 5],
  ['Medium', 3],
  ['High', 2]
]

// ── build the (synthetic) animal population for a species, once ────────────
function buildAnimals(rng, sp) {
  const count = Math.min(sp.animal_count || 0, ANIMAL_CAP)
  const sites = sp.sites && sp.sites.length ? sp.sites : ['Main Site']
  const enclCount = Math.max(1, Math.min(sp.enclosures || 8, 40))
  const short = (sp.common_name || 'Animal').split(' ')[0]
  const animals = []
  for (let i = 0; i < count; i++) {
    const site = sites[Math.floor(rng() * sites.length)]
    const aid = 'A-' + String(1000 + i)
    animals.push({ aid, name: `${short} #${aid}`, site, enclosure: 'Enc ' + (1 + Math.floor(rng() * enclCount)) })
  }
  return animals
}

// bucket record dates into the last 12 months relative to TODAY
function monthlyTrend(records) {
  const buckets = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - i, 1))
    buckets.push({ key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: MONTHS[d.getUTCMonth()], value: 0 })
  }
  const idx = {}
  buckets.forEach((b, i) => (idx[b.key] = i))
  for (const r of records) {
    const d = new Date(r.date)
    const k = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    if (idx[k] != null) buckets[idx[k]].value++
  }
  return buckets.map(b => ({ label: b.label, value: b.value }))
}

// ── generate one clinical program (symptoms / diagnosis) ────────────────────
function genProgram(rng, animals, catalog, opts) {
  const { affectedP, withPrognosis, withSeverity, activeP, maxPerAnimal } = opts
  const perType = {}
  const affected = new Set()
  let active = 0
  let resolved = 0
  let resolvedDaysSum = 0
  const prognosisOpen = {}
  const records = []

  for (const a of animals) {
    if (rng() >= affectedP) continue
    affected.add(a.aid)
    const n = 1 + Math.floor(rng() * maxPerAnimal)
    for (let j = 0; j < n; j++) {
      const type = pick(rng, catalog)
      perType[type] = (perType[type] || 0) + 1
      // Decide open/closed first; open cases get a recent report date so duration stays realistic.
      const isActive = rng() < activeP
      const ageDays = isActive ? 1 + Math.floor(rng() * 90) : 1 + Math.floor(rng() * 720)
      const reported = addDays(TODAY, -ageDays)
      let durationDays
      if (isActive) {
        active++
        durationDays = ageDays
      } else {
        resolved++
        durationDays = 2 + Math.floor(rng() * 28)
        resolvedDaysSum += durationDays
      }
      const rec = {
        aid: a.aid,
        name: a.name,
        site: a.site,
        enclosure: a.enclosure,
        type,
        date: iso(reported),
        durationDays,
        status: isActive ? 'active' : 'resolved'
      }
      if (withPrognosis) {
        const prog = pickWeighted(rng, PROGNOSES)
        rec.prognosis = prog
        if (isActive) prognosisOpen[prog] = (prognosisOpen[prog] || 0) + 1
      }
      if (withSeverity) rec.severity = pickWeighted(rng, SEVERITIES)
      if (records.length < RECORD_CAP) records.push(rec)
    }
  }

  records.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0)) // newest first

  const summary = {
    types: Object.keys(perType).length,
    active,
    resolved,
    animalsAffected: affected.size
  }
  if (withPrognosis) summary.avgResolutionDays = resolved ? Math.round(resolvedDaysSum / resolved) : 0

  const out = {
    kind: 'type',
    summary,
    topTypes: Object.entries(perType)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    statusMix: { active, resolved },
    trend: monthlyTrend(records),
    records
  }
  if (withPrognosis) {
    out.prognosisMix = ['Favourable', 'Guarded', 'Doubtful', 'Poor', 'Grave']
      .map(name => ({ name, count: prognosisOpen[name] || 0 }))
      .filter(p => p.count > 0)
  }
  return out
}

// ── main ───────────────────────────────────────────────────────────────────
function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'list.json'), 'utf8'))
  const list = Array.isArray(raw) ? raw : raw.species || raw.data || []
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

  let written = 0
  let empty = 0
  for (const sp of list) {
    const id = sp.tsn_id
    if (id == null) continue
    const rng = rngFrom(Number(id) * 40503 + 17)
    const animals = buildAnimals(rng, sp)

    if (!animals.length) {
      fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ tsnId: id, animalCount: 0, programs: {} }))
      empty++
      continue
    }

    const symptoms = SYMPTOMS_BY_CLASS[sp.class_name] || DEFAULT_SYMPTOMS
    const diagnoses = DIAGNOSES_BY_CLASS[sp.class_name] || DEFAULT_DIAGNOSES
    const out = {
      tsnId: id,
      animalCount: animals.length,
      programs: {
        symptoms: genProgram(rng, animals, symptoms, { affectedP: 0.07, withPrognosis: false, withSeverity: true, activeP: 0.2, maxPerAnimal: 3 }),
        diagnosis: genProgram(rng, animals, diagnoses, { affectedP: 0.05, withPrognosis: true, activeP: 0.28, maxPerAnimal: 2 })
      }
    }
    fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(out))
    written++
    if (written % 400 === 0) console.log(`  …${written} written`)
  }
  console.log(`Done. ${written} species sidecars written (${empty} empty) → ${path.relative(process.cwd(), OUT)}`)
}

main()
