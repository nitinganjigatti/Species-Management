// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import SetStore from 'src/components/SetStore'
import { usePathname } from 'next/navigation'

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  const pathname = usePathname()
  const pathArray = pathname !== '' ? pathname?.replace(/^\//, '')?.split('/') : [] // removing first forward slash before splitting

  const moduleName = pathArray.length > 0 ? pathArray[0] : ''

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {/* {hidden ? (
          <IconButton color='inherit' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}>
            <Icon icon='mdi:menu' />
          </IconButton>
        ) : null}

        <ModeToggler settings={settings} saveSettings={saveSettings} /> */}

        {moduleName === 'pharmacy' && <SetStore />}
      </Box>

      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
