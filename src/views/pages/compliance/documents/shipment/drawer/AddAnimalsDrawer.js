import React from 'react'
import { Typography, Box, Drawer, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import AnimalCardLayout from '../shipment-view/AddAnimalCard'

const AddAnimalsDrawer = ({
  open,
  onClose,
  title,
  exportAnimalData,
  onExportCardSelect,
  loading,
  selectedExportData,
  setSelectedExportData,
  exportNumber,
  exportID,
  shipment_count,
  shipments,
  setexportPermitDrawerOpen,
  setDraftData,
  draftData,
  setSearchValue
}) => {
  const theme = useTheme()

  const handleCancel = () => {
    // Discard draft without saving
    setDraftData({ export: [], others: [] })
    onClose()
  }

  return (
    <Drawer
      open={open}
      //onClose={onClose}
      anchor='right'
    >
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2, background: '#fff' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              {/* <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} /> */}
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={handleCancel}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {!loading ? (
          <Box sx={{ backgroundColor: '#fff', px: 5, pb: 6, pt: 2 }}>
            <Box
              sx={{
                backgroundColor: '#1F515B0D',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '16px',
                width: '100%'
              }}
            >
              {/* Export ID */}
              <Typography
                sx={{
                  fontWeight: '500',
                  color: '#1F415B',
                  marginBottom: '3px',
                  fontSize: '16px'
                }}
              >
                Export ID : {exportAnimalData.export_number}
                {/* {data.exportId} */}
              </Typography>

              {/* Animals Available */}
              <Typography
                sx={{
                  color: '#44544A', // Golden-yellow color for emphasis
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {/* {data.animalsAvailable} */}
                <span style={{ fontSize: '18px' }}>
                  {exportAnimalData.total_animals_to_ship}/{exportAnimalData.total_animals}{' '}
                </span>
                Animals available for shipment
              </Typography>
            </Box>
          </Box>
        ) : (
          ''
        )}

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto' }}>
          <AnimalCardLayout
            exportAnimalData={exportAnimalData}
            onSelect={onExportCardSelect}
            loading={loading}
            selectedExportData={selectedExportData}
            setSelectedExportData={setSelectedExportData}
            exportNumber={exportNumber}
            exportID={exportID}
            onClose={onClose}
            draftData={draftData}
            setDraftData={setDraftData}
            shipment_count={shipment_count}
            shipments={shipments}
            setexportPermitDrawerOpen={setexportPermitDrawerOpen}
            setSearchValue={setSearchValue}
          />
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddAnimalsDrawer)
