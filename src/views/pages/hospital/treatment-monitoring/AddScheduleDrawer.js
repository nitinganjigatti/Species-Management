import { Box, Button, Checkbox, Drawer, FormControlLabel, Grid, IconButton, Typography, useTheme } from '@mui/material'
import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'

const scheduleIntervals = [
  { label: 'custom', value: 'Custom' },
  { label: 'Every 15 mins', value: '15' },
  { label: 'Every 30 mins', value: '30' },
  { label: 'Every 1 hour', value: '60' },
  { label: 'Every 2 hour', value: '120' },
  { label: 'Every 4 hour', value: '240' },
  { label: 'Every 6 hour', value: '360' },
  { label: 'Every 8 hour', value: '480' }
]

const AddScheduleDrawer = ({ open, setOpen, monitoring }) => {
  const theme = useTheme()

  const defaultValues = useMemo(() => {
    const values = {
      allInterval: '',
      setAsDefault: false
    }

    monitoring?.forEach(item => {
      values[item.id] = ''
    })

    return values
  }, [monitoring])

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues
  })

  useEffect(() => {
    if (open && monitoring) {
      reset(defaultValues)
    }
  }, [open, monitoring, defaultValues, reset])

  const allIntervalValue = watch('allInterval')

  const handleDrawerClose = () => {
    setOpen(false)
    reset(defaultValues)
  }

  const handleApplyToAll = () => {
    if (!allIntervalValue) {
      console.warn('Please select an interval first')

      return
    }

    monitoring?.forEach(item => {
      setValue(item.id, allIntervalValue)
    })
  }

  const onSubmit = async data => {
    console.log('Form submitted:', data)

    const scheduleData = {
      setAsDefault: data.setAsDefault,
      intervals: {}
    }
    monitoring?.forEach(item => {
      if (data[item.id]) {
        scheduleData.intervals[item.id] = data[item.id]
      }
    })

    console.log('Processed schedule data:', scheduleData)
    handleDrawerClose()
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
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 4 }}>
              <img src='/icons/scheduler.svg' alt='Cluster Icon' width='56px' />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Schedule Monitoring
                </Typography>
                <Typography
                  sx={{ fontSize: '1.rem', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}
                >
                  Set the frequency of monitoring for each parameter.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
                <Icon icon='mdi:close' fontSize={30} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ px: 5, py: 4 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Box
                  sx={{
                    py: 4,
                    px: 4,
                    borderRadius: 1,
                    background: theme.palette.customColors.displaybgPrimary,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                      sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}
                    >
                      Select an interval to apply to all parameters
                    </Typography>
                    <Icon
                      icon={'mdi:checkbox-multiple-outline'}
                      color={theme.palette.customColors.OnPrimaryContainer}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ControlledSelect
                      control={control}
                      label={'Select Interval'}
                      options={scheduleIntervals}
                      name={'allInterval'}
                      errors={errors}
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      sx={{ background: theme.palette.customColors.OnPrimary }}
                    />
                    <Button
                      variant='contained'
                      sx={{ minHeight: '56px', py: 2 }}
                      onClick={handleApplyToAll}
                      disabled={!allIntervalValue}
                      type='button'
                    >
                      Apply
                    </Button>
                  </Box>
                </Box>

                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: theme.palette.customColors.neutralSecondary,
                    textAlign: 'center',
                    my: 4
                  }}
                >
                  or
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {monitoring?.map((item, idx) => (
                    <Grid
                      key={idx}
                      container
                      spacing={0}
                      sx={{
                        p: 3,
                        background: theme.palette.customColors.displaybgPrimary,
                        borderRadius: 1,
                        alignItems: 'center'
                      }}
                    >
                      <Grid size={{ xs: 4 }}>
                        <Typography>{item?.name}</Typography>
                      </Grid>
                      <Grid size={{ xs: 8 }}>
                        <ControlledSelect
                          control={control}
                          errors={errors}
                          name={item?.id}
                          options={scheduleIntervals}
                          label={'Select Intervals'}
                          getOptionLabel={option => option.label}
                          getOptionValue={option => option.value}
                          sx={{ background: theme.palette.customColors.OnPrimary }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </form>
            </Box>
          </Box>

          <Box
            sx={{
              p: 4,
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
              label='Set as default for all upcoming days'
            />
            <Button variant='contained' fullWidth onClick={handleSubmit(onSubmit)}>
              Add Schedule
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default AddScheduleDrawer
