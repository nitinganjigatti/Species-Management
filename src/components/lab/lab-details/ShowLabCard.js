import { Icon } from '@iconify/react'
import { Avatar, Box, Card, IconButton, Stack, Typography } from '@mui/material'
import React from 'react'
import { useRouter } from 'next/navigation'

const ShowLabCard = ({ data }) => {
  const router = useRouter()

  console.log('data?.image', data)

  // console.log('process.env.NEXT_PUBLIC_BASE_URL', process.env.NEXT_PUBLIC_BASE_URL + 'uploads/')

  return (
    <>
      <Card sx={{ px: 5, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IconButton
              sx={{ mr: 1, alignItems: 'flex-start' }}
              onClick={() =>
                router.push({
                  pathname: '/lab/lab-list'
                })
              }
            >
              <Icon icon='ep:back' fontSize={25} />
            </IconButton>
            <Typography sx={{ fontWeight: 'bold', ml: 2 }}>{data?.lab_name}</Typography>
          </Box>
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
              src={data?.image === process.env.NEXT_PUBLIC_BASE_URL + 'uploads/' ? '/images/med-lab.png' : data?.image}
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
