'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, MenuItem, TextField, Typography, ToggleButton, ToggleButtonGroup, Radio } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { useTheme, Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

import VitalFormDialog from './VitalFormDialog'
import { AnesthesiaSetup, AnesthesiaSetupFields } from 'src/types/hospital/models'

interface MeasurementFieldEntry {
  value?: string | number | null
  unit?: string | null
}

interface MeasurementInitialData {
  selection?: string | number | null
  value?: string | number | null
  unit?: string
  fieldsById?: Record<string, MeasurementFieldEntry>
  [key: string]: unknown
}

interface MeasurementSubmissionData {
  selection?: string | number
  value?: string
  unit?: string
  [key: string]: unknown
}
import {
  measurementActionsSx,
  measurementCancelButtonSx,
  measurementContentSx,
  measurementDialogPaperSx,
  measurementFieldLabelSx,
  measurementFieldsContainerSx,
  measurementHeaderContainerSx,
  measurementHeaderTimeContainerSx,
  measurementHeaderTimeIconSx,
  measurementHeaderTitleSx,
  measurementPrimaryFieldColumnSx,
  measurementSecondaryFieldColumnSx,
  measurementSubmitButtonSx,
  createMeasurementFieldSx
} from './sharedStyles'

const prettifyOptionLabel = (opt: string | number) =>
  String(opt)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch: string) => ch.toUpperCase())

const getToggleButtonStyles = (theme: any) => ({
  flex: 1,
  minWidth: 0,
  height: '56px',
  borderRadius: '4px !important',
  border: `1px solid ${theme.palette.customColors?.Outline || theme.palette.divider} !important`,
  textTransform: 'none',
  color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '16px',
  letterSpacing: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  '&:hover': {
    backgroundColor: theme.palette.primary.contrastText
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.background?.OnBackground || theme.palette.action.selected,
    borderColor: `${theme.palette.primary.main} !important`,
    color: theme.palette.customColors?.customHeadingTextColor || theme.palette.text.primary
  }
})

const getRadioStyles = (theme: Theme) => ({
  padding: 0,
  pointerEvents: 'none',
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
    color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
  },
  '&.Mui-checked .MuiSvgIcon-root': {
    color: theme.palette.primary.main
  }
})

interface GenericMeasurementDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: MeasurementSubmissionData) => void
  sectionMeta?: AnesthesiaSetup | null
  initialData?: MeasurementInitialData | null
  timeLabel?: string
}

export default function GenericMeasurementDialog({
  open,
  onClose,
  onSubmit,
  sectionMeta,
  initialData = {},
  timeLabel = ''
}: GenericMeasurementDialogProps) {
  const { t } = useTranslation()
  const theme: Theme = useTheme()
  const fieldsMeta: AnesthesiaSetupFields[] = sectionMeta?.fields || []
  const firstField: AnesthesiaSetupFields | null = fieldsMeta[0] ?? null

  const isSingleNumber = fieldsMeta.length === 1 && firstField?.input_type === 'number'
  const isSingleRadio =
    fieldsMeta.length === 1 && (firstField?.input_type === 'radio' || firstField?.input_type === 'select')

  const unitsForSingle = firstField?.units && firstField.units.length ? firstField.units : ['']
  const allUnits = useMemo(() => {
    const u = fieldsMeta.flatMap((f: AnesthesiaSetupFields) => f.units || [])
    return Array.from(new Set(u.length ? u : ['']))
  }, [fieldsMeta])

  const [singleValue, setSingleValue] = useState<string | number>('')
  const [singleUnit, setSingleUnit] = useState<string>(unitsForSingle[0] ?? '')
  const singleFirstRef = useRef<HTMLInputElement | null>(null)

  const [selection, setSelection] = useState<string>('')
  const firstToggleRef = useRef<HTMLButtonElement | null>(null)

  const buildInitialMulti = () => {
    const obj: Record<string, string | number> = {}
    fieldsMeta.forEach((f: AnesthesiaSetupFields) => {
      obj[f.field_key] = (initialData?.[f.field_key] as string | number) ?? ''
    })
    return obj
  }
  const [multiValues, setMultiValues] = useState<Record<string, string | number>>(buildInitialMulti)
  const [multiUnit, setMultiUnit] = useState<string>(allUnits[0] ?? '')
  const multiFirstRef = useRef<HTMLInputElement | null>(null)

  const focusFirst = (ref: React.RefObject<HTMLElement | null>) => setTimeout(() => ref?.current?.focus?.(), 0)

  useEffect(() => {
    if (open) {
      {
        console.log(initialData, 'initialData')
      }
      setSingleValue(initialData?.value ?? (initialData?.[firstField?.field_key ?? ''] as string | number | null | undefined) ?? '')
      setSingleUnit(initialData?.unit ?? (initialData?.[(firstField?.field_key ?? '') + '_unit'] as string | undefined) ?? unitsForSingle[0] ?? '')

      setSelection(
        initialData?.selection != null
          ? String(initialData.selection)
          : initialData?.value != null
          ? String(initialData.value)
          : ''
      )

      setMultiValues(
        fieldsMeta.reduce((acc: Record<string, string | number>, f: AnesthesiaSetupFields) => {
          acc[f.field_key] = (initialData?.[f.field_key] as string | number) ?? ''
          return acc
        }, {})
      )
      setMultiUnit(initialData?.unit ?? allUnits[0] ?? '')

      if (isSingleNumber) {
        focusFirst(singleFirstRef)
      } else if (isSingleRadio) {
        focusFirst(firstToggleRef)
      } else {
        focusFirst(multiFirstRef)
      }
    }
  }, [open, sectionMeta?.string_id, JSON.stringify(initialData)])

  const handleSingleSubmit = () => {
    if (!String(singleValue).trim()) return
    onSubmit({ value: String(singleValue).trim(), unit: singleUnit })
  }

  const handleRadioSubmit = () => {
    if (selection === '' || selection == null) return
    onSubmit({ selection })
  }

  const handleMultiSubmit = () => {
    if (!Object.values(multiValues).some((v: string | number) => String(v).trim() !== '')) return
    onSubmit({ ...multiValues, unit: multiUnit })
  }

  const renderHeader = () => {
    const displayTime = timeLabel || '--'
    return (
      <Box sx={measurementHeaderContainerSx(theme)}>
        <Typography sx={measurementHeaderTitleSx(theme)}>{sectionMeta?.section_name ?? 'Measurement'}</Typography>
        <Box sx={measurementHeaderTimeContainerSx}>
          <AccessTimeRoundedIcon sx={measurementHeaderTimeIconSx(theme)} />
          <Typography sx={measurementHeaderTitleSx(theme)}>{displayTime}</Typography>
        </Box>
      </Box>
    )
  }

  const isSingleUnit = unitsForSingle.length === 1
  const displayValue = unitsForSingle[0] || '—'

  // Single-number UI (Temperature-style)
  if (isSingleNumber) {
    return (
      <VitalFormDialog
        open={open}
        onClose={onClose}
        onSubmit={handleSingleSubmit}
        title={sectionMeta?.section_name ?? 'Measurement'}
        renderHeader={renderHeader}
        contentSx={measurementContentSx}
        actionsSx={measurementActionsSx}
        cancelButtonSx={measurementCancelButtonSx(theme)}
        submitButtonSx={measurementSubmitButtonSx(theme)}
        paperSx={measurementDialogPaperSx(theme)}
        disableSubmit={!String(singleValue).trim()}
        submitLabel={t('hospital_module.add_entry') as string}
      >
        <Box
          component='form'
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault()
            handleSingleSubmit()
          }}
          sx={measurementFieldsContainerSx}
        >
          <Box sx={measurementPrimaryFieldColumnSx}>
            <Typography sx={measurementFieldLabelSx(theme)}>{firstField?.field_label ?? t('hospital_module.enter_value')}</Typography>
            <TextField
              fullWidth
              placeholder={(t('hospital_module.enter_value') as string)}
              value={singleValue}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSingleValue(event.target.value)}
              type='number'
              inputProps={{ min: 0, inputMode: 'decimal' }}
              sx={createMeasurementFieldSx(
                theme,
                theme.palette.customColors?.Surface,
                theme.palette.customColors?.customHeadingTextColor
              )}
              inputRef={singleFirstRef}
            />
          </Box>

          <Box sx={measurementSecondaryFieldColumnSx}>
            <Typography sx={measurementFieldLabelSx(theme)}>UOM</Typography>
            {isSingleUnit ? (
              <TextField
                fullWidth
                value={displayValue}
                disabled
                sx={{
                  ...createMeasurementFieldSx(
                    theme,
                    theme.palette.customColors?.Surface,
                    theme.palette.customColors?.neutralSecondary
                  ),

                  '& .MuiInputBase-input.Mui-disabled': {
                    color: '#7A8684',
                    WebkitTextFillColor: '#7A8684'
                  }
                }}
              />
            ) : (
              <TextField
                select
                fullWidth
                value={singleUnit}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSingleUnit(event.target.value)}
                sx={createMeasurementFieldSx(
                  theme,
                  theme.palette.customColors?.Surface,
                  theme.palette.customColors?.neutralSecondary
                )}
              >
                {unitsForSingle.map((option: string) => (
                  <MenuItem key={String(option || '__none')} value={option || ''}>
                    {option || '—'}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </Box>
      </VitalFormDialog>
    )
  }

  // Single radio/select field UI
  if (isSingleRadio) {
    const options = Array.isArray(firstField?.options) && firstField.options.length ? firstField.options : []
    const toggleButtonStyles = getToggleButtonStyles(theme)
    const radioStyles = getRadioStyles(theme)

    const handleFormSubmit = (event: React.FormEvent) => {
      event.preventDefault()
      handleRadioSubmit()
    }

    return (
      <VitalFormDialog
        open={open}
        onClose={onClose}
        onSubmit={handleRadioSubmit}
        title={sectionMeta?.section_name ?? 'Measurement'}
        renderHeader={renderHeader}
        contentSx={measurementContentSx}
        actionsSx={measurementActionsSx}
        cancelButtonSx={measurementCancelButtonSx(theme)}
        submitButtonSx={measurementSubmitButtonSx(theme)}
        paperSx={measurementDialogPaperSx(theme)}
        disableSubmit={!selection}
        submitLabel={t('hospital_module.add_entry') as string}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
          <Typography sx={measurementFieldLabelSx(theme)}>{firstField?.field_label ?? t('select')}</Typography>

          <Box
            component='form'
            onSubmit={handleFormSubmit}
            onKeyDown={(event: React.KeyboardEvent) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleRadioSubmit()
              }
            }}
          >
            <ToggleButtonGroup
              value={selection}
              exclusive
              onChange={(_event, value: string | null) => {
                if (value == null) return
                setSelection(String(value))
              }}
              sx={{ display: 'flex', gap: '12px' }}
            >
              {options.map((opt: string, index: number) => {
                const value = String(opt)
                const label = prettifyOptionLabel(opt)
                return (
                  <ToggleButton
                    key={value}
                    value={value}
                    sx={toggleButtonStyles}
                    ref={index === 0 ? firstToggleRef : null}
                  >
                    <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: 'inherit' }}>
                      {label}
                    </Typography>
                    <Radio checked={selection === value} tabIndex={-1} disableRipple sx={radioStyles} />
                  </ToggleButton>
                )
              })}
            </ToggleButtonGroup>
          </Box>
        </Box>
      </VitalFormDialog>
    )
  }

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleMultiSubmit}
      title={sectionMeta?.section_name ?? 'Measurement'}
      renderHeader={renderHeader}
      contentSx={measurementContentSx}
      actionsSx={measurementActionsSx}
      cancelButtonSx={measurementCancelButtonSx(theme)}
      submitButtonSx={measurementSubmitButtonSx(theme)}
      paperSx={measurementDialogPaperSx(theme)}
      disableSubmit={false}
      submitLabel={t('hospital_module.add_entry') as string}
    >
      <Box
        component='form'
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault()
          handleMultiSubmit()
        }}
        sx={measurementFieldsContainerSx}
      >
        {fieldsMeta.map((f: AnesthesiaSetupFields, idx: number) => (
          <Box key={f.field_key} sx={{ mb: 1 }}>
            <Typography sx={measurementFieldLabelSx(theme)}>{f.field_label}</Typography>
            <TextField
              fullWidth
              placeholder={(t('hospital_module.enter_value') as string)}
              value={multiValues[f.field_key] ?? ''}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMultiValues((prev: Record<string, string | number>) => ({ ...prev, [f.field_key]: event.target.value }))}
              type={f.input_type === 'number' ? 'number' : 'text'}
              inputProps={f.input_type === 'number' ? { min: 0, inputMode: 'decimal' } : {}}
              sx={createMeasurementFieldSx(
                theme,
                theme.palette.customColors?.Surface,
                theme.palette.customColors?.customHeadingTextColor
              )}
              inputRef={idx === 0 ? multiFirstRef : undefined}
            />
          </Box>
        ))}

        <Box sx={{ mt: 1 }}>
          <Typography sx={measurementFieldLabelSx(theme)}>UOM</Typography>
          <TextField
            select
            fullWidth
            value={multiUnit}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMultiUnit(event.target.value)}
            sx={createMeasurementFieldSx(
              theme,
              theme.palette.customColors?.Surface,
              theme.palette.customColors?.neutralSecondary
            )}
          >
            {allUnits.map((option: string) => (
              <MenuItem key={String(option || '__none')} value={option || ''}>
                {option || '—'}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>
    </VitalFormDialog>
  )
}
