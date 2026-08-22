// TEMPORARY (2026-08-21): dev-only sink for the auth diagnostics logger
// (src/lib/dev/authEventLogger.js). Appends JSON lines to .dev-authlog.jsonl
// in the project root. Delete this file together with the logger once the
// session-expiry bug is resolved. Returns 404 outside development.

import { NextResponse } from 'next/server'
import { appendFileSync } from 'fs'
import path from 'path'

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
  try {
    const body = await req.text()
    appendFileSync(path.join(process.cwd(), '.dev-authlog.jsonl'), body.slice(0, 4000) + '\n')
  } catch {
    // best-effort — never break the app for diagnostics
  }

  return NextResponse.json({ ok: true })
}
