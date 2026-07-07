/**
 * Self-contained QA for the Species Management → Medical → Symptoms flow.
 * Spins up its OWN throwaway WSO2-off dev server (port 3010, isolated .next-qa dir so it
 * never touches a running :3000), drives the Symptoms tab + its stat-tile side sheets with a
 * stubbed auth session, and reports the console/page errors that originate in species code.
 *
 * Prereq (one time):  npm i --no-save playwright && npx playwright install chromium
 * Run:                NODE_PATH="$(pwd)/node_modules" node scripts/qa-symptoms-flow.js
 * Exits 0 = no species-scoped errors, 1 = errors found (printed).
 */
const { spawn } = require('child_process')
const http = require('http')
const path = require('path')
const fs = require('fs')

const PORT = 3010
const BASE = `http://localhost:${PORT}/species-management`
const DIST = '.next-qa'
const OUT = path.join(process.cwd(), '.screenshots-qa')
fs.mkdirSync(OUT, { recursive: true })

// files whose errors we actually care about (our scope)
const SPECIES_RE = /species-management|MedicalTab|detailUi|SpeciesDetail|build-species/i

const USER = { user_email: 'dev@antz.local', user_first_name: 'Dev', user_last_name: 'User', zoos: [{ zoo_id: 1, zoo_name: 'Dev Zoo' }] }
const REFRESH_BODY = { token: 'dev-jwt-token', user: USER, roles: { role_id: 1, role_name: 'admin' }, modules: {} }

const sleep = ms => new Promise(r => setTimeout(r, ms))
const ping = () =>
  new Promise(res => {
    const req = http.get(`http://localhost:${PORT}/`, r => { r.resume(); res(r.statusCode > 0) })
    req.on('error', () => res(false))
    req.setTimeout(2000, () => { req.destroy(); res(false) })
  })

async function waitForServer(timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await ping()) return true
    await sleep(1500)
  }

  return false
}

let server
async function main() {
  console.log('▶ starting throwaway WSO2-off dev server on :' + PORT + ' (dist ' + DIST + ')…')
  server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    env: { ...process.env, NEXT_PUBLIC_WSO2_AUTH_ENABLED: 'false', NEXT_PUBLIC_PUBLIC_DEMO: 'false', NEXT_DIST_DIR: DIST },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  server.stdout.on('data', d => { if (/error|warn/i.test(String(d))) process.stdout.write('  [dev] ' + d) })
  server.stderr.on('data', d => process.stdout.write('  [dev!] ' + d))

  if (!(await waitForServer(180000))) throw new Error('dev server never became ready')
  console.log('✔ server up — launching browser')

  const { chromium } = require('playwright')
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } })
  await ctx.addInitScript(([user]) => {
    localStorage.setItem('accessToken', 'dev-jwt-token')
    localStorage.setItem('userData', JSON.stringify({ email: user.user_email, fullName: user.user_first_name, lastName: user.user_last_name, role: 'admin', id: 1, username: user.user_first_name }))
    localStorage.setItem('userDetails', JSON.stringify({ token: 'dev-jwt-token', user }))
    localStorage.setItem('role', JSON.stringify('admin'))
  }, [USER])
  await ctx.route('**://auth.antzsystems.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' }))
  await ctx.route('**://api.dev.antzsystems.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' }))
  await ctx.route('**/v1/auth/refreshtoken', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REFRESH_BODY) }))

  const page = await ctx.newPage()
  const errors = []
  const record = (kind, text, loc) => errors.push({ kind, text: String(text).slice(0, 400), loc: loc || '' })
  page.on('console', m => { if (m.type() === 'error') record('console', m.text(), m.location() && m.location().url) })
  page.on('pageerror', e => record('pageerror', (e && e.stack) || e))

  const settle = async () => { await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1200) }
  const clickByText = async (re, role) => {
    const loc = role ? page.getByRole(role, { name: re }) : page.getByText(re, { exact: false })
    if (await loc.count()) { await loc.first().click().catch(() => {}); return true }

    return false
  }

  const findings = []
  console.log('▶ opening mammal 2150 detail')
  await page.goto(`${BASE}/2150/`, { waitUntil: 'domcontentloaded' })
  await settle()

  // Detail tabs are a vertical sidebar (NOT ARIA tabs) → click by exact text.
  console.log('▶ Medical tab')
  const medical = page.getByText('Medical', { exact: true }).first()
  if (!(await medical.count())) { console.log('  ✗ Medical tab not found'); findings.push('Medical tab NOT FOUND') }
  await medical.click().catch(() => {})
  await settle()

  console.log('▶ Symptoms sub-tab')
  const symptoms = page.getByText('Symptoms', { exact: true }).first()
  await symptoms.click().catch(() => {})
  await settle()
  await page.screenshot({ path: path.join(OUT, 'symptoms-tab.png'), fullPage: true })

  const TILES = ['Active', 'Animals Affected', 'Most Recurring', 'Long-open Cases']
  for (const tile of TILES) {
    console.log(`▶ tile: ${tile}`)
    const label = page.getByText(tile, { exact: true }).first()
    if (!(await label.count())) { findings.push(`${tile}: label NOT FOUND on Symptoms tab`); continue }
    await label.click().catch(() => {})
    await sleep(900)

    const paper = page.locator('.MuiDrawer-paper').last()
    const drawerVisible = (await paper.count()) > 0 && (await paper.isVisible().catch(() => false))
    if (!drawerVisible) { findings.push(`${tile}: click did NOT open a side sheet`); continue }

    const title = (await paper.locator('h1,h2,h3,h4,h5,h6,[class*="MuiTypography"]').first().innerText().catch(() => '')).trim()
    const rowCount = await paper.locator('.MuiDataGrid-row').count()
    await page.screenshot({ path: path.join(OUT, `drawer-${tile.replace(/\s+/g, '-').toLowerCase()}.png`) })

    // click first row → should close drawer, filter the table, scroll to it
    let filtered = false
    if (rowCount > 0) {
      await paper.locator('.MuiDataGrid-row').first().click().catch(() => {})
      await settle()
      filtered = (await page.getByText('Clear', { exact: true }).count()) > 0
    }
    findings.push(`${tile}: drawer OPEN ✓  title="${title}"  rows=${rowCount}  rowClick→filter=${rowCount > 0 ? (filtered ? 'YES ✓' : 'NO ✗') : 'n/a (0 rows)'}`)

    // reset for next tile
    const clear = page.getByText('Clear', { exact: true }).first()
    if (await clear.count()) { await clear.click().catch(() => {}); await sleep(300) }
    await page.keyboard.press('Escape').catch(() => {})
    await sleep(400)
  }

  await browser.close()
  console.log('\n──────── TILE LINK CHECK ────────')
  findings.forEach(f => console.log('  • ' + f))

  const species = errors.filter(e => SPECIES_RE.test(e.text) || SPECIES_RE.test(e.loc))
  const other = errors.filter(e => !species.includes(e))
  console.log('\n──────── RESULT ────────')
  console.log(`total console/page errors: ${errors.length}  (species-scoped: ${species.length}, other/infra: ${other.length})`)
  if (species.length) {
    console.log('\n❌ SPECIES-MANAGEMENT errors (in scope):')
    species.forEach((e, i) => console.log(`  ${i + 1}. [${e.kind}] ${e.text}  ${e.loc ? '(' + e.loc + ')' : ''}`))
  } else {
    console.log('\n✅ no species-management errors in the Symptoms flow')
  }
  if (other.length) {
    console.log('\n(infra/other — out of scope, for reference:)')
    other.slice(0, 8).forEach((e, i) => console.log(`  - ${e.text.slice(0, 140)}`))
  }
  console.log(`\nscreenshots → ${OUT}`)

  return species.length ? 1 : 0
}

main()
  .then(code => { if (server) server.kill('SIGTERM'); try { fs.rmSync(path.join(process.cwd(), DIST), { recursive: true, force: true }) } catch {} ; process.exit(code) })
  .catch(e => { console.error('QA harness failed:', e); if (server) server.kill('SIGTERM'); process.exit(2) })
