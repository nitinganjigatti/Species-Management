import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
  useTheme
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import SelectOrganDrawer from './SelectOrganDrawer'
import { updateNecropsyTemplate, deleteNecropsyTemplate, getNecropsyBodyParts } from 'src/lib/api/necropsy'
import Toaster from 'src/components/Toaster'

// ==================== Interfaces ====================

interface TemplatePart {
  id: string | number
  organ_name?: string
  label?: string
  name?: string
  body_part_name?: string
  description?: string
  value?: string
  desc?: string
  organ_id?: string | number
  body_part_id?: string | number
  section_name?: string
  body_section_name?: string
}

interface TemplateOrgan {
  id: string | number
  section_id?: string | number
  body_part_id?: string | number
  body_section_id?: string | number
  label?: string
  name?: string
  organ_name?: string
  section_name?: string
  body_section_name?: string
  section_label?: string
  parts?: TemplatePart[]
}

interface Template {
  id?: string | number
  template_id?: string | number
  name?: string
  template_name?: string
  organs?: TemplateOrgan[]
  body_parts?: TemplateOrgan[]
  template_items?: TemplateOrgan[]
}

interface BodyPartsData {
  id?: string | number
  body_section_id?: string | number
  label?: string
  name?: string
  parts?: TemplatePart[]
}

interface ProcessedOrgan {
  id: string
  label: string
  parts: ProcessedPart[]
}

interface ProcessedPart {
  id: string | number
  organ_name: string
  label: string
  description: string
}

interface NewOrgan {
  id: string | number
  label: string
  parts?: Array<{
    id?: string | number
    organ_name?: string
    label?: string
    name?: string
    value?: string
  }>
}

interface EditTemplateDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  template: Template | null
  onSave?: () => void
  onDelete?: () => void
}

// ==================== Component ====================

const EditTemplateDrawer: FC<EditTemplateDrawerProps> = ({ open, setOpen, template, onSave, onDelete }) => {
  const theme = useTheme()
  const { t } = useTranslation('common')

  const [templateName, setTemplateName] = useState<string>('')
  const [templateData, setTemplateData] = useState<ProcessedOrgan[]>([])
  const [openSelectOrganDrawer, setOpenSelectOrganDrawer] = useState<boolean>(false)
  const [saveLoading, setSaveLoading] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [bodyPartsData, setBodyPartsData] = useState<BodyPartsData[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchBodyParts = async (): Promise<void> => {
      setLoading(true)
      try {
        const res = await getNecropsyBodyParts({})
        if (res?.success && res?.data) {
          const bodyParts = 'result' in res.data ? res.data.result : res.data
          setBodyPartsData(bodyParts as BodyPartsData[])
        }
      } catch (error) {
        console.error('Error fetching body parts:', error)
      }
    }

    if (open) {
      fetchBodyParts()
    }
  }, [open])

  useEffect(() => {
    if (open && template && bodyPartsData.length > 0) {
      setTemplateName(template.name || template.template_name || '')

      const items = template.organs || template.body_parts || template.template_items || []

      const organData: ProcessedOrgan[] = items.map(organ => {
        const sectionId = organ.id || organ.section_id || organ.body_part_id || organ.body_section_id

        const matchingSection = bodyPartsData.find(
          section => String(section.id || section.body_section_id) === String(sectionId)
        )

        const sectionLabel =
          matchingSection?.label ||
          matchingSection?.name ||
          organ.label ||
          organ.name ||
          organ.organ_name ||
          organ.section_name ||
          organ.body_section_name ||
          organ.section_label ||
          organ.parts?.[0]?.section_name ||
          organ.parts?.[0]?.body_section_name ||
          ''

        return {
          id: String(sectionId),
          label: sectionLabel,
          parts: (organ.parts || []).map((part, idx) => ({
            id: part.id || part.organ_id || part.body_part_id || `part_${idx}`,
            organ_name: part.organ_name || part.name || part.label || part.body_part_name || '',
            label: part.label || part.name || part.organ_name || part.body_part_name || '',
            description: part.description || part.value || part.desc || ''
          }))
        }
      })
      setTemplateData(organData)
      setLoading(false)
    }
  }, [open, template, bodyPartsData])

  const handleDrawerClose = (): void => {
    setOpen(false)
    setTemplateName('')
    setTemplateData([])
    setShowDeleteConfirm(false)
    setLoading(true)
  }

  const handleRemovePart = (organId: string, partId: string | number): void => {
    setTemplateData(prev => {
      return prev
        .map(organ => {
          if (organ.id !== organId) return organ

          const updatedParts = organ.parts.filter(p => p.id !== partId)

          if (updatedParts.length === 0) {
            return null
          }

          return {
            ...organ,
            parts: updatedParts
          }
        })
        .filter((organ): organ is ProcessedOrgan => organ !== null)
    })
  }

  const handlePartDescriptionChange = (organId: string, partId: string | number, value: string): void => {
    setTemplateData(prev => {
      return prev.map(organ => {
        if (organ.id !== organId) return organ
        
return {
          ...organ,
          parts: organ.parts.map(part => {
            if (part.id !== partId) return part
            
return { ...part, description: value }
          })
        }
      })
    })
  }

  const handleRemoveOrgan = (organId: string): void => {
    setTemplateData(prev => prev.filter(o => o.id !== organId))
  }

  const handleAddOrgans = (newOrgans: NewOrgan[]): void => {
    const organsToAdd: ProcessedOrgan[] = newOrgans.map(o => ({
      id: String(o.id),
      label: o.label,
      parts: (o.parts || []).map((part, idx) => ({
        id: part.id || `part_${Date.now()}_${idx}`,
        organ_name: part.organ_name || part.label || part.name || '',
        label: part.label || part.organ_name || part.name || '',
        description: ''
      }))
    }))

    setTemplateData(prev => {
      const merged = [...prev]

      organsToAdd.forEach(newOrgan => {
        const existingIndex = merged.findIndex(o => o.id === newOrgan.id)
        if (existingIndex >= 0) {
          const existingOrgan = merged[existingIndex]
          const existingPartIds = existingOrgan.parts.map(p => p.id)
          const newParts = newOrgan.parts.filter(p => !existingPartIds.includes(p.id))
          merged[existingIndex] = {
            ...existingOrgan,
            parts: [...existingOrgan.parts, ...newParts]
          }
        } else {
          merged.push(newOrgan)
        }
      })

      return merged
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!templateName.trim()) {
      Toaster({ type: 'error', message: t('necropsy_module.please_enter_template_name') })

      return
    }

    if (templateData.length === 0) {
      setShowDeleteConfirm(true)

      return
    }

    setSaveLoading(true)
    try {
      const templateItems = templateData.reduce<Array<{ id: string | number; desc: string }>>((acc, organ) => {
        const parts =
          organ.parts?.map(part => ({
            id: part.id,
            desc: part.description || ''
          })) || []

        return [...acc, ...parts]
      }, [])

      const payload = {
        template_name: templateName.trim(),
        template_items: JSON.stringify(templateItems)
      }

      const templateId = Number(template?.id || template?.template_id)
      const res = await updateNecropsyTemplate(templateId, payload)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('necropsy_module.template_updated_successfully') })
        if (onSave) onSave()
        handleDrawerClose()
      } else {
        Toaster({ type: 'error', message: res?.message || t('necropsy_module.failed_to_update_template') })
      }
    } catch (error) {
      console.error('Error updating template:', error)
      Toaster({ type: 'error', message: t('necropsy_module.error_updating_template') })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    setDeleteLoading(true)
    try {
      const templateId = Number(template?.id || template?.template_id)
      const res = await deleteNecropsyTemplate(templateId)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('necropsy_module.template_deleted_successfully') })
        if (onDelete) onDelete()
        handleDrawerClose()
      } else {
        Toaster({ type: 'error', message: res?.message || t('necropsy_module.failed_to_delete_template') })
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      Toaster({ type: 'error', message: t('necropsy_module.error_deleting_template') })
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const totalParts = templateData.reduce((sum, o) => sum + (o.parts?.length || 0), 0)

  return (
    <>
      <Drawer
        anchor='right'
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '562px'],
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        open={open}
        onClose={handleDrawerClose}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: '1.2rem',
              py: '1rem',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Icon icon='mdi:file-document-edit-outline' fontSize={32} color={theme.palette.primary.main} />
              <Typography
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {t('necropsy_module.edit_template')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                size='small'
                onClick={() => setShowDeleteConfirm(true)}
                sx={{ color: theme.palette.error.main }}
              >
                <Icon icon='mdi:delete-outline' fontSize={26} />
              </IconButton>
              <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
                <Icon icon='mdi:close' fontSize={30} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ px: 6, pt: 6 }}>
                <Skeleton variant='rectangular' height={56} sx={{ borderRadius: 1, mb: 3 }} />

                <Skeleton variant='rectangular' height={52} sx={{ borderRadius: 1, mb: 4 }} />

                <Skeleton variant='text' width={200} height={28} sx={{ mb: 3 }} />

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: 4,
                    backgroundColor: theme.palette.customColors.Background,
                    borderRadius: 1
                  }}
                >
                  {[1, 2, 3].map(item => (
                    <Box
                      key={item}
                      sx={{
                        p: 4,
                        backgroundColor: theme.palette.customColors.OnPrimary,
                        border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                        borderRadius: 1
                      }}
                    >
                      <Skeleton variant='text' width={120} height={24} sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Skeleton variant='rounded' width={100} height={32} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant='rounded' width={80} height={32} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant='rounded' width={90} height={32} sx={{ borderRadius: '16px' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ px: 6, pt: 6, pb: 3 }}>
                  <TextField
                    fullWidth
                    label={t('necropsy_module.template_name')}
                    value={templateName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: theme.palette.customColors.Surface
                      }
                    }}
                  />
                </Box>

                <Box sx={{ px: 6, pb: 3 }}>
                  <Button
                    onClick={() => setOpenSelectOrganDrawer(true)}
                    sx={{
                      width: '100%',
                      backgroundColor: theme.palette.customColors.SecondaryContainer,
                      color: theme.palette.customColors.OnSecondaryContainer,
                      fontSize: '18px',
                      fontWeight: 500,
                      textTransform: 'none',
                      py: 2,
                      '&:hover': { backgroundColor: theme.palette.customColors.SecondaryContainer }
                    }}
                    startIcon={<Icon icon='mdi:plus' fontSize={26} />}
                  >
                    {t('necropsy_module.add_organ')}
                  </Button>
                </Box>

                {templateData.length > 0 ? (
                  <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Typography
                      sx={{ fontSize: '18px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      {t('necropsy_module.organs_summary', { parts: totalParts, categories: templateData.length })}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        p: 4,
                        backgroundColor: theme.palette.customColors.Background,
                        borderRadius: 1
                      }}
                    >
                      {templateData.map(organ => (
                        <Box
                          key={organ.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            p: 4,
                            backgroundColor: theme.palette.customColors.OnPrimary,
                            border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                            borderRadius: 1
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                                mb: 4
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '1rem',
                                  fontWeight: 600,
                                  color: theme.palette.customColors.OnSurfaceVariant
                                }}
                              >
                                {organ.label || `${t('necropsy_module.category')} ${organ.id}`}
                              </Typography>
                              <IconButton onClick={() => handleRemoveOrgan(organ.id)} size='small'>
                                <Icon icon='zondicons:close-outline' color={theme.palette.customColors.Error} />
                              </IconButton>
                            </Box>
                            {organ.parts?.length > 0 && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                {organ.parts.map((part, idx) => {
                                  const partName = part.organ_name || part.label || t('necropsy_module.part_label', { index: idx + 1 })

                                  return (
                                    <TextField
                                      key={part.id || idx}
                                      fullWidth
                                      size='small'
                                      label={t('necropsy_module.enter_description', { partName })}
                                      multiline
                                      rows={1}
                                      value={part.description || ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        handlePartDescriptionChange(organ.id, part.id, e.target.value)
                                      }
                                      sx={{
                                        backgroundColor: theme.palette.customColors.Surface,
                                        '& .MuiOutlinedInput-root': {
                                          borderRadius: '4px'
                                        },
                                        '& .MuiOutlinedInput-input': {
                                          padding: '8px 12px'
                                        }
                                      }}
                                      InputProps={{
                                        endAdornment: (
                                          <InputAdornment position='end'>
                                            <IconButton
                                              size='small'
                                              onClick={() => handleRemovePart(organ.id, part.id)}
                                              edge='end'
                                              sx={{
                                                color: theme.palette.text.secondary,
                                                '&:hover': {
                                                  color: theme.palette.error.main,
                                                  backgroundColor: 'transparent'
                                                }
                                              }}
                                            >
                                              <Icon icon='mdi:close' fontSize={18} />
                                            </IconButton>
                                          </InputAdornment>
                                        )
                                      }}
                                    />
                                  )
                                })}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      mx: 6,
                      p: 4,
                      textAlign: 'center',
                      border: `1px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                      bgcolor: theme.palette.customColors?.bodyBg || theme.palette.grey[50]
                    }}
                  >
                    <Typography color='text.secondary'>
                      {t('necropsy_module.no_organs_in_template')}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              onClick={handleDrawerClose}
              sx={{
                borderColor: theme.palette.customColors.OnPrimaryContainer,
                color: theme.palette.customColors.OnPrimaryContainer,
                height: '56px'
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              variant='contained'
              fullWidth
              onClick={handleSave}
              disabled={saveLoading || !templateName.trim()}
              sx={{ height: '56px' }}
            >
              {saveLoading ? <CircularProgress size={24} color='inherit' /> : t('save')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {openSelectOrganDrawer && (
        <SelectOrganDrawer
          open={openSelectOrganDrawer}
          setOpen={setOpenSelectOrganDrawer}
          selectedOrgans={templateData}
          onAddSelected={handleAddOrgans}
        />
      )}

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>{t('necropsy_module.delete_template')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('necropsy_module.delete_template_confirmation')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}>
            {t('cancel')}
          </Button>
          <Button onClick={handleDelete} color='error' variant='contained' disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={20} color='inherit' /> : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default EditTemplateDrawer
