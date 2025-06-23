import React, { useState } from 'react'
import { Card, CardContent, Typography, Grid, Box, Button } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'
import AddAnimalsDrawer from '../drawer/AddAnimalsDrawer'

const ExportCard = ({ exportId, exporter, species, animals }) => {
  const [addAnimalsDrawerOpen, setAddAnimalsDrawerOpen] = useState(false)
  const handleClickAnimals = () => {
    setAddAnimalsDrawerOpen(true)
  }
  return (
    <>
      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
          border: '1px solid #C3CEC7',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: 'none'
        }}
        onClick={handleClickAnimals}
      >
        {/* Left Section */}
        <CardContent sx={{ flex: 1, px: 4, py: 4 }}>
          <Typography variant='subtitle2' color='#7A8684' fontWeight='400'>
            Export ID : <span style={{ color: '#44544A', fontWeight: '500' }}>{exportId}</span>
          </Typography>
          <Typography variant='body2' color='#7A8684' fontWeight='400'>
            Exporter : <span style={{ color: '#44544A', fontWeight: '500' }}>{exporter}</span>
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item>
              <Button
                size='small'
                //variant='outlined'
                //disableElevation
                sx={{
                  backgroundColor: '#EFF5F2',
                  color: '#44544A',
                  textTransform: 'none',
                  borderRadius: '26px',
                  minWidth: '80px',
                  boxShadow: 'none',
                  px: 4,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Species <Typography sx={{ fontWeight: 600, fontSize: '14px', pl: 1 }}>{species}</Typography>
              </Button>
            </Grid>
            <Grid item>
              <Button
                size='small'
                //variant='contained'
                //disableElevation
                sx={{
                  backgroundColor: '#EFF5F2',
                  color: '#44544A',
                  textTransform: 'none',
                  borderRadius: '26px',
                  minWidth: '80px',
                  boxShadow: 'none',
                  px: 4,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Animals <Typography sx={{ fontWeight: 600, fontSize: '14px', pl: 1 }}> {animals}</Typography>
              </Button>
            </Grid>
          </Grid>
        </CardContent>

        {/* Right Section */}
        <Box
          sx={{
            background: '#F2FFF8',
            height: '117px', // Matches the height of the card
            width: '45px',
            display: 'flex',
            alignItems: 'center', // Centers vertically
            justifyContent: 'center' // Centers horizontally
          }}
        >
          <ChevronRight sx={{ color: '#44544A', fontSize: '24px' }} />
        </Box>
      </Card>
      <AddAnimalsDrawer
        open={addAnimalsDrawerOpen}
        onClose={() => setAddAnimalsDrawerOpen(false)}
        title='Add Animals'
      />
    </>
  )
}

export default ExportCard
