// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import { Divider, CardContent, FormHelperText } from '@mui/material'
import { useRouter } from 'next/router'
import Router from 'next/router'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller } from 'react-hook-form'

import CustomFileUploaderSingle from 'src/views/forms/form-elements/file-uploader/CustomFileUploaderSingle'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const defaultValues = {
  recipe_name: '',
  portion_size: '',
  portion_uom_id: '',
  portion_uom_name: '',
  nutrional_value: '',
  nutrional_uom_id: '',
  kcal: ''
}

const schema = yup.object().shape({
  recipe_name: yup.string().required('Recipe name is required')

  //portion_size: yup.string().required('Portion size is required')
  // portion_uom_id: yup.string().required('Unit of measurement is required'),
  // nutrional_value: yup.string().required('Nutritional values are required'),
  // nutrional_uom_id: yup.string().required('Unit of measurement is required'),
  // kcal: yup.string().required('Total calories are required')
})

const StepBasicDetails = ({ handleNext, formData, uomList }) => {
  // ** States
  const [uploadedImage, setUploadedImage] = useState(null)
  const router = useRouter()

  const {
    reset,
    control,
    handleSubmit,
    clearErrors,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    mode: 'all',
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const cal = watch('nutrional_value')

  const handleImageUpload = imageData => {
    setUploadedImage(imageData)
  }

  useEffect(() => {
    if (formData) {
      setUploadedImage(formData.recipe_image)
    }
  }, [formData])

  useEffect(() => {
    if (formData) {
      reset(formData)
    }
  }, [formData, reset])

  const ScrollToFieldError = ({ errors }) => {
    console.log(errors, 'errors')
    useEffect(() => {
      if (!errors) return
      console.log(Object.keys(errors)[0], 'check')
      const firstErrorField = Object.keys(errors)[0]
      const errorElement = document.querySelector(`input[name="${firstErrorField}"]`)
      console.log(errorElement, 'errorElement')
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, [errors])

    return null
  }

  const onSubmit = async data => {
    window.scrollTo(0, 0)

    // Clear any existing errors
    Object.keys(defaultValues).forEach(field => {
      clearErrors(field)
    })

    try {
      await schema.validate(data, { abortEarly: false })
      const imageData = await handleImageUpload()
      console.log(imageData, 'imageData')

      // Merge the image data with other form data
      const formDataWithImage = {
        ...data,
        recipe_image: uploadedImage
      }
      handleNext(formDataWithImage)
      console.log(formDataWithImage, 'data')
    } catch (validationErrors) {
      validationErrors.inner.forEach(error => {
        setError(error.path, { message: error.message })
      })
    }
  }

  const cancelBack = () => {
    Router.push('/diet/recipe/')
  }

  console.log(formData, 'formdata')

  return (
    <>
      <Box sx={{ mb: 1, px: 5, mt: 5, float: 'left' }}>
        <Typography variant='h6'>Recipe details</Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <ScrollToFieldError errors={errors} />
        <Grid container spacing={5} sx={{ px: 5 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='recipe_name'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Recipe name *'
                    name='recipe_name'
                    error={Boolean(errors.recipe_name)}
                    onChange={onChange}
                  />
                )}
              />

              {errors.recipe_name && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.recipe_name?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid container spacing={6} sx={{ px: 5, py: 5 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <Controller
                  name='portion_size'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      type='number'
                      label='Portion size'
                      name='portion_size'
                      error={Boolean(errors.portion_size)}
                      onChange={onChange}
                      placeholder=''
                      onInput={e => {
                        if (e.target.value < 0) {
                          e.target.value = ''
                        }
                      }}
                    />
                  )}
                />
                {errors.portion_size && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.portion_size?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3.17}>
              <FormControl fullWidth>
                {/* <InputLabel id='uom'> Select unit of measurement (UOM)</InputLabel> */}
                {console.log(uomList, 'uomList')}
                <Controller
                  name='portion_uom_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      value={uomList.find(option => option._id === value) || null}
                      disablePortal
                      id='portion_uom_id'
                      options={uomList || []}
                      getOptionLabel={option => option.name}
                      isOptionEqualToValue={(option, value) => option?._id === value?._id}
                      onChange={(e, val) => {
                        if (val === null) {
                          onChange('')
                          setValue('portion_uom_name', '')
                        } else {
                          onChange(val._id)
                          setValue('portion_uom_name', val.name)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Select unit of measurement (UOM)'
                          placeholder='Search & Select'
                          error={Boolean(errors.portion_uom_id)}
                        />
                      )}
                    />
                  )}
                />

                {errors?.portion_uom_id && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.portion_uom_id?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 4, mx: 3, pb: 1, mt: 2, width: '98%', ml: 5 }} />

          <Box sx={{ mb: 1, px: 5, mt: 3, float: 'left' }}>
            <Typography variant='h6'>Calories</Typography>
          </Box>
          <Grid container spacing={6} sx={{ px: 5, py: 5 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <Controller
                  name='nutrional_value'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      type='number'
                      label='Enter nutritional values per'
                      name='nutrional_value'
                      error={Boolean(errors.nutrional_value)}
                      onChange={onChange}
                      placeholder=''
                      onInput={e => {
                        if (e.target.value < 0) {
                          e.target.value = ''
                        }
                      }}
                    />
                  )}
                />
                {errors.nutrional_value && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.nutrional_value?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3.2}>
              <FormControl fullWidth>
                {/* <InputLabel id='uom'> Select unit of measurement (UOM)</InputLabel> */}
                {console.log(uomList, 'uomList')}
                <Controller
                  name='nutrional_uom_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      value={uomList.find(option => option._id === value) || null}
                      disablePortal
                      id='nutrional_uom_id'
                      options={uomList || []}
                      getOptionLabel={option => option.name}
                      isOptionEqualToValue={(option, value) => option?._id === value?._id}
                      onChange={(e, val) => {
                        if (val === null) {
                          return onChange('')
                        } else {
                          return onChange(val._id)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Unit of measurement (UOM)'
                          placeholder='Search & Select'
                          error={Boolean(errors.nutrional_uom_id)}
                        />
                      )}
                    />
                  )}
                />

                {errors?.nutrional_uom_id && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.nutrional_uom_id?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <Controller
                  name='kcal'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      type='number'
                      label={`Total calories for ${cal ? cal : '100'} gms`}
                      name='kcal'
                      error={Boolean(errors.kcal)}
                      onChange={onChange}
                      placeholder=''
                      onInput={e => {
                        if (e.target.value < 0) {
                          e.target.value = ''
                        }
                      }}
                    />
                  )}
                />
                {errors.kcal && <FormHelperText sx={{ color: 'error.main' }}>{errors?.kcal?.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2, mx: 3, pb: 1, mt: 2, width: '98%', ml: 5 }} />

          <Box sx={{ mb: 0, px: 5, mt: 3, float: 'left', width: '100%' }}>
            <Typography variant='h6'>Add image</Typography>
          </Box>
          {console.log(uploadedImage, 'uploadedImage')}
          <Grid item xs={6} sx={{ pt: 0 }}>
            <CardContent sx={{ px: 0, paddingTop: 2 }}>
              <CustomFileUploaderSingle onImageUpload={handleImageUpload} uploadedImagenew={uploadedImage} />
            </CardContent>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
              <Button
                color='secondary'
                variant='outlined'
                // startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
                onClick={cancelBack}
              >
                Cancel
              </Button>
              <Button type='submit' variant='contained' endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
                Next
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </>
  )
}

export default StepBasicDetails
