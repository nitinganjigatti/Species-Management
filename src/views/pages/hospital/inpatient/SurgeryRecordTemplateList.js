import { Drawer, IconButton, Typography, TextField, CircularProgress } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { useState, useMemo, useEffect } from 'react'
import { LoadingButton } from '@mui/lab'
import EditTemplateForm from '../../../../components/hospital/inpatient/EditTemplateForm'
import SurgeryTemplateCard from './SurgeryTemplateCard'

const SurgeryRecordTemplateList = ({
  openSurgeryTemplateDrawer,
  setOpenSurgeryTemplateDrawer,
  templates = [],
  loading = false
}) => {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [openEditPopup, setOpenEditPopup] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    const list = Array.isArray(templates) ? templates : []

    if (!searchValue.trim()) return list

    const value = searchValue.toLowerCase()

    return list.filter(template => {
      const title = template?.title?.toLowerCase() || ''
      const description = template?.description?.toLowerCase() || ''
      const category = template?.category?.toLowerCase() || ''

      return title.includes(value) || description.includes(value) || category.includes(value)
    })
  }, [searchValue, templates])

  useEffect(() => {
    if (!selectedTemplate) return

    const list = Array.isArray(templates) ? templates : []
    const match = list.find(template => template.id === selectedTemplate.id)

    if (!match) {
      setSelectedTemplate(null)

      return
    }

    if (match !== selectedTemplate) {
      setSelectedTemplate(match)
    }
  }, [templates, selectedTemplate])

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
      setEditingTemplate(selectedTemplate)
      setOpenEditPopup(true)
    }
  }

  // Handle edit template from pencil button
  const handleEditTemplateFromPencil = template => {
    setEditingTemplate(template)
    setOpenEditPopup(true)
  }

  // Handle update template
  const handleUpdateTemplate = formData => {
    console.log('Updating template:', formData)

    // Add your API call here to update the template
    setOpenEditPopup(false)
    setEditingTemplate(null)
  }

  // Handle delete template
  const handleDeleteTemplate = templateId => {
    console.log('Deleting template:', templateId)

    // Add your API call here to delete the template
    setOpenEditPopup(false)
    setEditingTemplate(null)
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
            All Templates - {templates?.length || 0}
          </Typography>
        </Box>
        <IconButton size='small' onClick={() => setOpenSurgeryTemplateDrawer(false)}>
          <Icon color={theme.palette.primary.light} icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          mt: '12px',
          mb: '24px',
          px: '24px'
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
                style={{ marginRight: 8, color: theme.palette.customColors.OnSurfaceVariant }}
              />
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.customColors.OutlineVariant,
              borderRadius: '4px'
            }
          }}
        />
      </Box>

      <Box
        sx={{
          p: '24px',
          backgroundColor: 'background.default',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
          borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        {/* Scrollable Template List */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              paddingBottom: '80px'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredTemplates.length ? (
              filteredTemplates.map(template => (
                <SurgeryTemplateCard
                  key={template.id}
                  template={template}
                  selectedTemplate={selectedTemplate}
                  onSelect={handleTemplateSelect}
                  onEdit={handleEditTemplateFromPencil}
                  onDelete={template => console.log('Delete template:', template)}
                />
              ))
            ) : (
              <Typography
                sx={{
                  textAlign: 'center',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mt: 6
                }}
              >
                No templates found.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          height: '88px',
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
          disabled={loading || !selectedTemplate}
          onClick={handleEditTemplate}
          sx={{
            flex: 1,
            height: '56px',
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
          disabled={loading || !selectedTemplate}
          onClick={handleApplyTemplate}
          sx={{
            flex: 1,
            height: '56px',
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

      {/* Edit Template Popup */}
      <EditTemplateForm
        open={openEditPopup}
        onClose={() => {
          setOpenEditPopup(false)
          setEditingTemplate(null)
        }}
        template={editingTemplate}
        onUpdate={handleUpdateTemplate}
        onDelete={handleDeleteTemplate}
        loading={false}
      />
    </Drawer>
  )
}

export default SurgeryRecordTemplateList
