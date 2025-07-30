import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  useMediaQuery,
  useTheme,
  CircularProgress,
  CardContent
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SelectAnimalsDrawer from '../drawer/SelectAnimalsDrawer'
import Toaster from 'src/components/Toaster'

const AnimalCardLayout = ({
  exportAnimalData,
  onSelect,
  loading,
  selectedExportData,
  setSelectedExportData,
  exportNumber,
  exportID,
  onClose,
  shipment_count,
  shipments,
  draftData,
  setDraftData,
  setexportPermitDrawerOpen
}) => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [selectAnimalsDrawerOpen, setselectAnimalsDrawerOpen] = useState(false)
  const [animalLists, setanimalLists] = useState([])
  const [speciesData, setspeciesData] = useState([])
  const [speciesId, setspeciesId] = useState('')
  const [selectedCounts, setSelectedCounts] = useState({})
  const [currentSpeciesIndex, setCurrentSpeciesIndex] = useState(null)
  const [commonNameValue, setCommonNameValue] = useState('')
  // Initialize selectedExportData
  useEffect(() => {
    if (exportAnimalData?.species && !draftData) {
      const initialData = exportAnimalData.species.map(species => ({
        male_count: '',
        female_count: '',
        undeterminate_count: ''
      }))
      setDraftData(initialData)
    }
  }, [exportAnimalData, draftData])

  const handleSelectAnimalsClick = (val, index, speciesId, name) => {
    setselectAnimalsDrawerOpen(true)
    setanimalLists(val)
    setspeciesId(speciesId)
    setspeciesData(val)
    setCurrentSpeciesIndex(index)
    setCommonNameValue(name)
  }

  const currentExport = draftData?.export?.find(exp => exp.export_id === exportID) || { species: [] }

  const findSpeciesIndex = speciesId => {
    return currentExport?.species?.findIndex(s => s.master_species_id === speciesId)
  }

  const handleCountChange = (speciesId, field, value, max) => {
    const val = value === '' ? '' : Number(value)
    if (val === '' || (!isNaN(val) && val <= max)) {
      setDraftData(prev => {
        const updated = JSON.parse(JSON.stringify(prev))

        let exportIndex = updated.export.findIndex(e => e.export_id === exportID)
        if (exportIndex === -1) {
          updated.export.push({
            export_id: exportID,
            export_number: exportNumber,
            shipment_count: shipment_count,
            shipments: shipments,
            species: []
          })
          exportIndex = updated.export.length - 1
        }

        let speciesIndex = updated.export[exportIndex].species.findIndex(s => s.master_species_id === String(speciesId))

        if (speciesIndex === -1) {
          const matchingSpecies = exportAnimalData.species.find(s => s.master_species_id === String(speciesId))

          const newSpecies = {
            master_species_id: speciesId,
            export_id: exportID,
            appendix: matchingSpecies?.appendix || '',
            common_name: matchingSpecies?.common_name || '',
            scientific_name: matchingSpecies?.scientific_name || '',
            taxonomy_id: matchingSpecies?.taxonomy_id || '',
            male_count: '',
            female_count: '',
            undeterminate_count: '',
            animals: []
          }

          updated.export[exportIndex].species.push(newSpecies)
          speciesIndex = updated.export[exportIndex].species.length - 1
        } else {
          const matchingSpecies = exportAnimalData.species.find(s => s.id === String(speciesId))
          if (matchingSpecies) {
            updated.export[exportIndex].species[speciesIndex] = {
              ...updated.export[exportIndex].species[speciesIndex],
              appendix: matchingSpecies.appendix || '',
              common_name: matchingSpecies.common_name || '',
              scientific_name: matchingSpecies.scientific_name || '',
              taxonomy_id: matchingSpecies.taxonomy_id || ''
            }
          }
        }

        updated.export[exportIndex].species[speciesIndex][field] = val

        return updated
      })
    }
  }

  const handleAnimalsSelected = (speciesId, selectedAnimals) => {
    setDraftData(prev => {
      const exportIndex = prev.export.findIndex(e => e.export_id === exportID)
      const speciesIndex = prev.export[exportIndex].species.findIndex(s => s.master_species_id === speciesId)

      const updated = JSON.parse(JSON.stringify(prev))
      updated.export[exportIndex].species[speciesIndex].animals = selectedAnimals
      return updated
    })
  }

  useEffect(() => {
    if (!exportID || !draftData.export) return

 
    const matchedExport = draftData.export.find(exportItem => String(exportItem.export_id) === String(exportID))

    if (matchedExport) {
      const newSelectedCounts = {}
      matchedExport.species?.forEach(species => {
        newSelectedCounts[species.master_species_id] = species.animals?.length || 0
      })
      setSelectedCounts(newSelectedCounts)
    }
  }, [draftData, exportID])

  const isDoneDisabled = () => {
    const exportExists = draftData?.export?.some(exportItem => exportItem.export_id === exportID)

    if (!exportExists) return true
 
    return !draftData?.export?.some(
      exportItem =>
        exportItem.export_id === exportID &&
        exportItem.species?.some(
          speciesItem =>
            Number(speciesItem.male_count || 0) > 0 ||
            Number(speciesItem.female_count || 0) > 0 ||
            Number(speciesItem.undeterminate_count || 0) > 0
        )
    )
  }

  const handleDone = () => {
   
    const validatedExports = draftData.export
      .filter(exp => exp.export_id !== '')
      .map(exp => ({
        ...exp,
        species: exp.species
          .filter(s => s.master_species_id !== '')
          .filter(
            s =>
              Number(s.male_count || 0) > 0 ||
              Number(s.female_count || 0) > 0 ||
              Number(s.undeterminate_count || 0) > 0 ||
              s.animals?.length > 0
          )
      }))
      .filter(exp => exp.species.length > 0)

    if (validatedExports.length === 0) {
      Toaster({
        type: 'error',
        message: 'Please complete at least one export entry'
      })
      return
    }

    onSelect({
      export: validatedExports,
      others: []
    })
    onClose()
    setexportPermitDrawerOpen(false)
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <Box
          sx={{
            px: 5,
            pt: '16px',
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))'
          }}
        >
          {loading ? (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
              </Box>
            </CardContent>
          ) : exportAnimalData?.species?.length > 0 ? (
            exportAnimalData?.species?.map((card, index) => {
              const speciesIndex = findSpeciesIndex(card.master_species_id)

              const speciesData = currentExport.species[speciesIndex] || {
                male_count: '',
                female_count: '',
                undeterminate_count: '',
                animals: []
              }
              return (
                <Box
                  key={card.id}
                  sx={{
                    border: '1px solid #C3CEC7',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                
                  <Typography variant='h6' sx={{ fontWeight: '500', color: '#44544A' }}>
                    {card.common_name}
                  </Typography>
                  <Typography
                    //variant='subtitle2'
                    sx={{ color: '#44544A', fontStyle: 'italic', fontSize: '400', fontSize: '16px' }}
                  >
                    {card.scientific_name}
                  </Typography>
                  <Typography
                    sx={{ color: '#44544A', marginTop: '8px', marginBottom: '16px', fontSize: '400', fontSize: '16px' }}
                  >
                    {`${card.total_balance_animal}/${card.total_count}`} animals available for shipment
                  </Typography>

               
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
                        {`${
                          (speciesData.male_count || 0) +
                          (speciesData.female_count || 0) +
                          (speciesData.undeterminate_count || 0)
                        }/${card.total_balance_animal || 0}`}
                      </Typography>
                    </Grid>

                    
                    <Grid container spacing={2} sx={{ marginTop: '8px' }}>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant='caption'
                          sx={{ display: 'block', color: '#44544A', marginBottom: '4px', fontWeight: 400 }}
                        >
                          Male <span style={{ fontWeight: '500' }}>({card.total_balance_male_animal})</span>
                        </Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={speciesData.male_count ?? ''}
                          onChange={e =>
                            handleCountChange(
                              card.master_species_id,
                              'male_count',
                              e.target.value,
                              card.total_balance_male_animal
                            )
                          }
                          slotProps={{
                            input: {
                              inputProps: {
                                min: 0,
                                max: card.total_balance_male_animal
                              }
                            }
                          }}
                          disabled={card.total_balance_male_animal === '0'}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              backgroundColor: card.total_balance_male_animal === '0' ? '#0000000D' : '#FFFFFF'
                            },
                            width: '95%'
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant='caption'
                          sx={{ display: 'block', color: '#44544A', marginBottom: '4px', fontWeight: 400 }}
                        >
                          Female <span style={{ fontWeight: '500' }}>({card.total_balance_female_animal})</span>
                        </Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={speciesData.female_count ?? ''}
                          onChange={e =>
                            handleCountChange(
                              card.master_species_id,
                              'female_count',
                              e.target.value,
                              card.total_balance_female_animal
                            )
                          }
                          slotProps={{
                            input: {
                              inputProps: {
                                min: 0,
                                max: card.total_balance_female_animal
                              }
                            }
                          }}
                          disabled={card.total_balance_female_animal === '0'}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              backgroundColor: card.total_balance_female_animal === '0' ? '#0000000D' : '#FFFFFF'
                            },
                            width: '95%'
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant='caption' sx={{ display: 'block', color: '#7A8684', marginBottom: '4px' }}>
                          Unknown ({card.total_balance_undeterminate_animal})
                        </Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={speciesData.undeterminate_count ?? ''}
                          onChange={e =>
                            handleCountChange(
                              card.master_species_id,
                              'undeterminate_count',
                              e.target.value,
                              card.total_balance_undeterminate_animal
                            )
                          }
                          slotProps={{
                            input: {
                              inputProps: {
                                min: 0,
                                max: card.total_balance_undeterminate_animal
                              }
                            }
                          }}
                          disabled={card.total_balance_undeterminate_animal === '0'}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              backgroundColor: card.total_balance_undeterminate_animal === '0' ? '#0000000D' : '#FFFFFF'
                            },
                            width: '95%'
                          }}
                        />
                      </Grid>
                    </Grid>
                    {draftData.export?.some(
                      exportItem =>
                        String(exportItem.export_id) === String(exportID) &&
                        exportItem.species?.some(
                          species =>
                            species.master_species_id === card.master_species_id &&
                            (Number(species.male_count || 0) > 0 ||
                              Number(species.female_count || 0) > 0 ||
                              Number(species.undeterminate_count || 0) > 0)
                        )
                    ) && (
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
                          onClick={() =>
                            handleSelectAnimalsClick(card.animals, index, card.master_species_id, card.common_name)
                          }
                        >
                          Select from list
                          <ChevronRightIcon sx={{ fontSize: '22px', marginLeft: '4px' }} />
                        </Typography>
                        <Typography sx={{ color: '#44544A', fontWeight: '500', fontSize: '16px' }}>
                          {selectedCounts[card.master_species_id] || 0} Selected
                        </Typography>
                      </Grid>
                    )}
                  </Box>
                </Box>
              )
            })
          ) : (
            <Typography
              sx={{
                background: '#0000000D',
                p: 15,
                textAlign: 'center',
                borderRadius: '8px',
                mt: 7,
                fontWeight: '500'
              }}
            >
              No Species to show
            </Typography>
          )}
        </Box>
      </Box>
      

      {exportAnimalData?.species?.length > 0 && !loading && (
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
            zIndex: 1,
            marginTop: 'auto'
          }}
        >
          <Button fullWidth variant='contained' onClick={handleDone} disabled={isDoneDisabled()}>
            Add
          </Button>
        </Box>
      )}

      <SelectAnimalsDrawer
        open={selectAnimalsDrawerOpen}
        onClose={() => setselectAnimalsDrawerOpen(false)}
        animalLists={animalLists}
        exportNumber={exportNumber}
        title='Select Animals'
        speciesId={speciesId}
        speciesData={currentExport.species.find(s => s.master_species_id === speciesId) || {}}
        onSelectAnimals={selected => handleAnimalsSelected(speciesId, selected)}
        initialSelectedAnimals={currentExport.species.find(s => s.master_species_id === speciesId)?.animals || []}
        selectedExportData={selectedExportData}
        exportID={exportID}
        draftData={draftData}
        commonNameValue={commonNameValue}
      />
    </>
  )
}

export default AnimalCardLayout
