'use client'

import { FC, useCallback, useContext, useState } from 'react'
import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  debounce,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid,
  Box
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'

import { AuthContext } from 'src/context/AuthContext'
import { getSectionList, getEnclosures } from 'src/lib/api/egg/egg/createAnimal'
import type { EnclosureSelectionDialogProps } from 'src/types/egg/components'

interface SectionData {
  section_id: string
  section_name: string
}

interface EnclosureData {
  enclosure_id: string
  site_id: string
  site_name: string
  user_enclosure_name: string
}

interface FormValues {
  site_id: string
  section: SectionData
  enclosure: EnclosureData
}

const defaultValues: FormValues = {
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
  site_id: yup.string().required('Site is required'),
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

const EnclosureSelectionDialog: FC<EnclosureSelectionDialogProps> = ({ open, handleClose, getEnclosureDetails }) => {
  const authData: any = useContext(AuthContext)
  const sitesList = authData?.userData?.user?.zoos[0]?.sites
  const zoo_id = authData?.userData?.user?.zoos[0]?.zoo_id

  const [selected_site_id, setSelectedSiteId] = useState<string>('')
  const [selected_section_id, setSelectedSectionId] = useState<string>('')
  const [sectionList, setSectionList] = useState<SectionData[]>([])
  const [enclosure_list, setEnclosureList] = useState<EnclosureData[]>([])
  const [loadingSections, setLoadingSections] = useState<boolean>(false)
  const [loadingEnclosure, setLoadingEnclosure] = useState<boolean>(false)

  const searchSections = useCallback(
    debounce(async (searchText = '', selected_site_id: string) => {
      setLoadingSections(true)
      try {
        const res = await getSectionList({
          zoo_id: zoo_id.toString(),
          q: searchText,
          page: 1,
          offset: 30,
          selected_site_id,
          filter_empty_enclosures: 1,
          ignore_sys_gen: 1
        })

        const sectionList = res?.sections?.[0] || []
        setSectionList(sectionList)
      } catch (error) {
        setSectionList([])
        console.error('Failed to fetch sections:', error)
      } finally {
        setLoadingSections(false)
      }
    }, 500),
    [zoo_id]
  )

  const searchEnclosures = useCallback(
    debounce(async ({ searchText = '', section_id }: { searchText?: string; section_id: string }) => {
      setLoadingEnclosure(true)
      try {
        const res = await getEnclosures({
          section_id: section_id,
          q: searchText,
          ignore_sys_gen: 1,
          limit: 50
        })

        const enclosures = res?.data || []
        setEnclosureList(enclosures)
      } catch (error) {
        setEnclosureList([])
        console.error('Failed to fetch enclosures:', error)
      } finally {
        setLoadingEnclosure(false)
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

  const onSubmit = (params: FormValues) => {
    getEnclosureDetails(params?.enclosure)
    handleClose(true)
  }

  const isSectionDisabled = !watch('site_id')
  const isEnclosureDisabled = !watch('section.section_id')

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => handleClose()}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        fullWidth={true}
      >
        <DialogTitle id='alert-dialog-title'>{'Select Enclosure'}</DialogTitle>

        <DialogContent>
          <div>
            <form>
              <Grid container spacing={2}>
                <Box sx={{ flexBasis: '50%', paddingRight: 1 }}>
                  <FormControl fullWidth sx={{ mb: 4, mt: 4 }} error={Boolean(errors?.site_id)}>
                    <InputLabel id='site_id'>Select Site*</InputLabel>
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
                              defaultValue: {
                                section_id: '',
                                section_name: ''
                              }
                            })

                            resetField('enclosure', {
                              defaultValue: {
                                enclosure_id: '',
                                site_id: '',
                                site_name: '',
                                user_enclosure_name: ''
                              }
                            })
                            setSelectedSiteId(e.target.value)
                            setSectionList([])
                            setEnclosureList([])
                            await searchSections('', e.target.value)
                            return onChange(e)
                          }}
                          labelId='site_id'
                          error={Boolean(errors?.site_id)}
                        >
                          {sitesList?.map((val: any) => (
                            <MenuItem key={val?.site_id} value={val?.site_id}>
                              {val?.site_name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors?.site_id && (
                      <FormHelperText sx={{ color: 'error.main' }}>{(errors?.site_id as any)?.message || ''}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                <Box sx={{ flexBasis: '50%', paddingRight: 1 }}>
                  <FormControl fullWidth sx={{ mb: 4, mt: 4 }}>
                    <Controller
                      name='section'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          loading={loadingSections}
                          value={value}
                          disabled={isSectionDisabled}
                          id='section'
                          options={sectionList?.length > 0 ? sectionList : []}
                          getOptionLabel={option => `${option.section_name}`}
                          isOptionEqualToValue={(option, value) => option?.section_id === value?.section_id}
                          onChange={async (e, val) => {
                            if (val === null) {
                              resetField('enclosure', {
                                defaultValue: {
                                  enclosure_id: '',
                                  site_id: '',
                                  site_name: '',
                                  user_enclosure_name: ''
                                }
                              })
                              setEnclosureList([])

                              return onChange({
                                section_id: '',
                                section_name: ''
                              })
                            } else {
                              resetField('enclosure', {
                                defaultValue: {
                                  enclosure_id: '',
                                  site_id: '',
                                  site_name: '',
                                  user_enclosure_name: ''
                                }
                              })
                              setEnclosureList([])
                              setSelectedSectionId(val?.section_id)
                              await searchEnclosures({ searchText: '', section_id: val?.section_id })
                              return onChange(val)
                            }
                          }}
                          onClose={() => searchSections('', selected_site_id)}
                          renderInput={params => (
                            <TextField
                              onChange={e => {
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
                        {(errors?.section as any)?.section_id?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Box>
                <Box sx={{ flexBasis: '50%', paddingRight: 1 }}>
                  <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                      name='enclosure'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          loading={loadingEnclosure}
                          disabled={isEnclosureDisabled}
                          value={value}
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
                          onClose={() => searchEnclosures({ searchText: '', section_id: selected_section_id })}
                          renderInput={params => (
                            <TextField
                              onChange={async e => {
                                searchEnclosures({ searchText: e.target.value, section_id: selected_section_id })
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
                        {(errors?.enclosure as any)?.enclosure_id?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Box>
              </Grid>
            </form>
          </div>
        </DialogContent>
        <DialogActions>
          <Button fullWidth variant='outlined' size='large' onClick={() => handleClose()}>
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
