import React from 'react'
import { Dialog, DialogContent, Box, Typography, Avatar, Button, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ShareIcon from '@mui/icons-material/Share'
import DownloadIcon from '@mui/icons-material/Download'

const AnimalQRCard = ({ open, handleClose, speciesData }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { imageUrl, speciesName, aid, qrCodeUrl } = speciesData

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogContent sx={{ textAlign: 'center', px: 6, py: 11 }}>
        <Avatar
          alt={speciesName}
          src={imageUrl}
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 4,

            // objectFit: 'cover',
            '& img': { objectFit: 'contain', p: 1 }
          }}
        />

        <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
          {speciesName}
        </Typography>
        <Typography
          variant='body2'
          mb={3}
          sx={{ fontWeight: 600, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
        >
          AID: {aid}
        </Typography>
        <img
          src={qrCodeUrl}
          alt='QR Code'
          sx={{
            width: '100%',
            maxWidth: 300,
            mx: 'auto',
            my: 2,
            borderRadius: 1,
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            p: 4
          }}
        />

        <Typography variant='body2' color={theme.palette.customColors.customTextColorGray2} mb={4}>
          Scan with the&nbsp;
          <Typography
            component='span'
            sx={{ color: theme.palette.primary.OnSurface, fontWeight: 500, fontSize: '14px' }}
          >
            Antz App
          </Typography>
        </Typography>
        <Box
          sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, justifyContent: 'center', mt: 6 }}
        >
          <Button
            variant='outlined'
            startIcon={<ShareIcon />}
            fullWidth
            onClick={() => navigator.share && navigator.share({ title: speciesName })}
          >
            Share
          </Button>
          <Button
            variant='contained'
            startIcon={<DownloadIcon />}
            fullWidth
            onClick={() => {
              const link = document.createElement('a')
              link.href = qrCodeUrl
              link.download = `${speciesName}_QR.png`
              link.click()
            }}
          >
            Download
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default AnimalQRCard
