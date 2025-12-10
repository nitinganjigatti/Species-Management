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
import NoDataFound from 'src/views/utility/NoDataFound'
import dayjs from 'dayjs'

const AddParameterDrawer = ({
  open,
  setOpen,
  hospitalCaseId,
  refetchMonitoringData,
  selectedDate,
  refetchMonitoringParams
}) => {
  const theme = useTheme()
  const { selectedHospital } = useHospital()
  const isPastDate = dayjs(selectedDate).isBefore(dayjs(), 'day')

  const [selectedTemplates, setSelectedTemplates] = useState([])
  const [openSelectParamDrawer, setOpenSelectParamDrawer] = useState(false)
  const [selectedAssessments, setSelectedAssessments] = useState([])
  const [parameters, setParameters] = useState([])
  const [saveTemplate, setSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [loadingParams, setLoadingParams] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [monitoringLoading, setMonitoringLoading] = useState(false)
  const [todayOnly, setTodayOnly] = useState(null)
  const [todayOnlyError, setTodayOnlyError] = useState(false)

  useEffect(() => {
    const fetchMonitoringParameters = async () => {
      setMonitoringLoading(true)
      try {
        await getMonitoringParameters(hospitalCaseId, { monitoring_date: selectedDate }).then(res => {
          if (res?.status === true) {
            const apiParams =
              res?.data?.assessments?.map(item => ({
                id: String(item?.assessment_type_id),
                label: item?.label,
                isExisting: true
              })) || []
            setParameters(prev => {
              const combined = [...prev, ...apiParams]

              return combined.filter((param, index, self) => index === self.findIndex(p => p.id === param.id))
            })
            setSelectedAssessments(prev => {
              const combined = [...prev, ...apiParams]

              return combined.filter((param, index, self) => index === self.findIndex(p => p.id === param.id))
            })
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
  } = useQuery({
    queryKey: ['hospital-parameters-templates'],
    queryFn: () => getHospitalParamsTemplatesList({ ref_type: 'hospital', hospital_id: selectedHospital?.id })
  })

  const templateList = templateData?.data?.result?.map(
    item =>
      ({
        label: item?.template_name,
        value: item?.assessment_template_id
      } || [])
  )

  const handleDrawerClose = () => {
    setOpen(false)
    setTemplateName('')
    setSaveTemplate(false)
  }

  const handleTemplateClick = async value => {
    const isAlreadySelected = selectedTemplates.includes(value)

    if (isAlreadySelected) {
      setSelectedTemplates(prev => prev.filter(item => item !== value))

      const paramsToRemove = await getParametersBasedOnTemplates({ assessment_template_id: value })

      const paramIdsToRemove =
        paramsToRemove?.data?.assessment_category?.flatMap(
          category => category.assessment_types?.map(type => type.assessment_type_id) || []
        ) || []

      setParameters(prev => prev.filter(p => !paramIdsToRemove.includes(p.id)))
      setSelectedAssessments(prev => prev.filter(p => !paramIdsToRemove.includes(p.id)))
    } else {
      setSelectedTemplates(prev => [...prev, value])
      setLoadingParams(true)

      try {
        const res = await getParametersBasedOnTemplates({ assessment_template_id: value })

        const fetchedParams =
          res?.data?.assessment_category?.flatMap(
            category =>
              category.assessment_types?.map(type => ({
                id: String(type.assessment_type_id),
                label: type.assessments_type_label,
                isExisting: false
              })) || []
          ) || []

        setParameters(prev => {
          const all = [...prev, ...fetchedParams]

          return all.filter((param, index, self) => index === self.findIndex(p => p.id === param.id))
        })
        setSelectedAssessments(prev => {
          const all = [...prev, ...fetchedParams]

          return all.filter((param, index, self) => index === self.findIndex(p => p.id === param.id))
        })
      } catch (err) {
        console.error('Error fetching template parameters:', err)
      } finally {
        setLoadingParams(false)
      }
    }
  }

  const handleAddParameters = params => {
    setParameters(prev => {
      const combined = [...prev, ...params.map(p => ({ ...p, id: String(p.id), isExisting: false }))]
      const unique = combined.filter((param, index, self) => index === self.findIndex(p => p.id === param.id))

      return unique
    })
    setSelectedAssessments(prev => {
      const combined = [...prev, ...params]
      const unique = combined.filter((param, index, self) => index === self.findIndex(p => p.id === param.id))

      return unique
    })
  }

  const handleRemoveParameter = id => {
    setParameters(prev => prev.filter(item => item.id !== id))
    setSelectedAssessments(prev => prev.filter(item => item.id !== id))
  }

  const handleSaveTemplate = async () => {
    setSaveLoading(true)
    try {
      const payload = {
        template_name: templateName,
        hospital_id: selectedHospital?.id,
        description: 'this is for test'
      }

      parameters.forEach((param, index) => {
        payload[`type_ids[${index}]`] = param.id
      })

      await saveHospitalTemplate(payload).then(res => {
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
    if (isPastDate && todayOnly === null) {
      setTodayOnlyError(true)

      return
    }

    setApplyLoading(true)
    setTodayOnlyError(false)

    try {
      const newParams = parameters.filter(param => !param.isExisting)

      const payload = {
        hospital_case_id: hospitalCaseId,
        parameter_date: selectedDate,
        today_only: todayOnly
      }

      newParams.forEach((param, index) => {
        payload[`assessment_ids[${index}]`] = param.id
      })

      await applyParamsToHospitalCaseId(payload).then(res => {
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

  return (
    <>
      <Drawer
        anchor='right'
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '562px'],
            height: '100vh',
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
                sx={{
                  width: '100%',
                  backgroundColor: theme.palette.customColors.SecondaryContainer,
                  color: theme.palette.customColors.OnSecondaryContainer,
                  fontSize: '20px',
                  fontWeight: 500,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: theme.palette.customColors.SecondaryContainer }
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
                  Selected ({parameters?.length})
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
                  {[...new Map(parameters.map(p => [p.id, p])).values()].map(item => (
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
                      placeholder='Enter Template Name'
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
                      onChange={e => setTemplateName(e.target.value)}
                    />
                    <Button
                      variant='contained'
                      sx={{ height: '48px' }}
                      startIcon={<Icon icon={'material-symbols:save-outline-rounded'} />}
                      onClick={handleSaveTemplate}
                      disabled={templateName.trim() === '' || saveLoading}
                    >
                      {saveLoading ? <CircularProgress size={24} /> : 'SAVE'}
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
                      Cancel
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
                        Save as template
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: theme.palette.customColors.Error,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setParameters(prev => prev.filter(item => item?.isExisting === true))
                        setSelectedAssessments(prev => prev.filter(item => item?.isExisting === true))

                        setSelectedTemplates([])
                      }}
                    >
                      Clear all
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : null}
            <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '1.25rem', fontWeight: 500 }}
              >
                Your Template
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
              ) : templateList?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {templateList?.map((template, index) => {
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
              ) : (
                <NoDataFound />
              )}
            </Box>
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
            {isPastDate && (
              <FormControl
                required
                component='fieldset'
                variant='standard'
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
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
                  Select parameter schedule
                </FormLabel>

                <RadioGroup
                  row
                  value={todayOnly !== null ? String(todayOnly) : ''}
                  onChange={e => {
                    setTodayOnly(Number(e.target.value))
                    setTodayOnlyError(false)
                  }}
                >
                  <FormControlLabel
                    value='1'
                    control={<Radio />}
                    label='Set for today'
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
                    label='Set for future days'
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
                    Please select one option.
                  </FormHelperText>
                )}
              </FormControl>
            )}

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
          onAddSelected={params => handleAddParameters(params)}
        />
      )}
    </>
  )
}

export default AddParameterDrawer
