import {
  alpha,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material'
import dayjs from 'dayjs'
import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { addIntervalsForParameters } from 'src/lib/api/hospital/treatmentMonitoring'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'

const AddScheduleDrawer = ({
  open,
  setOpen,
  hospitalCaseId,
  refetchMonitoringData,
  intervalList,
  intervalLoading,
  monitoringParams,
  refetchMonitoringParams
}) => {
  const theme = useTheme()

  const [selectedInterval, setSelectedInterval] = useState('1')
  const [addScheduleLoading, setScheduleLoading] = useState(false)

  const monitoring = useMemo(() => {
    return (
      monitoringParams?.data?.assessments?.map(item => ({
        id: String(item?.assessment_type_id),
        label: item?.label,
        defaultInterval: item?.assessment_interval ? String(item.assessment_interval) : '1'
      })) || []
    )
  }, [monitoringParams])

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    // defaultValues
  })

  const watchedValues = watch()

  useEffect(() => {
    if (!monitoring?.length) return

    const intervals = monitoring.map(m => watchedValues[m.id]).filter(Boolean)

    if (!intervals.length) return

    const allSame = intervals.every(v => v === intervals[0])

    setSelectedInterval(allSame ? intervals[0] : null)
  }, [watchedValues, monitoring])

  useEffect(() => {
    if (!monitoring?.length) return

    const now = dayjs()

    const values = {
      setAsDefault: false,
      monitoring_start_date: now,
      monitoring_start_time: now
    }

    monitoring.forEach(param => {
      values[param.id] = param.defaultInterval || '1'
    })

    reset(values)
  }, [monitoring, reset])

  useEffect(() => {
    if (!monitoring?.length) return

    const intervals = monitoring.map(m => m.defaultInterval)
    const allSame = intervals.every(v => v === intervals[0])

    setSelectedInterval(allSame ? intervals[0] : null)
  }, [monitoring])

  const handleIntervalClick = id => {
    setSelectedInterval(id)
    monitoring?.forEach(param => setValue(param.id, id))
  }

  const handleDrawerClose = () => setOpen(false)

  const onSubmit = async data => {
    setScheduleLoading(true)
    try {
      const scheduleData = {
        is_schedule_for_today: data.setAsDefault === true ? '1' : '0',
        parameters: [],
        start_date: dayjs(data?.monitoring_start_date).format('YYYY-MM-DD'),
        start_time: dayjs(data?.monitoring_start_time).format('HH:mm'),
        hospital_case_id: hospitalCaseId
      }

      monitoring?.forEach(item => {
        if (data[item.id]) {
          scheduleData.parameters.push({
            parameter_id: String(item.id),
            parameter_value: String(data[item.id])
          })
        }
      })

      await addIntervalsForParameters(scheduleData).then(res => {
        if (res?.status === 'success') {
          Toaster({ type: 'success', message: res?.message })
          setScheduleLoading(false)
          handleDrawerClose()
          refetchMonitoringData()
          refetchMonitoringParams()
        } else {
          Toaster({ type: 'error', message: res?.message })
          setScheduleLoading(false)
        }
      })
    } catch (error) {
      console.error('Cannot Schedule Parameters', error)
      setScheduleLoading(false)
    }
  }

  return (
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
        className='sidebar-header'
        sx={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.palette.customColors.OnPrimary,
          px: '1.2rem',
          py: '1rem',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 4 }}>
          <img src='/icons/scheduler.svg' alt='Cluster Icon' width='56px' />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Schedule Monitoring
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}>
              Set the frequency of monitoring for each parameter.
            </Typography>
          </Box>
        </Box>

        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
          <Icon icon='mdi:close' fontSize={30} />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', px: 5, py: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
              Monitoring Start Date and Time
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 8 }}>
                <ControlledDatePicker
                  control={control}
                  minDate={dayjs()}
                  label='Start date'
                  name='monitoring_start_date'
                  required
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <ControlledTimePicker control={control} name='monitoring_start_time' required label='Start Time' />
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3, mb: 3 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              Select an interval to apply to all parameters
            </Typography>
            {intervalLoading ? (
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {intervalList?.map(item => (
                  <Box
                    key={item?.id}
                    onClick={() => handleIntervalClick(item.id)}
                    sx={{
                      px: 3,
                      py: 2,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      backgroundColor:
                        selectedInterval === item.id
                          ? theme.palette.customColors.OnPrimaryContainer
                          : theme.palette.customColors.mdAntzNeutral,
                      color:
                        selectedInterval === item.id
                          ? theme.palette.common.white
                          : theme.palette.customColors.OnPrimaryContainer,
                      fontWeight: 500,
                      fontSize: 14,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor:
                          selectedInterval === item.id
                            ? theme.palette.customColors.OnPrimaryContainer
                            : alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    {item.label}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, py: 3 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              Or enter individually
            </Typography>
            {intervalLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Array.from(new Array(monitoring?.length || 4)).map((_, idx) => (
                  <Skeleton
                    key={idx}
                    variant='rectangular'
                    height={60}
                    animation='wave'
                    sx={{
                      borderRadius: 1,
                      bgcolor: theme.palette.action.hover
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {monitoring?.map(item => (
                  <Grid
                    key={item?.id}
                    container
                    spacing={0}
                    sx={{
                      alignItems: 'center'
                    }}
                  >
                    <Grid size={{ xs: 4 }}>
                      <Typography>{item?.label}</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <ControlledSelect
                        control={control}
                        errors={errors}
                        name={item?.id}
                        options={intervalList}
                        label='Select Intervals'
                        getOptionLabel={option => option.label}
                        getOptionValue={option => option.id}
                        sx={{ background: theme.palette.customColors.OnPrimary }}
                      />
                    </Grid>
                  </Grid>
                ))}
              </Box>
            )}
          </Box>
        </form>
      </Box>
      <Box
        sx={{
          p: 4,
          position: 'sticky',
          bottom: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 2,
          boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
        }}
      >
        <FormControlLabel
          control={<Checkbox {...control.register('setAsDefault')} />}
          label='Set this schedule just for today'
        />
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
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
            variant='contained'
            fullWidth
            onClick={handleSubmit(onSubmit)}
            sx={{ height: '56px' }}
            disabled={addScheduleLoading}
          >
            {addScheduleLoading ? <CircularProgress size={30} /> : 'SAVE'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddScheduleDrawer
