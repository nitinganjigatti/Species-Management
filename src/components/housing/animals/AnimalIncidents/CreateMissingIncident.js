import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import imageUploader from 'public/images/gallery_add_Icon.png'

import { Drawer, FormControl, FormHelperText, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import moment from 'moment'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'

import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { read, readAsync } from 'src/lib/windows/utils'
import { createAnimalIncident, updateAnimalIncident } from 'src/lib/api/housing'

const defaultValues = {
  incident_date: dayjs(),
  incident_time: dayjs(),
  reported_by: {
    user_id: '',
    user_name: ''
  },
  notes: '',
  attachment: '',
  animal_behaviour_before_incident: '',
  action_taken: '',
  steps_to_prevent: ''
}

const schema = yup.object().shape({
  incident_date: yup.date().required('Date is required'),
  incident_time: yup.date().required('Time is required'),
  reported_by: yup
    .object({
      user_id: yup.string().required('Reporter is required'),
      user_name: yup.string().nullable()
    })
    .nullable()
    .required('Reporter is required')
})

const CreateMissingIncident = ({
  animalIncidentForm,
  setAnimalIncidentForm,
  animalId,
  isEdit,
  editData,
  fetchAnimalIncidents
}) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const timeInputRef = useRef(null)

  const [incidenceId, setIncidenceId] = useState(null)
  const [reportedByUsers, setReportedByUsers] = useState([])
  const [defaultReportedBy, setDefaultReportedBy] = useState(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState(null)

  const [previewUrl, setPreviewUrl] = useState(null)

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

  const getUserData = () => {
    // Pre-fill current user only in add mode
    if (isEdit) return
    const result = read('userDetails')
    setValue('reported_by', {
      user_id: result?.user?.user_id,
      user_name: `${result?.user?.user_first_name} ${result?.user?.user_last_name}`
    })
  }

  useEffect(() => {
    if (animalIncidentForm) {
      getUsers()
      getUserData()
    }
  }, [animalIncidentForm, isEdit])

  useEffect(() => {
    // Populate form in edit mode, including time and reporter mapping
    if (animalIncidentForm && isEdit && editData) {
      setIncidenceId(editData?.id)

      const incidentDateVal = editData?.incident_date ? dayjs(editData.incident_date) : null
      setValue('incident_date', incidentDateVal)

      // Many APIs return only a combined datetime; if explicit time is absent, derive from incident_date
      const timeFromEdit = editData?.incident_time
        ? dayjs(editData.incident_time, ['HH:mm:ss', 'hh:mm A'])
        : incidentDateVal
      setValue('incident_time', timeFromEdit || null)

      // Map reporter to the Autocomplete expected shape { user_id, user_name }
      const rbId = editData?.reported_by?.user_id || editData?.reported_by_id || editData?.reported_by
      const rbName = editData?.reported_by?.user_name || editData?.reported_by_name
      let reporterObj = null
      if (rbId) {
        const match = reportedByUsers?.find(u => String(u?.user_id) === String(rbId))
        reporterObj = match || { user_id: rbId, user_name: rbName || '' }
      } else if (rbName) {
        const match = reportedByUsers?.find(u => String(u?.user_name)?.toLowerCase() === String(rbName)?.toLowerCase())
        if (match) reporterObj = match
      }
      setValue('reported_by', reporterObj)

      setValue('notes', editData?.notes || '')
      setValue('attachment', editData?.attachment || '') // If present
      setValue('action_taken', editData?.additional_info?.action_taken || '')
      setValue(
        'animal_behaviour_before_incident',
        editData?.additional_info?.animal_behaviour_before_incident || ''
      )
      setValue('steps_to_prevent', editData?.additional_info?.steps_to_prevent || '')
      setValue('last_seen', editData?.additional_info?.last_seen || '')
    }
  }, [animalIncidentForm, isEdit, editData, reportedByUsers, setValue])

  const getUsers = async () => {
    try {
      const userDetails = await readAsync('userDetails')
      const zoo_id = userDetails?.user?.zoos[0].zoo_id
      const Users = await getUserList({ zoo_id })

      setReportedByUsers(Users?.data)
    } catch (error) {
      Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
    }
  }

  const handleFileUpload = async (event, speciesId) => {
    const file = event?.target?.files[0]

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!file || !allowedTypes.includes(file.type)) {
      Toaster({
        type: 'error',
        message: 'Only image files are supported. Please upload a PNG/JPG/GIF/WebP/SVG.',
        ignoreCase: true
      })

      return
    }
    console.log('file', file)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setSelectedFileName(file.name)
    setValue('attachment', file.name)
    if (file.name) {
      clearErrors('attachment')
    }
  }

  const handleCloseFormDrawer = () => {
    reset()
    setDefaultReportedBy(null)
    setAnimalIncidentForm(false)
    setSelectedFile(null)
    setSelectedFileName(null)
    setIncidenceId(null)
  }

  ////////////////////////////////////////////////////////////
  const onSubmit = async data => {
    const {
      incident_date,
      incident_time,
      reported_by,
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
    formData.append('reported_by', reported_by.user_id)
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
          Report Escaped/missing
        </Typography>
      </Box>
      <IconButton
        size='small'
        sx={{ color: 'text.primary', height: '40px', width: '40px' }}
        onClick={() => {
          // reset()
          // setAnimalIncidentForm(false)
          handleCloseFormDrawer()
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
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Missing Since
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
                  <ControlledDatePicker
                    name='incident_date'
                    control={control}
                    errors={errors}
                    defaultValue={dayjs()}
                    sx={{
                      ...basicStyle
                    }}
                  />
                  <ControlledTimePicker
                    name='incident_time'
                    control={control}
                    errors={errors}
                    sx={{
                      ...basicStyle
                    }}
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
                  Missing Reported by
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
                  <ControlledAutocomplete
                    name='reported_by'
                    control={control}
                    options={reportedByUsers}
                    getOptionLabel={option => option.user_name}
                    isOptionEqualToValue={(option, value) =>
                      option?.user_id ? option?.user_id === value?.user_id : false
                    }
                    label='Reported by *'
                    placeholder='Search & Select'
                    errors={errors}
                    required
                    sx={{
                      ...basicStyle
                    }}
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
                  <ControlledTextField
                    name='notes'
                    control={control}
                    rules={{ required: true }}
                    multiline
                    rows={3}
                    label='Write notes here'
                    placeholder='Write notes here'
                    errors={errors}
                    sx={{
                      ...basicStyle
                    }}
                  />
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
                  Additional Information
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
                  <ControlledTextField
                    name='last_seen'
                    control={control}
                    rules={{ required: true }}
                    sx={{ ...basicStyle }}
                    label='Last Seen/Escaped From'
                    placeholder='Last Seen/Escaped From'
                    errors={errors}
                    helperText={errors.last_seen?.message}
                  />

                  <ControlledTextField
                    name='animal_behaviour_before_incident'
                    control={control}
                    rules={{ required: true }}
                    sx={{ ...basicStyle }}
                    label='Animal Behaviour Before Incident'
                    placeholder='Animal Behaviour Before Incident'
                    errors={errors}
                    helperText={errors.animal_behaviour_before_incident?.message}
                  />

                  <ControlledTextField
                    name='action_taken'
                    control={control}
                    rules={{ required: true }}
                    sx={{ ...basicStyle }}
                    label='Actions Taken'
                    placeholder='Actions Taken'
                    errors={errors}
                    helperText={errors.action_taken?.message}
                  />

                  <ControlledTextField
                    name='steps_to_prevent'
                    control={control}
                    rules={{ required: true }}
                    sx={{ ...basicStyle }}
                    label='Steps to Prevent Future Incidents'
                    placeholder='Steps to Prevent Future Incidents'
                    errors={errors}
                    helperText={errors.steps_to_prevent?.message}
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

export default CreateMissingIncident
