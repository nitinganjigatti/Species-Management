// ** MUI Imports
import Box from '@mui/material/Box'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import SessionExpiryTimer from 'src/@core/layouts/components/shared-components/SessionExpiryTimer'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'

const AppBarContent = props => {
  // ** Props
  const { settings, saveSettings } = props

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* <ModeToggler settings={settings} saveSettings={saveSettings} />  */}
      <SessionExpiryTimer />
      <UserDropdown settings={settings} />
    </Box>
  )
}

export default AppBarContent
