import React, { useState, useEffect, useCallback, memo, FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  alpha,
  InputAdornment,
  CircularProgress,
  Skeleton
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import AddOrganDrawer from './AddOrganDrawer'
import { createNecropsyTemplate, getNecropsyTemplate, getNecropsyBodyParts } from 'src/lib/api/necropsy'
import Toaster from 'src/components/Toaster'
import { useTheme } from '@mui/system'

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

interface ProcessedOrgan {
  id: string
  label: string
  parts: Array<{
    id: string | number
    organ_name: string
    label: string
    value: string
  }>
}

interface NecropsyOrganSectionProps {
  organs?: Organ[]
  onChange: (organs: ProcessedOrgan[]) => void
  disabled?: boolean
}

// ==================== Component ====================

const NecropsyOrganSection: FC<NecropsyOrganSectionProps> = ({ organs = [], onChange, disabled = false }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [openAddOrganDrawer, setOpenAddOrganDrawer] = useState<boolean>(false)
  const [saveTemplate, setSaveTemplate] = useState<boolean>(false)
  const [templateName, setTemplateName] = useState<string>('')
  const [saveLoading, setSaveLoading] = useState<boolean>(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateLoading, setTemplateLoading] = useState<boolean>(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | number | null>(null)
  const [bodyPartsData, setBodyPartsData] = useState<BodyPartsData[]>([])

  useEffect(() => {
    fetchTemplates()
    fetchBodyParts()
  }, [])

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

  const handleTemplateClick = useCallback(
    (template: Template): void => {
      const templateId = template.id || template.template_id
      const isAlreadySelected = selectedTemplate === templateId

      if (isAlreadySelected) {
        setSelectedTemplate(null)
        onChange([])
      } else {
        setSelectedTemplate(templateId || null)

        const templateItems = template.organs || template.body_parts || template.template_items || []

        const templateOrgans: ProcessedOrgan[] = templateItems.map(organ => {
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
              value: part.description || part.desc || ''
            }))
          }
        })

        onChange(templateOrgans)
      }
    },
    [selectedTemplate, bodyPartsData, onChange]
  )

  const handleApplyOrgans = (newOrgans: ProcessedOrgan[]): void => {
    onChange(newOrgans)
    setSelectedTemplate(null)
  }

  const handleRemoveOrgan = (index: number): void => {
    const updated = organs.filter((_, i) => i !== index)
    onChange(updated as ProcessedOrgan[])
  }

  const handlePartChange = (organIndex: number, partIndex: number, field: string, value: string): void => {
    const updated = [...organs]
    const organ = { ...updated[organIndex] }
    const parts = [...(organ.parts || [])]
    parts[partIndex] = { ...parts[partIndex], [field]: value }
    organ.parts = parts
    updated[organIndex] = organ
    onChange(updated as ProcessedOrgan[])
  }

  const handleRemovePart = (organIndex: number, partIndex: number): void => {
    const updated = [...organs]
    const organ = { ...updated[organIndex] }
    const parts = (organ.parts || []).filter((_, i) => i !== partIndex)

    if (parts.length === 0) {
      onChange(updated.filter((_, i) => i !== organIndex) as ProcessedOrgan[])
    } else {
      organ.parts = parts
      updated[organIndex] = organ
      onChange(updated as ProcessedOrgan[])
    }
  }

  const handleSaveTemplate = async (): Promise<void> => {
    if (!templateName.trim()) {
      Toaster({ type: 'error', message: t('necropsy_module.please_enter_template_name') })

      return
    }

    setSaveLoading(true)
    try {
      const templateItems = organs.reduce<Array<{ id: string | number; desc: string }>>((acc, organ) => {
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

  const handleClearAll = (): void => {
    onChange([])
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          {t('necropsy_module.organ_wise_description_of_lessions')}
        </Typography>
        <Box
          onClick={() => setOpenAddOrganDrawer(true)}
          sx={{
            backgroundColor: theme.palette.customColors?.addPrimary,
            py: 2,
            px: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 0.5
          }}
        >
          <Icon icon='lucide:square-plus' fontSize={18} color={theme.palette.customColors?.OnPrimary} />
          <Typography sx={{ color: theme.palette.customColors?.OnPrimary, fontSize: '16px', fontWeight: 600 }}>
            {t('necropsy_module.select_organ')}
          </Typography>
        </Box>
      </Box>

      {organs.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
            py: 4,
            px: 4
          }}
        >
          {organs.map((organ, organIndex) => (
            <Box
              key={organ.id || organIndex}
              sx={{
                borderRadius: '8px'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 4
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    {organ.label || t('necropsy_module.organ_label', { index: organIndex + 1 })}
                  </Typography>

                  <Typography variant='caption' color='text.secondary'>
                    {t('necropsy_module.parts_count', { count: organ.parts?.length || 0 })}
                  </Typography>
                </Box>

                {!disabled && (
                  <IconButton
                    size='small'
                    onClick={() => handleRemoveOrgan(organIndex)}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <Icon icon={'fontisto:close'} color={theme.palette.customColors.Tertiary} fontSize={18} />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {organ.parts?.map((part, partIndex) => {
                  const partName = part.organ_name || part.label || t('necropsy_module.part_label', { index: partIndex + 1 })

                  return (
                    <Box
                      key={part.id || partIndex}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <TextField
                        fullWidth
                        size='small'
                        label={t('necropsy_module.enter_description', { partName })}
                        multiline
                        rows={1}
                        value={part.value || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handlePartChange(organIndex, partIndex, 'value', e.target.value)
                        }
                        disabled={disabled}
                        sx={{
                          backgroundColor: theme.palette.customColors.OnPrimary,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '4px'
                          }
                        }}
                        InputProps={{
                          endAdornment: !disabled && (
                            <InputAdornment position='end'>
                              <IconButton
                                size='small'
                                onClick={() => handleRemovePart(organIndex, partIndex)}
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
                    </Box>
                  )
                })}
              </Box>
            </Box>
          ))}
          {!disabled && (
            <Box sx={{ mt: 2 }}>
              {saveTemplate ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <TextField
                    placeholder={t('necropsy_module.enter_template_name')}
                    value={templateName}
                    size='small'
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': {
                        backgroundColor: theme.palette.customColors.OnPrimary
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                        }
                      }
                    }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                  />
                  <Button
                    variant='contained'
                    size='small'
                    sx={{ height: '40px', minWidth: '80px' }}
                    startIcon={<Icon icon='material-symbols:save-outline-rounded' />}
                    onClick={handleSaveTemplate}
                    disabled={templateName.trim() === '' || saveLoading}
                  >
                    {saveLoading ? <CircularProgress size={20} color='inherit' /> : t('save')}
                  </Button>
                  <Button
                    size='small'
                    sx={{
                      textTransform: 'none',
                      color: theme.palette.customColors.Error,
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
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
                      gap: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => setSaveTemplate(true)}
                  >
                    <Icon icon='material-symbols:save-outline-rounded' color={theme.palette.customColors.OnSurface} />
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: theme.palette.customColors.OnSurface
                      }}
                    >
                      {t('necropsy_module.save_as_template')}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: theme.palette.customColors.Error,
                      cursor: 'pointer'
                    }}
                    onClick={handleClearAll}
                  >
                    {t('clear_all')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          {/* Select from Templates Section - Inside organs box */}
          {!disabled && templates.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('necropsy_module.select_from_templates')}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer'
                  }}
                  onClick={() => setOpenAddOrganDrawer(true)}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.palette.primary.main
                    }}
                  >
                    {t('necropsy_module.see_all')}
                  </Typography>
                  <Icon icon='mdi:chevron-right' fontSize={18} color={theme.palette.primary.main} />
                </Box>
              </Box>

              {templateLoading ? (
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                  {Array.from(new Array(5)).map((_, index) => (
                    <Skeleton
                      key={index}
                      variant='rectangular'
                      width={140}
                      height={40}
                      sx={{ borderRadius: 1, flexShrink: 0 }}
                    />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                      height: 6,
                      display: 'none'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.divider,
                      borderRadius: 3
                    }
                  }}
                >
                  {templates.map((template, index) => {
                    const templateId = template.id || template.template_id
                    const isSelected = selectedTemplate === templateId

                    return (
                      <Box
                        key={templateId || index}
                        onClick={() => handleTemplateClick(template)}
                        sx={{
                          px: 6,
                          py: 2,
                          backgroundColor: isSelected
                            ? theme.palette.customColors.OnPrimaryContainer
                            : theme.palette.customColors.neutral05,
                          border: `1px solid ${
                            isSelected
                              ? theme.palette.customColors.OnPrimaryContainer
                              : theme.palette.customColors.OutlineVariant
                          }`,
                          borderRadius: '4px',
                          color: isSelected
                            ? theme.palette.customColors.OnPrimary
                            : theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isSelected
                              ? theme.palette.customColors.OnPrimaryContainer
                              : theme.palette.action.hover
                          }
                        }}
                      >
                        {template.name || template.template_name}
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            p: 4,
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 0.4,
            bgcolor: '#E8F4F266',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
          }}
        >
          <img src='/images/necropsy/organ_sheet.svg' alt='organ_sheet' />
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
            {t('necropsy_module.select_new_organs_or_add_from_templates')}
          </Typography>

          {/* Select from Templates Section - Inside empty state box */}
          {!disabled && templates.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('necropsy_module.select_from_templates')}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer'
                  }}
                  onClick={() => setOpenAddOrganDrawer(true)}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.palette.primary.main
                    }}
                  >
                    {t('necropsy_module.see_all')}
                  </Typography>
                  <Icon icon='mdi:chevron-right' fontSize={18} color={theme.palette.primary.main} />
                </Box>
              </Box>

              {templateLoading ? (
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                  {Array.from(new Array(5)).map((_, index) => (
                    <Skeleton
                      key={index}
                      variant='rectangular'
                      width={140}
                      height={40}
                      sx={{ borderRadius: 1, flexShrink: 0 }}
                    />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                      height: 6,
                      display: 'none'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.divider,
                      borderRadius: 3
                    }
                  }}
                >
                  {templates.map((template, index) => {
                    const templateId = template.id || template.template_id
                    const isSelected = selectedTemplate === templateId

                    return (
                      <Box
                        key={templateId || index}
                        onClick={() => handleTemplateClick(template)}
                        sx={{
                          px: 6,
                          py: 2,
                          backgroundColor: isSelected
                            ? theme.palette.customColors.OnPrimaryContainer
                            : theme.palette.customColors.neutral05,
                          border: `1px solid ${
                            isSelected
                              ? theme.palette.customColors.OnPrimaryContainer
                              : theme.palette.customColors.OutlineVariant
                          }`,
                          borderRadius: '4px',
                          color: isSelected
                            ? theme.palette.customColors.OnPrimary
                            : theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isSelected
                              ? theme.palette.customColors.OnPrimaryContainer
                              : theme.palette.action.hover
                          }
                        }}
                      >
                        {template.name || template.template_name}
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      <AddOrganDrawer
        open={openAddOrganDrawer}
        setOpen={setOpenAddOrganDrawer}
        organs={organs}
        onApply={handleApplyOrgans}
        onTemplatesUpdated={fetchTemplates}
      />
    </Box>
  )
}

export default memo(NecropsyOrganSection)
