import { Box, Stack, Tooltip, Typography } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'

const SpeciesImageCard = ({ imgURl, eggCondition, egg_status, eggCode, defaultName, completeName, eggIcon, tab }) => {
  const theme = useTheme()

  // console.log('egg_status :>> ', egg_status)

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
              ? '#37BD69'
              : egg_status === 'Hatched'
              ? '#37BD69'
              : eggCondition === 'Broken'
              ? '#e93353'
              : eggCondition === 'Rotten'
              ? '#fa6140'
              : eggCondition === 'Cracked'
              ? '#e4b819'
              : egg_status === 'Fresh'
              ? '#006d35'
              : egg_status === 'Fertile'
              ? '#1F515B'
              : egg_status === 'Discard'
              ? '#E93353'
              : '#006D35',
          alignItems: 'center',
          borderRadius: '50px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            border: 'solid 1px #C3CEC7',
            width: '35px',
            height: '35px',
            borderRadius: '50%',
            p: 0.3,
            backgroundColor: theme.palette.primary.contrastText
          }}
        >
          {imgURl ? (
            <img
              src={imgURl}
              alt='Default Icon'
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'contain'
              }}
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
        {/* {eggCode && (
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 500,
              lineHeight: '24.2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#000000'
            }}
          >
            {eggCode ? eggCode : '-'}
          </Typography>
        )} */}

        <Tooltip title={defaultName}>
          <Typography
            sx={{
              fontSize: '16px',

              // color: theme.palette.primary.light,
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
              // color: theme.palette.primary.light,
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

        {/* {tab === 'hatched'
          ? null
          : egg_status && (
              <Typography
                sx={{
                  color:
                    egg_status === 'Fresh' || egg_status === 'Fertile'
                      ? theme.palette.primary.dark
                      : egg_status === 'Discard'
                      ? '#fa6140'
                      : egg_status === 'Hatched'
                      ? theme.palette.primary.main
                      : null,
                  fontSize: '14px',
                  fontWeight: '500',
                  px: 3,
                  backgroundColor:
                    egg_status === 'Discard'
                      ? '#FFD3D3'
                      : egg_status === 'Fresh' || egg_status === 'Fertile' || egg_status === 'Hatched'
                      ? '#EFF5F2'
                      : '#EFF5F2',
                  textAlign: 'center',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}
              >
                {egg_status ? egg_status : '-'}
              </Typography>
            )} */}
      </Box>
    </Stack>
  )
}

const TextCard = ({ egg_status }) => {
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
            ? '#ffebe5'
            : egg_status === 'Cracked'
            ? '#fdfad7'
            : egg_status === 'Discard'
            ? '#ffebe5'
            : egg_status === 'Thin-Shelled'
            ? '#E8F4F2'
            : egg_status === 'Fertile'
            ? '#E8F4F2'
            : '#E1F9ED'
      }}
    >
      <Typography
        sx={{
          color:
            egg_status === 'Fresh'
              ? '#006D35'
              : egg_status === 'Rotten'
              ? '#FA6140'
              : egg_status === 'Cracked'
              ? '#E4B819'
              : egg_status === 'Discard'
              ? '#fa6140'
              : egg_status === 'Hatched'
              ? '#32bfdd'
              : egg_status === 'Thin-Shelled'
              ? '#1F515B'
              : '#006D35',
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
