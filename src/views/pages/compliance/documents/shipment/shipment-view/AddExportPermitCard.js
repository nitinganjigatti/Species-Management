import React, { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Grid, Box, Button } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'
import AddAnimalsDrawer from '../drawer/AddAnimalsDrawer'
import { useTheme } from '@mui/material/styles'
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
  setDraftData,
  setSearchValue,
  shipmentId
}) => {
  const theme = useTheme()
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
        const response = await getExportAnimalList(exportID, shipmentId)
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
          alignItems: 'stretch',
          justifyContent: 'space-between',
          mb: 4,
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          borderRadius: '8px',
          backgroundColor: theme.palette.common.white,
          boxShadow: 'none',
          minHeight: '120px',
          cursor: 'pointer'
        }}
        onClick={() => handleClickAnimals(exportId)}
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleClickAnimals(exportId)
          }
        }}
        tabIndex={0}
        role='button'
      >
        <CardContent sx={{ flex: 1, px: 4, py: 4 }}>
          <Typography
            variant='subtitle2'
            color={theme.palette.customColors.secondaryBg}
            fontWeight='400'
            sx={{ mb: 1 }}
          >
            Export ID :{' '}
            <span style={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: '500' }}>
              {exportNumber}
            </span>
          </Typography>
          <Typography variant='body2' color={theme.palette.customColors.secondaryBg} fontWeight='400' sx={{ mb: 3 }}>
            Exporter :{' '}
            <span style={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: '500' }}>
              {exporter},{exporterCountry}
            </span>
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid>
              <Button
                size='small'
                sx={{
                  backgroundColor: theme.palette.customColors.lightBg,
                  color: theme.palette.customColors.OnSurfaceVariant,
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
            <Grid>
              <Button
                size='small'
                sx={{
                  backgroundColor: theme.palette.customColors.lightBg,
                  color: theme.palette.customColors.OnSurfaceVariant,
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

        <Box
          sx={{
            background: theme.palette.customColors.Surface,
            //height: '117px',
            width: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <ChevronRight sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px' }} />
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
        setSearchValue={setSearchValue}
      />
    </>
  )
}

export default ExportCard
