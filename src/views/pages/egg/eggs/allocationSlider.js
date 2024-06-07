import { LoadingButton } from '@mui/lab'
import {
  Box,
  Card,
  Drawer,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'

const AllocationSlider = ({ setOpenDrawer }) => {
  const defaultValues = {
    current_state: '',
    condition: '',
    nursery_name: '',
    room: '',
    incubator: '',
    length: 0,
    width: 0,
    wight: 0
  }

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  return (
    <>
      <Drawer anchor='right' open={open} sx={{ '& .MuiDrawer-paper': { width: ['100%', 600] } }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2 }}>
            <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
          </Box>
          <Typography variant='h6' sx={{ mr: 70 }}>
            Send For Incubation
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
            </IconButton>
          </Box>
        </Box>

        {/* drower */}

        <Box className='sidebar-body' sx={{ backgroundColor: 'background.default', p: theme => theme.spacing(5, 6) }}>
          <form autoComplete='off'>
            <Card fullWidth>
              <FormControl sx={{ width: '95%', ml: 3, mt: 5 }}>
                <InputLabel error={Boolean(errors?.site_id)} id='current_state'>
                  Current State
                </InputLabel>
                <Controller
                  name='current_state'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      name='current_state'
                      value={value}
                      label='Current State'
                      onChange={onChange}
                      error={Boolean(errors?.current_state)}
                      labelId='current_state'
                    >
                      <MenuItem value='Intract'>Intract</MenuItem>
                    </Select>
                  )}
                />
                {errors && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                )}
              </FormControl>

              <FormControl sx={{ width: '95%', ml: 3, mt: 5, mb: 4 }}>
                <InputLabel error={Boolean(errors?.site_id)} id='site_id'>
                  Condition Egg
                </InputLabel>
                <Controller
                  name='condition'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      name='condition'
                      value={value}
                      label='Condition Egg'
                      onChange={onChange}
                      error={Boolean(errors?.current_state)}
                      labelId='condition'
                    >
                      <MenuItem value='Intract'>Intract</MenuItem>
                    </Select>
                  )}
                />
                {errors && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                )}
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center' }}></Box>
            </Card>
            <Typography variant='h6' sx={{ mt: 5 }}>
              Incubator Selection
            </Typography>

            <Card fullWidth sx={{ mt: 3 }}>
              <form autoComplete='off'>
                <FormControl sx={{ width: '95%', ml: 3, mt: 4 }}>
                  <InputLabel error={Boolean(errors?.site_id)} id='site_id'>
                    Nursery Name
                  </InputLabel>
                  <Controller
                    name='nursery_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='nursery_name'
                        value={value}
                        label='Current State'
                        onChange={onChange}
                        error={Boolean(errors?.current_state)}
                        labelId='current_state'
                      >
                        <MenuItem value='Intract'>Intract</MenuItem>
                      </Select>
                    )}
                  />
                  {errors && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                  )}
                </FormControl>

                <FormControl sx={{ width: '95%', ml: 3, mt: 6, mb: 4 }}>
                  <InputLabel error={Boolean(errors?.site_id)} id='room'>
                    Select Room
                  </InputLabel>
                  <Controller
                    name='room'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='room'
                        value={value}
                        label='Room'
                        onChange={onChange}
                        error={Boolean(errors?.current_state)}
                        labelId='room'
                      >
                        <MenuItem value='Intract'>Intract</MenuItem>
                      </Select>
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.room?.message}</FormHelperText>}
                </FormControl>

                <FormControl sx={{ width: '95%', ml: 3, mt: 2, mb: 4 }}>
                  <InputLabel error={Boolean(errors?.site_id)} id='site_id'>
                    Select Incubator
                  </InputLabel>
                  <Controller
                    name='incubator'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='incubator'
                        value={value}
                        label='Incubator'
                        onChange={onChange}
                        error={Boolean(errors?.incubator)}
                        labelId='incubator'
                      >
                        <MenuItem value='Intract'>Intract</MenuItem>
                      </Select>
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.incubator?.message}</FormHelperText>}
                </FormControl>

                <Box sx={{ display: 'flex', alignItems: 'center' }}></Box>
              </form>
            </Card>
            <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Grid>
                <Typography variant='h6' sx={{ mt: 5 }}>
                  Egg Measurements
                </Typography>
              </Grid>
              <Grid>
                <Typography sx={{ mt: 6 }}>Get Values</Typography>
              </Grid>
            </Grid>

            <Card fullWidth sx={{ mt: 3 }}>
              <Grid container>
                <Grid item xs={6}>
                  <FormControl sx={{ mt: 5, ml: 5, width: '80%' }}>
                    <InputLabel error={Boolean(errors?.site_id)} id='current_state_label'>
                      Size Length
                    </InputLabel>
                    <Controller
                      name='length'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='length'
                          value={value}
                          label='Size Length'
                          onChange={onChange}
                          error={Boolean(errors?.length)}
                          labelId='current_state_label'
                        >
                          <MenuItem value='Intract'>Intract</MenuItem>
                        </Select>
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  {/* Repeat this pattern for the remaining fields */}
                  <FormControl sx={{ mt: 5, ml: 3, width: '80%' }}>
                    <InputLabel error={Boolean(errors?.site_id)} id='condition_label'>
                      MM
                    </InputLabel>
                    <Controller
                      name=''
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          value={value}
                          label='MM'
                          onChange={onChange}
                          error={Boolean(errors?.condition)}
                          labelId='condition_label'
                        >
                          <MenuItem value='Intract'>Intract</MenuItem>
                        </Select>
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.condition?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl sx={{ mt: 5, ml: 5, width: '80%' }}>
                    <InputLabel error={Boolean(errors?.site_id)} id='current_state_label'>
                      Size Width
                    </InputLabel>
                    <Controller
                      name='width'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='width'
                          value={value}
                          label='Current State'
                          onChange={onChange}
                          error={Boolean(errors?.width)}
                          labelId='current_state_label'
                        >
                          <MenuItem value='Intract'>Intract</MenuItem>
                        </Select>
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  {/* Repeat this pattern for the remaining fields */}
                  <FormControl sx={{ mt: 5, ml: 3, width: '80%' }}>
                    <InputLabel error={Boolean(errors?.site_id)} id='condition_label'>
                      MM
                    </InputLabel>
                    <Controller
                      name=''
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          value={value}
                          label='MM'
                          onChange={onChange}
                          error={Boolean(errors?.condition)}
                          labelId='condition_label'
                        >
                          <MenuItem value='Intract'>Intract</MenuItem>
                        </Select>
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.condition?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl sx={{ mt: 5, ml: 5, width: '80%' }}>
                    <InputLabel error={Boolean(errors?.site_id)} id='current_state_label'>
                      Size Weight
                    </InputLabel>
                    <Controller
                      name='weight'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='weigth'
                          value={value}
                          label='Current State'
                          onChange={onChange}
                          error={Boolean(errors?.current_state)}
                          labelId='current_state_label'
                        >
                          <MenuItem value='Intract'>Intract</MenuItem>
                        </Select>
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl sx={{ mt: 5, ml: 3, width: '80%', mb: 2 }}>
                    <InputLabel error={Boolean(errors?.site_id)} id='condition_label'>
                      Grams
                    </InputLabel>
                    <Controller
                      name=''
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          value={value}
                          label='Condition Egg'
                          onChange={onChange}
                          error={Boolean(errors?.condition)}
                          labelId='condition_label'
                        >
                          <MenuItem value='Intract'>Intract</MenuItem>
                        </Select>
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.condition?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Card>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto', mt: 5 }}>
              <LoadingButton fullWidth variant='contained' sx={{ height: '50px' }}>
                Submit
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}
export default AllocationSlider
