import { useTheme } from '@emotion/react'
import { Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import Icon from 'src/@core/components/icon'
import SiteCard from '../utils/SiteListingCard'

const SelectedSites = ({ open, setShowSelectedSitesDrawer, clusterName, selectedSites, onRemoveSite }) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={() => setShowSelectedSitesDrawer(false)}
      PaperProps={{
        sx: {
          width: ['100%', '562px'],
          height: '70vh',
          position: 'fixed',
          right: 0,
          bottom: 0,
          top: 'auto',
          borderTopLeftRadius: 16
        }
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.default',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/activity_icon.png' alt='Cluster Icon' width='30px' />
            <Typography variant='h6'>Selected Sites</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setShowSelectedSitesDrawer(false)}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        {/* Cluster Info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#fff',
            borderRadius: 1,
            p: 4,
            mb: 2,
            mt: 6,
            border: '1px solid #e0e0e0',
            mx: 5
          }}
        >
          <img src='/images/housing/cluster-icon-colored.svg' alt='Cluster Icon' width={32} />
          <Box>
            <Typography fontWeight={600}>{clusterName}</Typography>
          </Box>
        </Box>
        {/* Selected Sites Count */}
        <Typography variant='subtitle1' sx={{ px: 3, mb: 2, mt: 2 }}>
          You have selected {selectedSites?.length} site{selectedSites?.length !== 1 ? 's' : ''}
        </Typography>
        {/* Selected Sites List or Empty State */}
        <Box sx={{ px: 3, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedSites?.length === 0 ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src='/images/no-data/seal.png'
                alt='No sites selected'
                style={{ width: 250, marginBottom: 24, opacity: 0.85 }}
              />
              <Typography variant='subtitle1' color='text.secondary'>
                No sites selected
              </Typography>
            </Box>
          ) : (
            selectedSites?.map(site => (
              <SiteCard key={site?.site_id} site={site} mode='remove' onAction={onRemoveSite} />
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectedSites
