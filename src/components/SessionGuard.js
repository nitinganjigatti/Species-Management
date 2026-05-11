/**
 * SessionGuard
 *
 * Monitors the WSO2 SSO session and warns the user before it expires.
 * Only active when NEXT_PUBLIC_WSO2_AUTH_ENABLED=true — renders nothing in non-SSO mode.
 *
 * HOW IT WORKS:
 *  1. On mount, calls getSessionInfo() once to get refresh_token_expires_in_seconds from WSO2.
 *  2. Converts that to an absolute timestamp: expiresAt = Date.now() + (seconds × 1000).
 *  3. A 1-second local interval ticks `now` forward — no further API calls.
 *  4. remaining = expiresAt - now (pure math, updates every second).
 *  5. When remaining ≤ warnMinutes × 60, the dialog auto-opens.
 *  6. When remaining ≤ criticalMinutes × 60, everything switches to red/error state.
 *  7. Closing the dialog sets dismissedRef = true so it won't reopen for the same session.
 *  8. Re-login button calls logout() from AuthContext — handles WSO2 cleanup and redirects to /login.
 *
 * PROPS:
 *  @param {boolean}  enabled         - Toggle the guard on/off. Default: true.
 *  @param {boolean}  autoOpen        - Auto-open dialog when threshold is reached. Default: true.
 *  @param {boolean}  open            - Controlled open state (optional — use for manual control).
 *  @param {Function} onClose         - Called when dialog closes in controlled mode.
 *  @param {string}   message         - Override the default warning message.
 *  @param {string}   customMessage   - Extra note shown below the timer (e.g. "Save your purchase form"). Default: ''.
 *  @param {number}   warnMinutes     - Minutes before expiry to show the popup. Default: 120 (2 hours).
 *  @param {number}   criticalMinutes - Minutes before expiry to trigger red/critical state. Default: 2.
 *
 * USAGE:
 *  // Basic (auto mode)
 *  <SessionGuard />
 *
 *  // With custom thresholds and message
 *  <SessionGuard warnMinutes={30} criticalMinutes={5} customMessage='Save your purchase form before session expires.' />
 */
import { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Slide from '@mui/material/Slide'
import Icon from 'src/@core/components/icon'
import Box from '@mui/material/Box'

import { isWso2AuthEnabled } from 'src/lib/auth/authMode'
import { getSessionInfo } from 'src/lib/api/wso-login'
import { AuthContext } from 'src/context/AuthContext'


const SlideUp = forwardRef((props, ref) => <Slide direction='up' ref={ref} {...props} />)

const formatTime = s => {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

const SessionGuard = ({
  enabled = true,
  autoOpen = true,
  open: controlledOpen,
  onClose,
  message,
  customMessage = '',
  warnMinutes = 120,
  criticalMinutes = 2
}) => {
  const [expiresAt, setExpiresAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [internalOpen, setInternalOpen] = useState(false)

  const tickRef = useRef(null)
  const dismissedRef = useRef(sessionStorage.getItem('session_guard_dismissed') === 'true')

  const { logout } = useContext(AuthContext)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const warnThresholdSeconds = warnMinutes * 60
  const criticalThresholdSeconds = criticalMinutes * 60

  useEffect(() => {
    if (!enabled || !isWso2AuthEnabled()) return

    let cancelled = false

    const sync = async () => {
      try {
        const info = await getSessionInfo()
        if (cancelled) return

        const secs = Number(info?.refresh_token_expires_in_seconds)
        if (!Number.isFinite(secs)) return

        setExpiresAt(Date.now() + secs * 1000)
      } catch {}
    }

    sync()

    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    if (!expiresAt) return

    tickRef.current = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(tickRef.current)
  }, [expiresAt])

  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))

  useEffect(() => {
    if (!autoOpen || isControlled || !expiresAt || dismissedRef.current) return

    if (remaining <= warnThresholdSeconds) {
      setInternalOpen(true)
    }
  }, [remaining, autoOpen, isControlled, expiresAt, warnThresholdSeconds])

  if (!enabled || !isWso2AuthEnabled() || !expiresAt) return null

  const isCritical = remaining <= criticalThresholdSeconds

  const defaultMessage = isCritical
    ? 'Your session is about to expire. Save your work now.'
    : 'Your session will expire soon. Please re-login to continue.'

  const handleClose = () => {
    dismissedRef.current = true
    sessionStorage.setItem('session_guard_dismissed', 'true')
    if (isControlled) {
      onClose?.()
    } else {
      setInternalOpen(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') handleClose()
      }}
      maxWidth='xs'
      fullWidth
      TransitionComponent={SlideUp}
      PaperProps={{
        sx: {
          // borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      {/* Progress strip — shrinks as time runs out */}
      <Box sx={{ height: 6, bgcolor: 'customColors.SurfaceVariant', position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${Math.min(100, (remaining / warnThresholdSeconds) * 100)}%`,
            bgcolor: isCritical ? 'error.main' : 'warning.main',
            transition: 'width 1s linear, background-color 0.5s ease'
          }}
        />
      </Box>

      <DialogTitle sx={{ pb: 1 }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box display='flex' alignItems='center' gap={1}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: isCritical ? 'error.main' : 'warning.main',
                transition: 'color 0.5s ease',
                animation: 'spin 3s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              <Icon icon='mdi:timer-outline' />
            </Box>
            <Typography variant='subtitle1' fontWeight={600}>
              Session Expiry
            </Typography>
          </Box>
          <Box
            component='span'
            onClick={handleClose}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <Icon icon='mdi:close' />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pt: 2 }}>
        <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
          {message || defaultMessage}
        </Typography>

        {/* Timer */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
          <Typography
            variant='h3'
            fontWeight={700}
            letterSpacing={6}
            sx={{
              px: 5,
              py: 2,
              borderRadius: 3,
              color: isCritical ? 'error.main' : 'warning.main',
              bgcolor: isCritical ? 'customColors.BgTeritary' : 'customColors.OnBackground',
              transition: 'color 0.5s ease, background-color 0.5s ease',
              animation: isCritical ? 'pulseCritical 0.8s ease-in-out infinite' : 'pulseWarn 1.8s ease-in-out infinite',
              '@keyframes pulseCritical': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.06)', opacity: 0.65 }
              },
              '@keyframes pulseWarn': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 }
              }
            }}
          >
            {formatTime(remaining)}
          </Typography>
        </Box>

        {customMessage ? (
          <Typography variant='body2' sx={{ display: 'block', textAlign: 'center', color: 'customColors.neutralSecondary', mt: 1, mb: 1, px: 2 }}>
            {customMessage}
          </Typography>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        <Button
          variant='contained'
          onClick={() => {
            sessionStorage.removeItem('session_guard_dismissed')
            logout()
          }}
          color={isCritical ? 'error' : 'primary'}
          sx={{ transition: 'background-color 0.5s ease', px: 6 }}
        >
          Re-login
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SessionGuard
