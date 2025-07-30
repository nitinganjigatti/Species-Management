import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Avatar,
  Checkbox,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { borderColor, Box, fontSize, Stack } from '@mui/system'
import React, { useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { speciesAttachmentUpload } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'
import imageUploader from 'public/images/gallery_add_Icon.png'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Image from 'next/image'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'

const defaultValues = {
  localIdentifierType: '',
  localIdentifier: '',
  attachment: '',
  is_primary: false
}

const schema = yup.object().shape({
  localIdentifierType: yup.string().trim().required('Loacal identifier Type is required'),
  localIdentifier: yup.string().trim().required('Loacal identifier is required'),
  attachment: yup.string().required('Attachment is required'),
  is_primary: yup.boolean()  // optional
})

const AddIdentifier = ({
  addIdentifierDrawer,
  setAddIdentifierDrawer,
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

  const [deleteDialog, setDeleteDialog] = useState(false)

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

  // useEffect(() => {
  //   if (uploadDietDrawer) {
  //     getUsers()
  //   }
  // }, [uploadDietDrawer])

  // const getUsers = async () => {
  //   try {
  //     const userDetails = await readAsync('userDetails')
  //     const zoo_id = userDetails?.user?.zoos[0].zoo_id
  //     const Users = await getUserList({ zoo_id })

  //     setPreparedByUsers(Users?.data)
  //   } catch (error) {
  //     Toaster({ type: 'error', message: String(error) || 'Failed to fetch user data.' })
  //   }
  // }

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
  const speciesData = {}
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

  const basicStyle = {
    // backgroundColor: theme.palette.primary.contrastText,
    // borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
    // width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    },
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
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img style={{ width: '32px', height: '32px' }} src={'/icons/Activity.svg'} alt='activity' />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography
              sx={{
                color: theme.palette.primary.light,
                fontSize: '24px',
                fontWeight: '500',
                lineHeight: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {animalId ? 'Edit' : 'Add'} Local Identifier
            </Typography>
          </Box>
        </Box>
      </Box>
      <IconButton
        size='small'
        sx={{ color: 'text.primary', height: '40px', width: '40px' }}
        onClick={() => {
          // setspeciesId(null)
          reset()
          setAddIdentifierDrawer(false)
        }}
      >
        <Icon icon='mdi:close' fontSize={24} />
      </IconButton>
    </Box>
  )

  return (
    <Drawer
      anchor='right'
      open={addIdentifierDrawer}
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
              <Box
                sx={{
                  mt: '16px',
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
                    name='localIdentifierType'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        name='localIdentifierType'
                        value={defaultPreparedBy}
                        disablePortal
                        loading={true}
                        id='localIdentifierType'
                        options={preparedByUsers}
                        getOptionLabel={option => option.user_name}
                        isOptionEqualToValue={(option, value) => option?.user_id === value?.user_id}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultPreparedBy(null)

                            return onChange('')
                          } else {
                            setDefaultPreparedBy(val)
                            setValue('localIdentifierType', '')

                            return onChange(val.user_id)
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Local Identifier Type *'
                            placeholder='Search & Select'
                            error={Boolean(errors.localIdentifierType)}
                            sx={{ ...basicStyle }}
                          />
                        )}
                      />
                    )}
                  />
                  {errors && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.localIdentifierType?.message}</FormHelperText>
                  )}
                </FormControl>

                <Controller
                  name='localIdentifier'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      sx={{ ...basicStyle }}
                      label='Local identifier *'
                      placeholder='Local identifier *'
                      error={Boolean(errors.localIdentifier)}
                      helperText={errors.localIdentifier?.message}
                    />
                  )}
                />
                <FormControl>
                  <Controller
                    name='is_primary'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={value}
                            onChange={e => onChange(e.target.checked)}
                            color='primary' // ✅ ensures default theme primary color
                          />
                        }
                        label={<Typography sx={{ fontWeight: 500, fontSize: 16, color: theme.palette.customColors.OnSurfaceVariant }}>
                          Make Primary
                        </Typography>}
                      />
                    )}
                  />
                </FormControl>

              </Box>

              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: 20,
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: theme.palette.customColors.OnSurfaceVariant,
                }}
              >
                Upload Image
              </Typography>

              <Box sx={{
                mt: -3,
                px: '16px',
                py: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                // border: 1,
                // borderColor: '#c3cec7'
                border: `1px solid ${theme.palette.customColors.OutlineVariant
                  }`,
                // border: `1px solid ${errors.attachment
                //   ? theme.palette.customColors.errorText
                //   : theme.palette.customColors.OutlineVariant
                //   }`,
              }}>
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
                {/* <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, }}> */}
                {selectedFile &&
                  // imgSrc?.map((img, index) => (
                  <Box
                    // key={index}
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
                  // ))
                }
                {/* </Box> */}
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

          {animalId &&
            <LoadingButton
              fullWidth
              variant='outlined'
              size='large'
              sx={{ height: '58px', width: '514px', mx: 4, color: theme.palette.customColors.Error, borderColor: theme.palette.customColors.Error }}
              onClick={() => {
                setDeleteDialog(true)
              }}
              disabled={uploadingAttachment}
              loading={uploadingAttachment}
            >
              Delete identifier
            </LoadingButton>}
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

      <DialogConfirmationDialog
        open={deleteDialog}
        message={'Are you sure you want to delete this local identifier?'}
        handleClose={() => setDeleteDialog(false)}
        action={() => setDeleteDialog(false)} />
    </Drawer>
  )
}

export default AddIdentifier



