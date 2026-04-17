import React, { useState, useEffect, FC, memo } from 'react'
import { Dialog, DialogContent, Box, Typography, Button, useMediaQuery, IconButton, Skeleton } from '@mui/material'
import { useTheme, alpha, Theme } from '@mui/material/styles'
import ShareIcon from '@mui/icons-material/Share'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from 'react-i18next'

interface TransferData {
  requestId?: string
  qrCodeUrl?: string
  title?: string
  subtitle?: string
}

interface TransferPassQRCardProps {
  open: boolean
  handleClose: () => void
  transferData?: TransferData | null
}

const TransferPassQRCard: FC<TransferPassQRCardProps> = ({ open, handleClose, transferData }) => {
  const theme = useTheme<Theme>()
  const { t } = useTranslation()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  const { requestId, qrCodeUrl, title, subtitle } = transferData || {}

  useEffect(() => {
    if (open) {
      setImageLoaded(false)
    }
  }, [open, qrCodeUrl])

  if (!transferData) return null

  const handleShare = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${subtitle}: ${requestId}`,
          url: qrCodeUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  const handleDownload = (): void => {
    const link = document.createElement('a')
    link.href = qrCodeUrl || ''
    link.download = `Transfer_Pass_${requestId}.png`
    link.click()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='xs'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent
        sx={{
          textAlign: 'center',
          p: 0,
          backgroundColor: (theme.palette as any).customColors?.OnPrimary,
          position: 'relative'
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: theme.palette.text.primary,
            backgroundColor: alpha((theme.palette as any).customColors?.OnPrimary || theme.palette.common.white, 0.7),
            '&:hover': {
              backgroundColor: alpha((theme.palette as any).customColors?.OnPrimary || theme.palette.common.white, 0.9)
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ px: 4, py: 6 }}>
          <Typography
            sx={{
              fontSize: '2rem',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 2
            }}
          >
            {title || t('necropsy_module.transfer_pass')}
          </Typography>

          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 400,
              color: theme.palette.text.secondary,
              mb: 1
            }}
          >
            {subtitle || t('necropsy_module.transfer_request_number')}
          </Typography>

          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 4
            }}
          >
            {requestId}
          </Typography>

          <Box sx={{ position: 'relative', width: '100%', maxWidth: 280, mx: 'auto' }}>
            {!imageLoaded && (
              <Skeleton
                variant='rectangular'
                sx={{
                  width: '100%',
                  height: 280,
                  borderRadius: 2,
                  bgcolor: theme.palette.action.hover
                }}
              />
            )}
            <Box
              component='img'
              src={qrCodeUrl}
              alt={t('necropsy_module.transfer_pass_qr_code')}
              onLoad={() => setImageLoaded(true)}
              sx={{
                width: '100%',
                maxWidth: 280,
                borderRadius: 2,
                backgroundColor: (theme.palette as any).customColors?.OnPrimary,
                p: 1,
                display: imageLoaded ? 'block' : 'none'
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2,
              justifyContent: 'center',
              mt: 4
            }}
          >
            <Button
              variant='outlined'
              startIcon={<ShareIcon />}
              fullWidth
              onClick={handleShare}
              sx={{
                borderColor: theme.palette.text.primary,
                color: theme.palette.text.primary,
                backgroundColor: alpha(
                  (theme.palette as any).customColors?.OnPrimary || theme.palette.common.white,
                  0.5
                ),
                '&:hover': {
                  backgroundColor: alpha(
                    (theme.palette as any).customColors?.OnPrimary || theme.palette.common.white,
                    0.8
                  ),
                  borderColor: theme.palette.text.primary
                }
              }}
            >
              {t('necropsy_module.share')}
            </Button>
            <Button
              variant='contained'
              startIcon={<DownloadIcon />}
              fullWidth
              onClick={handleDownload}
              sx={{
                backgroundColor: theme.palette.text.primary,
                color: (theme.palette as any).customColors?.OnPrimary || theme.palette.common.white,
                '&:hover': {
                  backgroundColor: theme.palette.grey[800]
                }
              }}
            >
              {t('necropsy_module.download')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default memo(TransferPassQRCard)
