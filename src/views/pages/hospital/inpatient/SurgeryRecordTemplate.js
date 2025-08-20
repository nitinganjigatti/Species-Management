import {
  Avatar,
  Card,
  Drawer,
  IconButton,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox
} from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState, useMemo } from 'react'
import { LoadingButton } from '@mui/lab'

// Sample template data
const sampleTemplates = [
  {
    id: 1,
    title: 'Ovariohysterectomy',
    description:
      'Appendectomy was performed via a right lower abdominal approach under general anesthesia. The patient was positioned supine and prepped with standard sterile technique.',
    category: 'Surgery'
  },
  {
    id: 2,
    title: 'Appendectomy',
    description:
      'Standard appendectomy procedure with laparoscopic approach. Patient was placed under general anesthesia.',
    category: 'Surgery'
  },
  {
    id: 3,
    title: 'Dental Cleaning',
    description: 'Comprehensive dental cleaning and examination. Scaling and polishing performed under sedation.',
    category: 'Dental'
  },
  {
    id: 4,
    title: 'Vaccination',
    description: 'Annual vaccination protocol including core vaccines and additional recommended vaccines.',
    category: 'Preventive'
  },
  {
    id: 5,
    title: 'Blood Test',
    description: 'Complete blood count and comprehensive metabolic panel for routine health assessment.',
    category: 'Diagnostic'
  },
  {
    id: 6,
    title: 'X-Ray Examination',
    description: 'Radiographic examination of chest and abdomen for diagnostic purposes.',
    category: 'Diagnostic'
  },
  {
    id: 7,
    title: 'Suture Removal',
    description: 'Removal of surgical sutures and wound assessment for proper healing.',
    category: 'Post-operative'
  },
  {
    id: 8,
    title: 'Bandage Change',
    description: 'Regular bandage change and wound dressing for optimal healing conditions.',
    category: 'Post-operative'
  },
  {
    id: 9,
    title: 'Medication Review',
    description: 'Comprehensive review of current medications and dosage adjustments if needed.',
    category: 'Medical'
  },
  {
    id: 10,
    title: 'Physical Examination',
    description: 'Complete physical examination including vital signs and general health assessment.',
    category: 'Medical'
  },
  {
    id: 11,
    title: 'Microchip Implantation',
    description: 'Subcutaneous microchip implantation for pet identification and tracking.',
    category: 'Identification'
  },
  {
    id: 12,
    title: 'Neutering',
    description: 'Surgical neutering procedure with pre-operative assessment and post-operative care.',
    category: 'Surgery'
  },
  {
    id: 13,
    title: 'Ear Cleaning',
    description: 'Professional ear cleaning and examination for ear health maintenance.',
    category: 'Grooming'
  },
  {
    id: 14,
    title: 'Nail Trimming',
    description: 'Professional nail trimming and paw care for optimal comfort and health.',
    category: 'Grooming'
  },
  {
    id: 15,
    title: 'Parasite Treatment',
    description: 'Comprehensive parasite treatment including flea, tick, and worm prevention.',
    category: 'Preventive'
  },
  {
    id: 16,
    title: 'Emergency Stabilization',
    description: 'Emergency medical stabilization and critical care treatment protocol.',
    category: 'Emergency'
  },
  {
    id: 17,
    title: 'Fluid Therapy',
    description: 'Intravenous fluid therapy for hydration and electrolyte balance restoration.',
    category: 'Treatment'
  },
  {
    id: 18,
    title: 'Wound Management',
    description: 'Comprehensive wound management including cleaning, debridement, and dressing.',
    category: 'Treatment'
  },
  {
    id: 19,
    title: 'Behavioral Assessment',
    description: 'Comprehensive behavioral assessment and consultation for behavioral issues.',
    category: 'Behavioral'
  },
  {
    id: 20,
    title: 'Nutritional Consultation',
    description:
      'Dietary assessment and nutritional consultation for optimal health and weightDietary assessment and nutritional consultation for optimal health and weightDietary assessment and nutritional consultation for optimal health and weight management.',
    category: 'Nutrition'
  }
]

const SurgeryRecordTemplate = ({ openSurgeryTemplateDrawer, setOpenSurgeryTemplateDrawer }) => {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!searchValue.trim()) return sampleTemplates

    return sampleTemplates.filter(
      template =>
        template.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        template.description.toLowerCase().includes(searchValue.toLowerCase()) ||
        template.category.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [searchValue])

  // Handle template selection
  const handleTemplateSelect = template => {
    setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)
  }

  // Handle apply template
  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      console.log('Applied template:', selectedTemplate)

      // Add your logic here to apply the template
      setOpenSurgeryTemplateDrawer(false)
    }
  }

  // Handle edit template
  const handleEditTemplate = () => {
    if (selectedTemplate) {
      console.log('Edit template:', selectedTemplate)

      // Add your logic here to edit the template
    }
  }

  return (
    <Drawer
      anchor='right'
      open={openSurgeryTemplateDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', maxHight: '80px' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            All Templates - 12
          </Typography>
        </Box>
        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setOpenSurgeryTemplateDrawer(false)}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box
        sx={{
          p: '24px',
          backgroundColor: 'background.default',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden'
        }}
      >
        {/* Search Bar - Fixed at top */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'background.default',
            pb: 2
          }}
        >
          <TextField
            fullWidth
            placeholder='Search'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <Icon
                  icon='mdi:magnify'
                  fontSize={20}
                  style={{ marginRight: 8, color: theme.palette.customColors.Outline }}
                />
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: theme.palette.customColors.Outline
                }
              }
            }}
          />
        </Box>

        {/* Scrollable Template List */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              paddingBottom: '120px'
            }}
          >
            {filteredTemplates.map(template => (
              <Box
                key={template.id}
                sx={{
                  display: 'flex',
                  gap: '12px',
                  border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                  backgroundColor:
                    selectedTemplate?.id === template.id
                      ? theme.palette.customColors.OnBackground
                      : theme.palette.primary.contrastText,
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleTemplateSelect(template)}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {template.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      letterSpacing: 0,
                      //   textAlign: 'justify',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {template.description}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton
                    onClick={e => {
                      e.stopPropagation()
                      console.log('Edit template:', template)
                    }}
                    sx={{ height: '30px', width: '30px', p: 0, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    <Icon icon='mdi:pencil' fontSize={20} />
                  </IconButton>
                  <IconButton
                    onClick={e => {
                      e.stopPropagation()
                      console.log('Delete template:', template)
                    }}
                    sx={{ height: '30px', width: '30px', p: 0, color: theme.palette.primary.light }}
                  >
                    <Icon icon='mdi:close' fontSize={20} />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton
          variant='outlined'
          size='large'
          disabled={!selectedTemplate}
          onClick={handleEditTemplate}
          sx={{
            flex: 1,
            borderColor: selectedTemplate ? theme.palette.primary.main : theme.palette.customColors.Outline,
            color: selectedTemplate ? theme.palette.primary.main : theme.palette.customColors.Outline,
            '&:hover': {
              borderColor: selectedTemplate ? theme.palette.primary.main : theme.palette.customColors.Outline,
              backgroundColor: selectedTemplate ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
            }
          }}
        >
          EDIT
        </LoadingButton>
        <LoadingButton
          variant='contained'
          size='large'
          disabled={!selectedTemplate}
          onClick={handleApplyTemplate}
          sx={{
            flex: 1,
            backgroundColor: selectedTemplate ? theme.palette.primary.main : theme.palette.customColors.Outline,
            color: selectedTemplate ? 'white' : theme.palette.customColors.Outline,
            '&:hover': {
              backgroundColor: selectedTemplate ? theme.palette.primary.dark : theme.palette.customColors.Outline
            }
          }}
        >
          APPLY
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SurgeryRecordTemplate
