import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'

interface EggCardProps {
  imgURl?: string | null
  eggIcon?: string
  defaultName?: string | null
  completeName?: string | null
  eggCode?: string | null
  eggCondition?: string | null
  egg_status?: string | null
  egg_state?: string | null
  batch?: string | null
  date?: string | null
  status?: string | null
  handleEggClick?: () => void
}

const EggCard: React.FC<EggCardProps> = ({
  imgURl,
  eggIcon = '/icons/Egg_icon.png',
  defaultName,
  completeName,
  eggCode,
  eggCondition,
  egg_status,
  egg_state,
  batch,
  date,
  status,
  handleEggClick
}) => {
  const theme = useTheme() as any
  const colors = theme.palette.customColors

  // Normalize ANY incoming value
  const normalizeStatus = (status?: string) => {
    if (!status) return ''

    return status
      .toLowerCase()
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-')
  }

  // Background color
  const getChipBackgroundColor = (status?: string) => {
    const s = normalizeStatus(status)

    switch (s) {
      case 'Broken':
      case 'Rotten':
        return colors.ErrorContainer
      case 'Cracked':
        return colors.Notes
      case 'Thin-Shelled':
        return colors.SecondaryContainer
      case 'Discard':
        return colors.OnTertiaryContainer
      case 'Intact':
        return colors.OnBackground
      default:
        return colors.OnBackground
    }
  }

  // Text color
  const getChipTextColor = (status?: string) => {
    const s = normalizeStatus(status)
    switch (s) {
      case 'Broken':
        return colors.Error
      case 'Cracked':
        return colors.moderateSecondary
      case 'Rotten':
        return colors.Tertiary
      case 'Thin-Shelled':
        return colors.OnPrimaryContainer
      case 'Discard':
        return colors.OnTertiaryContainer
      case 'Intact':
      default:
        return theme.palette.primary.main
    }
  }

  const getEggBgColor = (egg_status?: string | null, eggCondition?: string | null) => {
    if (egg_status === 'Hatched') return theme.palette.primary.main
    if (egg_status === 'Discard') return theme.palette.customColors.OnTertiaryContainer
    if (eggCondition === 'Intact') return theme.palette.customColors.OnSurface

    return getChipTextColor(eggCondition ?? undefined)
  }

  const allocateTextColor = (e: string) => {
    if (e == 'DISCARD_REQUEST_GENERATED') {
      return theme.palette.customColors?.Outline
    } else if (e == 'CANCELED') {
      return theme.palette.customColors?.Error
    } else {
      return theme.palette.customColors?.OnPrimaryContainer
    }
  }

  const allocateText = (e: string) => {
    if (e == 'DISCARD_REQUEST_GENERATED') {
      return 'Security check pending'
    } else if (e == 'CANCELED') {
      return 'Canceled'
    } else {
      return 'Security checked'
    }
  }

  return (
    <Box
      onClick={handleEggClick}
      sx={{
        p: 3,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.04)
        },
        mb: 3,
        display: 'flex',
        gap: 5,
        cursor: 'pointer'
      }}
    >
      {/* LEFT SIDE */}
      <Box display='flex' flexDirection='column' alignItems='center' gap={3}>
        <Box
          sx={{
            display: 'flex',
            width: 66,
            height: 40,
            p: '4px',
            borderRadius: '50px',
            alignItems: 'center',
            backgroundColor: getEggBgColor(egg_status, eggCondition),
            gap: 1
          }}
        >
          {/* AVATAR */}
          <Box
            sx={{
              width: 35,
              height: 35,
              borderRadius: '50%',
              backgroundColor: '#fff',
              border: `1px solid ${colors.OutlineVariant}`
            }}
          >
            {imgURl ? (
              <FallbackAvatar src={imgURl} variant='circular' sx={{ width: '100%', height: '100%' }} />
            ) : (
              <Icon icon='mdi:egg' />
            )}
          </Box>

          {/* EGG ICON */}
          <Box sx={{ width: 19, height: 24 }}>
            {egg_status === 'Hatched' ? (
              <img src={'/icons/Egg_hatched.png'} style={{ width: '100%' }} />
            ) : (
              <img src={eggIcon} style={{ width: '100%' }} />
            )}
          </Box>
        </Box>

        {/* CONDITION CHIP */}
        {egg_status === 'Discard'
          ? null
          : eggCondition && (
              <Box
                sx={{
                  px: 2,
                  py: '4px',
                  borderRadius: '4px',
                  border: `1px solid ${getChipTextColor(eggCondition)}`,
                  backgroundColor: getChipBackgroundColor(eggCondition)
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: getChipTextColor(eggCondition)
                  }}
                >
                  {normalizeStatus(eggCondition).replace('-', ' ')}
                </Typography>
              </Box>
            )}
      </Box>

      {/* RIGHT SIDE */}
      <Box flex={1}>
        <Box display='flex' sx={{ flexDirection: 'column' }}>
          {/* {egg_status === 'Hatched' && (
              <Box>
                {defaultName && (
                  <Typography fontSize={16} fontWeight={600} sx={{ color: theme.palette.customColors.Secondary }}>
                    Create Animal ID
                  </Typography>
                )}
              </Box>
            )} */}
          <Box>
            {defaultName && (
              <Typography fontSize={16} fontWeight={600}>
                {defaultName}
              </Typography>
            )}
          </Box>
        </Box>

        {/* DETAILS */}
        {eggCode && (
          <Typography fontSize={14} fontWeight={500} color={colors.secondaryBg}>
            {eggCode}
          </Typography>
        )}

        {date && (
          <Typography fontSize={14} color={colors.OnSurfaceVariant}>
            {Utility.convertUtcToLocalReadableDate(date)}
          </Typography>
        )}

        {egg_state && (
          <Typography fontSize={14} fontWeight={500} color={colors.secondaryBg}>
            {egg_state}
          </Typography>
        )}

        {batch && (
          <Typography fontSize={14} fontWeight={600}>
            Batch: {batch}
          </Typography>
        )}
      </Box>
      {status && (
        <Typography fontSize={14} color={allocateTextColor(status)}>
          {allocateText(status)}
        </Typography>
      )}
    </Box>
  )
}

export default React.memo(EggCard)
