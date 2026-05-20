import React, { ReactNode } from 'react'
import { usePushNotifications } from './hooks'

interface PushNotificationProviderProps {
  children: ReactNode
}

/**
 * Provider component that initializes push notifications on mount.
 * Should be placed at the root level, after authentication context.
 */
export const PushNotificationProvider = ({ children }: PushNotificationProviderProps) => {
  usePushNotifications()
  return <>{children}</>
}

export default PushNotificationProvider
