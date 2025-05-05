import React, { useState } from 'react'
import { Card, CardMedia, IconButton, Box, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import Utility from 'src/utility'

const ImagePreview = ({ imageSrc, imageDetails, onClose, altText = 'preview', width = 200, height = 150, loader }) => {
  const [scale, setScale] = useState(1)

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 1))

  const commonIconButtonStyle = {
    width: 25,
    height: 25,
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 0,
    padding: 0,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'error.main',
      cursor: 'pointer'
    },
    pointerEvents: loader ? 'none' : 'auto'
  }

  function actionButtons() {
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 1))

    return (
      <>
        <IconButton
          onClick={() => {
            onClose()
          }}
          sx={{ ...commonIconButtonStyle, top: 2, right: 2, borderRadius: 0, padding: 0 }}
        >
          <CloseIcon sx={{ fontSize: 20, borderRadius: 'none !important' }} />
        </IconButton>

        {/* <IconButton sx={{ ...commonIconButtonStyle, bottom: 56, right: 8 }} onClick={handleZoomIn}>
          <ZoomInIcon sx={{ fontSize: 20, borderRadius: 'none !important' }} />
        </IconButton>

        <IconButton sx={{ ...commonIconButtonStyle, bottom: 8, right: 8 }} onClick={handleZoomOut}>
          <ZoomOutIcon sx={{ fontSize: 20, borderRadius: 'none !important' }} />
        </IconButton> */}
      </>
    )
  }

  return (
    <Box
      sx={{
        background: 'white'
      }}
    >
      {imageSrc && (
        <Card
          sx={{
            position: 'relative',
            width,
            height,
            minWidth: width,
            minHeight: height,
            backgroundColor: '#E8F4F2',
            borderRadius: 1,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 2,
            boxShadow: 'none',
            mx: 1,
            my: 1
          }}
        >
          <a href={imageSrc} target='_blank' rel='noopener noreferrer' style={{ width: '100%', height: '100%' }}>
            <CardMedia
              component='img'
              image={imageSrc}
              alt={altText}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`,
                transition: 'transform 0.3s ease',
                pointerEvents: 'none'
              }}
            />
          </a>

          {actionButtons()}
        </Card>
      )}
      {imageDetails && (
        <Box sx={{ marginTop: -1, px: 2, pb: 1 }}>
          <Typography
            sx={{
              fontSize: '12px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px',
              fontWeight: 100
            }}
          >
            {imageDetails?.name || ''}
          </Typography>
          <Typography sx={{ fontSize: '12px', fontWeight: 100 }}>
            {Utility.formatDisplayDate(Utility.convertUTCToLocal(imageDetails?.created_at))} -{' '}
            {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(imageDetails?.created_at))}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default React.memo(ImagePreview)
