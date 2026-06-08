'use client'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

export interface FilterChipProps {
  /** Display text inside the pill. */
  label: string
  /** Whether this chip is currently selected. */
  active?: boolean
  /** Click handler. */
  onClick?: () => void
  /** Height in px. Default 30. */
  size?: number
  /**
   * Optional unread-count badge rendered to the right of the label
   * (WhatsApp-style). Hidden when undefined or zero. Caller controls
   * the meaning (e.g., count of chats with unread for Unread tab,
   * count of unread groups for Groups tab). Driven by the caller's
   * Redux-derived value, so it updates live as `conversation_updated`
   * socket events mutate `state.chats[*].chat.unseenMsgs`.
   */
  count?: number
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
 * - **count** (optional) renders a small pill badge to the right of the
 *   label, styled to invert against the chip's current state for legible
 *   contrast. Hidden when 0 / undefined — so existing callers that don't
 *   pass it render exactly as before.
 *
 * Used in chat sidebar tabs (All / Unread / Favourites / Groups) and any
 * other filter-pill UX in the app.
 */
const FilterChip = ({ label, active = false, onClick, size = 30, count }: FilterChipProps) => {
  const showCount = typeof count === 'number' && count > 0
  const renderedLabel = showCount ? (
    <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      {label}
      <Box
        component='span'
        className='filter-chip-count-badge'
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 18,
          height: 18,
          px: 0.75,
          borderRadius: 9999,
          fontSize: '0.6875rem',
          fontWeight: 600,
          lineHeight: 1,
          // Invert against the chip's state for contrast.
          // Active chip (dark teal bg) → light translucent pill.
          // Inactive chip (light bg) → dark teal pill with white text.
          // Inactive-hover (chip bg turns dark teal) → parent toggles us to
          // translucent white via the hover rule below so we stay legible.
          backgroundColor: active ? 'rgba(255,255,255,0.22)' : '#1F515B',
          color: 'common.white',
          transition: theme => theme.transitions.create(['background-color'], { duration: 160 })
        }}
      >
        {count > 99 ? '99+' : count}
      </Box>
    </Box>
  ) : (
    label
  )

  return (
    <Chip
      label={renderedLabel}
      onClick={onClick}
      aria-pressed={active}
      sx={{
        height: size,
        minHeight: size,
        borderRadius: 9999,
        py: 0.5,
        fontWeight: 500,
        fontSize: '0.8125rem',
        border: '1px solid transparent',
        cursor: 'pointer',
        transition: theme =>
          theme.transitions.create(['background-color', 'color', 'border-color'], {
            duration: 160
          }),
        ...(active
          ? {
              // Mirrors MUI contained-primary button: hover darkens to primary.dark
              backgroundColor: '#1F515B',
              color: 'common.white',
              borderColor: 'transparent',
              px: 2,
              '&:hover': { backgroundColor: '#1a3f47' }
            }
          : {
              // Mirrors MUI outlined-primary button: hover applies a primary alpha tint
              backgroundColor: '#FFFFFFBF',
              color: 'text.secondary',
              borderColor: 'transparent',
              px: 1,
              '&:hover': {
                backgroundColor: '#1F515B',
                color: 'common.white',
                // Badge bg matches the chip's dark teal on idle; on hover the chip
                // turns dark teal too, which would camouflage the badge — swap to
                // the active-state translucent white so it stays visible.
                '& .filter-chip-count-badge': {
                  backgroundColor: 'rgba(255,255,255,0.22)'
                }
              }
            })
      }}
    />
  )
}

export default FilterChip
