import { useCallback, useEffect, useRef, useState } from 'react'
import { heartbeatGeofence } from 'src/lib/api/geofence'

const HEARTBEAT_MS = 2 * 60 * 1000 // active polling cadence
const SKIPPED_RECHECK_MS = 15 * 60 * 1000 // low-freq re-check while geofencing is off

/**
 * Periodic geofence heartbeat with visibility-aware pause/resume.
 *
 * State machine:
 *   'unknown'           — no heartbeat has succeeded yet
 *   'inside'            — server confirmed user is within fence
 *   'outside_strike_1'  — first outside reading; warn but do not lock
 *   'outside_locked'    — server has locked the session
 *   'skipped'           — geofence disabled or user is bypassed
 *
 * SPA caveat: a long-lived tab may outlive an admin toggle, so when we land in
 * `skipped` we do NOT permanently stop. Two safety nets bring us back online if
 * an admin enables geofencing mid-session:
 *   1. Visibility resume — every time the user returns to the tab, re-check
 *   2. Low-frequency timer (15 min) — keeps us correct for users who never go idle
 *
 * Returns { state, lastError, recheck }.
 */
export function useGeofenceHeartbeat(enabled) {
  const [state, setState] = useState('unknown')
  const [lastError, setLastError] = useState(null)
  const intervalRef = useRef(null)
  const skippedTimerRef = useRef(null)
  const inFlightRef = useRef(false)
  const skippedRef = useRef(false)

  const clearActive = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const clearSkipped = () => {
    if (skippedTimerRef.current) {
      clearInterval(skippedTimerRef.current)
      skippedTimerRef.current = null
    }
  }

  const sendHeartbeat = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const body = await heartbeatGeofence()

      if (body?.success && body?.data?.skipped) {
        // Geofencing currently off (or user is bypassed). Stop the active 2-min
        // poll and run a slow re-check loop instead, so this session picks up
        // an admin toggle without requiring a page refresh.
        skippedRef.current = true
        setState('skipped')
        clearActive()
        if (!skippedTimerRef.current) {
          skippedTimerRef.current = setInterval(sendHeartbeat, SKIPPED_RECHECK_MS)
        }

        return
      }

      // Server says geofencing is now on (or back on after being off).
      // Make sure the active loop is running.
      if (skippedRef.current) {
        skippedRef.current = false
        clearSkipped()
        if (!intervalRef.current) {
          intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_MS)
        }
      }

      if (body?.success && body?.data?.state) {
        setState(body.data.state)
        setLastError(null)

        return
      }

      if (body?.success === false) {
        setLastError(body?.error || 'heartbeat_failed')
      }
    } catch (e) {
      setLastError(e?.code || e?.message || 'heartbeat_error')
    } finally {
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const start = () => {
      // Always fire one heartbeat on mount/resume so we learn the current
      // server-side feature state quickly.
      void sendHeartbeat()
      // The active interval is started by sendHeartbeat() once we know we're
      // not in `skipped` (or it's started here for first runs to be safe).
      if (!intervalRef.current && !skippedRef.current) {
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_MS)
      }
    }

    const stop = () => {
      // Pause the active poll while the tab is hidden. Keep the slow skipped
      // re-check timer running — it's cheap and rare, and ensures a long-idle
      // session still picks up enable/disable in the background.
      clearActive()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Visibility resume: always fire a fresh heartbeat. Whether we're
        // currently `skipped` or not, this is the moment to re-check the
        // server-side state — handles both "admin enabled while AFK" and
        // "user walked back inside while AFK".
        void sendHeartbeat()
        if (!intervalRef.current && !skippedRef.current) {
          intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_MS)
        }
      } else {
        stop()
      }
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') start()
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility)

    const onLocked = () => setState('outside_locked')
    window.addEventListener('geofence-locked', onLocked)

    return () => {
      clearActive()
      clearSkipped()
      skippedRef.current = false
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('geofence-locked', onLocked)
    }
  }, [enabled, sendHeartbeat])

  return { state, lastError, recheck: sendHeartbeat }
}
