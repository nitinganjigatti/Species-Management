import React, { useEffect, useState, useRef } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
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
  Button,
  Typography,
  FormGroup,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  debounce
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/system'

const defaultValues = {
  product_type: '',
  product_name: '',
  generic_name: '',
  product_image: '',
  quantity: '1',
  priority: 'Normal',
  salts: [
    {
      label: '',
      salt_id: '',
      salt_qty: ''
    }
  ],
  status: 'Pending'
}

const schema = yup.object().shape({
  product_type: yup.string().required('select product type'),
  product_name: yup.string().required('product name is required'),
  generic_name: yup.string().required('generic name is required'),
  quantity: yup.number().required('Quantity is required').moreThan(0, 'Quantity must be greater than 0')
  // salt_id: yup.string().when('salt_qty', {
  //   is: salt_qty => salt_qty && salt_qty.trim() !== '', // Check if saltQty is not empty
  //   then: yup.string().required('Salt name is required when salt quantity is provided'),
  //   otherwise: yup.string() // No additional validation when saltQty is empty
  // })
  // salt_qty: yup.number().typeError('Salt quantity must be a number').nullable()
})

export const AddRequestLineItemsForm = ({
  handleCallback,
  setShow,
  editValues,
  editIndex,
  dataChildValues,
  setDataChildValues,
  handleUpdate
}) => {
  const [imgSrc, setImgSrc] = useState('')
  const [saltsList, setSalts] = useState([])
  const [defaultSalts, setDefaultSalts] = useState([])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'salts'
  })

  const onSubmit = data => {
    console.log('data Values??', data)
    const saltValues = data.salts
    const filterSaltValues = saltValues?.map(item => ({
      salt_id: item.salt_id,
      salt_qty: item.salt_qty
    }))

    data.salts = JSON.stringify(filterSaltValues)
    data.status = editValues ? editValues.status : 'Pending'

    handleCallback(data)
    setShow(false)
  }

  useEffect(() => {
    reset({
      product_type: editValues.product_type,
      product_name: editValues.product_name,
      generic_name: editValues.generic_name,
      priority: editValues.priority,
      quantity: editValues.quantity,
      product_image: editValues.product_image,
      salts: editValues?.salts ? JSON.parse(editValues?.salts) : null
    })
  }, [editValues])

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result)
      console.log('file', files)
      setValue('product_image', files[0])
      reader.readAsDataURL(files[0])
      if (reader.result !== null) {
        setInputValue(reader.result)
      }
    }
  }

  const removeSaltButton = index => {
    return (
      <Box>
        <Icon
          onClick={() => {
            var tempDefaultSalts = defaultSalts
            tempDefaultSalts.splice(index, 1)
            setDefaultSalts(tempDefaultSalts)
            remove(index)
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const clearSaltFields = index => {
    return (
      <Box>
        <Icon
          onClick={() => {
            var tempDefaultSalts = defaultSalts
            tempDefaultSalts[index] = undefined
            setDefaultSalts(tempDefaultSalts)
            remove(index)
            insert(index, {})
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const addSaltButton = () => {
    return (
      <Button
        variant='outlined'
        onClick={() => {
          setSalts([])
          append({
            salt_qty: '',
            slat_id: ''
          })
        }}
        sx={{ marginRight: '4px', borderRadius: 6 }}
      >
        Add Another
      </Button>
    )
  }

  const handleAddRemoveSalts = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addSaltButton()}
          {removeSaltButton(index)}
        </>
      )
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return (
        <>
          {addSaltButton()}
          {clearSaltFields(index)}
        </>
      )
    } else if (index <= 0 && fields.length > 0) {
      return <>{clearSaltFields(index)}</>
    } else {
      return <>{removeSaltButton(index)}</>
    }
  }

  const handleAddGalleryClick = () => {
    fileInputRef.current.click()
  }
  const removeselectedImage = index => {
    setImgSrc('')
  }

  const fileInputRef = useRef(null)
  return (
    <>
      {/* <CardContent> */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Grid container spacing={5} xs={12}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Product Type</InputLabel>
              <Controller
                name='product_type'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    name='product_type'
                    value={value}
                    label='Select Product Type'
                    onChange={onChange}
                    error={Boolean(errors?.product_type)}
                  >
                    <MenuItem value='allopathy'>Allopathy</MenuItem>
                    <MenuItem value='ayurveda'>Ayurveda</MenuItem>
                    <MenuItem value='unani'>Unani</MenuItem>
                    <MenuItem value='non_medical'>Non Medical</MenuItem>
                  </Select>
                )}
              />
              {errors?.product_type && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.product_type?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='product_name'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Product Name'
                    name='product_name'
                    error={Boolean(errors.product_name)}
                    onChange={onChange}
                    placeholder='Product Name'
                  />
                )}
              />
              {errors?.product_name && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.product_name.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='generic_name'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Generic Name'
                    name='generic_name'
                    error={Boolean(errors.generic_name)}
                    onChange={onChange}
                    placeholder='Generic Name'
                  />
                )}
              />
              {errors?.generic_name && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.generic_name.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='quantity'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Quantity'
                    name='comment'
                    type='number'
                    // error={Boolean(errors.medicine_name)}
                    onChange={onChange}
                    placeholder='quantity'
                  />
                )}
              />
              {errors?.quantity && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.quantity?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
              <FormLabel>Priority</FormLabel>
              <Controller
                name='priority'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup row {...field} aria-label='gender' name='validation-basic-radio'>
                    <FormControlLabel
                      value='High'
                      label='High'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                    <FormControlLabel
                      value='Normal'
                      label='Normal'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                  </RadioGroup>
                )}
              />
              {errors.radio && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-radio'>
                  This field is required
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <input
              type='file'
              accept='image/*'
              onChange={handleInputImageChange}
              style={{ display: 'none' }}
              name='product_image'
              ref={fileInputRef}
            />
            {!imgSrc && (
              <Button
                sx={{ width: '50px', height: '50px', borderRadius: '10px' }}
                fullWidth
                type='button'
                variant='contained'
                onClick={handleAddGalleryClick}
              >
                Add Image
              </Button>
            )}

            {imgSrc && (
              <Box sx={{ display: 'flex', flexDirection: 'row', borderRadius: '10px' }}>
                <Box>
                  <img width={60} height={60} src={imgSrc} />
                </Box>
                <Box>
                  <Icon icon='material-symbols-light:close' onClick={() => removeselectedImage()}>
                    {' '}
                  </Icon>
                </Box>
              </Box>
            )}

            {/* </Box> */}
          </Grid>

          {/* salt composition */}

          <Grid item xs={12} sm={12}>
            <FormGroup>
              <Grid container item xs={12} sm={12} alignItems='center' spacing={2}>
                <Grid item xs={6}>
                  <span style={{ marginRight: '10px' }}>Salt Composition</span>
                </Grid>
              </Grid>
              {fields.map((field, index) => (
                <Grid container spacing={5} key={field.id} style={{ marginTop: '0px' }}>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <Controller
                        name={`salts[${index}].salt_id`}
                        control={control}
                        rules={{ required: false }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            label='Salt Name'
                            onChange={onChange}
                            placeholder='Salt Name'
                            error={Boolean(errors?.salts?.[index]?.salt_id)}
                            name={`salts[${index}].salt_id`}
                          />
                        )}
                      />

                      {/* {errors?.salts?.[index]?.salt_id && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors?.salts?.[index]?.salt_id?.message}
                        </FormHelperText>
                      )} */}
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <Controller
                        name={`salts[${index}].salt_qty`}
                        control={control}
                        rules={{ required: false }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            label='Strength'
                            onChange={onChange}
                            placeholder='Strength'
                            error={Boolean(errors?.salts?.[index]?.salt_qty)}
                            name={`salts[${index}].salt_qty`}
                          />
                        )}
                      />
                      {/* {errors?.salts?.[index]?.salt_qty && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors?.salts?.[index]?.salt_qty?.message}
                        </FormHelperText>
                      )} */}
                    </FormControl>
                  </Grid>

                  <Grid
                    item
                    xs={4}
                    // eslint-disable-next-line lines-around-comment
                    // justifyContent='flex-end'

                    alignSelf='center'
                    sx={{
                      display: 'flex',
                      justifyItems: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {handleAddRemoveSalts(fields, index)}
                  </Grid>
                </Grid>
              ))}
            </FormGroup>
          </Grid>

          <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
            {!editValues ? (
              <Button type='submit' variant='contained'>
                Save
              </Button>
            ) : (
              <Button
                type='submit'
                variant='contained'
                // onClick={() => {
                //   handleUpdate(editValues, editIndex)
                // }}
              >
                Update
              </Button>
            )}
          </Grid>
        </Grid>
      </form>
      {/* </CardContent> */}
    </>
  )
}
