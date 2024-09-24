// ** React Imports
import { useState, useEffect, useCallback, Fragment, useRef, forwardRef } from 'react'
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
import { RadioGroup, FormLabel, FormControlLabel, Radio, Button, Grid, Tooltip } from '@mui/material'
import { Select, MenuItem } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getDrugById } from 'src/lib/api/pharmacy/getDrugs'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { useRouter } from 'next/router'
import { usePariveshContext } from 'src/context/PariveshContext'
import moment from 'moment'
import { useDropzone } from 'react-dropzone'
import { useAuth } from 'src/hooks/useAuth'
import AcquisitionForm from './AcquisitionForm'
import BirthForm from './BirthForm'
import DeathForm from './DeathForm'
import TransferForm from './TransferForm'

// ** Styled Components

const schema = yup.object().shape({
  scientific_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Scientific Name is Required'),
  active: yup.string().required('Status is Required'),
  common_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Common Name is Required'),
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
  // organization_transfer: yup.string().when('possession_type', {
  //   is: 'transfer',
  //   then: () => yup.string().required('Organization name is required'),
  //   otherwise: () => yup.string().notRequired()
  // }),

  organization_transfer: yup.string().when('possession_type', {
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
  death_date: yup.date().when('possession_type', {
    is: 'death',
    then: () => yup.date().required('Date of Death is required'),
    otherwise: () => yup.date().notRequired()
  }),
  // death_animal_id: yup.string().when('possession_type', {
  //   is: 'death',
  //   then: () => yup.string().notRequired(),
  //   otherwise: () => yup.string().notRequired()
  // }),
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
  // organization_acquire: yup.string().when('possession_type', {
  //   is: 'acquisition',
  //   then: () => yup.string().required('Organization name is required'),
  //   otherwise: () => yup.string().notRequired()
  // }),

  organization_acquire: yup.string().when('possession_type', {
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
  // dgft_number: yup.string().when('possession_type', {
  //   is: 'acquisition',
  //   then: () => yup.string().required('DGFT Number is required'),
  //   otherwise: () => yup.string().notRequired()
  // }),
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
  select_appendix: yup.string().when(['possession_type', 'cites_required'], {
    is: (possession_type, cites_required) => possession_type === 'acquisition' && cites_required === 'Yes',
    then: () => yup.string().required('Select Appendix is required'),
    otherwise: () => yup.string().notRequired()
  }),
  cites_number: yup.string().when(['possession_type', 'cites_required'], {
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

const defaultValues = {
  scientific_name: '',
  common_name: '',
  active: '1',
  registrationNumber: '',
  reason_for_death: '',
  where_disposed: '',
  possession_type: '',
  animal_count: '',
  gender: '',
  transaction_date: new Date(),
  reason_for_death: '',
  death_date: null,
  organization_transfer: '',
  organization_acquire: '',
  dgft_number: '',
  cites_required: '',
  select_appendix: '',
  cites_number: '',
  death_animal_id: '',
  attachments: [],
  dgft_attachments: []
}

const AddSpeciesNewEntry = props => {
  // ** Props
  const {
    addEventSidebarOpen,
    handleSidebarClose,
    handleSubmitData,
    resetForm,
    submitLoader,
    editParams,
    speciesDetails
  } = props

  // ** States
  const auth = useAuth()
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [values, setValues] = useState(defaultValues)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const { selectedParivesh } = usePariveshContext()
  const [displayFile, setDisplayFile] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [reasonType, setReasonType] = useState(null)
  const [dgftDisplayFile, setDgftDisplayFile] = useState([])

  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const {
    reset,
    control,
    setValue,
    clearErrors,
    handleSubmit,
    watch,
    getValues,
    trigger,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async params => {
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
      organization_transfer,
      organization_acquire,
      dgft_number,
      dgft_attachments,
      cites_required,
      select_appendix,
      cites_number
    } = { ...params }

    const now = new Date()
    const selectedDate = new Date(transaction_date)
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
      payload.death_animal_id = death_animal_id
      payload.animal_count = 1
    } else {
      payload.animal_count = animal_count
    }
    if (possession_type === 'transfer') {
      payload.where_to_transfer = organization_transfer
    } else if (possession_type === 'acquisition') {
      payload.where_to_acquisition = organization_acquire
      payload.dgft_number = dgft_number
      payload.dgft_attachment = dgft_attachments
      payload.cites_required = cites_required
      if (params.cites_required === 'Yes') {
        payload.cites_appendix = select_appendix
        payload.cites_numbers = cites_number
      }
    }

    const isValid = await trigger()
    console.log('Form validity:', isValid)
    console.log('errors:', errors)

    if (!isValid) {
      console.log('Form is invalid, not submitting')
      return
    }

    console.log('Submitting data:', params)

    console.log(payload, 'payload')

    await handleSubmitData(payload)

    reset({
      ...defaultValues,
      scientific_name: values.scientific_name,
      common_name: values.common_name,
      transaction_date: new Date(), // Reset to current date and time
      attachments: [],
      dgft_attachments: []
    })
    setDisplayFile([])
    setDgftDisplayFile([])
  }

  const handleClose = () => {
    // Reset the form, but keep the preserved values
    reset({
      ...defaultValues,
      scientific_name: speciesDetails.scientific_name,
      common_name: speciesDetails.common_name
    })

    // Clear errors for all fields
    clearErrors()

    // Reset state variables
    setShowAdditionalFields(false)
    setDisplayFile([])
    setCurrentImageIndex(0)
    setReasonType(null)
    setDgftDisplayFile([])

    // Ensure the preserved values are set in the form
    setValue('scientific_name', speciesDetails.scientific_name)
    setValue('common_name', speciesDetails.common_name)

    // Call the original handleSidebarClose from props
    handleSidebarClose()
  }

  useEffect(() => {
    console.log(speciesDetails, 'scientificName')
    if (speciesDetails) {
      setValue('scientific_name', speciesDetails.scientific_name)
      setValue('common_name', speciesDetails.common_name)
    }
  }, [speciesDetails, setValue])

  useEffect(() => {
    // debugger
    console.log(speciesDetails, resetForm, 'resetForm')
    if (resetForm) {
      reset({
        ...defaultValues,
        scientific_name: speciesDetails.scientific_name,
        common_name: speciesDetails.common_name,
        transaction_date: new Date(),
        attachments: [],
        dgft_attachments: []
      })
      setDisplayFile([])
      setDgftDisplayFile([])
    }
  }, [resetForm])

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })
  const possessionType = watch('possession_type')
  useEffect(() => {
    if (possessionType === 'death') {
      setValue('animal_count', undefined)
      clearErrors('animal_count')
    } else if (possessionType === 'transfer') {
      setValue('gender', undefined)
      clearErrors('gender')
    }
  }, [watch('possession_type'), setValue, clearErrors])

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  // const { getRootProps, getInputProps } = useDropzone({
  //   multiple: true,
  //   accept: {
  //     'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  //     'application/pdf': ['.pdf'],
  //     'application/msword': ['.doc'],
  //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  //     'application/vnd.ms-excel': ['.xls'],
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  //   },
  //   onDrop: acceptedFiles => {
  //     const filePromises = acceptedFiles.map(file => {
  //       return new Promise(resolve => {
  //         const reader = new FileReader()
  //         reader.onloadend = () => {
  //           resolve({ name: file.name, fileSrc: reader.result })
  //         }
  //         reader.readAsDataURL(file)
  //       })
  //     })

  //     Promise.all(filePromises)
  //       .then(fileDetails => {
  //         setDisplayFile(prevFiles => [...prevFiles, ...fileDetails])

  //         // Update attachments in the form
  //         const currentFiles = getValues('attachments') || []
  //         setValue('attachments', [...currentFiles, ...acceptedFiles])

  //         clearErrors('attachments')
  //         setCurrentImageIndex(prevIndex => (prevIndex === 0 ? 0 : prevIndex)) // Keep current index unless it's 0
  //       })
  //       .catch(error => {
  //         console.error('Error processing files:', error)
  //       })
  //   }
  // })

  const handleFileSelect = files => {
    const filesArray = Array.isArray(files) ? files : Array.from(files)
    console.log(filesArray, 'Files Array') // Debugging line

    const filePromises = filesArray.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({ name: file.name, fileSrc: reader.result })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises)
      .then(fileDetails => {
        setDisplayFile(prevFiles => [...prevFiles, ...fileDetails])

        // Update attachments in the form
        const currentFiles = getValues('attachments') || []
        setValue('attachments', [...currentFiles, ...filesArray])

        clearErrors('attachments')
        setCurrentImageIndex(prevIndex => (prevIndex === 0 ? 0 : prevIndex)) // Keep current index unless it's 0
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

  const removeSelectedImage = index => {
    setDisplayFile(prevFiles => prevFiles.filter((_, i) => i !== index))

    // Update the attachments in the form
    const currentFiles = getValues('attachments') || []
    const updatedFiles = currentFiles.filter((_, i) => i !== index)
    setValue('attachments', updatedFiles)

    // Adjust the current image index if necessary
    if (index === currentImageIndex && displayFile.length > 1) {
      setCurrentImageIndex(prev => (prev === displayFile.length - 1 ? prev - 1 : prev))
    } else if (index < currentImageIndex) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const getIconByFileType = fileName => {
    const extension = fileName.split('.').pop().toLowerCase()
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
    if (filename.length <= maxLength) return filename
    const start = filename.slice(0, Math.floor(maxLength / 2))
    const end = filename.slice(-Math.floor(maxLength / 2))
    return `${start}...${end}`
  }

  // const BirthFields = ({ control, errors }) => {
  //   return (
  //     <>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='gender'
  //           control={control}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
  //               <MenuItem value='male'>Male</MenuItem>
  //               <MenuItem value='female'>Female</MenuItem>
  //               <MenuItem value='other'>Other</MenuItem>
  //             </TextField>
  //           )}
  //         />
  //         {errors.gender && <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='animal_count'
  //           control={control}
  //           rules={{ required: true }}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField
  //               label='Total Count*'
  //               value={value}
  //               onChange={onChange}
  //               placeholder='Enter Total Count'
  //               error={Boolean(errors.animal_count)}
  //               name='animal_count'
  //             />
  //           )}
  //         />
  //         {errors.animal_count && (
  //           <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_count?.message}</FormHelperText>
  //         )}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='transaction_date'
  //           control={control}
  //           render={({ field: { value, onChange } }) => (
  //             <SingleDatePicker
  //               fullWidth
  //               date={value}
  //               width={'100%'}
  //               dateFormat='dd/MM/yyyy'
  //               onChangeHandler={onChange}
  //               maxDate={new Date()}
  //               customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
  //             />
  //           )}
  //         />
  //         {errors.transaction_date && (
  //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
  //             {errors.transaction_date?.message}
  //           </FormHelperText>
  //         )}
  //       </FormControl>
  //     </>
  //   )
  // }

  // const DeathFields = ({ control, errors }) => {
  //   return (
  //     <>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='reason_for_death'
  //           control={control}
  //           rules={{ required: true }}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField
  //               label='Reason for Death*'
  //               value={value}
  //               onChange={onChange}
  //               placeholder='Enter Reason for Death'
  //               error={Boolean(errors.reason_for_death)}
  //               name='reason_for_death'
  //             />
  //           )}
  //         />

  //         {errors.reason_for_death && (
  //           <FormHelperText sx={{ color: 'error.main' }}>{errors.reason_for_death?.message}</FormHelperText>
  //         )}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='death_date'
  //           control={control}
  //           render={({ field: { value, onChange } }) => (
  //             <SingleDatePicker
  //               fullWidth
  //               date={value}
  //               width={'100%'}
  //               dateFormat='dd/MM/yyyy'
  //               // showTimeSelect
  //               // timeIntervals={15}

  //               onChangeHandler={onChange}
  //               maxDate={new Date()}
  //               customInput={<CustomInput label='Date of Death*' error={Boolean(errors.death_date)} />}
  //             />
  //           )}
  //         />
  //         {errors.death_date && (
  //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
  //             {errors.death_date?.message}
  //           </FormHelperText>
  //         )}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='death_animal_id'
  //           control={control}
  //           rules={{ required: true }}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField
  //               label='Animal ID (Optional)'
  //               value={value}
  //               onChange={onChange}
  //               placeholder='Enter Animal ID (Optional)'
  //               error={Boolean(errors.death_animal_id)}
  //               name='death_animal_id'
  //             />
  //           )}
  //         />

  //         {errors.death_animal_id && (
  //           <FormHelperText sx={{ color: 'error.main' }}>{errors.death_animal_id?.message}</FormHelperText>
  //         )}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='gender'
  //           control={control}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
  //               <MenuItem value='male'>Male</MenuItem>
  //               <MenuItem value='female'>Female</MenuItem>
  //               <MenuItem value='other'>Other</MenuItem>
  //             </TextField>
  //           )}
  //         />
  //         {errors.gender && <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='transaction_date'
  //           control={control}
  //           render={({ field: { value, onChange } }) => (
  //             <SingleDatePicker
  //               fullWidth
  //               date={value}
  //               width={'100%'}
  //               dateFormat='dd/MM/yyyy'
  //               // showTimeSelect
  //               // timeIntervals={15}
  //               onChangeHandler={onChange}
  //               maxDate={new Date()}
  //               customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
  //             />
  //           )}
  //         />
  //         {errors.transaction_date && (
  //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
  //             {errors.transaction_date?.message}
  //           </FormHelperText>
  //         )}
  //       </FormControl>
  //     </>
  //   )
  // }
  // const TransferFields = ({ control, errors }) => {
  //   return (
  //     <>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='organization_transfer'
  //           control={control}
  //           rules={{ required: true }}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField
  //               label='Which organization would you transfer?'
  //               value={value}
  //               type='text'
  //               onChange={onChange}
  //               placeholder='Which organization would you transfer?'
  //               error={Boolean(errors.organization_transfer)}
  //               name='organization_transfer'
  //             />
  //           )}
  //         />

  //         {errors.organization_transfer && (
  //           <FormHelperText sx={{ color: 'error.main' }}>{errors.organization_transfer?.message}</FormHelperText>
  //         )}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='gender'
  //           control={control}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
  //               <MenuItem value='male'>Male</MenuItem>
  //               <MenuItem value='female'>Female</MenuItem>
  //               <MenuItem value='other'>Other</MenuItem>
  //             </TextField>
  //           )}
  //         />
  //         {errors.gender && <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>}
  //       </FormControl>

  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='animal_count'
  //           control={control}
  //           rules={{ required: true }}
  //           render={({ field: { value, onChange } }) => (
  //             <TextField
  //               label='Total Count*'
  //               value={value}
  //               onChange={onChange}
  //               placeholder='Enter Total Count'
  //               error={Boolean(errors.animal_count)}
  //               name='animal_count'
  //             />
  //           )}
  //         />
  //         {errors.animal_count && (
  //           <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_count?.message}</FormHelperText>
  //         )}
  //       </FormControl>
  //       <FormControl fullWidth sx={{ mb: 6 }}>
  //         <Controller
  //           name='transaction_date'
  //           control={control}
  //           render={({ field: { value, onChange } }) => (
  //             <SingleDatePicker
  //               fullWidth
  //               date={value}
  //               width={'100%'}
  //               dateFormat='dd/MM/yyyy'
  //               onChangeHandler={onChange}
  //               maxDate={new Date()}
  //               customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
  //             />
  //           )}
  //         />
  //         {errors.transaction_date && (
  //           <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
  //             {errors.transaction_date?.message}
  //           </FormHelperText>
  //         )}
  //       </FormControl>
  //     </>
  //   )
  // }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400], display: 'flex', flexDirection: 'column' } }}
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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} New Entry</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>

      <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
        <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6), height: '100%' }}>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='scientific_name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Scientific Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Scientific Name'
                  error={Boolean(errors.scientific_name)}
                  name='scientific_name'
                  disabled
                />
              )}
            />
            {errors.scientific_name && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.scientific_name.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='common_name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Common Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Common Name'
                  error={Boolean(errors.common_name)}
                  name='common_name'
                  disabled
                />
              )}
            />
            {errors.common_name && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.common_name.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='possession_type'
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextField
                  select
                  label='Reason*'
                  placeholder='Reason'
                  value={value}
                  onChange={e => {
                    const value = e.target.value
                    onChange(e)
                    setReasonType(value)
                    setValue('gender', '')
                    setValue('animal_count', '')
                    setValue('transaction_date', new Date())
                    setValue('reason_for_death', '')
                    setValue('death_date', null)
                    setValue('organization_transfer', '')
                    setValue('organization_acquire', '')
                    setValue('dgft_number', '')
                    setValue('cites_required', '')
                    setValue('select_appendix', '')
                    setValue('cites_number', '')
                    setValue('death_animal_id', '')
                    setValue('attachments', [])
                    setValue('dgft_attachments', [])
                    setDisplayFile([])
                    setDgftDisplayFile([])
                  }}
                  error={Boolean(errors.reason)}
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
          {(possessionType === 'birth' || !possessionType) && <BirthForm control={control} errors={errors} />}
          {possessionType === 'death' && <DeathForm control={control} errors={errors} />}
          {possessionType === 'transfer' && <TransferForm control={control} errors={errors} />}
          {possessionType === 'acquisition' && (
            <AcquisitionForm
              control={control}
              errors={errors}
              watch={watch}
              getValues={getValues}
              setValue={setValue}
              getIconByFileType={getIconByFileType}
              truncateFilename={truncateFilename}
              reasonType={reasonType}
              dgftDisplayFile={dgftDisplayFile}
              setDgftDisplayFile={setDgftDisplayFile}
            />
          )}
          <>
            <Typography sx={{ mb: 6, mt: 6 }} variant='h6'>
              Attachments
            </Typography>
            <Grid container spacing={2} sx={{ mb: 6 }}>
              {/* {/ Add Attachments button /} */}
              <Grid item xs={12} sm={12} md={7.2} lg={7.2}>
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
                {/* <FormControl fullWidth>
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
                          gap: 1,
                          border: '1px solid #d3d3d3',
                          borderRadius: 1,
                          padding: 4,
                          cursor: 'pointer',
                          height: '56px',
                          width: '100%' // Make sure it fills its grid item
                        }}
                      >
                        <Icon icon='material-symbols-light:attach-file-add' fontSize='2rem' size={3} />

                        <Typography variant='body1' color='textPrimary'>
                          Add Attachments
                        </Typography>
                      </Box>
                    )}
                  />
                  {errors.attachments && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.attachments?.message}</FormHelperText>
                  )}
                </FormControl> */}
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
                          height: '56px', // Fixed height for consistency
                          bgcolor: isImage ? '#f0f0f0' : getIconByFileType(src?.name)?.bgColor
                        }}
                      >
                        {isImage ? (
                          <img
                            style={{
                              height: '56px',
                              width: '56px',
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
                          onClick={() => removeSelectedImage(index)}
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
          {editParams?.id !== null ? (
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
          ) : null}

          {/* <Box sx={{ flexGrow: 1 }} /> */}
        </Box>

        <Box
          sx={{
            position: 'sticky',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            // backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            bottom: 0,
            backgroundColor: '#FFFFFF',
            boxShadow: '0px -4px 6px rgba(0, 0, 0, 0.25)',
            zIndex: 1000
          }}
        >
          {/* <Button onClick={onSubmit}> save</Button> */}
          <Fragment>
            <Button size='large' variant='outlined' sx={{ mr: 2, width: '100%' }} onClick={handleClose}>
              &nbsp; Cancel
            </Button>
            <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader} sx={{ width: '100%' }}>
              Submit
            </LoadingButton>
          </Fragment>
        </Box>
        {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box> */}
      </form>
    </Drawer>
  )
}

export default AddSpeciesNewEntry
