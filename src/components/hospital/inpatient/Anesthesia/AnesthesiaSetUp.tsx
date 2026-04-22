'use client'
import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  InputAdornment,
  Radio,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useFormContext } from 'react-hook-form'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'

const getTextFieldStyles = (theme: any) => {
  const outline = theme.palette.customColors?.SurfaceVariant || theme.palette.divider
  const mutedText = theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary

  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      backgroundColor: theme.palette.primary.contrastText,
      '& fieldset': { borderColor: outline },
      '&:hover fieldset': { borderColor: theme.palette.primary.main },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
    },
    '& .MuiInputLabel-root': {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: '14px',
      letterSpacing: 0,
      color: mutedText,
      transform: 'translate(12px, 10px)',
      opacity: 0,
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(12px, -10px) scale(1)',
        backgroundColor: 'transparent',
        padding: 0,
        opacity: 1
      }
    },
    '& .MuiFormLabel-root.MuiInputLabel-shrink': { opacity: 1 },
    '& .MuiInputBase-input': {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '16px',
      lineHeight: 1,
      letterSpacing: 0,
      color: onSurface
    },
    '& .MuiInputBase-input::placeholder': { color: onSurface, opacity: 1 }
  }
}

const radioTileGroupStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  '& .MuiToggleButtonGroup-grouped': { margin: 0 }
}

const getRadioTileButtonStyles = (theme: any) => {
  const outline = theme.palette.customColors?.OutlineVariant || theme.palette.divider
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  return {
    width: '257.333px',
    height: '56px',
    padding: '0 12px',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '4px !important',
    border: `1px solid ${outline} !important`,
    backgroundColor: `${theme.palette.primary.contrastText} !important`,
    textTransform: 'none',
    color: onSurface,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    '&:hover': { backgroundColor: theme.palette.primary.contrastText },
    '&.Mui-selected': {
      borderColor: `${theme.palette.primary.main} !important`,
      color: theme.palette.primary.dark || theme.palette.primary.main,
      backgroundColor: `${theme.palette.primary.contrastText} !important`
    }
  }
}

const radioTileLabelStyles = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: 0
}

const monitoringToggleGroupStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  '& .MuiToggleButtonGroup-grouped': { margin: 0 }
}

const getMonitoringToggleButtonStyles = (theme: any) => {
  const outline = theme.palette.customColors?.OutlineVariant || theme.palette.divider
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  return {
    width: '189px',
    height: '56px',
    padding: '0 12px',
    borderRadius: '4px !important',
    border: `1.5px solid ${outline} !important`,
    backgroundColor: theme.palette.primary.contrastText,
    textTransform: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: onSurface,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    '&:hover': { backgroundColor: theme.palette.primary.contrastText },
    '&.Mui-selected': { borderColor: `${theme.palette.primary.main} !important` },
    '& .MuiCheckbox-root': { padding: 0, color: outline },
    '& .MuiCheckbox-root.Mui-checked': { color: theme.palette.primary.main }
  }
}

const getSectionTitleStyles = (theme: any) => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '20px',
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})
const getFirstColumnTextStyles = (theme: any) => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})
const getChipStyles = (theme: any) => (theme2: any) => ({
  width: '174px',
  minWidth: '174px',
  height: '48px',
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '8px',
  border: `1px solid ${theme2.palette.primary.main}`,
  backgroundColor: alpha(theme2.palette.customColors?.PrimaryContainer || theme2.palette.primary.light, 0.2),
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  color: theme2.palette.primary.dark || theme2.palette.primary.main,
  '& .MuiChip-label': { paddingInline: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
})

const toCamel = (s: any) =>
  String(s)
    .trim()
    .replace(/_([a-zA-Z0-9])/g, (_: any, g1: any) => g1.toUpperCase())

const uiKeyForField = (_sectionStringId: any, apiFieldKey: any) => {
  return toCamel(apiFieldKey)
}

interface AnesthesiaSetUpSectionProps {
  anesthesiaSetupList?: any[]
}

const AnesthesiaSetUpSection = ({ anesthesiaSetupList = [] }: AnesthesiaSetUpSectionProps) => {
  const {
    watch,
    setValue,
    formState: { errors }
  } = useFormContext()
  const { t } = useTranslation()
  const theme: any = useTheme()
  const router: any = useSafeRouter()
  const routerParams: any = useParams()
  const id = routerParams?.id
  const { animal_id } = router.query

  const textFieldStyles = useMemo(() => getTextFieldStyles(theme), [theme])
  const radioTileButtonStyles = useMemo(() => getRadioTileButtonStyles(theme), [theme])
  const monitoringToggleButtonStyles = useMemo(() => getMonitoringToggleButtonStyles(theme), [theme])
  const firstColumnTextStyles = useMemo(() => getFirstColumnTextStyles(theme), [theme])
  const chipStyles = useMemo(() => getChipStyles(theme)(theme), [theme])
  const outlineColor = theme.palette.customColors?.OutlineVariant || theme.palette.divider
  const borderMutedColor = theme.palette.customColors?.customTableBorderBg || outlineColor
  const selectedBackground = theme.palette.customColors?.displaybgPrimary || alpha(theme.palette.primary.main, 0.12)
  const unselectedBackground = theme.palette.customColors?.bodyBg || theme.palette.background.default
  const displayBgSecondary = theme.palette.customColors?.displaybgSecondary || alpha(theme.palette.primary.main, 0.06)
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  const contrastText = theme.palette.primary.contrastText
  const primaryMain = theme.palette.primary.main
  const primaryDark = theme.palette.primary.dark || theme.palette.primary.main

  const [newMonitoringItem, setNewMonitoringItem] = useState<string>('')
  const [duplicateError, setDuplicateError] = useState<string>('')

  const rows = (anesthesiaSetupList || []).map((section: any) => ({
    key: section.string_id,
    label: section.section_name,
    meta: section
  }))

  const normalizeItemName = (name: string) => {
    if (!name) return ''
    return name.toLowerCase().replace(/\s+/g, '').trim();
  }

  const toggleRowChecked = (key: string) => {
    const current = watch(`anesthesiaSetup.${key}.checked`)
    const newVal = !current
    setValue(`anesthesiaSetup.${key}.checked`, newVal, { shouldDirty: true })

    if (newVal) {
      const meta = (anesthesiaSetupList || []).find((s: any) => s.string_id === key)
      if (!meta) return
      const currentSectionData: any = watch(`anesthesiaSetup.${key}`) || {}
      if (!currentSectionData.checked) {
        const initialFlat: any = {}
        const initialFieldsObject: any = {}

        if (Array.isArray(meta.fields)) {
          meta.fields.forEach((f: any) => {
            const uiKey = uiKeyForField(meta.string_id, f.field_key)
            const fieldValue = f.field_value ?? ''
            const unit = f.unit ?? ''
            initialFlat[uiKey] = fieldValue
            initialFieldsObject[f.field_key] = { field_value: fieldValue, unit }
          })
        }

        let monitoringData: any = currentSectionData.monitoring || { selected: [], otherItems: [] }
        if (!currentSectionData.monitoring && meta.monitoring_items) {
          const selectedArr = meta.monitoring_items
            .filter((mi: any) => mi.is_selected === '1' || mi.is_selected === 1)
            .map((mi: any) => Number(mi.id))
          const customArr = meta.monitoring_items
            .filter((mi: any) => !(mi.is_selected === '1' || mi.is_selected === 1))
            .map((mi: any) => mi.name)

          monitoringData = { selected: selectedArr, otherItems: customArr }
        }

        setValue(
          `anesthesiaSetup.${key}`,
          {
            ...currentSectionData,
            ...initialFlat,
            fields: initialFieldsObject,
            monitoring: monitoringData,
            checked: true
          },
          { shouldDirty: true }
        )
      }
    }
  }

  const handleCheckboxToggle = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    setValue(`anesthesiaSetup.${key}.checked`, event.target.checked, { shouldDirty: true })
  }

  const handleAddOtherItem = (section: string, meta: any) => {
    const v = newMonitoringItem.trim()
    if (!v) {
      setDuplicateError('')
      return
    }
    setDuplicateError('')
    const monitoringState: any = watch(`anesthesiaSetup.${section}.monitoring`) || { selected: [], otherItems: [] }
    const normalizedNewItem = normalizeItemName(v)
    const predefinedItems = meta.monitoring_items || []
    const isInPredefined = predefinedItems.some((item: any) => normalizeItemName(item.name) === normalizedNewItem)
    const isInCustomItems = (monitoringState.otherItems || []).some(
      (item: any) => normalizeItemName(item) === normalizedNewItem
    )
    const selectedItemNames = (monitoringState.selected || [])
      .map((selectedId: any) => {
        const item = predefinedItems.find((i: any) => Number(i.id) === selectedId)

        return item ? normalizeItemName(item.name) : ''
      })
      .filter(Boolean)

    const isInSelected = selectedItemNames.includes(normalizedNewItem)

    if (isInPredefined || isInCustomItems || isInSelected) {
      setDuplicateError(t('hospital_module.item_already_exists') as string)

      return
    }
    const list = monitoringState.otherItems || []
    if (!list.includes(v)) {
      setValue(`anesthesiaSetup.${section}.monitoring.otherItems`, [...list, v], { shouldDirty: true })
    }
    setNewMonitoringItem('')
    setDuplicateError('')
  }

  const handleRemoveOtherItem = (section: string, itemToRemove: any) => {
    const list: any[] = (watch(`anesthesiaSetup.${section}.monitoring.otherItems`) as any) || []
    setValue(
      `anesthesiaSetup.${section}.monitoring.otherItems`,
      list.filter((i: any) => i !== itemToRemove),
      { shouldDirty: true }
    )
  }

  const handleNewItemKeyDown = (e: React.KeyboardEvent, section: string, meta: any) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddOtherItem(section, meta)
    }
  }

  const handleInputChange = (value: string) => {
    setNewMonitoringItem(value)
    if (duplicateError) {
      setDuplicateError('')
    }
  }

  const renderRowContent = (sectionMeta: any) => {
    const key = sectionMeta.string_id
    const fields = sectionMeta.fields || []

    if (fields.length > 0) {
      return (
        <Grid container spacing={3}>
          {fields.map((f: any) => {
            const uiKey = uiKeyForField(sectionMeta.string_id, f.field_key)
            const flatValue = watch(`anesthesiaSetup.${key}.${uiKey}`) ?? ''
            const fieldError: any = (errors as any)?.anesthesiaSetup?.[key]?.[uiKey]

            if (f.input_type === 'text') {
              return (
                <Grid size={{ xs: 12, md: 6 }} key={f.field_id}>
                  <TextField
                    fullWidth
                    label={f.field_label}
                    placeholder='Enter'
                    value={flatValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(`anesthesiaSetup.${key}.${uiKey}`, e.target.value, { shouldDirty: true })}
                    slotProps={{
                      inputLabel: {
                        shrink: true
                      }
                    }}
                    sx={textFieldStyles}
                    error={!!fieldError}
                    helperText={fieldError?.message || ''}
                  />
                </Grid>
              )
            }

            if (f.input_type === 'number') {
              return (
                <Grid size={{ xs: 12, md: 6 }} key={f.field_id}>
                  <TextField
                    fullWidth
                    label={f.field_label}
                    placeholder='Enter'
                    value={flatValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value
                      if (Number(val) < 0) return
                      setValue(`anesthesiaSetup.${key}.${uiKey}`, val, { shouldDirty: true })
                    }}
                    type='number'
                    slotProps={{
                      inputLabel: {
                        shrink: true
                      },
                      input: {
                        inputMode: 'decimal',
                        min: 0,
                        onWheel: (e: any) => e.target.blur(),
                        endAdornment: f.units?.length ? (
                          <InputAdornment position='end'>
                            <Typography sx={{ fontSize: '14px' }}>{f.units[0]}</Typography>
                          </InputAdornment>
                        ) : null
                      } as any
                    }}
                    sx={textFieldStyles}
                    error={!!fieldError}
                    helperText={fieldError?.message || ''}
                  />
                </Grid>
              )
            }

            if (f.input_type === 'radio') {
              return (
                <Grid size={{ xs: 12 }} key={f.field_id}>
                  <ToggleButtonGroup
                    exclusive
                    value={flatValue || ''}
                    onChange={(e: any, v: any) => setValue(`anesthesiaSetup.${key}.${uiKey}`, v ?? '', { shouldDirty: true })}
                    sx={radioTileGroupStyles}
                  >
                    {f.options.map((opt: any) => (
                      <ToggleButton key={opt} value={opt} sx={radioTileButtonStyles}>
                        <Typography component='span' sx={radioTileLabelStyles}>
                          {opt}
                        </Typography>
                        <Radio
                          checked={flatValue === opt}
                          disableRipple
                          inputProps={{ readOnly: true }}
                          sx={{ pointerEvents: 'none' }}
                        />
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  {fieldError?.message && (
                    <Typography sx={{ mt: 0.5, fontSize: 12, color: theme.palette.error.main }}>
                      {fieldError.message}
                    </Typography>
                  )}
                </Grid>
              )
            }
            return (
              <Grid size={{ xs: 12, md: 6 }} key={f.field_id}>
                <TextField
                  fullWidth
                  label={f.field_label}
                  placeholder='Enter'
                  value={flatValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(`anesthesiaSetup.${key}.${uiKey}`, e.target.value, { shouldDirty: true })}
                  slotProps={{
                    inputLabel: {
                      shrink: true
                    }
                  }}
                  sx={textFieldStyles}
                  error={!!fieldError}
                  helperText={fieldError?.message || ''}
                />
              </Grid>
            )
          })}
        </Grid>
      )
    }

    if (Array.isArray(sectionMeta.monitoring_items) && sectionMeta.monitoring_items.length > 0) {
      const monitoringState: any = watch(`anesthesiaSetup.${key}.monitoring`) || { selected: [], otherItems: [] }
      const items = sectionMeta.monitoring_items.map((mi: any) => ({ id: Number(mi.id), name: mi.name }))
      const monitoringError: any = (errors as any)?.anesthesiaSetup?.[key]?.monitoring

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ToggleButtonGroup
            value={monitoringState.selected || []}
            onChange={(e: any, newValues: any) =>
              setValue(`anesthesiaSetup.${key}.monitoring.selected`, newValues || [], { shouldDirty: true })
            }
            sx={monitoringToggleGroupStyles}
          >
            {items.map((option: any) => {
              const isSelected = (monitoringState.selected || []).includes(option.id)
              return (
                <ToggleButton key={option.id} value={option.id} sx={monitoringToggleButtonStyles}>
                  <Typography component='span' sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '16px' }}>
                    {option.name}
                  </Typography>
                  <Checkbox
                    checked={isSelected}
                    disableRipple
                    slotProps={{
                      input: { readOnly: true }
                    }}
                    sx={{ pointerEvents: 'none' }}
                  />
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
          {monitoringError?.message && (
            <Typography sx={{ mt: 0.5, fontSize: 12, color: theme.palette.error.main }}>
              {monitoringError.message}
            </Typography>
          )}

          {monitoringState.otherItems && monitoringState.otherItems.length > 0 && (
            <Box>
              <Typography sx={{ ...firstColumnTextStyles, mb: '10px' }}>{t('hospital_module.other_monitoring_items_added')}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px', mt: '10px', mb: '10px' }}>
                {monitoringState.otherItems.map((item: any) => (
                  <Tooltip key={item} title={item} arrow placement='top'>
                    <Chip
                      label={item}
                      onDelete={() => handleRemoveOtherItem(key, item)}
                      deleteIcon={<CloseRoundedIcon />}
                      sx={chipStyles}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              width: '430px',
              height: duplicateError ? '140px' : '115px',
              gap: '10px',
              borderRadius: '8px',
              padding: '16px',
              border: `0.5px solid ${outlineColor}`,
              backgroundColor: displayBgSecondary,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'height 0.2s ease'
            }}
          >
            <Typography sx={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '14px', color: onSurface }}>
              {t('hospital_module.add_new_other_item')}
            </Typography>
            <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder={(t('hospital_module.enter_new_monitoring_item') as string)}
                value={newMonitoringItem}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => handleNewItemKeyDown(e, key, sectionMeta)}
                sx={{
                  ...textFieldStyles,
                  '& .MuiInputBase-input': {
                    color: onSurface,
                    '&::placeholder': {
                      color: '#9E9E9E!important',
                      opacity: 1
                    }
                  }
                }}
              />
              <Button
                variant='contained'
                onClick={() => handleAddOtherItem(key, sectionMeta)}
                disabled={!newMonitoringItem.trim()}
                sx={{
                  width: '108px',
                  height: '56px',
                  borderRadius: '4px',
                  backgroundColor: newMonitoringItem.trim() ? primaryDark : outlineColor,
                  color: contrastText,
                  '&:hover': { backgroundColor: newMonitoringItem.trim() ? primaryMain : outlineColor }
                }}
              >
                {t('add')}
              </Button>
            </Box>
            {duplicateError && (
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: '12px',
                  color: theme.palette.error.main,
                  fontFamily: 'Inter',
                  fontWeight: 400
                }}
              >
                {duplicateError}
              </Typography>
            )}
          </Box>
        </Box>
      )
    }
    return null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {rows.map(({ key, label, meta }: any) => {
          const checked = !!watch(`anesthesiaSetup.${key}.checked`)
          const backgroundColor = checked ? selectedBackground : unselectedBackground
          const borderColor = checked ? outlineColor : borderMutedColor

          return (
            <Box
              key={key}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: checked ? 3 : 0 },
                padding: { xs: '16px', md: '20px' },
                borderRadius: '8px',
                border: `0.5px solid ${borderColor}`,
                backgroundColor,
                transition: 'background-color 0.2s ease, width 0.24s ease, max-width 0.24s ease',
                width: { xs: '100%', md: checked ? '100%' : '240px' },
                maxWidth: { xs: '100%', md: checked ? '100%' : '240px' },
                alignSelf: { md: checked ? 'stretch' : 'flex-start' }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: { xs: '100%', md: '240px' },
                  maxWidth: { md: '240px' },
                  flexBasis: { md: '240px' },
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
                role='button'
                tabIndex={0}
                aria-expanded={checked}
                onClick={() => toggleRowChecked(key)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleRowChecked(key)
                  }
                }}
              >
                <Checkbox
                  checked={!!checked}
                  onChange={handleCheckboxToggle(key)}
                  onClick={(event: React.MouseEvent) => event.stopPropagation()}
                  sx={{
                    p: 0,
                    width: '24px',
                    height: '24px',
                    color: primaryMain,
                    '&.Mui-checked': { color: primaryMain }
                  }}
                />
                <Typography sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '16px', color: '#44544A' }}>
                  {label}
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: checked ? '1 1 auto' : '0 0 0px',
                  width: { xs: '100%', md: checked ? '100%' : 0 },
                  maxWidth: { xs: '100%', md: checked ? '100%' : 0 },
                  overflow: checked ? 'visible' : 'hidden',
                  maxHeight: checked ? 'none' : 0,
                  opacity: checked ? 1 : 0,
                  transition: 'opacity 0.24s ease, max-width 0.24s ease, width 0.24s ease, flex 0.24s ease',
                  mt: { xs: checked ? 2 : 0, md: 0 }
                }}
                aria-hidden={!checked}
              >
                {checked && <Box sx={{ width: '100%' }}>{renderRowContent(meta)}</Box>}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default AnesthesiaSetUpSection
