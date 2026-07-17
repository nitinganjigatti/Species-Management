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

// Chronic / recurring symptoms — conditions that realistically flare repeatedly on the SAME
// animal (arthritis, dermatitis, bumblefoot, shedding problems…). Recurrers get several episodes
// of one of these, so "most recurring symptom" is a real signal, distinct from "most common".
const CHRONIC_SYMPTOMS_BY_CLASS = {
  Mammalia: ['Lameness', 'Skin lesion'],
  Aves: ['Lameness', 'Feather loss'],
  Reptilia: ['Skin shedding issue', 'Mouth rot'],
  Amphibia: ['Skin lesion', 'Discolouration'],
  Actinopterygii: ['Fin rot', 'Skin lesion']
}
const DEFAULT_CHRONIC_SYMPTOMS = ['Skin lesion', 'Lethargy']

const DIAGNOSES_BY_CLASS = {
  Mammalia: ['Enteritis', 'Pododermatitis', 'Pneumonia', 'Parasitism', 'Arthritis', 'Dermatitis', 'Abscess', 'Colic'],
  Aves: ['Aspergillosis', 'Bumblefoot', 'Enteritis', 'Parasitism', 'Feather cyst', 'Air sacculitis'],
  Reptilia: ['Stomatitis', 'Metabolic bone disease', 'Dysecdysis', 'Respiratory infection', 'Parasitism', 'Abscess'],
  Amphibia: ['Chytridiomycosis', 'Red-leg syndrome', 'Parasitism', 'Nutritional deficiency'],
  Actinopterygii: ['Fin rot', 'Ich', 'Columnaris', 'Swim bladder disorder', 'Parasitism']
}
const DEFAULT_DIAGNOSES = ['Enteritis', 'Parasitism', 'Dermatitis', 'Abscess', 'Respiratory infection']

// Body-system category per type (symptoms + diagnoses share one flat map). Drives the
// Category dropdowns/column on the merged Clinical tab.
const TYPE_CATEGORY = {
  // symptoms
  Lameness: 'Musculoskeletal',
  Diarrhoea: 'Digestive',
  'Skin lesion': 'Skin & Coat',
  Inappetence: 'Nutritional',
  Lethargy: 'General',
  Coughing: 'Respiratory',
  'Nasal discharge': 'Respiratory',
  Wound: 'Injury & Trauma',
  'Feather loss': 'Skin & Coat',
  'Laboured breathing': 'Respiratory',
  'Skin shedding issue': 'Skin & Coat',
  'Mouth rot': 'Oral & Dental',
  Swelling: 'Injury & Trauma',
  Regurgitation: 'Digestive',
  Bloating: 'Digestive',
  Discolouration: 'Skin & Coat',
  'Fin rot': 'Skin & Coat',
  'Buoyancy issue': 'General',
  // diagnoses
  Enteritis: 'Digestive',
  Pododermatitis: 'Musculoskeletal',
  Pneumonia: 'Respiratory',
  Parasitism: 'Parasitic',
  Arthritis: 'Musculoskeletal',
  Dermatitis: 'Skin & Coat',
  Abscess: 'Infectious',
  Colic: 'Digestive',
  Aspergillosis: 'Respiratory',
  Bumblefoot: 'Musculoskeletal',
  'Feather cyst': 'Skin & Coat',
  'Air sacculitis': 'Respiratory',
  Stomatitis: 'Oral & Dental',
  'Metabolic bone disease': 'Metabolic',
  Dysecdysis: 'Skin & Coat',
  'Respiratory infection': 'Respiratory',
  Chytridiomycosis: 'Infectious',
  'Red-leg syndrome': 'Infectious',
  'Nutritional deficiency': 'Nutritional',
  Ich: 'Parasitic',
  Columnaris: 'Infectious',
  'Swim bladder disorder': 'General'
}
const categoryOf = type => TYPE_CATEGORY[type] || 'General'

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
  const {
    affectedP,
    withPrognosis,
    withSeverity,
    activeP,
    maxPerAnimal,
    chronicTypes,
    recurP = 0,
    fragileP = 0, // share of affected animals that are "fragile": 3–5 episodes of DIFFERENT types
    diedP = 0, // share of closed episodes that ended in death (outcome: 'died')
    escalateP = 0, // share of active Medium/High severities that climbed from a lower start (severityFrom)
    spreadChains = 0, // max same-type transmission chains seeded inside one enclosure
    precursors = null // [{animal, ageDays, category}] — seed symptoms shortly BEFORE a diagnosis
  } = opts
  const perType = {}
  const perTypeAnimals = {} // type -> Set of aids (distinct breadth)
  const affected = new Set()
  let active = 0
  let resolved = 0
  let resolvedDaysSum = 0
  const prognosisOpen = {}
  const records = []

  // One case/episode of `type` for animal `a`. `force` pins date/status for seeded patterns
  // (spread chains) — everything else (prognosis, severity, death outcome) rolls as usual.
  const emit = (a, type, force) => {
    perType[type] = (perType[type] || 0) + 1
    ;(perTypeAnimals[type] = perTypeAnimals[type] || new Set()).add(a.aid)
    affected.add(a.aid)
    // Decide open/closed first; open cases get a recent report date so duration stays realistic.
    const isActive = force ? force.isActive : rng() < activeP
    // Active cases skew recent (most just reported); a stubborn minority drags past 30 days →
    // the "long-open" management signal is a real subset of active, not ~all of it.
    const ageDays = force ? force.ageDays : isActive ? 1 + Math.floor(Math.pow(rng(), 2.2) * 110) : 1 + Math.floor(rng() * 720)
    const reported = addDays(TODAY, -ageDays)
    let durationDays
    if (isActive) {
      active++
      durationDays = ageDays
    } else {
      resolved++
      durationDays = Math.min(2 + Math.floor(rng() * 28), Math.max(2, ageDays))
      resolvedDaysSum += durationDays
    }
    const rec = {
      aid: a.aid,
      name: a.name,
      site: a.site,
      enclosure: a.enclosure,
      type,
      category: categoryOf(type),
      date: iso(reported),
      durationDays,
      status: isActive ? 'active' : 'resolved'
    }
    if (withPrognosis) {
      const prog = pickWeighted(rng, PROGNOSES)
      rec.prognosis = prog
      if (isActive) prognosisOpen[prog] = (prognosisOpen[prog] || 0) + 1
    }
    if (withSeverity) {
      rec.severity = pickWeighted(rng, SEVERITIES)
      // A worsening minority: the case STARTED milder and climbed → "Worsening" signal.
      if (isActive && rec.severity !== 'Low' && rng() < escalateP) {
        rec.severityFrom = rec.severity === 'High' && rng() < 0.4 ? 'Medium' : 'Low'
      }
    }
    // A small share of closed episodes ended in death, not recovery → "Illness deaths" signal.
    if (!isActive && rng() < diedP) rec.outcome = 'died'
    if (records.length < RECORD_CAP) records.push(rec)
  }

  // Seeded transmission chains FIRST (before the cap can fill): one condition hopping through
  // enclosure-mates with staggered onsets → the "Spreading / contain" + outbreak signals.
  if (spreadChains > 0) {
    const byEnclosure = new Map()
    for (const a of animals) {
      const k = `${a.site}|${a.enclosure}`
      if (!byEnclosure.has(k)) byEnclosure.set(k, [])
      byEnclosure.get(k).push(a)
    }
    const pools = [...byEnclosure.values()].filter(g => g.length >= 3)
    const chains = pools.length ? Math.min(spreadChains, 1 + Math.floor(rng() * spreadChains)) : 0
    for (let ci = 0; ci < chains && pools.length; ci++) {
      const group = pools.splice(Math.floor(rng() * pools.length), 1)[0]
      const type = pick(rng, catalog)
      const n = Math.min(3 + Math.floor(rng() * 3), group.length) // 3–5 animals
      // Newest onset lands 2–10 days ago so the chain is a LIVE containment case, walking
      // back 4–9 days per hop.
      let age = 2 + Math.floor(rng() * 9)
      const hops = []
      for (let j = 0; j < n; j++) {
        hops.unshift(age) // oldest first
        age += 4 + Math.floor(rng() * 6)
      }
      const members = [...group]
      for (let j = 0; j < n; j++) {
        const a = members.splice(Math.floor(rng() * members.length), 1)[0]
        // Most of the chain is still open (that's what makes it containable); older hops may
        // have resolved.
        const isActive = j >= n - 2 ? true : rng() < 0.6
        emit(a, type, { isActive, ageDays: hops[j] })
      }
    }
  }

  // Precursor symptoms: a share of diagnosed animals showed a matching-category symptom a few
  // days before the assessment → the "symptom → diagnosis conversion" insight has real signal.
  if (precursors) {
    for (const p of precursors) {
      if (rng() >= 0.45) continue
      const match = catalog.filter(t => categoryOf(t) === p.category)
      const type = match.length ? pick(rng, match) : pick(rng, catalog)
      emit(p.animal, type, { isActive: false, ageDays: p.ageDays + 3 + Math.floor(rng() * 18) })
    }
  }

  for (const a of animals) {
    if (rng() >= affectedP) continue
    // A share of affected animals are chronic "recurrers": several flare-ups of ONE chronic
    // condition → real recurrence/relapse intensity. Another share are "fragile": repeatedly
    // sick with DIFFERENT conditions. The rest get 1..maxPerAnimal one-off cases.
    const roll = rng()
    if (chronicTypes && chronicTypes.length && roll < recurP) {
      const type = pick(rng, chronicTypes)
      const episodes = 2 + Math.floor(rng() * 3) // 2–4 recurrences of the same condition
      for (let j = 0; j < episodes; j++) emit(a, type)
    } else if (roll < recurP + fragileP && catalog.length >= 3) {
      const n = 3 + Math.floor(rng() * 3) // 3–5 episodes, forced-distinct types
      const bag = [...catalog]
      for (let j = 0; j < n; j++) {
        const t = bag.length ? bag.splice(Math.floor(rng() * bag.length), 1)[0] : pick(rng, catalog)
        emit(a, t)
      }
    } else {
      const n = 1 + Math.floor(rng() * maxPerAnimal)
      for (let j = 0; j < n; j++) emit(a, pick(rng, catalog))
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
      .map(([name, count]) => ({ name, count, animals: (perTypeAnimals[name] || new Set()).size, category: categoryOf(name) }))
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
    const chronicSymptoms = CHRONIC_SYMPTOMS_BY_CLASS[sp.class_name] || DEFAULT_CHRONIC_SYMPTOMS
    const diagnoses = DIAGNOSES_BY_CLASS[sp.class_name] || DEFAULT_DIAGNOSES
    // Site denominators for rate-based analytics (hotspots = episodes per animal HOUSED, not
    // raw counts) — the sidecar's records only cover affected animals, so ship the census here.
    const siteCounts = {}
    for (const a of animals) siteCounts[a.site] = (siteCounts[a.site] || 0) + 1
    // Diagnosis first: its records seed matching precursor symptoms (symptom → diagnosis
    // conversion needs the two programs causally linked, not independent draws).
    const diagnosis = genProgram(rng, animals, diagnoses, {
      affectedP: 0.06,
      withPrognosis: true,
      activeP: 0.28,
      maxPerAnimal: 2,
      chronicTypes: diagnoses.slice(0, 2),
      recurP: 0.18,
      fragileP: 0.08,
      diedP: 0.05
    })
    const animalByAid = new Map(animals.map(a => [a.aid, a]))
    const precursors = diagnosis.records.map(r => ({
      animal: animalByAid.get(r.aid),
      ageDays: Math.max(1, Math.round((TODAY.getTime() - new Date(r.date).getTime()) / DAY)),
      category: r.category
    }))
    const out = {
      tsnId: id,
      animalCount: animals.length,
      sites: Object.entries(siteCounts).map(([name, count]) => ({ name, animals: count })),
      programs: {
        symptoms: genProgram(rng, animals, symptoms, {
          affectedP: 0.08,
          withPrognosis: false,
          withSeverity: true,
          activeP: 0.2,
          maxPerAnimal: 3,
          chronicTypes: chronicSymptoms,
          recurP: 0.3,
          fragileP: 0.12,
          diedP: 0.015,
          escalateP: 0.3,
          spreadChains: animals.length >= 40 ? 2 : animals.length >= 12 ? 1 : 0,
          precursors
        }),
        diagnosis
      }
    }
    fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(out))
    written++
    if (written % 400 === 0) console.log(`  …${written} written`)
  }
  console.log(`Done. ${written} species sidecars written (${empty} empty) → ${path.relative(process.cwd(), OUT)}`)
}

main()
