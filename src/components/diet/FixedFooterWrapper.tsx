// FixedFooterWrapper.js
import React from 'react'
import { Box } from '@mui/material'
import useParentWidth from '../../hooks/useParentWidth'

interface Props {
  children: React.ReactNode
}

const FixedFooterWrapper: React.FC<Props> = ({ children }) => {
  const { parentRef, width } = useParentWidth()

  return (
    <Box ref={parentRef} sx={{ position: 'relative' }}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          width: width ? `${width}px` : '100%',
          maxWidth: '100%',
          backgroundColor: 'white',
          zIndex: 900,
          borderRadius: '4px',
          boxSizing: 'border-box'
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default FixedFooterWrapper
