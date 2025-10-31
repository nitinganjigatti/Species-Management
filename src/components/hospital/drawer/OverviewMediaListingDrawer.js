import { Box, Drawer, Grid, IconButton, Typography, useTheme } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
import FilePreviewCard from 'src/views/utility/NewMediaCard'

const OverviewMediaListingDrawer = ({ open, onClose, media }) => {
  const theme = useTheme()

  console.log(media)

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '80%', md: 560 },
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors.OnPrimary,
            p: 0
          }
        }
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          pb: 0,
          p: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
          <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.OnSurfaceVariant }}>
            Attachments
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          background: theme.palette.customColors.OnPrimary,
          minHeight: 0,
          p: 6
        }}
      >
        <Grid container spacing={4}>
          {media?.map((item, index) => {
            return (
              <Grid key={index} size={{ xs: 12, sm: 6 }}>
                <FilePreviewCard
                  fileUrl={item?.fileUrl}
                  fileName={item?.fileName}
                  width={250}
                  height={180}
                  user={item?.user}
                />
              </Grid>
            )
          })}
        </Grid>
      </Box>
    </Drawer>
  )
}

export default OverviewMediaListingDrawer
