import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Avatar,
  Drawer,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { speciesAttachmentUpload } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'
import imageUploader from 'public/images/gallery_add_Icon.png'

import UploadDocIcon from 'public/icons/Upload_doc_icon.png'

import { useForm, Controller, FieldValues } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Image from 'next/image'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { AuthContext } from 'src/context/AuthContext'

interface UserOption {
  user_id: string | number
  user_name: string
}

interface AnimalData {
  default_icon?: string
  scientific_name?: string
  common_name?: string
}

interface UploadAnimalDietProps {
  uploadAnimalDietDrawer: boolean
  setUploadAnimalDietDrawer: (open: boolean) => void
  animalId: string | string[] | undefined | null
  setAnimalId: (id: string | string[] | undefined | null) => void
  fetchTableData?: () => void
  animalData?: AnimalData
}

interface FormValues {
  dietitian_id: string
  notes: string
  attachment: string
}

const defaultValues: FormValues = {
  dietitian_id: '',
  notes: '',
  attachment: ''
}

const schema = yup.object().shape({
  dietitian_id: yup.string().trim().required('Dietitian name is required'),
  attachment: yup.string().required('Attachment is required')
})

const UploadAnimalDiet: React.FC<UploadAnimalDietProps> = ({
  uploadAnimalDietDrawer,
  setUploadAnimalDietDrawer,
  animalId,
  setAnimalId,
  fetchTableData,
  animalData
}) => {
    const theme = useTheme() as any
    const fileInputRef = useRef<HTMLInputElement>(null)
    const authData = useContext(AuthContext)

  const [preparedByUsers, setPreparedByUsers] = useState<UserOption[]>([])
  const [defaultPreparedBy, setDefaultPreparedBy] = useState<UserOption | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

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

    useEffect(() => {
        if (uploadAnimalDietDrawer) {
            getUsers()

            // Prefill with current user when opening
            const user = (authData as any)?.userData?.user
            if (user) {
                const current: UserOption = { user_id: user?.user_id, user_name: `${user?.user_first_name} ${user?.user_last_name}` }
                setDefaultPreparedBy(current)
                setValue('dietitian_id', String(current.user_id))
            }
        }
    }, [uploadAnimalDietDrawer, authData])

    const getUsers = async (): Promise<void> => {
        try {
            const zoo_id = (authData as any)?.userData?.user?.zoos?.[0]?.zoo_id
            if (!zoo_id) return
            const Users = await getUserList({ zoo_id })
            setPreparedByUsers(Users?.data)
        } catch (error) {
            Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
        }
    }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, speciesId?: string): Promise<void> => {
    const file = event?.target?.files?.[0]

    const allowedTypes = ['application/pdf']
    if (!file || !allowedTypes.includes(file.type)) {
      Toaster({ type: 'error', message: 'Only PDF files are supported. Please upload a PDF file.', ignoreCase: true })

      return
    }
    setSelectedFile(file)
    setSelectedFileName(file.name)
    setValue('attachment', file.name)
    if (file.name) {
      clearErrors('attachment')
    }
  }

  ////////////////////////////////////////////////////////////
  const onSubmit = async ({ dietitian_id, notes }: { dietitian_id: string; notes: string }): Promise<void> => {
    setUploadingAttachment(true)
    try {
      const res = await speciesAttachmentUpload({
        species_id: (animalData as any)?.speciesId,
        attachment: selectedFile,
        dietitian_id,
        notes
      })
      Toaster({ type: 'success', message: res.message })
      fetchTableData?.()
      setUploadAnimalDietDrawer(false)
      reset()
      setDefaultPreparedBy(null)
      setSelectedFileName(null)
      setSelectedFile(null)
      // handleSearch('')
      // if (speciesDetailsDrawer) {
      //   getSpecieDetail(speciesId)
      // }
    } catch (error: any) {
      Toaster({ type: 'error', message: error.message || 'File upload failed.' })
    } finally {
      setUploadingAttachment(false)
    }
  }

  const SpeciesDietCard: React.FC = () => (
    <Box
      sx={{
        position: 'fixed',
        width: {
          xs: '100%', // 0px and up
          sm: '560px'
        },
        zIndex: 100,
        backgroundColor: '#fff',
        display: 'flex',
        gap: 1,
        padding: '20px 16px'
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
              border: '1px solid #C3CEC7',
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {animalData?.default_icon ? (
              <img style={{ width: '100%', height: '100%' }} src={animalData?.default_icon} alt='Profile' />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Tooltip title={animalData?.scientific_name ? animalData?.scientific_name : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 360
                }}
              >
                {animalData?.scientific_name ? animalData?.scientific_name : '-'}
              </Typography>
            </Tooltip>
            <Tooltip title={animalData?.common_name ? animalData?.common_name : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontStyle: 'italic',
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 360
                }}
              >
                {animalData?.common_name ? animalData?.common_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      <IconButton
        size='small'
        sx={{ color: 'text.primary', height: '40px', width: '40px' }}
        onClick={() => {
          setAnimalId(null)
          reset()
          setUploadAnimalDietDrawer(false)
        }}
      >
        <Icon icon='mdi:close' fontSize={24} />
      </IconButton>
    </Box>
  )

  return (
    <Drawer
      anchor='right'
      open={uploadAnimalDietDrawer}
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
          {/* {!!detailsLoader ? (
            <Box sx={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : ( */}
          <>
            {SpeciesDietCard({})}
            <Box
              sx={{
                mt: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              <Box
                sx={{
                  m: '20px',
                  px: '16px',
                  py: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: 1,
                  borderColor: '#c3cec7'
                }}
              >
                <FormControl fullWidth>
                  <Controller
                    name='dietitian_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        value={defaultPreparedBy}
                        disablePortal
                        id='dietitian_id'
                        options={preparedByUsers}
                        getOptionLabel={(option: UserOption) => option.user_name}
                        isOptionEqualToValue={(option: UserOption, value: UserOption) => option?.user_id === value?.user_id}
                        onChange={(e: React.SyntheticEvent, val: UserOption | null) => {
                          if (val === null) {
                            setDefaultPreparedBy(null)

                            return onChange('')
                          } else {
                            setDefaultPreparedBy(val)
                            setValue('dietitian_id', '')

                            return onChange(String(val.user_id))
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Nutritionist *'
                            placeholder='Search & Select'
                            error={Boolean(errors.dietitian_id)}
                          />
                        )}
                      />
                    )}
                  />
                  {errors && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.dietitian_id?.message}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth>
                  <Controller
                    name='notes'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        type='text'
                        label='Enter notes'
                        value={value}
                        onChange={onChange}
                        focused={value !== ''}
                        multiline
                        rows={3}
                        placeholder='Enter notes'
                        name='nursery_name'
                      />
                    )}
                  />
                </FormControl>
                <Grid container sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: 20,
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      mb: '10px'
                    }}
                  >
                    Upload diet
                  </Typography>
                  <FormControl fullWidth>
                    <Controller
                      name='notes'
                      control={control}

                      //   rules={{ required: !editNurseryId }}
                      render={({ field: { value, onChange } }) => (
                        <Grid onClick={() => fileInputRef.current?.click()} size={{ md: 12, sm: 12, xs: 12 }}>
                          <input
                            type='file'
                            multiple
                            accept='application/pdf'
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileUpload(e)
                            }}
                          />
                          <Box
                            sx={{
                              height: '88px',
                              border: `1px solid ${
                                errors.attachment
                                  ? theme.palette.customColors.errorText
                                  : theme.palette.customColors.OutlineVariant
                              }`,
                              borderRadius: '8px',
                              paddingX: '16px',
                              paddingY: '20px'
                            }}
                          >
                            {selectedFile && selectedFileName ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  height: '48px'
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    height: '48px'
                                  }}
                                >
                                  <Image alt={'filename'} src={'/icons/pdf_icon2.svg'} width={48} height={48} />
                                  <Typography
                                    sx={{
                                      backgroundColor: theme.palette.customColors.Background,
                                      padding: '8px',
                                      borderRadius: '4px',
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      letterSpacing: '0%',
                                      color: theme.palette.customColors.OnSurfaceVariant
                                    }}
                                  >
                                    {selectedFileName}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size='small'
                                  sx={{ color: 'text.primary' }}
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation()
                                    setSelectedFile(null)
                                    setError('attachment', { type: 'required', message: 'Attachment is required' })
                                  }}
                                >
                                  <Icon icon='mdi:close' fontSize={24} />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 7,
                                  height: '48px',
                                  border: `1px dashed ${theme.palette.customColors.OutlineVariant}`,
                                  borderRadius: '10px',
                                  padding: 3
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
                            )}
                          </Box>
                        </Grid>
                      )}
                    />
                    {errors.attachment && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.attachment?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Box>
            </Box>
          </>
          {/* )} */}
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

export default UploadAnimalDiet
