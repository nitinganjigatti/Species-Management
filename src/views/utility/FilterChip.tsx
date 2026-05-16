'use client'

// ** MUI Imports
import Chip from '@mui/material/Chip'

export interface FilterChipProps {
  /** Display text inside the pill. */
  label: string
  /** Whether this chip is currently selected. */
  active?: boolean
  /** Click handler. */
  onClick?: () => void
  /** Height in px. Default 30. */
  size?: number
}

/**
 * Filter pill (rounded chip with active/inactive states).
 *
 * Visual contract:
 * - **Active** mirrors MUI's contained-primary button — solid `primary.main`
 *   background, white text, hover darkens to `primary.dark`.
 * - **Inactive** mirrors MUI's outlined-primary button — transparent bg,
 *   `text.secondary` text, divider border. Hover applies a faint primary
 *   alpha tint and turns the border + text primary.
 *
 * Used in chat sidebar tabs (All / Unread / Favourites / Groups) and any
 * other filter-pill UX in the app.
 */
const FilterChip = ({ label, active = false, onClick, size = 30 }: FilterChipProps) => {
  return (
    <Chip
      label={label}
      onClick={onClick}
      aria-pressed={active}
      sx={{
        height: size,
        borderRadius: 9999,
        px: 0.5,
        fontWeight: active ? 600 : 500,
        fontSize: '0.8125rem',
        border: '1px solid',
        cursor: 'pointer',
        transition: theme =>
          theme.transitions.create(['background-color', 'color', 'border-color'], {
            duration: theme.transitions.duration.short
          }),
        ...(active
          ? {
              // Mirrors MUI contained-primary button: hover darkens to primary.dark
              backgroundColor: 'primary.main',
              color: 'common.white',
              borderColor: 'primary.main',
              '&:hover': { backgroundColor: 'primary.dark', borderColor: 'primary.dark' }
            }
          : {
              // Mirrors MUI outlined-primary button: hover applies a primary alpha tint
              backgroundColor: 'transparent',
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: theme => `${theme.palette.primary.main}0A`,
                borderColor: 'primary.main',
                color: 'primary.main'
              }
            })
      }}
    />
  )
}

export default FilterChip
