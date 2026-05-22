'use client'

// Minimal console logger for the chat socket.
// Logs only when the socket opens and closes — nothing else.

import type { ChatSocket } from './api'

const TAG = '[chat:socket]'

/**
 * Attach connected / disconnected listeners on the chat socket.
 * Returns a cleanup function that detaches them.
 */
export function attachSocketLifecycleLogs(socket: ChatSocket): () => void {
  const onConnect = () => {
    console.log(
      `%c${TAG} ✅ CONNECTED`,
      'color:#0a0;font-weight:700',
      `id: ${socket.id}`,
      `at: ${new Date().toLocaleTimeString()} (${new Date().toISOString()})`
    )
  }
  const onDisconnect = (reason: string) => {
    console.warn(
      `%c${TAG} ❌ DISCONNECTED`,
      'color:#b00;font-weight:700',
      `reason: ${reason}`,
      `at: ${new Date().toLocaleTimeString()} (${new Date().toISOString()})`
    )
  }

  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)

  return () => {
    socket.off('connect', onConnect)
    socket.off('disconnect', onDisconnect)
  }
}
