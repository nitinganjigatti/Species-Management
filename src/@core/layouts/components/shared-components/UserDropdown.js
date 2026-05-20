// ** React Imports
import { useState, Fragment, useEffect, useContext } from 'react'

// ** Next Import
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Context
import { useAuth } from 'src/hooks/useAuth'
import { AuthContext } from 'src/context/AuthContext'

// ** WSO2 Auth Flag
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'

// ** i18n
import { useTranslation } from 'react-i18next'

// ** Notification Service
import notificationService from 'src/lib/notifications'
import toast from 'react-hot-toast'

// ** Styled Components
const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
}))

const UserDropdown = props => {
  // ** Props
  const { settings } = props

  // ** States
  const [anchorEl, setAnchorEl] = useState(null)
  const [userData, setUserData] = useState([])
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  // ** Hooks
  const router = useSafeRouter()
  const { logout } = useAuth()
  const { t } = useTranslation('common')

  // ** Vars
  const { direction } = settings
  const authData = useContext(AuthContext)

  const getUserData = () => {
    setUserData(authData.userData || {})
  }

  const handleDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = url => {
    if (url) {
      router.push(url)
    }
    setAnchorEl(null)
  }

  const styles = {
    py: 2,
    px: 4,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    color: 'text.primary',
    textDecoration: 'none',
    '& svg': {
      mr: 2,
      fontSize: '1.375rem',
      color: 'text.primary'
    }
  }

  const handleLogout = () => {
    logout()
    handleDropdownClose()
  }

  const handleChangePassword = () => {
    router.push('/change-password')
    handleDropdownClose()
  }

  const handleMedia = () => {
    router.push('/media')
    handleDropdownClose()
  }

  const checkPushStatus = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.active) {
        const sub = await reg.pushManager.getSubscription()
        setIsPushEnabled(!!sub)
      }
    } catch (error) {
      console.error('Failed to check push status:', error)
    }
  }

  const handleEnableNotifications = async () => {
    debugger
    try {
      setSaving(true)
      const success = await notificationService.enablePushNotifications()
      if (success) {
        setIsPushEnabled(true)
        toast.success('Notifications enabled')
      } else {
        toast.error('Failed to enable notifications')
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      toast.error('Failed to enable notifications')
    } finally {
      setSaving(false)
    }
  }

  const handleDisableNotifications = async () => {
    try {
      setSaving(true)
      const success = await notificationService.disablePushNotifications()
      if (success) {
        setIsPushEnabled(false)
        toast.success('Notifications disabled')
      } else {
        toast.error('Failed to disable notifications')
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error)
      toast.error('Failed to disable notifications')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    getUserData()
    checkPushStatus()
  }, [])

  return (
    <Fragment>
      <Badge
        overlap='circular'
        onClick={handleDropdownOpen}
        sx={{ ml: 2, cursor: 'pointer' }}
        badgeContent={<BadgeContentSpan />}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <Avatar
          alt='Name'
          onClick={handleDropdownOpen}
          sx={{ width: 40, height: 40 }}
          src={userData?.user?.profile_pic ? userData?.user?.profile_pic : '/images/avatars/1.png'}
        />
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ '& .MuiMenu-paper': { width: 230, mt: 4 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
      >
        <Box sx={{ pt: 2, pb: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              overlap='circular'
              badgeContent={<BadgeContentSpan />}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
            >
              <Avatar
                alt='Name'
                src={userData?.user?.profile_pic ? userData?.user?.profile_pic : '/images/avatars/1.png'}
                sx={{ width: '2.5rem', height: '2.5rem' }}
              />
            </Badge>
            <Box sx={{ display: 'flex', ml: 3, alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 600 }}>
                {userData?.user?.user_first_name ? userData?.user?.user_first_name : null}
                <span style={{ marginRight: '2px' }} />
                {userData?.user?.user_last_name ? userData?.user?.user_last_name : null}
              </Typography>

              <Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                {userData?.roles?.role_name ? userData?.roles?.role_name : null}
              </Typography>
            </Box>
          </Box>
        </Box>
        {/* <Divider sx={{ mt: '0 !important' }} />
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose()}>
          <Box sx={styles}>
            <Icon icon='mdi:account-outline' />
            Profile
          </Box>
        </MenuItem> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose()}>
          <Box sx={styles}>
            <Icon icon='mdi:email-outline' />
            Inbox
          </Box>
        </MenuItem> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose()}>
          <Box sx={styles}>
            <Icon icon='mdi:message-outline' />
            Chat
          </Box>
        </MenuItem> */}
        {/* <Divider />
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose()}>
          <Box sx={styles}>
            <Icon icon='mdi:cog-outline' />
            Settings
          </Box>
        </MenuItem> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose()}>
          <Box sx={styles}>
            <Icon icon='mdi:currency-usd' />
            Pricing
          </Box>
        </MenuItem> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose()}>
          <Box sx={styles}>
            <Icon icon='mdi:help-circle-outline' />
            FAQ
          </Box>
        </MenuItem>
        <Divider /> */}
        <Divider sx={{ my: '0 !important' }} />
        {!isPushEnabled ? (
          <MenuItem
            onClick={handleEnableNotifications}
            disabled={saving}
            sx={{ py: 2, '& svg': { mr: 2, fontSize: '1.375rem', color: 'text.primary' } }}
          >
            <Icon icon='mdi:bell-plus' />
            {saving ? 'Enabling...' : 'Enable Notifications'}
          </MenuItem>
        ) : (
          <MenuItem
            onClick={handleDisableNotifications}
            disabled={saving}
            sx={{ py: 2, '& svg': { mr: 2, fontSize: '1.375rem', color: 'text.primary' } }}
          >
            <Icon icon='mdi:bell-off' />
            {saving ? 'Disabling...' : 'Disable Notifications'}
          </MenuItem>
        )}
        {isWso2AuthEnabled() && (
          <MenuItem
            onClick={handleChangePassword}
            sx={{ py: 2, '& svg': { mr: 2, fontSize: '1.375rem', color: 'text.primary' } }}
          >
            <Icon icon='mdi:lock-reset' />
            {t('change_password', 'Change Password')}
          </MenuItem>
        )}
        <MenuItem onClick={handleMedia} sx={{ py: 2, '& svg': { mr: 2, fontSize: '1.375rem', color: 'text.primary' } }}>
          <Icon icon='ic:round-perm-media' />
          {t('media')}
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ py: 2, '& svg': { mr: 2, fontSize: '1.375rem', color: 'text.primary' } }}
        >
          <Icon icon='mdi:logout-variant' />
          {t('logout')}
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default UserDropdown
