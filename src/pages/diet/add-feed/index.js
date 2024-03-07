import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import {
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { AddButton } from 'src/components/Buttons'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'

const AddFeedType = () => {
  const fileInputRef = useRef(null)

  const [displayFile, setDisplayFile] = useState('')
  const [imgSrc, setImgSrc] = useState('')
  const schema = yup.object().shape({
    status: yup.string().required('Status is Required'),
    name: yup.string().required('Feed Name is Required'),
    description: yup.string().required('Feed description is Required'),
    feedImg: yup.string().required('Image is Required')
  })

  const defaultValues = {
    status: 'active',
    name: '',
    description: '',
    feedImg: ''
  }

  const {
    reset,
    control,
    setValue,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      reader.onload = () => {
        setImgSrc(reader?.result)
      }
      setDisplayFile(files[0]?.name)
      // setValue('feedImg', reader?.result)
      reader?.readAsDataURL(files[0])
      setValue('feedImg', files[0])
      // console.log('feedImg', files[0])
      // console.log(getValues('feedImg'))
      clearErrors('feedImg')
    }
  }
  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('feedImg', '')
    // setDisplayFile('')
  }

  const onSubmit = async params => {
    const { status, name, description, feedImg } = { ...params }

    const payload = {
      status,
      name,
      description,
      feedImg: getValues('feedImg')
    }
    console.log('submit', payload)
    // await handleSubmitData(payload)
  }
  const RenderSidebarFooter = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'end', gap: 4 }}>
        <LoadingButton
          size='large'
          type='submit'
          variant='contained'
          // loading={submitLoader}
        >
          Save
        </LoadingButton>
        <Button size='large' type='reset' color='error' variant='outlined'>
          Cancel
        </Button>
      </Box>
    )
  }
  return (
    <Card>
      <CardContent>
        <Typography sx={{ mb: 1 }} variant='h6'>
          Add New Feed
        </Typography>
        <Typography sx={{ mb: 1 }}>Add New Feed type and write some description for it</Typography>

        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          {/* {editParams?.id !== null ? ( */}
          <FormControl fullWidth sx={{ my: 2 }} error={Boolean(errors.radio)}>
            <Controller
              name='status'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <RadioGroup row {...field} aria-label='gender' name='validation-basic-radio'>
                  <FormControlLabel
                    value='active'
                    label='Active'
                    sx={errors.status ? { color: 'error.main' } : null}
                    control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                  />
                  <FormControlLabel
                    value='inactive'
                    label='Inactive'
                    sx={errors.status ? { color: 'error.main' } : null}
                    control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                  />
                </RadioGroup>
              )}
            />
            {errors.status && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-radio'>
                This field is required
              </FormHelperText>
            )}
          </FormControl>
          <FormControl sx={{ width: '50%', mb: 6 }}>
            <Controller
              name='name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Feed Name'
                  value={value}
                  onChange={onChange}
                  placeholder='Feed Name'
                  error={Boolean(errors.name)}
                  name='name'
                />
              )}
            />
            {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name?.message}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='description'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  rows={4}
                  multiline
                  label='Description'
                  value={value}
                  onChange={onChange}
                  placeholder='Description'
                  error={Boolean(errors.description)}
                  name='description'
                />
              )}
            />
            {errors.description && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.description?.message}</FormHelperText>
            )}
          </FormControl>
          <input
            type='file'
            accept='image/*'
            onChange={e => handleInputImageChange(e)}
            style={{ display: 'none' }}
            name='feedImg'
            ref={fileInputRef}
          />
          {imgSrc !== '' && (
            <Box
              sx={{
                display: 'flex'
              }}
            >
              <Box sx={{ display: 'flex' }}>
                <img
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: '0.1875rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(93, 89, 98, 0.14)'
                  }}
                  width={50}
                  height={50}
                  alt='Uploaded image'
                  src={typeof imgSrc === 'string' ? imgSrc : imgSrc}
                />

                <Typography sx={{ margin: '10px' }}>{displayFile}</Typography>
                <Box sx={{ cursor: 'pointer', margin: '10px' }}>
                  <Icon icon='material-symbols-light:close' onClick={() => removeSelectedImage()}>
                    {' '}
                  </Icon>
                </Box>
              </Box>
            </Box>
          )}

          {imgSrc === '' && (
            <Button variant='outlined' onClick={handleAddImageClick}>
              ADD IMAGE
            </Button>
          )}
          {errors.feedImg && <FormHelperText sx={{ color: 'error.main' }}>{errors.feedImg?.message}</FormHelperText>}

          <RenderSidebarFooter />
        </form>
      </CardContent>
    </Card>
  )
}

export default AddFeedType
