// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
// import SessionExpiryTimer from 'src/@core/layouts/components/shared-components/SessionExpiryTimer'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
// import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import SelectPharmacy from 'src/components/SelectPharmacy'
import { usePathname } from 'next/navigation'
import { AuthContext } from 'src/context/AuthContext'
import SelectParivesh from 'src/components/SelectParivesh'
import Typography from '@mui/material/Typography'
import { usePharmacyContext } from 'src/context/PharmacyContext'

import LanguageDropdown from 'src/@core/layouts/components/shared-components/LanguageDropdown'
import { useRouter } from 'next/router'
import { useSafeRouter } from 'src/hooks/useSafeRouter'
import { markAllRead, markAsRead } from 'src/lib/notifications'

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  const pathname = usePathname()
  const pathArray = pathname && pathname !== '' ? pathname.replace(/^\//, '').split('/') : [] // removing first forward slash before splitting

  const moduleName = pathArray.length > 0 ? pathArray[0] : ''
  const authData = useContext(AuthContext)
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const { selectedPharmacy } = usePharmacyContext()
  const router = useSafeRouter()

  // ** Redux
  const dispatch = useDispatch()
  const notifications = useSelector(state => state.notifications.items)

  const handleNotificationClick = notification => {
    console.log('[AppBarContent] Notification clicked:', notification)

    // Mark as read in Redux
    dispatch(markAsRead(notification.id))

    // Navigate to conversation
    if (notification.conversationId) {
      console.log('[AppBarContent] Navigating to conversation:', notification.conversationId)
      router.push(`/chat?conversationId=${notification.conversationId}`)
    } else {
      console.log('[AppBarContent] No conversationId, navigating to /chat')
      router.push('/chat')
    }
  }

  const handleReadAllNotifications = () => {
    dispatch(markAllRead())
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center', position: 'relative' }}>
        {hidden ? (
          <IconButton color='inherit' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}>
            <Icon icon='mdi:menu' />
          </IconButton>
        ) : null}
        {/* <ModeToggler settings={settings} saveSettings={saveSettings} /> */}
        {moduleName === 'pharmacy' && pharmacyList?.length > 0 && <SelectPharmacy />}
        {moduleName === 'parivesh' && !router?.pathname.startsWith('/parivesh/species') && <SelectParivesh />}
      </Box>
      {router?.asPath?.includes('pharmacy') && (
        <Typography variant='h6' sx={{ ml: 'auto', mr: 4, display: { xs: 'none', sm: 'none', md: 'block' } }}>
          {selectedPharmacy?.name}
        </Typography>
      )}
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        {/* <LanguageDropdown settings={settings} saveSettings={saveSettings} /> */}
        {/* <NotificationDropdown
          settings={settings}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onReadAll={handleReadAllNotifications}
        /> */}
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
