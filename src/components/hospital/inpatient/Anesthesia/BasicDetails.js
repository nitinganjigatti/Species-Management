import React, { useState } from 'react'
import {
  Box,
  TextField,
  Typography,
  Grid,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Divider
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'

export default function BasicDetails() {
  const {
    control,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext()
  const theme = useTheme()
  const [newPurpose, setNewPurpose] = useState('')

  const purposeOptions = [
    'Detailed physical examination',
    'Ultrasonography',
    'MRI',
    'Blood draw',
    'Wing/beak/nail trim',
    'Endoscopy',
    'E-collar placement',
    'Dentistry, print dental sheet',
    'Wound management/bandaging',
    'Feeding tube (esophagostomy tube)',
    'CT',
    'OR surgery, submit request'
  ]

  const timeUnits = ['hr', 'min']
  const data = watch()

  const commonTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      color: theme.palette.customColors.OnSurfaceVariant
    },
    '& .MuiInputBase-input': {
      color: theme.palette.customColors.OnSurfaceVariant
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.customColors.OnSurfaceVariant
    }
  }

  const parseEstimatedTime = value => {
    if (!value) return { val: '', unit: 'hr' }
    const [v, u] = value.split(' ')
    return { val: v || '', unit: u || 'hr' }
  }

  const purposes = watch('basicDetails.purpose') || []
  const customPurposes = purposes.filter(p => !purposeOptions.includes(p))

  return (
    <Box sx={{ width: '100%', p: 0 }}>
      <Grid container spacing={5} columns={12}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.location'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Location'
                error={!!errors.basicDetails?.location}
                helperText={errors.basicDetails?.location?.message}
                sx={commonTextFieldSx}
                slotProps={{ input: { 'data-field': 'location' } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.dateTime'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Date & Time of Anesthesia'
                type='datetime-local'
                error={!!errors.basicDetails?.dateTime}
                helperText={errors.basicDetails?.dateTime?.message}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: { 'data-field': 'dateTime' }
                }}
                sx={commonTextFieldSx}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.estimatedTime'
            control={control}
            defaultValue=''
            render={({ field }) => {
              const { val, unit } = parseEstimatedTime(field.value)
              const handleChange = (newVal, newUnit) => {
                const combined = newVal ? `${newVal} ${newUnit}` : ''
                field.onChange(combined)
              }

              return (
                <TextField
                  fullWidth
                  label='Estimated Time Required'
                  placeholder='Enter'
                  value={val}
                  onChange={e => handleChange(e.target.value, unit)}
                  error={!!errors.basicDetails?.estimatedTime}
                  helperText={errors.basicDetails?.estimatedTime?.message}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px', height: '56px' } }}
                  slotProps={{
                    input: {
                      'data-field': 'estimatedTime',
                      endAdornment: (
                        <InputAdornment position='end' sx={{ mr: 0.5 }}>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', width: '80px', justifyContent: 'flex-end' }}
                          >
                            <TextField
                              select
                              variant='standard'
                              value={unit}
                              onChange={e => handleChange(val, e.target.value)}
                              slotProps={{ input: { disableUnderline: true } }}
                              sx={{
                                '& .MuiInputBase-root': {
                                  border: 'none',
                                  minWidth: '60px',
                                  maxWidth: '80px',
                                  fontSize: '14px',
                                  textAlign: 'center'
                                },
                                '& .MuiSelect-select': { padding: 0 }
                              }}
                            >
                              {timeUnits.map(u => (
                                <MenuItem key={u} value={u}>
                                  {u}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Box>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.veterinarian'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label='Veterinarian'
                error={!!errors.basicDetails?.veterinarian}
                helperText={errors.basicDetails?.veterinarian?.message}
                sx={commonTextFieldSx}
                slotProps={{ select: { 'data-field': 'veterinarian' } }}
              >
                <MenuItem value='Dr. John D Sam'>Dr. John D Sam</MenuItem>
                <MenuItem value='Dr. Jane M Doe'>Dr. Jane M Doe</MenuItem>
              </TextField>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.anesthetist'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label='Anesthetist'
                error={!!errors.basicDetails?.anesthetist}
                helperText={errors.basicDetails?.anesthetist?.message}
                sx={commonTextFieldSx}
                slotProps={{ select: { 'data-field': 'anesthetist' } }}
              >
                <MenuItem value='Dr. John D Sam'>Dr. John D Sam</MenuItem>
                <MenuItem value='Dr. Lisa Ray'>Dr. Lisa Ray</MenuItem>
              </TextField>
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mt: 8 }} />

      <Box mt={5}>
        <Typography
          fontWeight={600}
          mb={3}
          sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Purpose of Anesthesia{' '}
          <Typography
            component='span'
            sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.secondaryBg, pl: 4 }}
          >
            Select all that apply
          </Typography>
        </Typography>

        <Controller
          name='basicDetails.purpose'
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <>
              <ToggleButtonGroup
                value={field.value || []}
                onChange={(_, newValues) => field.onChange(newValues)}
                aria-label='Purpose of anesthesia'
                sx={{
                  flexWrap: 'wrap',
                  gap: 3,
                  mt: 1,
                  display: 'flex',
                  // border: errors.basicDetails?.purpose ? `1px solid ${theme.palette.error.main}` : 'none',
                  borderRadius: '8px',
                  p: errors.basicDetails?.purpose ? 1 : 0,
                  '& .MuiToggleButton-root': {
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '14px',
                    px: 4,
                    py: 2.5,
                    background: theme.palette.customColors.neutral05,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    border: 'none'
                  },
                  '& .MuiToggleButton-root.Mui-selected': {
                    bgcolor: theme.palette.customColors.OnPrimaryContainer,
                    color: '#fff'
                  },
                  '& .MuiToggleButton-root.Mui-selected:hover': {
                    bgcolor: theme.palette.primary.dark
                  }
                }}
              >
                {purposeOptions.map(option => (
                  <ToggleButton key={option} value={option}>
                    {option}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {errors.basicDetails?.purpose && (
                <Typography variant='caption' color={theme.palette.customColors.Error} sx={{ mt: 1, display: 'block' }}>
                  {String(errors.basicDetails?.purpose?.message || 'Required')}
                </Typography>
              )}

              {customPurposes.length > 0 && (
                <Box mt={5}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      mb: 2,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 600
                    }}
                  >
                    Other Purposes Added
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {customPurposes.map(p => (
                      <Box
                        key={p}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 2.9,
                          py: 3.2,
                          borderRadius: '8px',
                          backgroundColor: alpha(theme.palette.customColors.PrimaryContainer, 0.2),
                          color: theme.palette.getContrastText(theme.palette.success.main),
                          fontSize: '14px',
                          border: `1px solid ${theme.palette.primary.main}`
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap' }}>{p}</span>
                        <Button
                          onClick={() => field.onChange((field.value || []).filter(item => item !== p))}
                          aria-label={`Remove ${p}`}
                          sx={{
                            minWidth: 0,
                            ml: 1.5,
                            p: 0,
                            lineHeight: 1,
                            borderRadius: '50%',
                            fontSize: 20,
                            color: theme.palette.customColors.Outline
                          }}
                        >
                          ×
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Box
                mt={5}
                sx={{
                  background: theme.palette.customColors.mdAntzNeutral,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  width: '60%'
                }}
              >
                <Typography
                  fontWeight={600}
                  mb={2}
                  sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Add New Other Purpose
                </Typography>

                <Box display='flex' gap={2}>
                  <TextField
                    fullWidth
                    placeholder='Enter new purpose'
                    value={newPurpose}
                    onChange={e => setNewPurpose(e.target.value)}
                    sx={{ ...commonTextFieldSx, background: theme.palette.common.white }}
                  />
                  <Button
                    variant='contained'
                    color='secondary'
                    disabled={!newPurpose.trim()}
                    onClick={() => {
                      const v = newPurpose.trim()
                      if (!v) return
                      const current = Array.isArray(field.value) ? field.value : []
                      field.onChange([...current, v])
                      setNewPurpose('')
                    }}
                    sx={{
                      minWidth: 120,
                      background: theme.palette.primary.main,
                      boxShadow: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    ADD
                  </Button>
                </Box>
              </Box>
            </>
          )}
        />
      </Box>

      <Box mt={5}>
        <Typography fontWeight={600} mb={3}>
          Notes
        </Typography>
        <Controller
          name='basicDetails.notes'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              placeholder='Enter Notes'
              multiline
              rows={3}
              error={!!errors.basicDetails?.notes}
              helperText={errors.basicDetails?.notes?.message}
              slotProps={{ input: { 'data-field': 'notes' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  backgroundColor: theme.palette.customColors.antzNotes
                },
                '& .MuiInputBase-input': {
                  color: theme.palette.customColors.OnSurfaceVariant
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.customColors.OnSurfaceVariant
                }
              }}
            />
          )}
        />
      </Box>
    </Box>
  )
}
