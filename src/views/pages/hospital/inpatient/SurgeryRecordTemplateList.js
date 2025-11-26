import { useState, useMemo, useEffect, useCallback } from 'react'
import { Drawer, IconButton, Typography, TextField, CircularProgress } from '@mui/material'
import { alpha, Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import EditTemplateForm from '../../../../components/hospital/inpatient/EditTemplateForm'
import SurgeryTemplateCard from './SurgeryTemplateCard'
import Toaster from 'src/components/Toaster'
import { deleteTemplate, updateTemplate } from 'src/lib/api/hospital/surgeryMaster'

const SurgeryRecordTemplateList = ({
  openSurgeryTemplateDrawer,
  setOpenSurgeryTemplateDrawer,
  templates = [],
  loading = false,
  onApplyTemplate = () => {},
  onTemplatesUpdated = () => {} //refetch templates after update/delete
}) => {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [openEditPopup, setOpenEditPopup] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

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

  // Keep selectedTemplate in sync with list
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

  // Handle template selection (card click)
  const handleTemplateSelect = template => {
    setSelectedTemplate(prev => (prev?.id === template.id ? null : template))
  }

  // Apply template into editor
  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate)
      setOpenSurgeryTemplateDrawer(false)
    }
  }

  // Handle edit template close
  const handleEditTemplateClose = () => {
    setOpenSurgeryTemplateDrawer(false)
  }

  // Handle edit template open
  const handleEditTemplateOpen = template => {
    setEditingTemplate(template)
    setOpenEditPopup(true)
  }

  // Handle form update template
  const handleUpdateTemplate = useCallback(
    async formData => {
      if (!editingTemplate?.id) {
        Toaster({ type: 'error', message: 'Template not found for update' })

        return
      }

      try {
        setActionLoading(true)

        const payload = { id: editingTemplate.id, template_name: formData.name, description: formData.description }

        const response = await updateTemplate(payload)

        if (response?.success) {
          Toaster({ type: 'success', message: response?.message || 'Template updated successfully' })

          // await onTemplatesUpdated?.()
          await Promise.resolve(onTemplatesUpdated?.())

          setOpenEditPopup(false)
          setEditingTemplate(null)
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to update template' })
        }
      } catch (error) {
        console.error('Error updating template:', error?.message)
        Toaster({
          type: 'error',
          message: error?.response?.data?.message || error?.message || 'An unexpected error occurred'
        })
      } finally {
        setActionLoading(false)
      }
    },
    [editingTemplate, onTemplatesUpdated]
  )

  // Handle delete template
  const handleDeleteTemplate = useCallback(
    async templateId => {
      if (!templateId) {
        Toaster({ type: 'error', message: 'Template not found for delete' })

        return
      }

      try {
        setActionLoading(true)
        const response = await deleteTemplate({ id: templateId })

        if (response?.success) {
          Toaster({ type: 'success', message: response?.message || 'Template deleted successfully' })

          // If the deleted one was selected or being edited, clear them
          if (selectedTemplate?.id === templateId) {
            setSelectedTemplate(null)
          }
          if (editingTemplate?.id === templateId) {
            setEditingTemplate(null)
            setOpenEditPopup(false)
          }

          // Refresh list in parent
          await Promise.resolve(onTemplatesUpdated?.())
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to delete template' })
        }
      } catch (error) {
        console.error('Delete template error:', error?.response?.data?.message || error?.message || error)
        Toaster({
          type: 'error',
          message: error?.response?.data?.message || error?.message || 'An unexpected error occurred'
        })
      } finally {
        setActionLoading(false)
      }
    },
    [editingTemplate, onTemplatesUpdated, selectedTemplate]
  )

  return (
    <Drawer
      anchor='right'
      open={openSurgeryTemplateDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 6
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Hospital Icon' />
            <Typography
              sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              All Templates - {templates?.length || 0}
            </Typography>
          </Box>
          <IconButton size='small' onClick={handleEditTemplateClose}>
            <Icon color={theme.palette.primary.light} icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
        <Box sx={{ padding: '0 24px 24px 24px' }}>
          <TextField
            fullWidth
            placeholder='Search'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <Icon
                    icon='mdi:magnify'
                    fontSize={24}
                    style={{ marginRight: 8, color: theme.palette.customColors.OnSurfaceVariant }}
                  />
                )
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.customColors.Outline,
                borderRadius: '4px'
              }
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          p: 6,
          backgroundColor: theme.palette.background.default,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          overflow: 'hidden'
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
              gap: 4,
              paddingBottom: '80px'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredTemplates?.length > 0 ? (
              filteredTemplates?.map(template => (
                <SurgeryTemplateCard
                  key={template.id}
                  template={template}
                  selectedTemplate={selectedTemplate}
                  onSelect={handleTemplateSelect}
                  onEdit={handleEditTemplateOpen}
                  onDelete={() => handleDeleteTemplate(template.id)}
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

      {/* Footer buttons */}
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
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark, 0.1)}`,
          zIndex: 123
        }}
      >
        <LoadingButton
          variant='outlined'
          size='large'
          disabled={loading || actionLoading}
          onClick={() => {
            if (selectedTemplate) {
              handleEditTemplateOpen(selectedTemplate)
            } else {
              handleEditTemplateClose()
            }
          }}
          sx={{
            flex: 1,
            height: '56px',
            borderColor: theme.palette.customColors.OutlineVariant,
            color: theme.palette.customColors.neutralSecondary,
            '&:hover': {
              borderColor: theme.palette.customColors.neutralSecondary,
              backgroundColor: theme.palette.customColors.mdAntzNeutral
            }
          }}
        >
          {selectedTemplate ? 'Edit' : 'Close'}
        </LoadingButton>
        <LoadingButton
          variant='contained'
          size='large'
          disabled={loading || actionLoading || !selectedTemplate}
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
        loading={actionLoading}
      />
    </Drawer>
  )
}

export default SurgeryRecordTemplateList
