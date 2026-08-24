// DEV-LAN (2026-08-24): dev-only session-handoff store for LAN device review
// (iPad). The /dev-handoff page POSTs the Mac browser's auth localStorage here
// and the iPad GETs it back to seed its own localStorage — no WSO2 login on
// the device (the dev tenant's authorization codes expire faster than a human
// can complete the localhost→LAN callback URL edit). Snapshot lives in
// .dev-session.json (gitignored). Returns 404 outside development.
// Remove alongside the LAN-review workflow if it's ever retired.

import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const FILE = () => path.join(process.cwd(), '.dev-session.json')

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
  try {
    const body = await req.text()
    if (body.length > 2_000_000) {
      return NextResponse.json({ ok: false, error: 'snapshot too large' }, { status: 413 })
    }
    JSON.parse(body) // reject non-JSON so GET never serves garbage
    writeFileSync(FILE(), body)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 })
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
  try {
    const raw = readFileSync(FILE(), 'utf8')

    return new NextResponse(raw, { headers: { 'content-type': 'application/json' } })
  } catch {
    return NextResponse.json({ ok: false, error: 'no snapshot yet' }, { status: 404 })
  }
}
