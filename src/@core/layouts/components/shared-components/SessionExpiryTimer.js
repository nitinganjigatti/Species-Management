// import { useEffect, useRef, useState } from 'react'
// import Box from '@mui/material/Box'
// import Chip from '@mui/material/Chip'
// import Tooltip from '@mui/material/Tooltip'
// import Icon from 'src/@core/components/icon'
// import { isWso2AuthEnabled } from 'src/lib/auth/authMode'
// import { getSessionInfo } from 'src/lib/api/wso-login'

// const WARN_THRESHOLD_SECONDS = 15 * 60
// const CRITICAL_THRESHOLD_SECONDS = 5 * 60
// const SYNC_INTERVAL_MS = 30 * 1000

// const formatMMSS = totalSeconds => {
//   const s = Math.max(0, totalSeconds | 0)
//   const m = Math.floor(s / 60)
//   const r = s % 60

//   return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
// }

// // Refresh-token expiry is the real session boundary — access token silent-refreshes,
// // so its countdown would always look near-zero and be misleading.
// //
// // Strategy: re-sync the target timestamp from the package every 30s, then tick a local
// // 1-second clock so the chip counts down smoothly without hammering the API.
// const SessionExpiryTimer = () => {
//   const [expiresAt, setExpiresAt] = useState(null)
//   const [now, setNow] = useState(() => Date.now())
//   const syncTimerRef = useRef(null)
//   const tickTimerRef = useRef(null)

//   useEffect(() => {
//     if (!isWso2AuthEnabled()) return

//     let cancelled = false

//     const sync = async () => {
//       try {
//         const info = await getSessionInfo()
//         if (cancelled) return
//         const secs = Number(info?.access_token_expires_in_seconds)
//         if (!Number.isFinite(secs)) {
//           setExpiresAt(null)

//           return
//         }
//         setExpiresAt(Date.now() + secs * 1000)
//       } catch {
//         if (!cancelled) setExpiresAt(null)
//       }
//     }

//     sync()
//     syncTimerRef.current = setInterval(sync, SYNC_INTERVAL_MS)

//     return () => {
//       cancelled = true
//       if (syncTimerRef.current) clearInterval(syncTimerRef.current)
//     }
//   }, [])

//   useEffect(() => {
//     if (expiresAt === null) return
//     tickTimerRef.current = setInterval(() => setNow(Date.now()), 1000)

//     return () => {
//       if (tickTimerRef.current) clearInterval(tickTimerRef.current)
//     }
//   }, [expiresAt])

//   if (!isWso2AuthEnabled()) return null
//   if (expiresAt === null) return null

//   const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000))
//   if (remainingSeconds > WARN_THRESHOLD_SECONDS) return null

//   const isCritical = remainingSeconds <= CRITICAL_THRESHOLD_SECONDS
//   const label = remainingSeconds <= 0 ? 'Session expiring' : `Session ${formatMMSS(remainingSeconds)}`

//   return (
//     <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
//       <Tooltip title='Your session will end soon. Save your work and re-login.' arrow>
//         <Chip
//           size='small'
//           icon={<Icon icon='mdi:clock-alert-outline' fontSize='1rem' />}
//           label={label}
//           sx={{
//             fontWeight: 500,
//             fontVariantNumeric: 'tabular-nums',
//             color: isCritical ? 'customColors.Tertiary' : 'customColors.OnSurfaceVariant',
//             backgroundColor: isCritical ? 'customColors.BgTeritary' : 'customColors.Surface',
//             border: '1px solid',
//             borderColor: isCritical ? 'customColors.Tertiary' : 'customColors.SurfaceVariant',
//             '& .MuiChip-icon': {
//               color: isCritical ? 'customColors.Tertiary' : 'customColors.Outline'
//             }
//           }}
//         />
//       </Tooltip>
//     </Box>
//   )
// }

// export default SessionExpiryTimer

import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/@core/components/icon'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'
import { getSessionInfo } from 'src/lib/api/wso-login'

const WARN_THRESHOLD_SECONDS = 15 * 60
const CRITICAL_THRESHOLD_SECONDS = 5 * 60
const DANGER_THRESHOLD_SECONDS = 60
const SYNC_INTERVAL_MS = 30 * 1000

// Styled time (mm:ss with red seconds in last 60s)
const formatStyledTime = (seconds, isDanger) => {
  const s = Math.max(0, seconds | 0)
  const m = Math.floor(s / 60)
  const r = s % 60

  return (
    <>
      {String(m).padStart(2, '0')}:
      <Box component='span' sx={{ color: isDanger ? 'error.main' : 'inherit' }}>
        {String(r).padStart(2, '0')}
      </Box>
    </>
  )
}

const SessionExpiryTimer = () => {
  const [expiresAt, setExpiresAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const syncTimerRef = useRef(null)
  const tickTimerRef = useRef(null)

  useEffect(() => {
    if (!isWso2AuthEnabled()) return

    let cancelled = false

    const sync = async () => {
      try {
        const info = await getSessionInfo()
        if (cancelled) return

        const secs = Number(info?.refresh_token_expires_in_seconds)

        if (!Number.isFinite(secs)) {
          setExpiresAt(null)
          return
        }

        setExpiresAt(Date.now() + secs * 1000)
      } catch {
        if (!cancelled) setExpiresAt(null)
      }
    }

    sync()
    syncTimerRef.current = setInterval(sync, SYNC_INTERVAL_MS)

    return () => {
      cancelled = true
      if (syncTimerRef.current) clearInterval(syncTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (expiresAt === null) return

    tickTimerRef.current = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current)
    }
  }, [expiresAt])

  if (!isWso2AuthEnabled()) return null
  if (expiresAt === null) return null

  const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000))

  // Hide if too early
  if (remainingSeconds > WARN_THRESHOLD_SECONDS) return null

  const isWarning = remainingSeconds <= WARN_THRESHOLD_SECONDS
  const isCritical = remainingSeconds <= CRITICAL_THRESHOLD_SECONDS
  const isDanger = remainingSeconds <= DANGER_THRESHOLD_SECONDS

  // Dynamic color
  const getColor = () => {
    if (isCritical) return 'error.main'
    if (isWarning) return 'warning.main'
    return 'text.secondary'
  }

  const label = remainingSeconds <= 0 ? 'Session expired' : formatStyledTime(remainingSeconds, isDanger)

  return (
    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
      <Tooltip
        title={isDanger ? 'Session ending! Please extend or save your work.' : 'Your session will expire soon.'}
        arrow
      >
        <Chip
          size='small'
          icon={<Icon icon='icon-park-twotone:timer' fontSize='1rem' />}
          label={label}
          sx={{
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: getColor(),
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: getColor(),

            '& .MuiChip-icon': {
              color: getColor()
            },

            // Pulse animation for last 60s
            animation: isDanger ? 'pulse 1s infinite' : 'none',

            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 }
            }
          }}
        />
      </Tooltip>
    </Box>
  )
}

export default SessionExpiryTimer
