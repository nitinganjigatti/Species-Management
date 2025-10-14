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
import React, { useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { speciesAttachmentUpload } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'
import imageUploader from 'public/images/gallery_add_Icon.png'

import UploadDocIcon from 'public/icons/Upload_doc_icon.png'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Image from 'next/image'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const defaultValues = {
  dietitian_id: '',
  notes: '',
  attachment: ''
}

const schema = yup.object().shape({
  dietitian_id: yup.string().trim().required('Dietitian name is required'),
  attachment: yup.string().required('Attachment is required')
})

function UploadDiet({
  uploadDietDrawer,
  setUploadDietDrawer,
  speciesId,
  setspeciesId,
  fetchTableData,
  speciesData,
  getSpecieDetail,
  handleSearch = () => {},
  speciesDetailsDrawer
}) {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const [preparedByUsers, setPreparedByUsers] = useState([])
  const [defaultPreparedBy, setDefaultPreparedBy] = useState(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState(null)

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

  useEffect(() => {
    if (uploadDietDrawer) {
      getUsers()
    }
  }, [uploadDietDrawer])

  const getUsers = async () => {
    try {
      const userDetails = await readAsync('userDetails')
      const zoo_id = userDetails?.user?.zoos[0].zoo_id
      const Users = await getUserList({ zoo_id })

      setPreparedByUsers(Users?.data)
    } catch (error) {
      Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
    }
  }

  const handleFileUpload = async (event, speciesId) => {
    const file = event?.target?.files[0]

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
  const onSubmit = async ({ dietitian_id, notes }) => {
    setUploadingAttachment(true)
    try {
      const res = await speciesAttachmentUpload({
        species_id: speciesId,
        attachment: selectedFile,
        dietitian_id,
        notes
      })
      Toaster({ type: 'success', message: res.message })
      fetchTableData()
      setUploadDietDrawer(false)
      reset()
      setDefaultPreparedBy(null)
      setSelectedFileName(null)
      setSelectedFile(null)
      if (typeof handleSearch === 'function') handleSearch('')
      if (speciesDetailsDrawer) {
        getSpecieDetail(speciesId)
      }
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'File upload failed.' })
    } finally {
      setUploadingAttachment(false)
    }
  }

  const SpeciesDietCard = () => (
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
        <SpeciesCard species={speciesData} />
      </Box>
      <IconButton
        size='small'
        sx={{ color: 'text.primary', height: '40px', width: '40px' }}
        onClick={() => {
          setspeciesId(null)
          reset()
          setUploadDietDrawer(false)
        }}
      >
        <Icon icon='mdi:close' fontSize={24} />
      </IconButton>
    </Box>
  )

  return (
    <Drawer
      anchor='right'
      open={uploadDietDrawer}
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
            {SpeciesDietCard()}
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
                        name='dietitian_id'
                        value={defaultPreparedBy}
                        disablePortal
                        id='dietitian_id'
                        loading={!preparedByUsers?.length}
                        options={preparedByUsers}
                        getOptionLabel={option => option.user_name}
                        isOptionEqualToValue={(option, value) => option?.user_id === value?.user_id}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultPreparedBy(null)

                            return onChange('')
                          } else {
                            setDefaultPreparedBy(val)
                            setValue('dietitian_id', '')

                            return onChange(val.user_id)
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
                        <Grid onClick={() => fileInputRef.current.click()} item size={{ md: 12, sm: 12, xs: 12 }}>
                          <input
                            type='file'
                            multiple
                            accept='application/pdf'
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={e => {
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
                                  onClick={e => {
                                    e.stopPropagation()
                                    setSelectedFile(null)
                                    setError('attachment')
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
                                  Upload Files
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

export default UploadDiet
