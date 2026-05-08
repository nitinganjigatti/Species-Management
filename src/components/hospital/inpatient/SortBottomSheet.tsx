'use client'

import React from 'react'
import { Box, Typography, Modal, Radio, RadioGroup, FormControlLabel, IconButton, Divider, Paper } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'

interface SortBottomSheetProps {
  open: boolean
  onClose: () => void
  currentSort?: any
  onSortChange: (sort: any) => void
}

const SortBottomSheet = ({ open, onClose, currentSort, onSortChange }: SortBottomSheetProps) => {
  const theme: any = useTheme()
  const { t } = useTranslation()

  const sortOptions = [
    { value: 'recent', label: t('hospital_module.recent_most_first_default'), icon: '/images/hospital/clock_arrow_down.svg' },
    { value: 'oldest', label: t('hospital_module.oldest_first'), icon: '/images/hospital/clock_arrow_up.svg' }
  ]

  const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSortValue = event.target.value
    onSortChange(newSortValue)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end'
      }}
    >
      <Paper
        sx={{
          width: { xs: '100%', sm: 560 },
          maxHeight: '60vh',
          backgroundColor: theme.palette.background.paper,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderBottomLeftRadius: '16px',
          boxShadow: 24,
          overflow: 'auto',
          position: 'absolute',
          bottom: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  bgcolor: theme?.palette.customColors?.OnPrimary,
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <Icon icon={'lets-icons:sort-arrow'} fontSize={24} />
              </Box>
              <Typography
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVarient }}
              >
                {t('hospital_module.sort_by')}
              </Typography>
            </Box>
            <IconButton onClick={onClose} {...({ height: 14, width: 14 } as any)}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Sort Options */}
          <Box sx={{ px: 4, pb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sortOptions.map((option: any) => (
              <Box
                key={option.value}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  p: 4,
                  borderRadius: '8px',
                  backgroundColor:
                    currentSort === option.value ? theme.palette.customColors.OnBackground : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.customColors.OnBackground
                  }
                }}
                onClick={() => {
                  onSortChange({
                    column: 'animal_id',
                    sort: option.value === 'recent' ? 'asc' : 'desc'
                  })
                  onClose()
                }}
              >
                {/* Image/Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '8px'
                  }}
                >
                  <img
                    src={option.icon}
                    alt={option.label}
                    style={{
                      width: '24px',
                      height: '24px'

                      // filter: currentSort === option.value
                      //   ? 'brightness(0) invert(1)' // Makes SVG white when selected
                      //   : 'none'
                    }}
                  />
                </Box>

                {/* Text */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVarient
                    }}
                  >
                    {option.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>
    </Modal>
  )
}

export default SortBottomSheet
