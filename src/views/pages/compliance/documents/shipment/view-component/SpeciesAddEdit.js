import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Divider,
  Stack,
  Button,
  alpha,
  useMediaQuery,
  Alert
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExportPermitDrawer from '../drawer/ExportPermitDrawer'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import LinkedShipmentsDrawer from '../drawer/LinkedShipmentsDrawer'
import FileUpload from 'src/views/forms/form-elements/file-uploader/ComplianceFileUploader'
import SelectSpeciesDrawer from '../drawer/SelectSpeciesDrawer'

const speciesData = [
  {
    name: 'Red fox',
    scientificName: 'Vulpes vulpes',
    count: 4,
    male: 2,
    female: 2,
    unknown: 0
  },
  {
    name: 'Cheetah',
    scientificName: 'Acinonyx jubatus',
    count: 2,
    male: 2,
    female: 0,
    unknown: 0
  },
  {
    name: 'Giant Panda',
    scientificName: 'Ailuropoda melanoleuca',
    count: 2,
    male: 0,
    female: 0,
    unknown: 2
  }
]

const SpeciesAddEdit = ({
  handleLinkedshipmentClick,
  speciesDrawerOpen,
  linkedShipmentsDrawerOpen,
  setLinkedShipmentsDrawerOpen,
  setSpeciesDrawerOpen,
  setexportPermitDrawerOpen,
  exportPermitDrawerOpen,
  searchValue,
  onExportCardSelect,
  exportsTotalCount,
  scrollContainerRef,
  selectedExportData,
  setSelectedExportData,
  handleRemoveExportDataAtIndex,
  handleScroll,
  isLoading,
  exportsList,
  handleSearch,
  onSave,
  onCancel,
  draftData,
  setDraftData
}) => {
  const theme = useTheme()
  const router = useRouter()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [uploadedFile, setUploadedFile] = useState(null)

  // const handleFileUpload = (exportId, file) => {
  //   setSelectedExportData(prev => {
  //     const updated = JSON.parse(JSON.stringify(prev))
  //     console.log(updated, 'updated')
  //     console.log(exportId, 'exportId')
  //     // Find the export item
  //     const exportIndex = updated.export.findIndex(e => e.export_id === String(exportId))
  //     console.log(exportIndex, 'exportIndex')
  //     if (exportIndex === -1) {
  //       // This shouldn't happen as you're mapping existing exports
  //       console.error('Export not found')
  //       return prev
  //     }

  //     // Update the attachment for existing export
  //     updated.export[exportIndex].attachment = file
  //     return updated
  //   })
  // }

  // 2. Modified handleFileUpload with debugging
  const handleFileUpload = (exportId, file) => {
    setSelectedExportData(prev => {
      // Create a true deep copy
      const updated = {
        ...prev,
        export: prev.export.map(exporta => ({ ...exporta }))
      }

      const exportIndex = updated.export.findIndex(e => String(e.export_id) === String(exportId))

      if (exportIndex === -1) {
        console.error('Export not found:', exportId)
        return prev
      }

      // Update only the specific export
      updated.export[exportIndex] = {
        ...updated.export[exportIndex],
        attachment: file
      }

      console.log('Updated state:', updated)
      return updated
    })
  }

  const speciesIds = selectedExportData.export?.flatMap(
    exportItem => exportItem.species?.map(species => species.species_id) || []
  )
  const totalUniqueSpecies = new Set(speciesIds).size

  return (
    <Box component='form' sx={{ pt: 0 }}>
      <Box sx={{ mt: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Typography
            sx={{
              fontSize: '18px',
              color: '#44544A',
              fontWeight: 500
            }}
          >
            {console.log(totalUniqueSpecies, 'totalUniqueSpecies')}
            Species count: <strong>{totalUniqueSpecies > 0 ? totalUniqueSpecies : '0'}</strong>
          </Typography>
          <Typography
            sx={{
              fontSize: '18px',
              color: '#44544A',
              fontWeight: 500
            }}
          >
            Animal count: <strong>{2}</strong>
          </Typography>
        </Box>

        {selectedExportData?.export?.length > 0 ? (
          selectedExportData?.export?.map((all, index) => {
            const totalAnimals =
              all.species?.reduce(
                (sum, species) =>
                  sum +
                  Number(species.male_count || 0) +
                  Number(species.female_count || 0) +
                  Number(species.undeterminate_count || 0),
                0
              ) || 0

            return (
              <Box sx={{ bgcolor: '#E8F4F266', p: 4, border: '1px solid #C3CEC7', borderRadius: '8px', mb: 6 }}>
                <Paper elevation={3} sx={{ p: 0, backgroundColor: 'transparent', boxShadow: 'none' }}>
                  {/* Header */}
                  <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
                    <Box>
                      <Typography sx={{ color: '#44544A', fontWeight: 500, fontSize: '20px' }}>
                        Export ID : {all.export_number}
                      </Typography>
                      <Typography
                        color='#006D35'
                        sx={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#006D35',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={handleLinkedshipmentClick}
                      >
                        This export id is part of 2 more shipments
                        <ChevronRightIcon sx={{ fontSize: '22px' }} />
                      </Typography>
                    </Box>
                    <Box display='flex' alignItems='center' gap={1} key={`export-${all.export_id}`}>
                      {/* <FileUpload name='(AWB) Airway Bill' onFileUpload={handleFileUpload} file={uploadedFile} /> */}
                      <FileUpload
                        key={`uploader-${all.export_id}`}
                        name='(AWB) Airway Bill'
                        onFileUpload={file => handleFileUpload(all.export_id, file)}
                        file={all.attachment}
                      />
                      <IconButton onClick={() => handleRemoveExportDataAtIndex(all.export_id)}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Species Summary */}
                  <Box
                    sx={{
                      //bgcolor: '#f6f6f6',
                      borderRadius: '8px',
                      border: '1px solid #C3CEC7',
                      mb: 2,
                      mt: 5
                    }}
                  >
                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                      sx={{
                        background: '#EFF5F2',
                        px: 4,
                        py: 2,
                        borderTopLeftRadius: '10px',
                        borderTopRightRadius: '10px'
                      }}
                    >
                      {/* <Typography sx={{ color: '#44544A', fontSize: '16px', fontWeight: 500 }}>
                      {all?.species?.length} Species • 8 Animals
                    </Typography> */}

                      <Typography sx={{ color: '#44544A', fontSize: '16px', fontWeight: 500 }}>
                        {all?.species?.length} Species • {totalAnimals} Animals
                      </Typography>

                      <Typography
                        sx={{
                          color: '#006D35',
                          fontSize: '14px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon
                          style={{
                            fontSize: '18px',
                            cursor: 'pointer',
                            marginRight: '8px',
                            color: '#006D35'
                          }}
                          icon='bx:pencil'
                        />
                        Edit Selection
                      </Typography>
                    </Box>

                    <Divider />

                    {/* Species List */}
                    <Box
                      sx={{
                        background: '#fff',
                        // px: 4,
                        // py: 4,
                        borderBottomLeftRadius: '10px',
                        borderBottomRightRadius: '10px'
                      }}
                    >
                      {all.species.map((speciesdata, idx) => (
                        <Box
                          key={idx}
                          display='flex'
                          justifyContent='space-between'
                          // py={2}
                          sx={{ borderBottom: '1px solid #0000000D', px: 4, py: 2 }}
                        >
                          <Box sx={{ minWidth: '420px' }}>
                            <Typography
                              fontWeight='medium'
                              sx={{ color: '#44544A', fontWeight: 500, fontSize: '16px' }}
                            >
                              {speciesdata.common_name}
                            </Typography>
                            <Typography fontStyle='italic' sx={{ color: '#44544A', fontWeight: 400, fontSize: '14px' }}>
                              {speciesdata.scientific_name}
                            </Typography>
                          </Box>
                          <Box display='flex' alignItems='center' gap={2} flex={1}>
                            <Typography sx={{ color: '#44544A', fontSize: '14px', fontWeight: 500, mr: 2 }}>
                              Count :{' '}
                              {Number(speciesdata.male_count) +
                                Number(speciesdata.female_count) +
                                Number(speciesdata.undeterminate_count)}
                            </Typography>
                            <Chip
                              label={`M - ${speciesdata.male_count || 0}`}
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
                              label={`F - ${speciesdata.female_count || 0}`}
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
                              label={`U - ${speciesdata.undeterminate_count || 0}`}
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
                          <ChevronRightIcon sx={{ fontSize: '30px', mt: 2 }} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )
          })
        ) : (
          <Alert severity='info' sx={{ my: 4 }}>
            At least one species or animals must be selected.
          </Alert>
        )}

        <Box
          sx={{
            width: '100%',
            backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
            p: 8,
            my: 4,
            borderRadius: 2
          }}
        >
          <Button
            variant='outlined'
            onClick={() => setexportPermitDrawerOpen(true)}
            startIcon={<AddIcon />}
            sx={{
              width: !isSmallDevice ? '49%' : '49%',
              py: 2,
              mr: 4,
              fontSize: '1rem', // Increase font size (adjust as needed)
              fontWeight: 500,
              border: '2px dashed', // Dashed border
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.common.white,
              '&:hover': {
                border: '2px dashed', // Maintain dashed style on hover
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            Add From Export Permit
          </Button>
          <Button
            variant='outlined'
            onClick={() => setSpeciesDrawerOpen(true)}
            startIcon={<AddIcon />}
            sx={{
              width: !isSmallDevice ? '49%' : '45%',
              py: 2,
              fontSize: '1rem', // Increase font size (adjust as needed)
              fontWeight: 500,
              border: '2px dashed', // Dashed border
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.common.white,
              '&:hover': {
                border: '2px dashed', // Maintain dashed style on hover
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            Add Animals
          </Button>
        </Box>

        <ExportPermitDrawer
          open={exportPermitDrawerOpen}
          onClose={() => setexportPermitDrawerOpen(false)}
          //onSelect={handleSpeciesSelect}
          handleSearch={handleSearch}
          exportsList={exportsList}
          exportsTotalCount={exportsTotalCount}
          handleScroll={handleScroll}
          scrollContainerRef={scrollContainerRef}
          isLoading={isLoading}
          onExportCardSelect={onExportCardSelect}
          selectedExportData={selectedExportData}
          setSelectedExportData={setSelectedExportData}
          title='Add Export Permit'
          setDraftData={setDraftData}
          draftData={draftData}
        />

        <LinkedShipmentsDrawer
          open={linkedShipmentsDrawerOpen}
          onClose={() => setLinkedShipmentsDrawerOpen(false)}
          title='Linked Shipments'
        />
        <SelectSpeciesDrawer
          open={speciesDrawerOpen}
          onClose={() => setSpeciesDrawerOpen(false)}
          title='Select Species'
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button variant='outlined' onClick={onCancel}>
          Reset
        </Button>
        <Button variant='contained' onClick={onSave}>
          Save Details
        </Button>
      </Box>
    </Box>
  )
}

export default SpeciesAddEdit
