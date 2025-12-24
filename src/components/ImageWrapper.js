import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Box, useTheme } from '@mui/material'

const ImageComponent = ({ icon }) => {
  const theme = useTheme()
  const [imageType, setImageType] = useState(null)

  console.log(icon)

  useEffect(() => {
    if (!icon) return

    const cleanUrl = icon.split('?')[0].split('#')[0]
    const fileExtension = cleanUrl.split('.').pop().toLowerCase()

    if (fileExtension === 'svg') {
      setImageType('svg')
    } else {
      setImageType(null)
    }
  }, [icon])

  console.log(imageType, 'imageType')

  return (
    <>
      {imageType === 'svg' ? (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img width={44} height={44} style={{ objectFit: 'contain' }} src={icon} alt='' />
        </Box>
      ) : (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            width={44}
            height={44}
            style={{
              borderRadius: 50,
              backgroundColor: theme.palette.customColors.neutral10,
              objectFit: 'cover'
            }}
            src={icon}
            alt=''
          />
        </Box>
      )}
    </>
  )
}

export default ImageComponent
