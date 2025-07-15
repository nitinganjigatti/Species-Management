import React from 'react'
import { Card, CardContent, Typography, Grid, Box, Button, useTheme, Checkbox } from '@mui/material'

const ExportCard = ({
  exportId,
  exportNumber,
  exporter,
  species,
  animals,
  exporterCountry,
  draftData,
  setDraftData,
  exportsList
}) => {
  const theme = useTheme()

  const exportObj = exportsList.find(item => item.id === exportId)
  const isSelected = draftData.export.some(item => item.id === exportId)

  const handleSelect = () => {
    setDraftData(prev => {
      if (isSelected) {
        return {
          ...prev,
          export: prev.export.filter(item => item.id !== exportId)
        }
      } else {
        return {
          ...prev,
          export: [...prev.export, exportObj]
        }
      }
    })
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
      >
        {/* Left Section */}
        <CardContent sx={{ flex: 1, px: 4, py: 4 }}>
          <Typography variant='subtitle2' color='#7A8684' fontWeight='400'>
            Export ID : <span style={{ color: '#44544A', fontWeight: '500' }}>{exportNumber}</span>
          </Typography>
          <Typography variant='body2' color='#7A8684' fontWeight='400'>
            Exporter :{' '}
            <span style={{ color: '#44544A', fontWeight: '500' }}>
              {exporter},{exporterCountry}
            </span>
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item>
              <Button
                size='small'
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
            height: '117px',
            width: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px', // Optional: better visual
            cursor: species !== '0' ? 'pointer' : 'not-allowed'
          }}
          onClick={species !== '0' ? handleSelect : undefined}
        >
          <Checkbox
            checked={isSelected}
            disabled={species === '0'}
            sx={{
              color: '#839D8D',
              '&.Mui-checked': {
                color: '#37BD69'
              }
            }}
          />
        </Box>
      </Card>
    </>
  )
}

export default ExportCard
