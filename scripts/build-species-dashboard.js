/* Rolls up public/species-data/{list.json,detail/<id>.json} into dashboard.json.
   Frontend-only fixture build. Re-run: `node scripts/build-species-dashboard.js`.
   Override the "as-of" year for YTD/trend with YTD_YEAR=2026. */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '..', 'public', 'species-data')
const list = JSON.parse(fs.readFileSync(path.join(DATA, 'list.json'), 'utf8'))

const YEAR = Number(process.env.YTD_YEAR) || new Date().getFullYear()

// readiness — mirrors getReadiness() in speciesListing.utils.ts
function readiness(m, f, u) {
  if (m <= 0 && f <= 0 && u <= 0) return 'no_data'
  if (m > 0 && f > 0) return 'can_pair'
  if (u > 0) return 'needs_sexing'

  return 'single_sex'
}
function iucnCode(s) {
  s = s || ''
  if (s.startsWith('Critically Endangered')) return 'CR'
  if (s.startsWith('Endangered')) return 'EN'
  if (s.startsWith('Vulnerable')) return 'VU'
  if (s.startsWith('Near Threatened')) return 'NT'
  if (s.startsWith('Least Concern')) return 'LC'

  return 'OTHER'
}
const THREATENED = new Set(['CR', 'EN', 'VU'])
const num = v => Number(v) || 0

// trailing 12 month labels ending current month of YEAR
function last12Labels() {
  const out = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(YEAR, new Date().getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return out
}

const totals = { species: list.length, animals: { m: 0, f: 0, u: 0, total: 0 } }
const iucnMap = {}
const codeCount = { CR: 0, EN: 0, VU: 0 }
let threatened = 0
const classMap = {}
const catMap = {}
const citesMap = {}
const POP_BANDS = [
  { key: '1-3', label: '1–3', min: 1, max: 3 },
  { key: '4-10', label: '4–10', min: 4, max: 10 },
  { key: '11-50', label: '11–50', min: 11, max: 50 },
  { key: '51-100', label: '51–100', min: 51, max: 100 },
  { key: '100+', label: '100+', min: 101, max: Infinity }
]
const popCounts = {}
const breeding = { can_pair: 0, needs_sexing: 0, single_sex: 0, no_data: 0 }
const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, births: 0, deaths: 0, net: 0 }))
let birthsYTD = 0, deathsYTD = 0
const trendLabels = last12Labels()
const trend = trendLabels.map(label => ({ label, births: 0, deaths: 0 }))
const trendIdx = Object.fromEntries(trendLabels.map((l, i) => [l, i]))
let assessedAnimals = 0, totalReal = 0
let sexedAnimals = 0, chippedAnimals = 0, totalHeaderAnimals = 0
const ALERT_DEFS = [
  { key: 'overdue_assessment', src: 'overdue', label: 'Overdue assessment', severity: 'high' },
  { key: 'weight_loss', src: 'weightDecreasing', label: 'Lost >10% weight', severity: 'high' },
  { key: 'weight_gain', src: 'weightIncreasing', label: 'Gained >10% weight', severity: 'medium' },
  { key: 'never_assessed', src: 'neverWeighed', label: 'Never assessed', severity: 'medium' },
  { key: 'under_monitored', src: 'underMonitored', label: 'Under-monitored', severity: 'low' }
]
const alertAgg = Object.fromEntries(ALERT_DEFS.map(a => [a.key, { speciesCount: 0, animalCount: 0, speciesIds: [] }]))
const deathMonthValues = {}
let maxDeathMonth = ''

for (const sp of list) {
  const id = num(sp.tsn_id)
  const m = num(sp.total_male), f = num(sp.total_female)
  const u = num(sp.total_undetermined) + num(sp.total_indeterminate)
  totals.animals.m += m; totals.animals.f += f; totals.animals.u += u
  totals.animals.total += num(sp.animal_count)

  const status = sp.iucn_status || '(Unknown)'
  iucnMap[status] = (iucnMap[status] || 0) + 1
  const code = iucnCode(status)
  if (THREATENED.has(code)) { threatened++; codeCount[code]++ }

  const cls = sp.class_name || '(Unknown)'
  classMap[cls] = (classMap[cls] || 0) + 1

  const cat = sp.breeding_category || '(Unknown)'
  catMap[cat] = (catMap[cat] || 0) + 1
  const cit = sp.cites_appendix || '(Unknown)'
  citesMap[cit] = (citesMap[cit] || 0) + 1
  const pop = num(sp.animal_count)
  const band = POP_BANDS.find(b => pop >= b.min && pop <= b.max)
  if (band) popCounts[band.key] = (popCounts[band.key] || 0) + 1

  breeding[readiness(m, f, u)]++

  let d
  try { d = JSON.parse(fs.readFileSync(path.join(DATA, 'detail', `${id}.json`), 'utf8')) } catch { continue }

  for (const r of (d.births && d.births.byYearMonth) || []) {
    if (r.label && r.label.startsWith(`${YEAR}-`)) { birthsYTD += num(r.value); monthly[num(r.label.slice(5, 7)) - 1].births += num(r.value) }
    if (r.label in trendIdx) trend[trendIdx[r.label]].births += num(r.value)
  }
  const dmv = {}
  for (const r of (d.deaths && d.deaths.byYearMonth) || []) {
    if (r.label && r.label.startsWith(`${YEAR}-`)) { deathsYTD += num(r.value); monthly[num(r.label.slice(5, 7)) - 1].deaths += num(r.value) }
    if (r.label in trendIdx) trend[trendIdx[r.label]].deaths += num(r.value)
    dmv[r.label] = num(r.value)
    if (r.label > maxDeathMonth) maxDeathMonth = r.label
  }
  deathMonthValues[id] = dmv

  const summ = (d.assessments && d.assessments.summary) || {}
  const real = num(summ.realAnimals) || num(d.header && d.header.total)
  const cov = num(summ.weightCoverage)
  assessedAnimals += Math.round(real * cov / 100); totalReal += real

  const hdr = d.header || {}
  const ht = num(hdr.total)
  sexedAnimals += Math.round((ht * num(hdr.sexedPct)) / 100)
  chippedAnimals += Math.round((ht * num(hdr.chippedPct)) / 100)
  totalHeaderAnimals += ht

  const alerts = (d.assessments && d.assessments.alerts) || {}
  for (const def of ALERT_DEFS) {
    const arr = alerts[def.src]
    if (Array.isArray(arr) && arr.length) {
      alertAgg[def.key].speciesCount++
      alertAgg[def.key].animalCount += arr.length
      alertAgg[def.key].speciesIds.push(id)
    }
  }
}

monthly.forEach(r => { r.net = r.births - r.deaths })

const spike = { speciesCount: 0, animalCount: 0, speciesIds: [] }
if (maxDeathMonth) {
  for (const [id, dmv] of Object.entries(deathMonthValues)) {
    const v = dmv[maxDeathMonth] || 0
    const others = Object.entries(dmv).filter(([l]) => l !== maxDeathMonth).map(([, x]) => x)
    const base = others.length ? others.reduce((a, b) => a + b, 0) / others.length : 0
    if (v >= 2 && v > 2 * base) { spike.speciesCount++; spike.animalCount += v; spike.speciesIds.push(Number(id)) }
  }
}

const out = {
  totals,
  netYTD: { year: YEAR, births: birthsYTD, deaths: deathsYTD, net: birthsYTD - deathsYTD, monthly },
  iucn: Object.entries(iucnMap).map(([status, speciesCount]) => ({ status, code: iucnCode(status), speciesCount }))
    .sort((a, b) => b.speciesCount - a.speciesCount),
  threatened: { count: threatened, byCode: codeCount },
  breeding,
  coverage: {
    pct: totalReal ? Math.round((assessedAnimals / totalReal) * 100) : 0,
    assessedAnimals,
    totalAnimals: totalReal,
    sexedPct: totalHeaderAnimals ? Math.round((sexedAnimals / totalHeaderAnimals) * 100) : 0,
    chippedPct: totalHeaderAnimals ? Math.round((chippedAnimals / totalHeaderAnimals) * 100) : 0
  },
  byClass: Object.entries(classMap).map(([cls, speciesCount]) => ({ class: cls, speciesCount }))
    .sort((a, b) => b.speciesCount - a.speciesCount),
  category: Object.entries(catMap).map(([label, speciesCount]) => ({ label, speciesCount }))
    .sort((a, b) => b.speciesCount - a.speciesCount),
  cites: Object.entries(citesMap).map(([label, speciesCount]) => ({ label, speciesCount }))
    .sort((a, b) => b.speciesCount - a.speciesCount),
  populationBands: POP_BANDS.map(b => ({ key: b.key, label: b.label, speciesCount: popCounts[b.key] || 0 })),
  alerts: [
    ...ALERT_DEFS.map(def => ({
      key: def.key, label: def.label, severity: def.severity,
      speciesCount: alertAgg[def.key].speciesCount, animalCount: alertAgg[def.key].animalCount,
      pctSpecies: Math.round(alertAgg[def.key].speciesCount / totals.species * 1000) / 10,
      speciesIds: alertAgg[def.key].speciesIds
    })),
    { key: 'deaths_spike', label: 'Deaths spike (latest month)', severity: 'low',
      speciesCount: spike.speciesCount, animalCount: spike.animalCount,
      pctSpecies: Math.round(spike.speciesCount / totals.species * 1000) / 10, speciesIds: spike.speciesIds }
  ].sort((a, b) => b.speciesCount - a.speciesCount),
  trend12: trend,
  generatedAt: new Date().toISOString()
}

fs.writeFileSync(path.join(DATA, 'dashboard.json'), JSON.stringify(out))
console.log(`dashboard.json written: ${out.totals.species} species, threatened ${out.threatened.count}, ` +
  `netYTD ${out.netYTD.net}, coverage ${out.coverage.pct}%, alerts ${out.alerts.length}`)
