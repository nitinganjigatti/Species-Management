import React from 'react'
import { Grid, Box, Typography, Divider, IconButton } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useMediaQuery } from '@mui/system'
import { useTheme } from '@emotion/react'

const EnclosureDetailsCard = ({ enclosureData, onEditClick }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const info = [
    {
      icon: <img src='/images/housing/enclosure-icon-colored.svg' alt='Cluster Icon' width='40px' />,
      label: 'Enclosure ID',
      value: `${enclosureData?.enclusreId}`
    },
    {
      icon: <img src='/images/housing/enclosre-type-colored-icon.svg' alt='Cluster Icon' width='40px' />,
      label: 'Enclosure Type',
      value: `${enclosureData?.enclusreType}`
    },
    {
      icon: <img src='/images/housing/section-colored-icon.svg' alt='Cluster Icon' width='30px' />,
      label: 'Section Name',
      value: `${enclosureData?.sectionName}`
    },
    {
      icon: <img src='/images/housing/site-icon-colored.svg' alt='Cluster Icon' width='35px' />,
      label: 'Site Name',
      value: `${enclosureData?.siteName}`
    }
  ]

  return (
    <Box
      sx={{
        background: theme.palette.customColors.displaybgPrimary,
        borderRadius: 1,
        px: { xs: 2, sm: 6 },
        py: { xs: 2, sm: 5 },
        width: '100%',
        boxSizing: 'border-box',
        mt: 6
      }}
    >
      {/* Header */}
      <Grid container alignItems='center' justifyContent='space-between' sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant='h6' sx={{ color: 'customColors.OnSurfaceVariant', fontWeight: 500 }}>
            Enclosure Details
          </Typography>
        </Grid>
        <Grid item>
          <IconButton size='small' onClick={onEditClick}>
            <EditOutlinedIcon sx={{ color: '#6b7a7a' }} />
          </IconButton>
        </Grid>
      </Grid>

      {/* Info Blocks */}
      <Grid
        container
        alignItems='center'
        justifyContent='flex-start'
        spacing={0}
        sx={{
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}
      >
        {info.map((item, idx) => (
          <React.Fragment key={item.label}>
            <Grid
              item
              size={{ xs: 12, sm: 3 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: { xs: 2, sm: 0 },
                minWidth: 0
              }}
            >
              {item.icon}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, lineHeight: 1.2 }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant='subtitle1'
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.value ? item.value : 'NA'}
                </Typography>
              </Box>
            </Grid>
            {!isMobile && idx < info.length - 1 && (
              <Grid
                item
                xs={1}
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  height: 48,
                  px: 6,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Divider orientation='vertical' flexItem />
              </Grid>
            )}
          </React.Fragment>
        ))}
      </Grid>
    </Box>
  )
}

export default EnclosureDetailsCard
