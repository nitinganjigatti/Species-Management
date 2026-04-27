import React, { useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Select,
  Switch,
  Typography,
  useTheme
} from '@mui/material'
import { AddCircleOutlineRounded, Close as CloseIcon } from '@mui/icons-material'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

interface DynamicField {
  id: string
  label: string
  string_id: string
  field_type: string
  is_repetative: number | string
  is_required: number
  default_values?: any[]
  selected_value?: any
  selected_unit?: string | null
  additional_info?: any | []
  display_type?: string
}

interface DynamicSection {
  id: string
  label: string
  string_id: string
  field_type: string
  fields: DynamicField[]
  additional_info?: any | []
}

interface SpeciesDynamicFieldsProps {
  dynamicSchema: DynamicSection[]
  dynamicFormValues: { [key: string]: any }
  onDynamicFieldChange: (fieldId: string, index: number, value: any) => void
  onDynamicFieldRemove?: (fieldId: string, index: number, instanceCount: number) => void
  control: any
  setValue: (name: string, value: any) => void
}

const SpeciesDynamicFields: React.FC<SpeciesDynamicFieldsProps> = ({
  dynamicSchema,
  dynamicFormValues,
  onDynamicFieldChange,
  onDynamicFieldRemove,
  control,
  setValue
}) => {
  const theme = useTheme()

  useEffect(() => {
    Object.entries(dynamicFormValues).forEach(([key, val]) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if ('title' in val || 'url' in val) {
          setValue(`dynamic_${key}_title`, val.title || '')
          setValue(`dynamic_${key}_url`, val.url || '')
        } else if ('selected_value' in val) {
          setValue(`dynamic_${key}_value`, val.selected_value ?? '')
        }
      } else {
        setValue(`dynamic_${key}`, val ?? '')
      }
    })
  }, [dynamicFormValues, setValue])

  const isFieldVisible = (field: DynamicField, sectionFields: DynamicField[]): boolean => {
    if (field.additional_info?.hide_parent_id) {
      const parentStringId = field.additional_info.hide_parent_id
      const parentField = sectionFields.find(f =>
        f.default_values?.some((opt: any) => opt.string_id === parentStringId)
      )

      if (parentField) {
        const parentKey = `${parentField.id}_0`
        const parentValue = dynamicFormValues[parentKey]

        if (parentValue && (parentValue.string_id === parentStringId || parentValue === parentStringId)) {
          return false
        }
      }
    }
    return true
  }

  const isCitesAppendixVisible = (sectionFields: DynamicField[]): boolean => {
    const citesListedField = sectionFields.find(f => f.string_id === 'species_section.cites_listed')
    if (citesListedField) {
      const citesKey = `${citesListedField.id}_0`
      const isEnabled = dynamicFormValues[citesKey] === '1'
      return isEnabled
    }
    return false
  }

  const renderTextField = (field: DynamicField, value: any, onChange: (val: any) => void, groupIndex: number) => {
    const fieldName = `dynamic_${field.id}_${groupIndex}`

    if (field.field_type === 'textarea') {
      return (
        <Grid size={{ xs: 12, sm: 12 }}>
          <ControlledTextArea
            label={field.label}
            name={fieldName}
            control={control}
            onChangeOverride={(e: any) => onChange(e?.target ? e.target.value : e)}
            placeholder={field.additional_info?.placeholder}
            multiline
            rows={4}
            fullWidth
            required={field.is_required === 1}
          />
        </Grid>
      )
    }
    if (field.field_type === 'number_without_unit' || field.field_type === 'number') {
      return (
        <Grid size={{ xs: 12, sm: 6 }}>
          <ControlledTextField
            name={fieldName}
            control={control}
            label={field.label}
            placeholder={field.additional_info?.placeholder}
            type='number'
            fullWidth
            required={field.is_required === 1}
            onChangeOverride={(e: any) => onChange(e?.target ? e.target.value : e)}
          />
        </Grid>
      )
    }

    return (
      <Grid size={{ xs: 12, sm: 6 }}>
        <ControlledTextField
          name={fieldName}
          control={control}
          label={field.label}
          placeholder={field.additional_info?.placeholder}
          type='text'
          fullWidth
          required={field.is_required === 1}
          onChangeOverride={(e: any) => onChange(e?.target ? e.target.value : e)}
        />
      </Grid>
    )
  }

  const renderSelectField = (field: DynamicField, value: any, onChange: (val: any) => void, groupIndex: number) => {
    const options = field.default_values || []

    return (
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth required={field.is_required === 1}>
          <InputLabel>{field.label}</InputLabel>
          <Select value={value || ''} onChange={e => onChange(e.target.value)} label={field.label}>
            <MenuItem value='' disabled>
              Select option
            </MenuItem>
            {options?.map((option: any) => (
              <MenuItem key={option.id} value={option.id}>
                {option.description ? `${option.label} (${option.description})` : option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    )
  }

  const renderCircularBadgeSelect = (
    field: DynamicField,
    value: any,
    onChange: (val: any) => void,
    groupIndex: number
  ) => {
    const options = field.default_values || []
    const selectedValue = value || ''

    return (
      <Grid size={{ xs: 12, sm: 12, md: 6 }}>
        <FormControl fullWidth required={field.is_required === 1}>
          <InputLabel id={`conservation-select-label-${field.id}`}>{field.label}</InputLabel>
          <Select
            labelId={`conservation-select-label-${field.id}`}
            value={selectedValue}
            label={field.label}
            onChange={e => onChange(e.target.value)}
            renderValue={selected => {
              const option = options.find((opt: any) => String(opt.id) === String(selected))
              if (!option) return <Typography>Select option</Typography>

              const extraData = option.extra_data || {}
              const shortForm = extraData.short_form
              const bgColor = extraData.backgroundColor
              const textColor = extraData.color || theme.palette.customColors.deepDark

              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      bgcolor: bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 'bold', color: textColor }}>{shortForm}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 16 }}>{option.label}</Typography>
                    {option.description && (
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{option.description}</Typography>
                    )}
                  </Box>
                </Box>
              )
            }}
          >
            {options?.map((option: any) => {
              const extraData = option.extra_data || {}
              const shortForm = extraData.short_form || option.label.substring(0, 2).toUpperCase()
              const bgColor = extraData.backgroundColor
              const textColor = extraData.color || theme.palette.customColors.deepDark

              return (
                <MenuItem key={option.id} value={option.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      width: '100%',
                      backgroundColor: theme.palette.customColors.displaybgPrimary,
                      p: 3,
                      borderRadius: '6px',
                      '&:hover': {
                        border: `1px solid ${theme.palette.primary.main}`,
                        backgroundColor: theme.palette.customColors.OnBackground
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography sx={{ fontSize: 14, fontWeight: '700', color: textColor }}>{shortForm}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 16 }}>{option.label}</Typography>
                      {option.description && (
                        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{option.description}</Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
      </Grid>
    )
  }

  const renderRadioField = (field: DynamicField, value: any, onChange: (val: any) => void, groupIndex: number) => {
    const options = field.default_values || []
    const selectedValue = value?.id || value

    return (
      <Grid size={{ xs: 12 }} sx={{ width: '100%' }}>
        <FormControl component='fieldset' margin='normal' fullWidth required={field.is_required === 1}>
          <Typography variant='body2' sx={{ mb: 2 }}>
            {field.label}
          </Typography>

          <RadioGroup
            value={selectedValue || ''}
            sx={{ width: '100%' }}
            onChange={e => {
              const selectedOption = options.find((opt: any) => String(opt.id) === e.target.value)
              onChange({
                id: selectedOption?.id,
                string_id: selectedOption?.string_id,
                extra_data: selectedOption?.extra_data
              })
            }}
          >
            <Grid container spacing={4} sx={{ width: '100%', margin: 0 }}>
              {options?.map((option: any) => (
                <Grid size={{ xs: 12, sm: 6 }} key={option.id} sx={{ p: 0 }}>
                  <FormControlLabel
                    value={String(option.id)}
                    control={<Radio />}
                    label={option.label}
                    sx={{
                      width: '100%',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      p: 1,
                      m: 0,
                      backgroundColor:
                        selectedValue === String(option.id) ? theme.palette.secondary.dark : 'transparent',
                      color: selectedValue === String(option.id) ? theme.palette.customColors.OnPrimary : 'default',
                      '& .MuiFormControlLabel-label': {
                        color: selectedValue === String(option.id) ? theme.palette.customColors.OnPrimary : 'default',
                        width: '100%'
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </FormControl>
      </Grid>
    )
  }

  const renderNumberWithUnitField = (
    field: DynamicField,
    value: any,
    onChange: (val: any) => void,
    groupIndex: number
  ) => {
    const units = field.default_values || []
    const currentValue = value?.selected_value || ''
    const currentUnit = value?.selected_unit || ''

    return (
      <Grid size={{ xs: 12, sm: 6 }}>
        <Grid container spacing={2} marginTop={1}>
          <Grid size={{ xs: 8 }}>
            <ControlledTextField
              name={`dynamic_${field.id}_${groupIndex}_value`}
              control={control}
              label={field.label}
              placeholder={field.additional_info?.placeholder}
              type='number'
              fullWidth
              required={field.is_required === 1}
              onChangeOverride={(e: any) =>
                onChange({ selected_value: e?.target ? e.target.value : e, selected_unit: currentUnit })
              }
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={currentUnit}
                onChange={e => onChange({ selected_value: currentValue, selected_unit: e.target.value })}
                label='Unit'
              >
                <MenuItem value='' disabled>
                  Select unit
                </MenuItem>
                {units?.map((unit: any) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    )
  }

  const renderToggleButtonField = (
    field: DynamicField,
    value: any,
    onChange: (val: any) => void,
    groupIndex: number
  ) => {
    const enabled = value === true || value === '1' || value === 1

    return (
      <Grid size={{ xs: 12, sm: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>{field.label}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2'>{enabled ? 'Yes' : 'No'}</Typography>
            <Switch checked={enabled} onChange={e => onChange(e.target.checked ? '1' : '0')} />
          </Box>
        </Box>
      </Grid>
    )
  }

  const renderToggleTagsField = (field: DynamicField, value: any, onChange: (val: any) => void, groupIndex: number) => {
    const tags = field.default_values || ''
    const selectedValue = value || ''

    return (
      <Grid size={{ xs: 12, sm: 12 }}>
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography sx={{ mb: 1 }}>{field.label}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags && tags.length > 1
              ? tags?.map((tag: any) => {
                  const isSelected = String(selectedValue) === String(tag.id)
                  return (
                    <Chip
                      key={tag.id}
                      label={tag.label}
                      onClick={() => onChange(isSelected ? null : tag.id)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? theme.palette.customColors.OnPrimaryContainer
                          : theme.palette.customColors.neutral05,
                        color: isSelected ? theme.palette.customColors.OnPrimary : 'inherit',
                        '&:hover': {
                          backgroundColor: isSelected
                            ? theme.palette.customColors.OnPrimaryContainer
                            : theme.palette.customColors.shadowColor
                        }
                      }}
                    />
                  )
                })
              : ''}
          </Box>
        </Box>
      </Grid>
    )
  }

  const renderTagsField = (field: DynamicField, value: any, onChange: (val: any) => void, groupIndex: number) => {
    return (
      <Grid size={{ xs: 12, sm: 12 }}>
        <ControlledTextField
          name={`dynamic_${field.id}_${groupIndex}`}
          control={control}
          label={field.label}
          fullWidth
          placeholder={field.additional_info?.placeholder || 'Enter location'}
          onChangeOverride={(e: any) => onChange(e?.target ? e.target.value : e)}
        />
      </Grid>
    )
  }

  const renderUrlField = (field: DynamicField, value: any, onChange: (val: any) => void, groupIndex: number) => {
    const title = value?.title || ''
    const url = value?.url || ''

    return (
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={4} marginTop={1}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ControlledTextField
              name={`dynamic_${field.id}_${groupIndex}_title`}
              control={control}
              label={field.additional_info?.label2 || 'Title'}
              placeholder={field.additional_info?.placeholder2}
              fullWidth
              required={field.is_required === 1}
              onChangeOverride={(e: any) => onChange({ title: e?.target ? e.target.value : e, url })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ControlledTextField
              name={`dynamic_${field.id}_${groupIndex}_url`}
              control={control}
              label={field.additional_info?.label1 || 'URL'}
              placeholder={field.additional_info?.placeholder1}
              fullWidth
              required={field.is_required === 1}
              onChangeOverride={(e: any) => onChange({ title, url: e?.target ? e.target.value : e })}
            />
          </Grid>
        </Grid>
      </Grid>
    )
  }

  const renderDynamicField = (
    field: DynamicField,
    index: number,
    groupIndex: number = 0,
    sectionFields: DynamicField[] = []
  ) => {
    const valueKey = `${field.id}_${groupIndex}`
    const value = dynamicFormValues[valueKey]

    if (!isFieldVisible(field, sectionFields)) {
      return null
    }

    if (field.string_id === 'species_section.cites_appendix') {
      if (!isCitesAppendixVisible(sectionFields)) {
        return null
      }
    }

    const handleChange = (newValue: any) => {
      onDynamicFieldChange(field.id, groupIndex, newValue)
    }

    switch (field.field_type) {
      case 'textarea':
      case 'text':
      case 'number':
      case 'number_without_unit':
        return renderTextField(field, value, handleChange, groupIndex)
      case 'select':
        if (field.display_type === 'circular_badge') {
          return renderCircularBadgeSelect(field, value, handleChange, groupIndex)
        }
        return renderSelectField(field, value, handleChange, groupIndex)
      case 'radio_button':
        return renderRadioField(field, value, handleChange, groupIndex)
      case 'number_with_unit':
        return renderNumberWithUnitField(field, value, handleChange, groupIndex)
      case 'toggle_button':
        return renderToggleButtonField(field, value, handleChange, groupIndex)
      case 'toggle_tags':
        return renderToggleTagsField(field, value, handleChange, groupIndex)
      case 'tags':
        return renderTagsField(field, value, handleChange, groupIndex)
      case 'url':
        return renderUrlField(field, value, handleChange, groupIndex)
      default:
        return null
    }
  }

  const renderDynamicSection = (section: DynamicSection) => {
    const repeatableField = section.fields.find(f => f.is_repetative === 1 || f.is_repetative === '1')

    if (!repeatableField) {
      return (
        <Card
          key={section.id}
          sx={{
            mb: 4,
            backgroundColor: section.additional_info?.background_color || theme.palette.customColors.OnPrimary
          }}
        >
          <Box key={section.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 3 }}>
            {section.additional_info?.icon && (
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme?.palette?.customColors?.OnSurface}24`
                }}
              >
                <img src={section.additional_info.icon} alt={section.label} style={{ width: 18, height: 18 }} />
              </Box>
            )}
            <Typography variant='h6'>{section.label}</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={4} sx={{ p: 4 }}>
            {section.fields?.map((field, idx) => (
              <React.Fragment key={field.id}>{renderDynamicField(field, idx, 0, section.fields)}</React.Fragment>
            ))}
          </Grid>
        </Card>
      )
    }

    const existingKeys = Object.keys(dynamicFormValues).filter(key => key.startsWith(`${repeatableField.id}_`))
    const instanceCount = existingKeys.length > 0 ? existingKeys.length : 1

    return (
      <Card
        key={section.id}
        sx={{
          mb: 4,
          p: 2,
          backgroundColor: section.additional_info?.background_color || theme.palette.customColors.OnPrimary
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {section.additional_info?.icon && (
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme?.palette?.customColors?.OnSurface}24`
                }}
              >
                <img src={section.additional_info.icon} alt={section.label} style={{ width: 18, height: 18 }} />
              </Box>
            )}
            <Typography variant='h6'>{section.label}</Typography>
          </Box>
          <Button
            size='small'
            startIcon={<AddCircleOutlineRounded />}
            onClick={() => {
              const newIndex = instanceCount
              onDynamicFieldChange(repeatableField.id, newIndex, '')
            }}
          >
            Add More
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {Array.from({ length: instanceCount }).map((_, groupIndex) => (
          <Box key={groupIndex} sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                {section.fields?.map((field, fieldIndex) => (
                  <Grid container spacing={2} key={field.id}>
                    {renderDynamicField(field, fieldIndex, groupIndex, section.fields)}
                  </Grid>
                ))}
              </Box>
              {instanceCount > 1 && onDynamicFieldRemove && (
                <IconButton
                  size='small'
                  onClick={() => onDynamicFieldRemove(repeatableField.id, groupIndex, instanceCount)}
                  sx={{ color: 'error.main' }}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              )}
            </Box>
            {/* {groupIndex < instanceCount - 1 && <Divider sx={{ mt: 2 }} />} */}
          </Box>
        ))}
      </Card>
    )
  }

  if (!dynamicSchema.length) return null

  return <Box sx={{ mb: 4 }}>{dynamicSchema?.map(section => renderDynamicSection(section))}</Box>
}

export default SpeciesDynamicFields
