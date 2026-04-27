'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import Search from 'src/views/utility/Search'
import {
  createMedicalTemplate,
  deleteMedicalTemplate,
  getMedicalTemplates,
  updateMedicalTemplate
} from 'src/lib/api/hospital/clinicalAssessment'

interface SaveMedicalTemplateSectionProps {
  templateType: string
  selectedItems?: any[]
  templateLabel?: string
  itemLabel?: string
  refreshToken?: number
  onTemplateSaved?: () => void
}

export function SaveMedicalTemplateSection({
  templateType,
  selectedItems = [],
  templateLabel,
  itemLabel,
  refreshToken = 0,
  onTemplateSaved = () => {}
}: SaveMedicalTemplateSectionProps) {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const [showSaveTemplate, setShowSaveTemplate] = useState<boolean>(false)
  const [templateName, setTemplateName] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [templates, setTemplates] = useState<any[]>([])
  const canSaveTemplate = selectedItems.length > 1
  const responseKey = templateType === 'complaints' ? 'complaintsTemplates' : 'diagnosisTemplates'
  const apiTemplateType = templateType === 'complaints' ? 'complaint' : 'diagnosis'
  const selectedItemIdsKey = useMemo(
    () =>
      selectedItems
        .map((item: any) => Number(item?.id))
        .filter((id: number) => !Number.isNaN(id))
        .sort((a: number, b: number) => a - b)
        .join(','),
    [selectedItems]
  )
  const mappedTemplates = useMemo(
    () =>
      templates.map((item: any) => ({
        id: item?.id,
        name: item?.template_name ?? item?.name,
        template_items: Array.isArray(item?.template_items) ? item.template_items : []
      })),
    [templates]
  )
  const activeTemplateId = useMemo(() => {
    return (
      mappedTemplates.find((template: any) => {
        const templateIdsKey = template.template_items
          .map((item: any) => Number(item?.id))
          .filter((id: number) => !Number.isNaN(id))
          .sort((a: number, b: number) => a - b)
          .join(',')

        return templateIdsKey.length > 0 && templateIdsKey === selectedItemIdsKey
      })?.id ?? null
    )
  }, [mappedTemplates, selectedItemIdsKey])
  const shouldShowSaveTemplate = canSaveTemplate && !activeTemplateId

  const loadTemplates = useCallback(async () => {
    try {
      const response: any = await getMedicalTemplates({ type: 'all' })
      const list = Array.isArray(response?.data?.[responseKey]) ? response.data[responseKey] : []
      setTemplates(list)
    } catch (error) {
      console.error(`Error loading ${templateType} templates:`, error)
      Toaster({ type: 'error', message: t('hospital_module.failed_to_load_templates') })
    }
  }, [responseKey, templateLabel, templateType])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates, refreshToken])

  const handleSaveTemplate = async () => {
    const trimmedName = templateName.trim()

    if (!trimmedName) {
      Toaster({ type: 'error', message: t('hospital_module.please_enter_template_name') })

      return
    }

    const duplicateName = mappedTemplates.some((item: any) => item?.name?.toLowerCase() === trimmedName.toLowerCase())
    if (duplicateName) {
      Toaster({ type: 'error', message: t('hospital_module.template_name_already_exists') })

      return
    }

    setIsSaving(true)
    try {
      const response: any = await createMedicalTemplate({
        template_name: trimmedName,
        type: apiTemplateType,
        template_items: selectedItems.map((item: any) => Number(item.id))
      })

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.template_saved_successfully') })
        setTemplateName('')
        setShowSaveTemplate(false)
        await loadTemplates()
        onTemplateSaved()
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_save_template') })
      }
    } catch (error) {
      console.error(`Error saving ${templateType} template:`, error)
      Toaster({ type: 'error', message: t('hospital_module.failed_to_save_template') })
    } finally {
      setIsSaving(false)
    }
  }

  if (selectedItems.length === 0) {
    return (
      <Typography variant='caption' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
        Add {itemLabel} to enable template saving.
      </Typography>
    )
  }

  if (!shouldShowSaveTemplate) {
    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 4,
        borderRadius: '8px',
        backgroundColor: theme.palette.common.white,
        border: `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.08)}`
      }}
    >
      {!showSaveTemplate ? (
        <Button
          variant='text'
          onClick={() => setShowSaveTemplate(true)}
          startIcon={<Icon icon='material-symbols:save-outline-sharp' />}
          sx={{
            alignSelf: 'flex-start',
            color: theme.palette.customColors.OnSurface,
            px: 0.5
          }}
        >
          Save as template
        </Button>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'stretch', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2
          }}
        >
          <TextField
            fullWidth
            size='small'
            label='Template name'
            placeholder={`Enter ${templateLabel} name`}
            value={templateName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTemplateName(event.target.value)}
            disabled={isSaving}
          />
          <LoadingButton
            variant='contained'
            onClick={handleSaveTemplate}
            loading={isSaving}
            disabled={!templateName.trim()}
            sx={{ minWidth: 110 }}
          >
            Save
          </LoadingButton>
          <IconButton
            onClick={() => {
              setShowSaveTemplate(false)
              setTemplateName('')
            }}
            disabled={isSaving}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

interface SelectionTemplatePanelProps {
  templateType: string
  selectedItems?: any[]
  availableItems?: any[]
  onApplyTemplate: (items: any[]) => void
  templateLabel?: string
  mapTemplateItem: (item: any) => any
  pickerSearchValue?: string
  onPickerSearchChange?: (value: string) => void
  onPickerLoadMore?: () => void
  pickerLoading?: boolean
  pickerHasMore?: boolean
  refreshToken?: number
  onTemplatesChanged?: () => void
}

function SelectionTemplatePanel({
  templateType,
  selectedItems = [],
  availableItems = [],
  onApplyTemplate,
  templateLabel,
  mapTemplateItem,
  pickerSearchValue = '',
  onPickerSearchChange = () => {},
  onPickerLoadMore = () => {},
  pickerLoading = false,
  pickerHasMore = false,
  refreshToken = 0,
  onTemplatesChanged = () => {}
}: SelectionTemplatePanelProps) {
  const theme: any = useTheme()
  const { t } = useTranslation()
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [editingName, setEditingName] = useState<string>('')
  const [editingItems, setEditingItems] = useState<any[]>([])
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [templatesDrawerOpen, setTemplatesDrawerOpen] = useState<boolean>(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [showSelectionPicker, setShowSelectionPicker] = useState<boolean>(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false)

  const responseKey = templateType === 'complaints' ? 'complaintsTemplates' : 'diagnosisTemplates'
  const apiTemplateType = templateType === 'complaints' ? 'complaint' : 'diagnosis'
  const selectedItemIdsKey = useMemo(
    () =>
      selectedItems
        .map((item: any) => Number(item?.id))
        .filter((id: number) => !Number.isNaN(id))
        .sort((a: number, b: number) => a - b)
        .join(','),
    [selectedItems]
  )

  const mappedTemplates = useMemo(
    () =>
      templates.map((item: any) => ({
        id: item?.id,
        name: item?.template_name ?? item?.name,
        template_items: Array.isArray(item?.template_items) ? item.template_items : []
      })),
    [templates]
  )

  const activeTemplateId = useMemo(() => {
    return (
      mappedTemplates.find((template: any) => {
        const templateIdsKey = template.template_items
          .map((item: any) => Number(item?.id))
          .filter((id: number) => !Number.isNaN(id))
          .sort((a: number, b: number) => a - b)
          .join(',')

        return templateIdsKey.length > 0 && templateIdsKey === selectedItemIdsKey
      })?.id ?? null
    )
  }, [mappedTemplates, selectedItemIdsKey])
  const orderedTemplates = useMemo(() => {
    if (!activeTemplateId) return mappedTemplates

    const activeTemplate = mappedTemplates.find((item: any) => item.id === activeTemplateId)

    if (!activeTemplate) return mappedTemplates

    return [activeTemplate, ...mappedTemplates.filter((item: any) => item.id !== activeTemplateId)]
  }, [activeTemplateId, mappedTemplates])
  const inlineTemplates = orderedTemplates.slice(0, 3)
  const showTemplatesInDrawer = orderedTemplates.length > 3
  const editingItemIds = useMemo(() => new Set(editingItems.map((item: any) => Number(item?.id))), [editingItems])
  const pickerOptions = useMemo(() => {
    const templateSourceItems = Array.isArray(availableItems) ? availableItems : []

    return templateSourceItems
      .map((item: any) => ({
        raw: item,
        id: Number(item?.id),
        name: item?.name || ''
      }))
      .filter((item: any) => !Number.isNaN(item.id))
  }, [availableItems])

  const loadTemplates = useCallback(async () => {
    try {
      const response: any = await getMedicalTemplates({ type: 'all' })
      const list = Array.isArray(response?.data?.[responseKey]) ? response.data[responseKey] : []
      setTemplates(list)
    } catch (error) {
      console.error(`Error loading ${templateType} templates:`, error)
      Toaster({ type: 'error', message: t('hospital_module.failed_to_load_templates') })
    }
  }, [responseKey, templateLabel, templateType])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates, refreshToken])

  const handleApplyTemplate = (template: any) => {
    const templateItems = Array.isArray(template?.template_items) ? template.template_items : []

    if (templateItems.length === 0) {
      Toaster({ type: 'error', message: t('hospital_module.template_has_no_items') })

      return
    }

    const mappedItems = templateItems.map((item: any) => mapTemplateItem(item)).filter(Boolean)
    onApplyTemplate(mappedItems)
    Toaster({ type: 'success', message: t('hospital_module.template_applied_successfully') })
  }

  const openEditDialog = (template: any) => {
    setEditingTemplate(template)
    setEditingName(template?.name || '')
    setEditingItems(Array.isArray(template?.template_items) ? template.template_items : [])
    setShowSelectionPicker(false)
  }

  const closeEditDialog = () => {
    if (isUpdating || isDeleting) return
    setEditingTemplate(null)
    setEditingName('')
    setEditingItems([])
    setShowSelectionPicker(false)
    setDeleteConfirmOpen(false)
  }

  const handleRemoveEditingItem = (itemId: any) => {
    setEditingItems((prev: any[]) => prev.filter((item: any) => item?.id !== itemId))
  }

  const handleAddCurrentSelection = () => {
    if (!showSelectionPicker) {
      setShowSelectionPicker(true)

      return
    }
  }

  const handleUpdateTemplate = async () => {
    const trimmedName = editingName.trim()

    if (!editingTemplate?.id) return

    if (!trimmedName) {
      Toaster({ type: 'error', message: t('hospital_module.please_enter_template_name') })

      return
    }

    if (editingItems.length === 0) {
      Toaster({ type: 'error', message: t('hospital_module.template_must_contain_at_least_one_item') })

      return
    }

    const duplicateName = mappedTemplates.some(
      (item: any) => item?.id !== editingTemplate.id && item?.name?.toLowerCase() === trimmedName.toLowerCase()
    )
    if (duplicateName) {
      Toaster({ type: 'error', message: t('hospital_module.template_name_already_exists') })

      return
    }

    setIsUpdating(true)
    try {
      const response: any = await updateMedicalTemplate(editingTemplate.id, {
        template_name: trimmedName,
        type: apiTemplateType,
        template_items: editingItems.map((item: any) => Number(item?.id))
      })

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.template_updated_successfully') })
        await loadTemplates()
        onTemplatesChanged()
        closeEditDialog()
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_update_template') })
      }
    } catch (error) {
      console.error(`Error updating ${templateType} template:`, error)
      Toaster({ type: 'error', message: t('hospital_module.failed_to_update_template') })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!editingTemplate?.id) return

    setIsDeleting(true)
    try {
      const response: any = await deleteMedicalTemplate(editingTemplate.id)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Template deleted successfully' })
        await loadTemplates()
        onTemplatesChanged()
        closeEditDialog()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete template' })
      }
    } catch (error) {
      console.error(`Error deleting ${templateType} template:`, error)
      Toaster({ type: 'error', message: t('hospital_module.failed_to_delete_template') })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 4,
        borderRadius: '8px',
        backgroundColor: theme.palette.common.white,
        border: `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.08)}`
      }}
    >
      {orderedTemplates.length > 0 ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface }}>
              Your templates
            </Typography>
            {showTemplatesInDrawer ? (
              <Button size='small' onClick={() => setTemplatesDrawerOpen(true)} sx={{ px: 0.5 }}>
                View all
              </Button>
            ) : null}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {inlineTemplates.map((item: any) => (
              <Box
                key={item.id}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  pl: 0.25,
                  pr: 0.5,
                  py: 0.25,
                  borderRadius: '16px',
                  border:
                    activeTemplateId === item.id
                      ? `1px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.18)}`,
                  backgroundColor:
                    activeTemplateId === item.id
                      ? alpha(theme.palette.primary.main, 0.08)
                      : theme.palette.common.white
                }}
              >
                <Chip
                  label={item.name}
                  onClick={() => handleApplyTemplate(item)}
                  clickable
                  sx={{
                    backgroundColor: 'transparent',
                    color:
                      activeTemplateId === item.id
                        ? theme.palette.primary.main
                        : theme.palette.customColors.OnSurface,
                    '& .MuiChip-label': { px: 1.5 }
                  }}
                />
                <IconButton size='small' onClick={() => openEditDialog(item)}>
                  <Icon icon='mdi:pencil-outline' fontSize={16} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Drawer
        anchor='right'
        open={Boolean(editingTemplate)}
        onClose={closeEditDialog}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              backgroundColor: theme.palette.common.white,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }
        }}
      >
        <Box
          sx={{
            p: 4,
            position: 'sticky',
            top: 0,
            backgroundColor: theme.palette.common.white,
            zIndex: 1,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Edit Template
              </Typography>
              <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                Update template name and items
              </Typography>
            </Box>
            <IconButton onClick={closeEditDialog} disabled={isUpdating || isDeleting}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            backgroundColor: theme.palette.customColors.Background
          }}
        >
          <Box
            sx={{
              p: 4,
              borderRadius: '8px',
              backgroundColor: theme.palette.common.white,
              border: `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.08)}`
            }}
          >
            <TextField
              fullWidth
              size='small'
              label='Template name'
              value={editingName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEditingName(event.target.value)}
              disabled={isUpdating || isDeleting}
            />
          </Box>

          <Box
            sx={{
              p: 4,
              borderRadius: '8px',
              backgroundColor: theme.palette.common.white,
              border: `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.08)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 600 }}>
                Template items ({editingItems.length})
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {editingItems.map((item: any) => (
                <Chip
                  key={item?.id}
                  label={item?.name}
                  onDelete={() => handleRemoveEditingItem(item?.id)}
                  disabled={isUpdating || isDeleting}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
              <Button
                variant='text'
                color='inherit'
                onClick={() => setEditingItems([])}
                disabled={isUpdating || isDeleting || editingItems.length === 0}
                endIcon={<Icon icon='mdi:close-circle-outline' color={theme.palette.customColors.OnSurfaceVariant} />}
                sx={{
                  px: 0,
                  minWidth: 'auto',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              >
                Clear
              </Button>
              <Button
                variant='contained'
                onClick={handleAddCurrentSelection}
                disabled={isUpdating || isDeleting || availableItems.length === 0}
                sx={{
                  minWidth: 96,
                  borderRadius: '8px',
                  boxShadow: 'none'
                }}
              >
                Add
              </Button>
            </Box>
          </Box>

          {showSelectionPicker ? (
            <Box
              sx={{
                p: 4,
                borderRadius: '8px',
                backgroundColor: theme.palette.common.white,
                border: `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.08)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurface }}>
                  Select items to add
                </Typography>
                <Button size='small' onClick={() => setShowSelectionPicker(false)}>
                  Cancel
                </Button>
              </Box>

              <Search
                value={pickerSearchValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onPickerSearchChange(event.target.value)}
                onClear={() => onPickerSearchChange('')}
                placeholder={`Search ${templateType === 'complaints' ? 'symptoms' : 'clinical assessments'}`}
                width='100%'
                disabled={isUpdating || isDeleting}
                sx={{
                  width: '100%'
                }}
                textFielsSX={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />

              <Box
                onScroll={(event: React.UIEvent<HTMLDivElement>) => {
                  const { scrollTop, scrollHeight, clientHeight } = event.currentTarget

                  if (pickerLoading || !pickerHasMore) return

                  if (scrollHeight - scrollTop <= clientHeight + 80) {
                    onPickerLoadMore()
                  }
                }}
                sx={{
                  maxHeight: 360,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '8px',
                  border: `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.12)}`
                }}
              >
                {pickerOptions.length > 0 ? (
                  pickerOptions.map((option: any) => {
                    const isAlreadyInTemplate = editingItemIds.has(option.id)

                    return (
                      <Box
                        key={option.id}
                        onClick={() => {
                          if (isAlreadyInTemplate) return

                          const candidate = selectedItems.concat(availableItems).find((item: any) => Number(item?.id) === option.id)
                          const mappedItem = mapTemplateItem(candidate)

                          if (!mappedItem) return

                          setEditingItems((prev: any[]) => [...prev, mappedItem])
                        }}
                        sx={{
                          px: 3,
                          py: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          cursor: isAlreadyInTemplate ? 'not-allowed' : 'pointer',
                          borderBottom: `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.08)}`,
                          opacity: isAlreadyInTemplate ? 0.5 : 1
                        }}
                      >
                        <Typography sx={{ color: theme.palette.customColors.OnSurface }}>{option.name}</Typography>
                        {isAlreadyInTemplate ? <Chip label='Added' size='small' /> : <Chip label='Add' size='small' />}
                      </Box>
                    )
                  })
                ) : (
                  <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
                    <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                      No items available in the current list.
                    </Typography>
                  </Box>
                )}

                {pickerLoading ? (
                  <Box sx={{ px: 3, py: 2, textAlign: 'center' }}>
                    <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                      Loading...
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            </Box>
          ) : null}
        </Box>

        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            backgroundColor: theme.palette.common.white,
            display: 'flex',
            gap: 2
          }}
        >
          <Button
            variant='outlined'
            color='error'
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={isUpdating || isDeleting}
            sx={{ flex: 1, height: 48 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <LoadingButton
            variant='contained'
            onClick={handleUpdateTemplate}
            loading={isUpdating}
            disabled={isDeleting}
            sx={{ flex: 1, height: 48 }}
          >
            Save
          </LoadingButton>
        </Box>
      </Drawer>

      <ConfirmationDialog
        dialogBoxStatus={deleteConfirmOpen}
        onClose={() => {
          if (isDeleting) return
          setDeleteConfirmOpen(false)
        }}
        title='Delete template?'
        description='Are you sure you want to delete this template?'
        additionalDescription='This action cannot be undone.'
        icon='mdi:delete-outline'
        iconColor={theme.palette.error.main}
        ConfirmationText='Delete'
        confirmAction={handleDeleteTemplate}
        loading={isDeleting}
        confirmBtnStyle={{ backgroundColor: theme.palette.error.main }}
        cancelBtnStyle={{
          borderColor: theme.palette.customColors.OnSurfaceVariant,
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      />

      <Drawer
        anchor='right'
        open={templatesDrawerOpen}
        onClose={() => setTemplatesDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              backgroundColor: theme.palette.customColors.Background,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }
        }}
      >
        <Box
          sx={{
            p: 4,
            position: 'sticky',
            top: 0,
            backgroundColor: theme.palette.customColors.OnPrimary,
            zIndex: 1,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon icon='mdi:view-grid-outline' fontSize={24} color={theme.palette.primary.main} />
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  All Templates
                </Typography>
                <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                  Select and manage saved templates
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setTemplatesDrawerOpen(false)}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.background,
            p: 6
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.customColors.OnPrimary,
              p: 4,
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            {orderedTemplates.map((item: any) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 3,
                  borderRadius: '8px',
                  border:
                    activeTemplateId === item.id
                      ? `1px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.customColors.OnSurfaceVariant, 0.18)}`,
                  backgroundColor:
                    activeTemplateId === item.id
                      ? alpha(theme.palette.primary.main, 0.08)
                      : theme.palette.customColors.Surface
                }}
              >
                <Box
                  onClick={() => {
                    handleApplyTemplate(item)
                    setTemplatesDrawerOpen(false)
                  }}
                  sx={{ flex: 1, cursor: 'pointer' }}
                >
                  <Typography
                    sx={{
                      color:
                        activeTemplateId === item.id
                          ? theme.palette.primary.main
                          : theme.palette.customColors.OnSurface,
                      fontWeight: 500
                    }}
                  >
                    {item.name}
                  </Typography>
                </Box>
                <IconButton size='small' onClick={() => openEditDialog(item)}>
                  <Icon icon='mdi:pencil-outline' fontSize={18} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}

export default SelectionTemplatePanel
