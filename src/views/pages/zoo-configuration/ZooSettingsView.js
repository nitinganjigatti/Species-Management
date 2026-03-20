import { Box, Button, Typography, CircularProgress } from '@mui/material'
import Icon from 'src/@core/components/icon'
import ZooSettingsDynamicSection from './ZooSettingsDynamicSection'
import ZooSettingsReportSection from './ZooSettingsReportSection'

const ZooSettingsView = ({
  isLoading,
  schema,
  sectionValues,
  onSectionFieldChange,
  onSaveSection,
  reportTypes,
  reportRecipients,
  onUpdateRecipients,
  onSaveReports,
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
            Manage zoo-level configuration and report distribution
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

      {sortedSchema.map(section => {
        if (section.type === 'report_recipients') {
          return (
            <ZooSettingsReportSection
              key={section.key}
              reportTypes={reportTypes}
              reportRecipients={reportRecipients}
              onUpdateRecipients={onUpdateRecipients}
              onSave={onSaveReports}
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
  )
}

export default ZooSettingsView
