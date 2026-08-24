// DEV-LAN (2026-08-24): dev-only session handoff page for LAN device review.
//
// WHY: WSO2 login can't complete on a LAN device — the registered callback is
// pinned to localhost:3000, and the dev tenant's authorization codes expire
// before the manual localhost→LAN URL edit can be finished. Instead of logging
// in on the device, this page clones the Mac's already-working session: the
// dev escape hatch (isWso2DevIgnoreExpiry) restores sessions purely from
// localStorage userDetails/userData, so copying localStorage IS a full handoff.
//
// USAGE (dev builds only; renders a notice otherwise):
//   1. Mac (logged in):  http://localhost:3000/dev-handoff?export
//   2. iPad:             http://192.168.0.120:3000/dev-handoff?import
// Without a query param it auto-picks: export if this browser has a session,
// import otherwise. Snapshot transits /api/dev-session → .dev-session.json.
// Remove alongside the LAN-review workflow if it's ever retired.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import BlankLayout from 'src/@core/layouts/BlankLayout'

const IMPORT_LANDING = '/species-management/ipad-1/dashboard'

// Stale one-shot flags that must not be cloned onto the target device.
const SKIP_KEYS = ['session_expired', 'logout_reason', 'returnUrl']

const DevHandoffPage = () => {
  const router = useRouter()
  const [status, setStatus] = useState('Working…')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (process.env.NODE_ENV !== 'development') {
      setStatus('Not available')
      setDetail('This page only exists in development builds.')

      return
    }

    const forcedExport = 'export' in router.query
    const forcedImport = 'import' in router.query

    const run = async () => {
      const hasSession = (() => {
        try {
          return Boolean(JSON.parse(localStorage.getItem('userDetails'))?.token)
        } catch {
          return false
        }
      })()

      const doExport = forcedExport || (!forcedImport && hasSession)

      if (doExport) {
        if (!hasSession) {
          setStatus('Nothing to export')
          setDetail('This browser has no logged-in session (no userDetails in localStorage). Log in first, then reload.')

          return
        }
        const data = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!SKIP_KEYS.includes(key)) data[key] = localStorage.getItem(key)
        }
        const res = await fetch('/api/dev-session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ exportedAt: new Date().toISOString(), from: location.origin, data })
        })
        if (!res.ok) {
          setStatus('Export failed')
          setDetail(`POST /api/dev-session → ${res.status}`)

          return
        }
        setStatus('Session exported ✓')
        setDetail(`Now open http://192.168.0.120:3000/dev-handoff?import on the iPad.`)

        return
      }

      // Import
      const res = await fetch('/api/dev-session')
      if (!res.ok) {
        setStatus('No session snapshot found')
        setDetail('Open http://localhost:3000/dev-handoff?export on the Mac (logged in) first, then reload this page.')

        return
      }
      const snapshot = await res.json()
      const entries = Object.entries(snapshot?.data || {})
      if (!entries.length) {
        setStatus('Snapshot is empty')
        setDetail('Re-export from the Mac and try again.')

        return
      }
      for (const [key, value] of entries) localStorage.setItem(key, value)
      SKIP_KEYS.forEach(key => localStorage.removeItem(key))
      setStatus('Session imported ✓')
      setDetail(`Exported ${snapshot.exportedAt} from ${snapshot.from}. Opening the app…`)

      // Full page load so AuthContext re-initialises and restores from the
      // imported userDetails via the dev escape hatch.
      setTimeout(() => window.location.replace(IMPORT_LANDING), 800)
    }

    run().catch(err => {
      setStatus('Handoff failed')
      setDetail(String(err))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 6,
        textAlign: 'center',
        bgcolor: 'customColors.Surface'
      }}
    >
      <Typography variant='h5' sx={{ color: 'customColors.OnSurfaceVariant' }}>
        {status}
      </Typography>
      <Typography variant='body1' sx={{ color: 'customColors.neutralSecondary', wordBreak: 'break-word' }}>
        {detail}
      </Typography>
    </Box>
  )
}

DevHandoffPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
DevHandoffPage.authGuard = false
DevHandoffPage.guestGuard = false

export default DevHandoffPage
