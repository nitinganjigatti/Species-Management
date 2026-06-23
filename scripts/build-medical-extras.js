/* Enriches public/species-data/detail/<id>.json with medical "extras" parsed from the
   wildventure MySQL dump. Frontend-only fixture build.

   Adds (additive — never removes existing keys):
     lab:         { tests: [...] }                          // pathology/lab numeric test VALUES
     surgery:     { total, procedures: [...], recent: [...] }
     anaesthesia: { total, agents: [...], recent: [...] }
     pharmacy:    { total, medicines: [...] }                // ALL medicines used
   and enriches the existing `deaths` object with:
     deaths.byGender   = { male, female, unsexed }
     deaths.ageAtDeath = { avg, median, min, max, count }    // age in DAYS = discovered - birth

   Idempotent: re-running overwrites only the fields above; all other keys are preserved.
   Species are matched by scientific_name (fallback common_name), the same keying as list.json.

   Run:
     node --max-old-space-size=4096 scripts/build-medical-extras.js
   Override dump path:
     DUMP=/path/to/Dump20260622.sql node scripts/build-medical-extras.js
*/
'use strict'
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const DUMP = process.env.DUMP || '/Users/nitin/Nitin Claude/wildventure-species-mgmt-main/Dump20260622.sql'
const DATA = path.join(__dirname, '..', 'public', 'species-data')
const DETAIL_DIR = path.join(DATA, 'detail')

// ---------------------------------------------------------------------------
// MySQL VALUES tuple parser. Input is the part after "VALUES " up to the final
// ";". Returns an array of rows; each row is an array of (string | null).
// Handles \' \\ escapes and unquoted tokens (numbers / NULL).
// ---------------------------------------------------------------------------
function parseTuples(s) {
  const rows = []
  let i = 0
  const n = s.length
  while (i < n) {
    // advance to start of a tuple
    while (i < n && s[i] !== '(') i++
    if (i >= n) break
    i++ // skip '('
    const row = []
    let field = ''
    let inStr = false
    let quoted = false
    while (i < n) {
      const c = s[i]
      if (inStr) {
        if (c === '\\') { field += s[i + 1] === undefined ? '' : s[i + 1]; i += 2; continue }
        if (c === "'") { inStr = false; i++; continue }
        field += c; i++; continue
      }
      if (c === "'") { inStr = true; quoted = true; i++; continue }
      if (c === ',') { row.push(quoted ? field : tok(field)); field = ''; quoted = false; i++; continue }
      if (c === ')') { row.push(quoted ? field : tok(field)); i++; break }
      field += c; i++
    }
    rows.push(row)
  }
  return rows
}
function tok(t) {
  t = t.trim()
  if (t === '' || t.toUpperCase() === 'NULL') return null
  return t
}

// ---------------------------------------------------------------------------
// Streaming reader: invoke a per-table row callback for every INSERT row.
// We register the columns we care about per table so memory stays low.
// ---------------------------------------------------------------------------
function streamDump(handlers) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(DUMP, { encoding: 'utf8' }),
      crlfDelay: Infinity
    })
    rl.on('line', line => {
      // Each table's data is one (very long) INSERT line in this dump.
      const m = /^INSERT INTO `([^`]+)` VALUES (.*);\s*$/.exec(line)
      if (!m) return
      const table = m[1]
      const h = handlers[table]
      if (!h) return
      for (const row of parseTuples(m[2])) h(row)
    })
    rl.on('close', resolve)
    rl.on('error', reject)
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const norm = s => (s == null ? '' : String(s).trim())
const keyOf = s => norm(s).toLowerCase().replace(/\s+/g, ' ')

function genderBucket(g) {
  const x = keyOf(g)
  if (x === 'male') return 'male'
  if (x === 'female') return 'female'
  return 'unsexed' // undetermined / indeterminate / unknown / blank
}

// parse a date-ish string -> ms epoch, or null
function parseDate(s) {
  s = norm(s)
  if (!s) return null
  // accept YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return null
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3])
  return Number.isNaN(t) ? null : t
}
const DAY = 86400000

function round1(x) { return Math.round(x * 10) / 10 }
function median(arr) {
  if (!arr.length) return 0
  const a = arr.slice().sort((x, y) => x - y)
  const mid = a.length >> 1
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2)
}

// ---------------------------------------------------------------------------
// 1) Load list.json -> map scientific_name/common_name -> tsn_id
// ---------------------------------------------------------------------------
const list = JSON.parse(fs.readFileSync(path.join(DATA, 'list.json'), 'utf8'))
const sciToId = new Map()
const commonToId = new Map()
for (const sp of list) {
  const id = Number(sp.tsn_id)
  if (!Number.isFinite(id)) continue
  const sci = keyOf(sp.scientific_name)
  const com = keyOf(sp.common_name)
  if (sci && !sciToId.has(sci)) sciToId.set(sci, id)
  if (com && !commonToId.has(com)) commonToId.set(com, id)
}
function resolveSpecies(scientific, common) {
  const s = keyOf(scientific)
  if (s && sciToId.has(s)) return sciToId.get(s)
  const c = keyOf(common)
  if (c && commonToId.has(c)) return commonToId.get(c)
  return null
}

// ---------------------------------------------------------------------------
// Accumulators keyed by species id
// ---------------------------------------------------------------------------
const mk = () => ({
  // pharmacy: medicine name -> { count, animals:Set, routes:Map }
  meds: new Map(),
  // surgery / anaesthesia accumulators (kept for completeness; see report)
  surgery: { total: 0, procedures: new Map(), recent: [] },
  anaesthesia: { total: 0, agents: new Map(), recent: [] },
  lab: new Map(), // testKey -> { test, animals:Set, values:[], unit }
  deaths: { male: 0, female: 0, unsexed: 0, ages: [] }
})
const acc = new Map()
const get = id => { let a = acc.get(id); if (!a) { a = mk(); acc.set(id, a) } return a }

// medical_record_id -> species id (built from medical_record_animals)
const recordToSpecies = new Map()
// medical_record_id -> set of animal identifiers (for per-animal pharmacy counts)
const recordToAnimals = new Map()

// Pass 1 needs medical_record_animals before prescriptions can be attributed,
// but we stream once: prescriptions appear AFTER medical_record_animals in the
// dump (alphabetical: medical_record_animals < medical_records < prescription_*
// < prescriptions). We buffer prescriptions only if their record isn't known yet
// — in practice the join table is fully read first, so direct lookup works.
const pendingPrescriptions = []

// ---------------------------------------------------------------------------
// Column indices (from CREATE TABLE inspection of the dump)
// ---------------------------------------------------------------------------
// medical_record_animals: id,medical_record_id(1),animal_id(2),sex(3),type(4),
//   breed_id,breed_name,morph_id,morph_name,common_name(9),scientific_name(10),...
const MRA = { record: 1, animal: 2, common: 9, scientific: 10 }
// prescriptions: id,source_id,gid,label,is_new_data,medical_record_id(5),
//   prescription_name(6),generic_name(7),type(8),delivery_route(9),...,start_date(25)..
const RX = { record: 5, name: 6, generic: 7, route: 9, dosage: 24, start: 25 }
// report_deaths: antz_animal_id(0),scientific_name(1),common_name(2),gender(3),
//   ...,birth_date(15),...,animals_died_count(22),...,discovered_date(26),...
const RD = { scientific: 1, common: 2, gender: 3, birth: 15, died: 23, discovered: 26 }

function attributePrescription(row) {
  const recId = norm(row[RX.record])
  const id = recordToSpecies.get(recId)
  if (id == null) return false
  const name = norm(row[RX.name]) || norm(row[RX.generic])
  if (!name) return true
  const route = norm(row[RX.route])
  const a = get(id)
  let e = a.meds.get(name)
  if (!e) { e = { name, count: 0, animals: new Set(), routes: new Map() }; a.meds.set(name, e) }
  e.count++
  // attribute to each animal on the medical record (for "animals" treated count)
  const animals = recordToAnimals.get(recId)
  if (animals) for (const an of animals) e.animals.add(an)
  if (route) e.routes.set(route, (e.routes.get(route) || 0) + 1)
  return true
}

async function main() {
  await streamDump({
    medical_record_animals(row) {
      const recId = norm(row[MRA.record])
      if (!recId) return
      const id = resolveSpecies(row[MRA.scientific], row[MRA.common])
      if (id != null) recordToSpecies.set(recId, id)
      const an = norm(row[MRA.animal])
      if (an) {
        let set = recordToAnimals.get(recId)
        if (!set) { set = new Set(); recordToAnimals.set(recId, set) }
        set.add(an)
      }
    },
    prescriptions(row) {
      if (!attributePrescription(row)) pendingPrescriptions.push(row)
    },
    report_deaths(row) {
      const id = resolveSpecies(row[RD.scientific], row[RD.common])
      if (id == null) return
      const a = get(id)
      const cnt = Math.max(1, Number(norm(row[RD.died])) || 1)
      const bucket = genderBucket(row[RD.gender])
      a.deaths[bucket] += cnt
      const b = parseDate(row[RD.birth])
      const d = parseDate(row[RD.discovered])
      if (b != null && d != null && d >= b) {
        const ageDays = Math.round((d - b) / DAY)
        for (let k = 0; k < cnt; k++) a.deaths.ages.push(ageDays)
      }
    }
  })

  // flush any prescriptions whose record wasn't yet known when first seen
  for (const row of pendingPrescriptions) attributePrescription(row)

  // -------------------------------------------------------------------------
  // Write enrichment into each detail file
  // -------------------------------------------------------------------------
  const files = fs.readdirSync(DETAIL_DIR).filter(f => f.endsWith('.json'))
  const stats = { files: 0, lab: 0, surgery: 0, anaesthesia: 0, pharmacy: 0, deathsGender: 0, deathsAge: 0 }

  for (const f of files) {
    const id = Number(f.slice(0, -5))
    const p = path.join(DETAIL_DIR, f)
    const d = JSON.parse(fs.readFileSync(p, 'utf8'))
    const a = acc.get(id)

    // lab — no pathology/lab numeric test source exists in this dump (see report)
    const lab = { tests: [] }
    if (a && a.lab.size) {
      for (const e of a.lab.values()) {
        const vals = e.values
        lab.tests.push({
          test: e.test, animals: e.animals.size, count: vals.length,
          min: Math.min(...vals), avg: round1(vals.reduce((x, y) => x + y, 0) / vals.length),
          max: Math.max(...vals), unit: e.unit || ''
        })
      }
      lab.tests.sort((x, y) => y.count - x.count)
    }

    // surgery / anaesthesia — no structured source in this dump (see report)
    const surgery = { total: 0, procedures: [], recent: [] }
    const anaesthesia = { total: 0, agents: [], recent: [] }

    // pharmacy — all medicines used
    const pharmacy = { total: 0, medicines: [] }
    if (a && a.meds.size) {
      for (const e of a.meds.values()) {
        // dominant route
        let route = ''
        let best = -1
        for (const [r, c] of e.routes) if (c > best) { best = c; route = r }
        pharmacy.medicines.push({ name: e.name, count: e.count, animals: e.animals.size, route })
        pharmacy.total += e.count
      }
      pharmacy.medicines.sort((x, y) => y.count - x.count || x.name.localeCompare(y.name))
    }

    d.lab = lab
    d.surgery = surgery
    d.anaesthesia = anaesthesia
    d.pharmacy = pharmacy

    // enrich existing deaths object (only if one exists)
    if (d.deaths && typeof d.deaths === 'object') {
      const dg = a ? a.deaths : { male: 0, female: 0, unsexed: 0, ages: [] }
      d.deaths.byGender = { male: dg.male, female: dg.female, unsexed: dg.unsexed }
      const ages = dg.ages
      d.deaths.ageAtDeath = ages.length
        ? {
            avg: Math.round(ages.reduce((x, y) => x + y, 0) / ages.length),
            median: median(ages), min: Math.min(...ages), max: Math.max(...ages), count: ages.length
          }
        : { avg: 0, median: 0, min: 0, max: 0, count: 0 }
      if (dg.male || dg.female || dg.unsexed) stats.deathsGender++
      if (ages.length) stats.deathsAge++
    }

    fs.writeFileSync(p, JSON.stringify(d))
    stats.files++
    if (lab.tests.length) stats.lab++
    if (surgery.total) stats.surgery++
    if (anaesthesia.total) stats.anaesthesia++
    if (pharmacy.total) stats.pharmacy++
  }

  // -------------------------------------------------------------------------
  // Validation report
  // -------------------------------------------------------------------------
  console.log('=== build-medical-extras: density ===')
  console.log(JSON.stringify(stats, null, 2))

  // pick up to 3 species with pharmacy data for a sample print
  const withRx = [...acc.entries()].filter(([, v]) => v.meds.size).sort((a, b) => b[1].meds.size - a[1].meds.size).slice(0, 3)
  for (const [id] of withRx) {
    const d = JSON.parse(fs.readFileSync(path.join(DETAIL_DIR, id + '.json'), 'utf8'))
    console.log(`\n--- species ${id}: ${d.header && d.header.scientificName} (${d.header && d.header.commonName}) ---`)
    console.log('pharmacy.total =', d.pharmacy.total, '| medicines:', d.pharmacy.medicines.slice(0, 5))
    console.log('surgery =', JSON.stringify(d.surgery))
    console.log('anaesthesia =', JSON.stringify(d.anaesthesia))
    console.log('lab.tests =', d.lab.tests.length)
    if (d.deaths) console.log('deaths.byGender =', JSON.stringify(d.deaths.byGender), '| ageAtDeath =', JSON.stringify(d.deaths.ageAtDeath))
  }
}

main().catch(e => { console.error(e); process.exit(1) })
