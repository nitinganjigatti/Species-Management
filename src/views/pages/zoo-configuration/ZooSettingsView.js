import { Box, Typography, CircularProgress } from '@mui/material'
import ZooSettingsGeneralSection from './ZooSettingsGeneralSection'
import ZooSettingsReportSection from './ZooSettingsReportSection'

const ZooSettingsView = ({
  isLoading,
  generalValues,
  onGeneralChange,
  onSaveGeneral,
  reportTypes,
  reportRecipients,
  onUpdateRecipients,
  onSaveReports
}) => {
  if (isLoading) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant='h5' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
          Zoo Settings
        </Typography>
        <Typography variant='body2' sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage zoo-level configuration and report distribution
        </Typography>
      </Box>

      <ZooSettingsGeneralSection
        values={generalValues}
        onChange={onGeneralChange}
        onSave={onSaveGeneral}
      />

      <ZooSettingsReportSection
        reportTypes={reportTypes}
        reportRecipients={reportRecipients}
        onUpdateRecipients={onUpdateRecipients}
        onSave={onSaveReports}
      />
    </Box>
  )
}

export default ZooSettingsView
