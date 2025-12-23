import {
  Box,
  Button,
  Card,
  CircularProgress,
  Drawer,
  Grid,
  IconButton,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  useTheme
} from '@mui/material'
import dayjs from 'dayjs'
import React, { useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useForm } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import EditParamsHistory from './EditParamsHistory'
import { useQuery } from '@tanstack/react-query'
import {
  addAssessmentToParams,
  getHospitalAssessmentHistory,
  getHospitalParametersUnitListing
} from 'src/lib/api/hospital/treatmentMonitoring'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import moment from 'moment'
import NoDataFound from 'src/views/utility/NoDataFound'

const parseIntervalToTimeRange = interval => {
  if (!interval) return null

  let [time, meridiem] = interval.split(' ')
  let hour = parseInt(time.split(':')[0]) || parseInt(time)
  if (meridiem?.toLowerCase() === 'pm' && hour !== 12) hour += 12
  if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0

  const start = dayjs().hour(hour).minute(0).second(0)
  const end = start.add(59, 'minute')

  return { start, end }
}

const defaultValues = {
  observation_time: dayjs(),
  observation_value: '',
  value_unit: null,
  note: ''
}

const getSchema = (resType, measurementType) =>
  yup.object().shape({
    observation_value: ['numeric_value', 'numeric_scale', 'text', 'list'].includes(resType)
      ? yup.string().required('Observation Value is required')
      : yup.mixed().notRequired(),
    observation_time: yup.string().required('Observation time is required'),
    value_unit:
      resType === 'numeric_value' && measurementType.trim() !== ''
        ? yup.string().required('Unit is required')
        : yup.mixed().notRequired()
  })

const AddParameterDataEntry = ({
  open,
  setOpen,
  data,
  medicalRecordId,
  hospitalCaseId,
  animalId,
  refetchMonitoringData,
  selectedDate,
  isPatientDischarged
}) => {
  const theme = useTheme()

  const [addLoading, setAddLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [openEditHistoryDrawer, setOpenEditHistoryDrawer] = useState(false)
  const [editHistoryData, setEditHistoryData] = useState(null)

  const { data: parameterUnit, isLoading: unitLoading } = useQuery({
    queryKey: ['hospital-parameters-units-listing', data?.parameter?.assessment_type_id, open],
    queryFn: () => getHospitalParametersUnitListing(data?.parameter?.assessment_type_id),
    enabled: !!data?.parameter?.assessment_type_id
  })

  const { resType, unitsData, measurementType } = useMemo(() => {
    const responseType = parameterUnit?.data?.[0]?.response_type
    const measurementType = parameterUnit?.data?.[0]?.measurement_type
    let formattedUnits = []

    if (responseType === 'numeric_value' && measurementType !== '') {
      formattedUnits =
        parameterUnit?.data?.[0]?.measurement_units_dropdown?.map(item => ({
          label: item?.uom_abbr,
          value: item?.id,
          name: item?.unit_name
        })) || []
    } else if (responseType === 'numeric_scale' || responseType === 'list') {
      formattedUnits =
        parameterUnit?.data?.[0]?.dropdown_values?.map(item => ({
          label: item?.label,
          value: item?.id
        })) || []
    }

    return { resType: responseType, unitsData: formattedUnits, measurementType }
  }, [parameterUnit])

  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['hospital-assessment-history', data?.parameter?.assessment_type_id, data?.date, hospitalCaseId],
    queryFn: () =>
      getHospitalAssessmentHistory({
        date: data?.date,
        hospital_case_id: hospitalCaseId,
        assessment_type_id: data?.parameter?.assessment_type_id
      }),
    enabled: open && activeTab === 1 && !!data?.parameter?.assessment_type_id,
    keepPreviousData: true,
    staleTime: 0,
    refetchOnWindowFocus: false
  })

  useEffect(() => {
    if (open && isPatientDischarged) {
      setActiveTab(1)
      refetchHistory()
    }
  }, [open, isPatientDischarged])

  const historyList = historyData?.data || []

  const formatInterval = interval => {
    if (!interval) return ''
    if (interval.includes(':')) return interval
    const [hour, ampm] = interval.split(' ')

    return `${hour}:00 ${ampm}`
  }

  const handleTabChange = (event, newValue) => {
    if (isPatientDischarged) {
      setActiveTab(1)
      refetchHistory()

      return
    }
    setActiveTab(newValue)
    if (newValue === 1) refetchHistory()
  }

  const handleDrawerClose = () => {
    setOpen(false)
    refetchMonitoringData()
  }

  const onSubmit = async params => {
    setAddLoading(true)

    try {
      const payload = {
        assessment_type_id: data?.parameter?.assessment_type_id,
        assessment_value: params?.observation_value,
        assessment_unit_id: params?.value_unit,
        comments: params?.note,
        medical_record_id: medicalRecordId,
        hospital_case_id: hospitalCaseId,
        recorded_date_time:
          moment(selectedDate).format('YYYY-MM-DD') + ' ' + moment(params?.observation_time).format('HH:mm:ss')
      }

      await addAssessmentToParams(animalId, payload).then(res => {
        if (res?.success === true) {
          setAddLoading(false)
          Toaster({ type: 'success', message: res?.message })
          handleDrawerClose()

          // refetchMonitoringData()
        } else {
          setAddLoading(false)
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.error('Cannot Add Value to parameter', error)
      setAddLoading(false)
    }
  }

  const schema = useMemo(() => getSchema(resType, measurementType), [resType, measurementType])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (open && data?.interval) {
      const { start } = parseIntervalToTimeRange(data?.interval)
      reset({
        ...defaultValues,
        observation_time: start // set to start of interval (e.g., 9:00 AM)
      })
    }
  }, [open, data?.interval])

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
            backgroundColor: theme.palette.customColors.Background,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: '1.5rem',
              pt: '1.5rem',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {data?.parameter.label}
              </Typography>

              <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
                <Icon icon='mdi:close' fontSize={30} />
              </IconButton>
            </Box>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='fullWidth'
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '15px',
                  color: theme.palette.text.secondary
                },
                '& .Mui-selected': {
                  color: theme.palette.success.main
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.success.main,
                  height: '2px'
                }
              }}
            >
              {!isPatientDischarged && <Tab label='ADD NEW ENTRY' />}
              <Tab label='VIEW PREVIOUS ENTRY' />
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 6 }}>
            {!isPatientDischarged && activeTab === 0 && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.palette.customColors.OnPrimary,
                    borderRadius: 1
                  }}
                >
                  {unitLoading ? (
                    <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Skeleton variant='rectangular' height={60} sx={{ borderRadius: 2 }} />
                      <Skeleton variant='rectangular' height={100} sx={{ borderRadius: 2 }} />
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Skeleton variant='rectangular' height={56} width='60%' sx={{ borderRadius: 2 }} />
                        <Skeleton variant='rectangular' height={56} width='35%' sx={{ borderRadius: 2 }} />
                      </Box>
                      <Skeleton variant='rectangular' height={80} sx={{ borderRadius: 2 }} />
                    </Box>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: `0.5px solid ${theme.palette.customColors.Outline}`,
                          px: 6,
                          pt: 6,
                          pb: 4
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '1.25rem',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          Selected time slot
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon icon={'ci:clock'} size={20} />
                          <Typography
                            sx={{
                              fontSize: '1.25rem',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {formatInterval(data?.interval)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 5,
                          px: 6,
                          pt: 6,
                          pb: 4,
                          borderBottom: `0.5px solid ${theme.palette.customColors.Outline}`
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            Observation Time
                          </Typography>
                          <ControlledTimePicker
                            control={control}
                            name={'observation_time'}
                            label='Time'
                            minTime={parseIntervalToTimeRange(data?.interval)?.start || null}
                            maxTime={parseIntervalToTimeRange(data?.interval)?.end || null}
                          />
                        </Box>

                        {/* Observation Fields */}
                        <Grid container rowSpacing={4} columnSpacing={3}>
                          <Grid size={{ xs: 12 }}>
                            <Typography
                              sx={{
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              Enter Observation
                            </Typography>
                          </Grid>

                          {resType === 'numeric_value' && measurementType.trim() === '' && (
                            <Grid size={{ xs: 12 }}>
                              <ControlledTextField
                                control={control}
                                name='observation_value'
                                label='Enter Value'
                                type='number'
                                errors={errors}
                                required
                                inputBackgroundColor={theme.palette.customColors.Surface}
                                sx={{ borderRadius: 1 }}
                              />
                            </Grid>
                          )}

                          {resType === 'numeric_value' && measurementType.trim() !== '' && (
                            <>
                              <Grid size={{ xs: 12, sm: 8 }}>
                                <ControlledTextField
                                  control={control}
                                  name='observation_value'
                                  label='Enter Value'
                                  errors={errors}
                                  type='number'
                                  required
                                  inputBackgroundColor={theme.palette.customColors.Surface}
                                  sx={{ borderRadius: 1 }}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 4 }}>
                                <ControlledSelect
                                  control={control}
                                  errors={errors}
                                  label='Select Unit'
                                  name='value_unit'
                                  options={unitsData}
                                  getOptionLabel={option => option.label}
                                  getOptionValue={option => option.value}
                                  required
                                  sx={{
                                    backgroundColor: theme.palette.customColors.Surface,
                                    borderRadius: 1
                                  }}
                                />
                              </Grid>
                            </>
                          )}

                          {(resType === 'numeric_scale' || resType === 'list') && (
                            <Grid size={{ xs: 12 }}>
                              <ControlledSelect
                                control={control}
                                errors={errors}
                                label='Select Value'
                                name='observation_value'
                                options={unitsData}
                                getOptionLabel={option => option.label}
                                getOptionValue={option => option.value}
                                required
                                sx={{
                                  backgroundColor: theme.palette.customColors.Surface,
                                  borderRadius: 1
                                }}
                              />
                            </Grid>
                          )}

                          {resType === 'text' && (
                            <Grid size={{ xs: 12 }}>
                              <ControlledTextField
                                control={control}
                                name='observation_value'
                                label='Enter Text'
                                errors={errors}
                                required
                                inputBackgroundColor={theme.palette.customColors.Surface}
                                sx={{ borderRadius: 1 }}
                              />
                            </Grid>
                          )}
                        </Grid>
                      </Box>

                      <Box>
                        <ControlledTextField
                          control={control}
                          name={'note'}
                          placeholder='Notes(Optional)'
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { border: 'none' },
                              '&:hover fieldset': { border: 'none' },
                              '&.Mui-focused fieldset': { border: 'none' }
                            },
                            '& .MuiInputBase-input': {
                              backgroundColor: 'transparent'
                            },
                            padding: '0 12px 8px 12px'
                          }}
                        />
                      </Box>
                    </form>
                  )}
                </Box>
              </>
            )}

            {(isPatientDischarged || activeTab === 1) && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.palette.customColors.OnPrimary,
                    borderRadius: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: `0.5px solid ${theme.palette.customColors.Outline}`,
                      px: 6,
                      pt: 6,
                      pb: 4
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Selected time slot
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon icon={'ci:clock'} size={20} />
                      <Typography
                        sx={{
                          fontSize: '1.25rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {formatInterval(data?.interval)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ py: 6, px: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {historyLoading || historyFetching ? (
                      Array.from(new Array(3)).map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Skeleton variant='text' width={60} height={24} sx={{ flexShrink: 0 }} />
                          <Box
                            sx={{
                              flexGrow: 1,
                              p: 4,
                              borderRadius: 1,
                              backgroundColor: theme.palette.customColors.displaybgPrimary,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3
                            }}
                          >
                            <Skeleton variant='text' width='40%' height={24} />
                            <Skeleton variant='text' width='60%' height={20} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                              <Skeleton variant='circular' width={32} height={32} />
                              <Skeleton variant='text' width='30%' height={20} />
                            </Box>
                          </Box>
                        </Box>
                      ))
                    ) : historyList?.length > 0 ? (
                      historyList?.map(item => (
                        <Box key={item?.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography
                            sx={{
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              fontWeight: 600,
                              fontSize: '14px',
                              color: theme.palette.customColors.OnSurfaceVariant,
                              minWidth: '75px',
                              textAlign: 'left'
                            }}
                          >
                            {Utility.convertUTCToLocaltime(item?.recorded_date_time)}
                          </Typography>

                          <Box
                            sx={{
                              flexGrow: 1,
                              p: 4,
                              borderRadius: 1,
                              backgroundColor: theme.palette.customColors.displaybgPrimary,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                {(resType === 'numeric_scale' || 'list') && (
                                  <Typography
                                    sx={{
                                      fontSize: '1rem',
                                      fontWeight: 600,
                                      color: theme.palette.customColors.OnSurfaceVariant
                                    }}
                                  >
                                    {item?.list_label}
                                  </Typography>
                                )}
                                {resType === 'numeric_value' && (
                                  <Typography
                                    sx={{
                                      fontSize: '1rem',
                                      fontWeight: 600,
                                      color: theme.palette.customColors.OnSurfaceVariant
                                    }}
                                  >{`${item?.assessment_value} ${item?.given_unit_name}`}</Typography>
                                )}
                                {resType === 'text' && (
                                  <Typography
                                    sx={{
                                      fontSize: '1rem',
                                      fontWeight: 600,
                                      color: theme.palette.customColors.OnSurfaceVariant
                                    }}
                                  >{`${item?.assessment_value}`}</Typography>
                                )}
                                {item?.comments && item?.comments.trim().length > 0 && (
                                  <Typography
                                    sx={{
                                      fontSize: '14px',
                                      fontWeight: 400,
                                      color: theme.palette.customColors.OnSurfaceVariant
                                    }}
                                  >
                                    {item?.comments}
                                  </Typography>
                                )}
                              </Box>
                              {!isPatientDischarged && (
                                <IconButton
                                  onClick={() => {
                                    setEditHistoryData({
                                      ...item,
                                      unitsData
                                    })
                                    setOpenEditHistoryDrawer(true)
                                  }}
                                >
                                  <Icon icon={'material-symbols:edit-outline-rounded'} />
                                </IconButton>
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <UserAvatarDetails
                                user_name={`${item?.user_first_name} ${item?.user_last_name}`}
                                date={item?.created_at}
                                show_time
                                profile_image={item?.user_profile_full_url}
                              />
                              {item?.modified_by !== null ? (
                                <Typography
                                  sx={{
                                    fontSize: '12px',
                                    fontWeight: 400,
                                    color: theme.palette.customColors.neutralSecondary
                                  }}
                                >
                                  Edited
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <NoDataFound />
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Box>
          {!isPatientDischarged && activeTab === 0 && (
            <Box
              sx={{
                p: 4,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'background.paper',
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
              }}
            >
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
              <Button
                onClick={handleSubmit(onSubmit)}
                variant='contained'
                fullWidth
                sx={{ height: '56px', backgroundColor: theme.palette.customColors.OnPrimaryContainer }}
              >
                {addLoading ? <CircularProgress size={24} /> : 'ADD'}
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
      {openEditHistoryDrawer && (
        <EditParamsHistory
          open={openEditHistoryDrawer}
          setOpen={setOpenEditHistoryDrawer}
          data={editHistoryData}
          refetch={refetchHistory}
          resType={resType}
          measurementType={measurementType}
          unitsData={unitsData}
        />
      )}
    </>
  )
}

export default AddParameterDataEntry
