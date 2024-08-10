import { Box, Stack, Tooltip, Typography } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'

const SpeciesImageCard = ({ imgURl, eggCondition, eggCode, defaultName, completeName, eggIcon, tab }) => {
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
              ? '#37BD69'
              : eggCondition === 'Rotten'
              ? '#FA6140'
              : eggCondition === 'Cracked'
              ? '#E4B819'
              : eggCondition === 'Broken'
              ? '#E93353'
              : eggCondition === 'Thin-Shelled'
              ? '#1F515B'
              : '#006D35',
          alignItems: 'center',
          borderRadius: '50px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: '2px',

            border: 'solid 1px #C3CEC7',
            width: '35px',
            height: '35px',
            borderRadius: '50%'
          }}
        >
          {imgURl ? (
            <img src={imgURl} alt='Default Icon' style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          ) : (
            <Icon icon='mdi:user' />
          )}
        </Box>

        <Box sx={{ width: '19px', height: '24px' }}>
          <img src={eggIcon} alt='' style={{ width: '100%', height: '100%' }} />
        </Box>
      </Box>

      <Box>
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
        <Tooltip title={defaultName}>
          <Typography
            sx={{
              color: theme.palette.primary.light,
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {defaultName ? defaultName : '-'}
          </Typography>
        </Tooltip>
        <Tooltip title={completeName}>
          <Typography
            sx={{
              color: theme.palette.primary.light,
              fontSize: '14px',
              fontWeight: '400',
              lineHeight: '16.94px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              fontStyle: 'italic'
            }}
          >
            {completeName ? completeName : '-'}
          </Typography>
        </Tooltip>
      </Box>
    </Stack>
  )
}

const TextCard = ({ eggCondition }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        borderRadius: '4px',
        px: 3,
        width: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor:
          eggCondition === 'Rotten'
            ? '#FFD3D3'
            : eggCondition === 'Cracked'
            ? '#fdfad7'
            : eggCondition === 'Broken'
            ? '#FFD3D3'
            : eggCondition === 'Thin-Shelled'
            ? '#E8F4F2'
            : '#E1F9ED'
      }}
    >
      <Typography
        sx={{
          color:
            eggCondition === 'Intact'
              ? '#006D35'
              : eggCondition === 'Rotten'
              ? '#FA6140'
              : eggCondition === 'Cracked'
              ? '#E4B819'
              : eggCondition === 'Broken'
              ? '#fa6140'
              : eggCondition === 'Hatched'
              ? '#32bfdd'
              : eggCondition === 'Thin-Shelled'
              ? '#1F515B'
              : null,
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {eggCondition ? eggCondition : '-'}
      </Typography>
    </Box>
  )
}

export { SpeciesImageCard, TextCard }
