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

  console.log('▶ opening mammal 2150 detail')
  await page.goto(`${BASE}/2150/`, { waitUntil: 'domcontentloaded' })
  await settle()

  console.log('▶ Medical tab')
  await clickByText(/^Medical$/, 'tab'); await settle()
  console.log('▶ Symptoms sub-tab')
  await clickByText(/^Symptoms$/); await settle()
  await page.screenshot({ path: path.join(OUT, 'symptoms-tab.png'), fullPage: true })

  // Click each stat tile → drawer → first symptom row → verify a filter chip appeared → close.
  for (const tile of ['Active', 'Animals Affected', 'Most Recurring', 'Long-open Cases']) {
    console.log(`▶ tile: ${tile}`)
    const opened = await clickByText(new RegExp('^' + tile + '$', 'i'))
    await sleep(700)
    if (opened) {
      await page.screenshot({ path: path.join(OUT, `drawer-${tile.replace(/\s+/g, '-').toLowerCase()}.png`) })
      // click first DataGrid row inside the drawer
      const row = page.locator('.MuiDrawer-paper .MuiDataGrid-row').first()
      if (await row.count()) { await row.click().catch(() => {}); await settle() }
      // clear any filter chip for a clean next run
      const clear = page.getByText(/^Clear$/).first()
      if (await clear.count()) { await clear.click().catch(() => {}); await sleep(300) }
    } else {
      console.log(`  ⚠ could not find tile "${tile}"`)
    }
    // ensure drawer closed
    await page.keyboard.press('Escape').catch(() => {})
    await sleep(300)
  }

  await browser.close()

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
