import { Box, Button, Typography, CircularProgress } from '@mui/material'
import Icon from 'src/@core/components/icon'
import ZooSettingsDynamicSection from './ZooSettingsDynamicSection'
import ZooSettingsReportEmailSection from './ZooSettingsReportEmailSection'

const ZooSettingsView = ({
  isLoading,
  schema,
  sectionValues,
  onSectionFieldChange,
  onSaveSection,
  reportTypes,
  reportEmailValues,
  onReportEmailChange,
  onSaveReportEmail,
  timezone,
  onOpenHistory
}) => {
  if (isLoading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  const sortedSchema = [...(schema || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ mb: 6, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
            Zoo Settings
          </Typography>
          <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage zoo-level configuration and report email settings
          </Typography>
        </Box>
        <Button
          variant='outlined'
          size='small'
          startIcon={<Icon icon='ion:time-outline' />}
          onClick={onOpenHistory}
          sx={{ height: 36, borderRadius: '8px', textTransform: 'none', fontWeight: 500 }}
        >
          History
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {sortedSchema.map(section => {
        if (section.type === 'report_email') {
          return (
            <ZooSettingsReportEmailSection
              key={section.key}
              section={section}
              reportTypes={reportTypes}
              reportEmailValues={reportEmailValues}
              timezone={timezone}
              onChange={onReportEmailChange}
              onSave={onSaveReportEmail}
            />
          )
        }

        return (
          <ZooSettingsDynamicSection
            key={section.key}
            section={section}
            values={sectionValues[section.key] || {}}
            onChange={(fieldKey, value) => onSectionFieldChange(section.key, fieldKey, value)}
            onSave={() => onSaveSection(section.key)}
          />
        )
      })}
      </Box>
    </Box>
  )
}

export default ZooSettingsView
