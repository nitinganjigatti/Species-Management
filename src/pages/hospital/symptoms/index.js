import React, { useState } from 'react'
import { Box, Grid, Typography, Button } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import SymptomsList from 'src/components/hospital/SymptomsList'
import SelectedSymptoms from 'src/components/hospital/SelectedSymptoms'
import AddEditSymptomDrawer from 'src/components/hospital/drawer/AddEditSymptomDrawer'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'

export default function AddSymptomsPage() {
  const theme = useTheme()
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [temporarilySelected, setTemporarilySelected] = useState(null)
  const [symptomDrawerOpen, setSymptomDrawerOpen] = useState(false)
  const [severity, setSeverity] = useState('Medium')
  const [durationValue, setDurationValue] = useState('')
  const [durationUnit, setDurationUnit] = useState('Days')
  const [notes, setNotes] = useState('')

  const allSymptoms = [
    'Labored Breathing',
    'Loss of appetite',
    'Limping or abnormal gait',
    'Swelling',
    'Lumps',
    'Nasal or eye discharge',
    'Coughing',
    'Skin lesions',
    'Seizures',
    'Loss of balance or coordination'
  ]

  const handleSymptomSelect = symptom => {
    setTemporarilySelected(symptom)
    setSymptomDrawerOpen(true)
  }

  const addSymptomDetails = details => {
    setSelectedSymptoms(prev => [...prev, { name: temporarilySelected, ...details }])
    setTemporarilySelected(null)
    setSymptomDrawerOpen(false)
  }

  const cancelSymptomSelection = () => {
    setTemporarilySelected(null)
    setSymptomDrawerOpen(false)
  }

  const removeSymptom = symptomName => {
    setSelectedSymptoms(prev => prev.filter(s => s.name !== symptomName))
  }

  const availableSymptoms = allSymptoms.filter(symptom => !selectedSymptoms.some(s => s.name === symptom))

  return (
    <Box sx={{ p: 3 }}>
      <AnimalDetails
        image='/leopard.jpg'
        name='Leopard'
        scientificName='Panthera pardus'
        aid='123456'
        admittedDays='6 Days'
        location='Cage 1, Patient Wing 2'
        vet='Dr. Nitin A Ganjigatti'
        ageGender='2y 5m . male'
      />

      <Grid
        container
        spacing={5}
        sx={{ mt: 5, mb: 8, background: theme.palette.common.white, px: 6, py: 4, borderRadius: '8px' }}
      >
        <Grid size={{ xs: 12 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Add Symptoms
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SymptomsList
            symptoms={availableSymptoms}
            temporarilySelected={temporarilySelected}
            selectedSymptoms={selectedSymptoms.map(s => s.name)}
            onSelect={handleSymptomSelect}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SelectedSymptoms selected={selectedSymptoms} onRemove={removeSymptom} severity={severity} />
        </Grid>
      </Grid>

      <ActionButtons />

      {temporarilySelected && (
        <AddEditSymptomDrawer
          open={symptomDrawerOpen}
          onClose={cancelSymptomSelection}
          selectedSymptom={temporarilySelected}
          severity={severity}
          setSeverity={setSeverity}
          durationValue={durationValue}
          setDurationValue={setDurationValue}
          durationUnit={durationUnit}
          setDurationUnit={setDurationUnit}
          notes={notes}
          setNotes={setNotes}
          onSave={addSymptomDetails}
        />
      )}
    </Box>
  )
}
