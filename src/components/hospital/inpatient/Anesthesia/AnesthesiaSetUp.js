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
import { useRouter } from 'next/router'

const getTextFieldStyles = theme => {
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

const getRadioTileButtonStyles = theme => {
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

const getMonitoringToggleButtonStyles = theme => {
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

const getSectionTitleStyles = theme => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '20px',
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})
const getFirstColumnTextStyles = theme => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})
const getChipStyles = theme => theme => ({
  width: '174px',
  minWidth: '174px',
  height: '48px',
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '8px',
  border: `1px solid ${theme.palette.primary.main}`,
  backgroundColor: alpha(theme.palette.customColors?.PrimaryContainer || theme.palette.primary.light, 0.2),
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  color: theme.palette.primary.dark || theme.palette.primary.main,
  '& .MuiChip-label': { paddingInline: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
})

const toCamel = s =>
  String(s)
    .trim()
    .replace(/_([a-zA-Z0-9])/g, (_, g1) => g1.toUpperCase())

const uiKeyForField = (_sectionStringId, apiFieldKey) => {
  return toCamel(apiFieldKey)
}

const AnesthesiaSetUpSection = ({ anesthesiaSetupList = [] }) => {
  const {
    watch,
    setValue,
    formState: { errors }
  } = useFormContext()
  const theme = useTheme()
  const router = useRouter()
  const { id, animal_id } = router.query

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

  const [newMonitoringItem, setNewMonitoringItem] = useState('')

  const rows = (anesthesiaSetupList || []).map(section => ({
    key: section.string_id,
    label: section.section_name,
    meta: section
  }))

  const toggleRowChecked = key => {
    const current = watch(`anesthesiaSetup.${key}.checked`)
    const newVal = !current
    setValue(`anesthesiaSetup.${key}.checked`, newVal, { shouldDirty: true })

    if (newVal) {
      const meta = (anesthesiaSetupList || []).find(s => s.string_id === key)
      if (!meta) return

      const initialFlat = {}
      const initialFieldsObject = {}

      if (Array.isArray(meta.fields)) {
        meta.fields.forEach(f => {
          const uiKey = uiKeyForField(meta.string_id, f.field_key)
          const fieldValue = f.field_value ?? ''
          const unit = f.unit ?? ''
          initialFlat[uiKey] = fieldValue
          initialFieldsObject[f.field_key] = { field_value: fieldValue, unit }
        })

        setValue(
          `anesthesiaSetup.${key}`,
          {
            ...(watch(`anesthesiaSetup.${key}`) || {}),
            ...initialFlat,
            fields: initialFieldsObject,
            checked: true
          },
          { shouldDirty: true }
        )
      }

      if (meta.monitoring_items) {
        const selectedArr = meta.monitoring_items
          .filter(mi => mi.is_selected === '1' || mi.is_selected === 1)
          .map(mi => Number(mi.id))
        const customArr = meta.monitoring_items
          .filter(mi => !(mi.is_selected === '1' || mi.is_selected === 1))
          .map(mi => mi.name)
        setValue(
          `anesthesiaSetup.${key}.monitoring`,
          { selected: selectedArr, otherItems: customArr },
          { shouldDirty: true }
        )
      }
    }
  }

  const handleCheckboxToggle = key => event => {
    event.stopPropagation()
    setValue(`anesthesiaSetup.${key}.checked`, event.target.checked, { shouldDirty: true })
  }

  const handleAddOtherItem = section => {
    const v = newMonitoringItem.trim()
    if (!v) return
    const list = watch(`anesthesiaSetup.${section}.monitoring.otherItems`) || []
    if (!list.includes(v)) {
      setValue(`anesthesiaSetup.${section}.monitoring.otherItems`, [...list, v], { shouldDirty: true })
    }
    setNewMonitoringItem('')
  }

  const handleRemoveOtherItem = (section, itemToRemove) => {
    const list = watch(`anesthesiaSetup.${section}.monitoring.otherItems`) || []
    setValue(
      `anesthesiaSetup.${section}.monitoring.otherItems`,
      list.filter(i => i !== itemToRemove),
      { shouldDirty: true }
    )
  }

  const handleNewItemKeyDown = (e, section) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddOtherItem(section)
    }
  }

  const renderRowContent = sectionMeta => {
    const key = sectionMeta.string_id
    const fields = sectionMeta.fields || []

    if (fields.length > 0) {
      return (
        <Grid container spacing={3}>
          {fields.map(f => {
            const uiKey = uiKeyForField(sectionMeta.string_id, f.field_key)
            const flatValue = watch(`anesthesiaSetup.${key}.${uiKey}`) ?? ''
            const fieldError = errors?.anesthesiaSetup?.[key]?.[uiKey]

            if (f.input_type === 'text') {
              return (
                <Grid item xs={12} md={6} key={f.field_id}>
                  <TextField
                    fullWidth
                    label={f.field_label}
                    placeholder='Enter'
                    value={flatValue}
                    onChange={e => setValue(`anesthesiaSetup.${key}.${uiKey}`, e.target.value, { shouldDirty: true })}
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldStyles}
                    error={!!fieldError}
                    helperText={fieldError?.message || ''}
                  />
                </Grid>
              )
            }

            if (f.input_type === 'number') {
              return (
                <Grid item xs={12} md={6} key={f.field_id}>
                  <TextField
                    fullWidth
                    label={f.field_label}
                    placeholder='Enter'
                    value={flatValue}
                    onChange={e => setValue(`anesthesiaSetup.${key}.${uiKey}`, e.target.value, { shouldDirty: true })}
                    type='number'
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*',
                      min: 0,
                      endAdornment:
                        f.units && f.units.length > 0 ? (
                          <InputAdornment position='end'>
                            <Typography sx={{ fontSize: '14px' }}>{f.units[0]}</Typography>
                          </InputAdornment>
                        ) : null
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
                <Grid item xs={12} key={f.field_id}>
                  <ToggleButtonGroup
                    exclusive
                    value={flatValue || ''}
                    onChange={(e, v) => setValue(`anesthesiaSetup.${key}.${uiKey}`, v ?? '', { shouldDirty: true })}
                    sx={radioTileGroupStyles}
                  >
                    {f.options.map(opt => (
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
              <Grid item xs={12} md={6} key={f.field_id}>
                <TextField
                  fullWidth
                  label={f.field_label}
                  placeholder='Enter'
                  value={flatValue}
                  onChange={e => setValue(`anesthesiaSetup.${key}.${uiKey}`, e.target.value, { shouldDirty: true })}
                  InputLabelProps={{ shrink: true }}
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
      const monitoringState = watch(`anesthesiaSetup.${key}.monitoring`) || { selected: [], otherItems: [] }
      const items = sectionMeta.monitoring_items.map(mi => ({ id: Number(mi.id), name: mi.name }))
      const monitoringError = errors?.anesthesiaSetup?.[key]?.monitoring

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ToggleButtonGroup
            value={monitoringState.selected || []}
            onChange={(e, newValues) =>
              setValue(`anesthesiaSetup.${key}.monitoring.selected`, newValues || [], { shouldDirty: true })
            }
            sx={monitoringToggleGroupStyles}
          >
            {items.map(option => {
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
              <Typography sx={{ ...firstColumnTextStyles, mb: '10px' }}>Other Monitoring Items Added</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px', mt: '10px', mb: '10px' }}>
                {monitoringState.otherItems.map(item => (
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
              height: '115px',
              gap: '10px',
              borderRadius: '8px',
              padding: '16px',
              border: `0.5px solid ${outlineColor}`,
              backgroundColor: displayBgSecondary,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Typography sx={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '14px', color: onSurface }}>
              Add New Other Item
            </Typography>
            <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder='New Monitoring'
                value={newMonitoringItem}
                onChange={e => setNewMonitoringItem(e.target.value)}
                onKeyDown={e => handleNewItemKeyDown(e, key)}
                sx={{ ...textFieldStyles, '& .MuiInputBase-input': { color: onSurface } }}
              />
              <Button
                variant='contained'
                onClick={() => handleAddOtherItem(key)}
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
                ADD
              </Button>
            </Box>
          </Box>
        </Box>
      )
    }

    return null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {rows.map(({ key, label, meta }) => {
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
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleRowChecked(key)
                  }
                }}
              >
                <Checkbox
                  checked={!!checked}
                  onChange={handleCheckboxToggle(key)}
                  onClick={event => event.stopPropagation()}
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
