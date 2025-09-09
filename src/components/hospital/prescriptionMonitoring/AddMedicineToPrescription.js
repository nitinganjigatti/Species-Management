import React, { useState } from 'react'
import { Box, Grid, Typography, Button } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import PrescriptionMedicineList from 'src/views/pages/hospital/prescription-monitoring/PrescriptionMedicineList'
import ScheduleMedicine from 'src/views/pages/hospital/prescription-monitoring/ScheduleMedicine'
import MedicinePrescriptionCard from 'src/views/pages/hospital/prescription-monitoring/MedicinePrescriptionCard'

export default function AddMedicineToPrescription() {
  const theme = useTheme()

  // Form validation schema
  const prescriptionSchema = yup.object({
    selectedMedicineId: yup
      .string()
      .trim()
      .required('Please select a medicine')
      .test('is-selected', 'Please select a medicine', value => value && value.length > 0),
    selectedMedicine: yup
      .object()
      .nullable()
      .required('Please select a medicine')
      .test('is-valid-medicine', 'Please select a valid medicine', value => value && value.id && value.label),
    selectMedicineType: yup.string().oneOf(['Schedule', 'Direct Administer']).required('Please select medicine type'),

    // Schedule form data
    frequency: yup.string().when('selectMedicineType', {
      is: 'Schedule',
      then: () => yup.string().required('Please select a frequency')
    }),
    doseType: yup.string().when('selectMedicineType', {
      is: 'Schedule',
      then: () => yup.string().required('Please select a dose type')
    }),
    schedules: yup.array().when('selectMedicineType', {
      is: 'Schedule',
      then: () =>
        yup
          .array()
          .of(
            yup.object({
              time: yup.string().required('Time is required'),
              quantity: yup
                .string()
                .required('Quantity is required')
                .matches(/^[0-9]*$/, 'Quantity must be a number')
                .test('positive', 'Quantity must be greater than 1', value => Number(value) > 1)
                .test('max', 'Quantity cannot exceed 100', value => Number(value) <= 100),
              unit: yup.string().required('Please select a unit')
            })
          )
          .min(1, 'At least one schedule time is required')
    }),

    deliveryRoute: yup.string().required('Please select a delivery route'),
    prescriptionStartDate: yup.string().required('Start date is required'),
    dosageDuration: yup
      .object({
        value: yup
          .number()
          .transform((value, originalValue) => (originalValue === '' ? undefined : value))
          .min(1, 'Duration must be at least 1')
          .max(365, 'Duration cannot exceed 365')
          .required('Duration value is required'),
        unit: yup.string().required('Please select duration unit')
      })
      .required('Dosage duration is required'),

    notes: yup.string().max(500, 'Notes cannot exceed 500 characters').required('Notes are required'),

    // Clinical assessment data
    clinicalAssessment: yup.string(),
    prognosisValue: yup.string(),
    chronicValue: yup.string(),
    medicineStatus: yup.string()
  })

  const defaultValues = {
    selectedMedicineId: '',
    selectedMedicine: null,
    selectMedicineType: 'Schedule',
    frequency: 'everyday',
    doseType: 'fixed-dose',
    schedules: [
      {
        time: '',
        quantity: '',
        unit: ''
      }
    ],
    deliveryRoute: 'oral',
    prescriptionStartDate: null,
    dosageDuration: {
      value: 5,
      unit: 'days'
    },
    notes: '',
    clinicalAssessment: '',
    prognosisValue: '',
    chronicValue: 'No',
    medicineStatus: '',
    controlSubstanceFiles: []
  }

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(prescriptionSchema),
    mode: 'onBlur',
    shouldUnregister: false
  })

  // Only one medicine can be selected at a time
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [temporarilySelectedMedicine, setTemporarilySelectedMedicine] = useState(null)
  const [medicineDrawerOpen, setMedicineDrawerOpen] = useState(false)
  const [prescriptionCardOpen, setPrescriptionCardOpen] = useState(false)
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

  // Select a medicine to add details (single-select)
  const handleMedicineSelect = medicine => {
    if (medicine) {
      setValue('selectedMedicineId', medicine.id, { shouldValidate: true })
      setValue('selectedMedicine', medicine, { shouldValidate: true })
      setTemporarilySelectedMedicine(medicine)
      setSelectedMedicine(medicine)
      setMedicineDrawerOpen(true)
    }
  }

  // Remove the selected medicine
  const removeMedicine = () => {
    setValue('selectedMedicineId', '', { shouldValidate: true })
    setValue('selectedMedicine', null, { shouldValidate: true })
    setSelectedMedicine(null)
    setTemporarilySelectedMedicine(null)
  }

  // Handle prescription card actions
  const handleOpenPrescriptionCard = () => {
    setPrescriptionCardOpen(true)
  }

  const handleClosePrescriptionCard = () => {
    setPrescriptionCardOpen(false)
  }

  const handleStopMedicine = medicineData => {
    console.log('Stop medicine:', medicineData)

    // Add your logic here
  }

  const handleAddNewDosage = medicineData => {
    console.log('Add new dosage:', medicineData)

    // Add your logic here
  }

  const handleRefreshEntry = (entryId, medicineData) => {
    console.log('Refresh entry:', entryId, medicineData)

    // Add your logic here
  }

  // Add medicine details to the selected medicine (if needed)
  const addMedicineDetails = details => {
    setSelectedMedicine({ ...temporarilySelectedMedicine, ...details })
    setTemporarilySelectedMedicine(null)
    setMedicineDrawerOpen(false)
  }

  // List of medicines not yet selected (for single-select, just filter out the selected one)
  const availableMedicines = selectedMedicine
    ? medicineList.filter(med => med.label !== selectedMedicine.label)
    : medicineList

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
        className='match-height'
        sx={{ mt: 5, mb: 8, background: theme.palette.common.white, px: 6, py: 4, borderRadius: '8px' }}
      >
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Select the medicine to
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <TreatmentTypeRadioButtons
            label='Schedule'
            isSelected={watch('selectMedicineType') === 'Schedule'}
            sx={{
              borderColor: `${theme.palette.customColors.OutlineVariant}`
            }}
            onClick={() => setValue('selectMedicineType', 'Schedule')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <TreatmentTypeRadioButtons
            label='Direct Administer'
            isSelected={watch('selectMedicineType') === 'Direct Administer'}
            sx={{
              borderColor: `${theme.palette.customColors.OutlineVariant}`
            }}
            onClick={() => setValue('selectMedicineType', 'Direct Administer')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 7, lg: 7 }}>
          <PrescriptionMedicineList
            medicineList={medicineList}
            temporarilySelectedMedicine={temporarilySelectedMedicine}
            selectedMedicine={selectedMedicine ? selectedMedicine.label : null}
            onSelect={handleMedicineSelect}
            error={errors.selectedMedicine?.message || errors.selectedMedicineId?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 5 }}>
          <ScheduleMedicine control={control} errors={errors} selectedMedicineTo={watch('selectMedicineType')} />
        </Grid>

        {/* Button to open prescription card */}
        <Grid size={{ xs: 12 }}>
          <Button variant='outlined' onClick={handleOpenPrescriptionCard} sx={{ mt: 2 }}>
            View Medicine Prescription Details
          </Button>
        </Grid>
      </Grid>

      {/* Medicine Prescription Card Drawer */}
      <MedicinePrescriptionCard
        open={prescriptionCardOpen}
        onClose={handleClosePrescriptionCard}
        medicineData={{
          name: selectedMedicine?.label || 'Dolo 650 tablet',
          medId: selectedMedicine?.id || 'MED - 12345/25',
          startDate: '1 Jan 2025',
          endDate: '04 Jan 2025',
          dosage: '3 Times',
          frequency: 'Everyday',
          duration: '3 days',
          deliveryRoute: 'Oral',
          notes: 'Lorem ipsum dolor sit amet consectetur adipiscin ipsum dolor...',
          lastEdited: 'Last edited on 10:34 AM • 02 Jan 2025',
          defaultTab: 2
        }}
        dosageEntries={[
          {
            id: 1,
            time: '07:00 AM',
            status: 'Administered',
            variant: 'administered',
            dosage: '10 mg/kg',
            amount: '310 mg',
            wastage: 'Wastage - 200 mg',
            wastageNote: 'Lorem impsum doal sit amet sit lip alu lorem ipsum dolar',
            batchNumber: 'BTC2345',
            administeredBy: 'Jordan Stevenson',
            administeredAt: '02 Jan 2025 • 12 : 35 PM',
            icon: 'mdi:check-circle'
          },
          {
            id: 2,
            time: '11:00 AM',
            status: 'Skipped',
            variant: 'skipped',
            dosage: '10 mg/kg',
            amount: '310 mg',
            administeredBy: 'Jordan Stevenson',
            administeredAt: '02 Jan 2025 • 12 : 35 PM',
            icon: 'jam:stop-sign'
          },
          {
            id: 3,
            time: '04:00 PM',
            status: 'Stopped',
            variant: 'stopped',
            dosage: '10 mg/kg',
            amount: '310 mg',
            administeredBy: 'Jordan Stevenson',
            administeredAt: '02 Jan 2025 • 12 : 35 PM',
            icon: 'jam:stop-sign',
            isStrikethrough: true
          }
        ]}
        dateOptions={[
          { label: '2025', value: 0, isYear: true },
          { label: 'Sun 01 Jan', value: 1 },
          { label: 'Mon 02 Jan', value: 2, hasStatus: true },
          { label: 'Tue 03 Jan', value: 3 },
          { label: 'Wed 04 Jan', value: 4 }
        ]}
        onStopMedicine={handleStopMedicine}
        onAddNewDosage={handleAddNewDosage}
        onRefreshEntry={handleRefreshEntry}
      />
      <ActionButtons
        cancelLabel='CANCEL'
        addLabel={watch('selectMedicineType') === 'Direct Administer' ? 'Administer' : 'Schedule'}
        onCancel={() => console.log('Cancelled')}
        onAdd={handleSubmit(data => {
          console.log('Form data to submit:', data)
        })}
        width={200}
        height={50}
      />
    </Box>
  )
}
