import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  InputAdornment,
  CircularProgress,
  Skeleton
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import AddOrganDrawer from './AddOrganDrawer'
import { createNecropsyTemplate, getNecropsyTemplate, getNecropsyBodyParts } from 'src/lib/api/necropsy'
import Toaster from 'src/components/Toaster'

const NecropsyOrganSection = ({ organs = [], onChange, disabled = false }) => {
  const theme = useTheme()
  const [openAddOrganDrawer, setOpenAddOrganDrawer] = useState(false)
  const [saveTemplate, setSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [templateLoading, setTemplateLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [bodyPartsData, setBodyPartsData] = useState([])

  useEffect(() => {
    fetchTemplates()
    fetchBodyParts()
  }, [])

  const fetchTemplates = async () => {
    setTemplateLoading(true)
    try {
      const res = await getNecropsyTemplate()
      if (res?.success) {
        setTemplates(res?.data || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setTemplateLoading(false)
    }
  }

  const fetchBodyParts = async () => {
    try {
      const res = await getNecropsyBodyParts({})
      if (res?.success && res?.data) {
        setBodyPartsData(res.data)
      }
    } catch (error) {
      console.error('Error fetching body parts:', error)
    }
  }

  const handleTemplateClick = useCallback(
    template => {
      const templateId = template.id || template.template_id
      const isAlreadySelected = selectedTemplate === templateId

      if (isAlreadySelected) {
        setSelectedTemplate(null)
        onChange([])
      } else {
        setSelectedTemplate(templateId)

        const templateItems = template.organs || template.body_parts || template.template_items || []

        const templateOrgans = templateItems.map(organ => {
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

  const handleApplyOrgans = newOrgans => {
    onChange(newOrgans)
    setSelectedTemplate(null)
  }

  const handleRemoveOrgan = index => {
    const updated = organs.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handlePartChange = (organIndex, partIndex, field, value) => {
    const updated = [...organs]
    const organ = { ...updated[organIndex] }
    const parts = [...organ.parts]
    parts[partIndex] = { ...parts[partIndex], [field]: value }
    organ.parts = parts
    updated[organIndex] = organ
    onChange(updated)
  }

  const handleRemovePart = (organIndex, partIndex) => {
    const updated = [...organs]
    const organ = { ...updated[organIndex] }
    const parts = organ.parts.filter((_, i) => i !== partIndex)

    if (parts.length === 0) {
      onChange(updated.filter((_, i) => i !== organIndex))
    } else {
      organ.parts = parts
      updated[organIndex] = organ
      onChange(updated)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      Toaster({ type: 'error', message: 'Please enter a template name' })
      return
    }

    setSaveLoading(true)
    try {
      const templateItems = organs.reduce((acc, organ) => {
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
        Toaster({ type: 'success', message: res?.message || 'Template saved successfully' })
        setTemplateName('')
        setSaveTemplate(false)
        fetchTemplates()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to save template' })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      Toaster({ type: 'error', message: 'Something went wrong while saving template' })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          Organ-wise Description of Lessions
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
            Select Organ
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
                    {organ.label || `Organ ${organIndex + 1}`}
                  </Typography>

                  <Typography variant='caption' color='text.secondary'>
                    ({organ.parts?.length || 0} parts)
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
                  const partName = part.organ_name || part.label || `Part ${partIndex + 1}`

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
                        label={`Enter ${partName} Description`}
                        multiline
                        rows={1}
                        value={part.value || ''}
                        onChange={e => handlePartChange(organIndex, partIndex, 'value', e.target.value)}
                        disabled={disabled}
                        sx={{
                          backgroundColor: theme.palette.customColors.OnPrimary,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '4px'
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '4px 8px'
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
                    placeholder='Enter Template Name'
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
                    onChange={e => setTemplateName(e.target.value)}
                  />
                  <Button
                    variant='contained'
                    size='small'
                    sx={{ height: '40px', minWidth: '80px' }}
                    startIcon={<Icon icon='material-symbols:save-outline-rounded' />}
                    onClick={handleSaveTemplate}
                    disabled={templateName.trim() === '' || saveLoading}
                  >
                    {saveLoading ? <CircularProgress size={20} color='inherit' /> : 'SAVE'}
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
                    Cancel
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
                      Save as template
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
                    Clear all
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
                  Select from templates
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
                    See all
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
            Select new organs or add from templates
          </Typography>

          {/* Select from Templates Section - Inside empty state box */}
          {!disabled && templates.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Select from templates
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
                    See all
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

export default React.memo(NecropsyOrganSection)
