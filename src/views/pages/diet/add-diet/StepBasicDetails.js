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
import { Divider, CardContent, FormHelperText, Card, CardHeader, Avatar } from '@mui/material'
import { useRouter } from 'next/router'
import Router from 'next/router'
import { useForm, useFieldArray } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller } from 'react-hook-form'

import CustomFileUploaderSingle from 'src/views/forms/form-elements/file-uploader/CustomFileUploaderSingle'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'

const defaultValues = {
  recipe_name: '',
  portion_size: '',
  portion_uom_id: '',
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

  const recipes = [
    { label: 'No' },
    { label: 'Recipe' },
    { label: 'Ingredients' },
    { label: 'Feeding days' },
    { label: 'Remarks' }
  ]

  const ingredients = [
    { label: 'No' },
    { label: 'Ingredient' },
    { label: 'Prep types' },
    { label: 'Feeding days' },
    { label: 'Remarks' }
  ]

  const {
    reset,
    control,
    handleSubmit,
    clearErrors,
    formState: { errors }
  } = useForm({
    mode: 'all',
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const {
    fields: fieldsIngredients,
    append: appendIngredients,
    remove: removeIngredients
  } = useFieldArray({
    control,
    name: 'by_percentage'
  })

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

  const addIngredientsButton = () => {
    return (
      <>
        <Grid
          container
          justifyContent='center'
          alignItems='center'
          sx={{
            mt: 12,
            border: '3px dotted #37BD69',
            padding: '8px 16px',
            backgroundColor: '#37bd6912',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => {
            appendIngredients({
              ingredient_id: '',
              quantity: '',
              preparation_type_id: ''
            })
          }}
        >
          <Typography
            sx={{
              mb: 1,
              color: '#37BD69',
              cursor: 'pointer',
              fontWeight: 500,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center'
            }}
            variant='h6'
          >
            <Icon icon='material-symbols:add' style={{ marginRight: '8px' }} /> ADD NEW MEAL
          </Typography>
        </Grid>
      </>
    )
  }

  const removeIngredientButton = index => {
    console.log(index, 'index')

    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '35px' }}
        onClick={() => {
          removeIngredients(index)
        }}
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const handleAddRemoveingredient = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return <>{addIngredientsButton()}</>
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return <>{addIngredientsButton()}</>
    } else {
      return <>{removeIngredientButton(index)}</>
    }
  }

  console.log(errors, 'nknn')
  console.log(uploadedImage, 'uploadedImage')
  console.log(formData, 'formdata')

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ boxShadow: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Box sx={{ mb: 1, px: 5, mt: 5, float: 'left' }}>
            <Typography variant='h6'>Basic Information</Typography>
          </Box>
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
                      label='Diet name *'
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

            <Grid item xs={12} sm={6}>
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
                          return onChange('')
                        } else {
                          return onChange(val._id)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Diet Type *'
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

            {console.log(uploadedImage, 'uploadedImage')}
            <Grid item xs={6}>
              <CardContent sx={{ px: 0, paddingTop: 2 }}>
                <CustomFileUploaderSingle onImageUpload={handleImageUpload} uploadedImagenew={uploadedImage} />
              </CardContent>
            </Grid>

            <Grid item xs={12} sx={{ pt: 0, pb: 8 }}>
              <Controller
                name='desc'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    multiline
                    fullWidth
                    value={value}
                    label='Description (Optional) *'
                    name='desc'
                    error={Boolean(errors.desc)}
                    onChange={onChange}
                    id='textarea-outlined'
                    rows={5}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Card>

        {fieldsIngredients.map((field, index) => (
          <Card sx={{ mt: 7 }} key={field.id}>
            <CardHeader title={`Add Meal ${index + 1}`} />
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <Controller
                      name='nutrional_value'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          type='text'
                          label='Meal name (Optional) '
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
                          label='Total calories for 100 gms'
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
                    {errors.kcal && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.kcal?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                  <Typography variant='h6'>Recipes</Typography>
                </Box>

                <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                  <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                    {recipes.map((ingredient, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={
                          ingredient.label === 'No'
                            ? 0.5
                            : ingredient.label === 'Recipe'
                            ? 2.2
                            : ingredient.label === 'Ingredients'
                            ? 1.5
                            : 3.7
                        }
                        key={index}
                        sx={{ py: 4, px: 2, textAlign: 'center' }}
                      >
                        <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>{ingredient.label} </div>
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5 }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                  <Typography variant='h6'>Ingredients</Typography>
                </Box>

                <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                  <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                    {ingredients.map((ingredient, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={
                          ingredient.label === 'No'
                            ? 0.5
                            : ingredient.label === 'Ingredient'
                            ? 2.2
                            : ingredient.label === 'Prep types'
                            ? 1.5
                            : 3.7
                        }
                        key={index}
                        sx={{ py: 4, px: 2, textAlign: 'center' }}
                      >
                        <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>{ingredient.label} </div>
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5 }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Grid container spacing={5} sx={{ px: 5, pt: 10 }}>
                <Box sx={{ mb: 10, mt: 2, float: 'left' }}>
                  <Typography variant='h6'>Ingredients with choice</Typography>
                </Box>

                <Grid container spacing={5} sx={{ border: '1px solid #C3CEC7', borderRadius: '0.5rem', mx: 0 }}>
                  <Grid container spacing={5} sx={{ background: '#E8F4F2', mt: 0, borderRadius: 0.9, mx: 0 }}>
                    {ingredients.map((ingredient, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={
                          ingredient.label === 'No'
                            ? 0.5
                            : ingredient.label === 'Ingredient'
                            ? 2.2
                            : ingredient.label === 'Prep types'
                            ? 1.5
                            : 3.7
                        }
                        key={index}
                        sx={{ py: 4, px: 2, textAlign: 'center' }}
                      >
                        <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>{ingredient.label} </div>
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5, borderBottom: '1px solid #C3CEC7' }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>

                    <Grid
                      container
                      sx={{ background: '#00afd633', padding: '0px 0px 15px 15px', borderRadius: '8px', mt: 3 }}
                    >
                      <Grid item>
                        <Card sx={{ width: '280px', height: '90px', mr: 4, boxShadow: 'none', mt: 3 }}>
                          <CardContent
                            sx={{
                              gap: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: '14px'
                            }}
                          >
                            <Avatar
                              variant='square'
                              alt='Medicine Image'
                              sx={{
                                width: 50,
                                height: 50,
                                mr: 1,
                                background: '#E8F4F2',
                                padding: '2px',
                                borderRadius: '4px'
                              }}
                              src={null}
                            >
                              {null ?? <Icon icon='healthicons:fruits-outline' />}
                            </Avatar>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span>Apple</span>
                              <span style={{ color: '#7A8684', fontSize: 13 }}>ING011112</span>

                              <span style={{ color: '#7A8684', fontSize: 13 }}>Unchopped</span>
                            </Box>
                            <Icon style={{ position: 'relative', left: '28%' }} icon='iconoir:cancel' />
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item>
                        <Card sx={{ width: '280px', height: '90px', mr: 4, boxShadow: 'none', mt: 3 }}>
                          <CardContent
                            sx={{
                              gap: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: '14px'
                            }}
                          >
                            <Avatar
                              variant='square'
                              alt='Medicine Image'
                              sx={{
                                width: 50,
                                height: 50,
                                mr: 1,
                                background: '#E8F4F2',
                                padding: '2px',
                                borderRadius: '4px'
                              }}
                              src={null}
                            >
                              {null ?? <Icon icon='healthicons:fruits-outline' />}
                            </Avatar>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span>Apple</span>
                              <span style={{ color: '#7A8684', fontSize: 13 }}>ING011112</span>

                              <span style={{ color: '#7A8684', fontSize: 13 }}>Unchopped</span>
                            </Box>
                            <Icon style={{ position: 'relative', left: '28%' }} icon='iconoir:cancel' />
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item>
                        <Card sx={{ width: '280px', height: '90px', mr: 4, boxShadow: 'none', mt: 3 }}>
                          <CardContent
                            sx={{
                              gap: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: '14px'
                            }}
                          >
                            <Avatar
                              variant='square'
                              alt='Medicine Image'
                              sx={{
                                width: 50,
                                height: 50,
                                mr: 1,
                                background: '#E8F4F2',
                                padding: '2px',
                                borderRadius: '4px'
                              }}
                              src={null}
                            >
                              {null ?? <Icon icon='healthicons:fruits-outline' />}
                            </Avatar>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span>Apple</span>
                              <span style={{ color: '#7A8684', fontSize: 13 }}>ING011112</span>

                              <span style={{ color: '#7A8684', fontSize: 13 }}>Unchopped</span>
                            </Box>
                            <Icon style={{ position: 'relative', left: '28%' }} icon='iconoir:cancel' />
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item>
                        <Card sx={{ width: '280px', height: '90px', mr: 4, boxShadow: 'none', mt: 3 }}>
                          <CardContent
                            sx={{
                              gap: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: '14px'
                            }}
                          >
                            <Avatar
                              variant='square'
                              alt='Medicine Image'
                              sx={{
                                width: 50,
                                height: 50,
                                mr: 1,
                                background: '#E8F4F2',
                                padding: '2px',
                                borderRadius: '4px'
                              }}
                              src={null}
                            >
                              {null ?? <Icon icon='healthicons:fruits-outline' />}
                            </Avatar>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span>Apple</span>
                              <span style={{ color: '#7A8684', fontSize: 13 }}>ING011112</span>

                              <span style={{ color: '#7A8684', fontSize: 13 }}>Unchopped</span>
                            </Box>
                            <Icon style={{ position: 'relative', left: '28%' }} icon='iconoir:cancel' />
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item>
                        <Card sx={{ width: '100px', height: '90px', mr: 4, boxShadow: 'none', mt: 3, padding: 3 }}>
                          <CardContent
                            sx={{
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              padding: 2
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Icon
                                style={{ marginLeft: '14px', color: '#00D6C9', fontWeight: 600 }}
                                icon='material-symbols:add'
                              />

                              <span style={{ marginLeft: '12px', color: '#00D6C9', fontWeight: 500 }}>Add</span>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid container sx={{ px: 5, py: 5 }}>
                    <Grid item xs={12} sm={0.5}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.2}>
                      <Typography>1</Typography>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ pl: 2 }}>
                      <Typography>5</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid container spacing={7} sx={{ pl: 2 }}>
                        <Grid item>
                          <Typography>M</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>W</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>T</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>F</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                        <Grid item>
                          <Typography>S</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3.7}>
                      <Grid sx={{ pl: 7 }}>
                        <Typography>5</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Grid sx={{ pb: 12 }}>
                <Typography
                  sx={{
                    mb: 1,
                    mt: 6,
                    float: 'left',
                    color: '#37BD69',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Icon icon='material-symbols:add' />
                  ADD RECIPE
                </Typography>
                <Typography
                  sx={{
                    mb: 1,
                    mt: 6,
                    ml: 12,
                    float: 'left',
                    color: '#37BD69',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Icon icon='material-symbols:add' />
                  ADD INGREDIENT
                </Typography>

                <Typography
                  sx={{
                    mb: 1,
                    mt: 6,
                    ml: 12,
                    float: 'left',
                    color: '#37BD69',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Icon icon='material-symbols:add' />
                  ADD INGREDIENT WITH CHOICE
                </Typography>
              </Grid>

              <Divider sx={{ mb: 4, pb: 1, mt: 6, width: '98%' }} />

              <Grid>
                <Typography variant='h6'>Add Notes</Typography>
                <Grid item xs={12} sx={{ pt: 5 }}>
                  <Controller
                    name='desc'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        multiline
                        fullWidth
                        value={value}
                        label='Enter Notes '
                        name='desc'
                        error={Boolean(errors.desc)}
                        onChange={onChange}
                        id='textarea-outlined'
                        rows={5}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Grid>{handleAddRemoveingredient(fieldsIngredients, index)}</Grid>
            </CardContent>
          </Card>
        ))}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
            <Button
              color='secondary'
              variant='outlined'
              startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
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
      </form>
    </>
  )
}

export default StepBasicDetails
