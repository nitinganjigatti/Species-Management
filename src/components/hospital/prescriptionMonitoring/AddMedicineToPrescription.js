import React, { useState } from 'react'
import { Box, Grid, Typography, Button } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import ClinicalAssessmentList from 'src/components/hospital/ClinicalAssessment/ClinicalAssessmentList'
import SelectedClinicalAssessment from 'src/components/hospital/ClinicalAssessment/SelectedClinicalAssessment'
import AddEditClinicalAsmntDrawer from 'src/components/hospital/drawer/AddEditClinicalAsmntDrawer'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import PrescriptionMedicineList from 'src/views/pages/hospital/prescription-monitoring/PrescriptionMedicineList'
import ScheduleMedicine from 'src/views/pages/hospital/prescription-monitoring/ScheduleMedicine'

export default function AddMedicineToPrescription() {
  const theme = useTheme()
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [temporarilySelectedMedicine, setTemporarilySelectedMedicine] = useState([])
  const [medicineDrawerOpen, setMedicineDrawerOpen] = useState(false)
  const [clinicalAssessment, setClinicalAssessment] = useState('')
  const [prognosisValue, setPrognosisValue] = useState('')
  const [chronicValue, setChronicValue] = useState('No')
  const [medicineNotes, setMedicineNotes] = useState('')
  const [medicineStatus, setMedicineStatus] = useState('')

  const medicineList = [
    // Respiratory Medications
    {
      id: 'MED001',
      label: 'Dextromethorphan',
      genericName: 'Dextromethorphan Hydrobromide',
      type: 'Respiratory',
      indication: 'Cough suppressant',
      symptoms: ['Coughing', 'Labored Breathing']
    },
    {
      id: 'MED002',
      label: 'Robitussin',
      genericName: 'Guaifenesin',
      type: 'Respiratory',
      indication: 'Expectorant for chest congestion',
      symptoms: ['Coughing', 'Labored Breathing']
    },
    {
      id: 'MED003',
      label: 'Ventolin',
      genericName: 'Salbutamol',
      type: 'Respiratory',
      indication: 'Bronchodilator for asthma',
      symptoms: ['Labored Breathing', 'Coughing']
    },
    {
      id: 'MED004',
      label: 'Azithral',
      genericName: 'Azithromycin',
      type: 'Respiratory',
      indication: 'Antibiotic for respiratory infections',
      symptoms: ['Nasal or eye discharge', 'Coughing']
    },
    {
      id: 'MED005',
      label: 'Augmentin',
      genericName: 'Amoxicillin + Clavulanic Acid',
      type: 'Respiratory',
      indication: 'Antibiotic for bacterial infections',
      symptoms: ['Nasal or eye discharge', 'Coughing']
    },

    // Digestive Medications
    {
      id: 'MED006',
      label: 'Emeset',
      genericName: 'Ondansetron',
      type: 'Digestive',
      indication: 'Anti-nausea, appetite improvement',
      symptoms: ['Loss of appetite']
    },
    {
      id: 'MED007',
      label: 'Digene',
      genericName: 'Magnesium Hydroxide + Aluminium Hydroxide',
      type: 'Digestive',
      indication: 'Antacid for stomach upset',
      symptoms: ['Loss of appetite']
    },
    {
      id: 'MED008',
      label: 'Pantop',
      genericName: 'Pantoprazole',
      type: 'Digestive',
      indication: 'Proton pump inhibitor for acidity',
      symptoms: ['Loss of appetite']
    },
    {
      id: 'MED009',
      label: 'Domperidone',
      genericName: 'Domperidone',
      type: 'Digestive',
      indication: 'Anti-nausea, prokinetic agent',
      symptoms: ['Loss of appetite']
    },

    {
      id: 'MED010',
      label: 'Dolo',
      genericName: 'Paracetamol',
      type: 'Musculoskeletal',
      indication: 'Pain relief and fever reduction',
      symptoms: ['Limping or abnormal gait']
    },
    {
      id: 'MED011',
      label: 'Brufen',
      genericName: 'Ibuprofen',
      type: 'Musculoskeletal',
      indication: 'NSAID for pain and inflammation',
      symptoms: ['Limping or abnormal gait']
    },
    {
      id: 'MED012',
      label: 'Voveran',
      genericName: 'Diclofenac',
      type: 'Musculoskeletal',
      indication: 'NSAID for pain and inflammation',
      symptoms: ['Limping or abnormal gait']
    },
    {
      id: 'MED013',
      label: 'Gabapin',
      genericName: 'Gabapentin',
      type: 'Musculoskeletal',
      indication: 'Neuropathic pain relief',
      symptoms: ['Limping or abnormal gait']
    },
    {
      id: 'MED014',
      label: 'Tramacet',
      genericName: 'Tramadol + Paracetamol',
      type: 'Musculoskeletal',
      indication: 'Moderate to severe pain relief',
      symptoms: ['Limping or abnormal gait']
    },

    {
      id: 'MED015',
      label: 'Lasix',
      genericName: 'Furosemide',
      type: 'General',
      indication: 'Diuretic for fluid retention',
      symptoms: ['Swelling']
    },
    {
      id: 'MED016',
      label: 'Aldactone',
      genericName: 'Spironolactone',
      type: 'General',
      indication: 'Diuretic, reduces swelling',
      symptoms: ['Swelling']
    }
  ]

  // Select a medicine to add details
  const handleMedicineSelect = medicine => {
    // debugger
    setTemporarilySelectedMedicine(medicine)
    setMedicineDrawerOpen(true)
  }

  // Add medicine details to the selected list
  const addMedicineDetails = details => {
    setSelectedMedicines(prev => [...prev, { ...temporarilySelectedMedicine, ...details }])
    setTemporarilySelectedMedicine(null)
    setMedicineDrawerOpen(false)
  }

  // Remove a medicine from the selected list
  const removeMedicine = medicineLabel => {
    setSelectedMedicines(prev => prev.filter(med => med.label !== medicineLabel))
  }

  // List of medicines not yet selected
  const availableMedicines = medicineList.filter(med => !selectedMedicines.some(sel => sel.label === med.label))

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
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Select the medicine to
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <TreatmentTypeRadioButtons label='Schedule' />
        </Grid>

        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <TreatmentTypeRadioButtons label='Direct Administer' />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <PrescriptionMedicineList
            medicineList={medicineList}
            temporarilySelected={temporarilySelectedMedicine}
            selectedSymptoms={selectedMedicines.map(med => med.label)}
            onSelect={handleMedicineSelect}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <ScheduleMedicine />
        </Grid>
      </Grid>

      <ActionButtons
        cancelLabel='CANCEL'
        addLabel='ADD'
        onCancel={() => console.log('Cancelled')}
        onAdd={() => console.log('Added')}
        width={200}
        height={50}
      />
    </Box>
  )
}
