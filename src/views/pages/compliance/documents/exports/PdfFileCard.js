import React, { useMemo } from 'react'
import { Card, CardMedia, CardContent, Tooltip, Typography, Box } from '@mui/material'
import Image from 'next/image'
import { useAuth } from 'src/hooks/useAuth'

const PdfFileCard = ({ media, isBorderedCard = false }) => {
  const fileExt = media?.file?.split('.').pop()?.toLowerCase()
  const auth = useAuth()

  const imgPath = useMemo(() => auth?.userData?.settings?.DEFAULT_IMAGE_MASTER, [auth])

  const getIconByFileType = fileName => {
    const ext = fileName.split('.').pop().toLowerCase()
    if (['pdf'].includes(ext)) return imgPath.pdf
    if (['xls', 'xlsx'].includes(ext)) return imgPath.xls
    if (['doc', 'docx'].includes(ext)) return imgPath.document
    if (['mp3', 'wav', 'ogg'].includes(ext)) return imgPath.audio

    return imgPath.default
  }

  return (
    <Card
      sx={theme => ({
        height: '100%',
        bgcolor: theme.palette.common.white,
        position: 'relative',
        cursor: 'pointer',
        border: isBorderedCard && `1px solid ${theme.palette.grey[300]}`, // For bordered card
        boxShadow: isBorderedCard && 'none' // default shadow
      })}
      onClick={() => window.open(media?.file, '_blank')}
    >
      {['jpeg', 'jpg', 'gif', 'png', 'svg'].includes(fileExt) ? (
        <CardMedia
          component='img'
          height='160'
          image={media?.file}
          sx={{ objectFit: 'cover', borderRadius: 2.6, p: 5 }}
        />
      ) : ['mp4', 'mov'].includes(fileExt) ? (
        <CardMedia
          component='video'
          controls
          height='160'
          src={media?.file}
          sx={{ objectFit: 'cover', borderRadius: 2.6, p: 5 }}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 100,
            borderRadius: 1,
            bgcolor: getIconByFileType(media?.file_original_name)?.bg_color,
            m: 2
          }}
        >
          <Image src={getIconByFileType(media?.file_original_name)?.image_path} alt='' width={60} height={60} />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', px: '1rem' }}>
        <Tooltip title={media?.file_original_name} arrow>
          <Typography
            variant='subtitle2'
            sx={{
              mb: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 180
            }}
          >
            {media?.file_original_name}
          </Typography>
        </Tooltip>
      </Box>
    </Card>
  )
}

export default React.memo(PdfFileCard)
