import { Icon } from '@iconify/react'
import { Avatar, Box, Button, Typography, Stack } from '@mui/material'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'

const DiscardStatusCell = ({
  params,
  setIsOpen,
  handleDiscard,
  setEggId,
  hideField,
  customButton,
  handleAction

  //  hover, setHover
}) => {
  const theme = useTheme()

  const [hover, setHover] = useState(false)
  console.log('hover :>> ', hover)

  // const handleDiscard = e => {
  //   e.stopPropagation()
  //   setIsOpen(true)
  //   console.log('discard :>> ')
  // }
  // if (params?.row?.egg_id) {
  //   console.log('egg_id :>> ', params?.row?.egg_id)
  //   setEggId(params?.row?.egg_id)
  // }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
    >
      {/* {hover ? ( */}
      <Stack direction='row' className={customButton} spacing={2} sx={{}}>
        <Button
          variant='outlined'
          size='small'
          sx={{ px: 6, py: 2 }}
          onClick={e => handleDiscard(e, params?.row?.egg_id)}
        >
          Discard
        </Button>
        <Button variant='contained' onClick={e => handleAction(e, params?.row?.egg_id)}>
          Allocate{' '}
        </Button>
      </Stack>
      {/* ) : ( */}
      <Box className={hideField} sx={{ display: 'flex', alignItems: 'center' }}>
        <Stack direction='row'>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.user_profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.user_profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '16.94px'
              }}
            >
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '14.52px'
              }}
            >
              {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Stack>
      </Box>
      {/* )} */}
    </div>
  )
}

export default DiscardStatusCell
