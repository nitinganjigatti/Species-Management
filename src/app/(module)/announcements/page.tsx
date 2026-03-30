'use client'

import Box from '@mui/material/Box'
import { AnnouncementFeed } from 'src/components/announcement'

const AnnouncementsPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh'
      }}
    >
      <AnnouncementFeed />
    </Box>
  )
}

export default AnnouncementsPage
