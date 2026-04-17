import React, { useContext, useEffect, useRef, useState } from 'react'
import { LoadingButton } from '@mui/lab'
import { Autocomplete, Drawer, FormControl, FormHelperText, IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { speciesAttachmentUpload } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'
import imageUploader from 'public/images/gallery_add_Icon.png'
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import moment from 'moment'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Image from 'next/image'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

// Use AuthContext instead of direct storage access
import { AuthContext } from 'src/context/AuthContext'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { createAnimalIncident } from 'src/lib/api/housing'
import { useTranslation } from 'react-i18next'

interface FoundByUser {
  user_id: string
  user_name: string
}

interface ReportFoundFormProps {
  reportFoundForm: boolean
  setReportFoundForm: (open: boolean) => void
  animalId: string | string[] | undefined
}

interface FormValues {
  foundDate: Dayjs | null
  foundTime: Dayjs | null
  location: string
  foundBy: string
  notes: string
  attachment: string
  physicalCondition: string
  behaviourObservation: string
  healthAssessment: string
  injuryDetails: string
  immediatectionsTaken: string
}

const defaultValues: FormValues = {
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

const ReportFoundForm: React.FC<ReportFoundFormProps> = ({ reportFoundForm, setReportFoundForm, animalId }) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const authData = useContext(AuthContext)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [foundByUsers, setFoundByUsers] = useState<FoundByUser[]>([])
  const [defaultPreparedBy, setDefaultPreparedBy] = useState<FoundByUser | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null) // ADD THIS

  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false)

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
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema) as any,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const getUsers = async (): Promise<void> => {
    try {
      const zoo_id = (authData as any)?.userData?.user?.zoos?.[0]?.zoo_id
      if (!zoo_id) return
      const Users = await getUserList({ zoo_id })
      setFoundByUsers(Users?.data)
    } catch (error) {
      Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
    }
  }

  useEffect(() => {
    if (reportFoundForm) {
      getUsers()

      // Prefill current user as founder
      const user = (authData as any)?.userData?.user
      if (user) {
        const current: FoundByUser = { user_id: user?.user_id, user_name: `${user?.user_first_name} ${user?.user_last_name}` }
        setDefaultPreparedBy(current)
        setValue('foundBy', current.user_id)
      }
    }
  }, [reportFoundForm, authData])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, speciesId?: string): Promise<void> => {
    const file = event?.target?.files?.[0]

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!file || !allowedTypes.includes(file.type)) {
      Toaster({
        type: 'error',
        message: 'Only image files are supported. Please upload a PNG/JPG/GIF/WebP/SVG.',
        ignoreCase: true
      })

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
  const onSubmit = async (data: FormValues): Promise<void> => {
    const {
      foundDate,
      foundTime,
      foundBy,
      location,
      notes,
      physicalCondition,
      behaviourObservation,
      healthAssessment,
      injuryDetails,
      immediatectionsTaken
    } = data

    const formData = new FormData()
    formData.append('incident_type', 'found')
    formData.append('incident_date', dayjs(foundDate).format('YYYY-MM-DD'))
    formData.append('incident_time', dayjs(foundTime).format('HH:mm:ss'))
    formData.append('reported_by', foundBy)
    formData.append('notes', notes)
    formData.append(
      'additional_info',
      JSON.stringify({
        location,
        physical_condition: physicalCondition,
        behavioural_observation: behaviourObservation,
        health_assessment: healthAssessment,
        injury_details: injuryDetails,
        immediate_actions_taken: immediatectionsTaken
      })
    )

    if (selectedFile) {
      formData.append('media_attachment', selectedFile)
    }

    // Report Found currently only supports create flow
    formData.append('ref_id', String(animalId))

    setUploadingAttachment(true)
    try {
      // console.log('second', formData)
      const res = await createAnimalIncident(formData)
      if (res.success) {
        Toaster({ type: 'success', message: res.message || 'Incident created successfully' })

        // Optional: refresh list if parent passes a callback in future
        // fetchAnimalIncidents?.()
        reset()
        setReportFoundForm(false)
      } else {
        Toaster({ type: 'error', message: res.message || 'Failed to create incident' })
      }
    } catch (error: any) {
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

  const SpeciesDietCard: React.FC = () => (
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
          {t('animals_module.report_found_animal')}
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
            <SpeciesDietCard />
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
                  {t('animals_module.found_date_and_time')}
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
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            sx={{
                              ...basicStyle
                            }}
                            {...field} // use the actual field from react-hook-form
                            label={t('date') as string}
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
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            {...field}
                            label={t('time') as string}
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
                  {t('location')}
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
                        label={t('animals_module.location_found') as string}
                        placeholder={t('animals_module.enter_location') as string}
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
                  {t('animals_module.found_by')}
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
                          getOptionLabel={(option: FoundByUser) => option.user_name}
                          isOptionEqualToValue={(option: FoundByUser, value: FoundByUser) => option?.user_id === value?.user_id}
                          onChange={(e: React.SyntheticEvent, val: FoundByUser | null) => {
                            setDefaultPreparedBy(val)
                            onChange(val?.user_id || '')
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label={t('animals_module.found_by') as string}
                              placeholder={t('search_and_select') as string}
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
                        {(errors as any)?.localIdentifierType?.message}
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
                  {t('notes')}
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
                          label={t('notes') as string}
                          placeholder={t('animals_module.write_notes_placeholder') as string}
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
                      <FormHelperText sx={{ color: 'error.main' }}>{(errors as any)?.localIdentifier?.message}</FormHelperText>
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
                            accept='image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml'
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileUpload(e)
                            }}
                          />

                          <Box
                            onClick={() => fileInputRef.current?.click()}
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
                              {t('animals_module.add_attachments')}
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
                        src={previewUrl || ''}
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
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            setSelectedFile(null)
                            setError('attachment', { type: 'manual' })
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
                  {t('animals_module.condition_upon_return')}
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
                        label={t('animals_module.physical_condition') as string}
                        placeholder={t('animals_module.physical_condition') as string}
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
                        label={t('animals_module.behavioural_observation') as string}
                        placeholder={t('animals_module.behavioural_observation') as string}
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
                        label={t('animals_module.health_assessment') as string}
                        placeholder={t('animals_module.health_assessment') as string}
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
                        label={t('animals_module.injury_details') as string}
                        placeholder={t('animals_module.injury_details') as string}
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
                        label={t('animals_module.immediate_actions_taken') as string}
                        placeholder={t('animals_module.immediate_actions_taken') as string}
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
            width: {
              xs: '100%', // 0px and up
              sm: '560px'
            },
            position: 'fixed',
            bottom: 0,
            bgcolor: theme.palette.customColors?.OnPrimary,
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
            {t('submit')}
          </LoadingButton>
        </Box>
      </form>
    </Drawer>
  )
}

export default ReportFoundForm
