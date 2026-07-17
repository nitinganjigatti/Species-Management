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
// Real vaccine PRODUCT/medicine names (not disease names). Grouped by taxonomic class.
const VACCINES_BY_CLASS = {
  Mammalia: ['Nobivac Rabies', 'Covexin 10', 'Aftovaxpur', 'Anthravac', 'Brucevac RB51', 'Spirovac', 'Tetanus Toxoid'],
  Aves: ['Nobilis ND Clone 30', 'Nobilis Influenza H5', 'Poulvac Fowl Pox', 'Nobilis Rismavac', 'Nobilis IB 4-91'],
  Reptilia: ['Salmonella Bacterin', 'Herpavac R', 'Reptivac PMV'],
  Amphibia: ['Chytravac', 'Ranavac FV3'],
  Actinopterygii: ['Alphaject 2000', 'Vibrogen 2']
}
const DEFAULT_VACCINES = ['Multivac Core I', 'Multivac Core II', 'Multivac Core III']
const DEWORMERS = ['Ivermectin', 'Fenbendazole', 'Praziquantel', 'Albendazole', 'Levamisole']
const SUPPLEMENTS = ['Vitamin A', 'Vitamin D3', 'Vitamin E', 'Calcium', 'Multivitamin', 'Mineral Mix']

// Standard dose per medicine: { q: quantity, u: unit, per: 'kg' } — `per: 'kg'` marks a
// WEIGHT-BASED dose (rate × animal weight); absent = fixed amount per dose. Units are free
// strings that flow straight to the UI (a real API's doctor-chosen unit drops in unchanged).
const DOSE_SPECS = {
  // vaccines — fixed volumes
  'Nobivac Rabies': { q: 1, u: 'ml' },
  'Covexin 10': { q: 2, u: 'ml' },
  Aftovaxpur: { q: 2, u: 'ml' },
  Anthravac: { q: 1, u: 'ml' },
  'Brucevac RB51': { q: 2, u: 'ml' },
  Spirovac: { q: 2, u: 'ml' },
  'Tetanus Toxoid': { q: 1, u: 'ml' },
  'Nobilis ND Clone 30': { q: 0.5, u: 'ml' },
  'Nobilis Influenza H5': { q: 0.5, u: 'ml' },
  'Poulvac Fowl Pox': { q: 0.5, u: 'ml' },
  'Nobilis Rismavac': { q: 0.2, u: 'ml' },
  'Nobilis IB 4-91': { q: 0.5, u: 'ml' },
  'Salmonella Bacterin': { q: 0.5, u: 'ml' },
  'Herpavac R': { q: 0.5, u: 'ml' },
  'Reptivac PMV': { q: 0.5, u: 'ml' },
  Chytravac: { q: 0.2, u: 'ml' },
  'Ranavac FV3': { q: 0.2, u: 'ml' },
  'Alphaject 2000': { q: 0.1, u: 'ml' },
  'Vibrogen 2': { q: 0.1, u: 'ml' },
  'Multivac Core I': { q: 1, u: 'ml' },
  'Multivac Core II': { q: 1, u: 'ml' },
  'Multivac Core III': { q: 1, u: 'ml' },
  // dewormers — weight-based rates
  Ivermectin: { q: 0.2, u: 'mg', per: 'kg' },
  Fenbendazole: { q: 5, u: 'mg', per: 'kg' },
  Praziquantel: { q: 5, u: 'mg', per: 'kg' },
  Albendazole: { q: 7.5, u: 'mg', per: 'kg' },
  Levamisole: { q: 7.5, u: 'mg', per: 'kg' },
  // supplements — mixed
  'Vitamin A': { q: 5000, u: 'IU' },
  'Vitamin D3': { q: 1000, u: 'IU' },
  'Vitamin E': { q: 100, u: 'IU' },
  Calcium: { q: 50, u: 'mg', per: 'kg' },
  Multivitamin: { q: 1, u: 'tablet' },
  'Mineral Mix': { q: 10, u: 'g' }
}
const DEFAULT_DOSE = { q: 1, u: 'ml' }

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

// ── per-vaccine (vaccine-wise) breakdown — ADDITIVE `types[]` on each program ──
// Everything below uses side-RNGs seeded per (species, program, type, animal), so the
// existing program aggregates above stay byte-stable. Powers the vaccine-wise rethink:
// index rows (coverage/pending/sites) + detail (trends, site chips, status animal table).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ANIMALS_PER_TYPE_CAP = 150 // per type: table paginates; tab counts use the aggregates
const TREND_MONTHS = 36

// Shared month-label axis for ALL per-type trend arrays (stored once per sidecar — the
// per-point {label,value} form multiplied to ~90MB across the corpus).
const TREND_LABELS = (() => {
  const out = []
  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - i, 1))
    out.push(`${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`)
  }
  return out
})()

const SCHEDULES = {
  vaccination: [
    [365, 'Annual · core'],
    [180, 'Every 6 months'],
    [730, 'Booster · 2-yearly']
  ],
  deworming: [
    [90, 'Quarterly'],
    [120, 'Every 4 months'],
    [180, 'Half-yearly']
  ],
  supplements: [[30, 'Monthly · ongoing']]
}

const monthLabel = d => `${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`

function genTypes(tsnId, programKey, animals, catalog) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const types = []
  for (const typeName of catalog) {
    const vrng = rngFrom(shash(programKey + '|' + typeName) + Number(tsnId) * 2654435761)
    // per-vaccine personality → coverage spreads meaningfully across the catalog
    const neverP = 0.02 + vrng() * 0.13
    const overdueP = 0.03 + vrng() * 0.16
    const dueP = 0.05 + vrng() * 0.12
    const [intervalDays, schedule] = SCHEDULES[programKey][Math.floor(vrng() * SCHEDULES[programKey].length)]
    const dose = DOSE_SPECS[typeName] || DEFAULT_DOSE

    let covered = 0,
      due = 0,
      overdue = 0,
      never = 0
    const sites = {}
    const rows = [] // COMPACT rows: {a,s,st,lg,nd,dy,dn} — decoded in detail.ts (doses = lg − k·interval)
    const doseDates = []

    for (const a of animals) {
      const arng = rngFrom(shash(typeName + '|' + a.aid) + Number(tsnId) * 40503)
      const st = (sites[a.site] ||= { animals: 0, covered: 0, overdue: 0 })
      st.animals++
      const r = arng()
      let status, lastGiven = null, days = null, nextDue = null
      if (r < neverP) {
        status = 'n'
        never++
      } else if (r < neverP + overdueP) {
        status = 'o'
        overdue++
        st.overdue++
        days = agingDays(arng)
        nextDue = addDays(TODAY, -days)
        lastGiven = addDays(nextDue, -intervalDays)
      } else if (r < neverP + overdueP + dueP) {
        status = 'd'
        due++
        days = 1 + Math.floor(arng() * 30)
        nextDue = addDays(TODAY, days)
        lastGiven = addDays(nextDue, -intervalDays)
      } else {
        status = 'c'
        covered++
        st.covered++
        const ago = 1 + Math.floor(arng() * Math.max(1, intervalDays - 45))
        lastGiven = addDays(TODAY, -ago)
      }
      let nDoses = 0
      if (lastGiven) {
        nDoses = 1 + Math.floor(arng() * 3)
        for (let k = 0; k < nDoses; k++) doseDates.push(iso(addDays(lastGiven, -k * intervalDays)))
      }
      if (rows.length < ANIMALS_PER_TYPE_CAP) {
        const row = { a: a.aid, s: a.site, st: status }
        if (lastGiven) row.lg = iso(lastGiven)
        if (days != null) row.dy = days
        if (nDoses) row.dn = nDoses
        // weight-based medicines need the animal's weight to compute the given amount
        if (dose.per === 'kg') row.w = Math.round((parseFloat(a.weight) || 1) * 10) / 10
        rows.push(row)
      }
    }

    const tracked = animals.length
    const coveragePct = tracked ? Math.round((100 * covered) / tracked) : 0

    // doses per month — bucketed from the ACTUAL generated dose dates (trailing 36 months);
    // plain number[] aligned to the sidecar-level `months` axis
    const buckets = new Array(TREND_MONTHS).fill(0)
    const idx = {}
    for (let i = TREND_MONTHS - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - i, 1))
      idx[`${d.getUTCFullYear()}-${d.getUTCMonth()}`] = TREND_MONTHS - 1 - i
    }
    for (const ds of doseDates) {
      const d = new Date(ds)
      const k = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
      if (idx[k] != null) buckets[idx[k]]++
    }

    // coverage % over time — random-walk backwards from today's true value
    const trend = new Array(TREND_MONTHS)
    let v = coveragePct
    for (let i = TREND_MONTHS - 1; i >= 0; i--) {
      trend[i] = Math.round(clamp(v, 4, 99))
      v -= 0.15 + vrng() * 0.9 - (vrng() * 4 - 2) / 4
    }

    const sitesArr = Object.entries(sites)
      .map(([site, s]) => ({
        site,
        animals: s.animals,
        coveragePct: s.animals ? Math.round((100 * s.covered) / s.animals) : 0,
        overdue: s.overdue
      }))
      .sort((a, b) => a.coveragePct - b.coveragePct)
    // rows reference their site as an INDEX into sitesArr (long site names repeated per row cost MBs)
    const siteIdx = new Map(sitesArr.map((s, i) => [s.site, i]))
    for (const row of rows) row.s = siteIdx.get(row.s)

    types.push({
      name: typeName,
      schedule,
      intervalDays,
      dose,
      coveragePct,
      covered,
      due,
      overdue,
      never,
      tracked,
      sitesAffected: sitesArr.filter(s => s.overdue > 0).length,
      sitesTotal: sitesArr.length,
      sites: sitesArr,
      coverageTrend: trend,
      dosesPerMonth: buckets,
      animals: rows
    })
  }

  return types.sort((a, b) => a.coveragePct - b.coveragePct)
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
    // vaccine-wise breakdown (additive; side-seeded so the program aggregates above are untouched)
    out.months = TREND_LABELS
    out.short = (sp.common_name || 'Animal').split(' ')[0] // row decoder rebuilds animal names

    out.programs.vaccination.types = genTypes(id, 'vaccination', animals, vaccines)
    out.programs.deworming.types = genTypes(id, 'deworming', animals, DEWORMERS)
    out.programs.supplements.types = genTypes(id, 'supplements', animals, SUPPLEMENTS)
    fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(out))
    written++
    if (written % 400 === 0) console.log(`  …${written} written`)
  }
  console.log(`Done. ${written} species sidecars written (${empty} empty) → ${path.relative(process.cwd(), OUT)}`)
}

main()
