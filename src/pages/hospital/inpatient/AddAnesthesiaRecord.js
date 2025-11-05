'use client'
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
import BasicDetails from 'src/components/hospital/inpatient/Anesthesia/BasicDetails'
import AttachmentsSection from 'src/components/hospital/inpatient/Anesthesia/AttachmentsSection'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
// import MedicationsGasSection from 'src/components/hospital/inpatient/Anesthesia/MedicationsGasSection'
// import AnesthesiaSetupSection from 'src/components/hospital/inpatient/Anesthesia/AnesthesiaSetupSection'
// import PreAnesthesiaSection from 'src/components/hospital/inpatient/Anesthesia/PreAnesthesiaSection'
// import VitalMonitoringSection from 'src/components/hospital/inpatient/Anesthesia/VitalMonitoringSection'
// import RecoveryReversalSection from 'src/components/hospital/inpatient/Anesthesia/RecoveryReversalSection'

const sections = [
  { id: 'Basic Detail', component: BasicDetails },
  //   { id: 'Medications & Gas', component: MedicationsGasSection },
  //   { id: 'Anesthesia Set-Up', component: AnesthesiaSetupSection },
  //   { id: 'Pre Anesthesia', component: PreAnesthesiaSection },
  //   { id: 'Vital Monitoring', component: VitalMonitoringSection },
  //   { id: 'Recovery and Reversal', component: RecoveryReversalSection },
  { id: 'Attachments', component: AttachmentsSection }
]

export default function AddAnesthesiaRecord() {
  const [expanded, setExpanded] = React.useState('Basic Detail')
  const sectionRefs = React.useRef({})
  const scrollContainerRef = React.useRef(null)
  const theme = useTheme()

  const HEADER_HEIGHT = 120

  const handleChange = sectionId => {
    setExpanded(sectionId)
    const target = sectionRefs.current[sectionId]
    const scrollContainer = scrollContainerRef.current

    if (target && scrollContainer) {
      const targetTop = target.offsetTop - HEADER_HEIGHT
      scrollContainer.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      })
    }
  }

  return (
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

        <Typography color={theme.palette.text.primary}>Add Anesthesia </Typography>
      </Breadcrumbs>

      <Box position='relative' height='80vh' display='flex' flexDirection='column' borderRadius='8px' overflow='hidden'>
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
                label={sec.id}
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

        {/* Scrollable Body */}
        <Box ref={scrollContainerRef} flex={1} overflow='auto' p={0} mt={4}>
          {sections.map(({ id, component: SectionComponent }) => (
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
                    <Typography sx={{ fontWeight: 'bold', fontSize: 24 }}>−</Typography>
                  ) : (
                    <Typography sx={{ fontWeight: 'bold', fontSize: 24 }}>+</Typography>
                  )
                }
              >
                <Typography fontWeight={600}>{id}</Typography>
              </AccordionSummary>

              <AccordionDetails>
                <SectionComponent />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
      <ActionButtons
        cancelLabel='CANCEL'
        addLabel={
          <Box display='flex' alignItems='center' gap={1}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              ADD
              {/* {addLoading && <CircularProgress size={20} sx={{ color: '#ccc' }} />} */}
            </span>
          </Box>
        }
        onCancel={() => router.push(`/hospital/inpatient/${id}/?animal_id=${animal_id}&tab=symptoms`)}
        // onAdd={handleAddClick}
        width={200}
        height={50}
        //isSubmitLoading={addLoading}
      />
    </Box>
  )
}
