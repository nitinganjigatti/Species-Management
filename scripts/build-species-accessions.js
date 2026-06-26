/* Rolls up per-species ACCESSIONS and ENCLOSURE CHANGES (transfers) from the wildventure MySQL
   dump into public/species-data/list.json, so the species-list table can show them as columns.

   Adds (additive — never removes existing keys) to each list.json record:
     accessions   = total animals accessioned into the collection (sum of animal_count)
     enclChanges  = number of enclosure-change / transfer events recorded

   Species are matched by scientific_name (fallback common_name), the same keying as list.json
   and build-medical-extras.js. Idempotent: re-running overwrites only these two fields.

   Run:
     node --max-old-space-size=4096 scripts/build-species-accessions.js
   Override dump path:
     DUMP=/path/to/Dump20260622.sql node scripts/build-species-accessions.js
*/
'use strict'
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const DUMP = process.env.DUMP || '/Users/nitin/Nitin Claude/wildventure-species-mgmt-main/Dump20260622.sql'
const DATA = path.join(__dirname, '..', 'public', 'species-data')
const LIST = path.join(DATA, 'list.json')

// --- MySQL VALUES tuple parser (same as build-medical-extras.js) ---
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

// Column indices (report_accessions / report_transfers share the leading columns):
//   0 antz_animal_id, 1 scientific_name, 2 common_name, ..., 18 animal_count
const SCI = 1
const COMMON = 2
const COUNT = 18

const accessions = new Map() // tsn_id -> total animals accessioned
const enclChanges = new Map() // tsn_id -> transfer/enclosure-change events
let accRows = 0
let trfRows = 0

async function main() {
  await streamDump({
    report_accessions(row) {
      accRows++
      const id = resolveSpecies(row[SCI], row[COMMON])
      if (id == null) return
      const n = Math.max(1, Number(norm(row[COUNT])) || 1)
      accessions.set(id, (accessions.get(id) || 0) + n)
    },
    report_transfers(row) {
      trfRows++
      const id = resolveSpecies(row[SCI], row[COMMON])
      if (id == null) return
      enclChanges.set(id, (enclChanges.get(id) || 0) + 1)
    }
  })

  let accHit = 0
  let trfHit = 0
  for (const sp of list) {
    const id = Number(sp.tsn_id)
    sp.accessions = accessions.get(id) || 0
    sp.enclChanges = enclChanges.get(id) || 0
    if (sp.accessions) accHit++
    if (sp.enclChanges) trfHit++
  }

  fs.writeFileSync(LIST, JSON.stringify(list))

  console.log('=== build-species-accessions ===')
  console.log('accessions rows parsed:', accRows, '| species with accessions:', accHit, `/ ${list.length}`)
  console.log('transfer rows parsed:', trfRows, '| species with enclosure changes:', trfHit, `/ ${list.length}`)
  const top = [...accessions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  for (const [id, n] of top) {
    const sp = list.find(s => Number(s.tsn_id) === id)
    console.log(`  ${id} ${sp && sp.scientific_name}: accessions=${n} enclChanges=${enclChanges.get(id) || 0}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
