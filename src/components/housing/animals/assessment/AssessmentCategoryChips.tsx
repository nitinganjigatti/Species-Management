import React from 'react'
import { Box, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { AssessmentCategory } from 'src/types/housing/assessment'

interface AssessmentCategoryChipsProps {
  categories: AssessmentCategory[]
  selectedCategory: string
  onCategorySelect: (categoryId: string) => void
}

const AssessmentCategoryChips: React.FC<AssessmentCategoryChipsProps> = ({
  categories,
  selectedCategory,
  onCategorySelect
}) => {
  const theme = useTheme() as any

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        pb: 1,
        '&::-webkit-scrollbar': {
          height: 6
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 3
        }
      }}
    >
      {categories.map(category => {
        const isSelected = selectedCategory === category.id
        const label = category.count !== undefined ? `${category.name} (${category.count})` : category.name

        return (
          <Button
            key={category.id}
            variant={isSelected ? 'contained' : 'outlined'}
            onClick={() => onCategorySelect(category.id)}
            sx={{
              flexShrink: 0,
              fontWeight: 500,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1,
              minHeight: '40px',
              whiteSpace: 'nowrap',
              ...(isSelected
                ? {
                    backgroundColor: theme.palette.customColors?.OnPrimaryContainer,
                    color: theme.palette.customColors?.onPrimary,
                    '&:hover': {
                      backgroundColor: theme.palette.customColors?.OnPrimaryContainer
                    }
                  }
                : {
                    borderColor: theme.palette.customColors?.OutlineVariant || 'divider',
                    color: theme.palette.customColors?.OnPrimaryContainer,
                    backgroundColor: theme.palette.customColors?.displaybgSecondary,
                    '&:hover': {
                      backgroundColor: theme.palette.customColors?.displaybgSecondary,
                      borderColor: theme.palette.customColors?.OutlineVariant || 'divider'
                    }
                  })
            }}
          >
            {label}
          </Button>
        )
      })}
    </Box>
  )
}

export default AssessmentCategoryChips
