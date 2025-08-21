import { Divider, Typography, useTheme } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React from 'react'
import MoreMediaListing from 'src/components/MoreMediaListing'
import { renderUserAvatarDetails } from 'src/utility/render'

const sampleMediaItems = [
  {
    id: 'm1',
    file_original_name: 'Antz Yelahanka Site Visit - Photos.jpg',
    file: 'https://example.com/media/site-visit-photo.jpg',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm2',
    file_original_name: 'Antz Yelahanka Site Visit - Report.pdf',
    file: 'https://example.com/media/site-visit-report.pdf',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm3',
    file_original_name: 'Antz Yelahanka Site Visit - Walkthrough.mp4',
    file: 'https://example.com/media/walkthrough.mp4',
    type: 'video',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm4',
    file_original_name: 'Antz Yelahanka Site Visit - Sheet.xlsx',
    file: 'https://example.com/media/visit-sheet.xlsx',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm5',
    file_original_name: 'Enclosure Reference Image.png',
    file: 'https://example.com/media/enclosure.png',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm6',
    file_original_name: 'Site Voice Note.m4a',
    file: 'https://example.com/media/voice-note.m4a',
    type: 'audio',
    created_at: '2025-08-12T12:23:00Z'
  }
]

const InpatientOverview = () => {
  const theme = useTheme()

  return (
    <>
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Box></Box>
        <Grid container spacing={6} sx={{ borderRadius: 2, p: 4 }}>
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}>
              Reason for Admission
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
              {renderUserAvatarDetails({ user_name: 'Jordan Stevenson', date: '02 Jan 2025', size: 'medium' })}
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}
              >
                Requested on : 02 Jan 2025・12 : 35 PM
              </Typography>
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{ pl: 6, pt: 6, pr: 6, borderLeft: { md: `0.5px solid ${theme.palette.divider}`, xs: 'none' } }}
          >
            {/* <MoreMediaListing mediaItems={sampleMediaItems} maxVisibleItems={2} /> */}
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default InpatientOverview
