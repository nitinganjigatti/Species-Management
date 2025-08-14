import { Divider, Typography, useTheme } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React from 'react'
import MoreMediaListing from 'src/components/MoreMediaListing'
import { renderUserAvatarDetails } from 'src/utility/render'

const sampleMediaItems = [
  {
    id: 1,
    title: 'Antz Yelahanka Site Visit',
    type: 'image',
    timestamp: new Date().setHours(12, 23),
    thumbnail: null
  },
  {
    id: 2,
    title: 'Antz Yelahanka Site Report',
    type: 'pdf',
    timestamp: new Date().setHours(12, 23),
    thumbnail: null
  },
  {
    id: 3,
    title: 'Project Video Overview',
    type: 'video',
    timestamp: new Date().setHours(14, 30),
    thumbnail: null
  },
  {
    id: 4,
    title: 'Meeting Audio Recording',
    type: 'audio',
    timestamp: new Date().setHours(15, 45),
    thumbnail: null
  },
  {
    id: 5,
    title: 'Additional Document',
    type: 'document',
    timestamp: new Date().setHours(16, 15),
    thumbnail: null
  }
]

const InpatientOverview = () => {
  const theme = useTheme()

  return (
    <>
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Box></Box>
        <Grid container spacing={6} sx={{ borderRadius: 2, p: 4 }}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}>
              Reason for Admission
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {renderUserAvatarDetails({ user_name: 'Jordan Stevenson' })}
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}
              >
                Requested on : 02 Jan 2025・12 : 35 PM
              </Typography>
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ pl: 6, pt: 6, pr: 6, borderLeft: { md: `0.5px solid ${theme.palette.divider}`, xs: 'none' } }}
          >
            <MoreMediaListing mediaItems={sampleMediaItems} maxVisibleItems={2} />
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default InpatientOverview
