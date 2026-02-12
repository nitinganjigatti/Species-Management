import Grid from '@mui/material/Grid'
import PharmacySettingsList from 'src/components/pharmacy/pharmacySettings/PharmacySettingsList'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

const PharmacySettingsPage = () => {
  const { selectedPharmacy } = usePharmacyContext()

  return selectedPharmacy.type === 'central' ? (
    <Grid container spacing={6}>
      <Grid item size={12}>
        <PharmacySettingsList />
      </Grid>
    </Grid>
  ) : (
    <Error404 />
  )
}

export default PharmacySettingsPage
