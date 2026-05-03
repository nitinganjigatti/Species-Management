// ** React Imports
import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Snackbar, Typography } from '@mui/material'

// ** Next Import
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'
import { useGeofenceHeartbeat } from 'src/hooks/useGeofenceHeartbeat'
import GeofenceLockBanner from 'src/components/geofence/GeofenceLockBanner'
import Icon from 'src/@core/components/icon'

const AuthGuard = props => {
  const { children, fallback } = props

  const auth = useAuth()
  const router = useSafeRouter()

  const isAuthed = !!auth.user
  const { state: heartbeatState, lastError: heartbeatError, recheck: heartbeatRecheck } = useGeofenceHeartbeat(isAuthed)

  // Loud alert on transition into outside_strike_1. Fires only on the edge,
  // so the user gets one strong notification instead of a permanent siren.
  // The persistent sticky banner remains as ambient context.
  const prevStateRef = useRef(heartbeatState)
  const [strikeAlertOpen, setStrikeAlertOpen] = useState(false)

  useEffect(() => {
    if (prevStateRef.current !== 'outside_strike_1' && heartbeatState === 'outside_strike_1') {
      setStrikeAlertOpen(true)
    }
    prevStateRef.current = heartbeatState
  }, [heartbeatState])

  useEffect(
    () => {
      if (!router.isReady) {
        return
      }
      if (auth.user === null && !window.localStorage.getItem('userData')) {
        if (router.asPath !== '/') {
          router.replace({
            pathname: '/login',
            query: { returnUrl: router.asPath }
          })
        } else {
          router.replace('/login')
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.route]
  )
  if (auth.loading || auth.user === null) {
    return fallback
  }

  // Two paths can lock the UI:
  //   1. session-restore verify failed → auth.geofenceLocked
  //   2. mid-session heartbeat saw outside-locked → heartbeatState
  // Recheck calls verify (strict gate) AND fires a heartbeat so both signals refresh.
  const isLocked = auth.geofenceLocked || heartbeatState === 'outside_locked'
  const lockError = auth.geofenceLocked ? auth.geofenceLockReason?.code : heartbeatError
  const handleRecheck = async () => {
    if (auth.recheckGeofence) await auth.recheckGeofence()
    await heartbeatRecheck()
  }

  if (isLocked) {
    return <GeofenceLockBanner onRecheck={handleRecheck} lastError={lockError} />
  }

  return (
    <>
      {heartbeatState === 'outside_strike_1' && (
        <Box
          role='status'
          aria-live='polite'
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: theme => theme.zIndex.appBar + 2,
            px: { xs: 3, sm: 4 },
            py: 1.25,
            bgcolor: 'customColors.Tertiary',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.25,
            boxShadow: '0 2px 8px rgba(250, 97, 64, 0.35)'
          }}
        >
          <Icon icon='mdi:alert-outline' fontSize={18} />
          <Typography
            variant='body2'
            sx={{ fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}
          >
            You appear to be outside the facility. One more outside reading will lock your session.
          </Typography>
        </Box>
      )}

      {/* Loud one-shot alert on transition into strike-1. Auto-dismisses after 8s. */}
      <Snackbar
        open={strikeAlertOpen}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={8000}
        onClose={(_, reason) => {
          // Don't auto-close on click-away — only on the explicit X or timeout.
          if (reason === 'clickaway') return
          setStrikeAlertOpen(false)
        }}
        sx={{ mt: heartbeatState === 'outside_strike_1' ? 6 : 0 }}
      >
        <Alert
          severity='warning'
          variant='filled'
          onClose={() => setStrikeAlertOpen(false)}
          icon={<Icon icon='mdi:alert' fontSize={22} />}
          sx={{
            minWidth: 380,
            maxWidth: 520,
            alignItems: 'flex-start',
            bgcolor: 'customColors.Tertiary',
            color: '#fff',
            boxShadow: '0 12px 32px rgba(250, 97, 64, 0.45)',
            borderRadius: '10px',
            '& .MuiAlert-icon': { color: '#fff', mt: '2px' },
            '& .MuiAlert-action': { color: '#fff', pt: 0 },
            '& .MuiAlert-message': { py: 0.5 }
          }}
        >
          <Typography variant='subtitle2' sx={{ fontWeight: 700, color: '#fff', mb: 0.25 }}>
            Outside facility — last warning
          </Typography>
          <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.92)', display: 'block', lineHeight: 1.5 }}>
            GPS readings indicate you are outside the geofenced area. One more outside reading will lock your
            session. Walk back inside the facility to stay logged in.
          </Typography>
        </Alert>
      </Snackbar>

      {children}
    </>
  )
}

export default AuthGuard
