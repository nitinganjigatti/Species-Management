import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useTheme, alpha } from '@mui/material/styles'
import type { TypeFilterItem } from 'src/types/housing/assessment'

interface TypeFilterDrawerProps {
  open: boolean
  onClose: () => void
  assessmentTypes: TypeFilterItem[]
  selectedTypeIds: string[]
  onApplyFilter: (selectedIds: string[]) => void
}

const TypeFilterDrawer: React.FC<TypeFilterDrawerProps> = ({
  open,
  onClose,
  assessmentTypes,
  selectedTypeIds,
  onApplyFilter
}) => {
  const theme = useTheme() as any
  const { t } = useTranslation()

  // Local state for selection (before applying)
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([])

  // Initialize local state when drawer opens
  useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedTypeIds)
    }
  }, [open, selectedTypeIds])

  // Toggle individual type selection
  const handleToggle = (typeId: string) => {
    setLocalSelectedIds(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(id => id !== typeId)
      }

      return [...prev, typeId]
    })
  }

  // Select all
  const handleSelectAll = () => {
    setLocalSelectedIds(assessmentTypes.map(t => t.id))
  }

  // Clear all selections
  const handleClearAll = () => {
    setLocalSelectedIds([])
  }

  // Apply filter and close
  const handleApply = () => {
    onApplyFilter(localSelectedIds)
    onClose()
  }

  // Check if all are selected
  const allSelected = localSelectedIds.length === assessmentTypes.length && assessmentTypes.length > 0

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '400px'],
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors?.bodyBg || theme.palette.background.default
        }
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header */}
        <Box
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                fontFamily: 'Inter',
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
              }}
            >
              {t('animals_module.filter_by_type')}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                mt: 0.5
              }}
            >
              {t('animals_module.total_assessment_types')} {assessmentTypes.length}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Select All / Clear All */}
        <Box
          sx={{
            px: 4,
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.primary.main
            }}
          >
            {localSelectedIds.length} selected
          </Typography>
          <Button
            size='small'
            onClick={allSelected ? handleClearAll : handleSelectAll}
            sx={{ textTransform: 'none' }}
          >
            {allSelected ? t('clear_all') : t('select_all')}
          </Button>
        </Box>

        {/* Type List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            py: 2,
            bgcolor: theme.palette.customColors?.bodyBg || theme.palette.background.default,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            '-ms-overflow-style': 'none'
          }}
        >
          {assessmentTypes.map(type => {
            const isChecked = localSelectedIds.includes(type.id)

            return (
              <Box
                key={type.id}
                onClick={() => handleToggle(type.id)}
                sx={{
                  p: 3,
                  mb: 2,
                  borderRadius: '8px',
                  backgroundColor: isChecked
                    ? alpha(theme.palette.primary.main, 0.08)
                    : theme.palette.background.paper,
                  border: `1px solid ${
                    isChecked
                      ? theme.palette.primary.main
                      : theme.palette.customColors?.OutlineVariant || theme.palette.divider
                  }`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isChecked
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.primary.main, 0.02)
                  }
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isChecked}
                      onChange={() => handleToggle(type.id)}
                      onClick={e => e.stopPropagation()}
                      sx={{
                        color: theme.palette.primary.main,
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
                        }
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: theme.palette.text.primary
                      }}
                    >
                      {type.name}
                    </Typography>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Box>
            )
          })}

          {assessmentTypes.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
                flexDirection: 'column'
              }}
            >
              <Typography sx={{ color: theme.palette.text.secondary }}>
                {t('animals_module.no_assessment_types')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer Buttons */}
        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            gap: 2
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            onClick={() => {
              handleClearAll()
              onApplyFilter([])
              onClose()
            }}
            sx={{ p: 3 }}
          >
            {t('clear_all')}
          </Button>
          <Button
            variant='contained'
            fullWidth
            onClick={handleApply}
            sx={{ p: 3 }}
          >
            {t('apply_filter')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default TypeFilterDrawer
