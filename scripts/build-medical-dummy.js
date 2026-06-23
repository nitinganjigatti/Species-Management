/* Generates DETERMINISTIC SAMPLE data for medical sections the dump has no source for:
   lab / pathology, surgery, anaesthesia. Built from each species' REAL animals + sites so it
   reads plausibly. Marked `sample:true` so the UI can label it. Frontend-only fixtures.
   Re-run: `node scripts/build-medical-dummy.js`  (idempotent — seeded by species id). */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'public', 'species-data', 'detail')

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const ri = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))
const rf = (rng, lo, hi, dp = 1) => Number((lo + rng() * (hi - lo)).toFixed(dp))
const pickN = (rng, arr, n) => {
  const c = [...arr]
  const out = []
  while (out.length < n && c.length) out.push(c.splice(Math.floor(rng() * c.length), 1)[0])

  return out
}
// deterministic date string within the last ~730 days of a fixed base (no Date.now → reproducible)
const dateFrom = (rng) => {
  const base = new Date('2026-06-01T00:00:00Z')
  base.setDate(base.getDate() - ri(rng, 1, 730))

  return base.toISOString().slice(0, 10)
}

const LAB_TESTS = [
  { test: 'Glucose', lo: 60, hi: 120, unit: 'mg/dL' },
  { test: 'Haemoglobin', lo: 8, hi: 18, unit: 'g/dL' },
  { test: 'ALT (SGPT)', lo: 10, hi: 80, unit: 'U/L' },
  { test: 'Creatinine', lo: 0.5, hi: 2.5, unit: 'mg/dL' },
  { test: 'WBC', lo: 4, hi: 15, unit: '10⁹/L' },
  { test: 'Total Protein', lo: 5, hi: 8, unit: 'g/dL' },
  { test: 'Calcium', lo: 8, hi: 12, unit: 'mg/dL' },
  { test: 'Cortisol', lo: 1, hi: 20, unit: 'µg/dL' }
]
const PROCEDURES = ['Wound debridement', 'Mass / tumour removal', 'Dental extraction', 'Laparotomy', 'Fracture repair', 'Abscess drainage', 'Castration / neutering']
const AGENTS = ['Ketamine + Medetomidine', 'Isoflurane', 'Propofol', 'Tiletamine-Zolazepam', 'Butorphanol']

let touched = 0
for (const file of fs.readdirSync(DIR)) {
  if (!file.endsWith('.json')) continue
  const fp = path.join(DIR, file)
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'))
  const id = Number(d.header?.speciesId || file.replace('.json', '')) || 1
  const rng = mulberry32(id)

  const animals = Array.isArray(d.animals?.animals) ? d.animals.animals : []
  const sites = (d.housing?.sites || []).map(s => s.name).filter(Boolean)
  const aPool = animals.length ? animals : [{ name: 'Animal', site: sites[0] || 'Main Site' }]
  const total = Math.max(aPool.length, 1)

  // lab
  const labCount = ri(rng, 4, 7)
  const tests = pickN(rng, LAB_TESTS, labCount).map(t => {
    const nA = ri(rng, 3, Math.max(3, Math.min(40, total)))
    const min = rf(rng, t.lo, (t.lo + t.hi) / 2)
    const max = rf(rng, (t.lo + t.hi) / 2, t.hi)
    const avg = rf(rng, min, max)

    return { test: t.test, animals: nA, count: nA + ri(rng, 0, nA), min, avg, max, unit: t.unit }
  })

  // surgery
  const procCount = ri(rng, 2, 4)
  const procedures = pickN(rng, PROCEDURES, procCount).map(name => {
    const c = ri(rng, 1, 6)

    return { name, count: c, animals: c }
  })
  const surgTotal = procedures.reduce((s, p) => s + p.count, 0)
  const sRecent = pickN(rng, aPool, Math.min(6, surgTotal)).map(a => ({
    date: dateFrom(rng),
    animal: a.name || a.antzId || 'Animal',
    site: a.site || sites[0] || '-',
    procedure: PROCEDURES[ri(rng, 0, PROCEDURES.length - 1)]
  }))

  // anaesthesia
  const agCount = ri(rng, 2, 4)
  const agents = pickN(rng, AGENTS, agCount).map(name => ({ name, count: ri(rng, 1, 8) }))
  const anTotal = agents.reduce((s, a) => s + a.count, 0)
  const aRecent = pickN(rng, aPool, Math.min(6, anTotal)).map(a => ({
    date: dateFrom(rng),
    animal: a.name || a.antzId || 'Animal',
    agent: agents[ri(rng, 0, agents.length - 1)].name,
    site: a.site || sites[0] || '-'
  }))

  d.lab = { sample: true, tests }
  d.surgery = { sample: true, total: surgTotal, procedures, recent: sRecent }
  d.anaesthesia = { sample: true, total: anTotal, agents, recent: aRecent }

  fs.writeFileSync(fp, JSON.stringify(d))
  touched++
}
console.log(`medical dummy written to ${touched} detail files (lab/surgery/anaesthesia, sample:true)`)
