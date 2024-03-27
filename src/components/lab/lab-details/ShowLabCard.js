import { Icon } from '@iconify/react'
import { Avatar, Box, Card, Stack, Typography } from '@mui/material'
import React from 'react'

const ShowLabCard = ({ data }) => {
  console.log('data?.image', data?.image)

  return (
    <>
      <Card sx={{ px: 5, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <Typography sx={{ fontWeight: 'bold', pb: 4 }}>{data?.lab_name}</Typography>
          <Box sx={{ maxWidth: 130, height: 100 }}>
            {/* <img
              src={}
              alt=''
              style={{ width: '100%', borderRadius: '15px', height: '100%' }}
            /> */}
            <Avatar
              sx={{
                '& > img': {
                  objectFit: 'contain'
                },
                width: '100%',
                height: '100%'
              }}
              variant='square'
              src={data?.image === 'https://app.antzsystems.com/uploads/' ? '/images/med-lab.png' : data?.image}
            />
          </Box>
        </Box>
        <hr
          style={{
            borderTop: '1px solid rgba(0, 0, 0, 0.1)', // Faded line color
            width: '100%',
            margin: '10px 0' // Adjust the margin as needed
          }}
        />
        <Box>
          <Stack direction='row' spacing={4} sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <Icon icon='mdi:location' fontSize={25} />
            <Typography sx={{ textTransform: 'uppercase' }}>{data?.address}</Typography>
          </Stack>
          <Stack direction='row' spacing={4} sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <Icon icon='ic:twotone-my-location' fontSize={25} />
            <Box>
              <Typography sx={{ textTransform: 'uppercase', display: 'flex', flexDirection: 'column' }}>
                {data?.latitudes}
              </Typography>
              <Typography sx={{ textTransform: 'uppercase', display: 'flex', flexDirection: 'column' }}>
                {data?.longitudes}
              </Typography>
            </Box>
          </Stack>
          <Stack direction='row' spacing={4} sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <Icon icon='mdi:contact' fontSize={25} />
            <Box>
              <Typography sx={{ textTransform: 'uppercase', display: 'flex', flexDirection: 'column' }}>
                {data?.incharge_name}
              </Typography>
              <Typography sx={{ textTransform: 'uppercase', display: 'flex', flexDirection: 'column' }}>
                {data?.lab_contact_number}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card>
    </>
  )
}

export default ShowLabCard
