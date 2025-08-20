import React, { useState } from 'react'
import { Box, Grid, Typography, Button } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import ClinicalAssessmentList from 'src/components/hospital/ClinicalAssessment/ClinicalAssessmentList'
import SelectedClinicalAssessment from 'src/components/hospital/ClinicalAssessment/SelectedClinicalAssessment'
import AddEditClinicalAsmntDrawer from 'src/components/hospital/drawer/AddEditClinicalAsmntDrawer'

export default function AddClinicalAssessmentPage() {
  const theme = useTheme()
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [temporarilySelected, setTemporarilySelected] = useState(null)
  const [clinicalDrawerOpen, setClinicalDrawerOpen] = useState(false)
  const [severity, setSeverity] = useState('')
  const [durationValue, setDurationValue] = useState('')
  const [durationUnit, setDurationUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')

  const allAssessments = [
    { label: 'Labored Breathing', type: 'Respiratory' },
    { label: 'Loss of appetite', type: 'Digestive' },
    { label: 'Limping or abnormal gait', type: 'Musculoskeletal' },
    { label: 'Swelling', type: 'General' },
    { label: 'Lumps', type: 'General' },
    { label: 'Nasal or eye discharge', type: 'Respiratory' },
    { label: 'Coughing', type: 'Respiratory' },
    { label: 'Skin lesions', type: 'Dermatological' },
    { label: 'Seizures', type: 'Neurological' },
    { label: 'Loss of balance or coordination', type: 'Neurological' }
  ]

  const handleSymptomSelect = symptom => {
    setTemporarilySelected(symptom)
    setClinicalDrawerOpen(true)
  }

  const addSymptomDetails = details => {
    setSelectedSymptoms(prev => [...prev, { name: temporarilySelected, ...details }])
    setTemporarilySelected(null)
    setClinicalDrawerOpen(false)
  }

  const cancelSymptomSelection = () => {
    setTemporarilySelected(null)
    setClinicalDrawerOpen(false)
  }

  const removeSymptom = symptomName => {
    setSelectedSymptoms(prev => prev.filter(s => s.name !== symptomName))
  }

  const availableSymptoms = allAssessments.filter(symptom => !selectedSymptoms.some(s => s.name === symptom.label))

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
            Add Clinical assessment
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <ClinicalAssessmentList
            symptoms={availableSymptoms}
            temporarilySelected={temporarilySelected}
            selectedSymptoms={selectedSymptoms.map(s => s.name)}
            onSelect={handleSymptomSelect}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SelectedClinicalAssessment selected={selectedSymptoms} onRemove={removeSymptom} severity={severity} />
        </Grid>
      </Grid>

      <ActionButtons
        cancelLabel='CANCEL'
        addLabel='ADD'
        onCancel={() => console.log('Cancelled')}
        onAdd={() => console.log('Added')}
        Width={200}
        Height={50}
      />

      {temporarilySelected && (
        <AddEditClinicalAsmntDrawer
          open={clinicalDrawerOpen}
          onClose={cancelSymptomSelection}
          selectedSymptom={temporarilySelected}
          severity={severity}
          setSeverity={setSeverity}
          durationValue={durationValue}
          setDurationValue={setDurationValue}
          durationUnit={durationUnit}
          setDurationUnit={setDurationUnit}
          notes={notes}
          status={status}
          setStatus={setStatus}
          setNotes={setNotes}
          onSave={addSymptomDetails}
        />
      )}
    </Box>
  )
}
