import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  CardContent,
  Grid,
  FormControl,
  Autocomplete,
  TextField,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

const defaultValues = {
  request_item: {
    label: '',
    value: '',
    control_substance: false
  },
  request_item_batch_no: '',
  request_item_qty: '',
  available_item_qty: '',
  expiry_date: ''
}

const schema = yup.object().shape({
  request_item: yup.object().shape({
    label: yup.string().required('Product Name is required'),
    value: yup.string().required('Product Name is required')
  }),
  request_item_batch_no: yup.string().required('Batch no is required'),
  request_item_qty: yup.string().required('Quantity is required'),
  available_item_qty: yup.string().required('Available Quantity is required'),
  expiry_date: yup.string().required('Expiry Date is required')
})

export const AddItemsForm = ({ searchMedicineData, productList, productLoading, onSubmitData }) => {
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })
  const [productBatches, setProductBatches] = useState([])

  console.log(productList)

  const onSubmit = params => {
    const { request_item_batch_no, request_item_qty, available_item_qty, expiry_date, request_item } = { ...params }
    onSubmitData({
      request_item_batch_no,
      request_item_qty,
      available_item_qty,
      expiry_date,
      request_item_medicine_id: request_item.value,
      product_name: request_item.label
    })
  }

  return (
    <>
      {/* <CardContent> */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Grid container spacing={5} xs={12}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='request_item'
                control={control}
                defaultValue={null}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    id='request_item'
                    options={productList}
                    getOptionLabel={option => option.label || ''}
                    value={field.value}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    onKeyUp={e => {
                      searchMedicineData(e.target.value)
                    }}
                    onChange={(e, value) => {
                      setValue('request_item', value)
                    }} // Set selected value
                    loading={productLoading}
                    noOptionsText='Type to search'
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Product Name*'
                        placeholder='Search'
                        error={Boolean(errors.request_item)}
                      />
                    )}
                  />
                )}
              />
              {errors?.request_item && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel error={Boolean(errors?.request_item_batch_no)} id='request_item_batch_no'>
                Select Batch No*
              </InputLabel>
              <Controller
                name='request_item_batch_no'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    name='request_item_batch_no'
                    value={value}
                    label='Select Batch No*'
                    onChange={onChange}
                    error={Boolean(errors?.request_item_batch_no)}
                    labelId='request_item_batch_no'
                  >
                    <MenuItem value='BA121'>BA121</MenuItem>
                  </Select>
                )}
              />
              {errors?.request_item_batch_no && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item_batch_no?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='request_item_qty'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Quantity*'
                    name='request_item_qty'
                    error={Boolean(errors.request_item_qty)}
                    onChange={onChange}
                  />
                )}
              >
                {errors.request_item_qty && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item_qty?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='available_item_qty'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Available Quantity*'
                    name='available_item_qty'
                    error={Boolean(errors.available_item_qty)}
                    onChange={onChange}
                    disabled
                  />
                )}
              >
                {errors.available_item_qty && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.available_item_qty?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='expiry_date'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Expiry Date*'
                    name='expiry_date'
                    error={Boolean(errors.expiry_date)}
                    onChange={onChange}
                    disabled
                  />
                )}
              >
                {errors.expiry_date && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.expiry_date?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
            <Button type='submit' variant='contained'>
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
      {/* </CardContent> */}
    </>
  )
}
