/* eslint-disable lines-around-comment */
import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Avatar,
  Box,
  Card,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useCallback, useEffect, useState } from 'react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import Toaster from 'src/components/Toaster'
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
import { DatePicker } from '@mui/x-date-pickers'
import { GetEggDetails } from 'src/lib/api/egg/egg'
import moment from 'moment'
import dayjs from 'dayjs'

const CreateAnimalSlider = ({ eggId, setOpenDrawer, openDrawer }) => {
  const theme = useTheme()

  const [loader, setLoader] = useState(false)

  const [eggDetails, setEggDetails] = useState({})

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

  const getDetails = id => {
    try {
      GetEggDetails(id).then(res => {
        if (res.success) {
          setEggDetails(res?.data)
        } else {
        }
      })
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    if (eggId) {
      getDetails(eggId)
    }
  }, [eggId])

  const defaultValues = {
    species: '',
    accessionType: '',
    institution: '',
    animalOwnershipTerms: '',
    accessionDate: null,
    collectionType: '',
    enclosure: '',
    sextype: '',
    mastersOrganization: '',
    parentMother: '',
    parentFather: '',
    birthDate: null,
    age: '',
    type: '',
    localIdentifierType: '',
    localIdentifier: '',
    sexingType: '',
    lifeStage: '',
    contraceptionType: ''
  }

  const schema = yup.object().shape({
    species: yup.string().required('Species / Taxonomy is required'),
    accessionType: yup.string().required('Accession Type is required'),
    institution: yup
      .string()
      .test(
        'is-required-if-accessionType-is-2',
        'Institution is required when Accession Type is From Institute',
        function (value) {
          const { accessionType } = this.parent
          if (accessionType === '2') {
            return !!value // Return true if value is not empty
          }
          return true // Otherwise, always pass validation
        }
      ),
    accessionDate: yup.string().required('Accession Date is required'),
    collectionType: yup.string().required('Collection Type is required'),
    enclosure: yup.string().required('Enclosure is required'),
    sextype: yup.string().required('Sex Type is required'),
    birthDate: yup.string().required('Birth Date is required'),
    localIdentifier: yup
      .string()
      .test(
        'is-required-if-localIdentifierType-is-not-empty',
        'Local Identifier is required when Local Identifier Type is selected',
        function (value) {
          const { localIdentifierType } = this.parent
          if (localIdentifierType && localIdentifierType.trim() !== '') {
            return !!value // Return true if value is not empty
          }
          return true // Otherwise, always pass validation
        }
      )
  })

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    clearErrors,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })
  const onSubmit = async values => {
    try {
      setLoader(true)

      const payload = {
        accession_type: values?.accessionType,
        accession_date: moment(values?.accessionDate).format('YYYY-MM-DD'),
        taxonomy_id: values?.species,
        enclosure_id: values?.enclosure,
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
        site_id: eggDetails?.enclosure_data[0]?.site_id,
        section_id: eggDetails?.enclosure_data[0]?.section_id,
        egg_id: eggId
      }

      //   console.log('payload :>> ', values)

      const res = await createAnimal(payload)
      if (res.success) {
        setLoader(false)
        setDefaultSpecies(null)

        // console.log('res on submit :>> ', res)
        reset()

        setOpenDrawer(false)
        Toaster({ type: 'success', message: res.message })

        // if (GetGalleryImgList) {
        //   GetGalleryImgList()
        // }
      } else {
        setLoader(false)
        // reset()
        Toaster({ type: 'error', message: res.message })
      }

      // Perform any additional operations, e.g., API call
    } catch (error) {
      setLoader(false)
      console.error('Error while creating animal:', error)
      Toaster({ type: 'error', message: 'An error occurred while creating animal' })
    }
  }

  const handleCancel = () => {
    reset()
    setOpenDrawer(false)
  }

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
    debounce(async q => {
      try {
        await getTaxonomyListFunc({ q })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

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
    eggDetails?.enclosure_data
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
              <Typography variant='h6'>Create Animal</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box className='sidebar-body' sx={{ px: '24px', overflowY: 'auto' }}>
              <Box mb={35}>
                <Card fullWidth sx={{ py: '20px', px: '16px' }}>
                  <FormControl fullWidth sx={{ mb: 4 }}>
                    {/* <InputLabel id='species'>Species / Taxonomy</InputLabel> */}
                    <Controller
                      name='species'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        //   <Select
                        //     name='species'
                        //     value={value}
                        //     label='Add Species'
                        //     onChange={onChange}
                        //     labelId='species'
                        //     error={Boolean(errors?.species)}
                        //   >
                        //     {taxonomyList?.map(val => (
                        //       <MenuItem key={val?.taxonomy_id} value={val?.taxonomy_id}>
                        //         {val?.scientific_name}
                        //       </MenuItem>
                        //     ))}
                        //   </Select>
                        <Autocomplete
                          name='species'
                          value={defaultSpecies}
                          // value={value}
                          disablePortal
                          placeholder='Species / Taxonomy'
                          // disabled={isEdit || isPreFilled}
                          id='species'
                          options={taxonomyList?.length > 0 ? taxonomyList : []}
                          getOptionLabel={option => option.scientific_name}
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
                              label='Select Species *'
                              placeholder='Search & Select'
                              error={Boolean(errors.species)}
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
                  <FormControl fullWidth sx={{ mb: 4 }}>
                    <InputLabel id='institution'>
                      Institution {Number(getValues('accessionType')) === 4 && '*'}
                    </InputLabel>
                    <Controller
                      name='institution'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='institution'
                          value={value}
                          label='Accession Type'
                          onChange={onChange}
                          labelId='institution'
                          error={Boolean(errors?.institution)}
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
                          label='Animal Ownership Terms'
                          onChange={onChange}
                          labelId='animalOwnershipTerms'
                          error={Boolean(errors?.animalOwnershipTerms)}
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
                            //   error={Boolean(errors.accessionDate)}
                          />
                        </LocalizationProvider>
                      )}
                    />
                    {errors.accessionDate && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.accessionDate?.message}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 4 }}>
                    <InputLabel id='enclosure'>Select Enclosure *</InputLabel>
                    <Controller
                      name='enclosure'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='enclosure'
                          value={value}
                          label='Select Enclosure *'
                          onChange={onChange}
                          labelId='enclosure'
                          error={Boolean(errors?.enclosure)}
                        >
                          {eggDetails?.enclosure_data?.map(val => (
                            <MenuItem key={val?.enclosure_id} value={val?.enclosure_id}>
                              {/* {val?.user_enclosure_name} */}
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
                                <Avatar
                                  variant='rounded'
                                  alt='Medicine Image'
                                  sx={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%'
                                  }}
                                  src={val?.enclosure_qr_image}
                                />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      lineHeight: '19.36px'
                                    }}
                                  >
                                    Encl: {val?.user_enclosure_name ? val?.user_enclosure_name : '-'}
                                  </Typography>

                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '400',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    Sec: {val?.section_name ? val?.section_name : '-'}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '400',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    Site: {val?.site_name ? val?.site_name : '-'}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors?.enclosure && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.enclosure?.message}</FormHelperText>
                    )}
                  </FormControl>
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
                        >
                          {[
                            { id: 'male', name: 'MALE' },
                            { id: 'female', name: 'FEMALE' },
                            { id: 'indeterminate', name: 'INDETERMINATE' },
                            { id: 'undetermined', name: 'UNDETERMINED' }
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
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.collectionType?.message}</FormHelperText>
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
                          label='Animal Ownership Terms'
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
                            inputProps={{ min: 1 }}
                            onChange={onChange}
                            placeholder=''
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
                            label='Animal Ownership Terms'
                            onChange={onChange}
                            labelId='type'
                            error={Boolean(errors?.type)}
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
                          label='Animal Ownership Terms'
                          onChange={onChange}
                          labelId='localIdentifierType'
                          error={Boolean(errors?.localIdentifierType)}
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
                  <FormControl sx={{ mb: 4 }} fullWidth>
                    <Controller
                      name='localIdentifier'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          error={Boolean(errors?.comment)}
                          value={value}
                          label='Local Identifier'
                          name='localIdentifier'
                          onChange={onChange}
                          placeholder=''
                        />
                      )}
                    />
                    {errors.localIdentifier && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifier?.message}</FormHelperText>
                    )}
                  </FormControl>

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
                          label='Animal Ownership Terms'
                          onChange={onChange}
                          labelId='parentMother'
                          error={Boolean(errors?.parentMother)}
                        >
                          {eggDetails?.parent_list?.mother_list?.map(val => (
                            <MenuItem key={val?._id} value={val?._id}>
                              {/* {val?.common_name} */}
                              <Box
                                sx={{
                                  backgroundColor: theme.palette.customColors.tableHeaderBg,
                                  display: 'flex',
                                  padding: '12px',
                                  width: '100%',
                                  borderRadius: '10px',
                                  gap: '12px'
                                }}
                              >
                                <Box
                                  sx={{
                                    alignItems: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                  }}
                                >
                                  <Avatar
                                    variant='rounded'
                                    alt='Medicine Image'
                                    sx={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '50%',
                                      border: '1px',
                                      overflow: 'hidden'
                                    }}
                                    src={val?.default_icon}
                                    // src={
                                    //   'https://buffer.com/library/content/images/size/w1200/2023/10/free-images.jpg'
                                    // }
                                  />
                                  <Typography
                                    sx={{
                                      height: '22px',
                                      width: '22px',
                                      textAlign: 'center',
                                      backgroundColor: val?.sex === 'female' ? '#FFD3D3' : '#AFEFEB'
                                    }}
                                  >
                                    {val?.sex === 'female' ? 'F' : 'M'}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      lineHeight: '19.36px'
                                    }}
                                  >
                                    {val?.animal_id ? val?.animal_id : '-'}
                                  </Typography>

                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    {val?.common_name ? val?.common_name : '-'}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '400',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    {val?.user_enclosure_name ? val?.user_enclosure_name : '-'}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '400',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    {val?.section_name ? val?.section_name : '-'}
                                  </Typography>
                                </Box>
                              </Box>
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
                          label='Animal Ownership Terms'
                          onChange={onChange}
                          labelId='parentFather'
                          error={Boolean(errors?.parentFather)}
                        >
                          {eggDetails?.parent_list?.father_list?.map(val => (
                            <MenuItem key={val?._id} value={val?._id}>
                              {/* {val?.common_name} */}
                              <Box
                                sx={{
                                  backgroundColor: theme.palette.customColors.tableHeaderBg,
                                  display: 'flex',
                                  padding: '12px',
                                  width: '100%',
                                  borderRadius: '10px',
                                  gap: '12px'
                                }}
                              >
                                <Box
                                  sx={{
                                    alignItems: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                  }}
                                >
                                  <Avatar
                                    variant='rounded'
                                    alt='Medicine Image'
                                    sx={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '50%',
                                      border: '1px',
                                      overflow: 'hidden'
                                    }}
                                    src={val?.default_icon}
                                    // src={
                                    //   'https://buffer.com/library/content/images/size/w1200/2023/10/free-images.jpg'
                                    // }
                                  />
                                  <Typography
                                    sx={{
                                      height: '22px',
                                      width: '22px',
                                      textAlign: 'center',
                                      backgroundColor: val?.sex === 'female' ? '#FFD3D3' : '#AFEFEB'
                                    }}
                                  >
                                    {val?.sex === 'female' ? 'F' : 'M'}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      lineHeight: '19.36px'
                                    }}
                                  >
                                    {val?.animal_id ? val?.animal_id : '-'}
                                  </Typography>

                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    {val?.common_name ? val?.common_name : '-'}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '400',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    {val?.user_enclosure_name ? val?.user_enclosure_name : '-'}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '14px',
                                      fontWeight: '400',
                                      lineHeight: '16.94px'
                                    }}
                                  >
                                    {val?.section_name ? val?.section_name : '-'}
                                  </Typography>
                                </Box>
                              </Box>
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
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.contraceptionType?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Card>
              </Box>
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
              <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCancel}>
                CANCEL
              </LoadingButton>
              <LoadingButton disabled={loader} fullWidth variant='contained' loader={loader} type='submit' size='large'>
                SUBMIT
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default CreateAnimalSlider
