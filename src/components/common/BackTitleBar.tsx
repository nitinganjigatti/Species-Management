import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

export interface BackTitleBarProps {
  /** Title text — typically a translated string. */
  title: React.ReactNode

  /**
   * Back-button click handler. If omitted, the back button is hidden — use this when the bar
   * is on a top-level page that has no "back" target.
   */
  onBack?: () => void

  /** Right-side content — buttons, badges, filters, etc. Optional. */
  actions?: React.ReactNode

  /**
   * When true, the bar pins to the top of the viewport during page scroll. Combine with
   * `stickyTopOffset` to clear any fixed content above (AppBar, etc.).
   */
  sticky?: boolean

  /** Top offset (px or CSS value) applied when `sticky` is true. Defaults to 64 — MUI AppBar height. */
  stickyTopOffset?: number | string

  /** Optional sx overrides for the outer wrapper. */
  sx?: object
}

/**
 * Shared page-title bar: back button + title on the left, optional actions on the right.
 *
 * Many pages in the app roll their own version of this (housing, compliance, hospital, …).
 * This component standardises the visual + behaviour and adds optional `sticky` support so
 * the bar stays visible while the page content scrolls under it.
 *
 * Usage:
 *   <BackTitleBar
 *     title={t('species_module.species_assessment_header')}
 *     onBack={() => router.back()}
 *     actions={<>...filter + Parameter button...</>}
 *     sticky
 *   />
 */
const BackTitleBar: React.FC<BackTitleBarProps> = ({
  title,
  onBack,
  actions,
  sticky = false,
  stickyTopOffset = 64,
  sx
}) => {
  const theme = useTheme() as any

  const stickySx = sticky
    ? {
        position: 'sticky' as const,
        top: stickyTopOffset,
        zIndex: 10,
        // Solid background so the body scrolling underneath doesn't bleed through.
        backgroundColor: theme.palette.background.default
      }
    : undefined

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        mb: 3,
        gap: 2,
        ...(stickySx ?? {}),
        ...(sx ?? {})
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{ color: theme.palette.customColors.OnSurfaceVariant, flexShrink: 0 }}
            aria-label='Back'
          >
            <Icon icon='mdi:arrow-left' />
          </IconButton>
        )}
        <Typography
          variant='h5'
          sx={{
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </Typography>
      </Box>
      {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{actions}</Box>}
    </Box>
  )
}

export default BackTitleBar
