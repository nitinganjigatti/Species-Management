import React, { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Grid, Box, Button } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'
import AddAnimalsDrawer from '../drawer/AddAnimalsDrawer'
import { getExportAnimalList } from 'src/lib/api/compliance/shipment'

const ExportCard = ({
  exportId,
  exportNumber,
  exporter,
  species,
  animals,
  exporterCountry,
  onExportCardSelect,
  shipment_count,
  shipments,
  selectedExportData,
  setSelectedExportData,
  setexportPermitDrawerOpen,
  draftData,
  setDraftData
}) => {
  const [addAnimalsDrawerOpen, setAddAnimalsDrawerOpen] = useState(false)
  const [exportID, setexportID] = useState('')
  const [exportAnimalData, setexportAnimalData] = useState([])
  const [loading, setLoading] = useState(false)
  const handleClickAnimals = val => {
    setAddAnimalsDrawerOpen(true)
    setexportID(val)
    setDraftData(JSON.parse(JSON.stringify(selectedExportData)))
  }

  const fetchExportAnimalData = async () => {
    try {
      setLoading(true)
      if (exportID) {
        const response = await getExportAnimalList(exportID)
        console.log(response, 'response')
        setLoading(false)
        setexportAnimalData(response.data)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching species data:', error)
    }
  }

  useEffect(() => {
    if (addAnimalsDrawerOpen) {
      fetchExportAnimalData()
    }
  }, [addAnimalsDrawerOpen])

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
        onClick={() => handleClickAnimals(exportId)}
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
            justifyContent: 'center'
          }}
        >
          <ChevronRight sx={{ color: '#44544A', fontSize: '24px' }} />
        </Box>
      </Card>
      <AddAnimalsDrawer
        open={addAnimalsDrawerOpen}
        onClose={() => setAddAnimalsDrawerOpen(false)}
        title='Add Animals'
        exportAnimalData={exportAnimalData}
        exportID={exportID}
        onExportCardSelect={onExportCardSelect}
        selectedExportData={selectedExportData}
        setSelectedExportData={setSelectedExportData}
        exportNumber={exportNumber}
        loading={loading}
        shipment_count={shipment_count}
        shipments={shipments}
        setDraftData={setDraftData}
        draftData={draftData}
        setexportPermitDrawerOpen={setexportPermitDrawerOpen}
      />
    </>
  )
}

export default ExportCard
