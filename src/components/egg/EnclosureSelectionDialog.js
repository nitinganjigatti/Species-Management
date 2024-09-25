import {
  Autocomplete,
  Avatar,
  Box,
  Card,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  debounce,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  Grid
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { AuthContext } from 'src/context/AuthContext'
import { useCallback, useContext, useState, useEffect } from 'react'
import { getSectionList, getEnclosures } from 'src/lib/api/egg/egg/createAnimal'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

const EnclosureSelectionDialog = ({ handleClose, open, getEnclosureDetails }) => {
  const authData = useContext(AuthContext)
  const sitesList = authData?.userData?.user?.zoos[0]?.sites
  const zoo_id = authData?.userData?.user?.zoos[0]?.zoo_id
  const [selected_site_id, setSelectedSiteId] = useState('')
  const [sectionList, setSectionList] = useState([])
  const [enclosure_list, setEnclosureList] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingEnclosure, setLoadingEnclosure] = useState(false)

  const defaultValues = {
    site_id: '',
    section: {
      section_id: '',
      section_name: ''
    },
    enclosure: {
      enclosure_id: '',
      site_id: '',
      site_name: '',
      user_enclosure_name: ''
    }
  }

  const schema = yup.object().shape({
    // site_id: yup.string().required('Site is required'),
    section: yup
      .object()
      .shape({
        section_id: yup.string().required('Section is required'),
        section_name: yup.string().required('Section is required')
      })
      .required('Section is required'),
    enclosure: yup
      .object()
      .shape({
        enclosure_id: yup.string().required('Enclosure is required'),
        site_id: yup.string().required('Enclosure is required'),
        site_name: yup.string().required('Enclosure is required'),
        user_enclosure_name: yup.string().required('Enclosure is required')
      })
      .required('Enclosure is required')
  })

  const searchSections = useCallback(
    debounce(async (searchText, selected_site_id) => {
      try {
        debugger
        setLoadingSections(true)
        await getSectionList({
          zoo_id: zoo_id.toString(),
          q: searchText,
          page: 1,
          offset: 30,
          selected_site_id: selected_site_id,
          filter_empty_enclosures: 1,
          ignore_sys_gen: 1
        }).then(res => {
          if (res?.sections[0]?.length > 0) {
            // console.log('first', res?.data)
            setSectionList(res?.sections[0])
          } else {
            setSectionList([])
          }
          setLoadingSections(false)
        })
      } catch (error) {
        console.error(error)
        setLoadingSections(false)
      }
    }, 500),
    []
  )

  const searchEnclosures = useCallback(
    debounce(async ({ searchText, section_id }) => {
      try {
        setLoadingEnclosure(true)
        await getEnclosures({
          section_id: section_id,
          q: searchText,
          ignore_sys_gen: 1,
          limit: 50
        }).then(res => {
          if (res?.data?.length > 0) {
            setEnclosureList(res?.data)
          } else {
            setEnclosureList([])
          }
          setLoadingEnclosure(false)
        })
      } catch (error) {
        setLoadingEnclosure(false)
        console.error(error)
      }
    }, 500),
    []
  )

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    clearErrors,
    watch,
    reset,
    resetField,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = params => {
    console.log(params)
    getEnclosureDetails(params?.enclosure)
    handleClose(true)
  }

  // useEffect(() => {
  //   searchSections('', '')
  // }, [])

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        fullWidth={true}
      >
        <DialogTitle id='alert-dialog-title'>{'Select Enclosure'}</DialogTitle>

        <DialogContent>
          <div>
            {/* onSubmit={handleSubmit(onSubmit)} */}
            <form>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth sx={{ mb: 4, mt: 4 }}>
                    <InputLabel id='site_id'>Select Site</InputLabel>
                    <Controller
                      name='site_id'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='site_id'
                          value={value}
                          label='Select Site'
                          onChange={async e => {
                            resetField('section', {
                              section_id: '',
                              section_name: ''
                            })

                            resetField('enclosure', {
                              enclosure_id: '',
                              site_id: '',
                              site_name: '',
                              user_enclosure_name: ''
                            })
                            setSelectedSiteId(e.target.value)
                            setSectionList([])
                            setEnclosureList([])
                            await searchSections('', e.target.value)

                            // console.log('site_id', e.target.value)

                            return onChange(e)
                          }}
                          labelId='site_id'
                          error={Boolean(errors?.site_id)}
                        >
                          {sitesList?.map(val => (
                            <MenuItem key={val?.site_id} value={val?.site_id}>
                              {val?.site_name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors?.site_id && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.site_id?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth sx={{ mb: 4, mt: 4 }}>
                    <Controller
                      name='section'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          loading={loadingSections}
                          name='section'
                          value={value}
                          placeholder='Section'
                          id='section'
                          options={sectionList?.length > 0 ? sectionList : []}
                          getOptionLabel={option => `${option.section_name}`}
                          isOptionEqualToValue={(option, value) => option?.section_id === value?.section_id}
                          onChange={async (e, val) => {
                            if (val === null) {
                              resetField('enclosure', {
                                enclosure_id: '',
                                site_id: '',
                                site_name: '',
                                user_enclosure_name: ''
                              })
                              setEnclosureList([])

                              return onChange({
                                section_id: '',
                                section_name: ''
                              })
                            } else {
                              // console.log(val)
                              resetField('enclosure', {
                                enclosure_id: '',
                                site_id: '',
                                site_name: '',
                                user_enclosure_name: ''
                              })
                              setEnclosureList([])

                              await searchEnclosures({ searchText: '', section_id: val?.section_id })

                              return onChange(val)
                            }
                            console.log('section_id', val?.section_id)
                          }}
                          renderInput={params => (
                            <TextField
                              onChange={e => {
                                // const site_id = getValues('site_id')
                                // console.log('-----Site Id-----', site_id)
                                // console.log('-----Selected Site Id-----', selected_site_id)
                                searchSections(e.target.value, selected_site_id)
                              }}
                              {...params}
                              label='Select Section*'
                              placeholder='Search & Select'
                              error={Boolean(errors.section)}
                            />
                          )}
                        />
                      )}
                    />
                    {errors?.section && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors?.section?.section_id?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                      name='enclosure'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          loading={loadingEnclosure}
                          name='enclosure'
                          value={value}
                          placeholder='Select Enclosure'
                          id='enclosure'
                          options={enclosure_list?.length > 0 ? enclosure_list : []}
                          getOptionLabel={option => `${option.user_enclosure_name}`}
                          isOptionEqualToValue={(option, value) => option?.enclosure_id === value?.enclosure_id}
                          onChange={(e, val) => {
                            if (val === null) {
                              return onChange({
                                enclosure_id: '',
                                site_id: '',
                                site_name: '',
                                user_enclosure_name: ''
                              })
                            } else {
                              return onChange(val)
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              onChange={async e => {
                                // const section getValue('')
                                // await searchEnclosures(e.target.value, )
                              }}
                              {...params}
                              label='Select Enclosure*'
                              placeholder='Search & Select'
                              error={Boolean(errors.enclosure)}
                            />
                          )}
                        />
                      )}
                    />
                    {errors?.enclosure && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors?.enclosure?.enclosure_id?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </form>
          </div>
        </DialogContent>
        <DialogActions>
          <Button fullWidth variant='outlined' size='large' onClick={handleClose}>
            CLOSE
          </Button>
          <Button fullWidth variant='contained' onClick={handleSubmit(onSubmit)} size='large'>
            SUBMIT
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default EnclosureSelectionDialog
