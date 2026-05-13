import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Button,
  Paper,
  Drawer,
  Avatar
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import Toaster from 'src/components/Toaster'
import { MastersData, Species } from 'src/types/compliance'

interface AnimalEntry {
  gender: string
  identifierType: string
  identifier: string
}

interface GenderCounts {
  male: number
  female: number
  unknown: number
}

interface SpeciesItem {
  id: string | number
  species: {
    tsn_id?: string | number
    common_name?: string
    scientific_name?: string
    default_icon?: string
    male_count?: number
    female_count?: number
    undeterminate_count?: number
    total_count?: number
    animals?: Array<{
      gender?: string | string[]
      identifier_type?: string
      identifier_value?: string
      [key: string]: unknown
    }>
    [key: string]: unknown
  }
}

interface ExportSpeciesData {
  tsn_id?: string | number
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  animals?: Array<{
    gender?: string | string[]
    identifier_type?: string
    identifier_value?: string
    [key: string]: unknown
  }>
  [key: string]: unknown
}

interface SelectedExportData {
  export: Array<{
    export_id?: string | number
    species?: ExportSpeciesData[]
    [key: string]: unknown
  }>
  others: Array<{
    species?: ExportSpeciesData & { tsn_id?: string | number }
    [key: string]: unknown
  }>
}

interface AnimalFormProps {
  index: number
  data: AnimalEntry
  onChange: (index: number, field: string, value: string) => void
  onRemove: (index: number) => void
  setSpeciesList: React.Dispatch<React.SetStateAction<SpeciesItem[]>>
  speciesList: SpeciesItem[]
  mastersData: MastersData
  counts: GenderCounts
  animals: AnimalEntry[]
}

interface AddAnimalCountDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  setSpeciesList: React.Dispatch<React.SetStateAction<SpeciesItem[]>>
  speciesList: SpeciesItem[]
  onDone: (
    speciesId: string | number,
    genderCounts: { male_count: number; female_count: number; undeterminate_count: number },
    animals: Array<{
      animal_type: string
      animal_count: number
      gender: string
      identifier_type: string
      identifier_value: string
    }>
  ) => void
  currentSpeciesId: string | number | null
  selectedExportData: SelectedExportData
  selectedSpeciesData: Species & { common_name?: string; scientific_name?: string; default_icon?: string }
  mastersData: MastersData
  setanimalDetailsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const AnimalForm = ({
  index,
  data,
  onChange,
  onRemove,
  setSpeciesList,
  speciesList,
  mastersData,
  counts,
  animals
}: AnimalFormProps) => {
  const { t } = useTranslation()
  const rawGenders = mastersData?.genders?.flat() || []

  const getValidGender = (gender: string | string[] | undefined): string => {
    if (typeof gender === 'string') return gender.toLowerCase()
    if (Array.isArray(gender) && gender.length > 0) return gender[0].toLowerCase()

    return 'unknown'
  }

  const normalizedGenders = rawGenders.map(getValidGender)

  const genderUsage = animals.reduce<Record<string, number>>((acc, animal, i) => {
    const g = getValidGender(animal.gender)
    if (i !== index && g) acc[g] = (acc[g] || 0) + 1

    return acc
  }, {})

  // Filter available genders based on counts
  const availableGenders = normalizedGenders.filter(gender => {
    const limit = Number((counts as unknown as Record<string, number>)[gender]) || 0
    const used = genderUsage[gender] || 0

    const isCurrentAnimalGender = getValidGender(data.gender) === gender

    return isCurrentAnimalGender || used < limit
  })

  const currentIdType = mastersData?.identifier_type?.find(type => type.key === data.identifierType)

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4, position: 'relative' }}>
      <Typography fontWeight={500} mb={5}>
        {t('compliance_module.animal_details')}
      </Typography>
      <IconButton onClick={() => onRemove(index)} sx={{ position: 'absolute', top: 10, right: 10 }}>
        <CloseIcon />
      </IconButton>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
          <Select
            fullWidth
            value={data.gender}
            onChange={e => onChange(index, 'gender', e.target.value)}
            displayEmpty
            renderValue={selected => {
              if (!selected) {
                return <span style={{ color: '#9e9e9e' }}>{`${t('compliance_module.gender')}*`}</span>
              }

              return selected.charAt(0).toUpperCase() + selected.slice(1)
            }}
          >
            {availableGenders.map(gender => (
              <MenuItem key={gender} value={gender}>
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
          <Select
            fullWidth
            value={currentIdType?.key || ''}
            onChange={e => {
              const selectedType = mastersData.identifier_type?.find(type => type.label === e.target.value)
              onChange(index, 'identifierType', e.target.value)
            }}
            displayEmpty
            renderValue={selected => {
              if (!selected) {
                return <span style={{ color: '#9e9e9e' }}>{`${t('compliance_module.select_identifier_type')}*`}</span>
              }

              return (selected as string).charAt(0).toUpperCase() + (selected as string).slice(1)
            }}
          >
            {mastersData.identifier_type?.map(idType => (
              <MenuItem key={idType.id} value={idType.key}>
                {idType.label}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={`${t('compliance_module.identifier_details')}*`}
            value={data.identifier}
            onChange={e => onChange(index, 'identifier', e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}

const AddanimalCountDrawer = ({
  open,
  onClose,
  title,
  setSpeciesList,
  speciesList,
  onDone,
  currentSpeciesId,
  selectedExportData,
  selectedSpeciesData,
  mastersData,
  setanimalDetailsDrawerOpen
}: AddAnimalCountDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

  // Find the current species data
  const currentSpecies =
    selectedExportData.others.find(item => item.species?.tsn_id === currentSpeciesId)?.species ||
    selectedExportData.export.flatMap(exp => (exp.species || []).filter(s => s.tsn_id === currentSpeciesId))[0]

  // Initialize state with existing values
  const [counts, setCounts] = useState<GenderCounts>({
    male: currentSpecies?.male_count || 0,
    female: currentSpecies?.female_count || 0,
    unknown: currentSpecies?.undeterminate_count || 0
  })

  const [animals, setAnimals] = useState<AnimalEntry[]>(
    currentSpecies?.animals?.map(animal => {
      let gender = animal.gender
      if (Array.isArray(gender)) {
        gender = gender[0] || 'unknown'
      }

      return {
        gender: (gender as string).toLowerCase(),
        identifierType: animal.identifier_type || '',
        identifier: animal.identifier_value || ''
      }
    }) || []
  )

  useEffect(() => {
    if (currentSpeciesId) {
      const currentSpecies =
        selectedExportData.others.find(item => item.species?.tsn_id === currentSpeciesId)?.species ||
        selectedExportData.export.flatMap(exp => (exp.species || []).filter(s => s.tsn_id === currentSpeciesId))[0]

      setCounts({
        male: currentSpecies?.male_count || 0,
        female: currentSpecies?.female_count || 0,
        unknown: currentSpecies?.undeterminate_count || 0
      })

      setAnimals(
        currentSpecies?.animals?.map(animal => {
          let gender = animal.gender
          if (Array.isArray(gender)) {
            gender = gender[0] || 'unknown'
          }

          return {
            gender: (gender as string).toLowerCase(),
            identifierType: animal.identifier_type || '',
            identifier: animal.identifier_value || ''
          }
        }) || []
      )
    } else {
      setCounts({ male: 0, female: 0, unknown: 0 })
      setAnimals([])
    }
  }, [currentSpeciesId, selectedExportData, open])

  const handleAddAnimal = () => {
    const genderCount: Record<string, number> = { Male: 0, Female: 0, Unknown: 0 }

    animals.forEach(animal => {
      genderCount[animal.gender] = (genderCount[animal.gender] || 0) + 1
    })

    const maleLimit = Number(counts.male)
    const femaleLimit = Number(counts.female)
    const unknownLimit = Number(counts.unknown)

    if (
      genderCount['Male'] < maleLimit ||
      genderCount['Female'] < femaleLimit ||
      genderCount['Unknown'] < unknownLimit
    ) {
      setAnimals(prev => [...prev, { gender: '', identifierType: '', identifier: '' }])
    } else {
      Toaster({ type: 'error', message: t('compliance_module.animal_limit_reached_for_each_gender') })
    }
  }

  const getValidGender = (gender: string | string[] | undefined): string => {
    if (typeof gender === 'string') return gender.toLowerCase()
    if (Array.isArray(gender) && gender.length > 0) return gender[0].toLowerCase()

    return 'unknown'
  }

  const handleChange = (index: number, field: string, value: string) => {
    setAnimals(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }

      return updated
    })
  }

  const handleRemove = (index: number) => {
    setAnimals(prev => prev.filter((_, i) => i !== index))
  }

  const canAddAnimal = animals.length < Number(counts.male) + Number(counts.female) + Number(counts.unknown)

  const handleSelectAnimals = () => {
    const genderCounts = {
      male_count: counts.male,
      female_count: counts.female,
      undeterminate_count: counts.unknown
    }

    const genderTotals = {
      male: animals.filter(a => a.gender === 'male').length,
      female: animals.filter(a => a.gender === 'female').length,
      unknown: animals.filter(a => a.gender === 'unknown').length
    }

    if (genderTotals.male > genderCounts.male_count) {
      return Toaster({
        type: 'error',

        //message: `Animal details count for male gender (${genderTotals.male}) must be ≤ male count entered (${genderCounts.male_count})`
        message: t('compliance_module.entered_count_does_not_match_selected_animals')
      })
    }

    if (genderTotals.female > genderCounts.female_count) {
      return Toaster({
        type: 'error',

        // message: `Animal details count for female gender (${genderTotals.female}) must be ≤ female count entered (${genderCounts.female_count})`
        message: t('compliance_module.entered_count_does_not_match_selected_animals')
      })
    }

    if (genderTotals.unknown > genderCounts.undeterminate_count) {
      return Toaster({
        type: 'error',

        // message: `Animal details count for unknown gender (${genderTotals.unknown}) must be ≤ unknown count entered (${genderCounts.undeterminate_count})`
        message: t('compliance_module.entered_count_does_not_match_selected_animals')
      })
    }

    const hasInvalidAnimal = animals.some(a => !a.gender || !a.identifierType || !a.identifier.trim())

    if (hasInvalidAnimal) {
      return Toaster({
        type: 'error',
        message: t('compliance_module.all_animal_fields_are_required')
      })
    }

    const transformedAnimals = animals.map(animal => ({
      animal_type: animal.gender === 'unknown' ? 'group' : 'single',
      animal_count: 1,
      gender: getValidGender(animal.gender),
      identifier_type: animal.identifierType,
      identifier_value: animal.identifier
    }))

    onDone(currentSpeciesId!, genderCounts, transformedAnimals)
    setanimalDetailsDrawerOpen(false)
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

        <Box
          display='flex'
          alignItems='center'
          gap={2}
          sx={{
            background: theme.palette.common.white,
            mt: 3,
            mx: 5,
            px: 5,
            pt: 3,
            pb: 4,
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '8px'
          }}
        >
          <Avatar
            src={selectedSpeciesData?.default_icon || 'images/housing/Enclosure icon.png'}
            sx={{ width: 40, height: 40 }}
          />
          <Box sx={{ ml: 2 }}>
            <Typography fontWeight={600} color={theme.palette.customColors.OnSurfaceVariant}>
              {selectedSpeciesData.common_name || '-'}
            </Typography>
            <Typography fontStyle='italic' color={theme.palette.customColors.OnSurfaceVariant} fontWeight={400}>
              {selectedSpeciesData.scientific_name || '-'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 5, overflowY: 'auto', flexGrow: 1, height: '100vh' }}>
          {/* Total Animal Count */}
          <Typography fontWeight={600} color={theme.palette.customColors.OnSurfaceVariant} sx={{ mb: 2, mt: 4 }}>
            {t('compliance_module.total_animal_count')}
          </Typography>
          <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={500} mb={2}>
              {t('compliance_module.gender_wise_count')}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type='number'
                  label={t('compliance_module.male_hash')}
                  value={counts.male}
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                  onChange={e => {
                    const value = e.target.value
                    if (value === '') {
                      setCounts(prev => ({ ...prev, male: 0 }))
                    } else {
                      const numeric = Math.max(0, parseInt(value, 10))
                      setCounts(prev => ({ ...prev, male: isNaN(numeric) ? 0 : numeric }))
                    }
                  }}
                  inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type='number'
                  label={t('compliance_module.female_hash')}
                  value={counts.female}
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                  onChange={e => {
                    const value = e.target.value
                    if (value === '') {
                      setCounts(prev => ({ ...prev, female: 0 }))
                    } else {
                      const numeric = Math.max(0, parseInt(value, 10))
                      setCounts(prev => ({ ...prev, female: isNaN(numeric) ? 0 : numeric }))
                    }
                  }}
                  inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type='number'
                  label={t('compliance_module.unknown_hash')}
                  value={counts.unknown}
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                  onChange={e => {
                    const value = e.target.value
                    if (value === '') {
                      setCounts(prev => ({ ...prev, unknown: 0 }))
                    } else {
                      const numeric = Math.max(0, parseInt(value, 10))
                      setCounts(prev => ({ ...prev, unknown: isNaN(numeric) ? 0 : numeric }))
                    }
                  }}
                  inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>
            </Grid>
          </Paper>

          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography fontWeight={600} color={theme.palette.customColors.OnSurfaceVariant}>
              {t('compliance_module.animals_with_identifier')}
            </Typography>
            <Button
              variant='text'
              startIcon={<AddIcon />}
              sx={{ color: '#19966E', fontWeight: 600 }}
              onClick={handleAddAnimal}
              disabled={!canAddAnimal}
            >
              {t('add_animal')}
            </Button>
          </Box>

          {animals?.length > 0 || canAddAnimal ? (
            animals.map((animal, index) => (
              <AnimalForm
                key={index}
                index={index}
                data={animal}
                onChange={handleChange}
                onRemove={handleRemove}
                mastersData={mastersData}
                counts={counts}
                animals={animals}
                setSpeciesList={setSpeciesList}
                speciesList={speciesList}
              />
            ))
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
              {t('no_data_available')}
            </Typography>
          )}
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
            disabled={!counts.male && !counts.female && !counts.unknown}
            onClick={handleSelectAnimals}
          >
            {t('compliance_module.select_animals')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddanimalCountDrawer)
