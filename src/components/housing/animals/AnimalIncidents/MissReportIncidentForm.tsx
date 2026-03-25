import React, { useContext, useEffect, useRef, useState } from 'react'
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
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { updateAnimalIncident } from 'src/lib/api/housing'
import Toaster from 'src/components/Toaster'
import imageUploader from 'public/images/gallery_add_Icon.png'
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Image from 'next/image'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { AuthContext } from 'src/context/AuthContext'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'

interface PreparedByUser {
  user_id: string
  user_name: string
}

interface MissReportIncidentFormProps {
  missReportIncidence: string
  missReportIncidentForm: boolean
  setMissReportIncidentForm: (open: boolean) => void
  animalId: string | string[] | undefined
  incidentId: number | null
  fetchAnimalIncidents: () => void
}

interface FormValues {
  incidentType: string
  misReportedBy: string
  notes: string
}

const defaultValues: FormValues = {
  incidentType: '',
  misReportedBy: '',
  notes: ''
}

const schema = yup.object().shape({
  misReportedBy: yup.string().required('Reporter is required'),
  notes: yup.string().required('Notes are required'),
  incidentType: yup.string().required('Incident type is required')
})

const MissReportIncidentForm: React.FC<MissReportIncidentFormProps> = ({
  missReportIncidence,
  missReportIncidentForm,
  setMissReportIncidentForm,
  animalId,
  incidentId,
  fetchAnimalIncidents
}) => {
  const theme = useTheme() as any
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authData = useContext(AuthContext)

  const [preparedByUsers, setPreparedByUsers] = useState<PreparedByUser[]>([])
  const [defaultPreparedBy, setDefaultPreparedBy] = useState<PreparedByUser | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null) // ADD THIS

  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false)

  useEffect(() => {
    if (missReportIncidence) {
      setValue('incidentType', missReportIncidence)
    }
  }, [missReportIncidence])

  // Fetch user list from context zoo and prefill current user
  const getUsers = async (): Promise<void> => {
    try {
      const zoo_id = (authData as any)?.userData?.user?.zoos?.[0]?.zoo_id
      if (!zoo_id) return
      const Users = await getUserList({ zoo_id })
      setPreparedByUsers(Users?.data || [])
    } catch (error) {
      Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
    }
  }

  useEffect(() => {
    if (missReportIncidentForm) {
      getUsers()
      const user = (authData as any)?.userData?.user
      if (user) {
        const current: PreparedByUser = {
          user_id: user?.user_id,
          user_name: `${user?.user_first_name} ${user?.user_last_name}`
        }
        setDefaultPreparedBy(current)
        setValue('misReportedBy', current.user_id)
      }
    }
  }, [missReportIncidentForm, authData])

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
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

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
    setValue('attachment' as any, file.name)
    if (file.name) {
      clearErrors('attachment' as any)
    }
  }

  ////////////////////////////////////////////////////////////
  const onSubmit = async (data: FormValues): Promise<void> => {
    if (!incidentId) {
      Toaster({ type: 'error', message: 'Incident ID is missing' })

      return
    }

    const { incidentType, misReportedBy, notes } = data

    const formData = new FormData()
    formData.append('incident_details_id', String(incidentId))
    formData.append('incident_type', incidentType.toLowerCase())
    formData.append('reported_by', misReportedBy)
    formData.append('notes', notes)
    formData.append('is_misreported', '1')

    setUploadingAttachment(true)
    try {
      const res = await updateAnimalIncident(formData)
      if (res.success) {
        Toaster({ type: 'success', message: res.message || 'Incident updated successfully' })
        fetchAnimalIncidents()
        handleCloseFormDrawer()
      } else {
        Toaster({ type: 'error', message: res.message || 'Failed to update incident' })
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error.message || 'Failed to update incident' })
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleCloseFormDrawer = (): void => {
    reset()
    setDefaultPreparedBy(null)
    setMissReportIncidentForm(false)
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
          Report Escaped/missing
        </Typography>
      </Box>
      <IconButton
        size='small'
        sx={{ color: 'text.primary', height: '40px', width: '40px' }}
        onClick={() => {
          reset()
          setMissReportIncidentForm(false)
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
    }
  }

  return (
    <Drawer
      anchor='right'
      open={missReportIncidentForm}
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
                      name='incidentType'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          options={['Found', 'Missing']} // Static options
                          value={value || null} // Bind to form value
                          onChange={(e: React.SyntheticEvent, val: string | null) => onChange(val || '')} // Update on selection
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Incident Type *'
                              placeholder='Search & Select'
                              error={Boolean(errors.incidentType)}
                              helperText={errors?.incidentType?.message}
                              sx={{
                                ...basicStyle
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='misReportedBy'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          value={defaultPreparedBy}
                          options={preparedByUsers}
                          getOptionLabel={(option: PreparedByUser) => option.user_name}
                          isOptionEqualToValue={(option: PreparedByUser, value: PreparedByUser) =>
                            option?.user_id === value?.user_id
                          }
                          onChange={(e: React.SyntheticEvent, val: PreparedByUser | null) => {
                            setDefaultPreparedBy(val)
                            onChange(val?.user_id || '')
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Misreported by *'
                              placeholder='Search & Select'
                              error={Boolean(errors.misReportedBy)}
                              helperText={errors?.misReportedBy?.message}
                              sx={{
                                ...basicStyle
                              }}
                            />
                          )}
                        />
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
                          label='Write notes here'
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
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {(errors as any)?.localIdentifier?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
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
            onClick={() => {
              handleSubmit(onSubmit)()

              // setMissReportIncidentForm(false)
            }}
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

export default MissReportIncidentForm
