import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { Controller, useForm } from 'react-hook-form'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  editParams
} from '@mui/material'

import SingleDatePicker from 'src/components/SingleDatePicker'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { useDropzone } from 'react-dropzone'
import Toaster from 'src/components/Toaster'
import { LoadingButton } from '@mui/lab'
import { deleteAttachment } from 'src/lib/api/parivesh/entryList'
import { useRouter } from 'next/router'

const AcquisitionFields = ({
  control,
  errors,
  getIconByFileType,
  reasonType,
  watch,
  truncateFilename,
  dgftDisplayFile,
  setDgftDisplayFile,
  getValues,
  setValue,
  clearErrors,
  isEditMode,
  editParams
}) => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const fileInputRef = useRef(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [btnLoader, setBtnLoader] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState(null)

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })

  console.log(id, 'qwe', editParams)

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  // const { getRootProps, getInputProps } = useDropzone({
  //   multiple: true,
  //   accept: {
  //     'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  //     'application/pdf': ['.pdf'],
  //     'application/msword': ['.doc'],
  //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  //     'application/vnd.ms-excel': ['.xls'],
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  //   },
  //   onDrop: acceptedFiles => {
  //     if (acceptedFiles.length + dgftDisplayFile?.length > 2) {
  //       Toaster({ type: 'error', message: 'You can only upload up to 2 files.' })
  //       return
  //     }
  //     const filePromises = acceptedFiles.map(file => {
  //       return new Promise(resolve => {
  //         const reader = new FileReader()
  //         reader.onloadend = () => {
  //           resolve({ name: file.name, fileSrc: reader.result })
  //         }
  //         reader.readAsDataURL(file)
  //       })
  //     })

  //     Promise.all(filePromises)
  //       .then(fileDetails => {
  //         //   setImgSrc(prevSrc => [...prevSrc, ...fileDetails.map(fileDetail => fileDetail.fileSrc)])
  //         setDgftDisplayFile(prevFiles => [...prevFiles, ...fileDetails])

  //         // Update attachments in the form
  //         const currentFiles = getValues('dgft_attachments') || []
  //         setValue('dgft_attachments', [...currentFiles, ...acceptedFiles])

  //         clearErrors('dgft_attachments')
  //         setCurrentImageIndex(prevIndex => (prevIndex === 0 ? 0 : prevIndex)) // Keep current index unless it's 0
  //       })
  //       .catch(error => {
  //         console.error('Error processing files:', error)
  //       })
  //   }
  // })

  const removeSelectedImage = (index, fileId) => {
    if (fileId) {
      setIsModalOpenDelete(true)
      setSelectedFileId(fileId)
    } else {
      setDgftDisplayFile(prevFiles => prevFiles.filter((_, i) => i !== index))
      // Update the attachments in the form
      const currentFiles = getValues('dgft_attachments') || []
      const updatedFiles = currentFiles.filter((_, i) => i !== index)
      setValue('dgft_attachments', updatedFiles)

      // Adjust the current image index if necessary
      if (index === currentImageIndex && dgftDisplayFile?.length > 1) {
        setCurrentImageIndex(prev => (prev === dgftDisplayFile?.length - 1 ? prev - 1 : prev))
      } else if (index < currentImageIndex) {
        setCurrentImageIndex(prev => prev - 1)
      }
    }
  }

  const confirmDeleteAction = async () => {
    try {
      const payload = {
        apad_id: editParams?.id,
        attachment_for: 'dgft'
      }
      setBtnLoader(true)
      const response = await deleteAttachment(selectedFileId, payload)
      console.log('response123', response)
      if (response?.success) {
        setBtnLoader(false)
        setIsModalOpenDelete(false)

        // const fetchedDgftFiles = response?.data?.dgft_attachments?.map(file => ({
        //   name: file?.dgft_attachment_name,
        //   fileSrc: file?.dgft_attachment,
        //   id: file?.id,
        //   isBackendFile: true // Mark as backend file
        // }))
        // setDgftDisplayFile(fetchedDgftFiles || [])

        // Fetch the updated backend files
        const fetchedDgftFiles = response?.data?.dgft_attachments?.map(file => ({
          name: file?.dgft_attachment_name,
          fileSrc: file?.dgft_attachment,
          id: file?.id,
          isBackendFile: true // Mark as backend file
        }))

        // Retain only the files that are not deleted (including newly uploaded files)
        const updatedDisplayFiles = [
          ...fetchedDgftFiles,
          ...dgftDisplayFile.filter(file => file.id !== selectedFileId && !file.isBackendFile)
        ]

        // Update the displayFile state
        setDgftDisplayFile(updatedDisplayFiles)

        Toaster({ type: 'success', message: response?.message })
      } else {
        Toaster({ type: 'error', message: response?.message })
        setBtnLoader(false)
      }
    } catch (error) {
      setIsModalOpenDelete(false)
      setBtnLoader(false)
      console.error('Error uploading files:', error)
    }
  }

  const handleFileSelect = files => {
    const filesArray = Array.isArray(files) ? files : Array.from(files)
    console.log(filesArray, 'Files Array') // Debugging line

    if (filesArray.length + dgftDisplayFile?.length > 2) {
      Toaster({ type: 'error', message: 'You can only upload up to 2 files.' })
      return
    }

    const filePromises = filesArray.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({ name: file.name, fileSrc: reader.result })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises)
      .then(fileDetails => {
        setDgftDisplayFile(prevFiles => [...prevFiles, ...fileDetails])

        // Update attachments in the form
        const currentFiles = getValues('dgft_attachments') || []
        setValue('dgft_attachments', [...currentFiles, ...filesArray])

        clearErrors('dgft_attachments')
        setCurrentImageIndex(prevIndex => (prevIndex === 0 ? 0 : prevIndex)) // Keep current index unless it's 0
      })
      .catch(error => {
        console.error('Error processing files:', error)
      })
  }

  // Dropzone setup
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileSelect,
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  })

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <FormControl fullWidth>
            <Controller
              name='where_to_acquisition'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Which organization would you acquire?'
                  error={Boolean(errors.where_to_acquisition)}
                  //   helperText={errors.where_to_acquisition?.message}
                />
              )}
            />
            {errors.where_to_acquisition && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.where_to_acquisition?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
          <FormControl fullWidth>
            <Controller
              name='gender'
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextField select label='Gender*' value={value} onChange={onChange} error={Boolean(errors.gender)}>
                  <MenuItem value='male'>Male</MenuItem>
                  <MenuItem value='female'>Female</MenuItem>
                  <MenuItem value='other'>Other</MenuItem>
                </TextField>
              )}
            />
            {errors.gender && <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {reasonType !== 'death' && (
          <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
            <FormControl fullWidth>
              <Controller
                name='animal_count'
                control={control}
                rules={{ required: reasonType !== 'death' }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label='Total Count*'
                    value={value}
                    type='number'
                    onChange={onChange}
                    placeholder='Enter Total Count'
                    error={Boolean(errors.animal_count)}
                    name='animal_count'
                  />
                )}
              />

              {errors.animal_count && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_count?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='transaction_date'
              control={control}
              render={({ field: { value, onChange } }) => (
                <SingleDatePicker
                  fullWidth
                  date={value}
                  width={'100%'}
                  dateFormat='dd/MM/yyyy'
                  // showTimeSelect
                  // timeIntervals={15}
                  onChangeHandler={onChange}
                  maxDate={new Date()}
                  customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
                />
              )}
            />
            {errors.transaction_date && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                {errors.transaction_date?.message}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
      <>
        <Box sx={{ mb: 6 }}>
          <Divider />
        </Box>

        <Typography variant='h6' sx={{ mb: 2 }}>
          DGFT
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} sx={{ mb: 6 }}>
            <FormControl fullWidth>
              <Controller
                name='dgft_number'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='DGFT Number*'
                    error={Boolean(errors.dgft_number)}
                    // helperText={errors.dgft_number?.message}
                  />
                )}
              />
              {errors.dgft_number && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.dgft_number?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2} sx={{ mb: 6 }}>
              <Grid item xs={12} sm={4} md={3} lg={3.8}>
                <FormControl fullWidth>
                  <Controller
                    name='dgft_attachments'
                    control={control}
                    render={({ field: { onChange, value, ...rest } }) => (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          border: '1px solid #d3d3d3',
                          borderRadius: 1,
                          padding: 2,
                          cursor: 'pointer',
                          height: '56px',
                          width: { xs: '100%', sm: '170px' },
                          position: 'relative'
                        }}
                      >
                        <input
                          type='file'
                          multiple
                          accept='image/*,application/pdf,.doc,.docx,.xls,.xlsx'
                          style={{
                            opacity: 0,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            cursor: 'pointer'
                          }}
                          {...getRootProps({ className: 'dropzone' })}
                          onChange={e => {
                            const files = Array.from(e.target.files)
                            // onChange(files) // Update form state
                            handleFileSelect(files) // Call parent handler
                          }}
                          {...rest}
                        />
                        <Icon icon='material-symbols-light:attach-file-add' fontSize='34px' sx={{ flexShrink: 0 }} />
                        <Typography variant='body1' color='textPrimary'>
                          Attachments
                        </Typography>
                      </Box>
                    )}
                  />
                </FormControl>

                {/* <FormControl fullWidth>
                  <Controller
                    name='dgft_attachments'
                    control={control}
                    render={({ field }) => (
                      <Box
                        {...field}
                        onClick={handleAddImageClick}
                        {...getRootProps()}
                        ref={fileInputRef}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          border: '1px solid #d3d3d3',
                          borderRadius: 1,
                          padding: 4,
                          cursor: 'pointer',
                          height: '56px',
                          width: '100%' // Make sure it fills its grid item
                        }}
                      >
                        <input {...getInputProps()} ref={fileInputRef} />
                        
                        <Icon icon='material-symbols-light:attach-file-add' fontSize='2rem' size={3} />
                        <Typography variant='body1' color='textPrimary'>
                          Attachments
                        </Typography>
                      </Box>
                    )}
                  />
                </FormControl> */}
              </Grid>

              {/* {/ Uploaded files display /} */}
              {dgftDisplayFile?.map((src, index) => {
                const isImage = /\.(jpeg|jpg|gif|png|svg|JPG|svg)$/.test(src?.name)
                return (
                  <Grid item xs={12} sm='auto' md='auto' lg='auto' key={index}>
                    <FormControl fullWidth>
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          backgroundColor: '#f5f5f5',
                          borderRadius: '8px',
                          boxSizing: 'border-box',
                          width: { xs: '100%', sm: 'auto' },
                          height: '56px', // Fixed height for consistency
                          bgcolor: isImage ? '#f0f0f0' : getIconByFileType(src?.name)?.bgColor
                        }}
                      >
                        {isImage ? (
                          <img
                            style={{
                              height: '56px',
                              width: '56px',
                              borderRadius: '20%',
                              objectFit: 'cover',
                              padding: '8px'
                            }}
                            alt={`Uploaded image ${index + 1}`}
                            src={src?.fileSrc}
                          />
                        ) : (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              padding: '4px',
                              paddingRight: '16px'
                            }}
                          >
                            <img
                              src={getIconByFileType(src?.name)?.icon}
                              alt=''
                              style={{
                                height: '40px',
                                width: '40px'
                              }}
                            />
                            <Tooltip title={src?.name}>
                              <Typography variant='body2' color='textSecondary'>
                                {truncateFilename(src?.name)}
                              </Typography>
                            </Tooltip>
                          </Box>
                        )}
                        <Box
                          sx={{
                            cursor: 'pointer',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            zIndex: 10,
                            height: '20px',
                            width: '20px',
                            borderRadius: '6px',
                            backgroundColor: theme.palette.customColors.secondaryBg,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                          onClick={() => removeSelectedImage(index, src?.id)}
                        >
                          <Icon icon='material-symbols-light:close' color='#fff' size={16} />
                        </Box>
                      </Box>
                    </FormControl>
                  </Grid>
                )
              })}
            </Grid>
          </Grid>
        </Grid>
        <Typography variant='h6' sx={{ mb: 2 }}>
          CITES
        </Typography>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='cites_required'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label='CITES required *'
                    error={Boolean(errors.cites_required)}
                    // helperText={errors.cites_required?.message}
                  >
                    <MenuItem value='yes'>Yes</MenuItem>
                    <MenuItem value='no'>No</MenuItem>
                  </TextField>
                )}
              />
              {errors.cites_required && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.cites_required?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
        {watch('cites_required') === 'yes' && (
          <Grid container spacing={2} sx={{ mb: 6 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <Controller
                  name='cites_appendix'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label='Select Appendix'
                      error={Boolean(errors.cites_appendix)}
                      //   helperText={errors.cites_appendix?.message}
                    >
                      <MenuItem value='Appendix-1'>Appendix I</MenuItem>
                      <MenuItem value='Appendix-2'>Appendix II</MenuItem>
                      <MenuItem value='Appendix-3'>Appendix III</MenuItem>
                    </TextField>
                  )}
                />
                {errors.cites_appendix && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.cites_appendix?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <Controller
                  name='cites_numbers'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='CITES Numbers'
                      error={Boolean(errors.cites_numbers)}
                      //   helperText={errors.cites_numbers?.message}
                    />
                  )}
                />
                {errors.cites_numbers && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.cites_numbers?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        )}
      </>
      <Dialog open={isModalOpenDelete} onClose={() => setIsModalOpenDelete(false)}>
        <DialogTitle>
          <IconButton
            aria-label='close'
            onClick={() => setIsModalOpenDelete(false)}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',

              // padding: '40px',
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: theme.palette.customColors.mdAntzNeutral
              }}
            >
              <Icon width='70px' height='70px' color={'#ff3838'} icon={'mdi:delete'} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>
                Are you sure you want to delete this attachment?
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
              <Button
                disabled={btnLoader}
                onClick={() => setIsModalOpenDelete(false)}
                variant='outlined'
                sx={{
                  color: 'gray',
                  width: '45%'
                }}
              >
                Cancel
              </Button>

              <LoadingButton
                loading={btnLoader}
                size='large'
                variant='contained'
                sx={{ width: '45%' }}
                onClick={() => confirmDeleteAction()}
              >
                Delete
              </LoadingButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent />
      </Dialog>
    </>
  )
}

export default AcquisitionFields
