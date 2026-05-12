import React, { useState, useEffect } from 'react'
import { Box, Typography, TextField, Button, Grid, useMediaQuery, CircularProgress, CardContent } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SelectAnimalsDrawer from '../drawer/SelectAnimalsDrawer'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Toaster from 'src/components/Toaster'

interface AnimalItem {
  id: string | number
  gender?: string
  identifier_type?: string
  identifier_value?: string
  [key: string]: unknown
}

interface SpeciesCard {
  id: string | number
  master_species_id: string
  common_name?: string
  scientific_name?: string
  appendix?: string
  taxonomy_id?: string | number
  total_balance_animal?: number | string
  total_balance_male_animal?: string | number
  total_balance_female_animal?: string | number
  total_balance_undeterminate_animal?: string | number
  total_count?: number
  animals?: AnimalItem[]
  [key: string]: unknown
}

interface ExportAnimalData {
  export_number?: string
  total_animals_to_ship?: number
  total_animals?: number
  species?: SpeciesCard[]
  [key: string]: unknown
}

interface ExportSpeciesEntry {
  master_species_id: string
  export_id?: string | number
  appendix?: string
  common_name?: string
  scientific_name?: string
  taxonomy_id?: string | number
  male_count?: number | string
  female_count?: number | string
  undeterminate_count?: number | string
  animals?: AnimalItem[]
  [key: string]: unknown
}

interface ExportEntry {
  export_id: string | number
  export_number?: string
  shipment_count?: number
  shipments?: unknown[]
  species: ExportSpeciesEntry[]
  [key: string]: unknown
}

interface DraftData {
  export: ExportEntry[]
  others: unknown[]
}

interface SelectedExportData {
  export: unknown[]
  others: unknown[]
}

interface AnimalCardLayoutProps {
  exportAnimalData: ExportAnimalData
  onSelect: (data: SelectedExportData) => void
  loading: boolean
  selectedExportData: SelectedExportData
  setSelectedExportData?: React.Dispatch<React.SetStateAction<SelectedExportData>>
  setSearchValue: React.Dispatch<React.SetStateAction<string>>
  exportNumber: string
  exportID: string | number
  onClose: () => void
  shipment_count?: number
  shipments?: unknown[]
  draftData: DraftData
  setDraftData: React.Dispatch<React.SetStateAction<DraftData>>
  setexportPermitDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const AnimalCardLayout = ({
  exportAnimalData,
  onSelect,
  loading,
  selectedExportData,
  setSearchValue,
  exportNumber,
  exportID,
  onClose,
  shipment_count,
  shipments,
  draftData,
  setDraftData,
  setexportPermitDrawerOpen
}: AnimalCardLayoutProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [selectAnimalsDrawerOpen, setselectAnimalsDrawerOpen] = useState<boolean>(false)
  const [animalLists, setanimalLists] = useState<AnimalItem[]>([])
  const [speciesData, setspeciesData] = useState<AnimalItem[]>([])
  const [speciesId, setspeciesId] = useState<string>('')
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({})
  const [currentSpeciesIndex, setCurrentSpeciesIndex] = useState<number | null>(null)
  const [commonNameValue, setCommonNameValue] = useState<string>('')

  // Initialize selectedExportData
  useEffect(() => {
    if (exportAnimalData?.species && !draftData) {
      const initialData = exportAnimalData.species.map(species => ({
        male_count: '',
        female_count: '',
        undeterminate_count: ''
      }))
      setDraftData(initialData as unknown as DraftData)
    }
  }, [exportAnimalData, draftData])

  const handleSelectAnimalsClick = (val: AnimalItem[], index: number, speciesId: string, name: string) => {
    setselectAnimalsDrawerOpen(true)
    setanimalLists(val)
    setspeciesId(speciesId)
    setspeciesData(val)
    setCurrentSpeciesIndex(index)
    setCommonNameValue(name)
  }

  const currentExport: ExportEntry = draftData?.export?.find(exp => exp.export_id === exportID) || {
    export_id: exportID,
    species: []
  }

  const findSpeciesIndex = (speciesId: string): number => {
    return currentExport?.species?.findIndex(s => s.master_species_id === speciesId)
  }

  const handleCountChange = (speciesId: string, field: string, value: string, max: string | number) => {
    const val = value === '' ? '' : Number(value)
    if (val === '' || (!isNaN(val as number) && (val as number) <= Number(max))) {
      setDraftData(prev => {
        const updated: DraftData = JSON.parse(JSON.stringify(prev))

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
          const matchingSpecies = exportAnimalData.species?.find(s => s.master_species_id === String(speciesId))

          const newSpecies: ExportSpeciesEntry = {
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
          const matchingSpecies = exportAnimalData.species?.find(s => s.master_species_id === String(speciesId))
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

        ;(updated.export[exportIndex].species[speciesIndex] as Record<string, unknown>)[field] = val

        return updated
      })
    }
  }

  const handleAnimalsSelected = (speciesId: string, selectedAnimals: AnimalItem[]) => {
    setDraftData(prev => {
      const exportIndex = prev.export.findIndex(e => e.export_id === exportID)
      const speciesIndex = prev.export[exportIndex].species.findIndex(s => s.master_species_id === speciesId)

      const updated: DraftData = JSON.parse(JSON.stringify(prev))
      updated.export[exportIndex].species[speciesIndex].animals = selectedAnimals

      return updated
    })
  }

  useEffect(() => {
    if (!exportID || !draftData.export) return

    const matchedExport = draftData.export.find(exportItem => String(exportItem.export_id) === String(exportID))

    if (matchedExport) {
      const newSelectedCounts: Record<string, number> = {}
      matchedExport.species?.forEach(species => {
        newSelectedCounts[species.master_species_id] = species.animals?.length || 0
      })
      setSelectedCounts(newSelectedCounts)
    }
  }, [draftData, exportID])

  const isDoneDisabled = (): boolean => {
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
              (s.animals?.length ?? 0) > 0
          )
      }))
      .filter(exp => exp.species.length > 0)

    if (validatedExports.length === 0) {
      Toaster({
        type: 'error',
        message: t('compliance_module.please_complete_at_least_one_export_entry')
      })

      return
    }

    onSelect({
      export: validatedExports,
      others: []
    })
    onClose()
    setexportPermitDrawerOpen(false)
    setSearchValue('')
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
          ) : (exportAnimalData?.species?.length ?? 0) > 0 ? (
            exportAnimalData?.species?.map((card, index) => {
              const speciesIndex = findSpeciesIndex(card.master_species_id)

              const speciesEntry = currentExport.species[speciesIndex] || {
                male_count: '',
                female_count: '',
                undeterminate_count: '',
                animals: []
              }

              return (
                <Box
                  key={card.id}
                  sx={{
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: theme.palette.customColors.OnPrimary
                  }}
                >
                  {/* Title and Subtitle */}
                  <Typography
                    variant='h6'
                    sx={{ fontWeight: '500', color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    {card.common_name}
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontStyle: 'italic',
                      fontSize: '16px'
                    }}
                  >
                    {card.scientific_name}
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      marginTop: '8px',
                      marginBottom: '16px',
                      fontSize: '16px'
                    }}
                  >
                    {`${card.total_balance_animal}/${card.total_count}`}{' '}
                    {t('compliance_module.animals_available_for_shipment')}
                  </Typography>

                  <Box
                    sx={{
                      border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#E8F4F266'
                    }}
                  >
                    <Grid container justifyContent='space-between' alignItems='center'>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: '400', color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}
                      >
                        {t('compliance_module.animals_part_of_shipment')}:
                      </Typography>
                      <Typography
                        variant='subtitle2'
                        sx={{
                          fontWeight: '500',
                          color: theme.palette.customColors.OnSecondaryContainer,
                          fontSize: '24px'
                        }}
                      >
                        {`${
                          (Number(speciesEntry.male_count) || 0) +
                          (Number(speciesEntry.female_count) || 0) +
                          (Number(speciesEntry.undeterminate_count) || 0)
                        }/${card.total_balance_animal || 0}`}
                      </Typography>
                    </Grid>

                    <Grid container spacing={2} sx={{ marginTop: '8px' }}>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant='caption'
                          sx={{
                            display: 'block',
                            color:
                              card.total_balance_male_animal === '0'
                                ? theme.palette.customColors.secondaryBg
                                : theme.palette.customColors.OnSurfaceVariant,
                            marginBottom: '4px',
                            fontWeight: 400
                          }}
                        >
                          {t('compliance_module.male')}{' '}
                          <span style={{ fontWeight: '500' }}>({card.total_balance_male_animal})</span>
                        </Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={speciesEntry.male_count ?? ''}
                          onWheel={e => (e.target as HTMLInputElement).blur()}
                          onChange={e =>
                            handleCountChange(
                              card.master_species_id,
                              'male_count',
                              e.target.value,
                              card.total_balance_male_animal ?? 0
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
                              backgroundColor:
                                card.total_balance_male_animal === '0'
                                  ? theme.palette.customColors.mdAntzNeutral
                                  : theme.palette.customColors.OnPrimary
                            },
                            width: '95%'
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant='caption'
                          sx={{
                            display: 'block',
                            color:
                              card.total_balance_female_animal === '0'
                                ? theme.palette.customColors.secondaryBg
                                : theme.palette.customColors.OnSurfaceVariant,
                            marginBottom: '4px',
                            fontWeight: 400
                          }}
                        >
                          {t('compliance_module.female')}{' '}
                          <span style={{ fontWeight: '500' }}>({card.total_balance_female_animal})</span>
                        </Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={speciesEntry.female_count ?? ''}
                          onWheel={e => (e.target as HTMLInputElement).blur()}
                          onChange={e =>
                            handleCountChange(
                              card.master_species_id,
                              'female_count',
                              e.target.value,
                              card.total_balance_female_animal ?? 0
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
                              backgroundColor:
                                card.total_balance_female_animal === '0'
                                  ? theme.palette.customColors.mdAntzNeutral
                                  : theme.palette.customColors.OnPrimary
                            },
                            width: '95%'
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant='caption'
                          sx={{
                            display: 'block',
                            color:
                              card.total_balance_undeterminate_animal === '0'
                                ? theme.palette.customColors.secondaryBg
                                : theme.palette.customColors.OnSurfaceVariant,
                            marginBottom: '4px'
                          }}
                        >
                          {t('compliance_module.unknown')} ({card.total_balance_undeterminate_animal})
                        </Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={speciesEntry.undeterminate_count ?? ''}
                          onWheel={e => (e.target as HTMLInputElement).blur()}
                          onChange={e =>
                            handleCountChange(
                              card.master_species_id,
                              'undeterminate_count',
                              e.target.value,
                              card.total_balance_undeterminate_animal ?? 0
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
                              backgroundColor:
                                card.total_balance_undeterminate_animal === '0'
                                  ? theme.palette.customColors.mdAntzNeutral
                                  : theme.palette.customColors.OnPrimary
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
                            color: theme.palette.primary.dark,
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 500,
                            pl: 0,
                            fontSize: '16px',
                            cursor: 'pointer'
                          }}
                          onClick={() =>
                            handleSelectAnimalsClick(
                              card.animals || [],
                              index,
                              card.master_species_id,
                              card.common_name || ''
                            )
                          }
                        >
                          {t('compliance_module.select_from_list')}
                          <ChevronRightIcon sx={{ fontSize: '22px', marginLeft: '4px' }} />
                        </Typography>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontWeight: '500',
                            fontSize: '16px'
                          }}
                        >
                          {selectedCounts[card.master_species_id] || 0} {t('selected')}
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
                background: theme.palette.customColors.mdAntzNeutral,
                p: 15,
                textAlign: 'center',
                borderRadius: '8px',
                mt: 7,
                fontWeight: '500'
              }}
            >
              {t('compliance_module.no_species_to_show')}
            </Typography>
          )}
        </Box>
      </Box>

      {(exportAnimalData?.species?.length ?? 0) > 0 && !loading && (
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
            {t('add')}
          </Button>
        </Box>
      )}

      <SelectAnimalsDrawer
        open={selectAnimalsDrawerOpen}
        onClose={() => setselectAnimalsDrawerOpen(false)}
        animalLists={animalLists}
        exportNumber={exportNumber}
        title={t('compliance_module.select_animals')}
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
