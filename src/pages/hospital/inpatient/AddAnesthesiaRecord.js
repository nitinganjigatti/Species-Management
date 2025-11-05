import React, { useRef, useState } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Paper,
  Breadcrumbs
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
// import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'

const sections = [
  'Basic Detail',
  'Medications & Gas',
  'Anesthesia Set-Up',
  'Pre Anesthesia',
  'Vital Monitoring',
  'Recovery and Reversal',
  'Attachments'
]

export default function AddAnesthesiaRecord() {
  const [expanded, setExpanded] = useState('Basic Detail')
  const sectionRefs = useRef({})
  const theme = useTheme()
  const scrollContainerRef = useRef(null)

  const handleChange = section => {
    setExpanded(section)
    const target = sectionRefs.current[section]
    const scrollContainer = scrollContainerRef.current

    if (target && scrollContainer) {
      const headerHeight = 120 // Adjust for your header + tabs height
      const targetTop = target.offsetTop - headerHeight

      scrollContainer.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      })
    }
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
          onClick={() => window.history.back()}
        >
          Details
        </Typography>
        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>Add Surgery</Typography>
      </Breadcrumbs>

      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '24px',
          letterSpacing: 0,
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        Add Anesthesia Record Page
      </Typography>

      {/* <AnimalInfoCard data={data} /> */}

      {/* Outer Container */}
      <Box
        sx={{
          position: 'relative',
          height: '80vh', // define scrollable area height
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 2
        }}
      >
        {/* Sticky Header inside scrollable box */}
        <Paper
          elevation={3}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#fff',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ px: 3, pt: 2 }}>
            <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
              Add Anesthesia
            </Typography>
          </Box>

          {/* Tabs */}
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
              <Tab key={sec} label={sec} value={sec} />
            ))}
          </Tabs>
        </Paper>

        {/* Scrollable Content */}
        <Box
          ref={scrollContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#fafafa',
            p: 3
          }}
        >
          {sections.map(section => (
            <Accordion
              key={section}
              expanded={expanded === section}
              onChange={() => handleChange(section)}
              ref={el => (sectionRefs.current[section] = el)}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: expanded === section ? 3 : 1
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600 }}>{section}</Typography>
              </AccordionSummary>

              <AccordionDetails>
                {section === 'Basic Detail' ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)'
                      }
                    }}
                  >
                    <TextField label='Location' size='small' />
                    <TextField
                      label='Date & Time of Anesthesia'
                      size='small'
                      type='datetime-local'
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField label='Veterinarian' select SelectProps={{ native: true }} size='small'>
                      <option>Select</option>
                      <option>Dr. A</option>
                      <option>Dr. B</option>
                    </TextField>
                    <TextField label='Anesthetist' select SelectProps={{ native: true }} size='small'>
                      <option>Select</option>
                      <option>Dr. X</option>
                      <option>Dr. Y</option>
                    </TextField>

                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField label='Notes' size='small' fullWidth multiline rows={3} placeholder='Enter notes' />
                    </Box>
                  </Box>
                ) : section === 'Attachments' ? (
                  <Box
                    sx={{
                      border: '1px dashed #ccc',
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2
                    }}
                  >
                    <Typography color='text.secondary'>Upload attachment</Typography>
                    <Button variant='contained' sx={{ mt: 1 }}>
                      Browse
                    </Button>
                  </Box>
                ) : (
                  <Typography color='text.secondary'>
                    Content for <b>{section}</b> goes here. Content for <b>{section}</b> goes here. Content for{' '}
                    <b>{section}</b> goes here. Content for <b>{section}</b> goes here. Content for <b>{section}</b>{' '}
                    goes here. Content for <b>{section}</b> goes here. Content for <b>{section}</b> goes here. Content
                    for <b>{section}</b> goes here. Content for <b>{section}</b> goes here. Content for <b>{section}</b>{' '}
                    goes here. Content for <b>{section}</b> goes here.
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
