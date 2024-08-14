import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { Box } from '@mui/system'
import { Controller, useForm } from 'react-hook-form'
import {
  Autocomplete,
  Breadcrumbs,
  Button,
  CardContent,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  debounce,
  Divider
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Router, { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { usePariveshContext } from 'src/context/PariveshContext'
import {
  addSpeciesToOrganization,
  getListAllSpeciesSearch,
  updateSpeciesToOrganization
} from 'src/lib/api/parivesh/addSpecies'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { getEntryListById } from 'src/lib/api/parivesh/entryList'
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@mui/material/styles'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import Image from 'next/image'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import AcquisitionFields from './AcquisitionFields'

const schema = yup.object().shape({
  specie: yup
    .object()
    .shape({
      scientific_name: yup.string().required('Species is Required')
    })
    .required('Species is Required'),

  animal_count: yup.number().when('possession_type', {
    is: val => val !== 'death',
    then: () =>
      yup
        .number()
        .typeError('Total Count must be a number')
        .positive('Total Count must be greater than zero')
        .integer('Total Count must be a whole number')
        .min(1, 'Total Count must be at least 1')
        .required('Total Count is Required'),
    otherwise: () => yup.number().notRequired()
  }),

  gender: yup.string().required('Gender is Required'),
  transaction_date: yup.date().required('Date is Required'),
  possession_type: yup.string().required('Reason is Required'),

  // Conditional fields for Transfer
  where_to_transfer: yup.string().when('possession_type', {
    is: 'transfer',
    then: () => yup.string().required('Organization for transfer is required'),
    otherwise: () => yup.string().notRequired()
  }),

  // Conditional fields for Death
  reason_for_death: yup.string().when('possession_type', {
    is: 'death',
    then: () => yup.string().required('Reason for Death is required'),
    otherwise: () => yup.string().notRequired()
  }),
  death_date: yup.date().when('possession_type', {
    is: 'death',
    then: () => yup.date().required('Date of Death is required'),
    otherwise: () => yup.date().notRequired()
  }),
  animal_id: yup.string().when('possession_type', {
    is: 'death',
    then: () => yup.string().notRequired(),
    otherwise: () => yup.string().notRequired()
  }),

  // Conditional fields for Acquisition
  where_to_acquisition: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () => yup.string().required('Organization to acquire from is required'),
    otherwise: () => yup.string().notRequired()
  }),
  dgft_number: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () => yup.string().required('DGFT Number is required'),
    otherwise: () => yup.string().notRequired()
  }),
  cites_required: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () => yup.string().required('CITES required field is required'),
    otherwise: () => yup.string().notRequired()
  }),
  cites_appendix: yup.string().when(['possession_type', 'cites_required'], {
    is: (possession_type, cites_required) => possession_type === 'acquisition' && cites_required === 'Yes',
    then: () => yup.string().required('Select Appendix is required'),
    otherwise: () => yup.string().notRequired()
  }),
  cites_numbers: yup.string().when(['possession_type', 'cites_required'], {
    is: (possession_type, cites_required) => possession_type === 'acquisition' && cites_required === 'Yes',
    then: () => yup.string().required('CITES Number is required'),
    otherwise: () => yup.string().notRequired()
  }),
  attachments: yup.array().when('possession_type', {
    is: 'death',
    then: () => yup.array().min(1, 'Attachment is required').of(yup.mixed().required('Attachment is required')),
    otherwise: () => yup.array().notRequired()
  }),
  dgft_attachments: yup.array().notRequired()
})

const AddNewEntry = () => {
  const auth = useAuth()
  const router = useRouter()
  const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [btnLoader, setBtnLoader] = useState(false)
  const [editParams, setEditParams] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [species, setSpecies] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [reasonType, setReasonType] = useState(null)
  const [imgSrc, setImgSrc] = useState([])
  const [displayFile, setDisplayFile] = useState([])
  const [dgftDisplayFile, setDgftDisplayFile] = useState([])

  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const defaultValues = {
    specie: null,
    gender: '',
    animal_count: '',
    possession_type: '',
    transaction_date: new Date(),
    reason_for_death: '',
    death_date: '',
    where_to_transfer: '',
    where_to_acquisition: '',
    dgft_number: '',
    cites_required: '',
    cites_appendix: '',
    cites_numbers: '',
    animal_id: '',
    attachments: [],
    dgft_attachments: []
  }

  const {
    reset,
    control,
    setValue,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    trigger,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })

  const resetForm = () => {
    reset({
      ...defaultValues,
      transaction_date: new Date() // Reset to current date and time
    })
  }
  const possessionType = watch('possession_type')
  useEffect(() => {
    if (possessionType === 'death' && !isEditMode) {
      setValue('animal_count', undefined)
      clearErrors('animal_count')
    } else if (possessionType === 'transfer' && !isEditMode) {
      setValue('gender', undefined)
      clearErrors('gender')
    }
  }, [watch('possession_type'), setValue, clearErrors])

  const onSubmit = async data => {
    const {
      gender,
      transaction_date,
      specie,
      possession_type,
      animal_count,
      attachments,
      death_date,
      reason_for_death,
      animal_id,
      where_to_transfer,
      where_to_acquisition,
      dgft_number,
      dgft_attachments,
      cites_required,
      cites_appendix,
      cites_numbers
    } = { ...data }

    console.log('Form submitted with data:', data)

    const isValid = await trigger()
    console.log('Form validity:', isValid)
    console.log('errors', errors)

    if (!isValid) {
      console.log('Form is invalid, not submitting')
      return
    }

    console.log('Submitting data:', data)

    const selectedDate = new Date(transaction_date)
    const now = new Date()
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())

    const payload = {
      org_id: selectedParivesh.id,
      tsn_id: specie?.id,
      tsn_relation: specie?.tsn_relation,
      possession_type: possession_type,
      gender: gender,
      // animal_count: animal_count,
      transaction_date: moment.utc(selectedDate).format('YYYY-MM-DD HH:mm:ss'),
      attachment: attachments
    }
    // Add conditional fields based on possession_type
    if (possession_type === 'death') {
      payload.reason_for_death = reason_for_death
      payload.death_date = moment.utc(death_date).format('YYYY-MM-DD HH:mm:ss')
      payload.animal_id = animal_id
      payload.animal_count = 1
    } else {
      payload.animal_count = animal_count
    }
    if (possession_type === 'transfer') {
      payload.where_to_transfer = where_to_transfer
    } else if (possession_type === 'acquisition') {
      payload.where_to_acquisition = where_to_acquisition
      payload.dgft_number = dgft_number
      payload.dgft_attachment = dgft_attachments
      payload.cites_required = cites_required
      if (data.cites_required === 'Yes') {
        payload.cites_appendix = cites_appendix
        payload.cites_numbers = cites_numbers
      }
    }

    console.log(payload, 'payload')

    // try {
    //   setBtnLoader(true)
    //   const response = isEditMode
    //     ? await updateSpeciesToOrganization(payload, editParams?.id)
    //     : await addSpeciesToOrganization(payload)

    //   if (response?.success) {
    //     resetForm()
    //     router.back()
    //     Toaster({ type: 'success', message: response?.message })
    //   } else {
    //     Toaster({ type: 'error', message: response?.message })
    //   }
    // } catch (error) {
    //   console.log('error', error)
    // } finally {
    //   setBtnLoader(false)
    // }
  }

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchSpeciesData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    const { id } = router.query

    if (id !== undefined) {
      const selectedOrgId = selectedParivesh.id

      const params = {
        id: id,
        org_id: selectedOrgId
      }

      // console.log('Id >', id, selectedOrgId)

      const fetchDataById = async () => {
        const response = await getEntryListById(params)

        if (response?.success) {
          console.log(response.data, 'response >>')
          setEditParams(response.data)
          setIsEditMode(Object.keys(response.data).length > 0)

          const specieObject = {
            id: response.data.tsn_id,
            common_name: response.data.common_name,
            scientific_name: response.data.scientific_name,
            tsn_relation: response.data.tsn_relation
          }
          // Set the specie object
          setValue('specie', specieObject)

          for (const key of Object.keys(response.data)) {
            console.log(response.data[key], 'key')
            if (key === 'transaction_date') {
              const formattedDate = new Date(response.data[key])
              setValue(key, formattedDate)
            } else if (key === 'animal_count') {
              setValue(key, Number(response.data[key]))
            } else if (key === 'possession_type' && response.data[key] === 'death') {
              setValue(key, response.data[key])
            } else if (key === 'death_date' && response.data[key] === 'death') {
              const formattedDate = new Date(response.data[key])
              setValue(key, formattedDate)
            } else if (
              key !== 'scientific_name' &&
              key !== 'tsn_id' &&
              key !== 'common_name' &&
              key !== 'tsn_relation'
            ) {
              // Skip fields already set in specieObject
              setValue(key, response.data[key])
              // setDisplayFile(response.data[key])
            }
          }
          // Update displayFile with existing attachments
          if (
            response?.data?.attachments &&
            Array.isArray(response?.data?.attachments || response?.data?.dgft_attachments)
          ) {
            const fetchedFiles = response.data.attachments?.map(file => ({
              name: file?.attachment_name,
              fileSrc: file?.attachment,
              id: file?.id,
              isBackendFile: true // Mark as backend file
            }))

            setDisplayFile(fetchedFiles)

            const fetchedDgftFiles = response?.data?.dgft_attachments?.map(file => ({
              name: file?.dgft_attachment_name,
              fileSrc: file?.dgft_attachment,
              id: file?.id,
              isBackendFile: true // Mark as backend file
            }))
            setDgftDisplayFile(fetchedDgftFiles)
          }
        } else {
          console.log('response error >>', response?.error)
        }
      }

      fetchDataById()
    }
  }, [setValue])

  // console.log(editParams, 'editParams')

  const fetchSpeciesData = useCallback(async q => {
    try {
      const params = { q }
      await getListAllSpeciesSearch({ params: params }).then(res => {
        // console.log('response123', res?.data?.result)
        const transformedSpecies = res?.data?.result.map(species => ({
          id: species?.tsn,
          common_name: species?.common_name,
          scientific_name: species?.scientific_name,
          tsn_relation: species?.tsn_relation,
          zoo_id: species.zoo_id
        }))
        setSpecies(transformedSpecies)
      })
    } catch (e) {
      console.log(e)
    }
  }, [])

  useEffect(() => {
    fetchSpeciesData('')
  }, [fetchSpeciesData])

  // const possessionType = watch('possession_type')
  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: acceptedFiles => {
      const filePromises = acceptedFiles.map(file => {
        console.log(file, 'file')
        return new Promise(resolve => {
          const reader = new FileReader()
          console.log(reader, reader.result, 'result')
          reader.onloadend = () => {
            resolve({ name: file.name, fileSrc: reader.result, file })
          }
          reader.readAsDataURL(file)
        })
      })

      Promise.all(filePromises)
        .then(fileDetails => {
          setImgSrc(prevSrc => [...prevSrc, ...fileDetails.map(fileDetail => fileDetail.fileSrc)])
          setDisplayFile(prevFiles => [...prevFiles, ...fileDetails])

          // Update attachments in the form
          const currentFiles = getValues('attachments') || []
          console.log(acceptedFiles, 'currentFiles')
          setValue('attachments', [...currentFiles, ...acceptedFiles])

          clearErrors('attachments')
          setCurrentImageIndex(prevIndex => (prevIndex === 0 ? 0 : prevIndex)) // Keep current index unless it's 0
        })
        .catch(error => {
          console.error('Error processing files:', error)
        })
    }
  })

  const removeSelectedImage = index => {
    // console.log(index, id)
    setImgSrc(prevSrc => prevSrc.filter((_, i) => i !== index))
    setDisplayFile(prevFiles => prevFiles.filter((_, i) => i !== index))

    // Update the attachments in the form
    const currentFiles = getValues('attachments') || []
    const updatedFiles = currentFiles.filter((_, i) => i !== index)
    setValue('attachments', updatedFiles)

    // Adjust the current image index if necessary
    if (index === currentImageIndex && imgSrc.length > 1) {
      setCurrentImageIndex(prev => (prev === imgSrc.length - 1 ? prev - 1 : prev))
    } else if (index < currentImageIndex) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const getIconByFileType = fileName => {
    const extension = fileName?.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return { icon: imgPath?.pdf?.image_path, bgColor: imgPath?.pdf?.bg_color }
      case 'xls':
      case 'xlsx':
        return { icon: imgPath?.xls?.image_path, bgColor: imgPath?.xls?.bg_color }
      case 'doc':
      case 'docx':
        return { icon: imgPath?.document?.image_path, bgColor: imgPath?.document?.bg_color }
      case 'mp3':
      case 'wav':
      case 'ogg':
        return { icon: imgPath?.audio?.image_path, bgColor: imgPath?.audio?.bg_color }
      default:
        return { icon: imgPath?.default?.image_path, bgColor: imgPath?.default?.bg_color }
    }
  }

  const truncateFilename = (filename, maxLength = 16) => {
    if (filename?.length <= maxLength) return filename
    const start = filename?.slice(0, Math.floor(maxLength / 2))
    const end = filename?.slice(-Math.floor(maxLength / 2))
    return `${start}...${end}`
  }

  const BirthFields = ({ control, errors }) => {
    return (
      <>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Controller
                name='gender'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
                    <MenuItem value='male'>Male</MenuItem>
                    <MenuItem value='female'>Female</MenuItem>
                    <MenuItem value='other'>Other</MenuItem>
                  </TextField>
                )}
              />
              {errors.gender && <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {reasonType !== 'death' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='animal_count'
                  control={control}
                  rules={{ required: reasonType !== 'death' }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Total Count*'
                      value={value}
                      type='number'
                      onChange={onChange}
                      placeholder='Enter Total Count'
                      error={Boolean(errors.animal_count)}
                      name='animal_count'
                    />
                  )}
                />

                {errors.animal_count && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_count?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='transaction_date'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <SingleDatePicker
                    fullWidth
                    date={value}
                    width={'100%'}
                    dateFormat='dd/MM/yyyy'
                    // showTimeSelect
                    // timeIntervals={15}
                    onChangeHandler={onChange}
                    maxDate={new Date()}
                    customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
                  />
                )}
              />
              {errors.transaction_date && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {errors.transaction_date?.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </>
    )
  }

  const DeathFields = ({ control, errors }) => {
    return (
      <>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='reason_for_death'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Reason for Death*'
                    value={value}
                    onChange={onChange}
                    placeholder='Enter Reason for Death'
                    error={Boolean(errors.reason_for_death)}
                    name='reason_for_death'
                  />
                )}
              />

              {errors.reason_for_death && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.reason_for_death?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='death_date'
                rules={{ required: possessionType === 'death' ? true : false }}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <SingleDatePicker
                    fullWidth
                    date={value}
                    width={'100%'}
                    dateFormat='dd/MM/yyyy'
                    // showTimeSelect
                    // timeIntervals={15}

                    onChangeHandler={onChange}
                    maxDate={new Date()}
                    customInput={<CustomInput label='Date of Death*' error={Boolean(errors.death_date)} />}
                  />
                )}
              />
              {errors.death_date && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {errors.death_date?.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='animal_id'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Animal ID (Optional)'
                    value={value}
                    onChange={onChange}
                    placeholder='Enter Animal ID (Optional)'
                    error={Boolean(errors.animal_id)}
                    name='animal_id'
                  />
                )}
              />

              {errors.animal_id && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_id?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <FormControl fullWidth>
                  <Controller
                    name='gender'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        select
                        label='Gender*'
                        value={value}
                        onChange={onChange}
                        error={Boolean(errors.gender)}
                      >
                        <MenuItem value='male'>Male</MenuItem>
                        <MenuItem value='female'>Female</MenuItem>
                        <MenuItem value='other'>Other</MenuItem>
                      </TextField>
                    )}
                  />
                  {errors.gender && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='transaction_date'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <SingleDatePicker
                    fullWidth
                    date={value}
                    width={'100%'}
                    dateFormat='dd/MM/yyyy'
                    // showTimeSelect
                    // timeIntervals={15}
                    onChangeHandler={onChange}
                    maxDate={new Date()}
                    customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
                  />
                )}
              />
              {errors.transaction_date && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {errors.transaction_date?.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </>
    )
  }

  const TransferFields = ({ control, errors }) => {
    return (
      <>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Controller
                name='where_to_transfer'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Which organization would you transfer?'
                    value={value}
                    type='text'
                    onChange={onChange}
                    placeholder='Which organization would you transfer?'
                    error={Boolean(errors.where_to_transfer)}
                    name='where_to_transfer'
                  />
                )}
              />

              {errors.where_to_transfer && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.where_to_transfer?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Controller
                name='gender'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
                    <MenuItem value='male'>Male</MenuItem>
                    <MenuItem value='female'>Female</MenuItem>
                    <MenuItem value='other'>Other</MenuItem>
                  </TextField>
                )}
              />
              {errors.gender && <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='animal_count'
                control={control}
                rules={{ required: reasonType !== 'death' }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Total Count*'
                    value={value}
                    type='number'
                    onChange={onChange}
                    placeholder='Enter Total Count'
                    error={Boolean(errors.animal_count)}
                    name='animal_count'
                  />
                )}
              />

              {errors.animal_count && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_count?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='transaction_date'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <SingleDatePicker
                    fullWidth
                    date={value}
                    width={'100%'}
                    dateFormat='dd/MM/yyyy'
                    // showTimeSelect
                    // timeIntervals={15}
                    onChangeHandler={onChange}
                    maxDate={new Date()}
                    customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
                  />
                )}
              />
              {errors.transaction_date && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {errors.transaction_date?.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </>
    )
  }

  return (
    <>
      <Box>
        <Box>
          <Breadcrumbs aria-label='breadcrumb'>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/parivesh/home')}>
              {selectedParivesh?.organization_name}
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.back()}>
              {isEditMode ? 'New Entries' : 'New Entries'}
            </Typography>
            <Typography color='text.primary'>{isEditMode ? 'Edit New Entry' : 'Add New Entry'}</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ mt: 5, background: '#FFFFFF', borderRadius: '10px' }}>
          <CardContent>
            <Typography sx={{ mb: '20px' }} variant='h6'>
              {isEditMode ? 'Edit New Entry' : 'Add New Entry'}
            </Typography>

            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='specie'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          sx={{ width: '100%' }}
                          options={species}
                          id='autocomplete-clearOnEscape'
                          value={value}
                          getOptionLabel={option => option.scientific_name || ''}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          onChange={(event, newValue) => {
                            onChange(newValue)
                            if (newValue === null) {
                              clearErrors('specie')
                            } else {
                              trigger('specie')
                            }
                          }}
                          onInputChange={(event, newInputValue) => {
                            searchTableData(newInputValue)
                          }}
                          filterOptions={(options, params) => {
                            const filtered = options.filter(
                              option =>
                                option?.scientific_name?.toLowerCase().includes(params?.inputValue.toLowerCase()) ||
                                option?.common_name?.toLowerCase().includes(params?.inputValue.toLowerCase())
                            )

                            return filtered
                          }}
                          renderInput={params => (
                            <TextField {...params} label='Search & Select…' error={Boolean(errors.specie)} />
                          )}
                          renderOption={(props, option) => (
                            <Box component='li' {...props} key={option.id}>
                              {option.scientific_name} <br />{' '}
                              <Typography variant='body2' color='textSecondary'>
                                ({option.common_name})
                              </Typography>
                            </Box>
                          )}
                        />
                      )}
                    />
                    {errors.specie && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.specie?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='possession_type'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          select
                          label='Reason*'
                          placeholder='Reason'
                          value={value}
                          disabled={isEditMode}
                          onChange={e => {
                            const value = e.target.value
                            onChange(e)
                            setReasonType(value)
                            if (!isEditMode) {
                              setValue('animal_count', '')
                              setValue('transaction_date', new Date())
                              setValue('reason_for_death', '')
                              setValue('death_date', null)
                              setValue('where_to_transfer', '')
                              setValue('where_to_acquisition', '')
                              setValue('dgft_number', '')
                              setValue('cites_required', '')
                              setValue('cites_appendix', '')
                              setValue('cites_numbers', '')
                              setValue('animal_id', '')
                              setValue('attachments', [])
                              setValue('dgft_attachments', [])
                              setImgSrc([])
                              setDisplayFile([])
                              setDgftDisplayFile([])
                            }
                            setValue('gender', '')
                          }}
                          error={Boolean(errors.possession_type)}
                        >
                          <MenuItem value='birth'>Birth</MenuItem>
                          <MenuItem value='death'>Death</MenuItem>
                          <MenuItem value='transfer'>Transfer </MenuItem>
                          <MenuItem value='acquisition'>Acquisition </MenuItem>
                        </TextField>
                      )}
                    />
                    {errors.possession_type && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.possession_type?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              {(possessionType === 'birth' || !possessionType) && <BirthFields control={control} errors={errors} />}
              {possessionType === 'death' && <DeathFields control={control} errors={errors} />}
              {possessionType === 'transfer' && <TransferFields control={control} errors={errors} />}
              {possessionType === 'acquisition' && (
                <AcquisitionFields
                  control={control}
                  errors={errors}
                  watch={watch}
                  getValues={getValues}
                  setValue={setValue}
                  clearErrors={clearErrors}
                  getIconByFileType={getIconByFileType}
                  truncateFilename={truncateFilename}
                  reasonType={reasonType}
                  dgftDisplayFile={dgftDisplayFile}
                  setDgftDisplayFile={setDgftDisplayFile}
                />
              )}

              <Divider />

              <>
                <Typography sx={{ mb: 6, mt: 6 }}>Attachments</Typography>
                <Grid container spacing={2} sx={{ mb: 6 }}>
                  {/* {/ Add Attachments button /} */}
                  <Grid item xs={12} sm={4} md={3} lg={2.3}>
                    <FormControl fullWidth>
                      <Controller
                        name='attachments'
                        control={control}
                        // rules={{ required: isAttachmentRequired ? 'Attachment is required' : false }}
                        render={({ field }) => (
                          <Box
                            {...field}
                            onClick={handleAddImageClick}
                            {...getRootProps()}
                            ref={fileInputRef}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              border: '1px solid #d3d3d3',
                              borderRadius: 1,
                              padding: 4,
                              cursor: 'pointer',
                              height: '60px',
                              width: '100%' // Make sure it fills its grid item
                            }}
                          >
                            <Icon icon='mdi:attachment-plus' size={1} />
                            <Typography variant='body1' color='textPrimary'>
                              Add Attachments
                            </Typography>
                          </Box>
                        )}
                      />
                      {errors.attachments && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.attachments?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* {/ Uploaded files display /} */}
                  {displayFile.map((src, index) => {
                    const isImage = /\.(jpeg|jpg|gif|png|svg|JPG|svg)$/.test(src?.name)
                    return (
                      <Grid item xs={12} sm='auto' md='auto' lg='auto' key={index}>
                        <FormControl fullWidth>
                          <Box
                            sx={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              backgroundColor: '#f5f5f5',
                              borderRadius: '8px',
                              boxSizing: 'border-box',
                              width: { xs: '100%', sm: 'auto' },
                              height: '60px', // Fixed height for consistency
                              bgcolor: isImage ? '#f0f0f0' : getIconByFileType(src?.name)?.bgColor
                            }}
                          >
                            {isImage ? (
                              <img
                                style={{
                                  height: '60px',
                                  width: '60px',
                                  borderRadius: '20%',
                                  objectFit: 'cover',
                                  padding: '8px'
                                }}
                                alt={`Uploaded image ${index + 1}`}
                                src={src?.fileSrc}
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  padding: '4px',
                                  paddingRight: '16px'
                                }}
                              >
                                <img
                                  src={getIconByFileType(src?.name)?.icon}
                                  alt=''
                                  style={{
                                    height: '40px',
                                    width: '40px'
                                  }}
                                />
                                <Tooltip title={src?.name}>
                                  <Typography variant='body2' color='textSecondary'>
                                    {truncateFilename(src?.name)}
                                  </Typography>
                                </Tooltip>
                              </Box>
                            )}
                            <Box
                              sx={{
                                cursor: 'pointer',
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                zIndex: 10,
                                height: '20px',
                                width: '20px',
                                borderRadius: '6px',
                                backgroundColor: theme.palette.customColors.secondaryBg,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                              onClick={() => removeSelectedImage(index, src?.id)}
                            >
                              <Icon icon='material-symbols-light:close' color='#fff' size={16} />
                            </Box>
                          </Box>
                        </FormControl>
                      </Grid>
                    )
                  })}
                </Grid>
              </>
              <Button onClick={onSubmit}>save</Button>

              {/* <Box sx={{ display: 'flex', justifyContent: 'end', gap: 4 }}>
                <LoadingButton loading={btnLoader} size='large' variant='contained' type='submit'>
                  {'Save'}
                </LoadingButton>
                <Button onClick={() => router.back()} size='large' type='reset' color='error' variant='outlined'>
                  Cancel
                </Button>
              </Box> */}
            </form>
          </CardContent>
        </Box>
      </Box>
    </>
  )
}

export default AddNewEntry
