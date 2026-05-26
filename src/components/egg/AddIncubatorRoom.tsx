'use client'

import { FC, useCallback, useContext, useEffect, useState } from 'react'
import {
  Autocomplete,
  Box,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'

import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import { AddRoom, EditRoom } from 'src/lib/api/egg/room/getRoom'
import { GetNurseryList } from 'src/lib/api/egg/nursery'

interface NurseryItem {
  nursery_id: string | number
  nursery_name: string
  site_id?: string | number
}

interface AddIncubatorRoomOwnProps {
  open: boolean
  onClose: () => void
  sectionId?: string | number
  onSuccess?: () => void
  refetch?: () => void
  editParams?: any
  isPreFilled?: any
  callApi?: () => void
  callTableApi?: () => void
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

const AddIncubatorRoom: FC<AddIncubatorRoomOwnProps> = ({
  open,
  onClose,
  sectionId,
  onSuccess,
  refetch,
  editParams,
  isPreFilled,
  callApi,
  callTableApi,
  isOpen: propIsOpen,
  setIsOpen: propSetIsOpen
}) => {
  const theme = useTheme()
  const authData: any = useContext(AuthContext)
  const isOpen = propIsOpen ?? open
  const setIsOpen = propSetIsOpen ?? onClose

  const id = editParams?.room_id
  const [loader, setLoader] = useState<boolean>(false)
  const [nurseryLoader, setNurseryLoader] = useState<boolean>(false)
  const [nurseryList, setNurseryList] = useState<NurseryItem[]>([])
  const [defaultNursery, setDefaultNursery] = useState<NurseryItem | null>(null)

  const defaultValues = {
    room_name: '',
    site_id: '',
    nursery: ''
  }

  const schema = yup.object().shape({
    room_name: yup.string().trim().required('Room name is required'),
    site_id: yup.string().required('Site is required'),
    nursery: defaultNursery?.nursery_id ? yup.string().notRequired() : yup.string().required('Nursery is required')
  })

  const {
    setValue,
    reset,
    control,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const nurseryId = watch('nursery')

  const fetchNurseryList = async (q = '') => {
    try {
      setNurseryLoader(true)

      const params = {
        type: 'only_active',
        search: q,
        page: 1,
        limit: 50
      }
      const { data } = await GetNurseryList({ params: params })
      setNurseryList(data?.result || [])
    } catch (e) {
      console.error('Failed to fetch nursery list', e)
    } finally {
      setNurseryLoader(false)
    }
  }

  const searchNursery = useCallback(debounce(fetchNurseryList, 1000), [])

  const handleFormSuccess = (response: any) => {
    reset()
    setLoader(false)
    Toaster({ type: 'success', message: response.message })
    if (callApi) callApi()
    if (callTableApi) callTableApi()
    if (onSuccess) onSuccess()
    handleClose()
  }

  const onSubmit = async (values: typeof defaultValues) => {
    setLoader(true)

    const payload = {
      room_name: values.room_name,
      site_id: values.site_id,
      nursery_id: defaultNursery?.nursery_id || nurseryId
    }

    try {
      const response = editParams?.nursery_id ? await EditRoom(id, payload) : await AddRoom(payload)

      if (response.success) {
        handleFormSuccess(response)
      } else {
        setLoader(false)
        Toaster({ type: 'error', message: response.message })
      }
    } catch (error) {
      setLoader(false)
      console.error('Error while submitting form:', error)
      Toaster({ type: 'error', message: 'An error occurred while submitting' })
    }
  }

  const handleClose = () => {
    if (propSetIsOpen) {
      propSetIsOpen(false)
    } else {
      onClose()
    }
    setDefaultNursery(null)
    setValue('site_id', '')
    setValue('nursery', '')
    reset()
  }

  useEffect(() => {
    fetchNurseryList()
  }, [])

  useEffect(() => {
    if (nurseryId) {
      const selectedNursery = nurseryList.find(nursery => nursery.nursery_id === nurseryId)
      setValue('site_id', selectedNursery?.site_id || '')
      clearErrors('site_id')
    }
  }, [nurseryId, nurseryList])

  useEffect(() => {
    if (isPreFilled?.nursery_id && isPreFilled?.site_id) {
      setDefaultNursery({ nursery_id: isPreFilled?.nursery_id, nursery_name: isPreFilled?.nursery_name })
      setValue('site_id', isPreFilled?.site_id)
      setValue('nursery_id', isPreFilled?.nursery_id)
    }
    if (editParams?.nursery_id && editParams?.room_name) {
      setValue('room_name', editParams?.room_name)
      setValue('site_id', editParams?.site_id)
      setDefaultNursery({ nursery_id: editParams?.nursery_id, nursery_name: editParams?.nursery_name })
    }
  }, [isOpen])

  return (
    <>
      <Drawer
        anchor='right'
        open={isOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',
              bgcolor: theme.palette.customColors.lightBg
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-notes-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'> {editParams?.nursery_id ? 'Edit Room' : 'Add Room'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                m: 5,
                px: '16px',
                py: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                bgcolor: theme.palette.primary.contrastText,
                borderRadius: '8px',
                border: 1,
                borderColor: theme.palette.customColors.OutlineVariant
              }}
            >
              <FormControl fullWidth>
                <Controller
                  name='nursery'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      value={defaultNursery}
                      disablePortal
                      disabled={isPreFilled?.nursery_id}
                      id='nursery'
                      loading={nurseryLoader}
                      options={nurseryList?.length > 0 ? nurseryList : []}
                      getOptionLabel={option => option.nursery_name}
                      isOptionEqualToValue={(option, value) => option?.nursery_id === value?.nursery_id}
                      onChange={(e, val) => {
                        if (val === null) {
                          setDefaultNursery(null)
                          return onChange('')
                        } else {
                          setDefaultNursery(val)
                          setValue('room', '')
                          return onChange(val.nursery_id)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          onChange={e => {
                            searchNursery(e.target.value)
                          }}
                          {...params}
                          label='Select Nursery *'
                          placeholder='Search & Select'
                          error={Boolean(errors.nursery)}
                        />
                      )}
                    />
                  )}
                />
                {errors?.nursery && (
                  <FormHelperText sx={{ color: 'error.main' }}>{(errors?.nursery as any)?.message}</FormHelperText>
                )}
              </FormControl>

              {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors?.site_id)} id='site_id'>
                    Site*
                  </InputLabel>
                  <Controller
                    name='site_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='site_id'
                        value={value}
                        label='Site*'
                        onChange={onChange}
                        error={Boolean(errors?.site_id)}
                        labelId='site_id'
                        disabled
                      >
                        {authData?.userData?.user?.zoos[0].sites?.map((item: any, index: number) => {
                          return (
                            <MenuItem key={index} value={item?.site_id}>
                              {item?.site_name}
                            </MenuItem>
                          )
                        })}
                      </Select>
                    )}
                  />
                  {errors?.site_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{(errors?.site_id as any)?.message}</FormHelperText>
                  )}
                </FormControl>
              )}
              <FormControl fullWidth>
                <Controller
                  name='room_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Room Name*'
                      value={value}
                      onChange={onChange}
                      focused={value !== ''}
                      placeholder='Room Name'
                      error={Boolean(errors.room_name)}
                      name='room_name'
                      slotProps={{
                        htmlInput: { autoComplete: 'off' }
                      }}
                    />
                  )}
                />
                {errors.room_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{(errors.room_name as any)?.message}</FormHelperText>
                )}
              </FormControl>
            </Box>

            <Box
              sx={{
                height: '122px',
                width: '100%',
                maxWidth: '562px',
                position: 'fixed',
                bottom: 0,
                px: 4,
                py: '24px',
                bgcolor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
                zIndex: 123
              }}
            >
              <LoadingButton
                sx={{ height: '58px' }}
                fullWidth
                variant='contained'
                type='submit'
                size='large'
                loading={loader}
              >
                {editParams?.nursery_id ? 'Edit Room' : 'Add Room'}
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AddIncubatorRoom
