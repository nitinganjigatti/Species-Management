import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { createDepartment, getDepartmentById, updateDepartment } from 'src/lib/api/request-department'

const schema = yup.object().shape({
  name: yup.string().required('Department name is required'),
  description: yup.string(),
  active: yup.boolean()
})

const SETTING_KEYS = [
  'enable_costing',
  'costing_mandatory',
  'enable_approval',
  'max_cost_for_auto_approval',
  'entity_selection_mandatory',
  'enable_vendor_selection',
  'enable_vendor_in_create_request',
  'enable_vendor_by_department',
  'vendor_selection_mandatory'
]

const defaultSettings = {
  enable_costing: false,
  costing_mandatory: false,
  enable_approval: false,
  max_cost_for_auto_approval: '',
  entity_selection_mandatory: false,
  enable_vendor_selection: false,
  enable_vendor_in_create_request: false,
  enable_vendor_by_department: false,
  vendor_selection_mandatory: false
}

const DepartmentDrawer = ({ open, onClose, onSuccess, editData }) => {
  const theme = useTheme()
  const isEditMode = Boolean(editData?.id)

  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', description: '', active: true }
  })

  // Load existing data in edit mode
  useEffect(() => {
    if (open && isEditMode && editData?.id) {
      const loadDepartment = async () => {
        setLoadingData(true)
        try {
          const response = await getDepartmentById(editData.id)
          if ((response?.success || response?.status) && response?.data) {
            const dept = response.data
            reset({
              name: dept.name || '',
              description: dept.description || '',
              active: dept.active === 1 || dept.active === true || dept.active === '1'
            })

            const parsedSettings = { ...defaultSettings }
            if (dept.settings && typeof dept.settings === 'object' && !Array.isArray(dept.settings)) {
              Object.entries(dept.settings).forEach(([key, value]) => {
                if (SETTING_KEYS.includes(key)) {
                  if (key === 'max_cost_for_auto_approval') {
                    parsedSettings[key] = value || ''
                  } else {
                    parsedSettings[key] = value === '1' || value === 1 || value === true
                  }
                }
              })
            } else if (Array.isArray(dept.settings)) {
              dept.settings.forEach(s => {
                if (SETTING_KEYS.includes(s.key)) {
                  if (s.key === 'max_cost_for_auto_approval') {
                    parsedSettings[s.key] = s.value || ''
                  } else {
                    parsedSettings[s.key] = s.value === '1' || s.value === 1 || s.value === true
                  }
                }
              })
            }
            setSettings(parsedSettings)

            const fileUrl = dept.file_name || dept.attachment_url
            const isDefault = fileUrl && (fileUrl.includes('assets/app/') || fileUrl.includes('antz_pdf_bg'))
            if (fileUrl && !isDefault) {
              setAttachmentPreview(fileUrl)
            }
          }
        } catch (error) {
          console.error('Error loading department:', error)
          toast.error('Failed to load department data')
        } finally {
          setLoadingData(false)
        }
      }
      loadDepartment()
    } else if (open && !isEditMode) {
      reset({ name: '', description: '', active: true })
      setSettings(defaultSettings)
      setAttachmentFile(null)
      setAttachmentPreview(null)
    }
  }, [open, isEditMode, editData, reset])

  const handleSettingChange = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value }
      if (key === 'enable_vendor_selection' && !value) {
        updated.enable_vendor_in_create_request = false
        updated.enable_vendor_by_department = false
        updated.vendor_selection_mandatory = false
      }
      return updated
    })
  }

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachmentFile(file)
      setAttachmentPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveAttachment = () => {
    setAttachmentFile(null)
    setAttachmentPreview(null)
  }

  const onSubmit = async data => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.description || '')
      formData.append('active', data.active ? '1' : '0')

      if (attachmentFile) {
        formData.append('attachment', attachmentFile)
      }

      SETTING_KEYS.forEach(key => {
        if (key === 'max_cost_for_auto_approval') {
          formData.append(`settings[${key}]`, settings[key] || '')
        } else {
          formData.append(`settings[${key}]`, settings[key] ? '1' : '0')
        }
      })

      let response
      if (isEditMode) {
        response = await updateDepartment(editData.id, formData)
      } else {
        response = await createDepartment(formData)
      }

      if (response?.success || response?.status) {
        toast.success(isEditMode ? 'Department updated successfully' : 'Department created successfully')
        onSuccess?.()
        handleClose()
      } else {
        toast.error(response?.message || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error saving department:', error)
      toast.error('Failed to save department')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    reset({ name: '', description: '', active: true })
    setSettings(defaultSettings)
    setAttachmentFile(null)
    setAttachmentPreview(null)
    onClose()
  }

  const ToggleRow = ({ label, settingKey }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2.5,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
        {label}
      </Typography>
      <Switch
        checked={Boolean(settings[settingKey])}
        onChange={e => handleSettingChange(settingKey, e.target.checked)}
        size='small'
      />
    </Box>
  )

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '420px'] } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            p: 5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              {isEditMode ? 'Edit Department' : 'Add Department'}
            </Typography>
            <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
              {isEditMode ? 'Update department info & settings' : 'Create a new department'}
            </Typography>
          </Box>
          <IconButton size='small' onClick={handleClose} sx={{ mt: 0.5 }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box
          component='form'
          id='department-form'
          onSubmit={handleSubmit(onSubmit)}
          autoComplete='off'
          sx={{ flex: 1, overflowY: 'auto', px: 5, py: 4 }}
        >
          {loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Icon icon='mdi:loading' fontSize={32} className='spin' />
            </Box>
          ) : (
            <>
              {/* Name */}
              <Box sx={{ mb: 4 }}>
                <Typography variant='caption' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, mb: 1, display: 'block' }}>
                  Name <span style={{ color: theme.palette.error.main }}>*</span>
                </Typography>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      placeholder='Enter department name'
                      error={Boolean(errors.name)}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>

              {/* Description */}
              <Box sx={{ mb: 4 }}>
                <Typography variant='caption' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, mb: 1, display: 'block' }}>
                  Description
                </Typography>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      multiline
                      rows={3}
                      placeholder='Enter description'
                    />
                  )}
                />
              </Box>

              {/* Attachment */}
              <Box sx={{ mb: 4 }}>
                <Typography variant='caption' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, mb: 1, display: 'block' }}>
                  Attachment
                </Typography>
                {attachmentPreview ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box
                      component='img'
                      src={attachmentPreview}
                      alt='Preview'
                      sx={{
                        width: 120,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: `1px solid ${theme.palette.divider}`
                      }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    <IconButton
                      size='small'
                      onClick={handleRemoveAttachment}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 22,
                        height: 22,
                        backgroundColor: theme.palette.error.main,
                        color: theme.palette.error.contrastText,
                        '&:hover': { backgroundColor: theme.palette.error.dark }
                      }}
                    >
                      <Icon icon='mdi:close' fontSize={12} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    component='label'
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      py: 4,
                      border: `2px dashed ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.customColors.Surface
                      }
                    }}
                  >
                    <Icon icon='mdi:cloud-upload-outline' fontSize={28} color={theme.palette.customColors.Outline} />
                    <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                      Drop image or{' '}
                      <Typography component='span' variant='caption' sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                        browse
                      </Typography>
                    </Typography>
                    <input type='file' hidden accept='image/*' onChange={handleFileChange} />
                  </Box>
                )}
              </Box>

              {/* Active — edit only */}
              {isEditMode && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 2.5,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                    Active
                  </Typography>
                  <Controller
                    name='active'
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={Boolean(field.value)}
                        onChange={e => field.onChange(e.target.checked)}
                        size='small'
                      />
                    )}
                  />
                </Box>
              )}

              {/* Settings Divider */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  my: 4
                }}
              >
                <Typography
                  variant='caption'
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    color: theme.palette.customColors.neutralSecondary
                  }}
                >
                  Settings
                </Typography>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: theme.palette.divider }} />
              </Box>

              {/* Settings Toggles */}
              <ToggleRow label='Enable Costing' settingKey='enable_costing' />
              <ToggleRow label='Costing Mandatory' settingKey='costing_mandatory' />
              <ToggleRow label='Enable Approval' settingKey='enable_approval' />

              {/* Max Cost */}
              <Box sx={{ py: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant='caption' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, mb: 1, display: 'block' }}>
                  Max Cost for Auto-Approval
                </Typography>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  placeholder='e.g. 5000'
                  value={settings.max_cost_for_auto_approval}
                  onChange={e => handleSettingChange('max_cost_for_auto_approval', e.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Box>

              <ToggleRow label='Entity Selection Mandatory' settingKey='entity_selection_mandatory' />
              <ToggleRow label='Enable Vendor Selection' settingKey='enable_vendor_selection' />

              {/* Vendor Sub-settings */}
              {settings.enable_vendor_selection && (
                <Box
                  sx={{
                    pl: 2.5,
                    ml: 1,
                    borderLeft: `2px solid ${theme.palette.divider}`
                  }}
                >
                  <ToggleRow label='Vendor in Create Request' settingKey='enable_vendor_in_create_request' />
                  <ToggleRow label='Vendor by Department' settingKey='enable_vendor_by_department' />
                  <ToggleRow label='Vendor Selection Mandatory' settingKey='vendor_selection_mandatory' />
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            px: 5,
            py: 3,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Button variant='outlined' color='inherit' onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <LoadingButton
            variant='contained'
            type='submit'
            form='department-form'
            loading={submitting}
            disabled={loadingData}
          >
            {isEditMode ? 'Update' : 'Save'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default DepartmentDrawer
