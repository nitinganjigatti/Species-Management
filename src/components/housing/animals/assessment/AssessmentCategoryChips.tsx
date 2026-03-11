import React from 'react'
import { Box, Chip } from '@mui/material'
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

        return (
          <Chip
            key={category.id}
            label={category.name}
            variant={isSelected ? 'filled' : 'outlined'}
            color={isSelected ? 'primary' : 'default'}
            onClick={() => onCategorySelect(category.id)}
            sx={{
              flexShrink: 0,
              fontWeight: isSelected ? 600 : 400,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: isSelected ? undefined : 'action.hover'
              }
            }}
          />
        )
      })}
    </Box>
  )
}

export default AssessmentCategoryChips
