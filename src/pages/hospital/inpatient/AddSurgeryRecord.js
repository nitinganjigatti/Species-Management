import { Breadcrumbs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import AddAnaesthesiaRecordDrawer from 'src/components/hospital/inpatient/AddAnaesthesiaRecord'
import SurgeryRecordForm from 'src/components/hospital/inpatient/SurgeryRecordForm'
import SurgeryRecordTemplateList from 'src/views/pages/hospital/inpatient/SurgeryRecordTemplateList'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'

// ✅ Validation schema
const schema = yup.object().shape({
  date: yup.date().required('Date is required'),
  startTime: yup.date().required('Start time is required'),
  endTime: yup.date().required('End time is required'),
  procedure: yup.string().required('Procedure is required'),
  typeOfSurgery: yup.string().required('Type of surgery is required'),
  surgicalApproach: yup.string().required('Surgical approach is required'),
  notes: yup.string().required('Surgery notes are required'),
  complication: yup.string().required('Complication is required'),
  dietInstructions: yup.string().required('Diet instructions are required'),
  restrictions: yup.string().required('Restriction activities are required'),
  additionalNotes: yup.string().required('Additional notes are required')
})

const AddSurgeryRecord = () => {
  const router = useRouter()
  const theme = useTheme()

  const templates = [
    'appendix surgery',
    'ovariohysterectomy',
    'ovariohysterectomies',
    'ovariohysterect',
    'hernia repair',
    'spay surgery',
    'neuter surgery',
    'orthopedic surgery',
    'soft tissue surgery',
    'dental extraction',
    'tumor removal',
    'eye surgery',
    'ear surgery',
    'cesarean section',
    'fracture repair',
    'wound closure',
    'foreign body removal',
    'skin graft',
    'joint surgery',
    'biopsy'
  ]

  const data = {
    animal: {
      common_name: 'Leopard',
      scientific_name: 'Panthera pardus',
      age: '2y 5m',
      sex: 'Male',
      image_url: 'path/to/leopard_image.jpg'
    },
    additional_info: {
      AID: '123456',
      'Admitted Days': '6 Days',
      Location: 'Cage 1, Patient Wing 2',
      'Consulting Veterinarian': 'Dr. Nitin A Ganjigatti'
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      date: null,
      startTime: null,
      endTime: null,
      procedure: '',
      typeOfSurgery: '',
      surgicalApproach: '',
      notes: '',
      complication: 'None',
      dietInstructions: '',
      restrictions: '',
      additionalNotes: '',
      attachments: []
    }
  })

  const [activeTemplate, setActiveTemplate] = useState(templates[0])
  const [openAddAnaesthesiaDrawer, setOpenAddAnaesthesiaDrawer] = useState(false)
  const [openSurgeryTemplateDrawer, setOpenSurgeryTemplateDrawer] = useState(false)

  const onSubmit = data => {
    console.log('Form Data:', data)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Breadcrumbs aria-label='breadcrumb'>
        <Typography color={theme.palette.customColors.neutralSecondary}>Hospital</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Patients</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Inpatient</Typography>
        <Typography
          color={theme.palette.customColors.neutralSecondary}
          sx={{ cursor: 'pointer' }}
          onClick={() => router.back()}
        >
          Details
        </Typography>

        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            cursor: 'pointer'
          }}
        >
          Add Surgery
        </Typography>
      </Breadcrumbs>
      <Typography
        sx={{ fontWeight: 500, fontSize: '24px', letterSpacing: 0, color: theme.palette.customColors.OnSurfaceVariant }}
      >
        Add Surgery Record Page
      </Typography>

      <AnimalInfoCard data={data} />
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        component='form'
        onSubmit={handleSubmit(onSubmit)}
      >
        <SurgeryRecordForm
          control={control}
          errors={errors}
          templates={templates}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
          setOpenAddAnaesthesiaDrawer={setOpenAddAnaesthesiaDrawer}
        />
      </Box>

      <AddAnaesthesiaRecordDrawer
        setOpenAddAnaesthesiaDrawer={setOpenAddAnaesthesiaDrawer}
        openAddAnaesthesiaDrawer={openAddAnaesthesiaDrawer}
      />
      <SurgeryRecordTemplateList
        setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
        openSurgeryTemplateDrawer={openSurgeryTemplateDrawer}
      />
    </Box>
  )
}

export default AddSurgeryRecord
