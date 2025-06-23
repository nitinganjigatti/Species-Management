import React, { useState } from 'react'
import { Box, Typography, TextField, Button, Grid, useMediaQuery, useTheme } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SelectAnimalsDrawer from '../drawer/SelectAnimalsDrawer'

const AnimalCardLayout = () => {
  // Sample data for multiple cards
  const cardsData = [
    {
      id: 1,
      title: 'Red fox',
      subtitle: 'Vulpes vulpes',
      available: '8/10 animals available for shipment',
      shipment: '4/8',
      male: 2,
      female: 2,
      unknown: 0,
      selected: 2
    },
    {
      id: 2,
      title: 'Grey wolf',
      subtitle: 'Canis lupus',
      available: '5/6 animals available for shipment',
      shipment: '3/5',
      male: 1,
      female: 2,
      unknown: 1,
      selected: 3
    },
    {
      id: 3,
      title: 'Arctic hare',
      subtitle: 'Lepus arcticus',
      available: '7/10 animals available for shipment',
      shipment: '6/7',
      male: 3,
      female: 3,
      unknown: 1,
      selected: 6
    },
    {
      id: 4,
      title: 'Arctic hare',
      subtitle: 'Lepus arcticus',
      available: '7/10 animals available for shipment',
      shipment: '6/7',
      male: 3,
      female: 3,
      unknown: 1,
      selected: 6
    },
    {
      id: 5,
      title: 'Arctic hare',
      subtitle: 'Lepus arcticus',
      available: '7/10 animals available for shipment',
      shipment: '6/7',
      male: 3,
      female: 3,
      unknown: 1,
      selected: 6
    },
    {
      id: 6,
      title: 'Arctic hare',
      subtitle: 'Lepus arcticus',
      available: '7/10 animals available for shipment',
      shipment: '6/7',
      male: 3,
      female: 3,
      unknown: 1,
      selected: 6
    }
  ]

  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [selectAnimalsDrawerOpen, setselectAnimalsDrawerOpen] = useState(false)

  const handleSelectAnimalsClick = () => {
    setselectAnimalsDrawerOpen(true)
  }
  return (
    <>
      <Box
        sx={{
          px: 5,
          pt: '16px',
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))'
        }}
      >
        {cardsData.map(card => (
          <Box
            key={card.id}
            sx={{
              border: '1px solid #C3CEC7',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#FFFFFF'
            }}
          >
            {/* Title and Subtitle */}
            <Typography variant='h6' sx={{ fontWeight: '500', color: '#44544A' }}>
              {card.title}
            </Typography>
            <Typography
              //variant='subtitle2'
              sx={{ color: '#44544A', fontStyle: 'italic', fontSize: '400', fontSize: '16px' }}
            >
              {card.subtitle}
            </Typography>
            <Typography
              sx={{ color: '#44544A', marginTop: '8px', marginBottom: '16px', fontSize: '400', fontSize: '16px' }}
            >
              {card.available}
            </Typography>

            {/* Animals Part of Shipment */}
            <Box
              sx={{
                border: '1px solid #0000000D',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#E8F4F266'
              }}
            >
              <Grid container justifyContent='space-between' alignItems='center'>
                <Typography variant='subtitle2' sx={{ fontWeight: '400', color: '#44544A', fontSize: '16px' }}>
                  Animals part of shipment:
                </Typography>
                <Typography variant='subtitle2' sx={{ fontWeight: '500', color: '#1F415B', fontSize: '24px' }}>
                  {card.shipment}
                </Typography>
              </Grid>

              {/* Input Fields */}
              <Grid container spacing={2} sx={{ marginTop: '8px' }}>
                <Grid item xs={4}>
                  <Typography
                    variant='caption'
                    sx={{ display: 'block', color: '#44544A', marginBottom: '4px', fontWeight: 400 }}
                  >
                    Male <span style={{ fontWeight: '500' }}>({card.male})</span>
                  </Typography>
                  <TextField
                    size='small'
                    type='number'
                    value={card.male}
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    variant='caption'
                    sx={{ display: 'block', color: '#44544A', marginBottom: '4px', fontWeight: 400 }}
                  >
                    Female <span style={{ fontWeight: '500' }}>({card.female})</span>
                  </Typography>
                  <TextField
                    size='small'
                    type='number'
                    //value={card.female}
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant='caption' sx={{ display: 'block', color: '#7A8684', marginBottom: '4px' }}>
                    Unknown ({card.unknown})
                  </Typography>
                  <TextField
                    size='small'
                    value={`# Unknown`}
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#EDF2F7'
                      }
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container justifyContent='space-between' alignItems='center' sx={{ marginTop: '26px' }}>
                <Typography
                  sx={{
                    textTransform: 'none',
                    color: '#006D35',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 500,
                    pl: 0,
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                  onClick={handleSelectAnimalsClick}
                >
                  Select from list
                  <ChevronRightIcon sx={{ fontSize: '22px', marginLeft: '4px' }} />
                </Typography>
                <Typography sx={{ color: '#44544A', fontWeight: '500', fontSize: '16px' }}>
                  {card.selected} Selected
                </Typography>
              </Grid>
            </Box>
          </Box>
        ))}
      </Box>
      {/* Sticky footer */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          px: 5,
          py: 4,
          mt: 4,
          backgroundColor: theme.palette.common.white,
          boxShadow: `0px -4px 21px 0px ${
            theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'
          }`,
          zIndex: 1
        }}
      >
        <Button
          fullWidth
          variant='contained'
          //onClick={handleDone}
          //disabled={newlySelectedItems.length === 0}
        >
          Done
        </Button>
      </Box>
      <SelectAnimalsDrawer
        open={selectAnimalsDrawerOpen}
        onClose={() => setselectAnimalsDrawerOpen(false)}
        title='Select Animals'
      />
    </>
  )
}

export default AnimalCardLayout
