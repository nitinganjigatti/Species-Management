'use client'

import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Skeleton,
  TextField,
  Theme,
  Typography,
  useTheme
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import SelectParameterDrawer from './SelectParameterDrawer'
import { useQuery } from '@tanstack/react-query'
import {
  applyParamsToHospitalCaseId,
  getHospitalParamsTemplatesList,
  getMonitoringParameters,
  getParametersBasedOnTemplates,
  saveHospitalTemplate
} from 'src/lib/api/hospital/treatmentMonitoring'
import { useHospital } from 'src/context/HospitalContext'
import Toaster from 'src/components/Toaster'
import { AddMonitoringParameterPayload, GetTemplatesParamsListResponse, SaveTemplatePayload, TemplateAssessmentCategory } from 'src/types/hospital/api/TreatmentMonitoring/parametersUnit'
import { TemplateAssessmentTypes } from 'src/types/hospital/models'

export interface AssessmentFormItem {
  id: string
  label: string
  isExisting?: boolean
  isManuallyAdded?: boolean
}

export interface TemplateOption {
  label: string
  value: string
}

interface AddParameterDrawerProps {
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  hospitalCaseId?: string | number
  refetchMonitoringData?: any
  selectedDate?: string
  refetchMonitoringParams?: any
}

const AddParameterDrawer = ({
  open,
  setOpen,
  hospitalCaseId,
  refetchMonitoringData,
  selectedDate,
  refetchMonitoringParams
}: AddParameterDrawerProps) => {
  const { t } = useTranslation()
  const theme: Theme = useTheme()
  const { selectedHospital }: any = useHospital()

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [openSelectParamDrawer, setOpenSelectParamDrawer] = useState<boolean>(false)
  const [selectedAssessments, setSelectedAssessments] = useState<AssessmentFormItem[]>([])
  const [parameters, setParameters] = useState<AssessmentFormItem[]>([])
  const [apiParameters, setApiParameters] = useState<AssessmentFormItem[]>([])
  const [saveTemplate, setSaveTemplate] = useState<boolean>(false)
  const [templateName, setTemplateName] = useState<string>('')
  const [loadingParams, setLoadingParams] = useState<boolean>(false)
  const [saveLoading, setSaveLoading] = useState<boolean>(false)
  const [applyLoading, setApplyLoading] = useState<boolean>(false)
  const [monitoringLoading, setMonitoringLoading] = useState<boolean>(false)
  const [todayOnly, setTodayOnly] = useState<number | null>(0)
  const [todayOnlyError, setTodayOnlyError] = useState<boolean>(false)
  const [showAllTemplates, setShowAllTemplates] = useState<boolean>(false)

  useEffect(() => {
    const fetchMonitoringParameters = async () => {
      setMonitoringLoading(true)
      try {
        await getMonitoringParameters(hospitalCaseId ?? '', { monitoring_date: selectedDate ?? '' }).then((res) => {
          if (res?.status === true) {
            const apiParams: AssessmentFormItem[] =
              res?.data?.assessments?.map((item) => ({
                id: String(item?.assessment_type_id),
                label: item?.label,
                isExisting: true
              })) || []
            setParameters(apiParams)
            setSelectedAssessments(apiParams)
            setApiParameters(apiParams)
            setMonitoringLoading(false)
          }
        })
      } catch (error) {
        console.error('Cannot Fetch Monitoring Parameters', error)
        setMonitoringLoading(false)
      }
    }

    fetchMonitoringParameters()
  }, [open, hospitalCaseId])

  const {
    data: templateData,
    isLoading: templateLoading,
    refetch: refetchTemplates
  } = useQuery<GetTemplatesParamsListResponse>({
    queryKey: ['hospital-parameters-templates'],
    queryFn: () => getHospitalParamsTemplatesList({ ref_type: 'hospital', hospital_id: String(selectedHospital?.id ?? '') })
  })

  const templateList: TemplateOption[] = templateData?.data?.result?.map((item) => ({
    label: item?.template_name,
    value: item?.assessment_template_id
  })) ?? []

  const handleDrawerClose = () => {
    setOpen?.(false)
    setTemplateName('')
    setSaveTemplate(false)
  }

  const handleTemplateClick = async (value: string) => {
    const isAlreadySelected = selectedTemplates.includes(value)

    if (isAlreadySelected) {
      setSelectedTemplates([])
      const apiParamsWithFlag = apiParameters.map((p) => ({ ...p, isExisting: true }))
      const manualParams = parameters.filter((p) => p.isManuallyAdded)
      const allParams = [...apiParamsWithFlag, ...manualParams]
      setParameters(allParams)
      setSelectedAssessments(allParams)
    } else {
      setLoadingParams(true)

      try {
        const res = await getParametersBasedOnTemplates({ assessment_template_id: value })

        const fetchedParams: AssessmentFormItem[] =
          res?.data?.assessment_category?.flatMap(
            (category: TemplateAssessmentCategory) =>
              category.assessment_types?.map((type: TemplateAssessmentTypes) => ({
                id: String(type.assessment_type_id),
                label: type.assessments_type_label,
                isExisting: false
              })) || []
          ) || []

        const newParams = fetchedParams.map((p) => ({
          ...p,
          isExisting: apiParameters.some((api) => api.id === p.id)
        }))

        const apiParamsWithFlag = apiParameters.map((p) => ({ ...p, isExisting: true }))

        const manualParams = parameters.filter((p) => p.isManuallyAdded)

        const allParams: AssessmentFormItem[] = [...apiParamsWithFlag, ...manualParams, ...newParams]
        const unique = allParams.filter(
          (param, index: number, self: AssessmentFormItem[]) =>
            index === self.findIndex((p) => p.id === param.id)
        )

        setParameters(unique)
        setSelectedAssessments(unique)

        setSelectedTemplates([value])
      } catch (err) {
        console.error('Error fetching template parameters:', err)
      } finally {
        setLoadingParams(false)
      }
    }
  }

  const handleAddParameters = (params: AssessmentFormItem[]) => {
    const newManualParams: AssessmentFormItem[] = params.map((p) => ({
      ...p,
      id: String(p.id),
      isExisting: false,
      isManuallyAdded: true
    }))

    setParameters((prev) => {
      const existingApiParams = prev.filter((p) => apiParameters.some((api) => api.id === p.id))
      const nonApiParams = prev.filter((p) => !apiParameters.some((api) => api.id === p.id))

      const apiParamsWithFlag = existingApiParams.map((p) => ({ ...p, isExisting: true }))

      const allParams = [...apiParamsWithFlag, ...nonApiParams, ...newManualParams]
      const unique = allParams.filter(
        (param, index: number, self: AssessmentFormItem[]) =>
          index === self.findIndex((p) => p.id === param.id)
      )

      return unique
    })
    setSelectedAssessments((prev: AssessmentFormItem[]) => {
      const combined: AssessmentFormItem[] = [...prev, ...params]
      const unique = combined.filter(
        (param, index: number, self: AssessmentFormItem[]) =>
          index === self.findIndex((p) => p.id === param.id)
      )

      return unique
    })
  }

  const handleRemoveParameter = (id: string) => {
    setParameters((prev: AssessmentFormItem[]) => prev.filter((item) => item.id !== id))
    setSelectedAssessments((prev: AssessmentFormItem[]) => prev.filter((item) => item.id !== id))
  }

  const handleSaveTemplate = async () => {
    setSaveLoading(true)
    try {
      const payload: SaveTemplatePayload = {
        template_name: templateName,
        hospital_id: selectedHospital?.id,
        description: 'this is for test'
      }

      parameters.forEach((param, index: number) => {
        payload[`type_ids[${index}]`] = param.id
      })

      await saveHospitalTemplate(payload).then((res) => {
        if (res?.status === true) {
          setSaveLoading(false)
          Toaster({ type: 'success', message: res?.message })
          refetchTemplates()
          setSaveTemplate(false)
        } else {
          setSaveLoading(false)
          Toaster({ type: 'error', message: res?.message })
        }
      })
      setSaveLoading(false)
    } catch (error) {
      console.error('Cannot Save Template', error)
      setSaveLoading(false)
    }
  }

  const onApplyClick = async () => {
    if (todayOnly === null) {
      setTodayOnlyError(true)

      return
    }

    setApplyLoading(true)
    setTodayOnlyError(false)

    try {
      const newParams = parameters.filter((param) => !param.isExisting)

      const payload: AddMonitoringParameterPayload = {
        hospital_case_id: String(hospitalCaseId),
        parameter_date: selectedDate ?? '',
        today_only: String(todayOnly ?? '')
      }

      newParams.forEach((param, index: number) => {
        payload[`assessment_ids[${index}]`] = param.id
      })

      await applyParamsToHospitalCaseId(payload).then((res) => {
        if (res?.status === true) {
          Toaster({ type: 'success', message: res?.message })
          handleDrawerClose()
          setApplyLoading(false)
          refetchMonitoringData()
          refetchMonitoringParams()
        } else {
          setApplyLoading(false)
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.error('Cannot Apply Parameters to given case id', error)
      setApplyLoading(false)
    }
  }

  const hasNewParameters = parameters.some((p) => !p.isExisting)

  const visibleTemplates = showAllTemplates ? templateList : templateList?.slice(0, 5)

  return (
    <>
      <Drawer
        anchor='right'
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '562px'],
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        open={open}
        onClose={handleDrawerClose}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: '1.2rem',
              py: '1rem',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <img src='/icons/Activity.svg' alt='Cluster Icon' width='32px' />
              <Typography
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {t('hospital_module.add_parameters')}
              </Typography>
            </Box>

            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ px: 6, pt: 6, pb: 3 }}>
              <Button
                onClick={() => setOpenSelectParamDrawer(true)}
                disabled={monitoringLoading}
                sx={{
                  width: '100%',
                  backgroundColor: theme.palette.customColors.SecondaryContainer,
                  color: theme.palette.customColors.OnSecondaryContainer,
                  fontSize: '20px',
                  fontWeight: 500,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: theme.palette.customColors.SecondaryContainer },
                  '&:disabled': { opacity: 0.5 }
                }}
                startIcon={<Icon icon='mdi:plus' fontSize={30} />}
              >
                {t('hospital_module.add_parameter')}
              </Button>
            </Box>
            {(loadingParams || monitoringLoading) && (
              <Box display='flex' justifyContent='center' alignItems='center' py={2}>
                <CircularProgress size={28} />
              </Box>
            )}
            {parameters?.length > 0 ? (
              <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Typography
                  sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('selected')} ({parameters?.filter((p) => !p.isExisting)?.length})
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: 4,
                    backgroundColor: theme.palette.customColors.Background,
                    borderRadius: 1
                  }}
                >
                  {[...new Map(parameters.map((p: AssessmentFormItem) => [p.id, p])).values()].map((item: AssessmentFormItem) => (
                    <Box
                      key={item?.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 4,
                        backgroundColor: theme.palette.customColors.OnPrimary,
                        border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                        borderRadius: 1
                      }}
                    >
                      <Typography
                        sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        {item?.label}
                      </Typography>
                      <IconButton
                        onClick={() => handleRemoveParameter(item.id)}
                        disabled={item?.isExisting}
                        sx={{
                          opacity: item?.isExisting ? 0.5 : 1,
                          cursor: item?.isExisting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Icon icon={'zondicons:close-outline'} color={theme.palette.customColors.Error} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                {saveTemplate === true ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <TextField
                      placeholder={(t('hospital_module.enter_template_name') as string)}
                      sx={{
                        '& .MuiInputBase-root': {
                          backgroundColor: theme.palette.customColors.Surface
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                          }
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '1rem',
                          fontWeight: 400
                        }
                      }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                    />
                    <Button
                      variant='contained'
                      sx={{ height: '48px' }}
                      startIcon={<Icon icon={'material-symbols:save-outline-rounded'} />}
                      onClick={handleSaveTemplate}
                      disabled={templateName.trim() === '' || saveLoading}
                    >
                      {saveLoading ? <CircularProgress size={24} /> : t('save').toUpperCase()}
                    </Button>
                    <Button
                      sx={{
                        textTransform: 'none',
                        color: theme.palette.customColors.Error,
                        fontSize: '1rem',
                        fontWeight: 600
                      }}
                      startIcon={<Icon icon={'bitcoin-icons:cross-outline'} />}
                      onClick={() => {
                        setTemplateName('')
                        setSaveTemplate(false)
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '2.5px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSaveTemplate(true)}
                    >
                      <Icon
                        icon={'material-symbols:save-outline-rounded'}
                        color={theme.palette.customColors.OnSurface}
                      />
                      <Typography
                        sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.customColors.OnSurface }}
                      >
                        {t('hospital_module.save_as_template')}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: hasNewParameters ? theme.palette.customColors.Error : theme.palette.text.disabled,
                        cursor: hasNewParameters ? 'pointer' : 'not-allowed',
                        opacity: hasNewParameters ? 1 : 0.5
                      }}
                      onClick={() => {
                        setParameters((prev: AssessmentFormItem[]) => prev.filter((item: AssessmentFormItem) => item?.isExisting === true))
                        setSelectedAssessments((prev: AssessmentFormItem[]) => prev.filter((item: AssessmentFormItem) => item?.isExisting === true))

                        setSelectedTemplates([])
                      }}
                    >
                      {t('hospital_module.clear_all')}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : null}
            {templateList?.length > 0 ? (
              <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '1.25rem', fontWeight: 500 }}
                >
                  {t('hospital_module.your_template')}
                </Typography>
                {templateLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      py: 2
                    }}
                  >
                    {Array.from(new Array(6)).map((_, index) => (
                      <Box key={index} sx={{ width: '45%' }}>
                        <Skeleton
                          variant='rectangular'
                          height={50}
                          animation='wave'
                          sx={{
                            borderRadius: 1,
                            bgcolor: theme.palette.action.hover
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {visibleTemplates?.map((template: TemplateOption, index: number) => {
                        const isSelected = selectedTemplates.includes(template.value)

                        return (
                          <Box
                            key={index}
                            onClick={() => handleTemplateClick(template.value)}
                            sx={{
                              p: 4,
                              backgroundColor: isSelected
                                ? theme.palette.customColors.OnBackground
                                : theme.palette.customColors.OnPrimary,
                              border: isSelected
                                ? `1px solid ${theme.palette.customColors.SurfaceVariant}`
                                : `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                              borderRadius: 1,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '1rem',
                              fontWeight: 400,
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            {template.label}
                          </Box>
                        )
                      })}
                    </Box>
                    {templateList?.length > 5 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Typography
                          sx={{
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            color: theme.palette.primary.main,
                            cursor: 'pointer'
                          }}
                          onClick={() => setShowAllTemplates((prev: boolean) => !prev)}
                        >
                          {showAllTemplates ? t('hospital_module.show_less') : t('hospital_module.show_all')}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            ) : null}
          </Box>
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <FormControl
              required
              component='fieldset'
              variant='standard'
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.1
              }}
            >
              <FormLabel
                component='legend'
                sx={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {t('hospital_module.select_parameter_frequency')}
              </FormLabel>

              <RadioGroup
                row
                value={todayOnly !== null ? String(todayOnly) : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTodayOnly(Number(e.target.value))
                  setTodayOnlyError(false)
                }}
              >
                <FormControlLabel
                  value='1'
                  control={<Radio />}
                  label={(t('hospital_module.only_for_today') as string)}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.95rem',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }
                  }}
                />
                <FormControlLabel
                  value='0'
                  control={<Radio />}
                  label={(t('hospital_module.set_for_all_days') as string)}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.95rem',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }
                  }}
                />
              </RadioGroup>

              {todayOnlyError && (
                <FormHelperText
                  sx={{
                    color: theme.palette.error.main,
                    fontSize: '0.85rem',
                    marginLeft: 0.5
                  }}
                >
                  {t('hospital_module.please_select_one_option')}
                </FormHelperText>
              )}
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant='outlined'
                fullWidth
                onClick={handleDrawerClose}
                sx={{
                  borderColor: theme.palette.customColors.OnPrimaryContainer,
                  color: theme.palette.customColors.OnPrimaryContainer,
                  height: '56px'
                }}
              >
                {t('cancel')}
              </Button>
              <Button variant='contained' fullWidth onClick={onApplyClick} sx={{ height: '56px' }}>
               {applyLoading ? <CircularProgress size={24} /> : t('apply')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
      {openSelectParamDrawer && (
        <SelectParameterDrawer
          open={openSelectParamDrawer}
          setOpen={setOpenSelectParamDrawer}
          selectedAssessments={selectedAssessments}
          setSelectedAssessments={setSelectedAssessments}
          onAddSelected={(params: AssessmentFormItem[]) => handleAddParameters(params)}
        />
      )}
    </>
  )
}

export default AddParameterDrawer
