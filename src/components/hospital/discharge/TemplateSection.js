import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Avatar, Typography, TextField, useTheme } from '@mui/material'
import { alpha, styled, textTransform } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import { useQuery } from '@tanstack/react-query'

import Icon from 'src/@core/components/icon'
import RichTextEditor from 'src/components/RichTextEditor'
import Toaster from 'src/components/Toaster'
import SurgeryRecordTemplateList from 'src/views/pages/hospital/inpatient/SurgeryRecordTemplateList'
import { createSurgeryTemplate, getSurgeryTemplates } from 'src/lib/api/hospital/surgeryMaster'
import { SaveTemplateButton } from 'src/views/utility/render-snippets'

// Utilities
const createEmptyRichTextValue = () => {
  const delta = { ops: [{ insert: '\n' }] }

  return {
    delta,
    html: '<p><br></p>',
    text: '',
    ops: delta.ops
  }
}

const getSafeString = value => {
  if (value === undefined || value === null) return ''

  return String(value)
}

const richFromHtml = html => {
  if (!html) return ''

  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const getRichTextHtml = note => {
  if (!note) return ''
  if (typeof note === 'string') return note
  if (note?.html) return note.html
  if (note?.text) return note.text
  if (note?.delta?.ops) {
    try {
      const text = note.delta.ops
        .map(op => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .trim()

      return text
    } catch {
      return ''
    }
  }

  return ''
}

const buildRichTextValueFromHtml = html => {
  const safeHtml = typeof html === 'string' ? html : ''
  const finalHtml = safeHtml || '<p><br></p>'

  return {
    html: finalHtml,
    text: richFromHtml(finalHtml),
    delta: undefined,
    ops: undefined
  }
}

const mapTemplateRecord = record => {
  if (!record || typeof record !== 'object') return null

  const id = record?.id ?? record?.template_id ?? record?.hospital_template_id ?? record?.value
  const name = record?.template_name ?? record?.name ?? record?.title

  if (!id || !name) return null

  return {
    id: String(id),
    title: String(name).trim(),
    description: record?.description ?? '',
    type: record?.type ?? 'discharge',
    category: record?.category ?? record?.type ?? 'discharge',
    raw: record
  }
}

const extractTemplates = response => {
  const candidates = [response, response?.data, response?.data?.data, response?.data?.templates, response?.templates]

  let records = []
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      records = candidate
      break
    }
  }

  const unique = new Map()

  records.forEach(item => {
    const mapped = mapTemplateRecord(item)

    if (mapped && !unique.has(mapped.id)) {
      unique.set(mapped.id, mapped)
    }
  })

  return Array.from(unique.values())
}

// Save  template bar
const SaveTemplateBar = ({ onClose, onSave, loading = false, richNote }) => {
  const theme = useTheme()
  const [templateName, setTemplateName] = useState('')

  const handleSave = async () => {
    if (!templateName.trim() || loading) return

    const success = await onSave(templateName.trim())
    if (success) {
      setTemplateName('')
    }
  }

  useEffect(() => {
    // Clear template name if the editor content is removed/empty
    if (!richNote?.html || !richNote.text.trim()) {
      setTemplateName('')
    }
  }, [richNote])

  const isDisabled = loading || !templateName.trim()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'start', sm: 'center' },
        gap: '16px',
        flexDirection: { xs: 'column', sm: 'row' }
      }}
    >
      <TextField
        size='small'
        placeholder='Enter template name'
        value={templateName}
        onChange={e => setTemplateName(e.target.value)}
        disabled={!richNote?.html || !richNote.text.trim() || loading}
        sx={{
          maxWidth: '413px',
          minWidth: { xs: '100%', sm: '200px' },
          height: '48px',
          flex: 1,
          borderRadius: '4px',
          borderColor: theme.palette.customColors.OutlineVariant,
          backgroundColor: theme.palette.customColors.Surface,
          '& .MuiOutlinedInput-root': {
            height: '48px'
          },
          '& .MuiInputBase-input::placeholder': {
            color:
              loading || !richNote?.text?.trim()
                ? theme.palette.text.disabled
                : theme.palette.customColors.OnSurfaceVariant
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <LoadingButton
          variant='contained'
          onClick={handleSave}
          disabled={isDisabled}
          loading={loading}
          startIcon={
            <Avatar
              src='/icons/FloppyDisk.svg'
              variant='square'
              sx={{
                objectFit: 'contain',
                height: 24,
                width: 24,
                filter: 'brightness(0) invert(1)'
              }}
            />
          }
          sx={{
            height: '48px',
            width: '104px',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.customColors.OnPrimary,
            borderRadius: '8px',
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: '14px',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          Save
        </LoadingButton>
        {!loading && (
          <Avatar
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              width: 30,
              height: 30,
              backgroundColor: 'transparent',
              color: theme.palette.customColors.OnPrimaryContainer,
              '&:hover': {
                backgroundColor: alpha(theme.palette.customColors.deepDark, 0.05)
              }
            }}
          >
            <Icon icon='mdi:close' fontSize={25} />
          </Avatar>
        )}
      </Box>
    </Box>
  )
}

const TemplateSection = ({
  label = 'Enter summary',
  value,
  onChange,
  error,
  helperText,
  onDirtyChange,
  hospitalId,
  templateType = 'discharge'
}) => {
  const theme = useTheme()

  const [richNote, setRichNote] = useState(() =>
    value ? buildRichTextValueFromHtml(value) : createEmptyRichTextValue()
  )

  const [activeTemplate, setActiveTemplate] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)

  // Sync external HTML into editor
  useEffect(() => {
    if (typeof value === 'string') {
      const html = value || '<p><br></p>'

      // Avoid resetting if already same
      if (richNote?.html !== html) {
        setRichNote(buildRichTextValueFromHtml(html))
      }
    }
  }, [value])

  // Fetch templates
  const {
    data: templateData,
    isFetching: isTemplatesLoading,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: ['hospital-templates', hospitalId, templateType],
    queryFn: () =>
      getSurgeryTemplates({
        page_no: 1,
        limit: 20,
        hospital_id: hospitalId,
        type: templateType
      }),
    onError: error => {
      console.error('Failed to fetch surgery templates:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'Failed to load templates' })
    }
  })

  const templatesList = useMemo(() => extractTemplates(templateData), [templateData])
  const templateLabels = useMemo(() => templatesList.map(t => t.title), [templatesList])

  // If activeTemplate no longer exists in list, clear it
  useEffect(() => {
    if (!activeTemplate) return
    if (!templateLabels.includes(activeTemplate)) {
      setActiveTemplate('')
    }
  }, [activeTemplate, templateLabels])

  // Handlers
  const applyTemplateToEditor = useCallback(
    template => {
      if (!template) return

      const safeTitle = template?.title ? String(template.title) : ''
      const html = typeof template?.description === 'string' ? template.description : ''
      const richValue = buildRichTextValueFromHtml(html)

      setActiveTemplate(safeTitle)
      setRichNote(prev => {
        if (prev?.html === richValue.html) {
          return prev
        }

        return richValue
      })

      const safeHtml = getSafeString(html)

      // onChange?.(safeHtml)

      // if (safeHtml.trim().length > 0) {
      //   onDirtyChange?.(true)
      // }
      const normalizedHtml = richFromHtml(safeHtml) === '' ? '' : safeHtml
      onChange?.(normalizedHtml)
    },
    [onChange]
  )

  const handleTemplateSelect = useCallback(
    templateName => {
      const safeName = templateName ? String(templateName) : ''

      if (!safeName) {
        setActiveTemplate('')

        return
      }

      const matchedTemplate = templatesList.find(template => template.title === safeName)

      if (matchedTemplate) {
        applyTemplateToEditor(matchedTemplate)
      } else {
        setActiveTemplate(safeName)
      }
    },
    [templatesList, applyTemplateToEditor]
  )

  // create template handler
  const handleSaveTemplate = useCallback(
    async templateName => {
      const trimmedName = templateName?.trim()

      if (!trimmedName) {
        Toaster({ type: 'error', message: 'Template name is required' })

        return false
      }

      const payload = {
        template_name: trimmedName,
        hospital_id: hospitalId,
        type: templateType,
        description: getSafeString(getRichTextHtml(richNote))
      }

      setIsSavingTemplate(true)

      try {
        const response = await createSurgeryTemplate(payload)

        if (response?.success) {
          Toaster({ type: 'success', message: response?.message || 'Template saved successfully' })
          setActiveTemplate(trimmedName)

          const refetchResult = await refetchTemplates()
          const newList = extractTemplates(refetchResult?.data)
          const newTemplate = newList.find(template => template.title === trimmedName)

          if (newTemplate) applyTemplateToEditor(newTemplate)

          return true
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to save template' })

          return false
        }
      } catch (error) {
        console.error('Create template error:', error?.message)
        Toaster({
          type: 'error',
          message: error?.response?.data?.message || error?.message || 'An unexpected error occurred'
        })

        return false
      } finally {
        setIsSavingTemplate(false)
      }
    },
    [richNote, templateType, hospitalId, refetchTemplates, applyTemplateToEditor]
  )

  // Handle rich text change
  const handleEditorChange = useCallback(
    valueObj => {
      setRichNote(valueObj)

      const html = getRichTextHtml(valueObj)
      const safeHtml = getSafeString(html)

      //  onChange?.(safeHtml)

      // if (safeHtml.trim().length > 0) {
      //   onDirtyChange?.(true)
      // }
      const normalizedHtml = richFromHtml(safeHtml) === '' ? '' : safeHtml
      onChange?.(normalizedHtml)
    },
    [onChange]
  )

  const handleSaveTemplateBar = useCallback(
    async name => {
      const success = await handleSaveTemplate(name)
      if (success) {
        setShowSaveTemplate(false)
      }

      return success
    },
    [handleSaveTemplate]
  )

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 5,
          backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
          borderRadius: 1,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StyledTypography>{label}</StyledTypography>

            <RichTextEditor
              value={richNote}
              onChange={handleEditorChange}
              placeholder='Enter text...'
              errors={!!error}
              helperText={helperText}
            />
          </Box>

          {showSaveTemplate ? (
            <SaveTemplateBar
              onClose={() => setShowSaveTemplate(false)}
              onSave={handleSaveTemplateBar}
              loading={isSavingTemplate}
              richNote={richNote}
            />
          ) : (
            <SaveTemplateButton
              iconSize={25}
              onClick={() => setShowSaveTemplate(true)}
              sx={{ textTransform: 'none' }}
            />
          )}
        </Box>

        {/* Templates list */}
        {isTemplatesLoading ? (
          <Box sx={{ display: 'inline-flex', gap: 3, pr: 1 }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Box
                key={`template-skel-${idx}`}
                sx={{
                  width: 100,
                  height: 40,
                  borderRadius: '8px',
                  backgroundColor: theme.palette.customColors.mdAntzNeutral
                }}
              />
            ))}
          </Box>
        ) : (
          templateLabels?.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StyledTypography fontWeight={400}>Select from templates</StyledTypography>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setOpenDrawer(true)}
                >
                  <StyledTypography fontWeight={600} color={theme.palette.customColors.OnSurface}>
                    See all
                  </StyledTypography>
                  <Icon icon='mingcute:right-fill' color={theme.palette.customColors.OnSurface} fontSize={24} />
                </Box>
              </Box>

              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  overflowX: 'auto',
                  scrollbarColor: 'transparent transparent',
                  paddingBottom: 0
                }}
              >
                <Box sx={{ display: 'inline-flex', gap: 3, pr: 1 }}>
                  {templateLabels?.map(templateLabel => {
                    if (!templateLabel) return null

                    return (
                      <Box
                        key={templateLabel}
                        onClick={() => handleTemplateSelect(templateLabel)}
                        sx={{
                          pb: 0,
                          flexShrink: 0,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          px: 6,
                          py: 2,
                          borderRadius: '4px',
                          backgroundColor:
                            activeTemplate === templateLabel
                              ? theme.palette.secondary.dark
                              : theme.palette.customColors.mdAntzNeutral,
                          cursor: 'pointer'
                        }}
                      >
                        <StyledTypography
                          sx={{ whiteSpace: 'nowrap' }}
                          fontWeight={activeTemplate === templateLabel ? 600 : 400}
                          color={
                            activeTemplate === templateLabel
                              ? theme.palette.primary.contrastText
                              : theme.palette.customColors.neutralPrimary
                          }
                        >
                          {templateLabel}
                        </StyledTypography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>
          )
        )}
      </Box>

      {/* Template Drawer */}
      <SurgeryRecordTemplateList
        openSurgeryTemplateDrawer={openDrawer}
        setOpenSurgeryTemplateDrawer={setOpenDrawer}
        templates={templatesList}
        loading={isTemplatesLoading}
        onApplyTemplate={applyTemplateToEditor}
        onTemplatesUpdated={refetchTemplates}
      />
    </>
  )
}

export default TemplateSection

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
