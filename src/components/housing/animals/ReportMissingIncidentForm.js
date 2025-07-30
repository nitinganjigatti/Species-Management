import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Checkbox,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import { Box, Stack } from '@mui/system'
import React, { useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { speciesAttachmentUpload } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'
import imageUploader from 'public/images/gallery_add_Icon.png'
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'


import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Image from 'next/image'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'


const defaultValues = {
  missingDate: dayjs(),                       // Date field
  missingTime: dayjs(),                       // Time field
  reportedBy: '',                             // Autocomplete - user_id
  notes: '',                                  // Notes
  attachment: '',                             // Image file name
  lastSeenLocation: '',                       // Additional Info
  animalBehaviour: '',
  actionsTaken: '',
  preventiveSteps: ''
}

const schema = yup.object().shape({
  missingDate: yup.date().required('Date is required'),
  missingTime: yup.date().required('Time is required'),
  reportedBy: yup.string().required('Reporter is required'),
  notes: yup.string().required('Notes are required'),
  attachment: yup.string().required('Attachment is required'),
  lastSeenLocation: yup.string().required('Location is required'),
  animalBehaviour: yup.string().required('Behaviour is required'),
  actionsTaken: yup.string().required('Action taken is required'),
  preventiveSteps: yup.string().required('Steps are required')
})


const ReportMissingIncidentForm = ({
  animalIncidentForm,
  setAnimalIncidentForm,
  animalId,
}) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const [preparedByUsers, setPreparedByUsers] = useState([])
  const [defaultPreparedBy, setDefaultPreparedBy] = useState(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState(null)

  const [previewUrl, setPreviewUrl] = useState(null)  // ADD THIS

  const [uploadingAttachment, setUploadingAttachment] = useState(false)


  const {
    control,
    handleSubmit,
    clearErrors,
    getValues,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const handleFileUpload = async (event, speciesId) => {
    const file = event?.target?.files[0]

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!file || !allowedTypes.includes(file.type)) {
      Toaster({ type: 'error', message: 'Only PDF files are supported. Please upload a PDF file.', ignoreCase: true })
      return
    }


    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setSelectedFileName(file.name)
    setValue('attachment', file.name)
    if (file.name) {
      clearErrors('attachment')
    }
  }
  ////////////////////////////////////////////////////////////
  const onSubmit = async ({ localIdentifierType, LocalIdentifier }) => {
    setUploadingAttachment(true)
    try {
      const res = await speciesAttachmentUpload({
        species_id: speciesId,
        attachment: selectedFile,
        localIdentifierType,
        LocalIdentifier
      })
      Toaster({ type: 'success', message: res.message })
      fetchTableData()
      setUploadDietDrawer(false)
      reset()
      setDefaultPreparedBy(null)
      setSelectedFileName(null)
      setSelectedFile(null)
      handleSearch('')
      if (speciesDetailsDrawer) {
        getSpecieDetail(speciesId)
      }
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'File upload failed.' })
    } finally {
      setUploadingAttachment(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])


  const SpeciesDietCard = () => (
    <Box
      sx={{
        position: 'fixed',
        backgroundColor: 'background.default',
        width: {
          xs: '100%', // 0px and up
          sm: '560px'
        },
        zIndex: 100,
        display: 'flex',
        gap: 1,
        padding: '20px 16px'
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img style={{ width: '32px', height: '32px' }} src={'/icons/Activity.svg'} alt='activity' />
        <Typography
          sx={{
            color: theme.palette.primary.light,
            fontSize: '24px',
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Report Escaped/missing
        </Typography>
      </Box>
      <IconButton
        size='small'
        sx={{ color: 'text.primary', height: '40px', width: '40px' }}
        onClick={() => {
          reset()
          setAnimalIncidentForm(false)
        }}
      >
        <Icon icon='mdi:close' fontSize={24} />
      </IconButton>
    </Box>
  )
  const basicStyle = {
    // backgroundColor: theme.palette.primary.contrastText,
    // borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
    // width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    },
  }
  return (
    <Drawer
      anchor='right'
      open={animalIncidentForm}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', 562] },
        height: '100vh',
        '& .css-e1dg5m-MuiCardContent-root': {
          pt: 0
        }
      }}
    >
      <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            height: '100vh',
            pb: '132px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <>
            {SpeciesDietCard()}
            <Box
              sx={{
                mt: 20,
                mx: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
            >

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: theme.palette.customColors.OnSurfaceVariant,
                  }}
                >
                  Missing Since
                </Typography>

                <Box sx={{
                  p: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                }}>

                  <FormControl fullWidth>
                    <Controller
                      name='missingDate'
                      control={control}
                      defaultValue={dayjs()} // or null
                      render={({ field }) => (
                        <LocalizationProvider LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            sx={{
                              ...basicStyle
                            }}
                            // value={allocationDate}
                            onChange={newDate => {
                              if (newDate) {
                                const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
                              }
                            }}
                            {...field} // ✅ use the actual field from react-hook-form
                            label='Date'
                            maxDate={dayjs()}
                            format='DD/MM/YYYY'
                          />
                        </LocalizationProvider>
                      )}
                    />
                  </FormControl>
                  <FormControl fullWidth>

                    <Controller
                      name='missingTime'
                      control={control}
                      // defaultValue={dayjs()} // or null
                      render={({ field }) => (
                        <LocalizationProvider LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            {...field}
                            label='Time'
                            format='hh:mm A'
                            sx={{
                              ...basicStyle,
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: Boolean(errors.missingTime),
                                helperText: errors.missingTime?.message,
                                InputProps: {
                                  endAdornment: <Icon icon='mdi:clock-outline' />
                                }
                              }
                            }}
                          />
                        </LocalizationProvider>
                      )}
                    />
                  </FormControl>

                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: theme.palette.customColors.OnSurfaceVariant,
                  }}
                >
                  Missing Reported by
                </Typography>

                <Box sx={{
                  p: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                }}>
                  <FormControl fullWidth>
                    <Controller
                      name='reportedBy'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          value={defaultPreparedBy}
                          options={preparedByUsers}
                          getOptionLabel={option => option.user_name}
                          isOptionEqualToValue={(option, value) => option?.user_id === value?.user_id}
                          onChange={(e, val) => {
                            setDefaultPreparedBy(val)
                            onChange(val?.user_id || '')
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Reported by *'
                              placeholder='Search & Select'
                              error={Boolean(errors.reportedBy)}
                              helperText={errors?.reportedBy?.message}
                              sx={{
                                ...basicStyle,
                              }}
                            />
                          )}
                        />
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifierType?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: theme.palette.customColors.OnSurfaceVariant,
                  }}
                >
                  Notes
                </Typography>

                <Box sx={{
                  p: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                }}>
                  <FormControl fullWidth>
                    <Controller
                      name='notes'
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          multiline
                          rows={3}
                          label='Write notes here'
                          placeholder='Write notes here'
                          error={Boolean(errors.notes)}
                          helperText={errors.notes?.message}
                          sx={{
                            ...basicStyle,
                            // '& .MuiOutlinedInput-root': {
                            //   '& fieldset': {
                            //     borderColor: errors?.localIdentifier?.message && 'red !important',
                            //     borderRadius: '4px'
                            //   },

                            // },
                            // '& .MuiInputBase-input::placeholder': {
                            //   color: 'red !important', // Custom placeholder color
                            //   opacity: 1 // Needed for non-IE browsers
                            // }
                          }}
                        />
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifier?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='attachment'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <input
                            type='file'
                            multiple
                            accept={['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={e => {
                              handleFileUpload(e)
                            }}
                          />

                          <Box
                            onClick={() => fileInputRef.current.click()}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 7,
                              height: '48px',
                              border: `1px dashed ${theme.palette.customColors.OutlineVariant}`,
                              borderRadius: '10px',
                              // padding: 3
                            }}
                          >
                            <Image alt={'filename'} src={imageUploader} width={32} height={32} />

                            <Typography
                              sx={{
                                fontWeight: 400,
                                fontSize: 16,
                                lineHeight: '24px',
                                letterSpacing: '0.15px',
                                color: theme.palette.customColors.OnSurfaceVariant60
                              }}
                            >
                              Drop your image here
                            </Typography>
                          </Box>
                        </>
                      )}
                    />
                    {errors.attachment && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.attachment?.message}</FormHelperText>
                    )}
                  </FormControl>
                  {selectedFile &&
                    <Box
                      sx={{
                        position: 'relative',
                        backgroundColor: theme.palette.customColors.tableHeaderBg,
                        borderRadius: '10px',
                        height: 121,
                        width: 121,
                        padding: '10.5px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <img
                        style={{
                          aspectRatio: 2 / 2,
                          height: '100%',
                          borderRadius: '50%'
                        }}
                        alt='Uploaded image'
                        src={previewUrl}
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
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedFile(null)
                            setError('attachment')
                          }}
                        />
                      </Box>
                    </Box>
                  }
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: theme.palette.customColors.OnSurfaceVariant,
                  }}
                >
                  Additional Information
                </Typography>

                <Box sx={{
                  p: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                }}>
                  {/* <FormControl fullWidth>
                    <Controller
                      name='localIdentifier'
                      control={control}

                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          name='localIdentifier'
                          id='localIdentifier'
                          type='text'
                          sx={{
                            ...basicStyle
                          }}
                          value={value}
                          onChange={onChange}
                          focused={value !== ''}
                          label='Last Seen/Escaped From'
                          placeholder='Last Seen/Escaped From'
                        />
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifier?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='localIdentifier'
                      control={control}

                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          name='localIdentifier'
                          id='localIdentifier'
                          type='text'
                          sx={{
                            ...basicStyle
                          }}
                          value={value}
                          onChange={onChange}
                          focused={value !== ''}
                          label='Animal Behaviour Before Incident'
                          placeholder='Animal Behaviour Before Incident'
                        />
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifier?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='localIdentifier'
                      control={control}

                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          name='localIdentifier'
                          id='localIdentifier'
                          type='text'
                          sx={{
                            ...basicStyle
                            // '& .MuiOutlinedInput-root': {
                            //   '& fieldset': {
                            //     borderColor: errors?.localIdentifier?.message && 'red !important',
                            //     borderRadius: '4px'
                            //   },

                            // },
                            // '& .MuiInputBase-input::placeholder': {
                            //   color: 'red !important', // Custom placeholder color
                            //   opacity: 1 // Needed for non-IE browsers
                            // }
                          }}
                          value={value}
                          onChange={onChange}
                          focused={value !== ''}
                          label='Actions Taken'
                          placeholder='Actions Taken'
                        />
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifier?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='localIdentifier'
                      control={control}

                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          name='localIdentifier'
                          id='localIdentifier'
                          type='text'
                          sx={{
                            ...basicStyle
                          }}
                          value={value}
                          onChange={onChange}
                          focused={value !== ''}
                          label='Steps to Prevent Future Incidents'
                          placeholder='Steps to Prevent Future Incidents'
                        />
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifier?.message}</FormHelperText>
                    )}
                  </FormControl> */}
                  <Controller
                    name='lastSeenLocation'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Last Seen/Escaped From'
                        placeholder='Last Seen/Escaped From'
                        error={Boolean(errors.lastSeenLocation)}
                        helperText={errors.lastSeenLocation?.message}
                      />
                    )}
                  />

                  <Controller
                    name='animalBehaviour'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Animal Behaviour Before Incident'
                        placeholder='Animal Behaviour Before Incident'
                        error={Boolean(errors.animalBehaviour)}
                        helperText={errors.animalBehaviour?.message}
                      />
                    )}
                  />

                  <Controller
                    name='actionsTaken'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Actions Taken'
                        placeholder='Actions Taken'
                        error={Boolean(errors.actionsTaken)}
                        helperText={errors.actionsTaken?.message}
                      />
                    )}
                  />

                  <Controller
                    name='preventiveSteps'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Steps to Prevent Future Incidents'
                        placeholder='Steps to Prevent Future Incidents'
                        error={Boolean(errors.preventiveSteps)}
                        helperText={errors.preventiveSteps?.message}
                      />
                    )}
                  />

                </Box>
              </Box>
            </Box>
          </>
        </Box>
        {/* bottom buttons */}
        <Box
          sx={{
            height: '122px',
            width: '100%',
            width: {
              xs: '100%', // 0px and up
              sm: '560px'
            },
            position: 'fixed',
            bottom: 0,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
            zIndex: 123
          }}
        >
          <LoadingButton
            fullWidth
            type='submit'
            variant='contained'
            size='large'
            sx={{ height: '58px', width: '514px', mx: 4 }}
            // onClick={() => {
            //   handleSubmit()
            // }}
            disabled={uploadingAttachment}
            loading={uploadingAttachment}
          >
            Submit
          </LoadingButton>
        </Box>
      </form>
    </Drawer>
  )
}

export default ReportMissingIncidentForm



