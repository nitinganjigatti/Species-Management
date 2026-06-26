/**
 * Roll up per-species operational counts (births, deaths, enclosures, pairs, chipped/identified)
 * from each detail/<id>.json into public/species-data/list.json so the species-list table can
 * show the prototype's operational columns. Sites count already comes from the `sites` array.
 *
 * Run:  node scripts/build-species-list-extras.js
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(process.cwd(), 'public', 'species-data')
const LIST = path.join(DATA, 'list.json')
const DETAIL = path.join(DATA, 'detail')

const raw = JSON.parse(fs.readFileSync(LIST, 'utf8'))
const list = raw?.data?.datalist || raw?.datalist || raw
if (!Array.isArray(list)) throw new Error('Could not locate the datalist array in list.json')

let merged = 0
let missing = 0
for (const rec of list) {
  const id = rec.tsn_id
  const file = path.join(DETAIL, `${id}.json`)
  if (!fs.existsSync(file)) {
    missing++
    rec.births = rec.births || 0
    rec.deaths = rec.deaths || 0
    rec.enclosures = rec.enclosures || 0
    rec.pairs = rec.pairs || 0
    rec.chipped = rec.chipped || 0
    continue
  }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'))
  const h = d.header || {}
  rec.births = h.births || 0
  rec.deaths = h.deaths || 0
  rec.enclosures = h.enclosures || 0
  rec.pairs = h.pairs || 0
  rec.chipped = (d.identification && d.identification.total) || 0
  merged++
}

fs.writeFileSync(LIST, JSON.stringify(raw))
console.log(`Merged ${merged} species, ${missing} missing detail files → ${LIST}`)
