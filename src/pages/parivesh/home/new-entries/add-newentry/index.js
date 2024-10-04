import React, { forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Box, color, fontWeight } from '@mui/system'
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
  Divider,
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Router, { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import { usePariveshContext } from 'src/context/PariveshContext'
import {
  addSpeciesToOrganization,
  getListAllSpeciesSearch,
  updateSpeciesToOrganization
} from 'src/lib/api/parivesh/addSpecies'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { deleteAttachment, getEntryListById } from 'src/lib/api/parivesh/entryList'
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import BirthFields from 'src/views/pages/parivesh/addNewEntries/BirthFields'
import DeathFields from 'src/views/pages/parivesh/addNewEntries/DeathFields'
import AcquisitionFields from 'src/views/pages/parivesh/addNewEntries/AcquisitionFields'
import TransferFields from 'src/views/pages/parivesh/addNewEntries/TransferFields'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'

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
  // transaction_date: yup.date().required('Date is Required'),

  transaction_date: yup
    .date()
    .required('Date is Required')
    .test('is-after-death-date', `Entry date can't be older than the death date`, function (value) {
      const { death_date } = this.parent // Get death_date from form values
      if (death_date) {
        return new Date(value).getTime() >= new Date(death_date).getTime()
      }
      return true // No death date, no comparison
    }),

  possession_type: yup.string().required('Reason is Required'),

  where_to_transfer: yup.string().when('possession_type', {
    is: 'transfer',
    then: () =>
      yup
        .string()
        .required('Organization name is required')
        .test('not-only-spaces', 'Organization name cannot be empty or just spaces', value => {
          // Check if the trimmed value is not empty
          return value ? value.trim().length > 0 : false
        }),
    otherwise: () => yup.string().notRequired()
  }),

  // Conditional fields for Death
  reason_for_death: yup.string().when('possession_type', {
    is: 'death',
    then: () => yup.string().required('Reason for Death is required'),
    otherwise: () => yup.string().notRequired()
  }),

  death_date: yup
    .date()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .when('possession_type', {
      is: 'death',
      then: () => yup.date().nullable().required('Date of Death is required'),
      otherwise: () => yup.date().nullable().notRequired()
    }),

  death_animal_id: yup.string().when('possession_type', {
    is: 'death',
    then: () =>
      yup
        .string()
        .nullable() // Allow null values
        .notRequired() // Make it optional
        .matches(/^[a-zA-Z0-9]+(?:[-\/][a-zA-Z0-9]+)*$/, {
          message: 'Invalid Animal ID format.',
          excludeEmptyString: true // Exclude empty strings from validation
        }),
    otherwise: () =>
      yup
        .string()
        .nullable() // Allow null values
        .notRequired() // Make it optional
        .matches(/^[a-zA-Z0-9]+(?:[-\/][a-zA-Z0-9]+)*$/, {
          message: 'Invalid Animal ID format.',
          excludeEmptyString: true // Exclude empty strings from validation
        })
  }),

  // Conditional fields for Acquisition
  where_to_acquisition: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () =>
      yup
        .string()
        .required('Organization name is required')
        .test('not-only-spaces', 'Organization name cannot be empty or just spaces', value => {
          return value ? value.trim().length > 0 : false
        }),
    otherwise: () => yup.string().notRequired()
  }),

  dgft_number: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () =>
      yup
        .string()
        .required('DGFT Number is required')
        .test('not-only-spaces', 'DGFT Number cannot be empty or just spaces', value => {
          return value ? value.trim().length > 0 : false
        }),
    otherwise: () => yup.string().notRequired()
  }),
  cites_required: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () => yup.string().required('CITES value is required'),
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
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState(null)
  const [deleteBtnLoader, setDeleteBtnLoader] = useState(false)
  const authData = useContext(AuthContext)
  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

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
    death_animal_id: '',
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
      death_animal_id,
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
      payload.death_date = death_date ? moment.utc(death_date).format('YYYY-MM-DD HH:mm:ss') : null
      payload.death_animal_id = death_animal_id
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
      if (data.cites_required === 'yes') {
        payload.cites_appendix = cites_appendix
        payload.cites_numbers = cites_numbers
      }
    }

    console.log(payload, 'payload')

    try {
      setBtnLoader(true)
      const response = isEditMode
        ? await updateSpeciesToOrganization(payload, editParams?.id)
        : await addSpeciesToOrganization(payload)

      if (response?.success) {
        resetForm()
        router.back()
        Toaster({ type: 'success', message: response?.message })
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.log('error', error)
    } finally {
      setBtnLoader(false)
    }
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
            console.log(key, '123')
            if (key === 'transaction_date') {
              const formattedDate = new Date(response.data[key])
              setValue(key, formattedDate)
            } else if (key === 'animal_count') {
              setValue(key, Number(response.data[key]))
            } else if (key === 'possession_type' && response.data[key] === 'death') {
              setValue(key, response.data[key])
            } else if (key === 'death_date' && response.data[key] && response.data[key] !== '') {
              const formattedDate = new Date(response.data[key])
              setValue(key, formattedDate)
            } else if (key === 'death_date') {
              setValue(key, null)
            } else if (
              key !== 'scientific_name' &&
              key !== 'tsn_id' &&
              key !== 'common_name' &&
              key !== 'tsn_relation'
            ) {
              // Skip fields already set in specieObject
              setValue(key, response.data[key])
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
            setDgftDisplayFile(fetchedDgftFiles || [])
          }
        } else {
          console.log('response error >>', response?.error)
        }
      }

      fetchDataById()
    }
  }, [setValue])

  const fetchSpeciesData = useCallback(async q => {
    try {
      const params = { q }
      await getListAllSpeciesSearch({ params: params }).then(res => {
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

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const removeSelectedImage = async (index, fileId) => {
    if (fileId) {
      setSelectedFileId(fileId)
      setIsModalOpenDelete(true)
    } else {
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
  }

  const confirmDeleteAction = async () => {
    try {
      const payload = {
        apad_id: editParams?.id,
        attachment_for: 'animal'
      }
      setDeleteBtnLoader(true)
      const response = await deleteAttachment(selectedFileId, payload)
      console.log('response123', response)
      if (response?.success) {
        setDeleteBtnLoader(false)
        setIsModalOpenDelete(false)
        // Fetch the updated backend files
        const fetchedFiles = response?.data?.attachments?.map(file => ({
          name: file?.attachment_name,
          fileSrc: file?.attachment,
          id: file?.id,
          isBackendFile: true // Mark as backend file
        }))

        // Retain only the files that are not deleted (including newly uploaded files)
        const updatedDisplayFiles = [
          ...fetchedFiles,
          ...displayFile.filter(file => file.id !== selectedFileId && !file.isBackendFile)
        ]

        // Update the displayFile state
        setDisplayFile(updatedDisplayFiles)

        Toaster({ type: 'success', message: response?.message })
      } else {
        setDeleteBtnLoader(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      setDeleteBtnLoader(false)
      setIsModalOpenDelete(false)
      console.error('Error uploading files:', error)
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

  const handleFileSelect = files => {
    const filesArray = Array.isArray(files) ? files : Array.from(files)
    console.log(filesArray, 'Files Array') // Debugging line

    const filePromises = filesArray.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({ name: file.name, fileSrc: reader.result, file })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises)
      .then(fileDetails => {
        console.log(fileDetails, 'File Details') // Debugging line
        setImgSrc(prevSrc => [...prevSrc, ...fileDetails.map(fileDetail => fileDetail.fileSrc)])
        setDisplayFile(prevFiles => [...prevFiles, ...fileDetails])
        setValue('attachments', filesArray, { shouldValidate: true })
        clearErrors('attachments')
      })
      .catch(error => {
        console.error('Error processing files:', error)
      })
  }

  // Dropzone setup
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileSelect,
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  })

  return (
    <>
      {pariveshAccess ? (
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
                  {possessionType !== 'birth' && possessionType && (
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
                                    setValue('death_animal_id', '')
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
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors.possession_type?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  )}

                  {(possessionType === 'birth' || !possessionType) && (
                    <BirthFields
                      control={control}
                      errors={errors}
                      watch={watch}
                      getValues={getValues}
                      setValue={setValue}
                      clearErrors={clearErrors}
                      reasonType={reasonType}
                      setReasonType={setReasonType}
                      dgftDisplayFile={dgftDisplayFile}
                      setDgftDisplayFile={setDgftDisplayFile}
                      isEditMode={isEditMode}
                      editParams={editParams}
                      setImgSrc={setImgSrc}
                      setDisplayFile={setDisplayFile}
                    />
                  )}
                  {possessionType === 'death' && (
                    <DeathFields
                      control={control}
                      errors={errors}
                      watch={watch}
                      getValues={getValues}
                      setValue={setValue}
                      clearErrors={clearErrors}
                      isEditMode={isEditMode}
                      editParams={editParams}
                      possessionType={possessionType}
                    />
                  )}
                  {possessionType === 'transfer' && (
                    <TransferFields
                      control={control}
                      errors={errors}
                      watch={watch}
                      getValues={getValues}
                      setValue={setValue}
                      clearErrors={clearErrors}
                      isEditMode={isEditMode}
                      editParams={editParams}
                      reasonType={reasonType}
                      setReasonType={setReasonType}
                    />
                  )}
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
                      isEditMode={isEditMode}
                      editParams={editParams}
                    />
                  )}

                  <Divider />

                  <>
                    <Typography sx={{ mb: 6, mt: 6 }} variant='h6'>
                      Attachments
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 6 }}>
                      {/* {/ Add Attachments button /} */}
                      <Grid item xs={12} sm={4} md={3} lg={2.3}>
                        <FormControl fullWidth>
                          <Controller
                            name='attachments'
                            control={control}
                            render={({ field: { onChange, value, ...rest } }) => (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  border: '1px solid #d3d3d3',
                                  borderRadius: 1,
                                  padding: 2,
                                  cursor: 'pointer',
                                  height: '60px',
                                  width: '100%',
                                  position: 'relative'
                                }}
                              >
                                <input
                                  type='file'
                                  multiple
                                  accept='image/*,application/pdf,.doc,.docx,.xls,.xlsx'
                                  style={{
                                    opacity: 0,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer'
                                  }}
                                  {...getRootProps({ className: 'dropzone' })}
                                  onChange={e => {
                                    const files = Array.from(e.target.files)
                                    // onChange(files) // Update form state
                                    handleFileSelect(files) // Call parent handler
                                  }}
                                  {...rest}
                                />
                                <Icon icon='material-symbols-light:attach-file-add' fontSize='2rem' />
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

                  <Box sx={{ display: 'flex', justifyContent: 'end', gap: 4 }}>
                    <Button onClick={() => router.back()} size='large' type='reset' color='error' variant='outlined'>
                      Cancel
                    </Button>
                    <LoadingButton loading={btnLoader} size='large' variant='contained' type='submit'>
                      {isEditMode ? 'Save' : 'Add Entry'}
                    </LoadingButton>
                  </Box>
                </form>
              </CardContent>
            </Box>
          </Box>

          <Dialog open={isModalOpenDelete} onClose={() => setIsModalOpenDelete(false)}>
            <DialogTitle>
              <IconButton
                aria-label='close'
                onClick={() => setIsModalOpenDelete(false)}
                sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
              >
                <Icon icon='mdi:close' />
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: theme.palette.customColors.mdAntzNeutral
                  }}
                >
                  <Icon width='70px' height='70px' color={'#ff3838'} icon={'mdi:delete'} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>
                    Are you sure you want to delete this attachment?
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                  <Button
                    disabled={deleteBtnLoader}
                    onClick={() => setIsModalOpenDelete(false)}
                    variant='outlined'
                    sx={{
                      color: 'gray',
                      width: '45%'
                    }}
                  >
                    Cancel
                  </Button>

                  <LoadingButton
                    loading={deleteBtnLoader}
                    size='large'
                    variant='contained'
                    sx={{ width: '45%' }}
                    onClick={() => confirmDeleteAction()}
                  >
                    Delete
                  </LoadingButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent />
          </Dialog>
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default AddNewEntry
