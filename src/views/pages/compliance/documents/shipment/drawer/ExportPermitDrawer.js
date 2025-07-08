import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Box, Drawer, IconButton, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import Search from 'src/views/utility/Search'
import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import { CellInfo } from 'src/utility/render'
import ExportCard from '../view-component/AddExportPermitCard'
import AddAnimalsDrawer from './AddAnimalsDrawer'

const ExportPermitDrawer = ({
  open,
  onClose,
  title,
  handleSearch,
  exportsList,
  exportsTotalCount,
  handleScroll,
  scrollContainerRef,
  onExportCardSelect,
  selectedExportData,
  setSelectedExportData,
  setexportPermitDrawerOpen,
  isLoading,
  draftData,
  setDraftData
}) => {
  const theme = useTheme()

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
        <Box sx={{ px: 5, pt: 4, pb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              {/* <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} /> */}
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable content */}
        <Box
          sx={{ px: 5, flex: 1, mt: 2, overflowY: 'auto', height: '600px' }}
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          <Search
            sx={{ width: '100%' }}
            textFielsSX={{
              width: '100%',
              height: 52,
              borderRadius: '8px',
              backgroundColor: theme.palette.common.white
            }}
            placeholder='Search for Export ID'
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
          />

          <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, my: 4 }}>
            Exports {'total' ? `(${exportsTotalCount})` : ''}
          </Typography>

          <Box
            sx={{
              //overflowY: 'auto',
              // Fixed height for scroll container
              padding: 2, // Container padding
              gap: 2, // Gap between items (requires display: 'flex')
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box>
              {exportsList.map((item, index) => (
                <ExportCard
                  key={index}
                  sx={{
                    marginBottom: 2, // Space after each card
                    '&:last-child': { marginBottom: 0 } // Remove margin from last item
                  }}
                  exportId={item.id}
                  exportNumber={item.export_number}
                  exporter={item.exporter_name}
                  species={item.species_count}
                  animals={item.animal_count}
                  exporterCountry={item.exporting_country}
                  onExportCardSelect={onExportCardSelect}
                  shipment_count={item.shipment_count}
                  shipments={item.shipments}
                  selectedExportData={selectedExportData}
                  setSelectedExportData={setSelectedExportData}
                  setDraftData={setDraftData}
                  draftData={draftData}
                  setexportPermitDrawerOpen={setexportPermitDrawerOpen}
                />
              ))}
              {isLoading && (
                <Box sx={{ padding: 2, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {/* {exportsList.length === exportsTotalCount && (
                <Box sx={{ padding: 2, textAlign: 'center' }}>No more items to load</Box>
              )} */}
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(ExportPermitDrawer)
