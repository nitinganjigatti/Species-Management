import React from 'react'
import { Box, Tooltip } from '@mui/material'

interface StatChipProps {
  value: number | string
  bgcolor?: string
  color?: string
}

const StatChip: React.FC<StatChipProps> = ({ value, bgcolor, color }) => {
  const tooltipTitle = typeof value === 'number' ? value.toLocaleString() : String(value ?? '')

  return (
    <Tooltip title={tooltipTitle} arrow placement='top'>
      <Box
        sx={{
          px: 0.5,
          py: 0.5,
          minWidth: 50,
          cursor: 'default',
          borderRadius: '4px',
          bgcolor: bgcolor,
          color: color,
          fontSize: '14px',
          fontWeight: 600,
          display: 'inline-block',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}
      >
        {value}
      </Box>
    </Tooltip>
  )
}

export default React.memo(StatChip)
