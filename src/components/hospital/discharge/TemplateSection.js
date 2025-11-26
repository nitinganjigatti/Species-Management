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

// ---------- Helpers (local to this component) ----------

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

const stripHtmlTags = input => {
  if (!input) return ''

  return String(input)
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
    text: stripHtmlTags(finalHtml),
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

const extractSurgeryTemplates = response => {
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

// Inline “Save as template” bar
const SaveTemplateInline = ({ onClose, onSave, loading = false }) => {
  const theme = useTheme()
  const [templateName, setTemplateName] = useState('')

  const handleSave = async () => {
    if (!templateName.trim() || loading) return

    const success = await onSave(templateName.trim())
    if (success) {
      setTemplateName('')
    }
  }

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
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <LoadingButton
          variant='contained'
          onClick={handleSave}
          disabled={loading || !templateName.trim()}
          startIcon={
            <Avatar
              src='/icons/FloppyDisk.svg'
              variant='square'
              sx={{
                objectFit: 'contain',
                height: '24px',
                width: '24px',
                filter: 'brightness(0) invert(1)'
              }}
            />
          }
          sx={{
            height: '48px',
            width: '104px',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            borderRadius: '6px',
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: 15,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </LoadingButton>
        <Avatar
          onClick={onClose}
          sx={{
            cursor: 'pointer',
            width: 32,
            height: 32,
            bgcolor: 'transparent',
            color: theme.palette.primary.light,
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <Icon icon='mdi:close' fontSize={19} />
        </Avatar>
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

  // Internal rich text value
  const [richNote, setRichNote] = useState(() =>
    value ? buildRichTextValueFromHtml(value) : createEmptyRichTextValue()
  )

  const [activeTemplate, setActiveTemplate] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [openTemplateDrawer, setOpenTemplateDrawer] = useState(false)

  // Sync external HTML value -> internal rich value (if it changes)
  useEffect(() => {
    if (typeof value === 'string') {
      const html = value || '<p><br></p>'

      // Avoid resetting if already same
      if (richNote?.html !== html) {
        setRichNote(buildRichTextValueFromHtml(html))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Fetch templates
  const {
    data: TemplateData,
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
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: error => {
      console.error('Failed to fetch surgery templates:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'Failed to load templates' })
    }
  })

  const templatesList = useMemo(() => extractSurgeryTemplates(TemplateData), [TemplateData])
  const templateNames = useMemo(() => templatesList.map(t => t.title), [templatesList])
  const templateNamesKey = useMemo(() => templateNames.join('|'), [templateNames])

  // If activeTemplate no longer exists in list, clear it
  useEffect(() => {
    if (!activeTemplate) return
    if (!templateNames.includes(activeTemplate)) {
      setActiveTemplate('')
    }
  }, [activeTemplate, templateNames, templateNamesKey])

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
      onChange?.(safeHtml)

      if (safeHtml.trim().length > 0) {
        onDirtyChange?.(true)
      }
    },
    [onChange, onDirtyChange]
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

  const handleSaveTemplate = useCallback(
    async templateName => {
      const trimmedName = templateName?.trim()

      if (!trimmedName) {
        Toaster({ type: 'error', message: 'Template name is required' })

        return false
      }

      const payload = new FormData()
      payload.append('template_name', trimmedName)
      payload.append('type', templateType)
      payload.append('hospital_id', hospitalId)
      payload.append('description', getSafeString(getRichTextHtml(richNote)))

      setIsSavingTemplate(true)

      try {
        const response = await createSurgeryTemplate(payload)

        if (response?.success) {
          Toaster({ type: 'success', message: response?.message || 'Template saved successfully' })
          setActiveTemplate(trimmedName)

          const refetchResult = await refetchTemplates()
          const refreshedTemplates = extractSurgeryTemplates(refetchResult?.data)
          const newTemplate = refreshedTemplates.find(template => template.title === trimmedName)

          if (newTemplate) {
            applyTemplateToEditor(newTemplate)
          }

          return true
        }

        Toaster({ type: 'error', message: response?.message || 'Failed to save template' })

        return false
      } catch (error) {
        console.error('Create surgery template error:', error)
        const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred'
        Toaster({ type: 'error', message })

        return false
      } finally {
        setIsSavingTemplate(false)
      }
    },
    [richNote, templateType, hospitalId, refetchTemplates, applyTemplateToEditor]
  )

  const handleSaveTemplateInline = useCallback(
    async name => {
      const success = await handleSaveTemplate(name)
      if (success) {
        setShowSaveTemplate(false)
      }

      return success
    },
    [handleSaveTemplate]
  )

  // Handle rich text change
  const handleEditorChange = useCallback(
    valueObj => {
      setRichNote(valueObj)

      const html = getRichTextHtml(valueObj)
      const safeHtml = getSafeString(html)
      onChange?.(safeHtml)

      if (safeHtml.trim().length > 0) {
        onDirtyChange?.(true)
      }
    },
    [onChange, onDirtyChange]
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 1 }}>
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
            <SaveTemplateInline
              onClose={() => setShowSaveTemplate(false)}
              onSave={handleSaveTemplateInline}
              loading={isSavingTemplate}
            />
          ) : (
            <SaveTemplateButton
              iconSize={25}
              onClick={() => setShowSaveTemplate(true)}
              sx={{ textTransform: 'none' }}
            />
          )}
        </Box>

        {/* Templates row */}
        {isTemplatesLoading ? (
          <Box sx={{ display: 'inline-flex', gap: 3, pr: 1 }}>
            {Array.from({ length: 5 }).map((_, idx) => (
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
          templateNames?.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StyledTypography fontWeight={400}>Select from templates</StyledTypography>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setOpenTemplateDrawer(true)}
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
                  {templateNames?.map(templateLabel => {
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
        openSurgeryTemplateDrawer={openTemplateDrawer}
        setOpenSurgeryTemplateDrawer={setOpenTemplateDrawer}
        templates={templatesList}
        loading={isTemplatesLoading}
        onApplyTemplate={applyTemplateToEditor}
        onTemplatesUpdated={async () => {
          const refreshed = await refetchTemplates()

          return refreshed
        }}
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
