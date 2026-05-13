import React from 'react'
import { Box, Skeleton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

// Visual states the cell can be in. Computed by the parent from (animal × type) data — this
// component is purely presentational and doesn't know about animals, types, or backend shapes.
export type AssessmentCellState = 'skeleton' | 'empty' | 'filled'

export interface AssessmentCellProps {
  state: AssessmentCellState

  // Filled-state content. `value` is the main bold value (e.g. "42", "Test Gerald"); the three
  // subtext fields render as muted captions below it.
  value?: string
  recordedDate?: string
  recordedTime?: string
  age?: string

  // Selection highlight — when true, the cell paints solid primary green with white text and
  // overrides the empty/filled border treatment.
  isSelected?: boolean

  // Empty-state label (e.g. translated "Add Entry"). Defaults to "Add Entry" if not provided.
  emptyLabel?: string

  onClick?: () => void
}

/**
 * Single cell in the batch-assessment matrix.
 *
 * Four visual states, picked by the parent via the `state` prop:
 *
 *   skeleton  →  shimmer placeholder while data is in flight
 *   empty     →  dashed border + "+ Add Entry" prompt
 *   filled    →  bold value + recorded date/time/age captions
 *   selected  →  any of the above, overlaid with green-fill highlight (via `isSelected`)
 *
 * The cell forwards `onClick` to the parent — it doesn't open drawers itself.
 */
const AssessmentCell: React.FC<AssessmentCellProps> = ({
  state,
  value,
  recordedDate,
  recordedTime,
  age,
  isSelected = false,
  emptyLabel = 'Add Entry',
  onClick
}) => {
  const theme = useTheme() as any

  // -------- skeleton ----------
  if (state === 'skeleton') {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          p: 2,
          borderRadius: '8px',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.customColors.SurfaceVariant}`
        }}
      >
        <Skeleton variant='text' width='60%' height={20} />
        <Skeleton variant='text' width='50%' height={14} />
        <Skeleton variant='text' width='45%' height={14} />
      </Box>
    )
  }

  const isEmpty = state === 'empty'

  // Border + fill rules — selection wins over empty/filled to make the highlight unambiguous.
  const containerSx = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.25,
    p: 1.5,
    cursor: 'pointer',
    borderRadius: '8px',
    backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.background.paper,
    ...(isSelected
      ? { border: `2px solid ${theme.palette.primary.dark}` }
      : isEmpty
      ? { border: `1.5px dashed ${theme.palette.customColors.OutlineVariant}` }
      : { border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }),
    transition: 'all 0.15s',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.customColors.Surface
    }
  }

  // Caption colour — semi-transparent white over the green highlight, gray otherwise.
  const captionColor = isSelected ? 'rgba(255,255,255,0.8)' : theme.palette.customColors.neutralSecondary

  return (
    <Box onClick={onClick} sx={containerSx}>
      {isEmpty ? (
        <>
          <Icon
            icon='mdi:plus'
            fontSize={28}
            color={isSelected ? theme.palette.common.white : theme.palette.customColors.neutralSecondary}
          />
          <Typography
            variant='body2'
            sx={{
              color: isSelected ? theme.palette.common.white : theme.palette.customColors.neutralSecondary,
              fontWeight: 500
            }}
          >
            {emptyLabel}
          </Typography>
        </>
      ) : (
        <>
          <Typography
            variant='subtitle1'
            sx={{
              fontWeight: 600,
              color: isSelected ? theme.palette.common.white : theme.palette.primary.dark,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}
          >
            {value}
          </Typography>
          {recordedDate && (
            <Typography variant='caption' sx={{ color: captionColor }}>
              {recordedDate}
            </Typography>
          )}
          {recordedTime && (
            <Typography variant='caption' sx={{ color: captionColor }}>
              {recordedTime}
            </Typography>
          )}
          {age && (
            <Typography variant='caption' sx={{ color: captionColor }}>
              {age}
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}

export default AssessmentCell
