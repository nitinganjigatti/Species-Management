import React from 'react'
import { useTheme } from '@emotion/react'
import { Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import SiteCard from '../utils/SiteListingCard'
import type { Site } from 'src/types/housing'

interface SelectedSitesProps {
  open: boolean
  setShowSelectedSitesDrawer: (open: boolean) => void
  clusterName: string
  selectedSites: Site[]
  onRemoveSite: (siteId: number) => void
}

const SelectedSites: React.FC<SelectedSitesProps> = ({ open, setShowSelectedSitesDrawer, clusterName, selectedSites, onRemoveSite }) => {
  const theme = useTheme() as any

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
            p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255),
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
            background: theme.palette.customColors?.OnPrimary,
            borderRadius: 1,
            p: 4,
            mb: 2,
            mt: 6,
            border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
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
            selectedSites?.map((site: Site) => (
              <SiteCard key={site?.site_id} site={site} mode='remove' onAction={onRemoveSite} />
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectedSites
