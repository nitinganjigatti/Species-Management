import { Icon } from '@iconify/react'
import { Avatar, Box, Card, Stack, Typography } from '@mui/material'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import type { ShowLabCardProps } from 'src/types/lab'

const ShowLabCard = ({ data }: ShowLabCardProps) => {
  const router = useRouter()
  const theme = useTheme()

  return (
    <>
      <Card sx={{ px: 5, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 'bold', ml: 2 }}>{data?.lab_name}</Typography>
          </Box>
          <Box sx={{ maxWidth: 130, height: 100 }}>
            <Avatar
              sx={{
                '& > img': {
                  objectFit: 'contain'
                },
                width: '100%',
                height: '100%'
              }}
              variant='square'
              src={data?.image === null ? '/images/Lab1.png' : data?.image ?? undefined}
            />
          </Box>
        </Box>
        <hr
          style={{
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            width: '100%',
            margin: '10px 0'
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
