'use client'

import React from 'react'
import { Box, Checkbox, Typography, Divider, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const MediaFilterContent = ({
  menuName,
  selectedOptions,
  onOptionChange,
  selectAllHandler,
  items,
  isAllSelected,
  hideSelectAll = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 2 }}>
        {!hideSelectAll && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 1
                },
                p: 1,
                ml: -1
              }}
              onClick={selectAllHandler}
            >
              <Checkbox
                checked={isAllSelected}
                indeterminate={selectedOptions?.length > 0 && !isAllSelected}
                onChange={selectAllHandler}
                onClick={e => e.stopPropagation()}
                sx={{ p: 1 }}
              />
              <Typography
                sx={{
                  fontSize: isMobile ? '14px' : '16px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 500
                }}
              >
                Select All
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          {items?.map(item => (
            <Box
              key={item.value}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 1
                },
                p: 1,
                ml: -1,
                transition: 'background-color 0.2s'
              }}
              onClick={() => onOptionChange(item.value, menuName)}
            >
              <Checkbox
                checked={selectedOptions?.includes(item.value)}
                onChange={() => onOptionChange(item.value, menuName)}
                sx={{ p: 1 }}
                onClick={e => e.stopPropagation()}
              />
              <Typography
                sx={{
                  fontSize: isMobile ? '14px' : '16px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  flex: 1,
                  userSelect: 'none'
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {items?.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: isMobile ? '14px' : '16px',
                color: theme.palette.text.secondary
              }}
            >
              No options available
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default MediaFilterContent
