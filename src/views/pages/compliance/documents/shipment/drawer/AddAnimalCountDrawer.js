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
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import Toaster from 'src/components/Toaster'

const AnimalForm = ({ index, data, onChange, onRemove, setSpeciesList, speciesList, mastersData, counts, animals }) => {

  const rawGenders = mastersData?.genders?.flat() || []

  const getValidGender = gender => {
    if (typeof gender === 'string') return gender.toLowerCase()
    if (Array.isArray(gender) && gender.length > 0) return gender[0].toLowerCase()
    return 'unknown'
  }

  const normalizedGenders = rawGenders.map(getValidGender)

  const genderUsage = animals.reduce((acc, animal, i) => {
    const g = getValidGender(animal.gender)
    if (i !== index && g) acc[g] = (acc[g] || 0) + 1
    return acc
  }, {})

  // const availableGenders = normalizedGenders.filter(g => {
  //   const limit = Number(counts[g]) || 0
  //   const used = genderUsage[g] || 0
  //   return used < limit
  // })

  const availableGenders = normalizedGenders.filter(g => {
    const limit = Number(counts[g]) || 0
    const used = genderUsage[g] || 0

    // Always allow already selected gender
    return used < limit || animals.some(animal => animal.gender === g)
  })

  const currentIdType = mastersData?.identifier_type?.find(type => type.key === data.identifierType)

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4, position: 'relative' }}>
      <Typography fontWeight={500} mb={5}>
        Animal Details
      </Typography>
      <IconButton onClick={() => onRemove(index)} sx={{ position: 'absolute', top: 10, right: 10 }}>
        <CloseIcon />
      </IconButton>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
          <Select fullWidth value={data.gender} onChange={e => onChange(index, 'gender', e.target.value)} displayEmpty>
            <MenuItem value='' disabled>
              Gender*
            </MenuItem>
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
              const selectedType = mastersData.identifier_type.find(type => type.label === e.target.value)
              onChange(index, 'identifierType', e.target.value)
            }}
            displayEmpty
          >
            <MenuItem value='' disabled>
              Select Identifier Type*
            </MenuItem>
            {mastersData.identifier_type.map(idType => (
              <MenuItem key={idType.id} value={idType.key}>
                {idType.label}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label='Identifier Details*'
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
}) => {
  const theme = useTheme()
  // Find the current species data
  const currentSpecies =
    selectedExportData.others.find(item => item.species?.tsn_id === currentSpeciesId)?.species ||
    selectedExportData.export.flatMap(exp => exp.species.filter(s => s.tsn_id === currentSpeciesId))[0]

  // Initialize state with existing values
  const [counts, setCounts] = useState({
    male: currentSpecies?.male_count || 0,
    female: currentSpecies?.female_count || 0,
    unknown: currentSpecies?.undeterminate_count || 0
  })

  const [animals, setAnimals] = useState(
    currentSpecies?.animals?.map(animal => {
      let gender = animal.gender
      if (Array.isArray(gender)) {
        gender = gender[0] || 'unknown'
      }

      return {
        gender: gender.toLowerCase(),
        identifierType: animal.identifier_type,
        identifier: animal.identifier_value
      }
    }) || []
  )

  useEffect(() => {
    if (currentSpeciesId) {
      const currentSpecies =
        selectedExportData.others.find(item => item.species?.tsn_id === currentSpeciesId)?.species ||
        selectedExportData.export.flatMap(exp => exp.species.filter(s => s.tsn_id === currentSpeciesId))[0]

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
            gender: gender.toLowerCase(),
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
    const genderCount = { Male: 0, Female: 0, Unknown: 0 }

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
      alert('Animal limit reached for each gender')
    }
  }

  const getValidGender = gender => {
    if (typeof gender === 'string') return gender.toLowerCase()
    if (Array.isArray(gender) && gender.length > 0) return gender[0].toLowerCase()
    return 'unknown' 
  }

  // const handleChange = (index, field, value) => {
  //   const updated = [...animals]
  //   updated[index][field] = value
  //   setAnimals(updated)
  // }

  const handleChange = (index, field, value) => {
    setAnimals(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }

  const handleRemove = index => {
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
        message: `Animal details count for male gender (${genderTotals.male}) must be ≤ male count entered (${genderCounts.male_count})`
      })
    }

    if (genderTotals.female > genderCounts.female_count) {
      return Toaster({
        type: 'error',
        message: `Animal details count for female gender (${genderTotals.female}) must be ≤ female count entered (${genderCounts.female_count})`
      })
    }

    if (genderTotals.unknown > genderCounts.undeterminate_count) {
      return Toaster({
        type: 'error',
        message: `Animal details count for unknown gender (${genderTotals.unknown}) must be ≤ unknown count entered (${genderCounts.undeterminate_count})`
      })
    }

    const hasInvalidAnimal = animals.some(a => !a.gender || !a.identifierType || !a.identifier.trim())

    if (hasInvalidAnimal) {
      return Toaster({
        type: 'error',
        message: 'All animal fields (gender, identifier type, identifier) are required.'
      })
    }

    const transformedAnimals = animals.map(animal => ({
      animal_type: animal.gender === 'unknown' ? 'group' : 'single',
      animal_count: 1,
      gender: getValidGender(animal.gender),
      identifier_type: animal.identifierType,
      identifier_value: animal.identifier
    }))

    onDone(currentSpeciesId, genderCounts, transformedAnimals)
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
     
        <Box sx={{ px: 5, pt: 4, pb: 2, background: '#fff' }}>
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

        <Box
          display='flex'
          alignItems='center'
          gap={2}
          sx={{
            background: '#fff',
            mt: 3,
            mx: 5,
            px: 5,
            pt: 3,
            pb: 4,
            border: '1px solid #C3CEC7',
            borderRadius: '8px'
          }}
        >
          <Avatar
            src={selectedSpeciesData?.default_icon || 'images/housing/Enclosure icon.png'}
            sx={{ width: 40, height: 40 }}
          />
          <Box sx={{ ml: 2 }}>
            <Typography fontWeight={600} color='#44544A'>
              {selectedSpeciesData.common_name || '-'}
            </Typography>
            <Typography fontStyle='italic' color='#44544A' fontWeight={400}>
              {selectedSpeciesData.scientific_name || '-'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 5, overflowY: 'auto', flexGrow: 1, height: '100vh' }}>
          <Typography fontWeight={600} color='#44544A' sx={{ mb: 2, mt: 4 }}>
            Total Animal Count
          </Typography>
          <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={500} mb={2}>
              Gender Wise Count
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='# Male'
                  value={counts.male}
                  onChange={e => {
                    const value = e.target.value
                    if (value === '') {
                      setCounts(prev => ({ ...prev, male: 0 }))
                    } else {
                      const numeric = Math.max(0, parseInt(value, 10))
                      setCounts(prev => ({ ...prev, male: isNaN(numeric) ? 0 : numeric }))
                    }
                  }}
                  slotProps={{
                    input: {
                      min: 0,
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='# Female'
                  value={counts.female}
                  onChange={e => {
                    const value = e.target.value
                    if (value === '') {
                      setCounts(prev => ({ ...prev, female: 0 }))
                    } else {
                      const numeric = Math.max(0, parseInt(value, 10))
                      setCounts(prev => ({ ...prev, female: isNaN(numeric) ? 0 : numeric }))
                    }
                  }}
                  slotProps={{
                    input: {
                      min: 0,
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='# Unknown'
                  value={counts.unknown}
                  onChange={e => {
                    const value = e.target.value
                    if (value === '') {
                      setCounts(prev => ({ ...prev, unknown: 0 }))
                    } else {
                      const numeric = Math.max(0, parseInt(value, 10))
                      setCounts(prev => ({ ...prev, unknown: isNaN(numeric) ? 0 : numeric }))
                    }
                  }}
                  slotProps={{
                    input: {
                      min: 0,
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography fontWeight={600} color='#44544A'>
              Animals with identifier
            </Typography>
            <Button
              variant='text'
              startIcon={<AddIcon />}
              sx={{ color: '#19966E', fontWeight: 600 }}
              onClick={handleAddAnimal}
              disabled={!canAddAnimal}
            >
              Add Animal
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
              />
            ))
          ) : (
            <Typography
              sx={{ background: '#0000000D', p: 12, textAlign: 'center', borderRadius: '8px', fontWeight: '500' }}
            >
              No Data Available
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
            Select Animals
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddanimalCountDrawer)
