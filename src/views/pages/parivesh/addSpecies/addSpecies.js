// ** React Imports
import { useState, useEffect, useCallback, Fragment, useRef } from 'react'
import Image from 'next/image'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { Button, Grid, debounce, Autocomplete } from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@mui/material/styles'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import { getSearchLMasterListSpecies } from 'src/lib/api/parivesh/addSpecies'

// ** Styled Components

const schema = yup.object().shape({
  scientificName: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Scientific Name is Required'),
  active: yup.string().required('Status is Required'),
  commonName: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Common Name is Required'),
  // species: yup.object().nullable().required('Species is Required')
  species: yup
    .mixed() // Allow any type
    .test('is-object', 'Please Select a Valid Species', value => {
      // Validate that the selected value is an object or null
      return typeof value === 'object' || value === null
    })
    .nullable()
    .required('Species is Required')
})

const defaultValues = {
  scientificName: '',
  commonName: '',
  active: '1',
  species: ''
}

const AddSpecies = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  // ** States
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const coverFileInputRef = useRef(null)
  const [values, setValues] = useState(defaultValues)
  const [searchValue, setSearchValue] = useState('')
  const [imgSrc, setImgSrc] = useState('')
  const [coverImgSrc, setCoverImgSrc] = useState('')
  const [displayFile, setDisplayFile] = useState('')
  const [displayCoverFile, setDisplayCoverFile] = useState('')
  const [masterSpeciesList, setMasterSpeciesList] = useState([])
  const [isScientificNameDisabled, setIsScientificNameDisabled] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const {
    reset,
    control,
    setValue,
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

  const onSubmit = async params => {
    console.log(params, 'params')
    const { scientificName, commonName, speciesImg, coverImg, active } = { ...params }

    const payload = {
      common_name: commonName.trim(),
      scientific_name: scientificName.trim(),
      species_image: speciesImg,
      cover_image: coverImg
    }
    await handleSubmitData(payload)
  }

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
      setValue('species', '')
      setImgSrc('')
      setCoverImgSrc('')
    }
  }, [resetForm, editParams, reset, setValue])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <Button size='large' variant='outlined' sx={{ m: 2, width: '100%' }} onClick={handleSidebarCloseWithReset}>
          &nbsp; Cancel
        </Button>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader} sx={{ width: '100%' }}>
          Submit
        </LoadingButton>
      </Fragment>
    )
  }

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
        setValue('speciesImg', files[0])
        clearErrors('speciesImg')
      }
    }
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('speciesImg', '')
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
      setValue('speciesImg', files[0])
      clearErrors('speciesImg')
    }
  }

  const handleAddCoverImageClick = () => {
    coverFileInputRef?.current?.click()
  }

  const removeSelectedCoverImage = () => {
    setCoverImgSrc('')
    setValue('coverImg', '')
  }

  const handleInputCoverImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      reader.onload = () => {
        setCoverImgSrc(reader?.result)
      }
      setDisplayCoverFile(files[0]?.name)
      reader?.readAsDataURL(files[0])
      setValue('coverImg', files[0])
      clearErrors('coverImg')
    }
  }

  // const searchMasterSpeciesList = useCallback(
  //   debounce(async q => {
  //     setSearchValue(q)
  //     try {
  //       await fetchSpeciesMasterList(q)
  //     } catch (error) {
  //       console.error(error)
  //     }
  //   }, 1000),
  //   []
  // )

  // const fetchSpeciesMasterList = useCallback(async q => {
  //   try {
  //     const params = { q }

  //     await getSearchLMasterListSpecies({ params: params }).then(res => {
  //       console.log('responseSearch', res?.data?.data)
  //       const speciesData = res?.data?.data?.map(item => ({
  //         label: item.scientific_name,
  //         value: item.scientific_name,
  //         id: item.id
  //       }))
  //       setMasterSpeciesList(speciesData)
  //     })
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }, [])

  // useEffect(() => {
  //   fetchSpeciesMasterList()
  // }, [fetchSpeciesMasterList])

  const searchMasterSpeciesList = useCallback(
    debounce(async q => {
      if (isOpen) {
        try {
          await fetchSpeciesMasterList(q)
        } catch (error) {
          console.error(error)
        }
      }
    }, 1000),
    [isOpen]
  )

  const fetchSpeciesMasterList = useCallback(
    async q => {
      if (isOpen) {
        try {
          const params = { q }
          const res = await getSearchLMasterListSpecies({ params: params })
          console.log('responseSearch', res?.data?.data)
          const speciesData = res?.data?.data?.map(item => ({
            label: item.scientific_name,
            value: item.scientific_name,
            id: item.id
          }))
          setMasterSpeciesList(speciesData)
        } catch (e) {
          console.log(e)
        }
      }
    },
    [isOpen]
  )

  useEffect(() => {
    if (addEventSidebarOpen) {
      setIsOpen(true)
      // Only fetch initial list if searchValue is empty
      if (searchValue === '') {
        fetchSpeciesMasterList('')
      }
    } else {
      handleSidebarCloseWithReset()
    }
  }, [addEventSidebarOpen, fetchSpeciesMasterList, searchValue])

  const handleScientificNameChange = async (event, newValue) => {
    // console.log('Selected Scientific Name:', newValue)
    clearErrors('species')
    // setValue('scientificName', newValue ? newValue.value || newValue : '')

    setValue('scientificName', newValue ? newValue.value || newValue : '')
    // Enable or disable the scientificName field based on the selected value
    if (newValue && newValue.value === 'Others') {
      setIsScientificNameDisabled(false)
      setValue('scientificName', '')
    } else {
      setIsScientificNameDisabled(true)
      try {
        await fetchSpeciesMasterList(newValue?.value)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleSidebarCloseWithReset = () => {
    setMasterSpeciesList([])
    setSearchValue('')
    setIsOpen(false)
    handleSidebarClose()
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} New Species</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarCloseWithReset} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          {/* <FormControl fullWidth sx={{ mb: 6 }}>
            <TextField
              label='Search Species'
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              placeholder='Search & Select ...'
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <Icon icon='mdi:magnify' fontSize={20} />
                  </InputAdornment>
                )
              }}
            />
          </FormControl> */}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='species'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  freeSolo
                  options={masterSpeciesList}
                  getOptionLabel={option => option.value || option}
                  value={value}
                  onChange={(event, newValue) => {
                    clearErrors('species')
                    onChange(newValue)
                    handleScientificNameChange(event, newValue)
                  }}
                  onKeyUp={e => {
                    searchMasterSpeciesList(e?.target?.value)
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Species'
                      value={value}
                      onChange={onChange}
                      placeholder='Search & Select...'
                      error={Boolean(errors.species)}
                    />
                  )}
                />
              )}
            />
            {errors.species && <FormHelperText sx={{ color: 'error.main' }}>{errors.species.message}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='scientificName'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Scientific Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Scientific Name'
                  error={Boolean(errors.scientificName)}
                  name='scientificName'
                  disabled={isScientificNameDisabled}
                />
              )}
            />
            {errors.scientificName && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.scientificName.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='commonName'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Common Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Common Name'
                  error={Boolean(errors.commonName)}
                  name='commonName'
                />
              )}
            />
            {errors.commonName && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.commonName.message}</FormHelperText>
            )}
          </FormControl>

          <Grid container spacing={2} sx={{ justifyContent: 'space-between', mb: 6 }}>
            {imgSrc !== '' ? null : (
              <Grid item xs={12} sm={6} md={5.9}>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleInputImageChange}
                  style={{ display: 'none' }}
                  name='speciesImg'
                  ref={fileInputRef}
                />

                <Box
                  {...getRootProps({ className: 'dropzone' })}
                  onClick={handleAddImageClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    height: { xs: 80, sm: 100, md: 120 },
                    border: `2px solid ${theme.palette.customColors.trackBg}`,
                    borderRadius: 1,
                    padding: 2,
                    width: { xs: '100%', sm: 300, md: 350 },
                    cursor: 'pointer'
                  }}
                >
                  <Image alt={'filename'} src={imageUploader} width={100} height={100} />

                  <Typography sx={{ ml: 3 }}>Add Species Image</Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={5.9}>
              {imgSrc !== '' && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      backgroundColor: theme.palette.customColors.tableHeaderBg,
                      borderRadius: '10px',
                      height: { xs: 100, sm: 110, md: 121 },
                      padding: '10.5px',
                      boxSizing: 'border-box',
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    <img
                      style={{
                        aspectRatio: '1 / 1',
                        height: '100%',
                        borderRadius: '5%',
                        objectFit: 'cover',
                        width: '100%'
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
                      <Icon icon='material-symbols-light:close' color='#fff' onClick={removeSelectedImage}>
                        {' '}
                      </Icon>
                    </Box>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ justifyContent: 'space-between', mb: 6 }}>
            {coverImgSrc !== '' ? null : (
              <Grid item xs={12} sm={6} md={5.9}>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleInputCoverImageChange}
                  style={{ display: 'none' }}
                  name='coverImg'
                  ref={coverFileInputRef}
                />

                <Box
                  {...getRootProps({ className: 'dropzone' })}
                  onClick={handleAddCoverImageClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    height: { xs: 80, sm: 100, md: 120 },
                    border: `2px solid ${theme.palette.customColors.trackBg}`,
                    borderRadius: 1,
                    padding: 2,
                    width: { xs: '100%', sm: 300, md: 350 },
                    cursor: 'pointer'
                  }}
                >
                  <Image alt={'filename'} src={imageUploader} width={100} height={100} />

                  <Typography sx={{ ml: 3 }}>Add Cover Image</Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={5.9}>
              {coverImgSrc !== '' && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      backgroundColor: theme.palette.customColors.tableHeaderBg,
                      borderRadius: '10px',
                      height: { xs: 100, sm: 110, md: 121 },
                      padding: '10.5px',
                      boxSizing: 'border-box',
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    <img
                      style={{
                        aspectRatio: '1 / 1',
                        height: '100%',
                        borderRadius: '5%',
                        objectFit: 'cover',
                        width: '100%'
                      }}
                      alt='Uploaded cover image'
                      src={typeof coverImgSrc === 'string' ? coverImgSrc : coverImgSrc}
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
                      <Icon icon='material-symbols-light:close' color='#fff' onClick={removeSelectedCoverImage}>
                        {' '}
                      </Icon>
                    </Box>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* {editParams?.id !== null ? (
            <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
              <FormLabel>Status</FormLabel>
              <Controller
                name='active'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup row {...field} name='validation-basic-radio'>
                    <FormControlLabel
                      value='1'
                      label='Active'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                    <FormControlLabel
                      value='0'
                      label='Inactive'
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
          ) : null} */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddSpecies
