import { useTheme } from '@emotion/react'
import { CircularProgress, Typography } from '@mui/material'
import { Box } from '@mui/system'
import type { DownloadReportProps } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

export const DownloadReport = ({
  isDownloading,
  handleDownloadReport,
  customDownloadingText = 'Preparing download...',
  customeMainText = 'Download Report',
  containerStyles,
  imgSrc = '/images/download1.svg',
  imgAlt = 'download icon',
  imgStyle
}: DownloadReportProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, ...containerStyles }}>
        {isDownloading ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2, color: (theme as any).palette.primary.dark, fontSize: '16px' }}>
              {customDownloadingText || t('compliance_module.preparing_download')}
            </Typography>
          </Box>
        ) : (
          <Typography
            onClick={handleDownloadReport}
            sx={{
              fontSize: '16px',
              fontWeight: '400',
              fontFamily: 'Inter',
              color: (theme as any).palette.primary.dark,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            {customeMainText || t('compliance_module.download_report')}
            <img src={imgSrc} alt={imgAlt} style={{ marginLeft: 8, width: 24, height: 24, ...imgStyle }} />
          </Typography>
        )}
      </Box>
    </>
  )
}
