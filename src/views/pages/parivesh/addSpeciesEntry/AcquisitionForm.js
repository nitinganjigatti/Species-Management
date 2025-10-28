import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { Controller, useForm } from 'react-hook-form'
import {
  Box,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import SingleDatePicker from 'src/components/SingleDatePicker'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { useDropzone } from 'react-dropzone'
import Toaster from 'src/components/Toaster'

const AcquisitionForm = ({
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
  clearErrors
}) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }
  const possessionType = watch('possession_type')
  const male_count = watch('male_count') || 0
  const female_count = watch('female_count') || 0
  const other_count = watch('other_count') || 0

  // Calculate total count
  const totalCount = Number(male_count) + Number(female_count) + Number(other_count)

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
  //     if (acceptedFiles.length + dgftDisplayFile.length > 2) {
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

  const handleFileSelect = files => {
    const filesArray = Array.isArray(files) ? files : Array.from(files)
    console.log(filesArray, 'Files Array') // Debugging line

    if (filesArray.length + dgftDisplayFile.length > 2) {
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
        //   setImgSrc(prevSrc => [...prevSrc, ...fileDetails.map(fileDetail => fileDetail.fileSrc)])
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

  const removeSelectedImage = index => {
    // setImgSrc(prevSrc => prevSrc.filter((_, i) => i !== index))
    setDgftDisplayFile(prevFiles => prevFiles.filter((_, i) => i !== index))

    // Update the attachments in the form
    const currentFiles = getValues('dgft_attachments') || []
    const updatedFiles = currentFiles.filter((_, i) => i !== index)
    setValue('dgft_attachments', updatedFiles)

    // Adjust the current image index if necessary
    if (index === currentImageIndex && dgftDisplayFile.length > 1) {
      setCurrentImageIndex(prev => (prev === dgftDisplayFile.length - 1 ? prev - 1 : prev))
    } else if (index < currentImageIndex) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  return (
    <>
      <FormControl fullWidth sx={{ mb: 6 }}>
        <Controller
          name='organization_acquire'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label='Which organization would you acquire?'
              error={Boolean(errors.organization_acquire)}

              //   helperText={errors.organization_acquire?.message}
            />
          )}
        />
        {errors.organization_acquire && (
          <FormHelperText sx={{ color: 'error.main' }}>{errors.organization_acquire?.message}</FormHelperText>
        )}
      </FormControl>
      {/* <FormControl fullWidth sx={{ mb: 6 }}>
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

      <FormControl fullWidth sx={{ mb: 6 }}>
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
      </FormControl> */}
      <FormControl fullWidth sx={{ mb: 6 }}>
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
      <Divider />
      <Grid item size={{ xs: 12 }} sx={{ mb: 6, mt: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='h6' gutterBottom>
            Gender *
          </Typography>
          <Typography variant='subtitle1' gutterBottom>
            Total Count: {totalCount}
          </Typography>
        </Box>
      </Grid>
      <Grid item size={{ xs: 12, sm: 4 }} sx={{ mb: 6 }}>
        <FormControl fullWidth>
          <Controller
            name='male_count'
            control={control}
            rules={{ min: 0, pattern: /^\d*$/ }}
            render={({ field: { value, onChange } }) => (
              <TextField
                label='Male Count'
                value={value}
                variant='outlined'

                // onChange={onChange}
                onChange={e => {
                  onChange(e) // Update the value in the form
                  clearErrors('counts') // Clear the counts error on change
                }}
                placeholder='Enter the Male Count'
                error={Boolean(errors.male_count)}
                name='male_count'
              />
            )}
          />

          {errors.male_count && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.male_count?.message}</FormHelperText>
          )}
          {errors.counts && (
            <Grid item size={{ xs: 12 }} sx={{ mb: 6 }}>
              <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
            </Grid>
          )}
        </FormControl>
      </Grid>
      <Grid item size={{ xs: 12, sm: 4 }} sx={{ mb: 6 }}>
        <FormControl fullWidth>
          <Controller
            name='female_count'
            control={control}
            rules={{ min: 0, pattern: /^\d*$/ }}
            render={({ field: { value, onChange } }) => (
              <TextField
                label='Female Count'
                placeholder='Enter the Female Count'
                value={value}
                variant='outlined'

                // onChange={onChange}
                onChange={e => {
                  onChange(e) // Update the value in the form
                  clearErrors('counts') // Clear the counts error on change
                }}
                error={Boolean(errors.female_count)}
                name='female_count'
              />
            )}
          />

          {errors.female_count && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.female_count?.message}</FormHelperText>
          )}
          {errors.counts && (
            <Grid item size={{ xs: 12 }} sx={{ mb: 6 }}>
              <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
            </Grid>
          )}
        </FormControl>
      </Grid>
      <Grid item size={{ xs: 12, sm: 4 }}>
        <FormControl fullWidth>
          <Controller
            name='other_count'
            control={control}
            rules={{ min: 0, pattern: /^\d*$/ }}
            render={({ field: { value, onChange } }) => (
              <TextField
                label='Others Count'
                placeholder='Enter the Others Count'
                value={value}
                variant='outlined'

                // onChange={onChange}
                onChange={e => {
                  onChange(e) // Update the value in the form
                  clearErrors('counts') // Clear the counts error on change
                }}
                error={Boolean(errors.other_count)}
                name='other_count'
              />
            )}
          />

          {errors.other_count && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.other_count?.message}</FormHelperText>
          )}
          {errors.counts && (
            <Grid item size={{ xs: 12 }} sx={{ mb: 6 }}>
              <FormHelperText sx={{ color: 'error.main' }}>{errors.counts.message}</FormHelperText>
            </Grid>
          )}
        </FormControl>
      </Grid>
      <>
        <Typography variant='h6' sx={{ mb: 2, mt: 6 }}>
          DGFT
        </Typography>

        <FormControl fullWidth sx={{ mb: 6 }}>
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

        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item size={{ xs: 12, sm: 4, md: 3, lg: 6 }}>
            <FormControl fullWidth>
              <Controller
                name='dgft_attachments'
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div
                    {...getRootProps({ className: 'dropzone' })}
                    style={{
                      border: '1px solid #d3d3d3',
                      width: 'auto',
                      padding: '0.8rem',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <input {...getInputProps()} onChange={onChange} />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: ['column', 'column', 'row'],
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                        <Icon icon='material-symbols-light:attach-file-add' fontSize='2rem' />
                        <Typography sx={{ display: 'flex', alignItems: 'center' }}>Attachments</Typography>
                      </Box>
                    </Box>
                  </div>
                )}
              />
              {/* <Controller
                name='dgft_attachments'
                control={control}
                render={({ field: { onChange, value, ...rest } }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
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
              /> */}
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
          {dgftDisplayFile.map((src, index) => {
            const isImage = /\.(jpeg|jpg|gif|png|svg|JPG|svg)$/.test(src?.name)

            return (
              <Grid item size={{ xs: 12, sm: 'auto', md: 'auto', lg: 'auto' }} key={index}>
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
                      onClick={() => removeSelectedImage(index)}
                    >
                      <Icon icon='material-symbols-light:close' color='#fff' size={16} />
                    </Box>
                  </Box>
                </FormControl>
              </Grid>
            )
          })}
        </Grid>

        <Typography variant='h6' sx={{ mb: 2 }}>
          CITES
        </Typography>

        <FormControl fullWidth sx={{ mb: 6 }}>
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
                <MenuItem value='Yes'>Yes</MenuItem>
                <MenuItem value='No'>No</MenuItem>
              </TextField>
            )}
          />
          {errors.cites_required && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors.cites_required?.message}</FormHelperText>
          )}
        </FormControl>
        {watch('cites_required') === 'Yes' && (
          <>
            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='select_appendix'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label='Select Appendix'
                    error={Boolean(errors.select_appendix)}

                    //   helperText={errors.select_appendix?.message}
                  >
                    <MenuItem value='Appendix-1'>Appendix I</MenuItem>
                    <MenuItem value='Appendix-2'>Appendix II</MenuItem>
                    <MenuItem value='Appendix-3'>Appendix III</MenuItem>
                  </TextField>
                )}
              />
              {errors.select_appendix && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.select_appendix?.message}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 6 }}>
              <Controller
                name='cites_number'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='CITES Numbers'
                    error={Boolean(errors.cites_number)}

                    //   helperText={errors.cites_number?.message}
                  />
                )}
              />
              {errors.cites_number && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.cites_number?.message}</FormHelperText>
              )}
            </FormControl>
          </>
        )}
      </>
    </>
  );
}

export default AcquisitionForm
