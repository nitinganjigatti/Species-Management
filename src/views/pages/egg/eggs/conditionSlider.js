/* eslint-disable lines-around-comment */
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Card,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
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
  fabClasses
} from '@mui/material'
import { useDropzone } from 'react-dropzone'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Image from 'next/image'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import imageUploader from 'public/images/imageUploader/imageUploader.png'
import { useEffect, useRef, useState } from 'react'
import { AddEggStatusAndCondition, GetEggMaster } from 'src/lib/api/egg/egg'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import Toaster from 'src/components/Toaster'

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
  const [selectedOption, setSelectedOption] = useState('')
  const [hatched, setHatched] = useState('normal_hatch')
  console.log('hatched :>> ', hatched)
  const fileInputRef = useRef(null)
  const [imgSrc, setImgSrc] = useState([])

  const [eggStaged, setEggStaged] = useState([])
  const [eggMaster, setEggMaster] = useState([])
  const [displayFile, setDisplayFile] = useState('')
  const [imgArr, setImgArr] = useState([])
  const [statusId, setStatusId] = useState('')
  const [isAnimal, setIsAnimal] = useState(false)
  const [loader, setLoader] = useState(false)

  const getEggMasterData = async () => {
    try {
      await GetEggMaster().then(res => {
        if (res.success) {
          console.log('res?.data? master :>> ', res?.data)
          setEggMaster(res?.data)
        }
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    try {
      getEggMasterData()
    } catch (error) {
      console.log('error :>> ', error)
    }
  }, [])

  const defaultValues = {
    current_state: '',
    select_stage: '',
    hatched_method_Btn: '',
    comment: '',
    shell_thickness: '',
    assisted_by: '',
    image: []
  }

  const schema = yup.object().shape({
    current_state: yup.string().required('State is required'),

    select_stage: eggStaged?.length > 0 ? yup.string().required('Stage is required') : yup.string().notRequired(),

    // hatched_method_Btn: statusId === '4' ? yup.string().required('Condition is required') : yup.string().notRequired(),
    // shell_thickness:
    //   statusId === '4' ? yup.string().required('Shell thickness is required') : yup.string().notRequired(),

    assisted_by:
      hatched === 'assisted_hatch'
        ? yup.string().trim().required('Assisted By is required')
        : yup.string().notRequired()
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

  const statusID = watch('current_state')

  useEffect(() => {
    if (statusID) {
      setStatusId(statusID)
      console.log('statusID :>> ', statusID)
      const filteredEggStatus = eggMaster?.egg_state?.filter(status => status?.egg_status_id === statusID)
      setEggStaged(filteredEggStatus)
      console.log('filteredEggStatus :>> ', filteredEggStatus)
    }
  }, [statusID, eggMaster])

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
          setImgSrc(pre => [...pre, reader?.result])
        }
        setDisplayFile(files[0]?.name)
        reader?.readAsDataURL(files[0])
        setImgArr(pre => [...pre, files[0]])
        setValue('image', files)

        clearErrors('image')
      }
    }
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    console.log('files :>> ', files)
    if (files && files.length !== 0) {
      reader.onload = () => {
        setImgSrc(pre => [...pre, reader?.result])
      }
      setDisplayFile(files[0]?.name)
      reader?.readAsDataURL(files[0])
      setImgArr(pre => [...pre, files[0]])
      setValue('image', files)
      clearErrors('image')
    }
  }

  const removeSelectedImage = index => {
    setImgSrc(prevImages => prevImages.filter((_, i) => i !== index))
    setValue('image', '')
  }

  const onSubmit = async values => {
    try {
      setLoader(true)

      const payload = {
        egg_id: eggId,
        egg_status_id: getValues('current_state'),
        egg_state_id: getValues('select_stage'),
        hatched_method: hatched,
        comment: getValues('comment'),
        egg_shell_thickness: getValues('shell_thickness'),

        egg_assisted_by: getValues('assisted_by'),
        egg_attachment: imgArr
      }
      // console.log('payload :>> ', payload)

      const res = await AddEggStatusAndCondition(payload)
      if (res.success) {
        setLoader(false)

        // console.log('res on submit :>> ', res)
        setImgSrc('')
        reset()

        setOpenDrawer(false)
        Toaster({ type: 'success', message: res.message })
        if (getDetails) {
          getDetails(eggId)
        }
        if (GetGalleryImgList) {
          GetGalleryImgList()
        }
        if (getActivityLogsFunc) {
          getActivityLogsFunc()
        }
      } else {
        setLoader(false)
        reset()
        Toaster({ type: 'error', message: res.message })
      }

      // Perform any additional operations, e.g., API call
    } catch (error) {
      setLoader(false)
      if (getDetails) {
        getDetails(eggId)
      }
      reset()
      console.error('Error while adding room:', error)
      Toaster({ type: 'error', message: 'An error occurred while adding room' })
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
  }, [eggDetails])

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
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6), overflowY: 'auto' }}>
                <Card fullWidth>
                  <FormControl sx={{ width: '95%', ml: 3, mt: 5, mb: 4 }}>
                    <InputLabel id='current_state'>Select State*</InputLabel>
                    <Controller
                      name='current_state'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='current_state'
                          value={value}
                          label='Current State'
                          onChange={onChange}
                          labelId='current_state'
                          error={Boolean(errors?.current_state)}
                        >
                          {eggMaster?.egg_status?.map(status => (
                            <MenuItem key={status?.id} value={status?.id}>
                              {status?.egg_status}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors?.current_state && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.current_state?.message}</FormHelperText>
                    )}
                  </FormControl>

                  {eggStaged?.length > 0 && (
                    <FormControl sx={{ width: '95%', ml: 3, mb: 4 }}>
                      <InputLabel id='select_stage'>Select Stage*</InputLabel>
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
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                        <>
                          <FormControl mb={2}>
                            <RadioGroup
                              aria-labelledby='demo-row-radio-buttons-group-label'
                              name='hatched_method_Btn'
                              sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}
                              value={hatched}
                              onChange={e => setHatched(e.target.value)}
                            >
                              <Stack direction='row' spacing={6}>
                                <Box
                                  error={Boolean(errors?.hatched_method_Btn)}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 2,
                                    border: `2px solid ${theme.palette.customColors.trackBg}`,
                                    p: 2,
                                    borderRadius: '10px',

                                    // opacity: 0.6,
                                    width: 230,
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <Typography ml={2}>Normal Hatch</Typography>
                                  <FormControlLabel value='normal_hatch' control={<Radio />} />
                                </Box>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 2,
                                    border: `2px solid ${theme.palette.customColors.trackBg}`,
                                    p: 2,
                                    borderRadius: '10px',

                                    // opacity: 0.6,
                                    width: 230,
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <Typography ml={2}>Assisted Hatch</Typography>
                                  <FormControlLabel value='assisted_hatch' control={<Radio />} />
                                </Box>
                              </Stack>
                            </RadioGroup>
                            {errors?.hatched_method_Btn && (
                              <FormHelperText sx={{ color: 'error.main' }}>
                                {errors?.hatched_method_Btn?.message}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </>
                      </Box>

                      <FormControl fullWidth sx={{ px: 3, mb: 3 }}>
                        <Controller
                          name='shell_thickness'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            // <TextField
                            //   error={Boolean(errors?.shell_thickness)}
                            //   value={value}
                            //   type='number'
                            //   label='Enter Shell Thickness*'
                            //   name='shell_thickness'
                            //   onChange={onChange}
                            //   placeholder=''
                            //   sx={{ width: '100%', mr: 12 }} // Adjusted sx prop
                            // />
                            <TextField
                              error={Boolean(errors?.shell_thickness)}
                              value={value}
                              type='number'
                              label='Enter Shell Thickness*'
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
                              InputProps={{
                                endAdornment: <InputAdornment position='end'>MM</InputAdornment>
                              }}
                              // inputProps={{ min: 1 }}
                            />
                          )}
                        />
                        {errors.shell_thickness && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors?.shell_thickness?.message}
                          </FormHelperText>
                        )}
                      </FormControl>

                      {hatched === 'assisted_hatch' && (
                        <FormControl fullWidth sx={{ px: 3, mb: 3 }}>
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
                                sx={{ width: '100%', mr: 12 }} // Adjusted sx prop
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
                </Card>

                <Card fullWidth sx={{ mt: 6, p: 4, mb: isAnimal ? 3 : 35 }}>
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
                          sx={{ width: '100%', mt: 2, mr: 12, mb: 3 }} // Adjusted sx prop
                        />
                      )}
                    />
                    {errors.comment && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.comment?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <Grid container>
                    {/* {imgSrc !== '' ? null : ( */}
                    <Grid item md={12} sm={12} xs={12}>
                      <input
                        type='file'
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
                    <Grid item md={12} sm={12} xs={12} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Stack direction='row' sx={{ px: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {imgSrc?.length > 0 &&
                          imgSrc?.map((img, index) => (
                            <Box key={index} sx={{ display: 'flex', mt: 3 }}>
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
                                    color='#fff'
                                    onClick={() => removeSelectedImage(index)}
                                  >
                                    {' '}
                                  </Icon>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* <Box sx={{ mt: 3, p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 500 }}>Add this as an animal</Typography>

                    <FormControlLabel
                      control={
                        <Switch checked={isAnimal} onChange={handleChangeSwitch} name='mySwitch' color='primary' />
                      }

                      // label={isAnimal ? 'On' : 'Off'}
                    />
                  </Box> */}
                </Card>

                {isAnimal && (
                  <Box mb={35}>
                    <Typography sx={{ fontSize: 20, fontWeight: 500, mb: 2 }}>Add Animal Details</Typography>
                    <Card fullWidth sx={{ p: 5 }}>
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='species'>Add Species</InputLabel>
                        <Controller
                          name='species'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='species'
                              value={value}
                              label='Add Species'
                              onChange={onChange}
                              labelId='species'
                              error={Boolean(errors?.species)}
                            >
                              {/* {eggMaster?.egg_status?.map(status => ( */}
                              <MenuItem

                              //  key={status?.id} value={status?.id}
                              >
                                Dog
                              </MenuItem>
                              {/* ))} */}
                            </Select>
                          )}
                        />
                        {errors?.species && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.species?.message}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='species'>Accession Type</InputLabel>
                        <Controller
                          name='species'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='species'
                              value={value}
                              label='Add Species'
                              onChange={onChange}
                              labelId='species'
                              error={Boolean(errors?.species)}
                            >
                              {/* {eggMaster?.egg_status?.map(status => ( */}
                              <MenuItem

                              //  key={status?.id} value={status?.id}
                              >
                                Dog
                              </MenuItem>
                              {/* ))} */}
                            </Select>
                          )}
                        />
                        {errors?.species && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.species?.message}</FormHelperText>
                        )}
                      </FormControl>
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <InputLabel id='species'>Ownership Term</InputLabel>
                        <Controller
                          name='species'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='species'
                              value={value}
                              label='Add Species'
                              onChange={onChange}
                              labelId='species'
                              error={Boolean(errors?.species)}
                            >
                              {/* {eggMaster?.egg_status?.map(status => ( */}
                              <MenuItem

                              //  key={status?.id} value={status?.id}
                              >
                                Dog
                              </MenuItem>
                              {/* ))} */}
                            </Select>
                          )}
                        />
                        {errors?.species && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.species?.message}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl fullWidth>
                        <Controller
                          name='accessionDate'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              {console.log(value, 'vvv')}
                              <TimePicker
                                label='Select time - from'
                                onChange={onChange}
                                name='accessionDate'
                                defaultValue={value ? dayjs(value) : null}
                                sx={{
                                  '& fieldset': {
                                    borderColor:
                                      errors.meal_data &&
                                      errors.meal_data[index] &&
                                      errors.meal_data[index]?.meal_from_time
                                        ? 'red'
                                        : undefined // Change border color to red if there's an error
                                  }
                                }}
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    label='Diet Type *'
                                    placeholder='Search & Select'
                                    error={Boolean(errors.meal_data[index].meal_from_time?.message)}
                                    name='accessionDate'
                                    sx={{
                                      '& fieldset': {
                                        borderColor: errors.meal_data?.[index]?.meal_from_time ? 'red' : undefined // Change border color to red if there's an error
                                      }
                                    }}
                                  />
                                )}
                              />
                            </LocalizationProvider>
                          )}
                        />

                        {errors.meal_data && errors.meal_data[index] && (
                          <FormHelperText sx={{ color: 'error.main' }}>
                            {errors.meal_data[index].meal_from_time?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Card>
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
                <LoadingButton fullWidth variant='outlined' size='large' onClick={handleCancel}>
                  CANCEL
                </LoadingButton>
                <LoadingButton
                  disabled={loader}
                  fullWidth
                  variant='contained'
                  loader={loader}
                  type='submit'
                  size='large'
                >
                  SUBMIT
                </LoadingButton>
              </Box>
            </form>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default ConditionSlider
