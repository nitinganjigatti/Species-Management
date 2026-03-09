import React from 'react'
import { Box, Typography, Checkbox, Avatar, IconButton } from '@mui/material'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import type { Site } from 'src/types/housing'

interface SiteCardProps {
  site: Site & { site_image?: string; site_owner?: string }
  isSelected?: boolean
  onAction: (siteId: number) => void
  isDisabled?: boolean
  mode?: 'select' | 'remove'
}

const SiteCard: React.FC<SiteCardProps> = ({
  site,
  isSelected = false,
  onAction,
  isDisabled = false,
  mode = 'select'
}) => {
  const theme = useTheme() as any

  return (
    <Box
      sx={{
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 0.8,
        bgcolor: theme.palette.common.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: isDisabled
            ? theme.palette.divider
            : mode === 'remove'
            ? theme.palette.error.main
            : theme.palette.primary.main
        },
        ...(isSelected &&
          !isDisabled &&
          mode === 'select' && {
            borderColor: theme.palette.success.main,
            bgcolor: '#f8fff8'
          })
      }}
      onClick={() => {
        if (!isDisabled && mode === 'select') onAction(site.site_id)
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={site.site_image}
          alt={site.site_name}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 0.5
          }}
        />
        <Box>
          <Typography variant='subtitle1' sx={{ fontWeight: 500, mb: 0.5 }}>
            {site.site_name}
          </Typography>
          {site.site_owner && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='mdi:account-outline' fontSize={16} color='textSecondary' />
              <Typography variant='body2' color='textSecondary'>
                {site.site_owner}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {mode === 'select' ? (
        <Checkbox
          checked={isSelected}
          disabled={isDisabled}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation()
            if (!isDisabled) onAction(site.site_id)
          }}
          sx={{
            color: '#37BD69',
            '&.Mui-checked': {
              color: '#37BD69'
            }
          }}
        />
      ) : (
        <IconButton
          size='small'
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            if (!isDisabled) onAction(site.site_id)
          }}
          sx={{
            color: theme.palette.error.main,
            border: '1px solid red'
          }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
      )}
    </Box>
  )
}

export default SiteCard
