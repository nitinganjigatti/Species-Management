import { useTheme } from '@emotion/react'
import { CircularProgress, Typography } from '@mui/material'
import { Box } from '@mui/system'

export const DownloadReport = ({
  isDownloading,
  handleDownloadReport,
  customDownloadingText = 'Preparing download...',
  customeMainText = 'Download Report',
  containerStyles,
  imgSrc = '/images/download1.svg',
  imgAlt = 'download icon',
  imgStyle
}) => {
  const theme = useTheme()

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 4, ...containerStyles }}>
        {isDownloading ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}>
              {customDownloadingText}
            </Typography>
          </Box>
        ) : (
          <Typography
            onClick={handleDownloadReport}
            sx={{
              fontSize: '16px',
              fontWeight: '400',
              fontFamily: 'Inter',
              color: theme.palette.primary.dark,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            {customeMainText}
            <img src={imgSrc} alt={imgAlt} style={{ marginLeft: 8, width: 24, height: 24, ...imgStyle }} />
          </Typography>
        )}
      </Box>
    </>
  )
}
