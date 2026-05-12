import React, { useEffect, useState } from 'react'
import { Typography, Box, Drawer, IconButton, Avatar, Checkbox, Button, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import CloseIcon from '@mui/icons-material/Close'
import Toaster from 'src/components/Toaster'

interface AnimalItem {
  id: string | number
  gender?: string
  identifier_type?: string
  identifier_value?: string
  [key: string]: unknown
}

interface SpeciesCount {
  male_count?: number | string
  female_count?: number | string
  undeterminate_count?: number | string
  master_species_id?: string | number
  [key: string]: unknown
}

interface ExportItem {
  export_id?: string | number
  species?: SpeciesCount[]
  [key: string]: unknown
}

interface DraftData {
  export: ExportItem[]
  others: unknown[]
}

interface SelectAnimalsDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  animalLists: AnimalItem[]
  exportNumber: string
  onSelectAnimals: (selected: AnimalItem[]) => void
  speciesId: string | number
  speciesData: SpeciesCount
  exportID: string | number
  selectedExportData: { export: unknown[]; others: unknown[] }
  draftData: DraftData
  commonNameValue: string
  initialSelectedAnimals?: AnimalItem[]
}

const SelectAnimalsDrawer = ({
  open,
  onClose,
  title,
  animalLists,
  exportNumber,
  onSelectAnimals,
  speciesId,
  speciesData,
  exportID,
  selectedExportData,
  draftData,
  commonNameValue,
  initialSelectedAnimals = []
}: SelectAnimalsDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [selectedAnimals, setSelectedAnimals] = useState<AnimalItem[]>(initialSelectedAnimals)

  useEffect(() => {
    setSelectedAnimals(initialSelectedAnimals)
  }, [initialSelectedAnimals, open])

  const handleCheckboxChange = (animal: AnimalItem) => {
    setSelectedAnimals(prev => {
      const isSelected = prev.some(a => a.id === animal.id)
      if (isSelected) {
        return prev.filter(a => a.id !== animal.id)
      } else {
        return [...prev, animal]
      }
    })
  }

  const validateSelection = () => {
    const exportItem = draftData.export.find(e => e.export_id === exportID)
    const foundSpeciesData = exportItem?.species?.find(s => s.master_species_id === speciesId)

    const counts = {
      male: 0,
      female: 0,
      undeterminate: 0
    }

    selectedAnimals.forEach(animal => {
      if (animal.gender === 'male') counts.male++
      else if (animal.gender === 'female') counts.female++
      else counts.undeterminate++
    })

    if (foundSpeciesData) {
      if (counts.male > 0 && Number(foundSpeciesData.male_count || 0) === 0) {
        Toaster({
          type: 'error',
          message: t('compliance_module.cannot_select_male_animals_count_is_0')
        })

        return false
      }
      if (counts.female > 0 && Number(foundSpeciesData.female_count || 0) === 0) {
        Toaster({
          type: 'error',
          message: t('compliance_module.cannot_select_female_animals_count_is_0')
        })

        return false
      }
      if (counts.undeterminate > 0 && Number(foundSpeciesData.undeterminate_count || 0) === 0) {
        Toaster({
          type: 'error',
          message: t('compliance_module.cannot_select_unknown_animals_count_is_0')
        })

        return false
      }

      if (counts.male > Number(foundSpeciesData.male_count || 0)) {
        Toaster({
          type: 'error',
          message: t('compliance_module.cannot_select_more_than_male_animals', {
            count: Number(foundSpeciesData.male_count)
          })
        })

        return false
      }
      if (counts.female > Number(foundSpeciesData.female_count || 0)) {
        Toaster({
          type: 'error',
          message: t('compliance_module.cannot_select_more_than_female_animals', {
            count: Number(foundSpeciesData.female_count)
          })
        })

        return false
      }
      if (counts.undeterminate > Number(foundSpeciesData.undeterminate_count || 0)) {
        Toaster({
          type: 'error',
          message: t('compliance_module.cannot_select_more_than_unknown_animals', {
            count: Number(foundSpeciesData.undeterminate_count)
          })
        })

        return false
      }
    }

    return true
  }

  const handleSelect = () => {
    if (!validateSelection()) {
      return
    }

    onSelectAnimals(selectedAnimals)
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
        <Box sx={{ px: 5, pt: 4, pb: 2, background: theme.palette.common.white }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ backgroundColor: theme.palette.common.white, px: 5, pb: 6, pt: 2 }}>
          <Box
            sx={{
              backgroundColor: theme.palette.customColors.OnPrimarycontainer10,
              color: theme.palette.customColors.OnPrimary,
              borderRadius: '8px',
              padding: '16px',
              width: '100%'
            }}
          >
            <Typography
              sx={{
                fontWeight: '500',
                color: theme.palette.customColors.OnSecondaryContainer,
                marginBottom: '3px',
                fontSize: '16px'
              }}
            >
              {t('compliance_module.export_id_label')} {exportNumber}
              {/* {data.exportId} */}
            </Typography>

            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontWeight: '500',
                fontSize: '16px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 400 }}>{t('compliance_module.species_label')} </span>
              {commonNameValue ? commonNameValue : 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              maxWidth: '600px',
              margin: 'auto',
              px: 6,
              borderRadius: '8px'
            }}
          >
            <Typography
              sx={{ pt: 3, fontWeight: 500, fontSize: '18px', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {t('compliance_module.animals_with_identifier')} ({animalLists.length})
            </Typography>
            {animalLists?.length > 0 ? (
              animalLists.map(animal => {
                const isSelected = selectedAnimals.some(a => a.id === animal.id)
                const handleToggle = () => handleCheckboxChange(animal)

                return (
                  <Box
                    key={animal.id}
                    onClick={handleToggle}
                    onKeyDown={event => {
                      if (event.target !== event.currentTarget) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleToggle()
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      // padding: '12px',
                      backgroundColor: theme.palette.customColors.OnPrimary,
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Avatar
                      sx={{
                        backgroundColor:
                          animal.gender === 'male'
                            ? alpha(theme.palette.customColors.SecondaryContainer || '', 0.5)
                            : animal.gender === 'female'
                            ? alpha(theme.palette.customColors.customDropdownColor || '', 0.15)
                            : animal.gender === 'unknown'
                            ? theme.palette.customColors.displaybgSecondary
                            : '',
                        color:
                          animal.gender === 'male'
                            ? theme.palette.customColors.addPrimary
                            : animal.gender === 'female'
                            ? theme.palette.customColors.customDropdownColor
                            : animal.gender === 'unknown'
                            ? theme.palette.customColors.OnPrimaryContainer
                            : '',
                        fontWeight: '500',
                        marginRight: '16px',
                        fontSize: '14px',
                        width: 40,
                        height: 40,
                        borderRadius: '4px',
                        ml: 4
                      }}
                    >
                      {animal.gender === 'male'
                        ? 'M'
                        : animal.gender === 'female'
                        ? 'F'
                        : animal.gender === 'unknown'
                        ? 'U'
                        : ''}
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        sx={{ fontWeight: '400', color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}
                      >
                        {t('compliance_module.species_label')}{' '}
                        <span
                          style={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          {commonNameValue ? commonNameValue : 'N/A'}
                        </span>
                      </Typography>

                      <Typography
                        sx={{ fontWeight: '400', color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}
                      >
                        {animal.identifier_type} :{' '}
                        <span
                          style={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          {animal.identifier_value}
                        </span>
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        background: theme.palette.customColors.Surface,
                        borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        height: '68px',
                        width: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTopRightRadius: '8px',
                        borderBottomRightRadius: '8px'
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onClick={event => {
                          event.stopPropagation()
                        }}
                        onChange={event => {
                          event.stopPropagation()
                          handleToggle()
                        }}
                      />
                    </Box>
                  </Box>
                )
              })
            ) : (
              <Typography
                sx={{
                  background: theme.palette.customColors.mdAntzNeutral,
                  p: 12,
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontWeight: '500'
                }}
              >
                {t('compliance_module.no_animals_to_show')}
              </Typography>
            )}
          </Box>
        </Box>
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
            onClick={handleSelect}
            disabled={initialSelectedAnimals.length === 0 && selectedAnimals.length === 0}
          >
            {t('compliance_module.select_animals')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(SelectAnimalsDrawer)
