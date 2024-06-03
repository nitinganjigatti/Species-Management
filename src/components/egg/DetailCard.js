import { Avatar, Button, Card, CardHeader, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import moment from 'moment'
import React from 'react'
import Icon from 'src/@core/components/icon'

const DetailCard = ({ DetailsListData }) => {
  console.log('DetailsListData :>> ', DetailsListData)

  return (
    <Box sx={{ px: 5, py: 3 }}>
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
        {DetailsListData?.list &&
          Object?.entries(DetailsListData?.list)?.map(([key, value]) => (
            <>
              <Box m={2} key={key}>
                <Typography variant='body1'>{key}</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>{value}</Typography>
              </Box>
            </>
          ))}

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
            {DetailsListData?.Avatar?.profile_Pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={DetailsListData?.Avatar?.profile_Pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {DetailsListData?.Avatar?.user_Name ? DetailsListData?.Avatar?.user_Name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {DetailsListData?.Avatar?.create_at
                ? 'Created on' + ' ' + moment(DetailsListData?.Avatar?.create_at).format('DD/MM/YYYY')
                : '-'}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

export default DetailCard
