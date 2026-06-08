'use client'

import { useRef, useState, useCallback, TouchEvent } from 'react'

/**
 * WhatsApp-style swipe-right-to-reply gesture for chat bubbles.
 *
 * Touch flow:
 *   1. `onTouchStart`  — record the initial finger position.
 *   2. `onTouchMove`   — compute delta. Bail early if the gesture is
 *      primarily vertical (vertical scroll always wins). For a
 *      right-swipe, translate the bubble with the finger up to a max
 *      offset so it doesn't slide off-screen.
 *   3. `onTouchEnd`    — if the offset crossed the threshold, fire the
 *      `onReply` callback (caller dispatches `setReplyingTo`). Either
 *      way, snap the bubble back to its resting position with a brief
 *      ease-out.
 *
 * Why we don't `preventDefault()` on touchmove:
 *   - Calling preventDefault would require a non-passive listener (React
 *     attaches touchmove as passive by default in modern versions).
 *   - The bubble carries `touchAction: 'pan-y'` so the browser allows
 *     vertical scroll but reserves horizontal gestures for JS — we get
 *     the same effect without needing a non-passive listener.
 *
 * Mouse / desktop users are unaffected — these handlers only respond to
 * touch events. Optional `disabled` arg suppresses everything (used when
 * the message isn't interactable, e.g. a kicked-user view).
 */

const SWIPE_TRIGGER_PX = 60
const SWIPE_MAX_PX = 90
/** Min horizontal distance before we commit to a horizontal swipe (vs scroll). */
const HORIZONTAL_LOCK_PX = 6

export interface UseSwipeToReplyResult {
  /** Current x-translation in px. Caller applies as `transform: translateX(${offset}px)`. */
  offset: number
  /** True when the swipe has crossed the trigger threshold (use for icon scale / color hint). */
  past: boolean
  /** Spread these onto the bubble's outer wrapper. */
  handlers: {
    onTouchStart: (e: TouchEvent) => void
    onTouchMove: (e: TouchEvent) => void
    onTouchEnd: (e: TouchEvent) => void
    onTouchCancel: (e: TouchEvent) => void
  }
}

export function useSwipeToReply(onReply: () => void, disabled = false): UseSwipeToReplyResult {
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const lockedRef = useRef<'unknown' | 'horizontal' | 'vertical'>('unknown')
  const offsetRef = useRef(0)
  const [offset, setOffset] = useState(0)

  const reset = useCallback(() => {
    offsetRef.current = 0
    lockedRef.current = 'unknown'
    setOffset(0)
  }, [])

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return
      const t = e.touches[0]
      if (!t) return
      startXRef.current = t.clientX
      startYRef.current = t.clientY
      lockedRef.current = 'unknown'
      offsetRef.current = 0
      setOffset(0)
    },
    [disabled]
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled) return
      const t = e.touches[0]
      if (!t) return
      const dx = t.clientX - startXRef.current
      const dy = t.clientY - startYRef.current

      // Direction lock — once committed to one axis, stay there for the
      // rest of the gesture so a slight diagonal doesn't ping-pong
      // between horizontal swipe and vertical scroll.
      if (lockedRef.current === 'unknown') {
        if (Math.abs(dx) < HORIZONTAL_LOCK_PX && Math.abs(dy) < HORIZONTAL_LOCK_PX) return
        lockedRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      }
      if (lockedRef.current === 'vertical') return
      if (dx < 0) {
        // Left swipe — not a reply gesture; leave the bubble at rest.
        offsetRef.current = 0
        setOffset(0)

        return
      }
      const clamped = Math.min(dx, SWIPE_MAX_PX)
      offsetRef.current = clamped
      setOffset(clamped)
    },
    [disabled]
  )

  const finish = useCallback(() => {
    if (disabled) return
    if (offsetRef.current >= SWIPE_TRIGGER_PX) {
      onReply()
    }
    reset()
  }, [disabled, onReply, reset])

  return {
    offset,
    past: offset >= SWIPE_TRIGGER_PX,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd: finish,
      onTouchCancel: reset
    }
  }
}
