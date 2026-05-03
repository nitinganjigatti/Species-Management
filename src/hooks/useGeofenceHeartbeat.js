import { useCallback, useEffect, useRef, useState } from 'react'
import { heartbeatGeofence } from 'src/lib/api/geofence'

const HEARTBEAT_MS = 2 * 60 * 1000

/**
 * Periodic geofence heartbeat with visibility-aware pause/resume.
 *
 * State machine:
 *   'unknown'           — no heartbeat has succeeded yet
 *   'inside'            — server confirmed user is within fence
 *   'outside_strike_1'  — first outside reading; warn but do not lock
 *   'outside_locked'    — server has locked the session
 *   'skipped'           — geofence disabled or user is bypassed; hook self-terminates
 *
 * Returns { state, lastError, recheck } — `recheck` triggers an immediate heartbeat,
 * useful for the "Recheck location" button on the lock banner.
 */
export function useGeofenceHeartbeat(enabled) {
  const [state, setState] = useState('unknown')
  const [lastError, setLastError] = useState(null)
  const intervalRef = useRef(null)
  const stoppedRef = useRef(false)
  const inFlightRef = useRef(false)

  const sendHeartbeat = useCallback(async () => {
    if (stoppedRef.current || inFlightRef.current) return
    inFlightRef.current = true
    try {
      const body = await heartbeatGeofence()

      if (body?.success && body?.data?.skipped) {
        setState('skipped')
        stoppedRef.current = true
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        return
      }

      if (body?.success && body?.data?.state) {
        setState(body.data.state)
        setLastError(null)

        return
      }

      // success: false from the server (imprecise_location etc.)
      if (body?.success === false) {
        setLastError(body?.error || 'heartbeat_failed')
      }
    } catch (e) {
      // GPS errors (permission, timeout) OR network errors
      setLastError(e?.code || e?.message || 'heartbeat_error')
    } finally {
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    stoppedRef.current = false

    const start = () => {
      if (intervalRef.current || stoppedRef.current) return
      // Fire one heartbeat immediately so locked sessions can recover fast on resume.
      void sendHeartbeat()
      intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_MS)
    }
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') start()
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility)

    // External lock signal from the 403 interceptor — flip state immediately.
    const onLocked = () => setState('outside_locked')
    window.addEventListener('geofence-locked', onLocked)

    return () => {
      stop()
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('geofence-locked', onLocked)
    }
  }, [enabled, sendHeartbeat])

  return { state, lastError, recheck: sendHeartbeat }
}
