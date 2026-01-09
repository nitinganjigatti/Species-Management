import Grid from '@mui/material/Grid'
import PharmacySettingsList from 'src/components/pharmacy/pharmacySettings/PharmacySettingsList'

const PharmacySettingsPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item size={12}>
        <PharmacySettingsList />
      </Grid>
    </Grid>
  )
}

export default PharmacySettingsPage
