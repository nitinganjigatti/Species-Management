import React from 'react'
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material'
import type { AssessmentDefaultValue } from 'src/types/housing/assessment'

interface AssessmentScaleListProps {
  options: AssessmentDefaultValue[]
  selectedId: string
  onChange: (id: string) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
}

const AssessmentScaleList: React.FC<AssessmentScaleListProps> = ({
  options,
  selectedId,
  onChange,
  disabled = false,
  error = false,
  helperText
}) => {
  const sortedOptions = [...options].sort((a, b) => {
    const orderA = a.order ?? 0
    const orderB = b.order ?? 0

    return orderA - orderB
  })

  return (
    <FormControl error={error} fullWidth>
      <RadioGroup
        value={selectedId}
        onChange={e => onChange(e.target.value)}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxHeight: 300,
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: 6
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 3
            }
          }}
        >
          {sortedOptions.map(option => (
            <FormControlLabel
              key={option.id}
              value={option.id}
              disabled={disabled}
              control={
                <Radio
                  sx={{
                    '&.Mui-checked': {
                      color: 'primary.main'
                    }
                  }}
                />
              }
              label={
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: selectedId === option.id ? 600 : 400
                  }}
                >
                  {option.label}
                </Typography>
              }
              sx={{
                m: 0,
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: selectedId === option.id ? 'primary.main' : 'divider',
                backgroundColor: selectedId === option.id ? 'primary.lighter' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: disabled ? 'divider' : 'primary.light',
                  backgroundColor: disabled ? 'transparent' : 'action.hover'
                }
              }}
            />
          ))}
        </Box>
      </RadioGroup>
      {helperText && (
        <Typography
          variant='caption'
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 1 }}
        >
          {helperText}
        </Typography>
      )}
    </FormControl>
  )
}

export default AssessmentScaleList
