import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useFormScrollToError } from 'src/hooks/useFormScrollToError'
import { useContext } from 'react'
import Image from 'next/image'

import {
  Autocomplete,
  Avatar,
  Box,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'

import dayjs from 'dayjs'
import moment from 'moment'

import { useDropzone } from 'react-dropzone'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import EnclosureSelectionDialog from 'src/components/egg/EnclosureSelectionDialog'
import AnimalParentCard from '../../../utility/animalParentCard'
import imageUploader from 'public/images/imageUploader/imageUploader.png'

import { AddEggStatusAndCondition, GetEggMaster } from 'src/lib/api/egg/egg'
import {
  createAnimal,
  getAccessionType,
  getAnimalGetconfigs,
  getAnimalMaster,
  getAnimalOwnershipTerms,
  getMasterInstitutes,
  getMastersOrganization,
  getTaxonomyList
} from 'src/lib/api/egg/egg/createAnimal'

const ConditionSlider = ({
  getActivityLogsFunc,
  eggDetails,
  setOpenDrawer,
  openDrawer,
  eggId,
  getDetails,
  GetGalleryImgList
}) => {
  const theme = useTheme()
  const [hatched, setHatched] = useState('normal_hatch')
  const fileInputRef = useRef(null)
  const [imgSrc, setImgSrc] = useState([])

  const [eggStaged, setEggStaged] = useState([])
  const [eggMaster, setEggMaster] = useState([])
  const [eggMasterLoading, setEggMasterLoading] = useState(true)
  const [displayFile, setDisplayFile] = useState('')
  const [imgArr, setImgArr] = useState([])
  const [statusId, setStatusId] = useState('')
  const [isAnimal, setIsAnimal] = useState(false)
  const [loader, setLoader] = useState(false)

  const [defaultSpecies, setDefaultSpecies] = useState(null)
  const [taxonomyList, setTaxonomyList] = useState([])
  const [accessionTypeList, setAccessionTypeList] = useState([])
  const [institutesList, setInstitutesList] = useState([])
  const [animalOwnershipTermsList, setAnimalOwnershipTermsList] = useState([])
  const [mastersOrganizationList, setMastersOrganizationList] = useState([])
  const [localIdentifierTypeList, setLocalIdentifierTypeList] = useState([])
  const [collectionTypeList, setCollectionTypeList] = useState([])
  const [sexingTypeList, setSexingTypeList] = useState([])
  const [lifeStageList, setLifeStageList] = useState([])
  const [contraceptionTypeList, setContraceptionTypeList] = useState([])
  const [open, setOpen] = useState(false)
  const [enclosureData, setEnclosureData] = useState({})

  const authData = useContext(AuthContext)
  const animal_record_access = authData?.userData?.roles?.settings?.collection_animal_record_access

  const getEggMasterData = async () => {
    try {
      setEggMasterLoading(true)
      await GetEggMaster().then(res => {
        if (res.success) {
          setEggMaster(res?.data)
        }
      })
    } catch (e) {
      console.error(e)
    } finally {
      setEggMasterLoading(false)
    }
  }

  useEffect(() => {
    try {
      getEggMasterData()
    } catch (error) {
      console.error('error :>> ', error)
    }
  }, [])

  const defaultValues = {
    current_state: '',
    select_stage: '',
    hatched_method_Btn: '',
    comment: '',
    shell_thickness: '',
    assisted_by: '',
    image: [],
    hatched_date: null,

    ////////////////
    species: '',
    accessionType: '',
    animalOwnershipTerms: '',
    accessionDate: null,
    collectionType: '',
    enclosure_id: '',
    sextype: '',
    mastersOrganization: '',
    institution: '',
    parentMother: '',
    parentFather: '',
    birthDate: null,
    age: '',
    type: '',
    localIdentifierType: '',
    localIdentifier: '',
    sexingType: '',
    lifeStage: '',
    contraceptionType: '',
    necropsy_Btn: 0
  }

  const schema = yup.object().shape(
    isAnimal
      ? {
          current_state: yup.string().required('State is required'),
          select_stage: eggStaged?.length > 0 ? yup.string().required('Stage is required') : yup.string().notRequired(),
          assisted_by:
            hatched === 'assisted_hatch'
              ? yup.string().trim().required('Assisted by is required')
              : yup.string().notRequired(),

          ////////////////////////////////////////////////////////////////////
          species: yup.string().required('Species / Taxonomy is required'),
          accessionType: yup.string().required('Accession type is required'),
          institution: yup
            .string()
            .test(
              'is-required-if-accessionType-is-2',
              'Institution is required when accession type is from institute',
              function (value) {
                const { accessionType } = this.parent
                if (accessionType === '2') {
                  return !!value
                }

                return true
              }
            ),
          accessionDate: yup.string().required('Accession date is required'),
          hatched_date: yup
            .mixed()

            // .nullable()
            .required('Hatched date is required')
            .test('valid-date', 'Invalid date', value => value && dayjs(value).isValid())
            .test('not-in-future', 'Hatched date cannot be in the future', value =>
              value ? dayjs(value).isBefore(dayjs().add(1, 'day'), 'day') : true
            ),

          // hatched_date: yup.string().required('Hatched date is required'),
          collectionType: yup.string().required('Collection type is required'),
          enclosure_id: yup.string().required('Enclosure is required'),
          sextype: yup.string().required('Sex type is required'),
          birthDate: yup.string().required('Birth date is required'),
          localIdentifierType: yup.string().required('Local identifier type is required'),
          localIdentifier: yup
            .string()
            .test(
              'is-required-if-localIdentifierType-is-not-empty',
              'Local identifier is required when local identifier type is selected',
              function (value) {
                const { localIdentifierType } = this.parent
                if (localIdentifierType && localIdentifierType.trim() !== '') {
                  return !!value
                }

                return true
              }
            )
        }
      : {
          current_state: yup.string().required('State is required'),
          select_stage: eggStaged?.length > 0 ? yup.string().required('Stage is required') : yup.string().notRequired(),
          assisted_by:
            hatched === 'assisted_hatch'
              ? yup.string().trim().required('Assisted by is required')
              : yup.string().notRequired()
        }
  )

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    clearErrors,
    watch,
    setError,
    reset,
    resetField,
    formState: { errors }
  } = useForm({
    defaultValues: {
      ...defaultValues,
      hatched_date: null
    },

    // defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Auto-generate field priority from defaultValues (smart approach!)
  const fieldPriority = Object.keys(defaultValues)

  const { getFieldRef, createOnError, RefController } = useFormScrollToError(fieldPriority)

  const statusID = watch('current_state')

  useEffect(() => {
    if (statusID) {
      setStatusId(statusID)
      const filteredEggStatus = eggMaster?.egg_state?.filter(status => status?.egg_status_id === statusID)
      setEggStaged(filteredEggStatus)
    }
  }, [statusID, eggMaster])

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: acceptedFiles => {
      acceptedFiles.forEach(file => {
        const reader = new FileReader()

        reader.onload = () => {
          setImgSrc(prev => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
      })

      const fileNames = acceptedFiles.map(file => file.name).join(', ')
      setDisplayFile(fileNames)

      setImgArr(prev => [...prev, ...acceptedFiles])

      setValue('image', acceptedFiles)
      clearErrors('image')
    }
  })

  const onError = createOnError()

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const handleInputImageChange = file => {
    const { files } = file.target

    if (files && files.length !== 0) {
      Array.from(files).forEach(fileItem => {
        const reader = new FileReader()

        reader.onload = () => {
          setImgSrc(prev => [...prev, reader.result])
        }

        reader.readAsDataURL(fileItem)

        setImgArr(prev => [...prev, fileItem])
      })

      const fileNames = Array.from(files)
        .map(f => f.name)
        .join(', ')
      setDisplayFile(fileNames)

      setValue('image', files)
      clearErrors('image')
    }
  }

  // const removeSelectedImage = index => {
  //   setImgSrc(prevImages => prevImages.filter((_, i) => i !== index))
  //   setValue('image', '')
  // }

  const removeSelectedImage = index => {
    setImgSrc(prevImages => prevImages.filter((_, i) => i !== index))
    setImgArr(prevArr => prevArr.filter((_, i) => i !== index))

    setValue(
      'image',
      imgArr.filter((_, i) => i !== index)
    )

    if (imgArr.length === 1) {
      setDisplayFile('')
      setValue('image', '')
    } else {
      setDisplayFile(prev => {
        const updatedFiles = prev.split(', ').filter((_, i) => i !== index)

        return updatedFiles.join(', ')
      })
    }
  }

  const onSubmit = values => {
    const combinedDateTime = dayjs(values.hatched_date)
      .hour(dayjs().hour())
      .minute(dayjs().minute())
      .second(dayjs().second())
      .format('YYYY-MM-DD HH:mm:ss')

    if (Number(getValues('current_state')) === 4 && values.hatched_date === null) {
      setError('hatched_date', {
        type: 'manual',
        message: 'Hatched date is required'
      })

      return
    }
    try {
      setLoader(true)
      let payload
      if (Number(getValues('current_state')) === 1) {
        payload = {
          egg_id: eggId,
          egg_status_id: getValues('current_state'),
          comment: getValues('comment'),
          egg_attachment: imgArr
        }
      } else if (Number(getValues('current_state')) === 2) {
        payload = {
          egg_id: eggId,
          egg_status_id: getValues('current_state'),
          egg_state_id: getValues('select_stage'),
          comment: getValues('comment'),
          egg_attachment: imgArr
        }
      } else if (Number(getValues('current_state')) === 3) {
        payload = {
          egg_id: eggId,
          egg_status_id: getValues('current_state'),
          egg_state_id: getValues('select_stage'),
          comment: getValues('comment'),
          egg_attachment: imgArr,
          is_necropsy_needed: values?.necropsy_Btn
        }

        // console.log('payload 3 :>> ', payload)
      } else if (Number(getValues('current_state')) === 4) {
        payload = {
          egg_id: eggId,
          egg_status_id: getValues('current_state'),
          hatched_method: hatched,
          egg_shell_thickness: getValues('shell_thickness'),
          comment: getValues('comment'),
          egg_assisted_by: getValues('assisted_by'),
          egg_attachment: imgArr,

          // hatched_date: values.hatched_date ? dayjs(values.hatched_date).format('YYYY-MM-DD') : null
          hatched_date: values.hatched_date ? combinedDateTime : null
        }
      }

      const animalPayload = {
        accession_type: values?.accessionType,
        accession_date: moment(values?.accessionDate).format('YYYY-MM-DD'),
        taxonomy_id: values?.species,
        enclosure_id: values?.enclosure_id,
        sex: values?.sextype,
        collection_type: values?.collectionType,
        organization_id: values?.mastersOrganization,
        from_institution: values?.institution,
        birth_date: moment(values?.birthDate).format('YYYY-MM-DD'),
        local_id_type: values?.localIdentifierType,
        local_id: values?.localIdentifier,
        age: values?.age,
        parent_female: values?.parentMother,
        parent_male: values?.parentFather,
        ownership_term: values?.animalOwnershipTerms,
        sexing_type: values?.sexingType,
        life_stage: values?.lifeStage,
        contraception_type: values.contraceptionType,
        description: '',
        form_type: 'single',
        zoo_id: '',
        site_id: enclosureData?.site_id,
        section_id: enclosureData?.section_id,
        egg_id: eggId
      }

      if (isAnimal && statusID === '4') {
        AddEggStatusAndCondition(payload).then(res => {
          if (res?.success) {
            // setLoader(false)
            Toaster({ type: 'success', message: res.message })
            createAnimal(animalPayload).then(res => {
              if (res.success) {
                setLoader(false)
                setDefaultSpecies(null)

                reset()
                setImgSrc('')
                if (getDetails) {
                  getDetails(eggId)
                }
                if (GetGalleryImgList) {
                  GetGalleryImgList()
                }
                if (getActivityLogsFunc) {
                  getActivityLogsFunc()
                }

                setOpenDrawer(false)

                Toaster({ type: 'success', message: res.message })
              } else {
                setLoader(false)

                // setDefaultSpecies(null)
                Toaster({ type: 'error', message: res.message })
              }
            })
          } else {
            setLoader(false)

            // setDefaultSpecies(null)
            Toaster({ type: 'error', message: res?.message })
          }
        })
      } else {
        AddEggStatusAndCondition(payload).then(res => {
          if (res.success) {
            setLoader(false)

            setImgSrc('')
            reset()

            if (getDetails) {
              getDetails(eggId)
            }
            if (GetGalleryImgList) {
              GetGalleryImgList()
            }
            if (getActivityLogsFunc) {
              getActivityLogsFunc()
            }
            setOpenDrawer(false)
            Toaster({ type: 'success', message: res.message })
          } else {
            setLoader(false)
            Toaster({ type: 'error', message: res.message })
          }
        })
      }
    } catch (error) {
      setLoader(false)
      if (getDetails) {
        getDetails(eggId)
      }
      Toaster({ type: 'error', message: 'An error occurred while creating animal' })
    }
  }

  const handleCancel = () => {
    setImgSrc('')
    reset()
    setOpenDrawer(false)
  }

  const handleChangeSwitch = event => {
    setIsAnimal(event.target.checked)
  }

  const handleChange = e => {
    if (e.target.value >= 0) {
      setValue('shell_thickness', e.target.value)
    } else {
      setValue('shell_thickness', Math.abs(e.target.value))
    }
  }

  useEffect(() => {
    setValue('current_state', eggDetails?.egg_status_id)
    setValue('select_stage', eggDetails?.egg_state_id)
    setValue('necropsy_Btn', eggDetails?.is_necropsy_needed)
    setValue('hatched_date', eggDetails?.hatched_date ? dayjs(eggDetails.hatched_date) : undefined)
  }, [eggDetails])

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'hatched_date' && value?.hatched_date) {
        setValue('birthDate', value.hatched_date)
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

  const getAccessionTypeFunc = () => {
    try {
      getAccessionType().then(res => {
        if (res.is_success) {
          setAccessionTypeList(res?.data)
        }
      })
    } catch (error) {}
  }

  const getMasterInstitutesFunc = () => {
    try {
      getMasterInstitutes().then(res => {
        if (res.success) {
          setInstitutesList(res?.data)
        }
      })
    } catch (error) {}
  }

  const getMastersOrganizationFunc = () => {
    try {
      getMastersOrganization().then(res => {
        if (res.length) {
          setMastersOrganizationList(res)
        }
      })
    } catch (error) {}
  }

  const getAnimalOwnershipTermsFunc = () => {
    try {
      getAnimalOwnershipTerms().then(res => {
        if (res.success) {
          setAnimalOwnershipTermsList(res?.data)
        }
      })
    } catch (error) {}
  }

  const getAnimalGetconfigsFunc = () => {
    try {
      getAnimalGetconfigs().then(res => {
        if (res.success) {
          setLocalIdentifierTypeList(res?.data?.animal_indetifier)
          setCollectionTypeList(res?.data?.collection_type)
        }
      })
    } catch (error) {}
  }

  const getAnimalMasterFunc = () => {
    try {
      getAnimalMaster().then(res => {
        if (res.success) {
          setSexingTypeList(res?.data?.sexing_types)
          setLifeStageList(res?.data?.life_stage)
          setContraceptionTypeList(res?.data?.contraception_status)
        }
      })
    } catch (error) {}
  }

  const getTaxonomyListFunc = q => {
    try {
      getTaxonomyList(q).then(res => {
        if (res.success) {
          setTaxonomyList(res?.data)
        }
      })
    } catch (error) {}
  }

  const searchSpecies = useCallback(
    debounce(async search => {
      try {
        getTaxonomyListFunc({ search })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const getEnclosureDetails = params => {
    setEnclosureData(params)
    setValue('enclosure_id', params?.enclosure_id)
  }

  const closeEnclosure = () => {
    setEnclosureData({})
    resetField('enclosure_id', '')
  }

  const handleClose = () => {
    setOpen(false)
  }

  const checkAddPermission = () => {
    if (animal_record_access === 'ADD' || animal_record_access === 'EDIT' || animal_record_access === 'DELETE') {
      return true
    } else {
      return false
    }
  }

  useEffect(() => {
    if (eggDetails) {
      if (Number(eggDetails?.enclosure_data?.length) === 1) {
        setValue('enclosure', eggDetails?.enclosure_data[0]?.enclosure_id)
      }
      if (Number(eggDetails?.parent_list?.father_list?.length) === 1) {
        setValue('parentFather', eggDetails?.parent_list?.father_list[0]?._id)
      }
      if (Number(eggDetails?.parent_list?.mother_list?.length) === 1) {
        setValue('parentMother', eggDetails?.parent_list?.mother_list[0]?._id)
      }
    }
    const currentDate = dayjs()
    setValue('accessionDate', currentDate)

    // setValue('birthDate', currentDate)
    if (eggDetails?.parent_list?.mother_list?.length === 1 && eggDetails?.parent_list?.father_list.length === 1) {
      if (
        eggDetails?.parent_list?.mother_list[0].taxonomy_id === eggDetails?.parent_list?.father_list[0]?.taxonomy_id
      ) {
        setValue('species', eggDetails?.parent_list?.mother_list[0]?.taxonomy_id)
        setDefaultSpecies(eggDetails?.parent_list?.mother_list[0])
      }
    }
  }, [eggDetails])

  useEffect(() => {
    getAccessionTypeFunc()
    getMasterInstitutesFunc()
    getMastersOrganizationFunc()
    getAnimalOwnershipTermsFunc()
    getAnimalGetconfigsFunc()
    getAnimalMasterFunc()
    getTaxonomyListFunc()
  }, [])

  return (
    <>
      <Drawer
        anchor='right'
        open={openDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%', overflowY: 'auto' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',
              bgcolor: theme.palette.customColors.lightBg
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-comment-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'>State & Condition</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <form onSubmit={handleSubmit(onSubmit, onError)}>
              <Box className='sidebar-body' sx={{ px: '24px', overflowY: 'auto' }}>
                <Box
                  sx={{
                    background: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    border: 1,
                    borderColor: theme.palette.customColors.OutlineVariant,
                    py: '20px',
                    px: '16px'
                  }}
                  fullWidth
                >
                  <FormControl sx={{ width: '100%', mb: 4 }}>
                    <InputLabel id='current_state'>{eggMasterLoading ? 'Loading...' : 'Select State*'}</InputLabel>
                    <Controller
                      name='current_state'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='current_state'
                          value={eggMasterLoading ? '' : value}
                          label='Current State'
                          onChange={onChange}
                          labelId='current_state'
                          error={Boolean(errors?.current_state)}
                          ref={getFieldRef('current_state')}
                        >
                          {eggMaster?.egg_status?.map(status => (
                            <MenuItem key={status?.id} value={status?.id}>
                              {status?.egg_status}
                            </MenuItem>
                          ))}
                          {eggMasterLoading && <MenuItem>Loading...</MenuItem>}
                        </Select>
                      )}
                    />
                    {errors?.current_state && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                    )}
                  </FormControl>
                  {eggStaged?.length > 0 && (
                    <FormControl sx={{ width: '100%' }}>
                      <InputLabel id='select_stage'>
                        {statusID === '3' ? 'Select Reason* ' : 'Select Stage* '}
                      </InputLabel>
                      <Controller
                        name='select_stage'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='select_stage'
                            label='Select Stage'
                            value={value}
                            onChange={onChange}
                            labelId='select_stage'
                            error={Boolean(errors?.select_stage)}
                            ref={getFieldRef('select_stage')}
                          >
                            {eggStaged?.map(stage => (
                              <MenuItem key={stage?.id} value={stage?.id}>
                                {stage?.egg_state}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors?.select_stage && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.select_stage?.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}

                  {statusID === '4' && (
                    <>
                      <FormControl sx={{ mb: 4 }} fullWidth>
                        <RadioGroup
                          aria-labelledby='demo-row-radio-buttons-group-label'
                          name='hatched_method_Btn'
                          sx={{ display: 'flex', justifyContent: 'center' }}
                          value={hatched}
                          ref={getFieldRef('accessionType')}
                          onChange={e => setHatched(e.target.value)}
                        >
                          <Box sx={{ display: 'flex', gap: '24px' }}>
                            <Box
                              error={Boolean(errors?.hatched_method_Btn)}
                              sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 2,
                                border: `1px solid ${theme.palette.customColors.MuiFieldBorder}`,
                                borderRadius: '10px',
                                width: '100%',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Typography
                                sx={{
                                  ml: 3
                                }}
                              >
                                Normal Hatch
                              </Typography>
                              <FormControlLabel value='normal_hatch' control={<Radio />} />
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                border: `1px solid ${theme.palette.customColors.MuiFieldBorder}`,
                                gap: 2,
                                borderRadius: '10px',
                                width: '100%',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Typography
                                sx={{
                                  ml: 3
                                }}
                              >
                                Assisted Hatch
                              </Typography>
                              <FormControlLabel value='assisted_hatch' control={<Radio />} />
                            </Box>
                          </Box>
                        </RadioGroup>
                        {errors?.hatched_method_Btn && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.hatched_method_Btn?.message}
                          </FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <Controller
                          name='shell_thickness'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              error={Boolean(errors?.shell_thickness)}
                              value={value}
                              type='number'
                              label='Enter Shell Thickness'
                              name='shell_thickness'
                              onChange={handleChange}
                              placeholder=''
                              sx={{
                                width: '100%',
                                mr: 12,

                                // Hiding the spinner controls
                                '& input[type=number]': {
                                  '-moz-appearance': 'textfield'
                                },
                                '& input[type=number]::-webkit-outer-spin-button': {
                                  '-webkit-appearance': 'none',
                                  margin: 0
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                  '-webkit-appearance': 'none',
                                  margin: 0
                                }
                              }}
                              slotProps={{
                                input: {
                                  endAdornment: <InputAdornment position='end'>mm</InputAdornment>
                                }
                              }}
                              ref={getFieldRef('weight')}
                            />
                          )}
                        />
                        {errors.shell_thickness && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.shell_thickness?.message}
                          </FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth sx={{}}>
                        <Controller
                          name='hatched_date'
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                label='Hatched Date *'
                                value={value || null}
                                onChange={onChange}
                                maxDate={dayjs()}
                                minDate={eggDetails?.lay_date ? dayjs(eggDetails.lay_date) : undefined}
                                format='DD/MM/YYYY'
                                slotProps={{
                                  textField: {
                                    fullWidth: true,

                                    // Keep only helper text in red; don't color label/outline
                                    error: false,
                                    helperText: errors?.hatched_date?.message || '',
                                    FormHelperTextProps: {
                                      sx: { color: 'error.main' }
                                    },
                                    InputLabelProps: {
                                      // sx: { color: 'inherit' }
                                    }
                                  }
                                }}
                                ref={getFieldRef('hatched_date')}
                              />
                            </LocalizationProvider>
                          )}
                        />
                      </FormControl>

                      {hatched === 'assisted_hatch' && (
                        <FormControl fullWidth sx={{ mt: 4 }}>
                          <Controller
                            name='assisted_by'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                error={Boolean(errors?.assisted_by)}
                                value={value}
                                label='Assisted by*'
                                name='assisted_by'
                                onChange={onChange}
                                placeholder=''
                                sx={{ width: '100%', mr: 12 }}
                                ref={getFieldRef('assistedBy')}
                              />
                            )}
                          />
                          {errors.assisted_by && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.assisted_by?.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    </>
                  )}
                </Box>

                <Box
                  fullWidth
                  sx={{
                    mt: 6,
                    mb: isAnimal || statusID === '3' ? 3 : 35,
                    background: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    border: 1,
                    borderColor: theme.palette.customColors.OutlineVariant,
                    py: '20px',
                    px: '16px'
                  }}
                >
                  <FormControl fullWidth>
                    <Controller
                      name='comment'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          error={Boolean(errors?.comment)}
                          value={value}
                          label='Enter Comment'
                          name='comment'
                          onChange={onChange}
                          placeholder=''
                          multiline
                          rows={3}
                          sx={{ width: '100%', mr: 12, mb: 3 }}
                          ref={getFieldRef('comment')}
                        />
                      )}
                    />
                    {errors.comment && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.comment?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <Grid container>
                    {/* {imgSrc !== '' ? null : ( */}
                    <Grid item size={{ md: 12, sm: 12, xs: 12 }}>
                      <input
                        type='file'
                        multiple
                        accept='image/*'
                        onChange={e => handleInputImageChange(e)}
                        style={{ display: 'none' }}
                        name='image'
                        ref={fileInputRef}
                      />

                      <Box
                        {...getRootProps({ className: 'dropzone' })}
                        onClick={handleAddImageClick}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          height: 70,
                          border: `2px solid ${theme.palette.customColors.trackBg}`,
                          borderRadius: 1,
                          padding: 3
                        }}
                      >
                        <Image alt={'filename'} src={imageUploader} width={50} height={50} />

                        <Typography>Drop your image here</Typography>
                      </Box>
                    </Grid>
                    {/* )} */}
                    <Grid item size={{ md: 12, sm: 12, xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Stack direction='row' sx={{ px: 0, display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
                        {imgSrc?.length > 0 &&
                          imgSrc?.map((img, index) => (
                            <Box
                              key={index}
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
                                src={typeof img === 'string' ? img : img}
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
                                  color={theme.palette.primary.contrastText}
                                  onClick={() => removeSelectedImage(index)}
                                >
                                  {' '}
                                </Icon>
                              </Box>
                            </Box>
                          ))}
                      </Stack>
                    </Grid>
                  </Grid>
                  {statusID === '4' && checkAddPermission() && (
                    <Box sx={{ mt: 3, p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 500 }}>Add this as an animal</Typography>

                      <FormControlLabel
                        control={
                          <Switch checked={isAnimal} onChange={handleChangeSwitch} name='mySwitch' color='primary' />
                        }
                      />
                    </Box>
                  )}
                </Box>

                {statusID === '3' && (
                  <Box
                    sx={{
                      p: 4,
                      mt: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      mb: 35,
                      bgcolor: theme.palette.primary.contrastText,
                      borderRadius: '8px',
                      border: 1,
                      borderColor: theme.palette.customColors.OutlineVariant
                    }}
                  >
                    <Typography variant='h6'>Necropsy Needed ?</Typography>

                    <Stack>
                      <FormControl>
                        <Controller
                          name='necropsy_Btn'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <RadioGroup
                              row
                              aria-labelledby='demo-row-radio-buttons-group-label'
                              value={value}
                              name='necropsy_Btn'
                              sx={{ display: 'flex', flexDirection: 'row', gap: 3, justifyContent: 'space-between' }}
                              onChange={onChange}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  flexGrow: 1,
                                  gap: 2,
                                  border: 1,
                                  borderColor: theme.palette.customColors.OutlineVariant,
                                  p: 2,
                                  borderRadius: '5px',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <Typography>Yes</Typography>
                                <FormControlLabel value={1} control={<Radio />} />
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  flexGrow: 1,
                                  gap: 2,
                                  border: 1,
                                  borderColor: theme.palette.customColors.OutlineVariant,
                                  p: 2,
                                  borderRadius: '5px',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <Typography>No</Typography>

                                <FormControlLabel value={0} control={<Radio />} />
                              </Box>
                            </RadioGroup>
                          )}
                        ></Controller>
                      </FormControl>
                    </Stack>
                  </Box>
                )}

                {isAnimal && statusID === '4' && checkAddPermission() && (
                  <Box
                    sx={{
                      mb: 35
                    }}
                  >
                    <Typography sx={{ fontSize: 20, fontWeight: 500, mb: 2 }}>Add Animal Details</Typography>
                    <Box
                      fullWidth
                      sx={{
                        background: theme.palette.primary.contrastText,
                        borderRadius: '8px',
                        border: 1,
                        borderColor: theme.palette.customColors.OutlineVariant,
                        py: '20px',
                        px: '16px'
                      }}
                    >
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        {/* <InputLabel id='species'>Species / Taxonomy</InputLabel> */}
                        <Controller
                          name='species'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Autocomplete
                              ref={getFieldRef('species')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderColor: Boolean(errors.species) && 'red',
                                  color: 'rgba(76, 78, 100, 0.6)'
                                },
                                '& .MuiAutocomplete-input': {
                                  color: 'rgba(76, 78, 100, 0.87)'
                                }
                              }}
                              loading={!taxonomyList?.length}
                              name='species'
                              value={defaultSpecies}
                              disablePortal
                              placeholder='Species / Taxonomy'
                              id='species'
                              options={taxonomyList?.length > 0 ? taxonomyList : []}
                              getOptionLabel={option => `${option.common_name} (${option.scientific_name})`}
                              isOptionEqualToValue={(option, value) => option?.tsn === value?.tsn}
                              onChange={(e, val) => {
                                if (val === null) {
                                  setDefaultSpecies(null)

                                  return onChange('')
                                } else {
                                  setDefaultSpecies(val)

                                  return onChange(val.tsn)
                                }
                              }}
                              renderInput={params => (
                                <TextField
                                  onChange={e => {
                                    searchSpecies(e.target.value)
                                  }}
                                  {...params}
                                  label='Species / Taxonomy *'
                                  placeholder='Select Species / Taxonomy'
                                  error={Boolean(errors.species)}
                                  sx={{
                                    '& .MuiInputLabel-root': {
                                      color: 'rgba(76, 78, 100, 0.6)'
                                    }
                                  }}
                                />
                              )}
                            />
                          )}
                        />
                        {errors?.species && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.species?.message}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='accessionType'>Accession Type *</InputLabel>
                        <Controller
                          name='accessionType'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='accessionType'
                              value={value}
                              label='Accession Type *'
                              onChange={onChange}
                              labelId='accessionType'
                              error={Boolean(errors?.accessionType)}
                              ref={getFieldRef('accessionType')}
                            >
                              {accessionTypeList?.map(val => (
                                <MenuItem key={val?.accession_id} value={val?.accession_id}>
                                  {val?.accession_type}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.accessionType && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.accessionType?.message}</FormHelperText>
                        )}
                      </FormControl>
                      {Number(watch('accessionType')) === 2 && (
                        <FormControl fullWidth sx={{ mb: 4 }}>
                          <InputLabel id='institution'>Institution*</InputLabel>
                          <Controller
                            name='institution'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='institution'
                                value={value}
                                label={'Institution*'}
                                onChange={onChange}
                                labelId='institution'
                                error={Boolean(errors?.institution)}
                                ref={getFieldRef('institution')}
                              >
                                {institutesList?.map(val => (
                                  <MenuItem key={val?.id} value={val?.id}>
                                    {val?.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          {errors?.institution && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.institution?.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='animalOwnershipTerms'>Ownership Term</InputLabel>
                        <Controller
                          name='animalOwnershipTerms'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='animalOwnershipTerms'
                              value={value}
                              label='Ownership Terms'
                              onChange={onChange}
                              labelId='animalOwnershipTerms'
                              error={Boolean(errors?.animalOwnershipTerms)}
                              ref={getFieldRef('animalOwnershipTerms')}
                            >
                              {animalOwnershipTermsList?.map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.label}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.animalOwnershipTerms && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.animalOwnershipTerms?.message}
                          </FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <Controller
                          name='accessionDate'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                sx={{ width: '100%', '& .MuiIconButton-edgeEnd': { display: 'block' } }}
                                value={value}
                                onChange={onChange}
                                label={'Accession Date *'}
                                maxDate={dayjs()}
                                format='DD/MM/YYYY'
                                ref={getFieldRef('accessionDate')}
                              />
                            </LocalizationProvider>
                          )}
                        />
                        {errors.accessionDate && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.accessionDate?.message}</FormHelperText>
                        )}
                      </FormControl>

                      {Object.keys(enclosureData).length <= 0 && (
                        <div style={{ zIndex: 2, position: 'relative' }}>
                          <div
                            onClick={() => setOpen(true)}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '56px',
                              zIndex: 1,
                              cursor: 'pointer'
                            }}
                          ></div>
                          <FormControl fullWidth sx={{ mb: 4 }}>
                            <Controller
                              name='enclosure_id'
                              control={control}
                              rules={{ required: true }}
                              render={({ field: { value, onChange } }) => (
                                <TextField
                                  value={value}
                                  label='Select Enclosure *'
                                  name='enclosure_id'
                                  error={Boolean(errors.enclosure_id)}
                                  onChange={onChange}
                                  placeholder=''
                                  onClick={() => setOpen(true)}
                                  disabled
                                  sx={{
                                    '& .MuiInputLabel-root': {
                                      color: 'rgba(76, 78, 100, 0.6)'
                                    },
                                    '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                                      // borderColor: errors.enclosure_id ? 'red' : undefined
                                    }
                                  }}
                                  slotProps={{
                                    input: {
                                      endAdornment: (
                                        <InputAdornment position='end'>
                                          <Icon
                                            icon={'material-symbols:add-circle-outline'}
                                            style={{ color: theme.palette.primary.main }}
                                          ></Icon>
                                        </InputAdornment>
                                      )
                                    }
                                  }}
                                  ref={getFieldRef('enclosure')}
                                />
                              )}
                            />
                            {errors.enclosure_id && (
                              <FormHelperText sx={{ color: 'error.main' }}>
                                {errors?.enclosure_id?.message}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </div>
                      )}
                      {Object.keys(enclosureData).length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <EnclosureCard
                            user_enclosure_name={enclosureData?.user_enclosure_name}
                            section_name={enclosureData?.section_name}
                            site_name={enclosureData?.site_name}
                            closeEnclosureCard={() => closeEnclosure()}
                          ></EnclosureCard>
                        </div>
                      )}

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='enclosure'>Sex Type *</InputLabel>
                        <Controller
                          name='sextype'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='sextype'
                              value={value}
                              label='Sex Type *'
                              onChange={onChange}
                              labelId='sextype'
                              error={Boolean(errors?.sextype)}
                              ref={getFieldRef('sexingType')}
                            >
                              {[
                                { id: 'male', name: 'Male' },
                                { id: 'female', name: 'Female' },
                                { id: 'indeterminate', name: 'Indeterminate' },
                                { id: 'undetermined', name: 'Undetermined' }
                              ].map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.sextype && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.sextype?.message}</FormHelperText>
                        )}
                      </FormControl>
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='collectionType'>Collection Type *</InputLabel>
                        <Controller
                          name='collectionType'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='collectionType'
                              value={value}
                              label='Collection Type *'
                              onChange={onChange}
                              labelId='collectionType'
                              error={Boolean(errors?.collectionType)}
                              ref={getFieldRef('collectionType')}
                            >
                              {collectionTypeList?.map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.label}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.collectionType && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.collectionType?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='mastersOrganization'>Select Organization</InputLabel>
                        <Controller
                          name='mastersOrganization'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='mastersOrganization'
                              value={value}
                              label='Select Organization'
                              onChange={onChange}
                              labelId='mastersOrganization'
                              error={Boolean(errors?.mastersOrganization)}
                            >
                              {mastersOrganizationList?.map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.organization_name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.mastersOrganization && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.mastersOrganization?.message}
                          </FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth>
                        <Controller
                          name='birthDate'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                sx={{ width: '100%', '& .MuiIconButton-edgeEnd': { display: 'block' } }}
                                value={value}
                                onChange={onChange}
                                label={'Birth Date *'}
                                maxDate={dayjs()}
                                format='DD/MM/YYYY'
                                ref={getFieldRef('birthDate')}
                              />
                            </LocalizationProvider>
                          )}
                        />
                        {errors.birthDate && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.birthDate?.message}</FormHelperText>
                        )}
                      </FormControl>

                      <Typography sx={{ textAlign: 'center', fontSize: 20, fontWeight: 500, my: 4 }}>Or</Typography>

                      <Box sx={{ mb: 4, display: 'flex', flex: '1/2', gap: 4 }}>
                        <FormControl fullWidth>
                          <Controller
                            name='age'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                error={Boolean(errors?.comment)}
                                value={value}
                                label='Enter Age'
                                name='age'
                                type='number'
                                onChange={onChange}
                                placeholder=''
                                slotProps={{
                                  htmlInput: { min: 1 }
                                }}
                                ref={getFieldRef('age')}
                              />
                            )}
                          />
                          {errors.age && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.age?.message}</FormHelperText>
                          )}
                        </FormControl>
                        <FormControl fullWidth>
                          <InputLabel id='type'>Type</InputLabel>
                          <Controller
                            name='type'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='type'
                                value={value}
                                label='Type'
                                onChange={onChange}
                                labelId='type'
                                error={Boolean(errors?.type)}
                                ref={getFieldRef('type')}
                              >
                                {[
                                  { id: 'months', name: 'Months' },
                                  { id: 'weeks', name: 'Weeks' },
                                  { id: 'days', name: 'Days' }
                                ]?.map(val => (
                                  <MenuItem key={val?.id} value={val?.id}>
                                    {val?.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          {errors?.type && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.type?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Box>

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='localIdentifierType'>Local Identifier Type</InputLabel>
                        <Controller
                          name='localIdentifierType'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='local IdentifierType'
                              value={value}
                              label='Local Identifier Type'
                              onChange={onChange}
                              labelId='localIdentifierType'
                              error={Boolean(errors?.localIdentifierType)}
                              ref={getFieldRef('localIdentifierType')}
                            >
                              {localIdentifierTypeList?.map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.label}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.localIdentifierType && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.localIdentifierType?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                      {watch('localIdentifierType') === '' ? null : (
                        <FormControl sx={{ mb: 4 }} fullWidth>
                          <Controller
                            name='localIdentifier'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                error={Boolean(errors?.comment)}
                                value={value}
                                label={`Local Identifier ${watch('localIdentifierType') !== '' ? '*' : ''}`}
                                name='localIdentifier'
                                onChange={onChange}
                                placeholder=''
                                ref={getFieldRef('localIdentifier')}
                              />
                            )}
                          />
                          {errors.localIdentifier && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.localIdentifier?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='parentMother'>Parent Mother</InputLabel>
                        <Controller
                          name='parentMother'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='parentMother'
                              value={value}
                              label='Parent Mother'
                              onChange={onChange}
                              labelId='parentMother'
                              error={Boolean(errors?.parentMother)}
                              ref={getFieldRef('parentMother')}
                            >
                              {eggDetails?.parent_list?.mother_list?.map(item => (
                                <MenuItem key={item?._id} value={item?.animal_id}>
                                  <AnimalParentCard
                                    data={item}
                                    backgroundColor={theme.palette.customColors.tableHeaderBg}
                                  />
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.parentMother && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.parentMother?.message}</FormHelperText>
                        )}
                      </FormControl>
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='parentFather'>Parent Father</InputLabel>
                        <Controller
                          name='parentFather'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='parentFather'
                              value={value}
                              label='Parent Father'
                              onChange={onChange}
                              labelId='parentFather'
                              error={Boolean(errors?.parentFather)}
                              ref={getFieldRef('parentFather')}
                            >
                              {eggDetails?.parent_list?.father_list?.map(item => (
                                <MenuItem key={item?._id} value={item?.animal_id}>
                                  <AnimalParentCard
                                    data={item}
                                    backgroundColor={theme.palette.customColors.tableHeaderBg}
                                  />
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.parentFather && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.parentFather?.message}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='sexingType'>Sexing Type</InputLabel>
                        <Controller
                          name='sexingType'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='sexingType'
                              value={value}
                              label='Sexing Type'
                              onChange={onChange}
                              labelId='sexingType'
                              error={Boolean(errors?.sexingType)}
                              ref={getFieldRef('sexingType')}
                            >
                              {sexingTypeList?.map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.sexingType && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.sexingType?.message}</FormHelperText>
                        )}
                      </FormControl>
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='lifeStage'>Life Stage</InputLabel>
                        <Controller
                          name='lifeStage'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='lifeStage'
                              value={value}
                              label='Life Stage'
                              onChange={onChange}
                              labelId='lifeStage'
                              error={Boolean(errors?.lifeStage)}
                              ref={getFieldRef('lifeStage')}
                            >
                              {lifeStageList?.map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.lifeStage && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.lifeStage?.message}</FormHelperText>
                        )}
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel id='contraceptionType'>Contraception Type</InputLabel>
                        <Controller
                          name='contraceptionType'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='contraceptionType'
                              value={value}
                              label='Contraception Type'
                              onChange={onChange}
                              labelId='contraceptionType'
                              error={Boolean(errors?.contraceptionType)}
                              ref={getFieldRef('contraceptionType')}
                            >
                              {contraceptionTypeList?.map(val => (
                                <MenuItem key={val?.id} value={val?.id}>
                                  {val?.name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors?.contraceptionType && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.contraceptionType?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Box>
                  </Box>
                )}
              </Box>
              <Box
                sx={{
                  height: '122px',
                  width: '100%',
                  maxWidth: '562px',
                  position: 'fixed',
                  bottom: 0,
                  px: 4,
                  bgcolor: 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  display: 'flex',
                  zIndex: 123
                }}
              >
                <LoadingButton disabled={loader} fullWidth variant='outlined' size='large' onClick={handleCancel}>
                  CANCEL
                </LoadingButton>
                <LoadingButton
                  disabled={loader}
                  fullWidth
                  variant='contained'
                  loading={loader}
                  type='submit'
                  size='large'
                >
                  SUBMIT
                </LoadingButton>
              </Box>
            </form>
          </Box>
          {open && (
            <EnclosureSelectionDialog
              open={open}
              handleClose={() => handleClose()}
              getEnclosureDetails={getEnclosureDetails}
            ></EnclosureSelectionDialog>
          )}
        </Box>
      </Drawer>
    </>
  )
}

const EnclosureCard = ({ user_enclosure_name, section_name, site_name, enclosure_qr_image, closeEnclosureCard }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.customColors.tableHeaderBg,
        display: 'flex',
        padding: '12px',
        width: '100%',
        alignItems: 'center',
        borderRadius: '8px',
        gap: '12px'
      }}
    >
      <Box sx={{ height: '44px', width: '44px' }}>
        <Avatar
          variant='rounded'
          alt='Medicine Image'
          sx={{
            height: '100%',
            width: '100%',
            borderRadius: '50%',
            border: '1px',
            '& .css-1pqm26d-MuiAvatar-img': {
              objectFit: 'contain'
            }
          }}
          src={enclosure_qr_image}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '19.36px'
          }}
        >
          Encl: {user_enclosure_name ? user_enclosure_name : '-'}
        </Typography>

        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '16.94px'
          }}
        >
          Sec: {section_name ? section_name : '-'}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '16.94px'
          }}
        >
          Site: {site_name ? site_name : '-'}
        </Typography>
      </Box>
      <Box>
        <IconButton size='small' onClick={closeEnclosureCard} sx={{ color: 'text.primary' }}>
          <Icon icon='mdi:close-circle-outline' fontSize={36} style={{ color: 'red' }} />
        </IconButton>
      </Box>
    </Box>
  )
}

export default ConditionSlider
