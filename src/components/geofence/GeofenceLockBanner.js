import { useState } from 'react'
import { Backdrop, Box, Button, CircularProgress, Portal, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { describeGeofenceError } from 'src/lib/geofence/copy'

const GeofenceLockBanner = ({ onRecheck, lastError }) => {
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState(null)

  const handleRecheck = async () => {
    setBusy(true)
    setLocalError(null)
    try {
      await onRecheck?.()
    } catch (e) {
      setLocalError({ code: e?.code || 'gps_error' })
    } finally {
      setBusy(false)
    }
  }

  // Decide which copy to show: prefer the most recent local error from clicking
  // Recheck, fall back to the last error from the parent. If neither, show the
  // generic locked-state copy.
  const errSource = localError || (lastError ? { code: lastError } : null)
  const copy = errSource
    ? describeGeofenceError(errSource)
    : {
        severity: 'error',
        icon: 'mdi:map-marker-off-outline',
        title: 'Return to facility to continue',
        body:
          'Your session is locked because GPS readings indicate you are outside the facility. Walk back inside the geofenced area and tap "Recheck location" to resume.'
      }

  return (
    <Portal>
      <Backdrop
        open
        sx={{
          zIndex: 9999,
          bgcolor: 'rgba(20, 32, 24, 0.35)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          color: '#fff',
          flexDirection: 'column',
          px: 4
        }}
      >
      <Box
        sx={{
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          p: { xs: 4, sm: 5 },
          borderRadius: '16px',
          bgcolor: 'rgba(20, 32, 24, 0.72)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.55)'
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'customColors.Tertiary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(250, 97, 64, 0.35)'
          }}
        >
          <Icon icon={copy.icon} fontSize={40} />
        </Box>
        <Typography variant='h5' sx={{ fontWeight: 700, color: '#fff' }}>
          {copy.title}
        </Typography>
        <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, maxWidth: 420 }}>
          {copy.body}
        </Typography>

        <Button
          variant='contained'
          onClick={handleRecheck}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Icon icon='mdi:crosshairs-gps' fontSize={20} />}
          sx={{
            mt: 1,
            bgcolor: 'primary.main',
            color: '#fff',
            height: 48,
            px: 5,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          {busy ? 'Checking location…' : 'Recheck location'}
        </Button>
      </Box>
      </Backdrop>
    </Portal>
  )
}

export default GeofenceLockBanner
