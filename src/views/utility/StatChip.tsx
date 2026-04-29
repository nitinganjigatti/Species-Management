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
          px: 1.5,
          py: 0.5,
          width: '48px',
          height: '25px',
          cursor: 'default',
          borderRadius: '4px',
          bgcolor: bgcolor,
          color: color,
          fontSize: '14px',
          fontWeight: 600,
          display: 'inline-block',
          textAlign: 'center',
          minWidth: 40,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}
      >
        {value}
      </Box>
    </Tooltip>
  )
}

export default React.memo(StatChip)
