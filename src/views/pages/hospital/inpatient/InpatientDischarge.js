import { Box, Button, Grid, Typography, useTheme } from '@mui/material'
import React, { useState } from 'react'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Controller, useForm } from 'react-hook-form'
import { styled } from '@mui/system'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import RichTextEditor from 'src/components/RichTextEditor'
import { SaveTemplateButton } from 'src/views/utility/render-snippets'
import Icon from 'src/@core/components/icon'

const dischargeType = [
  { label: 'Mortality', value: 'mortality' },
  { label: 'Transfer to another hospital', value: 'transfer' },
  { label: 'Discharge to enclosure', value: 'discharge' }
]

const templates = [
  'Avian summary',
  'Feline summary',
  'Feline summary',
  'reptilian summary',
  'reptilian summary',
  'reptilian summary',
  'reptilian summary',
  'reptilian summary'
]

const defaultValues = {
  dischargeType: 'mortality',
  dateOfDeath: null,
  timeOfDeath: null,
  causeOfDeath: '',
  carcassCondition: '',
  carcassDeposition: ''
}

const schema = yup.object().shape({})

const InpatientDischarge = () => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [deathCauses, setDeathCauses] = useState([])
  const [carcassCondition, setCarcassCondition] = useState([])
  const [carcassDeposition, setCarcassDeposition] = useState([])
  const [content, setContent] = useState('')
  const [activeTemplate, setActiveTemplate] = useState(templates[0])

  return (
    <>
      <form>
        <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Box
            sx={{ background: '#FCF4AE99', p: 6, borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}>
              Reason of Admission
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralPrimary }}>
              Leopard was observed with reduced mobility and swelling in the right forelimb, suspected fracture due to
              fall
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>Discharge Type</StyledTypography>

            <Controller
              name='dischargeType'
              control={control}
              render={({ field }) => (
                <Grid container spacing={6}>
                  {dischargeType?.map((item, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                      <TreatmentTypeRadioButtons
                        label={item?.label}
                        isSelected={field.value === item?.value}
                        onClick={() => field.onChange(item?.value)}
                        radioPosition='right'
                        selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                        selectedFontColor='#FFF'
                        selectedBorderColor='none'
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StyledTypography>Mortality Details</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledDatePicker control={control} name={'dateOfDeath'} label='Date of Death' errors={errors} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTimePicker control={control} name={'timeOfDeath'} label='Time of Death' />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledSelect
                  control={control}
                  name={'causeOfDeath'}
                  errors={errors}
                  label={'Cause of Death'}
                  options={deathCauses}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledSelect
                  control={control}
                  name={'carcassCondition'}
                  errors={errors}
                  label={'Carcass Condition'}
                  options={carcassCondition}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledSelect
                  control={control}
                  name={'carcassDeposition'}
                  errors={errors}
                  label={'Carcass Deposition'}
                  options={carcassDeposition}
                />
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', background: '#E8F4F266', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', pt: 5, px: 5, gap: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <StyledTypography>Enter summary</StyledTypography>
                <RichTextEditor value={content} onChange={setContent} placeholder='Write something amazing...' />
              </Box>
              <SaveTemplateButton />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', px: 5, pb: 5, gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StyledTypography fontWeight={400}>Select from templates</StyledTypography>
                <Button
                  endIcon={<Icon icon={'mingcute:right-fill'} color={theme.palette.primary.OnSurface} />}
                  sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.primary.OnSurface }}
                >
                  See all
                </Button>
              </Box>
              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  overflowX: 'auto',
                  scrollbarColor: 'transparent transparent'
                }}
              >
                <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1 }}>
                  {templates.map(template => (
                    <Box
                      key={template}
                      onClick={() => setActiveTemplate(template)}
                      sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        px: '16px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor:
                          activeTemplate === template
                            ? theme.palette.secondary.dark
                            : theme.palette.customColors.mdAntzNeutral,
                        cursor: 'pointer'
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            activeTemplate === template
                              ? theme.palette.primary.contrastText
                              : theme.palette.customColors.neutralPrimary,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {template}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </form>
    </>
  )
}

export default InpatientDischarge

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: theme.palette.customColors.OnSurfaceVariant
}))
