import React from 'react'
import { Typography, Grid, Box, Paper, Chip } from '@mui/material'

const ShipmentCard = ({ shipment }) => {
  return (
    <Box mb={6}>
      {/* Shipment ID */}
      <Typography sx={{ fontSize: '18px', color: '#44544A', fontWeight: 500, mb: 3 }}>
        Shipment ID :{' '}
        <Box component='span' sx={{ fontSize: '18px', fontWeight: 500, color: '#006D35' }}>
          {shipment.id}
        </Box>
      </Typography>

      {/* Shipment Details Card */}
      <Paper
        elevation={1}
        sx={{
          mt: 1,
          borderRadius: '8px',
          backgroundColor: '#fff',
          px: 4,
          py: 3,
          border: '1px solid #C3CEC7',
          boxShadow: 'none'
        }}
      >
        <Grid container spacing={2}>
          {/* Left Column */}
          <Grid item xs={7}>
            <Box mb={4}>
              <Typography sx={{ fontSize: '16px', color: '#7A8684', fontWeight: 400 }}>Shipment Date</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                {shipment.shipment_date}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '16px', color: '#7A8684', fontWeight: 400 }}>Total Species</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                {shipment.species_count}
              </Typography>
            </Box>
          </Grid>

          {/* Right Column aligned with "Total Species" */}
          <Grid item xs={5} display='flex' flexDirection='column' justifyContent='flex-end'>
            <Box mt='28px'>
              {' '}
              <Typography sx={{ fontSize: '14px', color: '#7A7A7A', fontWeight: 400 }}>
                Animals Part of Shipment
              </Typography>
              <Box display='flex' gap={1} mt={0.5}>
                <Chip
                  label={`M - ${shipment.male_count}`}
                  size='small'
                  sx={{
                    background: '#AFEFEB80',
                    borderRadius: '4px',
                    px: 2,
                    color: '#00AFD6',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                />
                <Chip
                  label={`F - ${shipment.female_count}`}
                  size='small'
                  sx={{
                    background: '#FA614026',
                    borderRadius: '4px',
                    px: 2,
                    color: '#FA6140',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                />
                <Chip
                  label={`U - ${shipment.undeterminate_count}`}
                  size='small'
                  sx={{
                    background: '#DDEBE9',
                    borderRadius: '4px',
                    px: 2,
                    color: '#1F515B',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default ShipmentCard
