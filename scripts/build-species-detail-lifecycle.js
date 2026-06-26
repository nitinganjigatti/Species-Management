/* Per-species LIFECYCLE event extract for the species-detail Circle of Life tab.

   Writes one sidecar per species → public/species-data/lifecycle/<tsn_id>.json with REAL,
   day-level birth & death EVENTS from the wildventure dump, so the Circle of Life tab can
   rescope every stat/chart (trend, gender, site, cause, carcass, age-at-death) to any time
   window — preset (Today / Last week / …) or month·year range.

   Shape (compact keys to keep files small):
     {
       births: [ { d:"YYYY-MM-DD", g, s, e, b, k } ],   // g gender, s site, e enclosure, b breed, k count
       deaths: [ { d, g, s, e, m, c, y, a, k } ]         // m manner, c carcass, y necropsy, a age-years|null
     }

   Only species present in list.json (matched by scientific_name → tsn_id) get a file; species
   with no events are skipped (the tab's lazy fetch treats 404 as "no data").

   Run:
     node --max-old-space-size=4096 scripts/build-species-detail-lifecycle.js
   Override dump path:
     DUMP=/path/to/Dump20260622.sql node scripts/build-species-detail-lifecycle.js
*/
'use strict'
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const DUMP = process.env.DUMP || '/Users/nitin/Nitin Claude/wildventure-species-mgmt-main/Dump20260622.sql'
const DATA = path.join(__dirname, '..', 'public', 'species-data')
const LIST = path.join(DATA, 'list.json')
const OUT = path.join(DATA, 'lifecycle')

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
const isoDate = v => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(norm(v)); return m ? `${m[1]}-${m[2]}-${m[3]}` : null }
const dayMs = v => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(norm(v)); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null }
const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000
const clean = v => (v == null || v === '' ? undefined : String(v).trim())
// Identifier fields arrive as the literal "''" when empty — normalise those to undefined.
const cleanId = v => {
  const s = clean(v)
  if (!s) return undefined
  const t = s.replace(/^'+|'+$/g, '').trim()

  return t || undefined
}

// list.json: scientific/common -> tsn_id
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
const resolveSpecies = (sci, com) => {
  const s = keyOf(sci); if (s && sciToId.has(s)) return sciToId.get(s)
  const c = keyOf(com); if (c && commonToId.has(c)) return commonToId.get(c)
  return null
}

// column indices
const AID = 0, SCI = 1, COMMON = 2, GENDER = 3, ID_TYPE = 4, ID_VAL = 5, SITE = 6, ENCL = 8, BREED = 11, BIRTH = 15, COUNT = 18
const DIED = 23, MORT = 24, MANNER = 27, CARCASS = 29, NECROPSY = 31

const events = new Map() // id -> { births: [], deaths: [] }
const bucket = id => { let e = events.get(id); if (!e) { e = { births: [], deaths: [] }; events.set(id, e) } return e }
let bRows = 0, dRows = 0

async function main() {
  await streamDump({
    report_births(row) {
      bRows++
      const id = resolveSpecies(row[SCI], row[COMMON]); if (id == null) return
      const d = isoDate(row[BIRTH]); if (!d) return
      const ev = { d, aid: clean(row[AID]), idn: cleanId(row[ID_TYPE]), idv: cleanId(row[ID_VAL]), g: clean(row[GENDER]), s: clean(row[SITE]), e: clean(row[ENCL]), b: clean(row[BREED]) }
      const k = Number(norm(row[COUNT])) || 1; if (k > 1) ev.k = k
      bucket(id).births.push(ev)
    },
    report_deaths(row) {
      dRows++
      const id = resolveSpecies(row[SCI], row[COMMON]); if (id == null) return
      const d = isoDate(row[MORT]); if (!d) return
      const ev = { d, aid: clean(row[AID]), idn: cleanId(row[ID_TYPE]), idv: cleanId(row[ID_VAL]), g: clean(row[GENDER]), s: clean(row[SITE]), e: clean(row[ENCL]), m: clean(row[MANNER]), c: clean(row[CARCASS]), y: clean(row[NECROPSY]) }
      const k = Number(norm(row[DIED])) || 1; if (k > 1) ev.k = k
      // age at death (years) — reject sentinel birth dates (<1950) that encode "unknown"
      const by = (() => { const mm = /^(\d{4})-/.exec(norm(row[BIRTH])); return mm ? +mm[1] : 0 })()
      const birth = by >= 1950 ? dayMs(row[BIRTH]) : null
      const death = dayMs(row[MORT])
      if (birth != null && death != null) {
        const yrs = (death - birth) / MS_PER_YEAR
        if (yrs >= 0 && yrs <= 120) ev.a = Math.round(yrs * 10) / 10
      }
      bucket(id).deaths.push(ev)
    }
  })

  fs.mkdirSync(OUT, { recursive: true })
  // Drop any stale sidecars from a prior run so the directory always reflects this extract.
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.json')) fs.unlinkSync(path.join(OUT, f))

  let files = 0, totalB = 0, totalD = 0
  const byDate = a => a.sort((x, y) => (x.d < y.d ? 1 : x.d > y.d ? -1 : 0)) // newest first
  for (const [id, e] of events) {
    if (!e.births.length && !e.deaths.length) continue
    byDate(e.births); byDate(e.deaths)
    fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(e))
    files++; totalB += e.births.length; totalD += e.deaths.length
  }

  console.log('=== build-species-detail-lifecycle ===')
  console.log('birth rows:', bRows, '| death rows:', dRows)
  console.log('sidecar files written:', files, '| birth events:', totalB, '| death events:', totalD)
  const s2150 = events.get(2150)
  if (s2150) console.log('2150 → births:', s2150.births.length, 'deaths:', s2150.deaths.length, '| sample death:', JSON.stringify(s2150.deaths[0]))
}

main().catch(e => { console.error(e); process.exit(1) })
