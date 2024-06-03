import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import React, { useRef } from 'react'
import { DatePicker, LoadingButton } from '@mui/lab'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  FormControl,
  FormControlLabel,
  FormHelperText,
  LinearProgress,
  Radio,
  RadioGroup,
  Snackbar,
  Typography,
  debounce
} from '@mui/material'
import { getAnimalList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useTheme } from '@mui/material/styles'
import { getUnitsForIngredient } from 'src/lib/api/diet/getFeedDetails'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { DateField } from '@mui/x-date-pickers'

const AddIncubators = ({ isEdit, sidebarOpen, handleSidebarClose }) => {
  const [defaultUom, setDefaultUom] = useState(null)
  const [uomList, setUom] = useState([])

  const defaultValues = {
    nursery: '',
    room: '',
    maxNumberOfEggs: ''
  }

  const schema = yup.object().shape({
    nursery: yup.string().required('Nursery is Required'),
    room: yup.string().required('Room is Required'),
    maxNumberOfEggs: yup.string().required('Max Number Of Eggs is Required')
  })

  const getUnitsList = async () => {
    try {
      const params = {
        type: ['length', 'weight'],
        page_no: 1,
        limit: 50
      }
      await getUnitsForIngredient({ params: params }).then(res => {
        setUom(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getUnitsList()
  }, [])

  const {
    reset,
    control,
    setValue,
    setError,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = val => {
    console.log('Form data', val)
  }
  const onError = errors => {
    console.log('Form errros', errors)
  }

  const RenderSidebarFooter = () => {
    return (
      <LoadingButton fullWidth size='large' type='submit' variant='contained'>
        ADD INCUBATOR
      </LoadingButton>
    )
  }
  return (
    <Drawer
      anchor='right'
      open={sidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '502px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <Box sx={{ position: 'fixed', top: 0, bgcolor: 'background.default', zIndex: 10, width: '502px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(4, 5)
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-notes-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'>{isEdit ? 'Edit' : 'Add'} Incubator</Typography>
            </Box>
            <IconButton
              size='small'
              onClick={() => {
                handleSidebarClose()
                reset()
              }}
              sx={{ color: 'text.primary' }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ marginBottom: 84, marginTop: 14, height: '95%', overflowY: 'auto', bgcolor: 'background.default' }}>
          <Box sx={{ m: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <FormControl fullWidth>
                    <Controller
                      name='nursery'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          value={defaultUom}
                          disablePortal
                          id='nursery'
                          options={uomList?.length > 0 ? uomList : []}
                          getOptionLabel={option => option.name}
                          isOptionEqualToValue={(option, value) => option?._id === value?._id}
                          onChange={(e, val) => {
                            if (val === null) {
                              setDefaultUom(null)

                              return onChange('')
                            } else {
                              setDefaultUom(val)

                              return onChange(val._id)
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Select Nursery'
                              placeholder='Search & Select'
                              error={Boolean(errors.nursery)}
                            />
                          )}
                        />
                      )}
                    />
                    {errors?.nursery && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.nursery?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='room'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          value={defaultUom}
                          disablePortal
                          id='room'
                          options={uomList?.length > 0 ? uomList : []}
                          getOptionLabel={option => option.name}
                          isOptionEqualToValue={(option, value) => option?._id === value?._id}
                          onChange={(e, val) => {
                            if (val === null) {
                              setDefaultUom(null)

                              return onChange('')
                            } else {
                              setDefaultUom(val)

                              return onChange(val._id)
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Select Room'
                              placeholder='Search & Select'
                              error={Boolean(errors.room)}
                            />
                          )}
                        />
                      )}
                    />
                    {errors?.room && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.room?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='maxNumberOfEggs'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Max Number Of Eggs'
                          value={value}
                          type='number'
                          inputProps={{ min: 1 }}
                          onChange={onChange}
                          placeholder='Max Number Of Eggs'
                          error={Boolean(errors.maxNumberOfEggs)}
                          name='maxNumberOfEggs'
                        />
                      )}
                    />
                    {errors.maxNumberOfEggs && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.maxNumberOfEggs?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box
          sx={{
            height: '100px',
            width: '100%',
            maxWidth: '502px',
            position: 'fixed',
            bottom: 0,
            px: 4,
            zIndex: 199,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex'
          }}
        >
          <RenderSidebarFooter />
        </Box>
      </form>
    </Drawer>
  )
}

export default AddIncubators
