import { Avatar, Button, Card, CardHeader, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import moment from 'moment'
import React from 'react'
import Icon from 'src/@core/components/icon'

const DetailCard = ({ detailsData, ButtonName }) => {
  const headerAction = (
    <>
      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
        <Button sx={{ px: 7, py: 5 }} size='small' variant='contained' onClick={() => setIsOpen(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; {ButtonName}
        </Button>
      </Box>
    </>
  )

  return (
    <Card sx={{ px: 5, py: 3 }}>
      <CardHeader title='Rooms Details' action={headerAction} />

      <Stack
        direction='row'
        sx={{
          px: 3,
          py: 3,
          display: 'flex',
          gap: { md: 20, sx: 3, sm: 6 },
          alignItems: 'center',
          flexWrap: 'wrap',
          bgcolor: '#f2fff8',
          m: 4
        }}
      >
        <Box m={2}>
          <Typography variant='body1'>Room</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>{detailsData?.room_name}</Typography>
        </Box>
        <Box m={2}>
          <Typography variant='body1'>Nursery Name</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>{detailsData?.nursery_name}</Typography>
        </Box>
        <Box m={2}>
          <Typography variant='body1'>Site</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>{detailsData?.site_name}</Typography>
        </Box>
        <Box m={2}>
          <Typography>Incubator</Typography>
          <Typography variant='h6'>{detailsData?.no_of_incubators}</Typography>
        </Box>

        <Box m={2}>
          <Typography variant='body1'>Eggs</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>{detailsData?.no_of_eggs}</Typography>
        </Box>
        <Box m={2} sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
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
            {detailsData?.user_profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={detailsData?.user_profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {detailsData?.user_full_name ? detailsData?.user_full_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {detailsData?.created_at
                ? 'Created on' + ' ' + moment(detailsData?.created_at).format('DD/MM/YYYY')
                : '-'}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Card>
  )
}

export default DetailCard
