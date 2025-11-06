import { Box, Drawer, Grid, IconButton, Typography, useTheme } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
import FilePreviewCard from 'src/views/utility/NewMediaCard'

const OverviewMediaListingDrawer = ({ open, onClose, media = [] }) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '75%', sm: '560px' },
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors.OnPrimary
          }
        }
      }}
    >
      <Box
        sx={{
          p: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
          <Typography sx={{ fontWeight: 500, fontSize: '1.5rem', color: theme.palette.customColors.OnSurfaceVariant }}>
            Attachments
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' color={theme.palette.customColors.OnPrimaryContainer} />
        </IconButton>
      </Box>
      <Box
        sx={{
          p: 6
        }}
      >
        <Grid container spacing={4}>
          {media.length > 0 ? (
            media.map(item => (
              <Grid
                key={item.id}
                size={{ xs: 12, sm: 6 }}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FilePreviewCard
                  fileUrl={item?.file}
                  fileName={item?.file_original_name}
                  fileType={item?.file_type}
                  width={'250px'}
                  height={'220px'}
                  user={item}
                  showTitle={true}
                />
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', mt: 4 }}>
                No attachments available
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Drawer>
  )
}

export default OverviewMediaListingDrawer
