'use client'

import { Box, Button, Divider, Grid, Typography, useTheme } from '@mui/material'
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
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

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

const necropsyPriorityList = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

const defaultValues = {
  dischargeType: 'mortality',
  dateOfDeath: null,
  timeOfDeath: null,
  causeOfDeath: '',
  carcassCondition: '',
  carcassDeposition: '',
  requestNecropsy: true,
  necropsyPriority: 'high',
  noNecropsyReason: '',
  hospital: '',
  transferReason: '',
  dischargeDate: '',
  DischargeTime: '',
  dietInstruction: '',
  restrictionActivities: '',
  additionalNotes: '',
  transferSite: '',
  transferSection: '',
  transferEnclosure: '',
  followUpDate: '',
  followUpRequired: true
}

const schema = yup.object().shape({})

const InpatientDischarge = () => {
  const theme: any = useTheme()

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

  const [deathCauses, setDeathCauses] = useState<any[]>([])
  const [carcassCondition, setCarcassCondition] = useState<any[]>([])
  const [carcassDeposition, setCarcassDeposition] = useState<any[]>([])
  const [content, setContent] = useState<string>('')
  const [activeTemplate, setActiveTemplate] = useState<string>(templates[0])

  const watchRequestNecropsy = watch('requestNecropsy')
  const watchDischargeType = watch('dischargeType')

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
                  {dischargeType?.map((item: any, index: number) => (
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
                  getOptionLabel={(option: any) => option.label}
                  getOptionValue={(option: any) => option.value}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledSelect
                  control={control}
                  name={'carcassCondition'}
                  errors={errors}
                  label={'Carcass Condition'}
                  options={carcassCondition}
                  getOptionLabel={(option: any) => option.label}
                  getOptionValue={(option: any) => option.value}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledSelect
                  control={control}
                  name={'carcassDeposition'}
                  errors={errors}
                  label={'Carcass Deposition'}
                  options={carcassDeposition}
                  getOptionLabel={(option: any) => option.label}
                  getOptionValue={(option: any) => option.value}
                />
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', background: '#E8F4F266', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', pt: 5, px: 5, gap: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <StyledTypography>Enter summary</StyledTypography>
                <RichTextEditor value={content} onChange={setContent} placeholder='Write something amazing...' label={undefined as any} />
              </Box>
              <SaveTemplateButton fontColor={undefined as any} iconSize={undefined as any} />
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
          <Divider />
          <Grid container spacing={2}>
            <Grid
              size={{ sm: 12, md: 6 }}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 4 }}
            >
              <StyledTypography fontSize={'20px'}>Request Necropsy</StyledTypography>
              <ControlledSwitch
                name={'requestNecropsy'}
                label={'Yes'}
                labelPlacement='right'
                control={control}
                errors={errors}
                gap={4}
              />
            </Grid>
            <Grid size={{ sm: 12, md: 6 }}>
              {watchRequestNecropsy === true ? (
                <ControlledSelect
                  control={control}
                  name={'necropsyPriority'}
                  errors={errors}
                  label={'Select Priority'}
                  fullWidth
                  options={necropsyPriorityList}
                  getOptionLabel={(option: any) => option.label}
                  getOptionValue={(option: any) => option.value}
                />
              ) : (
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label={'Enter reason why necropsy will not be performed'}
                  name={'noNecropsyReason'}
                  placeholder={'Enter Reason'}
                  fullWidth
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </form>
    </>
  )
}

export default InpatientDischarge

const StyledTypography = styled(Typography)<{ fontWeight?: number; fontSize?: string }>(
  ({ theme, fontWeight, fontSize }: any) => ({
    fontSize: fontSize || '1rem',
    fontWeight: fontWeight || 500,
    color: theme.palette.customColors.OnSurfaceVariant
  })
)
