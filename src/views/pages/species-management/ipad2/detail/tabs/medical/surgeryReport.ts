/*
 * Surgical report — opens a print-styled document in a NEW TAB (the record dialog already sits
 * on two stacked sheets, so no further in-app layers). The page carries a Download PDF button
 * that triggers the browser's native print-to-PDF. No PDF library needed.
 */
import type { Admission } from '../hospital/hospital'
import { fmtDate } from './signals'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const openSurgeryReport = (adm: Admission) => {
  const d = adm.surgeryDetail
  if (!d) return
  const location = adm.surgery === 'field' ? `On-site (field) — ${adm.enclosure}, ${adm.site}` : adm.hospital
  const row = (label: string, value?: string, accent?: boolean) =>
    value
      ? `<tr><td class="l">${esc(label)}</td><td class="v${accent ? ' accent' : ''}">${esc(value)}</td></tr>`
      : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Surgical Report — ${esc(adm.name)}</title>
<style>
  :root{--teal:#0F3833;--green:#2F8467;--coral:#C84F28;--ink:#233230;--ink2:#66756F;--line:#DFE7E2;--bg:#F4F8F5}
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Inter','Helvetica Neue',Arial,sans-serif}
  body{background:var(--bg);color:var(--ink);padding:40px 16px}
  .sheet{max-width:820px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .head{background:var(--teal);color:#fff;padding:28px 36px;display:flex;justify-content:space-between;align-items:center}
  .head .t{font-size:22px;font-weight:800;letter-spacing:.02em}
  .head .s{font-size:13px;color:rgba(255,255,255,.65);margin-top:4px;letter-spacing:.08em;text-transform:uppercase}
  .head .code{font-size:13px;color:rgba(255,255,255,.75);text-align:right;line-height:1.6}
  .body{padding:32px 36px}
  h2{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin:26px 0 10px}
  h2:first-child{margin-top:0}
  table{width:100%;border-collapse:collapse}
  td{padding:9px 0;border-bottom:1px solid var(--line);font-size:15px;vertical-align:top}
  td.l{width:230px;color:var(--ink2)}
  td.v{font-weight:600}
  td.v.accent{color:var(--coral);font-weight:700}
  .flag{background:#FBEDE6;border:1px solid #F0CDBC;color:var(--coral);border-radius:8px;padding:10px 14px;font-size:14px;font-weight:600;margin-top:8px}
  .foot{padding:18px 36px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink2)}
  .bar{max-width:820px;margin:0 auto 14px;display:flex;justify-content:flex-end;gap:10px}
  .btn{border:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:700;cursor:pointer}
  .btn.p{background:var(--green);color:#fff}
  .btn.g{background:#fff;border:1px solid var(--line);color:var(--ink)}
  @media print{body{background:#fff;padding:0}.bar{display:none}.sheet{border:none;border-radius:0;max-width:none}}
</style>
</head>
<body>
  <div class="bar">
    <button class="btn g" onclick="window.close()">Close</button>
    <button class="btn p" onclick="window.print()">Download PDF</button>
  </div>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="t">Surgical Report</div>
        <div class="s">Species Management · Hospital record</div>
      </div>
      <div class="code">${esc(fmtDate(adm.admittedOn))}<br>AID ${esc(adm.aid)}</div>
    </div>
    <div class="body">
      <h2>Animal</h2>
      <table>
        ${row('Name / ID', `${adm.name} · AID ${adm.aid}`)}
        ${row('Origin', `${adm.site} · ${adm.enclosure}`)}
        ${row('Presenting condition', adm.condition)}
      </table>

      <h2>Surgery</h2>
      <table>
        ${row('Procedure', d.name)}
        ${row('Type', d.typeOfSurgery)}
        ${row('Surgical approach', d.approach)}
        ${row('Location', location)}
        ${row('Date', fmtDate(adm.admittedOn))}
        ${row('Time', `${d.startTime} → ${d.endTime} · ${d.durationMin} min`)}
      </table>

      <h2>Team</h2>
      <table>
        ${row('Surgeon', d.surgeon)}
        ${row('Secondary surgeon', d.secondarySurgeon)}
        ${row('Anesthetist', d.anesthetist)}
      </table>

      <h2>Anaesthesia</h2>
      <table>
        ${row('Protocol', d.anaesthesia)}
        ${row('Recovery', 'Reversal complete — recovered in holding')}
      </table>

      <h2>Outcome</h2>
      <table>
        ${row('Complications', d.complications ?? 'None recorded', !!d.complications)}
      </table>
      ${d.complications ? `<div class="flag">⚠ ${esc(d.complications)}</div>` : ''}

      <h2>Post-operative care</h2>
      <table>
        ${row('Diet', d.dietInstructions)}
        ${row('Activity', d.activityRestrictions)}
        ${row('Notes', d.notes)}
      </table>
    </div>
    <div class="foot">
      <span>Generated from Species Management — data mirrors the hospital case record.</span>
      <span>Antz · WildVenture</span>
    </div>
  </div>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
