/**
 * Dev-only screenshot harness for Species Management — lets an agent (or you) SEE the
 * real authed app instead of curl'ing the auth shell. Auth is STUBBED in the browser:
 * we seed a legacy localStorage session and fulfill the dev-backend calls. No real creds,
 * no app code touched, no network to the live backend.
 *
 * Prereqs:
 *   - Dev server running on :3000 with NEXT_PUBLIC_WSO2_AUTH_ENABLED=false (default in .env)
 *   - npm i --no-save playwright && npx playwright install chromium
 *
 * Run (NODE_PATH lets a script outside cwd resolve node_modules):
 *   NODE_PATH="$(pwd)/node_modules" node scripts/species-screenshots.js
 * Output: ./.screenshots/*.png  (gitignored / safe to delete)
 *
 * NOTE: Playwright runs the LAST-registered matching route first — keep the specific
 * refreshtoken route registered AFTER the catch-alls or auth silently logs out.
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const OUT = process.env.SHOT_OUT || path.join(process.cwd(), '.screenshots')
fs.mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:3000/species-management'

const USER = {
  user_email: 'dev@antz.local',
  user_first_name: 'Dev',
  user_last_name: 'User',
  zoos: [{ zoo_id: 1, zoo_name: 'Dev Zoo' }]
}
const REFRESH_BODY = { token: 'dev-jwt-token', user: USER, roles: { role_id: 1, role_name: 'admin' }, modules: {} }

const settle = async p => {
  await p.waitForLoadState('networkidle').catch(() => {})
  await p.waitForTimeout(1000)
}

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } })

  await ctx.addInitScript(([user]) => {
    localStorage.setItem('accessToken', 'dev-jwt-token')
    localStorage.setItem('userData', JSON.stringify({
      email: user.user_email, fullName: user.user_first_name,
      lastName: user.user_last_name, role: 'admin', id: 1, username: user.user_first_name
    }))
    localStorage.setItem('userDetails', JSON.stringify({ token: 'dev-jwt-token', user }))
    localStorage.setItem('role', JSON.stringify('admin'))
  }, [USER])

  await ctx.route('**://auth.antzsystems.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' }))
  await ctx.route('**://api.dev.antzsystems.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' }))
  await ctx.route('**/v1/auth/refreshtoken', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REFRESH_BODY) }))

  const page = await ctx.newPage()

  for (const [name, url] of [['dashboard', `${BASE}/dashboard/`], ['list', `${BASE}/list/`]]) {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
    console.log('shot', name)
  }

  // Detail pages — click through every tab. Test species: mammal 2150, bird 449 (Eggs), reptile 1871.
  for (const [name, id] of [['mammal-2150', '2150'], ['bird-449', '449'], ['reptile-1871', '1871']]) {
    await page.goto(`${BASE}/${id}/`, { waitUntil: 'domcontentloaded' })
    await settle(page)
    const tabs = await page.$$('[role="tab"]')
    if (!tabs.length) { await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }); continue }
    for (let i = 0; i < tabs.length; i++) {
      const t = (await page.$$('[role="tab"]'))[i]
      const label = (await t.innerText().catch(() => `tab${i}`)).trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 24) || `tab${i}`
      await t.click().catch(() => {})
      await settle(page)
      await page.screenshot({ path: path.join(OUT, `${name}__${String(i).padStart(2, '0')}-${label}.png`), fullPage: true })
    }
    console.log('shot', name, `(${tabs.length} tabs)`)
  }

  await browser.close()
  console.log('DONE →', OUT)
})().catch(e => { console.error(e); process.exit(1) })
