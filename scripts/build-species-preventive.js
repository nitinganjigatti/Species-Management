/*
 * build-species-preventive.js
 * ---------------------------------------------------------------------------
 * Generates DUMMY preventive-care data (Vaccination / Deworming / Supplements)
 * for every species, as lazy per-species sidecars:
 *     public/species-data/preventive/<tsn_id>.json
 *
 * Frontend-only demo data (the dump has no usable vacc/deworm and no
 * supplements at all). Deterministic: seeded per species from tsn_id, and
 * "today" is fixed, so re-runs are byte-stable.
 *
 * Run:  node --max-old-space-size=2048 scripts/build-species-preventive.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'public', 'species-data')
const OUT = path.join(ROOT, 'preventive')
const TODAY = new Date('2026-07-03T00:00:00Z') // fixed reference for stable overdue/upcoming
const DAY = 86400000
const RECORD_CAP = 400 // per program: overdue + upcoming rows we keep for the drill
const ANIMAL_CAP = 20000 // safety ceiling for aggregate loops

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

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}
function pickN(rng, arr, n) {
  const pool = arr.slice()
  const out = []
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  return out
}
// aging days for an overdue item — skewed toward recent
function agingDays(rng) {
  const r = rng()
  if (r < 0.55) return 1 + Math.floor(rng() * 30) // 0-30
  if (r < 0.85) return 31 + Math.floor(rng() * 60) // 30-90
  return 91 + Math.floor(rng() * 460) // 90+
}

// ── program catalogs ───────────────────────────────────────────────────────
const VACCINES_BY_CLASS = {
  Mammalia: ['Rabies', 'Clostridial', 'Foot & Mouth', 'Anthrax', 'Brucellosis', 'Leptospira', 'Tetanus'],
  Aves: ['Newcastle Disease', 'Avian Influenza', 'Fowl Pox', "Marek's Disease", 'Infectious Bronchitis'],
  Reptilia: ['Salmonella Prophylaxis', 'Herpesvirus', 'Paramyxovirus'],
  Amphibia: ['Chytrid Prophylaxis', 'Ranavirus'],
  Actinopterygii: ['Aeromonas', 'Vibrio']
}
const DEFAULT_VACCINES = ['Core Vaccine A', 'Core Vaccine B', 'Core Vaccine C']
const DEWORMERS = ['Ivermectin', 'Fenbendazole', 'Praziquantel', 'Albendazole', 'Levamisole']
const SUPPLEMENTS = ['Vitamin A', 'Vitamin D3', 'Vitamin E', 'Calcium', 'Multivitamin', 'Mineral Mix']

// plausible adult body-weight range (kg) per taxonomic class — for synthetic weights
const WEIGHT_KG_BY_CLASS = {
  Mammalia: [5, 350],
  Aves: [0.1, 12],
  Reptilia: [0.3, 90],
  Amphibia: [0.02, 2],
  Actinopterygii: [0.05, 8]
}

// ── build the (synthetic) animal population for a species, once ────────────
function buildAnimals(rng, sp) {
  const count = Math.min(sp.animal_count || 0, ANIMAL_CAP)
  const sites = sp.sites && sp.sites.length ? sp.sites : ['Main Site']
  const enclCount = Math.max(1, Math.min(sp.enclosures || 8, 40))
  const short = (sp.common_name || 'Animal').split(' ')[0]
  const [wLo, wHi] = WEIGHT_KG_BY_CLASS[sp.class_name] || [1, 50]
  const animals = []
  for (let i = 0; i < count; i++) {
    // main-rng draws (site, enclosure) kept in the original order so existing coverage/overdue stay byte-stable
    const site = sites[Math.floor(rng() * sites.length)]
    const enclosure = 'Enc ' + (1 + Math.floor(rng() * enclCount))
    const aid = 'A-' + String(1000 + i)
    // gender/age/weight from a per-animal side rng → does NOT perturb the main sequence
    const arng = rngFrom(shash(aid) + Number(sp.tsn_id || 0) * 2654435761)
    const g = arng()
    const gender = g < 0.48 ? 'Male' : g < 0.96 ? 'Female' : 'Undetermined'
    const age = `${Math.floor(arng() * 22)}y ${Math.floor(arng() * 12)}m`
    const weight = `${(wLo + arng() * (wHi - wLo)).toFixed(1)} kg`
    animals.push({ aid, name: `${short} #${aid}`, site, enclosure, gender, age, weight })
  }
  return animals
}

// ── generate one program (vaccination / deworming / supplements) ───────────
// stable string hash → seed for a site-name-scoped RNG (keeps the main rng sequence untouched)
function shash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h >>> 0
}

function genProgram(rng, animals, catalog, opts) {
  const { kind, interval, neverP, overdueP, dueP } = opts
  const perTypeOverdue = {}
  const bySite = {}
  const aging = { d0_30: 0, d30_90: 0, d90plus: 0 }
  const sites = {}
  const siteOf = a =>
    sites[a.site] ||
    (sites[a.site] = { animals: 0, never: 0, overdue: 0, enclosures: new Set(), aging: { d0_30: 0, d30_90: 0, d90plus: 0 }, perType: {} })
  let overdue = 0,
    due = 0,
    never = 0
  const records = []

  for (const a of animals) {
    const st = siteOf(a)
    st.animals++
    st.enclosures.add(a.enclosure)
    if (rng() < neverP) {
      never++
      st.never++
      continue
    }
    if (rng() < overdueP) {
      overdue++
      st.overdue++
      const k = 1 + Math.floor(rng() * Math.min(3, catalog.length))
      const items = pickN(rng, catalog, k)
      let maxDays = 0
      for (const it of items) {
        const d = agingDays(rng)
        if (d > maxDays) maxDays = d
        perTypeOverdue[it] = (perTypeOverdue[it] || 0) + 1
        st.perType[it] = (st.perType[it] || 0) + 1
        if (records.length < RECORD_CAP) {
          const dueDate = addDays(TODAY, -d)
          records.push({
            aid: a.aid,
            name: a.name,
            site: a.site,
            enclosure: a.enclosure,
            gender: a.gender,
            age: a.age,
            weight: a.weight,
            type: it,
            lastGiven: iso(addDays(dueDate, -interval)),
            due: iso(dueDate),
            status: 'overdue',
            days: d
          })
        }
      }
      bySite[a.site] = (bySite[a.site] || 0) + 1
      const bucket = maxDays <= 30 ? 'd0_30' : maxDays <= 90 ? 'd30_90' : 'd90plus'
      aging[bucket]++
      st.aging[bucket]++
    } else if (rng() < dueP) {
      due++
      const it = pick(rng, catalog)
      const inDays = 1 + Math.floor(rng() * 30)
      if (records.length < RECORD_CAP) {
        const dueDate = addDays(TODAY, inDays)
        records.push({
          aid: a.aid,
          name: a.name,
          site: a.site,
          enclosure: a.enclosure,
          gender: a.gender,
          age: a.age,
          weight: a.weight,
          type: it,
          lastGiven: iso(addDays(dueDate, -interval)),
          due: iso(dueDate),
          status: 'upcoming',
          days: inDays
        })
      }
    }
  }

  const tracked = animals.length
  const coveragePct = tracked ? Math.round((100 * (tracked - overdue - never)) / tracked) : 0

  // per-site rollups for the "status by site" matrix (trend/spark from a site-seeded rng → order-stable)
  const sitesArr = Object.entries(sites)
    .map(([site, s]) => {
      const cov = s.animals ? Math.round((100 * (s.animals - s.overdue - s.never)) / s.animals) : 0
      const top = Object.entries(s.perType).sort((a, b) => b[1] - a[1])[0]
      const srng = rngFrom(shash(site) + 7)
      const trendPct = Math.round(srng() * 16) - 6 // −6 … +9
      const spark = []
      let base = 40 + Math.floor(srng() * 30)
      for (let i = 0; i < 7; i++) {
        base = Math.max(5, Math.min(100, base + trendPct / 6 + (srng() * 8 - 4)))
        spark.push(Math.round(base))
      }
      return {
        site,
        animals: s.animals,
        enclosures: s.enclosures.size,
        coveragePct: cov,
        overdue: s.overdue,
        aging: s.aging,
        topGap: top ? { name: top[0], count: top[1] } : null,
        trendPct,
        spark
      }
    })
    .sort((a, b) => b.overdue - a.overdue)

  return {
    kind, // 'schedule' | 'ongoing'
    summary: {
      coveragePct,
      coverageTrendPct: 1 + Math.floor(rng() * 6),
      overdue,
      dueIn30: due,
      never,
      animalsTracked: tracked
    },
    topOverdue: Object.entries(perTypeOverdue)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    aging,
    bySite: Object.entries(bySite)
      .map(([site, count]) => ({ site, count }))
      .sort((a, b) => b.count - a.count),
    sites: sitesArr,
    records
  }
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
    const rng = rngFrom(Number(id) * 2654435761)
    const animals = buildAnimals(rng, sp)

    if (!animals.length) {
      fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ tsnId: id, animalCount: 0, programs: {} }))
      empty++
      continue
    }

    const vaccines = VACCINES_BY_CLASS[sp.class_name] || DEFAULT_VACCINES
    const out = {
      tsnId: id,
      animalCount: animals.length,
      programs: {
        vaccination: genProgram(rng, animals, vaccines, { kind: 'schedule', interval: 365, neverP: 0.08, overdueP: 0.15, dueP: 0.24 }),
        deworming: genProgram(rng, animals, DEWORMERS, { kind: 'schedule', interval: 120, neverP: 0.05, overdueP: 0.2, dueP: 0.28 }),
        supplements: genProgram(rng, animals, SUPPLEMENTS, { kind: 'ongoing', interval: 30, neverP: 0.12, overdueP: 0.18, dueP: 0.2 })
      }
    }
    fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(out))
    written++
    if (written % 400 === 0) console.log(`  …${written} written`)
  }
  console.log(`Done. ${written} species sidecars written (${empty} empty) → ${path.relative(process.cwd(), OUT)}`)
}

main()
