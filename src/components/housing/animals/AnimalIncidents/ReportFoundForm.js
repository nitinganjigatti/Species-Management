import { LoadingButton } from '@mui/lab'
import { Autocomplete, Drawer, FormControl, FormHelperText, IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
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
import { readAsync } from 'src/lib/windows/utils'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'

const defaultValues = {
  foundDate: dayjs(),
  foundTime: dayjs(),
  location: '',
  foundBy: '',
  notes: '',
  attachment: '',
  physicalCondition: '',
  behaviourObservation: '',
  healthAssessment: '',
  injuryDetails: '',
  immediatectionsTaken: ''
}

const schema = yup.object().shape({
  foundDate: yup.date().required('Date is required'),
  foundTime: yup.date().required('Time is required'),
  location: yup.string().required('Location is required'),
  foundBy: yup.string().required('Founder is required')
})

const ReportFoundForm = ({ reportFoundForm, setReportFoundForm, animalId }) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const [foundByUsers, setFoundByUsers] = useState([])
  const [defaultPreparedBy, setDefaultPreparedBy] = useState(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState(null)

  const [previewUrl, setPreviewUrl] = useState(null) // ADD THIS

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

  const getUsers = async () => {
    try {
      const userDetails = await readAsync('userDetails')
      const zoo_id = userDetails?.user?.zoos[0].zoo_id
      const Users = await getUserList({ zoo_id })

      setFoundByUsers(Users?.data)
    } catch (error) {
      Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
    }
  }

  useEffect(() => {
    if (reportFoundForm) {
      getUsers()
      // getUserData()
    }
  }, [reportFoundForm])

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
    const {
      incident_date,
      incident_time,
      foundBy,
      notes,
      attachment,
      last_seen,
      animal_behaviour_before_incident,
      action_taken,
      steps_to_prevent
    } = data

    const formData = new FormData()
    formData.append('incident_type', 'missing')
    formData.append('incident_date', moment(incident_date).format('YYYY-MM-DD'))
    formData.append('incident_time', moment(incident_time).format('HH:mm:ss'))
    formData.append('reported_by', foundBy.user_id)
    formData.append('notes', notes)
    formData.append(
      'additional_info',
      JSON.stringify({
        last_seen,
        animal_behaviour_before_incident,
        action_taken,
        steps_to_prevent
      })
    )

    if (selectedFile) {
      formData.append('media_attachment', [selectedFile])
    }

    if (isEdit) {
      formData.append('incident_details_id', incidenceId)
    } else {
      formData.append('ref_id', animalId)
    }

    setUploadingAttachment(true)
    try {
      // console.log('second', formData)
      if (isEdit) {
        const res = await updateAnimalIncident(formData)
        if (res.success) {
          Toaster({ type: 'success', message: res.message || 'Incident updated successfully' })
          fetchAnimalIncidents()
          handleCloseFormDrawer()
        } else {
          fetchAnimalIncidents()
          handleCloseFormDrawer()
          Toaster({ type: 'error', message: res.message || 'Failed to update incident' })
        }
      } else {
        const res = await createAnimalIncident(formData)
        if (res.success) {
          Toaster({ type: 'success', message: res.message || 'Incident created successfully' })
          fetchAnimalIncidents()
          handleCloseFormDrawer()
        } else {
          fetchAnimalIncidents()
          handleCloseFormDrawer()
          Toaster({ type: 'error', message: res.message || 'Failed to create incident' })
        }
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
            whiteSpace: 'nowrap'
          }}
        >
          Report Found Animal
        </Typography>
      </Box>
      <IconButton
        size='small'
        sx={{ color: 'text.primary', height: '40px', width: '40px' }}
        onClick={() => {
          reset()
          setReportFoundForm(false)
        }}
      >
        <Icon icon='mdi:close' fontSize={24} />
      </IconButton>
    </Box>
  )

  const basicStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  return (
    <Drawer
      anchor='right'
      open={reportFoundForm}
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
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Found date and time
                </Typography>

                <Box
                  sx={{
                    p: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    backgroundColor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  }}
                >
                  <FormControl fullWidth>
                    <Controller
                      name='foundDate'
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
                      name='foundTime'
                      control={control}
                      // defaultValue={dayjs()} // or null
                      render={({ field }) => (
                        <LocalizationProvider LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            {...field}
                            label='Time'
                            format='hh:mm A'
                            sx={{
                              ...basicStyle
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: Boolean(errors.foundTime),
                                helperText: errors.foundTime?.message,
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
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Location
                </Typography>
                <Box
                  sx={{
                    p: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    backgroundColor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  }}
                >
                  <Controller
                    name='location'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Location found *'
                        placeholder='Enter Location'
                        error={Boolean(errors.location)}
                        helperText={errors.location?.message}
                      />
                    )}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Found by
                </Typography>

                <Box
                  sx={{
                    p: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    backgroundColor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  }}
                >
                  <FormControl fullWidth>
                    <Controller
                      name='foundBy'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          value={defaultPreparedBy}
                          options={foundByUsers}
                          getOptionLabel={option => option.user_name}
                          isOptionEqualToValue={(option, value) => option?.user_id === value?.user_id}
                          onChange={(e, val) => {
                            setDefaultPreparedBy(val)
                            onChange(val?.user_id || '')
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Found by *'
                              placeholder='Search & Select'
                              error={Boolean(errors.foundBy)}
                              helperText={errors?.foundBy?.message}
                              sx={{
                                ...basicStyle
                              }}
                            />
                          )}
                        />
                      )}
                    />
                    {errors && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors?.localIdentifierType?.message}
                      </FormHelperText>
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
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Notes
                </Typography>

                <Box
                  sx={{
                    p: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    backgroundColor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  }}
                >
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
                          label='Notes'
                          placeholder='Write notes here'
                          error={Boolean(errors.notes)}
                          helperText={errors.notes?.message}
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
                            accept={[
                              'image/png',
                              'image/jpeg',
                              'image/jpg',
                              'image/gif',
                              'image/webp',
                              'image/svg+xml'
                            ]}
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
                              borderRadius: '10px'

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
                              Add attachments if any
                            </Typography>
                          </Box>
                        </>
                      )}
                    />
                    {errors.attachment && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.attachment?.message}</FormHelperText>
                    )}
                  </FormControl>
                  {selectedFile && (
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
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Conditon of animal upon return
                </Typography>

                <Box
                  sx={{
                    p: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    backgroundColor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  }}
                >
                  <Controller
                    name='physicalCondition'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Physical condition'
                        placeholder='Physical condition'
                        error={Boolean(errors.physicalCondition)}
                        helperText={errors.physicalCondition?.message}
                      />
                    )}
                  />

                  <Controller
                    name='behaviourObservation'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Behavioural observation'
                        placeholder='Behavioural observation'
                        error={Boolean(errors.behaviourObservation)}
                        helperText={errors.behaviourObservation?.message}
                      />
                    )}
                  />

                  <Controller
                    name='healthAssessment'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Health assessment'
                        placeholder='Health assessment'
                        error={Boolean(errors.healthAssessment)}
                        helperText={errors.healthAssessment?.message}
                      />
                    )}
                  />

                  <Controller
                    name='injuryDetails'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Injury details'
                        placeholder='Injury details'
                        error={Boolean(errors.injuryDetails)}
                        helperText={errors.injuryDetails?.message}
                      />
                    )}
                  />
                  <Controller
                    name='immediatectionsTaken'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        sx={{ ...basicStyle }}
                        label='Immediate actions taken'
                        placeholder='Immediate actions taken'
                        error={Boolean(errors.immediatectionsTaken)}
                        helperText={errors.immediatectionsTaken?.message}
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

export default ReportFoundForm
