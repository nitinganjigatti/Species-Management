/* eslint-disable lines-around-comment */
// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Divider from '@mui/material/Divider'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import TableContainer from '@mui/material/TableContainer'
import TableCell from '@mui/material/TableCell'
import { Button, CardHeader } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import FormHelperText from '@mui/material/FormHelperText'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import { debounce } from 'lodash'
import CircularProgress from '@mui/material/CircularProgress'
import Router from 'next/router'

// ** React Imports
import { forwardRef, useState, useEffect } from 'react'

// ** Configs
import themeConfig from 'src/configs/themeConfig'
import AddRequestDialog from './AddRequestDialog'
import SingleDatePicker from '../../SingleDatePicker'
import { getStoreList } from 'src/lib/api/getStoreList'
import { getMedicineBySearch } from 'src/lib/api/getMedicineBySearch'

const MUITableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 0,
  padding: `${theme.spacing(1, 0)} !important`
}))

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Third Party Imports
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Label } from 'recharts'

const defaultValues = {
  medicine_name: '',
  user: '',
  batch_id: '',
  expiry_date: '',
  stock_qty: '',
  box_pattern: '',
  box_qty: '',
  qty: ''
}

const editParamsInitialState = {
  medicine_name: '',
  user: '',
  batch_id: '',
  expiry_date: '',
  stock_qty: '',
  box_pattern: '',
  box_qty: '',
  qty: ''
}

const storesData = {
  toStore: '',
  fromStore: '',
  date: '',
  user: ''
}

const schema = yup.object().shape({
  // medicine_name: yup.string().required(),
  dosage_form: yup.string().required(),
  qty: yup.string().required()
})

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddRequestForm = () => {
  // ** Hook
  const [stores, setStores] = useState(storesData)
  const [toStocks, setToStocks] = useState([])
  const [fromStocks, setFromStocks] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [options, setOptions] = useState([])
  const [show, setShow] = useState(false)
  const [value, setValue] = useState(null)

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const filterToStocks = id => {
    const optionsForSelectB = fromStocks.filter(option => option.id !== id)
    setToStocks(optionsForSelectB)
  }

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const getStoresLists = async () => {
    // setLoader(true)
    const response = await getStoreList()
    if (response?.length > 0) {
      console.log('list', response)

      setFromStocks(response)
    } else {
    }
  }

  useEffect(() => {
    getStoresLists()
  }, [])

  const {
    control: controlMultipleMedicine,
    handleSubmit: addMultipleMedicine,
    formState: { errors: errorMultipleMedicine }
  } = useForm({ resolver: yupResolver(schema), shouldUnregister: false, mode: 'onChange', reValidateMode: 'onChange' })
  const [formDataArray, setFormDataArray] = useState([])

  const onSubmit = data => {
    // event.preventDefault()
    console.log('errors', errors)
    console.log(data)
    setFormDataArray(prevArray => [...prevArray, data])
  }
  console.log('formDataArray', formDataArray)

  const debouncedFetchData = debounce(async query => {
    try {
      const response = await getMedicineBySearch(query)
      console.log('in debounce', response[0].name)
      setOptions(response)

      return response
    } catch (error) {
      console.error(error)

      return []
    }
  }, 300)

  // useEffect(() => {
  // }, [])

  const createForm = () => {
    return (
      <CardContent>
        <form onSubmit={addMultipleMedicine(onSubmit)}>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='medicine_name'
                  control={controlMultipleMedicine}
                  render={({ field: { onChange } }) => (
                    <Autocomplete
                      sx={{ width: '100%' }}
                      name='medicine_name'
                      options={options.length > 0 ? options : []}
                      // eslint-disable-next-line lines-around-comment
                      // onInputChange
                      onInputChange={(e, newInputValue) => {
                        console.log('in onchnage', newInputValue)
                        onChange(newInputValue)
                        debouncedFetchData(newInputValue, data => {
                          console.log('datasss', data)

                          setOptions(data)
                        })
                      }}
                      id='autocomplete-controlled'
                      renderInput={params => <TextField {...params} label='Medicine Name' />}
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='dosage_form'
                  control={controlMultipleMedicine}
                  rules={{ required: 'Dosage form is required' }}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TextField
                      value={value}
                      label='Dosage form'
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder=''
                      error={Boolean(errorMultipleMedicine?.dosage_form)}
                    />
                  )}
                />
                {errorMultipleMedicine?.dosage_form && (
                  <FormHelperText sx={{ color: 'error.main' }}>
                    {errorMultipleMedicine?.dosage_form.message}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='qty'
                  control={controlMultipleMedicine}
                  rules={{ required: 'Quantity is required' }}
                  render={({ field: { onChange, value } }) => (
                    <TextField
                      value={value}
                      label='Quantity'
                      onChange={onChange}
                      placeholder=''
                      error={Boolean(errorMultipleMedicine?.qty)}
                    />
                  )}
                />
                {errorMultipleMedicine?.qty && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errorMultipleMedicine?.qty.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button size='large' type='submit' variant='contained'>
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    )
  }

  return (
    <Card>
      <Grid
        container
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <CardHeader title='Add Request Item' />
        <Grid sm={4} xs={12}>
          <Button
            onClick={() => {
              showDialog()
            }}
            size='big'
            variant='contained'
            sx={{ mx: 2 }}
          >
            Add Request Item
          </Button>
          <Button
            size='big'
            variant='contained'
            onClick={() => {
              Router.push('/pharmacy/request/requestList/')
            }}
          >
            Request Item List
          </Button>
        </Grid>
      </Grid>
      <CardContent>
        <Grid container>
          <AddRequestDialog
            title={'Add Request Item'}
            dialogBoxStatus={show}
            formComponent={createForm()}
            close={closeDialog}
            show={showDialog}
          />
        </Grid>
      </CardContent>
      <CardContent>
        <form>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                  From Stock:
                </Typography>
              </Grid>
              <Grid xs={12} sm={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors?.state_id)} id='state_id'>
                    Store
                  </InputLabel>
                  <Controller
                    name='state_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='state_id'
                        value={stores.fromStore}
                        label='Select'
                        // onChange={onChange}
                        onChange={e => {
                          // onChange()
                          filterToStocks(e.target.value)
                          setStores({ ...stores, fromStore: e.target.value })
                        }}
                        error={Boolean(errors?.state_id)}
                        labelId='state_id'
                      >
                        {fromStocks?.map((item, index) => (
                          <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                            {item?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors?.state_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.state_id?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <SingleDatePicker
                    fullWidth
                    width={'100%'}
                    // eslint-disable-next-line lines-around-comment
                    // name={'expiry_date'}
                    name={'Date'}
                    // eslint-disable-next-line lines-around-comment
                    // date={supplierDetails.startDate}

                    onChangeHandler={date => {
                      console.log(date)
                    }}

                    // customInput={<CustomInput label='Date' />}
                  />
                </FormControl>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                  <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                    To Stock:
                  </Typography>
                </Grid>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors?.state_id)} id='state_id'>
                    Store
                  </InputLabel>
                  <Controller
                    name='state_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='state_id'
                        value={stores.toStore}
                        label='Select'
                        // onChange={onChange}
                        onChange={e => {
                          // onChange()
                          setStores({ ...stores, toStore: e.target.value })

                          // filterFromStocks(e.target.value)
                        }}
                        error={Boolean(errors?.state_id)}
                        labelId='state_id'
                      >
                        {toStocks?.map((item, index) => (
                          <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                            {item?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors?.state_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.state_id?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={12}>
                <FormControl fullWidth>
                  <Controller
                    name='user'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextField
                        value={value}
                        label='User'
                        onChange={onChange}
                        placeholder=''
                        error={Boolean(errors?.user)}
                        onBlur={onBlur}
                        name='user'
                      />
                    )}
                  />
                  {errors.user && (
                    <FormHelperText sx={{ color: 'error.main' }}> {errors?.user?.message} </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Grid>{' '}
        </form>
      </CardContent>
      <Divider
        sx={{ mt: theme => `${theme.spacing(6.5)} !important`, mb: theme => `${theme.spacing(5.5)} !important` }}
      />
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
            <TableRow>
              <TableCell>Medicine Names</TableCell>
              <TableCell>Dosage form</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formDataArray
              ? formDataArray.map((el, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{el.dosage_form}</TableCell>
                      <TableCell>{el.qty}</TableCell>
                      <TableCell>{el.medicine_name}</TableCell>
                      <TableCell>
                        <IconButton size='small' sx={{ mr: 0.5 }} aria-label='Edit'>
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>
                        <IconButton size='small' sx={{ mr: 0.5 }}>
                          <Icon icon='mdi:delete-outline' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </TableContainer>
      <CardContent sx={{ pt: 8 }}>
        <Grid container>
          <Grid item xs={12} sm={5} lg={3} sx={{ mb: { sm: 0, xs: 4 }, order: { sm: 2, xs: 1 }, marginLeft: 'auto' }}>
            <CalcWrapper>
              <Typography variant='body2'>Total QTY:</Typography>
              <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                18
              </Typography>
            </CalcWrapper>

            <Divider
              sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
            />
            <CalcWrapper>
              <Typography variant='body2'>Total:</Typography>
              <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                18
              </Typography>
            </CalcWrapper>
          </Grid>
        </Grid>
      </CardContent>
      <Divider sx={{ mt: theme => `${theme.spacing(4.5)} !important`, mb: '0 !important' }} />
    </Card>
  )
}

export default AddRequestForm
