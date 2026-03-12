import { useState } from 'react'
import moment from 'moment-timezone'
import { Autocomplete, Box, Card, CardContent, Grid, TextField, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

const TIMEZONES = moment.tz.names().map(tz => ({
  value: tz,
  label: `${tz} (UTC${moment.tz(tz).format('Z')})`
}))

const CURRENCY_NAMES = new Intl.DisplayNames(['en'], { type: 'currency' })

const CURRENCIES = (() => {
  try {
    return Intl.supportedValuesOf('currency').map(code => {
      let name = code
      try { name = CURRENCY_NAMES.of(code) } catch (_) {}

      return { value: code, label: `${code} — ${name}` }
    })
  } catch (_) {
    return [
      { value: 'INR', label: 'INR — Indian Rupee' },
      { value: 'USD', label: 'USD — US Dollar' },
      { value: 'EUR', label: 'EUR — Euro' },
      { value: 'GBP', label: 'GBP — British Pound Sterling' },
      { value: 'AED', label: 'AED — UAE Dirham' },
      { value: 'AUD', label: 'AUD — Australian Dollar' },
      { value: 'CAD', label: 'CAD — Canadian Dollar' },
      { value: 'CHF', label: 'CHF — Swiss Franc' },
      { value: 'CNY', label: 'CNY — Chinese Yuan' },
      { value: 'JPY', label: 'JPY — Japanese Yen' },
      { value: 'SGD', label: 'SGD — Singapore Dollar' },
      { value: 'ZAR', label: 'ZAR — South African Rand' }
    ]
  }
})()

const AUTOCOMPLETE_SX = {
  width: '100%',
  '& input': { minWidth: '0 !important' },
  '& .MuiAutocomplete-listbox': { maxHeight: 260, fontSize: '13px' }
}

const ZooSettingsGeneralSection = ({ values, onChange, onSave }) => {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try { await onSave() } finally { setSaving(false) }
  }

  return (
    <Card sx={{ mb: 5, boxShadow: theme => theme.shadows[2], borderRadius: '10px' }}>
      <Box
        sx={{
          px: 6, py: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'customColors.SurfaceVariant'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '8px',
            bgcolor: 'customColors.OnBackground',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'primary.main'
          }}>
            <Icon icon='mdi:earth' fontSize={18} />
          </Box>
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
              General Settings
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Timezone and currency preferences
            </Typography>
          </Box>
        </Box>
        <LoadingButton
          loading={saving}
          onClick={handleSave}
          variant='contained'
          size='small'
          startIcon={<Icon icon='mdi:content-save-outline' />}
          sx={{ height: 36, borderRadius: '8px', px: 4 }}
        >
          Save
        </LoadingButton>
      </Box>

      <CardContent sx={{ px: 6, py: 5 }}>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              fullWidth
              sx={AUTOCOMPLETE_SX}
              options={TIMEZONES}
              value={TIMEZONES.find(tz => tz.value === values.timezone) || null}
              onChange={(_, option) => option && onChange('timezone', option.value)}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              slotProps={{ listbox: { style: { maxHeight: 260, fontSize: '13px' } } }}
              renderInput={params => (
                <TextField {...params} fullWidth label='Timezone' size='small' />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              fullWidth
              sx={AUTOCOMPLETE_SX}
              options={CURRENCIES}
              value={CURRENCIES.find(c => c.value === values.currency) || null}
              onChange={(_, option) => option && onChange('currency', option.value)}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              slotProps={{ listbox: { style: { maxHeight: 260, fontSize: '13px' } } }}
              renderInput={params => (
                <TextField {...params} fullWidth label='Currency' size='small' />
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ZooSettingsGeneralSection
