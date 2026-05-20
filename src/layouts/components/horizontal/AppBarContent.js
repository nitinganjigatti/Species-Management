// ** MUI Imports
import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
// import SessionExpiryTimer from 'src/@core/layouts/components/shared-components/SessionExpiryTimer'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import { useSafeRouter } from 'src/hooks/useSafeRouter'
import { markAllRead, markAsRead } from 'src/lib/notifications'

const AppBarContent = props => {
  // ** Props
  const { settings, saveSettings } = props

  // ** Redux
  const dispatch = useDispatch()
  const notifications = useSelector(state => state.notifications.items)
  const router = useSafeRouter()

  const handleNotificationClick = (notification) => {
    // Mark as read in Redux
    dispatch(markAsRead(notification.id))

    // Navigate to conversation
    if (notification.conversationId) {
      router.push(`/chat?conversationId=${notification.conversationId}`)
    } else {
      router.push('/chat')
    }
  }

  const handleReadAllNotifications = () => {
    dispatch(markAllRead())
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* <ModeToggler settings={settings} saveSettings={saveSettings} />  */}
      {/* <SessionExpiryTimer /> */}
      <NotificationDropdown
        settings={settings}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onReadAll={handleReadAllNotifications}
      />
      <UserDropdown settings={settings} />
    </Box>
  )
}

export default AppBarContent
