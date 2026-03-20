import { useState } from 'react'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import { getFieldRenderer } from './fieldRenderers'

const ZooSettingsDynamicSection = ({ section, values, onChange, onSave }) => {
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
          {section.icon && (
            <Box sx={{
              width: 34, height: 34, borderRadius: '8px',
              bgcolor: 'customColors.OnBackground',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'primary.main'
            }}>
              <Icon icon={section.icon} fontSize={18} />
            </Box>
          )}
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
              {section.label}
            </Typography>
            {section.description && (
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                {section.description}
              </Typography>
            )}
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
          {(section.fields || []).map(field => {
            const Renderer = getFieldRenderer(field.type)

            return (
              <Grid key={field.key} size={{ xs: 12, sm: field.type === 'user_picker' || field.type === 'radio' ? 12 : 6 }}>
                <Renderer
                  field={field}
                  value={values[field.key] ?? field.default ?? null}
                  onChange={val => onChange(field.key, val)}
                />
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ZooSettingsDynamicSection
