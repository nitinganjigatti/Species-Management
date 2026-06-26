/* Rolls up per-species TEMPORAL signals from the wildventure MySQL dump into
   public/species-data/list.json, powering the list-screen Analysis filters:
     • Births by month/year   (report_births.birth_date)
     • Deaths by month/year    (report_deaths.mortality_recorded_on)
     • Lifespan / age-at-death  (report_deaths.mortality_recorded_on − birth_date)

   Adds (additive — never removes existing keys) to each list.json record:
     birthsMonthly  = { "YYYY-MM": animals_born }   (sparse — only months with events)
     deathsMonthly  = { "YYYY-MM": animals_died }    (sparse)
     lifespan       = { avgYears, minYears, maxYears, count } | null
                       (count = death records with a usable birth_date)

   Species are matched by scientific_name (fallback common_name) — the same keying as
   build-species-accessions.js / build-medical-extras.js. Idempotent: re-running overwrites
   only these three fields.

   Run:
     node --max-old-space-size=4096 scripts/build-species-list-temporal.js
   Override dump path:
     DUMP=/path/to/Dump20260622.sql node scripts/build-species-list-temporal.js
*/
'use strict'
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const DUMP = process.env.DUMP || '/Users/nitin/Nitin Claude/wildventure-species-mgmt-main/Dump20260622.sql'
const DATA = path.join(__dirname, '..', 'public', 'species-data')
const LIST = path.join(DATA, 'list.json')

// --- MySQL VALUES tuple parser (same as build-species-accessions.js) ---
function parseTuples(s) {
  const rows = []
  let i = 0
  const n = s.length
  while (i < n) {
    while (i < n && s[i] !== '(') i++
    if (i >= n) break
    i++
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

function streamDump(handlers) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(DUMP, { encoding: 'utf8' }), crlfDelay: Infinity })
    rl.on('line', line => {
      const m = /^INSERT INTO `([^`]+)` VALUES (.*);\s*$/.exec(line)
      if (!m) return
      const h = handlers[m[1]]
      if (!h) return
      for (const row of parseTuples(m[2])) h(row)
    })
    rl.on('close', resolve)
    rl.on('error', reject)
  })
}

const norm = s => (s == null ? '' : String(s).trim())
const keyOf = s => norm(s).toLowerCase().replace(/\s+/g, ' ')

// "YYYY-MM-DD..." -> "YYYY-MM" (null if not a clean ISO-ish date)
const monthBucket = v => {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(norm(v))
  return m ? `${m[1]}-${m[2]}` : null
}
// "YYYY-MM-DD..." -> epoch ms at midnight (null if unparseable)
const dayMs = v => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(norm(v))
  if (!m) return null
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isFinite(t) ? t : null
}
const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000

// --- list.json: scientific/common -> tsn_id ---
const list = JSON.parse(fs.readFileSync(LIST, 'utf8'))
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

// Shared leading columns: 0 antz_animal_id, 1 scientific_name, 2 common_name, … 15 birth_date, 18 animal_count
const SCI = 1
const COMMON = 2
const BIRTH_DATE = 15
const ANIMAL_COUNT = 18
// report_deaths extras: 23 animals_died_count, 24 mortality_recorded_on
const DIED_COUNT = 23
const MORTALITY_ON = 24

const birthsMonthly = new Map() // id -> { "YYYY-MM": n }
const deathsMonthly = new Map() // id -> { "YYYY-MM": n }
const lifeAcc = new Map() // id -> { sumMs, count, minMs, maxMs }
let bRows = 0
let dRows = 0

const bump = (map, id, key, n) => {
  let m = map.get(id)
  if (!m) { m = {}; map.set(id, m) }
  m[key] = (m[key] || 0) + n
}

async function main() {
  await streamDump({
    report_births(row) {
      bRows++
      const id = resolveSpecies(row[SCI], row[COMMON])
      if (id == null) return
      const bucket = monthBucket(row[BIRTH_DATE])
      if (!bucket) return
      const n = Math.max(1, Number(norm(row[ANIMAL_COUNT])) || 1)
      bump(birthsMonthly, id, bucket, n)
    },
    report_deaths(row) {
      dRows++
      const id = resolveSpecies(row[SCI], row[COMMON])
      if (id == null) return
      const n = Math.max(1, Number(norm(row[DIED_COUNT])) || 1)
      const bucket = monthBucket(row[MORTALITY_ON])
      if (bucket) bump(deathsMonthly, id, bucket, n)

      // lifespan / age-at-death. Reject sentinel birth dates (0000-00-00, 0928-…) — they
      // encode "unknown" and otherwise inflate age to 126y / 1097y. Real births are >= 1950.
      const birthYear = (() => { const m = /^(\d{4})-/.exec(norm(row[BIRTH_DATE])); return m ? Number(m[1]) : 0 })()
      const birth = birthYear >= 1950 ? dayMs(row[BIRTH_DATE]) : null
      const death = dayMs(row[MORTALITY_ON])
      if (birth != null && death != null) {
        const ms = death - birth
        if (ms >= 0 && ms <= 120 * MS_PER_YEAR) {
          let a = lifeAcc.get(id)
          if (!a) { a = { sumMs: 0, count: 0, minMs: Infinity, maxMs: -Infinity, neonatal: 0, sumAdultMs: 0, adultCount: 0 }; lifeAcc.set(id, a) }
          a.sumMs += ms
          a.count++
          if (ms < a.minMs) a.minMs = ms
          if (ms > a.maxMs) a.maxMs = ms
          if (ms < MS_PER_YEAR) a.neonatal++
          else { a.sumAdultMs += ms; a.adultCount++ }
        }
      }
    }
  })

  let bHit = 0
  let dHit = 0
  let lHit = 0
  const round1 = x => Math.round(x * 10) / 10
  for (const sp of list) {
    const id = Number(sp.tsn_id)
    sp.birthsMonthly = birthsMonthly.get(id) || {}
    sp.deathsMonthly = deathsMonthly.get(id) || {}
    const a = lifeAcc.get(id)
    sp.lifespan = a
      ? {
          avgYears: round1(a.sumMs / a.count / MS_PER_YEAR), // avg age at death (all records, neonatal-inclusive)
          avgAdultYears: a.adultCount ? round1(a.sumAdultMs / a.adultCount / MS_PER_YEAR) : null, // excl. <1y deaths
          maxYears: round1(a.maxMs / MS_PER_YEAR), // longest observed life
          minYears: round1(a.minMs / MS_PER_YEAR),
          count: a.count, // usable death records
          neonatal: a.neonatal, // of which died under 1 year
          adultCount: a.adultCount
        }
      : null
    if (Object.keys(sp.birthsMonthly).length) bHit++
    if (Object.keys(sp.deathsMonthly).length) dHit++
    if (sp.lifespan) lHit++
  }

  fs.writeFileSync(LIST, JSON.stringify(list))

  console.log('=== build-species-list-temporal ===')
  console.log('birth rows parsed:', bRows, '| species with birth months:', bHit, `/ ${list.length}`)
  console.log('death rows parsed:', dRows, '| species with death months:', dHit, `/ ${list.length}`)
  console.log('species with lifespan (age-at-death):', lHit, `/ ${list.length}`)
  const withAdult = list.filter(s => s.lifespan && s.lifespan.avgAdultYears != null).length
  console.log('  …of which have a non-neonatal (adult) avg:', withAdult)
  const topLife = list.filter(s => s.lifespan).sort((a, b) => b.lifespan.maxYears - a.lifespan.maxYears).slice(0, 6)
  console.log('top by longest observed life:')
  for (const s of topLife) {
    const l = s.lifespan
    console.log(`  ${s.tsn_id} ${s.scientific_name}: avg ${l.avgYears}y (adult ${l.avgAdultYears ?? '—'}y), max ${l.maxYears}y, n=${l.count} (${l.neonatal} <1y)`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
