'use client'

import React from 'react'
import { Box, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface ClinicalAssessmentListShimmerProps {
  rows?: number
}

export default function ClinicalAssessmentListShimmer({ rows = 8 }: ClinicalAssessmentListShimmerProps) {
  const theme: any = useTheme()

  return (
    <Box
      sx={{
        background: theme.palette.common.white,
        borderRadius: '8px',
        maxHeight: 500,
        overflowY: 'auto',
        px: 1,
        py: 1
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            width: '100%',
            py: 3
          }}
        >
          <Skeleton
            variant="circular"
            width={20}
            height={20}
            animation="wave"
            sx={{ mr: 2, flexShrink: 0 }}
            aria-hidden
          />

          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
            <Skeleton
              variant="rectangular"
              height={24}
              animation="wave"
              sx={{ width: '100%', borderRadius: '4px' }}
              aria-hidden
            />
          </Box>

          <Skeleton
            variant="text"
            width={200}
            height={20}
            animation="wave"
            sx={{ flexShrink: 0 }}
            aria-hidden
          />
        </Box>
      ))}
    </Box>
  )
}
