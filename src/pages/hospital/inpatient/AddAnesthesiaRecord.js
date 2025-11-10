import * as React from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Breadcrumbs
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useForm, FormProvider } from 'react-hook-form'

import BasicDetails from 'src/components/hospital/inpatient/Anesthesia/BasicDetails'
import AttachmentsSection from 'src/components/hospital/inpatient/Anesthesia/AttachmentsSection'
import AnesthesiaSetUpSection from 'src/components/hospital/inpatient/Anesthesia/AnesthesiaSetUp'
import VitalMonitoring from 'src/components/hospital/inpatient/Anesthesia/VitalMonitoring'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import MedicationsGasSection from 'src/components/hospital/inpatient/Anesthesia/MedicationsGasSection'
import PreAnesthesia from 'src/components/hospital/inpatient/Anesthesia/PreAnesthesia'

export const anesthesiaSchema = yup.object({
  basicDetails: yup.object({
    location: yup.string().trim().required('Location is required'),
    dateTime: yup.string().trim().required('Date & time is required'),
    estimatedTime: yup
      .string()
      .trim()
      .matches(/^\d+\s(hr|min)$/, 'Use format like "2 hr" or "30 min"')
      .required('Estimated time is required'),
    veterinarian: yup.string().trim().required('Veterinarian is required'),
    anesthetist: yup.string().trim().required('Anesthetist is required'),
    purpose: yup.array().of(yup.string()).min(1, 'Select at least one purpose'),
    notes: yup.string().trim().required('Notes are required')
  }),
  vitalMonitoring: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        timeLabel: yup.string().trim().required(),
        entries: yup.object().default({})
      })
    )
    .default([]),
  attachments: yup.object({
    files: yup.array().of(yup.mixed()).optional(),
    comments: yup.string().optional()
  })
})

const sections = [
  { id: 'basicDetails', label: 'Basic Detail', component: BasicDetails },
  { id: 'medicationsGas', label: 'Medications & Gas', component: MedicationsGasSection },
  { id: 'attachments', label: 'Attachments', component: AttachmentsSection },
  { id: 'anesthesiaSetUp', label: 'Anesthesia Set Up', component: AnesthesiaSetUpSection },
  { id: 'preAnesthesia', label: 'Pre Anesthesia', component: PreAnesthesia },
  { id: 'vitalMonitoring', label: 'Vital Monitoring', component: VitalMonitoring }
]

export default function AddAnesthesiaRecord() {
  const router = useRouter()
  const [expanded, setExpanded] = React.useState('basicDetails')
  const sectionRefs = React.useRef({})
  const scrollContainerRef = React.useRef(null)
  const theme = useTheme()
  const HEADER_HEIGHT = 120

  const vetOptions = [
    { id: 1, name: 'Dr. John D Sam' },
    { id: 2, name: 'Dr. Jane M Doe' },
    { id: 3, name: 'Dr. Vineet R' }
  ]

  const anesthetistOptions = [
    { id: 1, name: 'Dr. John D Sam' },
    { id: 2, name: 'Dr. Jane M Doe' },
    { id: 3, name: 'Dr. Vineet R' }
  ]

  const methods = useForm({
    defaultValues: {
      basicDetails: {
        location: '',
        dateTime: '',
        estimatedTime: '',
        veterinarian: '',
        anesthetist: '',
        purpose: [],
        notes: ''
      },
      anesthesiaSetup: {
        fluids: { checked: false, fluidType: '', quantity: '' },
        catheterSetup: { checked: false, method: '' },
        syringePump: { checked: false, rate: '' },
        etIntubation: { checked: false, tubeSizes: '' },
        nasalIntubation: { checked: false, fluidType: '', quantity: '' },
        ventilation: { checked: false, mode: '' },
        monitoring: { checked: false, selected: [], otherItems: [] }
      },
      vitalMonitoring: [],
      attachments: {
        files: [],
        comments: ''
      }
    },
    mode: 'onSubmit',
    resolver: yupResolver(anesthesiaSchema),
    reValidateMode: 'onChange'
  })

  const {
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = methods

  const handleChange = sectionId => {
    setExpanded(sectionId)
    const target = sectionRefs.current[sectionId]
    const scrollContainer = scrollContainerRef.current
    if (target && scrollContainer) {
      const targetTop = target.offsetTop - HEADER_HEIGHT
      scrollContainer.scrollTo({ top: targetTop, behavior: 'smooth' })
    }
  }

  const onValid = data => {
    console.log(' basicdetails:', data.basicDetails)
    console.log('Files:', data.attachments.files)
    console.log(data, 'data')

    //  API here
  }

  const onInvalid = errors => {
    const firstPath = Object.keys(errors.basicDetails || {})[0] || (errors.attachments ? 'attachments' : 'basicDetails')

    if (firstPath) {
      setExpanded('basicDetails')
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-field="${firstPath}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  return (
    <FormProvider {...methods}>
      <Box display='flex' flexDirection='column' gap={3} sx={{ p: 3 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography color={theme.palette.text.secondary}>Hospital</Typography>
          <Typography color={theme.palette.text.secondary}>Patients</Typography>
          <Typography color={theme.palette.text.secondary}>Inpatient</Typography>
          <Typography
            color={theme.palette.text.secondary}
            sx={{ cursor: 'pointer' }}
            onClick={() => window.history.back()}
          >
            Details
          </Typography>
          <Typography color={theme.palette.text.primary}>Add Anesthesia</Typography>
        </Breadcrumbs>

        <Box
          position='relative'
          height='80vh'
          display='flex'
          flexDirection='column'
          borderRadius='8px'
          overflow='hidden'
        >
          <Paper
            elevation={3}
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              boxShadow: 'none',
              borderRadius: '8px'
            }}
          >
            <Box
              px={3}
              pt={2}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0,
                flexDirection: 'column',
                pl: 7
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                <Icon
                  style={{ cursor: 'pointer' }}
                  color={theme.palette.customColors.OnSurfaceVariant}
                  icon='material-symbols:arrow-back'
                />
                <Typography variant='h6' fontWeight={600}>
                  Anesthesia Record - AN2345/25
                </Typography>
              </Box>

              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '12px',
                  fontWeight: 400,
                  ml: 6
                }}
              >
                Last Saved : 12 Aug 2025 · 12:00 PM
              </Typography>
            </Box>

            <AnimalDetails
              image='/icons/Activity.svg'
              name='Luna'
              scientificName='Felis catus'
              identifierValue='CAT-202'
              identifierName='Microchip'
              admittedDays='2'
              location='Zoo'
              vet='test'
              ageGender='24 || Male'
            />

            <Tabs
              value={expanded}
              onChange={(e, val) => handleChange(val)}
              variant='scrollable'
              scrollButtons='auto'
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 48
                }
              }}
            >
              {sections.map(sec => (
                <Tab
                  key={sec.id}
                  label={sec.label}
                  value={sec.id}
                  sx={{
                    color: theme.palette.customColors.secondaryBg,
                    fontSize: '14px',
                    fontWeight: '600!important'
                  }}
                />
              ))}
            </Tabs>
          </Paper>

          <Box ref={scrollContainerRef} flex={1} overflow='auto' p={0} mt={4}>
            {sections.map(({ id, label, component: SectionComponent }) => (
              <Accordion
                key={id}
                expanded={expanded === id}
                onChange={() => handleChange(id)}
                ref={el => (sectionRefs.current[id] = el)}
                sx={{
                  mb: 2,
                  borderRadius: '8px',
                  boxShadow: 0,
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={
                    expanded === id ? (
                      <Typography sx={{ fontWeight: 'bold', fontSize: 24, color: '#4c4e646e' }}>−</Typography>
                    ) : (
                      <Typography sx={{ fontWeight: 'bold', fontSize: 24 }}>+</Typography>
                    )
                  }
                >
                  <Typography fontWeight={600}>{label}</Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 0 }}>
                  <SectionComponent sectionId={id} vetOptions={vetOptions} anesthetistOptions={anesthetistOptions} />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>

        <ActionButtons
          cancelLabel='CANCEL'
          addLabel={
            <Box display='flex' alignItems='center' gap={1}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>ADD</span>
            </Box>
          }
          onAdd={handleSubmit(onValid, onInvalid)}
          width={200}
          height={50}
        />
      </Box>
    </FormProvider>
  )
}
