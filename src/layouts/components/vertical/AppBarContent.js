// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { useContext } from 'react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import SelectPharmacy from 'src/components/SelectPharmacy'
import { usePathname } from 'next/navigation'
import { AuthContext } from 'src/context/AuthContext'
import SelectParivesh from 'src/components/SelectParivesh'
import Typography from '@mui/material/Typography'
import { usePharmacyContext } from 'src/context/PharmacyContext'

// import LanguageDropdown from 'src/@core/layouts/components/shared-components/LanguageDropdown'
import { useRouter } from 'next/router'

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  const pathname = usePathname()
  const pathArray = pathname !== '' ? pathname?.replace(/^\//, '')?.split('/') : [] // removing first forward slash before splitting

  const moduleName = pathArray.length > 0 ? pathArray[0] : ''
  const authData = useContext(AuthContext)
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const { selectedPharmacy } = usePharmacyContext()
  const router = useRouter()

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
        {moduleName === 'parivesh' && <SelectParivesh />}
      </Box>
      {router?.asPath?.includes('pharmacy') && (
        <Typography variant='h6' sx={{ ml: 'auto', mr: 4 }}>
          {selectedPharmacy?.name}
        </Typography>
      )}
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        {/* <LanguageDropdown settings={settings} saveSettings={saveSettings} /> */}
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
