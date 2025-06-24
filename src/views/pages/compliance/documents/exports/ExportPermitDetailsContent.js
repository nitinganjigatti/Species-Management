import { Box, Grid, Typography, CircularProgress, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'
import PdfFileCard from 'src/views/pages/compliance/documents/exports/PdfFileCard'

const ExportPermitDetailsContent = ({ exportData, loading }) => {
  const theme = useTheme()

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Box
        sx={{
          alignItems: 'flex-start',
          px: 6,
          py: 4,
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          borderRadius: '8px',
          backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4)
        }}
      >
        <Grid container spacing={4} sx={{ alignItems: 'center' }}>
          {/* First Column */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Certificate ID
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {exportData.export_number || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Exporting Country
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {exportData.exporting_country || '-'}
              </Typography>
            </Box>
          </Grid>

          {/* Second Column */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Date Of Issue
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {Utility.formatDate(exportData.issued_date)}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Exporter Name
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {exportData.exporter_name || '-'}
              </Typography>
            </Box>
          </Grid>

          {/* Third Column */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Last Day Of Validity
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {Utility.formatDate(exportData.valid_until)}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Importer
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {exportData.importer_name || '-'}
              </Typography>
            </Box>
          </Grid>

          {/* Fourth Column */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Country Of Origin
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {exportData.origin_country || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontWeight: 500, color: theme.palette.customColors.neutralSecondary, fontSize: '1rem' }}
              >
                Purpose Of Transfer
              </Typography>
              <Typography
                sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {exportData.export_purpose || '-'}
              </Typography>
            </Box>
          </Grid>

          {/* Fifth Column - File Card */}
          <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PdfFileCard
              media={{
                file: exportData.documents?.[0]?.file_path,
                file_original_name: exportData.documents?.[0]?.file_original_name || 'Export_document.pdf',
                created_at: exportData.documents?.[0]?.uploaded_at
              }}
              isBorderedCard
            />
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default ExportPermitDetailsContent