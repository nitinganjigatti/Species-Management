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

interface AddParameterDrawerProps {
  open?: boolean
  setOpen?: any
  hospitalCaseId?: any
  refetchMonitoringData?: any
  selectedDate?: any
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
  const theme: any = useTheme()
  const { selectedHospital }: any = useHospital()

  const [selectedTemplates, setSelectedTemplates] = useState<any[]>([])
  const [openSelectParamDrawer, setOpenSelectParamDrawer] = useState<boolean>(false)
  const [selectedAssessments, setSelectedAssessments] = useState<any[]>([])
  const [parameters, setParameters] = useState<any[]>([])
  const [apiParameters, setApiParameters] = useState<any[]>([])
  const [saveTemplate, setSaveTemplate] = useState<boolean>(false)
  const [templateName, setTemplateName] = useState<string>('')
  const [loadingParams, setLoadingParams] = useState<boolean>(false)
  const [saveLoading, setSaveLoading] = useState<boolean>(false)
  const [applyLoading, setApplyLoading] = useState<boolean>(false)
  const [monitoringLoading, setMonitoringLoading] = useState<boolean>(false)
  const [todayOnly, setTodayOnly] = useState<any>(0)
  const [todayOnlyError, setTodayOnlyError] = useState<boolean>(false)
  const [showAllTemplates, setShowAllTemplates] = useState<boolean>(false)

  useEffect(() => {
    const fetchMonitoringParameters = async () => {
      setMonitoringLoading(true)
      try {
        await getMonitoringParameters(hospitalCaseId, { monitoring_date: selectedDate }).then((res: any) => {
          if (res?.status === true) {
            const apiParams: any[] =
              res?.data?.assessments?.map((item: any) => ({
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
  } = useQuery<any>({
    queryKey: ['hospital-parameters-templates'],
    queryFn: () => getHospitalParamsTemplatesList({ ref_type: 'hospital', hospital_id: selectedHospital?.id })
  })

  const templateList: any[] = templateData?.data?.result?.map((item: any) => ({
    label: item?.template_name,
    value: item?.assessment_template_id
  }))

  const handleDrawerClose = () => {
    setOpen(false)
    setTemplateName('')
    setSaveTemplate(false)
  }

  const handleTemplateClick = async (value: any) => {
    const isAlreadySelected = selectedTemplates.includes(value)

    if (isAlreadySelected) {
      setSelectedTemplates([])
      const apiParamsWithFlag = apiParameters.map((p: any) => ({ ...p, isExisting: true }))
      const manualParams = parameters.filter((p: any) => p.isManuallyAdded)
      const allParams = [...apiParamsWithFlag, ...manualParams]
      setParameters(allParams)
      setSelectedAssessments(allParams)
    } else {
      setLoadingParams(true)

      try {
        const res: any = await getParametersBasedOnTemplates({ assessment_template_id: value })

        const fetchedParams: any[] =
          res?.data?.assessment_category?.flatMap(
            (category: any) =>
              category.assessment_types?.map((type: any) => ({
                id: String(type.assessment_type_id),
                label: type.assessments_type_label,
                isExisting: false
              })) || []
          ) || []

        const newParams = fetchedParams.map((p: any) => ({
          ...p,
          isExisting: apiParameters.some((api: any) => api.id === p.id)
        }))

        const apiParamsWithFlag = apiParameters.map((p: any) => ({ ...p, isExisting: true }))

        const manualParams = parameters.filter((p: any) => p.isManuallyAdded)

        const allParams = [...apiParamsWithFlag, ...manualParams, ...newParams]
        const unique = allParams.filter((param: any, index: number, self: any[]) => index === self.findIndex((p: any) => p.id === param.id))

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

  const handleAddParameters = (params: any[]) => {
    const newManualParams = params.map((p: any) => ({
      ...p,
      id: String(p.id),
      isExisting: false,
      isManuallyAdded: true
    }))

    setParameters((prev: any[]) => {
      const existingApiParams = prev.filter((p: any) => apiParameters.some((api: any) => api.id === p.id))
      const nonApiParams = prev.filter((p: any) => !apiParameters.some((api: any) => api.id === p.id))

      const apiParamsWithFlag = existingApiParams.map((p: any) => ({ ...p, isExisting: true }))

      const allParams = [...apiParamsWithFlag, ...nonApiParams, ...newManualParams]
      const unique = allParams.filter((param: any, index: number, self: any[]) => index === self.findIndex((p: any) => p.id === param.id))

      return unique
    })
    setSelectedAssessments((prev: any[]) => {
      const combined = [...prev, ...params]
      const unique = combined.filter((param: any, index: number, self: any[]) => index === self.findIndex((p: any) => p.id === param.id))

      return unique
    })
  }

  const handleRemoveParameter = (id: any) => {
    setParameters((prev: any[]) => prev.filter((item: any) => item.id !== id))
    setSelectedAssessments((prev: any[]) => prev.filter((item: any) => item.id !== id))
  }

  const handleSaveTemplate = async () => {
    setSaveLoading(true)
    try {
      const payload: any = {
        template_name: templateName,
        hospital_id: selectedHospital?.id,
        description: 'this is for test'
      }

      parameters.forEach((param: any, index: number) => {
        payload[`type_ids[${index}]`] = param.id
      })

      await saveHospitalTemplate(payload).then((res: any) => {
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
      const newParams = parameters.filter((param: any) => !param.isExisting)

      const payload: any = {
        hospital_case_id: hospitalCaseId,
        parameter_date: selectedDate,
        today_only: todayOnly
      }

      newParams.forEach((param: any, index: number) => {
        payload[`assessment_ids[${index}]`] = param.id
      })

      await applyParamsToHospitalCaseId(payload).then((res: any) => {
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

  const hasNewParameters = parameters.some((p: any) => !p.isExisting)

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
                Add Parameters
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
                Add Parameter
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
                  Selected ({parameters?.filter((p: any) => !p.isExisting)?.length})
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
                  {[...new Map(parameters.map((p: any) => [p.id, p])).values()].map((item: any) => (
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
                        setParameters((prev: any[]) => prev.filter((item: any) => item?.isExisting === true))
                        setSelectedAssessments((prev: any[]) => prev.filter((item: any) => item?.isExisting === true))

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
                      {visibleTemplates?.map((template: any, index: number) => {
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
                Cancel
              </Button>
              <Button variant='contained' fullWidth onClick={onApplyClick} sx={{ height: '56px' }}>
                {applyLoading ? <CircularProgress size={24} /> : 'APPLY'}
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
          onAddSelected={(params: any[]) => handleAddParameters(params)}
        />
      )}
    </>
  )
}

export default AddParameterDrawer
