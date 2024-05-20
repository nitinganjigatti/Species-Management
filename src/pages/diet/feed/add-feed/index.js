import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useRef, useState, useContext } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { AddButton } from 'src/components/Buttons'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { addFeedType, getFeedById, updateFeedType } from 'src/lib/api/diet/feedType'
import Router, { useRouter } from 'next/router'
import UserSnackbar from 'src/components/utility/snackbar'
import toast from 'react-hot-toast'

import Error404 from 'src/pages/404'

import { AuthContext } from 'src/context/AuthContext'

const AddFeedType = () => {
  const fileInputRef = useRef(null)
  const authData = useContext(AuthContext)

  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const router = useRouter()
  const { id } = router.query

  const [displayFile, setDisplayFile] = useState('')
  const [imgSrc, setImgSrc] = useState('')

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const schema = yup.object().shape({
    status: yup.string().required('Status is Required'),
    name: yup.string().required('Feed Name is Required')
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
    watch,
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
      reader?.readAsDataURL(files[0])
      setValue('feedImg', files[0])
      clearErrors('feedImg')
    }
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('feedImg', '')
  }

  useEffect(() => {
    if (id && dietModule) {
      getFeedById(id).then(res => {
        setImgSrc(res?.data?.image)
        setValue('name', res?.data?.feed_type_name)
        setValue('status', parseFloat(res?.data?.active) === 0 ? 'inactive' : 'active')
        setValue('description', res?.data?.desc)
        setValue('feedImg', res?.data?.feed_type_image)
        setDisplayFile(res?.data?.feed_type_image)
      })
    }
  }, [])

  const onSubmit = async params => {
    const { status, name, description, feedImg } = { ...params }

    const payload = {
      active: status == 'inactive' ? 0 : 1,
      feed_type_name: name,
      desc: description,
      feed_type_key: name,
      feed_type_image: getValues('feedImg')
    }

    if (id) {
      try {
        await updateFeedType({ ...payload }, id).then(res => {
          Router.push('/diet/feed')
          if (res?.success) {
            return toast(
              t => (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: '#37BD69' }} />
                    <div>
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        Success!
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        {res?.data}
                      </Typography>
                    </div>
                  </Box>
                  <IconButton
                    onClick={() => toast.dismiss(t.id)}
                    style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
                  >
                    <Icon icon='mdi:close' fontSize={24} />
                  </IconButton>
                </Box>
              ),
              {
                style: {
                  minWidth: '450px',
                  minHeight: '130px'
                }
              }
            )
          } else {
            return toast(
              t => (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: 'red' }} />
                    <div>
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        Error!
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        {res?.data}
                      </Typography>
                    </div>
                  </Box>
                  <IconButton
                    onClick={() => toast.dismiss(t.id)}
                    style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
                  >
                    <Icon icon='mdi:close' fontSize={24} />
                  </IconButton>
                </Box>
              ),
              {
                style: {
                  minWidth: '450px',
                  minHeight: '130px'
                }
              }
            )
          }
        })
      } catch (error) {
        console.log('error', error)
      }
    } else {
      try {
        await addFeedType(payload).then(res => {
          if (res?.success) {
            Router.push('/diet/feed')

            return toast(
              t => (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: '#37BD69' }} />
                    <div>
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        Success!
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        {res?.data}
                      </Typography>
                    </div>
                  </Box>
                  <IconButton
                    onClick={() => toast.dismiss(t.id)}
                    style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
                  >
                    <Icon icon='mdi:close' fontSize={24} />
                  </IconButton>
                </Box>
              ),
              {
                style: {
                  minWidth: '450px',
                  minHeight: '130px'
                }
              }
            )
          } else {
            // setOpenSnackbar({ ...openSnackbar, open: true, message: res?.message, severity: 'warning' })
            return toast(
              t => (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: 'red' }} />
                    <div>
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        Error!
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography sx={{ fontWeight: 500 }} variant='h5'>
                        {res?.data}
                      </Typography>
                    </div>
                  </Box>
                  <IconButton
                    onClick={() => toast.dismiss(t.id)}
                    style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
                  >
                    <Icon icon='mdi:close' fontSize={24} />
                  </IconButton>
                </Box>
              ),
              {
                style: {
                  minWidth: '450px',
                  minHeight: '130px'
                }
              }
            )
          }
        })
      } catch (error) {
        console.log('error', error)
      }
    }
  }

  const RenderSidebarFooter = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'end', gap: 4 }}>
        <LoadingButton size='large' type='submit' variant='contained' disabled={watch('name') === ''}>
          {id ? 'Update' : 'Save'}
        </LoadingButton>
        <Button onClick={() => Router.push('/diet/feed')} size='large' type='reset' color='error' variant='outlined'>
          Cancel
        </Button>
      </Box>
    )
  }

  return (
    <>
      {dietModule && (dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') ? (
        <Box>
          <Box sx={{ py: 2 }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/diet/feed')}>
                Feed Type
              </Typography>
              <Typography color='text.primary'>{id ? 'Update' : 'Add'} new Feed Type</Typography>
            </Breadcrumbs>
          </Box>
          <Card>
            <CardContent>
              <Typography sx={{ mb: '20px' }} variant='h6'>
                {id ? 'Update Feed Type' : 'New Feed Type'}
              </Typography>
              {/* <Typography sx={{ mb: 1 }}>
          {id ? 'Update Feed type' : 'Add New Feed type'} and write some description for it
        </Typography> */}

              <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
                {/* {editParams?.id !== null ? ( */}
                {/* <FormControl fullWidth sx={{ my: 2 }} error={Boolean(errors.radio)}>
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
          </FormControl> */}
                <FormControl sx={{ width: '50%', mb: 6 }}>
                  <Controller
                    name='name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        label='Feed Type*'
                        value={value}
                        onChange={onChange}
                        placeholder='Enter Feed Type'
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
                          border: '1px solid rgba(93, 89, 98, 0.14)',
                          objectFit: 'cover',
                          objectPosition: 'center'
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
                {errors.feedImg && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.feedImg?.message}</FormHelperText>
                )}

                <RenderSidebarFooter />
                {openSnackbar.open ? (
                  <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
                ) : null}
              </form>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddFeedType
