import {
  Autocomplete,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useEffect, useRef, useState, useContext } from 'react'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { getFeedTypeList } from 'src/lib/api/diet/feedType'
import Icon from 'src/@core/components/icon'
import Image from 'next/image'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import {
  addIngredients,
  getIngredientDetails,
  getUnitsForIngredient,
  updateIngredients
} from 'src/lib/api/diet/getFeedDetails'
import { getIngredientDetail } from 'src/lib/api/diet/getIngredients'
import UserSnackbar from 'src/components/utility/snackbar'
import Router, { useRouter } from 'next/router'
import { addPreparationType, getPreparationTypeList } from 'src/lib/api/diet/settings/preparationTypes'
import FallbackSpinner from 'src/@core/components/spinner'
import AddPreparationType from 'src/views/pages/diet/preparationTypes/addPreparationType'
import { useDropzone } from 'react-dropzone'
import Error404 from 'src/pages/404'

import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'

const AddIngredient = () => {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const router = useRouter()
  const { id, feedTypeId, feedTypeName } = router.query
  const [loading, setLoading] = useState(false)
  const [uomList, setUom] = useState([])
  const [FeedTypeList, setFeedTypeList] = useState([])
  const [defaultUom, setDefaultUom] = useState(null)

  // console.log('defaultUom', defaultUom)
  const [defaultFeedType, setDefaultFeedType] = useState(null)
  const [displayFile, setDisplayFile] = useState('')
  const [imgSrc, setImgSrc] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [preparationTypeSubmitLoader, setPreparationTypeSubmitLoader] = useState(false)
  const [sort, setSort] = useState('asc')
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [options, setOptions] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const defaultValues = {
    active: 1,
    ingredientName: '',
    ingredientAlias: '',
    feedType: '',
    waterPercentage: '',
    dryMatterPercentage: '',
    nutritionalValuesPer: '',
    uom: '',
    calorie: '',
    description: '',
    ingredientImg: '',
    preprationTypes: []
  }

  const schema = yup.object().shape({
    ingredientName: yup.string().required('Ingredient Name is Required'),
    feedType: yup.string().nullable().required('Feed Type is Required'),

    // uom: yup.string().nullable().required('UOM is Required'),
    // nutritionalValuesPer: yup.string().required('Nutritional Values Per Unit is Required'),
    preprationTypes: yup
      .array()
      .of(
        yup.object({
          id: yup.number().required(),
          label: yup.string().required()
        })
      )
      .min(1, 'At least one preparation type is required')
      .required('At least one preparation type is required')
  })

  const handleKeyUp = values => {
    const waterPer = getValues('waterPercentage')
    const dryMatterPer = getValues('dryMatterPercentage')
    if (Number(waterPer) + Number(dryMatterPer) > 100) {
      setError(`waterPercentage`, {
        type: 'manual',
        message: 'The total of Dry Matter and Water should not be more than 100%'
      })
      setError(`dryMatterPercentage`, {
        type: 'manual',
        message: 'The total of Dry Matter and Water should not be more than 100%'
      })
    } else {
      clearErrors('waterPercentage')
      clearErrors('dryMatterPercentage')
    }
  }

  useEffect(() => {
    if (id) {
      setLoading(true)
      getIngredientDetail(id).then(res => {
        // console.log('res', res?.data)
        if (res?.success) {
          setValue('ingredientName', res?.data?.ingredient_name)
          setValue('ingredientAlias', res?.data?.ingredient_alias)
          setValue('active', Number(res?.data?.active) === 0 ? 0 : 1)
          setValue('feedType', res?.data?.feed_type)
          setDefaultFeedType({
            id: res?.data?.feed_type,
            feed_type_name: res?.data?.feed_type_label
          })
          setValue('waterPercentage', res?.data?.water_percentage)
          setValue('dryMatterPercentage', res?.data?.water_dry_matter)
          setValue('nutritionalValuesPer', res?.data?.standard_unit)

          // console.log('res?.data?.standard_unit', res?.data?.standard_unit)
          // console.log('res?.data?.uom', res?.data?.uom)
          // console.log('res?', res)
          setDefaultUom({
            id: res?.data?.uom_id,
            name: res?.data?.uom
          })
          setValue('uom', res?.data?.uom_id)
          setValue('calorie', res?.data?.calorie)
          setValue('description', res?.data?.desc)
          setValue('ingredientImg', res?.data?.image === null || undefined || '' ? '' : res?.data?.image)
          setImgSrc(res?.data?.image === null || undefined || '' ? '' : res?.data?.image)
          setValue('preprationTypes', res?.data?.preparation_types)
        } else {
          setValue('active', 0)
        }
        setLoading(false)
      })
    }
  }, [])
  useEffect(() => {
    if (feedTypeId) {
      setValue('feedType', feedTypeId)
      setDefaultFeedType({
        id: feedTypeId,
        feed_type_name: feedTypeName
      })
    }
  }, [feedTypeId])

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      reader.onload = () => {
        setImgSrc(reader?.result)
      }
      setDisplayFile(files[0]?.name)
      reader?.readAsDataURL(files[0])
      setValue('ingredientImg', files[0])
      clearErrors('ingredientImg')
    }
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('ingredientImg', '')
  }

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

  const callFeedTypeList = async ({ status, page_no, limit, q }) => {
    try {
      const params = {
        status,
        q,
        active: 1,
        page_no,
        limit
      }
      await getFeedTypeList({ ...params }).then(res => {
        setFeedTypeList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const feedTypeListSearch = debounce(async value => {
    try {
      await callFeedTypeList({ status: 1, page_no: 1, limit: 20, q: value })
    } catch (e) {
      console.log(e)
    }
  }, 500)

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
    callFeedTypeList({ status: 1, page_no: 1, limit: 10 })
    getPreparationList(sort, searchValue, sortColumn)
  }, [])

  const getPreparationList = useCallback(async (sort, q, column) => {
    try {
      await getPreparationTypeList({ sort, q, limit: 10, column, status: 1 }).then(res => {
        setOptions(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }, [])

  const searchPreparationList = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await getPreparationList(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const onError = errors => {
    // console.log('Form errros', errors)
    setOpenSnackbar({
      ...openSnackbar,
      open: true,
      message: 'Error Occured in Form Field',
      severity: 'error'
    })
  }

  const onSubmit = async params => {
    const {
      active,
      ingredientName,
      ingredientAlias,
      description,
      feedType,
      uom,
      calorie,
      preprationTypes,
      ingredientImg,
      waterPercentage,
      dryMatterPercentage,
      nutritionalValuesPer
    } = params

    const payload = {
      active,
      ingredient_name: ingredientName,
      ingredient_alias: ingredientAlias,
      feed_type: feedType,
      water_percentage: waterPercentage,
      water_dry_matter: dryMatterPercentage,
      desc: description,
      ingredient_image: ingredientImg,
      standard_unit: nutritionalValuesPer,
      uom_id: uom,
      calorie,
      preparation_types: JSON?.stringify(preprationTypes?.map(i => Number(i?.id)))
    }

    // console.log('submit', params)
    // console.log('payload', payload)
    if (id) {
      try {
        setSubmitLoader(true)
        await updateIngredients(payload, id).then(res => {
          setSubmitLoader(false)
          if (res?.success) {
            Toaster({ type: 'success', message: 'Ingredients' + ' ' + res?.message })

            // Router.push('/diet/ingredient')
            Router.push({ pathname: `/diet/ingredient/${res?.data?.ingredient_id}` })
          } else {
            Toaster({
              type: 'error',
              message: res?.message?.ingredient_image ? 'Image type only PNG and JPG is allowed' : res?.message
            })
          }
        })
      } catch (error) {
        setSubmitLoader(false)
        console.log('error', error)
      }
    } else {
      try {
        setSubmitLoader(true)
        await addIngredients(payload).then(res => {
          if (res?.success) {
            setSubmitLoader(false)
            Toaster({ type: 'success', message: 'Ingredients' + ' ' + res?.message })

            Router.push({ pathname: `/diet/ingredient/${res?.data?.ingredient_id}` })
            reset()
          } else {
            setSubmitLoader(false)

            // Object.entries(res?.message).map(([key, value]) => {
            //   Toaster({
            //     type: 'error',
            //     message: value
            //   })
            // })

            Toaster({
              type: 'error',

              // message: JSON?.stringify(res?.message?.ingredient_image ? res?.message?.ingredient_image : res?.message)
              message: res?.message?.ingredient_image ? 'Image type only PNG and JPG is allowed' : res?.message
            })
          }
        })
      } catch (error) {
        setSubmitLoader(false)
        console.log('error', error)
      }
    }
  }

  const handlePreparationSubmitData = async payload => {
    try {
      setPreparationTypeSubmitLoader(true)
      var response

      response = await addPreparationType(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: JSON?.stringify(response?.message) })

        setPreparationTypeSubmitLoader(false)
        handleSidebarClose()

        await getPreparationList(sort, searchValue, sortColumn)
      } else {
        setPreparationTypeSubmitLoader(false)
        handleSidebarClose()

        Toaster({ type: 'error', message: JSON?.stringify(response?.message) })
      }
    } catch (e) {
      setPreparationTypeSubmitLoader(false)
      Toaster({ type: 'error', message: JSON?.stringify(e) })
    }
  }

  const headerAction = (
    <FormControlLabel
      control={
        <Switch
          checked={Boolean(watch('active'))}
          onChange={e => {
            setValue('active', Number(e.target.checked))
          }}
          defaultChecked
        />
      }
      labelPlacement='start'
      label='Active'
    />
  )

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: acceptedFiles => {
      const reader = new FileReader()
      const files = acceptedFiles
      if (files && files.length !== 0) {
        reader.onload = () => {
          setImgSrc(reader?.result)
        }
        setDisplayFile(files[0]?.name)
        reader?.readAsDataURL(files[0])
        setValue('ingredientImg', files[0])
        clearErrors('ingredientImg')
      }
    }
  })

  return (
    <>
      {dietModule && (dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') ? (
        <Box>
          <Box>
            <Breadcrumbs aria-label='breadcrumb'>
              <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/diet/ingredient')}>
                Ingredients
              </Typography>
              <Typography color='text.primary'>{id ? 'Update' : 'Add'} new ingredient</Typography>
            </Breadcrumbs>
          </Box>
          {loading ? (
            <Box sx={{ justifyContent: 'center', display: 'flex', alignItems: 'center', height: '70vh' }}>
              <FallbackSpinner />
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit, onError)}>
              <Card sx={{ mt: 3 }}>
                <CardHeader
                  sx={{ paddingBottom: 0, marginX: 1 }}
                  title={id ? 'Update Ingredient' : 'Add New Ingredient'}
                  action={id ? headerAction : null}
                />
                <CardContent>
                  <Typography sx={{ width: '70%', fontSize: 14 }}>
                    Please provide the standard unit, unit of measurement, water percentage, and dry ingredient
                    proportions for this ingredient prior to processing.
                  </Typography>
                  <Box sx={{ my: '24px' }}>
                    <Divider />
                    <Divider />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'start' }}>
                    <Box sx={{ marginLeft: 5, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                      <Box
                        sx={{
                          height: 20,
                          width: 20,
                          border: `3px solid ${theme.palette.primary.main}`,
                          borderRadius: '50%',
                          mb: 3
                        }}
                      ></Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Basic Information</Typography>
                      <Typography sx={{ fontWeight: 400, fontSize: 12 }}>Enter details</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography sx={{ mt: '32px', mb: '20px', fontSize: 20, fontWeight: 500 }}>
                      1. Ingredient details
                    </Typography>
                    <Grid container sx={{ justifyContent: 'space-between', rowGap: '20px' }}>
                      <Grid item xs={12} sm={3.9} md={3.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='ingredientName'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                label='Ingredient Name *'
                                value={value}
                                onChange={onChange}
                                placeholder='Ingredient Name'
                                error={Boolean(errors.ingredientName)}
                                name='ingredientName'
                              />
                            )}
                          />
                          {errors.ingredientName && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors.ingredientName?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={3.9} md={3.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='ingredientAlias'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                label='Ingredient Alias'
                                value={value}
                                onChange={onChange}
                                placeholder='Ingredient Alias'
                                name='ingredientAlias'
                              />
                            )}
                          />
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={3.9} md={3.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='feedType'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                value={defaultFeedType}
                                disablePortal
                                id='feedType'
                                placeholder='Search & Select'
                                options={FeedTypeList}
                                getOptionLabel={option => option?.feed_type_name}
                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    setDefaultFeedType(null)

                                    return onChange('')
                                  } else {
                                    setDefaultFeedType(val)

                                    return onChange(val?.id)
                                  }
                                }}
                                onKeyUp={e => {
                                  feedTypeListSearch(e?.target?.value)
                                }}
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    label='Select Feed Type *'
                                    placeholder='Search & Select'
                                    error={Boolean(errors.feedType)}
                                  />
                                )}
                              />
                            )}
                          />
                          {errors?.feedType && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.feedType?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={5.9} md={5.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='waterPercentage'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                type='number'
                                label='Percentage(%) of water'
                                value={value}
                                onChange={e => {
                                  onChange(e.target.value)
                                  handleKeyUp(value)
                                }}
                                inputProps={{ min: 0, max: 100 }}
                                placeholder='Percentage(%) of water'
                                error={Boolean(errors.waterPercentage)}
                                name='waterPercentage'
                              />
                            )}
                          />
                          {errors.waterPercentage && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors.waterPercentage?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={5.9} md={5.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='dryMatterPercentage'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                type='number'
                                label='Percentage(%) of dry matter'
                                value={value}
                                onChange={e => {
                                  onChange(e.target.value)
                                  handleKeyUp(value)
                                }}
                                inputProps={{ min: 0, max: 100 }}
                                placeholder='Percentage(%) of dry matter'
                                error={Boolean(errors.dryMatterPercentage)}
                                name='dryMatterPercentage'
                              />
                            )}
                          />
                          {errors.dryMatterPercentage && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.dryMatterPercentage?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: '32px' }}>
                      <Divider />
                      <Divider />
                    </Box>

                    <Typography sx={{ my: '20px', fontSize: 20, fontWeight: 500 }}>2. Calories</Typography>
                    <Grid container sx={{ justifyContent: 'space-between', rowGap: '20px' }}>
                      <Grid item xs={12} md={3.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='nutritionalValuesPer'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                inputProps={{ min: 0 }}
                                type='number'
                                label='Enter nutritional values per'
                                value={value}
                                onChange={onChange}
                                placeholder='Enter nutritional values per'
                                error={Boolean(errors.nutritionalValuesPer)}
                                name='nutritionalValuesPer'
                              />
                            )}
                          />
                          {errors.nutritionalValuesPer && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors.nutritionalValuesPer?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='uom'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                value={defaultUom}
                                disablePortal
                                id='uom'
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
                                    label='Select unit of measurement (UOM) '
                                    placeholder='Search & Select'
                                    error={Boolean(errors.uom)}
                                  />
                                )}
                              />
                            )}
                          />
                          {errors?.uom && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.uom?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3.9}>
                        <FormControl fullWidth>
                          <Controller
                            name='calorie'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                type='number'
                                inputProps={{ min: 0 }}
                                label='Enter total calories'
                                value={value}
                                onChange={onChange}
                                placeholder='Enter total calories'
                                error={Boolean(errors.calorie)}
                                name='calorie'
                              />
                            )}
                          />
                          {errors.calorie && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors.calorie?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Box sx={{ my: '32px' }}>
                      <Divider />
                      <Divider />
                    </Box>

                    <Typography sx={{ mt: '32px', fontSize: 20, fontWeight: 500 }}>3. Description</Typography>

                    <Grid container sx={{ justifyContent: 'space-between', mt: '20px' }}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <Controller
                            name='description'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                rows={4}
                                multiline
                                label='Description'
                                value={value}
                                onChange={onChange}
                                placeholder='Description'
                                error={Boolean(errors.description)}
                                name='description'
                              />
                            )}
                          />
                          {errors.description && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors.description?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Box sx={{ my: '32px' }}>
                      <Divider />
                      <Divider />
                    </Box>

                    <Typography sx={{ mt: '32px', fontSize: 20, fontWeight: 500 }}>
                      4. {imgSrc !== '' ? 'Image added' : 'Attach image'}
                    </Typography>

                    <Grid container sx={{ justifyContent: 'space-between', mt: '20px' }}>
                      {imgSrc !== '' ? null : (
                        <Grid item xs={12} sm={9} md={5.9}>
                          <input
                            type='file'
                            accept='image/*'
                            onChange={e => handleInputImageChange(e)}
                            style={{ display: 'none' }}
                            name='ingredientImg'
                            ref={fileInputRef}
                          />

                          <Box
                            {...getRootProps({ className: 'dropzone' })}
                            onClick={handleAddImageClick}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              height: 120,
                              border: `2px solid ${theme.palette.customColors.trackBg}`,
                              borderRadius: 1,
                              padding: 3
                            }}
                          >
                            <Image alt={'filename'} src={imageUploader} width={100} height={100} />

                            <Typography>Drop your image here</Typography>
                          </Box>
                        </Grid>
                      )}
                      <Grid item md={5.9}>
                        {imgSrc !== '' && (
                          <Box sx={{ display: 'flex' }}>
                            <Box
                              sx={{
                                position: 'relative',
                                backgroundColor: theme.palette.customColors.tableHeaderBg,
                                borderRadius: '10px',
                                height: 121,
                                padding: '10.5px',
                                boxSizing: 'border-box'
                              }}
                            >
                              <img
                                style={{
                                  aspectRatio: 2 / 2,
                                  height: '100%',
                                  borderRadius: '5%'
                                }}
                                alt='Uploaded image'
                                src={typeof imgSrc === 'string' ? imgSrc : imgSrc}
                              />
                              <Box
                                sx={{
                                  cursor: 'pointer',
                                  position: 'absolute',
                                  top: 0,
                                  right: 0,
                                  zIndex: 10,
                                  height: '24px',
                                  borderRadius: 0.4,
                                  backgroundColor: theme.palette.customColors.secondaryBg
                                }}
                              >
                                <Icon
                                  icon='material-symbols-light:close'
                                  color='#fff'
                                  onClick={() => removeSelectedImage()}
                                >
                                  {' '}
                                </Icon>
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </Grid>
                    </Grid>

                    <Box sx={{ my: '32px' }}>
                      <Divider />
                      <Divider />
                    </Box>

                    <Box sx={{ mt: '32px', display: { sm: 'flex' }, gap: '20px', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 20, fontWeight: 500 }}>5. Preparation types</Typography>
                      <Box
                        sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}
                        onClick={() => setOpenDrawer(true)}
                      >
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 500,
                            verticalAlign: 'middle',
                            color: theme.palette.primary.main,
                            cursor: 'pointer'
                          }}
                        >
                          Add preparation types
                        </Typography>
                        <Icon fontSize={28} color={theme.palette.primary.main} icon='system-uicons:button-add' />
                      </Box>
                    </Box>

                    <Grid container sx={{ justifyContent: 'space-between', mt: '20px' }}>
                      <Grid item xs={12}>
                        <FormControl sx={{ mb: 6 }} fullWidth>
                          <Controller
                            name='preprationTypes'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                multiple
                                options={options?.length > 0 ? options : []}
                                getOptionLabel={option => option?.label}
                                id='preprationTypes'
                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                onChange={(e, val) => {
                                  onChange(val)
                                }}
                                filterSelectedOptions
                                value={value || []}
                                renderInput={params => (
                                  <TextField
                                    onChange={e => searchPreparationList(sort, e.target.value, sortColumn)}
                                    {...params}
                                    label='Preparation Types *'
                                    placeholder='Preparation Types'
                                  />
                                )}
                              />
                            )}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={5}>
                      <Grid
                        sx={{
                          height: '100%',
                          alignItems: 'flex-end',
                          justifyContent: 'flex-end',
                          gap: 5
                        }}
                        container
                      >
                        <Button
                          onClick={() => Router.push('/diet/ingredient')}
                          startIcon={<Icon icon='ph:arrow-left-bold' />}
                          variant='outlined'
                          sx={{ width: '124', height: '38' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          endIcon={<Icon icon='ph:arrow-right-bold' />}
                          disabled={
                            watch('ingredientName') === '' ||
                            watch('feedType') === '' ||
                            errors.dryMatterPercentag ||
                            errors.waterPercentage ||
                            watch('preprationTypes')?.length === 0 ||
                            submitLoader
                          }
                          type='submit'
                          variant='contained'
                          sx={{ width: '124', height: '38' }}
                        >
                          {id ? 'Update' : 'Submit'} &nbsp; {submitLoader ? <CircularProgress size={16} /> : null}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                  {openSnackbar.open ? (
                    <UserSnackbar
                      severity={openSnackbar?.severity}
                      status={true}
                      message={openSnackbar?.message}
                      handleClose={() => setOpenSnackbar({ ...openSnackbar, open: false })}
                    />
                  ) : null}
                </CardContent>
              </Card>
            </form>
          )}
          <AddPreparationType
            drawerWidth={400}
            addEventSidebarOpen={openDrawer}
            handleSidebarClose={handleSidebarClose}
            handleSubmitData={handlePreparationSubmitData}
            resetForm={resetForm}
            submitLoader={preparationTypeSubmitLoader}
            editParams={{ id: null, label: null, status: null }}
          />
        </Box>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddIngredient
