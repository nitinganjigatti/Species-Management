import { Box, Typography, CircularProgress, alpha } from '@mui/material'
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
    <Box
      sx={{
        px: 6,
        py: 4,
        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        borderRadius: '8px',
        backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4)
      }}
    >
      {/* Main flex row container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 4,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Certificate ID & Exporting Country */}
        <Box
          sx={{
            flex: '0 1 180px',
            minWidth: 0
          }}
        >
          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Certificate ID
          </Typography>
          <Typography
            sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient, mb: 4 }}
          >
            {exportData.export_number || '-'}
          </Typography>

          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Exporting Country
          </Typography>
          <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}>
            {exportData.exporting_country || '-'}
          </Typography>
        </Box>

        {/* Date of Issue & Exporter Name */}
        <Box
          sx={{
            flex: '0 1 180px',
            minWidth: 0
          }}
        >
          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Date Of Issue
          </Typography>
          <Typography
            sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient, mb: 4 }}
          >
            {Utility.formatDate(exportData.issued_date)}
          </Typography>

          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Exporter Name
          </Typography>
          <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}>
            {exportData.exporter_name || '-'}
          </Typography>
        </Box>

        {/* Last Day of Validity & Importer */}
        <Box
          sx={{
            flex: '0 1 180px',
            minWidth: 0
          }}
        >
          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Last Day Of Validity
          </Typography>
          <Typography
            sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient, mb: 4 }}
          >
            {Utility.formatDate(exportData.valid_until)}
          </Typography>

          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Importer
          </Typography>
          <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}>
            {exportData.importer_name || '-'}
          </Typography>
        </Box>

        {/* Country of Origin & Purpose of Transfer */}
        <Box
          sx={{
            flex: '0 1 180px',
            minWidth: 0
          }}
        >
          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Country Of Origin
          </Typography>
          <Typography
            sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient, mb: 4 }}
          >
            {exportData.origin_country || '-'}
          </Typography>

          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '1rem', mb: 1 }}>
            Purpose Of Transfer
          </Typography>
          <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVarient }}>
            {exportData.export_purpose || '-'}
          </Typography>
        </Box>

        {/* File Card - spans two rows */}
        <Box
          sx={{
            flex: '0 1 180px',
            height: '100%',
            minWidth: 0,
            display: 'flex',
            justifyContent: { xs: 'flex-start', lg: 'flex-end' }
          }}
        >
          <Box sx={{ width: '150px' }}>
            <PdfFileCard
              media={{
                file: exportData.documents?.[0]?.file_path,
                file_original_name: exportData.documents?.[0]?.file_original_name || 'Export_document.pdf',
                created_at: exportData.documents?.[0]?.uploaded_at
              }}
              isBorderedCard
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default ExportPermitDetailsContent
