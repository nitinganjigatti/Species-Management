import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import Icon from 'src/@core/components/icon'

const AddGallery = ({ galleryList }) => {
  const theme = useTheme()
  console.log('galleryList :>> ', galleryList)

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
      {galleryList?.length > 0 ? (
        galleryList?.map(imgList => (
          <Box
            key={imgList?.id}
            sx={{
              width: '224px',
              height: '212px',
              border: '1px',
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
                className={status === 'eggs_received' ? 'hideField' : ''}
                sx={{
                  width: 30,
                  height: 30,
                  mr: 4,
                  borderRadius: '50%',
                  background: '#E8F4F2',
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
                  {imgList.user_full_name ? imgList.user_full_name : '-'}
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
        ))
      ) : (
        <Box
          sx={{
            width: '224px',
            height: '212px',
            border: '1px',
            p: '12px',
            gap: '12px',
            display: 'inline-block',
            alignItems: 'center',
            borderRadius: '8px',
            bgcolor: 'white',
            mb: 4,
            border: 1,
            borderColor: '#c3cec7'
          }}
        >
          <Box sx={{ width: '200px', height: '140px', borderRadius: '8px' }}>
            <img
              src='/images/default_EggImg.png'
              alt='Egg Image'
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              className={status === 'eggs_received' ? 'hideField' : ''}
              sx={{
                width: 30,
                height: 30,
                mr: 4,
                borderRadius: '50%',
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              {/* {params.row.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={params.row.user_profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' fontSize={30} />
              )} */}
            </Avatar>
            <Box
              sx={{ display: 'flex', flexDirection: 'column' }}
              className={status === 'eggs_received' ? 'hideField' : ''}
            >
              <Typography
                noWrap
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '16.94px'
                }}
              >
                {/* {params.row.user_full_name ? params.row.user_full_name : '-'}- */}-
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
                {/* {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}- */}-
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default AddGallery

const img = [
  { id: 1, img: '/images/default_EggImg.png' },
  { id: 1, img: '/images/default_EggImg.png' },
  { id: 1, img: '/images/default_EggImg.png' },
  { id: 1, img: '/images/default_EggImg.png' }
]
