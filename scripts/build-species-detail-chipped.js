/**
 * Patch `chippedPct` into every detail header JSON, sourced from list.json
 * (chipped count / animal_count). Mirrors how `sexedPct` already rides in the
 * detail header. Idempotent — safe to re-run.
 *
 * Run:  node scripts/build-species-detail-chipped.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(process.cwd(), 'public', 'species-data')
const DETAIL_DIR = path.join(ROOT, 'detail')

const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'list.json'), 'utf8'))
const byId = new Map(list.map(r => [String(r.tsn_id), r]))

let patched = 0
let missing = 0
for (const file of fs.readdirSync(DETAIL_DIR)) {
  if (!file.endsWith('.json')) continue
  const id = file.replace(/\.json$/, '')
  const row = byId.get(id)
  if (!row) { missing++; continue }

  const animals = Number(row.animal_count) || 0
  const chipped = Number(row.chipped) || 0
  const pct = animals > 0 ? Math.round((chipped / animals) * 100) : 0

  const fp = path.join(DETAIL_DIR, file)
  const detail = JSON.parse(fs.readFileSync(fp, 'utf8'))
  if (!detail.header) detail.header = {}
  detail.header.chippedPct = pct
  fs.writeFileSync(fp, JSON.stringify(detail))
  patched++
}

console.log(`chippedPct patched into ${patched} detail files (${missing} had no list row)`)
