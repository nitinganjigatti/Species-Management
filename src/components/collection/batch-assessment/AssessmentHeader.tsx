import React from 'react'
import { Box, Skeleton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import AnimalCardRaw from 'src/views/utility/AnimalCard'

// AnimalCard is a JS file with no TS types — cast to any so we can pass the data slice cleanly.
const AnimalCard: any = AnimalCardRaw

/**
 * Minimum animal fields the row variant reads. Loose `[key: string]: unknown` mirrors the
 * unstable backend shape we treat defensively everywhere else.
 */
export interface AnimalHeaderData {
  animal_id?: number | string
  default_icon?: string
  sex?: string
  gender?: string
  type?: string
  total_animal?: number | string
  age?: string
  birth_date?: string
  user_enclosure_name?: string
  enclosure_name?: string
  site_name?: string
  [key: string]: unknown
}

/**
 * Single header component for the batch-assessment matrix — handles both axes.
 *
 *   kind='column'  →  light pill with the parameter name (e.g. "Weight")
 *   kind='row'     →  AnimalCard for the animal in the left fixed column
 *
 * Each variant has a `isLoading` skeleton state shaped to the loaded content so the grid layout
 * stays stable during refetch instead of flashing to a spinner.
 *
 * One component because the call sites are symmetric in SplitPaneGrid — keeps everything
 * batch-assessment-header-related in one file.
 */
export type AssessmentHeaderProps =
  | { kind: 'column'; isLoading?: boolean; name: string }
  | { kind: 'row'; isLoading?: boolean; animal?: AnimalHeaderData }

// Compute "1y 2m 3d" between two ISO-ish dates. Returns empty string when either side is
// missing or the backend's sentinel "0000-00-00 ..." (used when birth_date is unknown).
const computeAge = (birthDate?: string | null, asOf?: string | null): string => {
  if (!birthDate || !asOf) return ''
  if (birthDate.startsWith('0000-')) return ''
  const b = dayjs(birthDate)
  const a = dayjs(asOf)
  if (!b.isValid() || !a.isValid() || a.isBefore(b)) return ''
  const years = a.diff(b, 'year')
  const afterYears = b.add(years, 'year')
  const months = a.diff(afterYears, 'month')
  const afterMonths = afterYears.add(months, 'month')
  const days = a.diff(afterMonths, 'day')

  return `${years}y ${months}m ${days}d`
}

const AssessmentHeader: React.FC<AssessmentHeaderProps> = props => {
  const theme = useTheme() as any

  // ===================== Column variant =====================
  if (props.kind === 'column') {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          backgroundColor: theme.palette.customColors.lightBg,
          borderRadius: '8px'
        }}
      >
        {props.isLoading ? (
          <Skeleton variant='text' width='55%' height={20} />
        ) : (
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {props.name}
          </Typography>
        )}
      </Box>
    )
  }

  // ===================== Row variant =====================
  const { isLoading, animal } = props

  if (isLoading || !animal) {
    return (
      <Box
        sx={{
          height: '100%',
          p: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          borderRadius: '8px',
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Skeleton variant='circular' width={40} height={40} />
          <Skeleton variant='rounded' width={28} height={20} />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Skeleton variant='text' width='65%' height={20} />
          <Skeleton variant='text' width='55%' height={16} />
          <Skeleton variant='text' width='45%' height={16} />
          <Skeleton variant='text' width='60%' height={16} />
        </Box>
      </Box>
    )
  }

  // Backend doesn't ship a precomputed age — derive from birth_date.
  const computedAge = animal.age || computeAge(animal.birth_date, dayjs().toISOString())

  // Force `type: 'group'` when total_animal > 1 so the Count badge shows even if the API
  // returns `type: 'single'` for grouped rows.
  const isGrouped = Number(animal.total_animal) > 1

  return (
    <Box sx={{ height: '100%', p: 2, borderRadius: '8px', backgroundColor: theme.palette.background.paper }}>
      <AnimalCard
        data={{
          default_icon: animal.default_icon,
          animal_id: animal.animal_id,
          sex: animal.sex || animal.gender,
          type: isGrouped ? 'group' : animal.type,
          total_animal: animal.total_animal,
          age: computedAge,
          user_enclosure_name: animal.user_enclosure_name || animal.enclosure_name,
          site_name: animal.site_name
        }}
      />
    </Box>
  )
}

export default AssessmentHeader
