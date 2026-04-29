import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Skeleton,
  TextField,
  Typography,
  useTheme
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import SelectOrganDrawer from './SelectOrganDrawer'
import EditTemplateDrawer from './EditTemplateDrawer'
import { getNecropsyTemplate, createNecropsyTemplate, getNecropsyBodyParts } from 'src/lib/api/necropsy'
import Toaster from 'src/components/Toaster'

// ==================== Interfaces ====================

interface OrganPart {
  id: string | number
  organ_name?: string
  label?: string
  name?: string
  value?: string
  description?: string
  desc?: string
  organ_id?: string | number
  body_part_id?: string | number
  section_name?: string
  body_section_name?: string
}

interface Organ {
  id: string | number
  section_id?: string | number
  body_part_id?: string | number
  body_section_id?: string | number
  label: string
  name?: string
  organ_name?: string
  section_name?: string
  body_section_name?: string
  section_label?: string
  parts?: OrganPart[]
  isExisting?: boolean
}

interface Template {
  id?: string | number
  template_id?: string | number
  name?: string
  template_name?: string
  organs?: Organ[]
  body_parts?: Organ[]
  template_items?: Organ[]
}

interface BodyPartsData {
  id?: string | number
  body_section_id?: string | number
  label?: string
  name?: string
  parts?: OrganPart[]
}

interface SelectedOrgan {
  id: string
  label: string
  parts: Array<{
    id: string | number
    organ_name: string
    label: string
    value: string
  }>
  isExisting?: boolean
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

interface FormattedOrgan {
  id: string
  label: string
  parts: Array<{
    id: string | number
    organ_name: string
    label: string
    value: string
  }>
}

interface AddOrganDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  organs?: Organ[]
  onApply: (organs: FormattedOrgan[]) => void
  onTemplatesUpdated?: () => void
}

// ==================== Component ====================

const AddOrganDrawer: FC<AddOrganDrawerProps> = ({ open, setOpen, organs, onApply, onTemplatesUpdated }) => {
  const theme = useTheme()
  const { t } = useTranslation('common')

  const [selectedTemplate, setSelectedTemplate] = useState<string | number | null>(null)
  const [openSelectOrganDrawer, setOpenSelectOrganDrawer] = useState<boolean>(false)
  const [selectedOrgans, setSelectedOrgans] = useState<SelectedOrgan[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateLoading, setTemplateLoading] = useState<boolean>(false)
  const [loadingTemplateOrgans, setLoadingTemplateOrgans] = useState<boolean>(false)
  const [saveTemplate, setSaveTemplate] = useState<boolean>(false)
  const [templateName, setTemplateName] = useState<string>('')
  const [saveLoading, setSaveLoading] = useState<boolean>(false)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [openEditDrawer, setOpenEditDrawer] = useState<boolean>(false)
  const [bodyPartsData, setBodyPartsData] = useState<BodyPartsData[]>([])
  const [searchMode, setSearchMode] = useState<boolean>(false)
  const [templateSearchText, setTemplateSearchText] = useState<string>('')

  useEffect(() => {
    if (open) {
      fetchTemplates()
      fetchBodyParts()

      if (organs && organs.length > 0) {
        setSelectedOrgans(
          organs.map(o => ({
            id: String(o.id),
            label: o.label,
            parts: (o.parts || []).map(p => ({
              id: p.id,
              organ_name: p.organ_name || p.label || p.name || '',
              label: p.label || p.organ_name || p.name || '',
              value: p.value || ''
            })),
            isExisting: true
          }))
        )
      } else {
        setSelectedOrgans([])
      }
    }
  }, [open, organs])

  const fetchBodyParts = async (): Promise<void> => {
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

  const fetchTemplates = async (): Promise<void> => {
    setTemplateLoading(true)
    try {
      const res = await getNecropsyTemplate()
      if (res?.success && res?.data) {
        const templates = 'result' in res.data ? res.data.result : res.data
        setTemplates((templates || []) as Template[])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleDrawerClose = (): void => {
    setOpen(false)
    setSelectedTemplate(null)
    setSelectedOrgans([])
    setSaveTemplate(false)
    setTemplateName('')
    setEditMode(false)
    setEditingTemplate(null)
    setSearchMode(false)
    setTemplateSearchText('')
  }

  const handleTemplateClick = (template: Template): void => {
    if (editMode) {
      setEditingTemplate(template)
      setOpenEditDrawer(true)

      return
    }

    const templateId = template.id || template.template_id
    const isAlreadySelected = selectedTemplate === templateId

    if (isAlreadySelected) {
      setSelectedTemplate(null)
      setSelectedOrgans(prev => prev.filter(o => o.isExisting))
    } else {
      setSelectedTemplate(templateId || null)
      setLoadingTemplateOrgans(true)

      const templateItems = template.organs || template.body_parts || template.template_items || []

      const templateOrgans: SelectedOrgan[] = templateItems.map(organ => {
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
          id: String(sectionId || `organ_${Date.now()}_${Math.random()}`),
          label: sectionLabel,
          parts: (organ.parts || []).map((part, idx) => ({
            id: part.id || part.organ_id || `part_${Date.now()}_${idx}`,
            organ_name: part.organ_name || part.name || part.label || '',
            label: part.label || part.name || part.organ_name || '',
            value: part.description || part.desc || part.value || ''
          })),
          isExisting: false
        }
      })

      setSelectedOrgans(prev => {
        const existingOrgans = prev.filter(o => o.isExisting)
        const combined = [...existingOrgans, ...templateOrgans]

        return combined.filter((organ, index, self) => index === self.findIndex(o => o.id === organ.id))
      })

      setLoadingTemplateOrgans(false)
    }
  }

  const handleEditTemplateSave = (): void => {
    fetchTemplates()
    setEditingTemplate(null)
    // Clear the selected template so user can re-select to get updated data
    setSelectedTemplate(null)
    setSelectedOrgans(prev => prev.filter(o => o.isExisting))
    // Notify parent to refresh its template list
    if (onTemplatesUpdated) onTemplatesUpdated()
  }

  const handleEditTemplateDelete = (): void => {
    fetchTemplates()
    setEditingTemplate(null)

    if (selectedTemplate === (editingTemplate?.id || editingTemplate?.template_id)) {
      setSelectedTemplate(null)
      setSelectedOrgans(prev => prev.filter(o => o.isExisting))
    }
    // Notify parent to refresh its template list
    if (onTemplatesUpdated) onTemplatesUpdated()
  }

  const handleAddOrgans = (newOrgans: NewOrgan[]): void => {
    const organsToAdd: SelectedOrgan[] = newOrgans.map(o => ({
      id: String(o.id),
      label: o.label,
      parts: (o.parts || []).map((part, idx) => ({
        id: part.id || `part_${Date.now()}_${idx}`,
        organ_name: part.organ_name || part.label || part.name || '',
        label: part.label || part.organ_name || part.name || '',
        value: part.value || ''
      })),
      isExisting: false
    }))

    setSelectedOrgans(prev => {
      const merged = [...prev]

      organsToAdd.forEach(newOrgan => {
        const existingIndex = merged.findIndex(o => o.id === newOrgan.id)
        if (existingIndex >= 0) {
          const existingOrgan = merged[existingIndex]
          const existingPartIds = existingOrgan.parts.map(p => p.id)
          const newParts = newOrgan.parts.filter(p => !existingPartIds.includes(p.id))
          merged[existingIndex] = {
            ...existingOrgan,
            parts: [...existingOrgan.parts, ...newParts],
            isExisting: existingOrgan.isExisting
          }
        } else {
          merged.push(newOrgan)
        }
      })

      return merged
    })
  }

  const handleRemoveOrgan = (organId: string): void => {
    setSelectedOrgans(prev => prev.filter(o => o.id !== organId))
  }

  const handleRemovePart = (organId: string, partId: string | number): void => {
    setSelectedOrgans(prev => {
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
        .filter((organ): organ is SelectedOrgan => organ !== null)
    })
  }

  const handlePartDescriptionChange = (organId: string, partId: string | number, value: string): void => {
    setSelectedOrgans(prev => {
      return prev.map(organ => {
        if (organ.id !== organId) return organ

        return {
          ...organ,
          parts: organ.parts.map(part => {
            if (part.id !== partId) return part

            return {
              ...part,
              value: value
            }
          })
        }
      })
    })
  }

  const handleClearAll = (): void => {
    setSelectedOrgans([])
    setSelectedTemplate(null)
  }

  const handleSaveTemplate = async (): Promise<void> => {
    if (!templateName.trim()) {
      Toaster({ type: 'error', message: t('necropsy_module.please_enter_template_name') })

      return
    }

    setSaveLoading(true)
    try {
      const templateItems = selectedOrgans.reduce<Array<{ id: string | number; desc: string }>>((acc, organ) => {
        const parts =
          organ.parts?.map(part => ({
            id: part.id,
            desc: part.value || ''
          })) || []

        return [...acc, ...parts]
      }, [])

      const payload = {
        template_name: templateName.trim(),
        template_items: templateItems
      }

      const res = await createNecropsyTemplate(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('necropsy_module.template_saved_successfully') })
        setTemplateName('')
        setSaveTemplate(false)
        fetchTemplates()
        // Notify parent to refresh its template list
        if (onTemplatesUpdated) onTemplatesUpdated()
      } else {
        Toaster({ type: 'error', message: res?.message || t('necropsy_module.failed_to_save_template') })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      Toaster({ type: 'error', message: t('necropsy_module.something_went_wrong_saving_template') })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleApply = (): void => {
    const formattedOrgans: FormattedOrgan[] = selectedOrgans.map(organ => ({
      id: organ.id,
      label: organ.label,
      parts:
        organ.parts.length > 0
          ? organ.parts.map(p => ({
              id: p.id,
              organ_name: p.organ_name || p.label || '',
              label: p.label || p.organ_name || '',
              value: p.value || ''
            }))
          : [
              {
                id: `part_${Date.now()}`,
                organ_name: '',
                label: '',
                value: ''
              }
            ]
    }))

    onApply(formattedOrgans)
    handleDrawerClose()
  }

  const hasOrgans = selectedOrgans.length > 0
  const totalParts = selectedOrgans.reduce((sum, o) => sum + (o.parts?.length || 0), 0)

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
              <Typography
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {t('necropsy_module.add_organs')}
              </Typography>
            </Box>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ px: 6, pt: 6, pb: 3 }}>
              <Button
                onClick={() => setOpenSelectOrganDrawer(true)}
                sx={{
                  width: '100%',
                  backgroundColor: theme.palette.customColors.SecondaryContainer,
                  color: theme.palette.customColors.OnSecondaryContainer,
                  fontSize: '20px',
                  fontWeight: 500,
                  textTransform: 'none',
                  py: 2,
                  '&:hover': { backgroundColor: theme.palette.customColors.SecondaryContainer }
                }}
                startIcon={<Icon icon='mdi:plus' fontSize={30} />}
              >
                {t('necropsy_module.add_organ')}
              </Button>
            </Box>

            {loadingTemplateOrgans && (
              <Box display='flex' justifyContent='center' alignItems='center' py={2}>
                <CircularProgress size={28} />
              </Box>
            )}

            {selectedOrgans.length > 0 && (
              <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Typography
                  sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('necropsy_module.selected_organs_count', { count: totalParts })}
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
                  {selectedOrgans.map(organ => (
                    <Box
                      key={organ.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        borderRadius: 0.5
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          {organ.label}
                        </Typography>
                      </Box>
                      {organ.parts?.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {organ.parts.map((part, idx) => (
                            <Box key={part.id || idx} sx={{ position: 'relative' }}>
                              <TextField
                                fullWidth
                                size='small'
                                label={t('necropsy_module.enter_description', { partName: part.organ_name || part.label || `${t('necropsy_module.part_label', { index: idx + 1 })}` })}
                                placeholder={t('necropsy_module.enter_description', { partName: part.organ_name || part.label || `${t('necropsy_module.part_label', { index: idx + 1 })}` })}
                                multiline
                                rows={2}
                                value={part.value || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handlePartDescriptionChange(organ.id, part.id, e.target.value)
                                }
                                sx={{
                                  backgroundColor: theme.palette.customColors.OnPrimary,
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '4px',
                                    paddingRight: '40px'
                                  }
                                }}
                              />
                              <IconButton
                                size='small'
                                onClick={() => handleRemovePart(organ.id, part.id)}
                                sx={{
                                  position: 'absolute',
                                  right: 8,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  p: 0.5,
                                  '&:hover': {
                                    backgroundColor: theme.palette.error.light + '20'
                                  }
                                }}
                              >
                                <Icon
                                  icon='zondicons:close-outline'
                                  fontSize={24}
                                  color={theme.palette.customColors.Error}
                                />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>

                {saveTemplate ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <TextField
                      placeholder={t('necropsy_module.enter_template_name')}
                      value={templateName}
                      sx={{
                        flex: 1,
                        '& .MuiInputBase-root': {
                          backgroundColor: theme.palette.customColors.Surface
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                          }
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '1rem',
                          fontWeight: 400
                        }
                      }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                    />
                    <Button
                      variant='contained'
                      sx={{ height: '48px' }}
                      startIcon={<Icon icon='material-symbols:save-outline-rounded' />}
                      onClick={handleSaveTemplate}
                      disabled={templateName.trim() === '' || saveLoading}
                    >
                      {saveLoading ? <CircularProgress size={24} color='inherit' /> : t('save')}
                    </Button>
                    <Button
                      sx={{
                        textTransform: 'none',
                        color: theme.palette.customColors.Error,
                        fontSize: '1rem',
                        fontWeight: 600
                      }}
                      startIcon={<Icon icon='bitcoin-icons:cross-outline' />}
                      onClick={() => {
                        setTemplateName('')
                        setSaveTemplate(false)
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '2.5px',
                        cursor: hasOrgans ? 'pointer' : 'not-allowed',
                        opacity: hasOrgans ? 1 : 0.5
                      }}
                      onClick={hasOrgans ? () => setSaveTemplate(true) : undefined}
                    >
                      <Icon
                        icon='material-symbols:save-outline-rounded'
                        color={hasOrgans ? theme.palette.customColors.OnSurface : theme.palette.text.disabled}
                      />
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: hasOrgans ? theme.palette.customColors.OnSurface : theme.palette.text.disabled
                        }}
                      >
                        {t('necropsy_module.save_as_template')}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: hasOrgans ? theme.palette.customColors.Error : theme.palette.text.disabled,
                        cursor: hasOrgans ? 'pointer' : 'not-allowed',
                        opacity: hasOrgans ? 1 : 0.5
                      }}
                      onClick={hasOrgans ? handleClearAll : undefined}
                    >
                      {t('necropsy_module.clear_all')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {templates.length > 0 && (
              <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '1.25rem', fontWeight: 500 }}
                  >
                    {t('necropsy_module.templates')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 0.4,
                        backgroundColor: searchMode ? theme.palette.customColors.OnBackground : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: searchMode
                            ? theme.palette.customColors.OnBackground
                            : theme.palette.action.hover
                        }
                      }}
                      onClick={() => {
                        setSearchMode(!searchMode)
                        if (searchMode) {
                          setTemplateSearchText('')
                        }
                      }}
                    >
                      <Icon icon='mdi:magnify' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        backgroundColor: editMode ? theme.palette.primary.main : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: editMode ? theme.palette.primary.dark : theme.palette.action.hover
                        }
                      }}
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Icon
                        icon='mdi:pencil-outline'
                        fontSize={18}
                        color={editMode ? theme.palette.common.white : theme.palette.customColors.OnSurfaceVariant}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: editMode ? theme.palette.common.white : theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {editMode ? t('necropsy_module.done') : t('edit')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {searchMode && (
                  <TextField
                    fullWidth
                    size='small'
                    placeholder={t('necropsy_module.search_templates')}
                    value={templateSearchText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateSearchText(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Icon
                          icon='mdi:magnify'
                          fontSize={20}
                          style={{ marginRight: 8 }}
                          color={theme.palette.customColors.OnSurfaceVariant}
                        />
                      ),
                      endAdornment: templateSearchText && (
                        <IconButton size='small' onClick={() => setTemplateSearchText('')}>
                          <Icon icon='mdi:close' fontSize={18} />
                        </IconButton>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.palette.customColors.Surface || theme.palette.grey[50],
                        borderRadius: 1
                      }
                    }}
                  />
                )}
                {templateLoading ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, py: 2 }}>
                    {Array.from(new Array(6)).map((_, index) => (
                      <Box key={index} sx={{ width: '45%' }}>
                        <Skeleton
                          variant='rectangular'
                          height={50}
                          animation='wave'
                          sx={{ borderRadius: 1, bgcolor: theme.palette.action.hover }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {templates
                      .filter(template => {
                        if (!templateSearchText.trim()) return true
                        const name = (template.name || template.template_name || '').toLowerCase()

                        return name.includes(templateSearchText.trim().toLowerCase())
                      })
                      .map((template, index) => {
                        const templateId = template.id || template.template_id
                        const isSelected = selectedTemplate === templateId

                        return (
                          <Box
                            key={templateId || index}
                            onClick={() => handleTemplateClick(template)}
                            sx={{
                              p: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              backgroundColor: editMode
                                ? theme.palette.action.hover
                                : isSelected
                                ? theme.palette.customColors.OnBackground
                                : theme.palette.customColors.OnPrimary,
                              border: editMode
                                ? `2px dashed ${theme.palette.primary.main}`
                                : isSelected
                                ? `2px solid ${theme.palette.primary.main}`
                                : `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                              borderRadius: 1,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '1rem',
                              fontWeight: isSelected ? 600 : 400,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {editMode && <Icon icon='mdi:pencil' fontSize={16} color={theme.palette.primary.main} />}
                            {template.name || template.template_name}
                          </Box>
                        )
                      })}
                  </Box>
                )}
              </Box>
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
            <Button variant='contained' fullWidth onClick={handleApply} sx={{ height: '56px' }}>
              {t('necropsy_module.apply')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {openSelectOrganDrawer && (
        <SelectOrganDrawer
          open={openSelectOrganDrawer}
          setOpen={setOpenSelectOrganDrawer}
          selectedOrgans={selectedOrgans}
          onAddSelected={handleAddOrgans}
        />
      )}

      {openEditDrawer && editingTemplate && (
        <EditTemplateDrawer
          open={openEditDrawer}
          setOpen={setOpenEditDrawer}
          template={editingTemplate}
          onSave={handleEditTemplateSave}
          onDelete={handleEditTemplateDelete}
        />
      )}
    </>
  )
}

export default AddOrganDrawer
