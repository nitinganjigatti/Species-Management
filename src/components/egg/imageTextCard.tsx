'use client'

import { FC } from 'react'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'

interface SpeciesImageCardProps {
  imgURl?: string
  eggCondition?: string
  egg_status?: string
  eggCode?: string
  defaultName?: string
  completeName?: string
  eggIcon?: string
  tab?: string
}

const SpeciesImageCard: FC<SpeciesImageCardProps> = ({
  imgURl,
  eggCondition = '',
  egg_status = '',
  eggCode = '',
  defaultName = '',
  completeName = '',
  eggIcon = '',
  tab = ''
}) => {
  const theme = useTheme()

  return (
    <Stack direction='row' spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '66px',
          height: '40px',
          p: '4px',
          bgcolor:
            tab === 'hatched'
              ? theme.palette.primary.main
              : egg_status === 'Hatched'
              ? theme.palette.primary.main
              : eggCondition === 'Broken'
              ? theme.palette.customColors.Error
              : eggCondition === 'Rotten'
              ? theme.palette.customColors.Tertiary
              : eggCondition === 'Cracked'
              ? theme.palette.customColors.moderateSecondary
              : eggCondition === 'Thin-Shelled'
              ? theme.palette.primary.light
              : egg_status === 'Fresh'
              ? theme.palette.primary.dark
              : egg_status === 'Fertile'
              ? theme.palette.primary.light
              : egg_status === 'Discard'
              ? theme.palette.customColors.Error
              : theme.palette.primary.dark,
          alignItems: 'center',
          borderRadius: '50px'
        }}
      >
        <Box
          sx={{
            border: `solid 1px ${theme.palette.customColors.OutlineVariant}`,
            width: '35px',
            height: '35px',
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.contrastText
          }}
        >
          {imgURl ? (
            <FallbackAvatar
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: imgURl.includes('class_images') && imgURl.endsWith('.svg') ? '' : '50%',
                padding: imgURl.includes('class_images') && imgURl.endsWith('.svg') ? '2px' : '0px',
                objectFit: imgURl.includes('class_images') && imgURl.endsWith('.svg') ? 'fill' : 'cover'
              }}
              variant='circular'
              src={imgURl}
              alt='Default'
            />
          ) : (
            <Icon icon='mdi:user' />
          )}
        </Box>

        <Box sx={{ width: '19px', height: '24px' }}>
          <img src={eggIcon} alt='' style={{ width: '100%', height: '100%' }} />
        </Box>
      </Box>
      <Box>
        <Tooltip title={defaultName}>
          <Typography
            sx={{
              fontSize: '16px',
              color: theme.palette.customColors.OnSurfaceVariant,
              width: 150,
              fontWeight: '500',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {defaultName ? defaultName : 'Unknown'}
          </Typography>
        </Tooltip>

        <Tooltip title={completeName}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              width: 150,
              fontSize: '14px',
              fontWeight: '400',
              lineHeight: '16.94px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontStyle: 'italic'
            }}
          >
            {completeName ? completeName : 'Unknown'}
          </Typography>
        </Tooltip>
      </Box>
    </Stack>
  )
}

interface TextCardProps {
  egg_status?: string
}

const TextCard: FC<TextCardProps> = ({ egg_status = '' }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        borderRadius: '4px',
        px: 3,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          egg_status === 'Rotten'
            ? theme.palette.customColors.BgTeritary
            : egg_status === 'Cracked'
            ? theme.palette.customColors.antzNotes40
            : egg_status === 'Discard'
            ? theme.palette.customColors.BgTeritary
            : egg_status === 'Thin-Shelled'
            ? theme.palette.customColors.displaybgPrimary
            : egg_status === 'Fertile'
            ? theme.palette.customColors.displaybgPrimary
            : theme.palette.customColors.OnBackground
      }}
    >
      <Typography
        sx={{
          color:
            egg_status === 'Fresh'
              ? theme.palette.primary.dark
              : egg_status === 'Rotten'
              ? theme.palette.customColors.Tertiary
              : egg_status === 'Cracked'
              ? theme.palette.customColors.moderateSecondary
              : egg_status === 'Discard'
              ? theme.palette.customColors.Tertiary
              : egg_status === 'Hatched'
              ? theme.palette.customColors.antzInfo60
              : egg_status === 'Thin-Shelled'
              ? theme.palette.primary.light
              : theme.palette.primary.dark,
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {egg_status ? egg_status : '-'}
      </Typography>
    </Box>
  )
}

export { SpeciesImageCard, TextCard }
