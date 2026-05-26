'use client'

import { FC } from 'react'
import { Avatar, Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import Icon from 'src/@core/components/icon'

interface GalleryItem {
  id: string | number
  file_name: string
  user_profile_pic?: string
  user_full_name?: string
  created_at?: string
}

interface AddGalleryOwnProps {
  galleryList: GalleryItem[]
}

const AddGallery: FC<AddGalleryOwnProps> = ({ galleryList }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        m: 4,
        width: '514px',
        overflowX: 'auto',
        flexWrap: 'nowrap'
      }}
    >
      {galleryList?.map(imgList => (
        <Box
          key={imgList?.id}
          sx={{
            width: '224px',
            height: '212px',
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            p: '12px',
            gap: '12px',
            display: 'inline-block',
            alignItems: 'center',
            borderRadius: '8px',
            bgcolor: 'white',
            mb: 4
          }}
        >
          <Box sx={{ width: '200px', height: '140px', borderRadius: '8px' }}>
            <img
              src={imgList?.file_name}
              alt='Egg Image'
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{
                width: 30,
                height: 30,
                mr: 4,
                borderRadius: '50%',
                background: theme.palette.customColors.displaybgPrimary,
                overflow: 'hidden'
              }}
            >
              {imgList.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={imgList.user_profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' fontSize={25} />
              )}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '16.94px'
                }}
              >
                {imgList.user_full_name || '-'}
              </Typography>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: '12px',
                  fontWeight: '400',
                  lineHeight: '14.52px'
                }}
              >
                {imgList.created_at ? moment(imgList.created_at).format('DD/MM/YYYY') : '-'}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default AddGallery
