'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import AppChat from 'src/views/apps/chat/AppChat'

const ChatPage = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <Box
      sx={{
        position: isFullscreen ? 'fixed' : 'relative',
        ...(isFullscreen
          ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1300
            }
          : {
              width: '100%',
              height: '100%'
            }),
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper'
      }}
    >
      <AppChat
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
    </Box>
  )
}

export default ChatPage
