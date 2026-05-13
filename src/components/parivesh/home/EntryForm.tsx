import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  Box, Breadcrumbs, Button, CardContent, Dialog, DialogContent,
  DialogTitle, Divider, FormControl, FormHelperText, Grid,
  IconButton, MenuItem, TextField, Tooltip, Typography,
  Autocomplete
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'
import { LoadingButton } from '@mui/lab'
import { useDropzone } from 'react-dropzone'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { usePariveshContext } from 'src/context/PariveshContext'
import {
  addSpeciesToOrganization,
  getListAllSpeciesSearch,
  updateSpeciesToOrganization
} from 'src/lib/api/parivesh/addSpecies'
import { deleteAttachment, getEntryListById } from 'src/lib/api/parivesh/entryList'
import Toaster from 'src/components/Toaster'
import moment from 'moment'

// Reuse existing field components
import BirthFields from 'src/views/pages/parivesh/addNewEntries/BirthFields'
import DeathFields from 'src/views/pages/parivesh/addNewEntries/DeathFields'
import AcquisitionFields from 'src/views/pages/parivesh/addNewEntries/AcquisitionFields'
import TransferFields from 'src/views/pages/parivesh/addNewEntries/TransferFields'
import EditBirthFields from 'src/views/pages/parivesh/editNewEntries/EditBirthFields'
import EditDeathFields from 'src/views/pages/parivesh/editNewEntries/EditDeathFields'
import EditTransferFields from 'src/views/pages/parivesh/editNewEntries/EditTransferFields'
import EditAcquisitionFields from 'src/views/pages/parivesh/editNewEntries/EditAcuisitionFields'

// ==================== Types ====================

interface EntryFormProps {
  entryId?: string
  isEditMode?: boolean
}

// ==================== Validation Schema ====================

const schema = yup.object().shape({
  specie: yup.object().shape({ scientific_name: yup.string().required('Species is Required') }).required('Species is Required'),
  gender: yup.string().when('possession_type', {
    is: 'death',
    then: () => yup.string().required('Gender is Required'),
    otherwise: () => yup.string().notRequired()
  }),
  transaction_date: yup.date().required('Date is Required').test('is-after-death-date', "Entry date can't be older than the death date", function (value) {
    const { death_date } = this.parent
    if (death_date) return new Date(value).getTime() >= new Date(death_date).getTime()
    return true
  }),
  possession_type: yup.string().required('Reason is Required'),
  parent_registration_id: yup.string().when('possession_type', {
    is: 'birth',
    then: () => yup.string().required('Parent ID is required'),
    otherwise: () => yup.string().notRequired()
  }),
  where_to_transfer: yup.string().when('possession_type', {
    is: 'transfer',
    then: () => yup.string().required('Organization name is required').test('not-only-spaces', 'Cannot be empty', v => v ? v.trim().length > 0 : false),
    otherwise: () => yup.string().notRequired()
  }),
  reason_for_death: yup.string().when('possession_type', {
    is: 'death',
    then: () => yup.string().required('Reason for Death is required'),
    otherwise: () => yup.string().notRequired()
  }),
  death_date: yup.date().nullable().transform((curr, orig) => orig === '' ? null : curr).when('possession_type', {
    is: 'death',
    then: () => yup.date().nullable().required('Date of Death is required'),
    otherwise: () => yup.date().nullable().notRequired()
  }),
  death_animal_id: yup.string().nullable().notRequired().matches(/^[a-zA-Z0-9]+(?:[-\/][a-zA-Z0-9]+)*$/, { message: 'Invalid Animal ID format.', excludeEmptyString: true }),
  where_to_acquisition: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () => yup.string().required('Organization name is required').test('not-only-spaces', 'Cannot be empty', v => v ? v.trim().length > 0 : false),
    otherwise: () => yup.string().notRequired()
  }),
  dgft_number: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () => yup.string().required('DGFT Number is required').test('not-only-spaces', 'Cannot be empty', v => v ? v.trim().length > 0 : false),
    otherwise: () => yup.string().notRequired()
  }),
  cites_required: yup.string().when('possession_type', {
    is: 'acquisition',
    then: () => yup.string().required('CITES value is required'),
    otherwise: () => yup.string().notRequired()
  }),
  cites_appendix: yup.string().when(['possession_type', 'cites_required'], {
    is: (pt: string, cr: string) => pt === 'acquisition' && cr === 'Yes',
    then: () => yup.string().required('Select Appendix is required'),
    otherwise: () => yup.string().notRequired()
  }),
  cites_numbers: yup.string().when(['possession_type', 'cites_required'], {
    is: (pt: string, cr: string) => pt === 'acquisition' && cr === 'Yes',
    then: () => yup.string().required('CITES Number is required'),
    otherwise: () => yup.string().notRequired()
  }),
  attachments: yup.array().when('possession_type', {
    is: 'death',
    then: () => yup.array().min(1, 'Attachment is required').of(yup.mixed().required()),
    otherwise: () => yup.array().notRequired()
  }),
  dgft_attachments: yup.array().notRequired(),
  male_count: yup.number().transform((v, o) => o === '' ? null : v).nullable().typeError('Must be a number').min(0),
  female_count: yup.number().transform((v, o) => o === '' ? null : v).nullable().typeError('Must be a number').min(0),
  other_count: yup.number().transform((v, o) => o === '' ? null : v).nullable().typeError('Must be a number').min(0),
  counts: yup.object().when('possession_type', {
    is: (v: string) => v !== 'death',
    then: s => s.test('at-least-one', 'At least one count must be provided', function () {
      const { male_count, female_count, other_count } = this.parent
      return [male_count, female_count, other_count].some(c => c > 0)
    }),
    otherwise: s => s.optional()
  })
})

const defaultValues = {
  specie: null, gender: '', animal_count: '', possession_type: '',
  transaction_date: new Date(), reason_for_death: '', death_date: '',
  where_to_transfer: '', where_to_acquisition: '', dgft_number: '',
  cites_required: '', cites_appendix: '', cites_numbers: '',
  death_animal_id: '', attachments: [], dgft_attachments: [],
  parent_registration_id: '', male_count: '', female_count: '', other_count: ''
}

// ==================== Component ====================

const EntryForm: React.FC<EntryFormProps> = ({ entryId, isEditMode = false }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const queryClient = useQueryClient()
  const auth = useAuth() as any
  const { selectedParivesh } = usePariveshContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [btnLoader, setBtnLoader] = useState(false)
  const [editParams, setEditParams] = useState<any>(null)
  const [species, setSpecies] = useState<any[]>([])
  const [reasonType, setReasonType] = useState<string | null>(null)
  const [imgSrc, setImgSrc] = useState<any[]>([])
  const [displayFile, setDisplayFile] = useState<any[]>([])
  const [dgftDisplayFile, setDgftDisplayFile] = useState<any[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<any>(null)
  const [deleteBtnLoader, setDeleteBtnLoader] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const { reset, control, setValue, watch, getValues, clearErrors, handleSubmit, trigger, formState: { errors } } = useForm({
    defaultValues,
    resolver: yupResolver(schema) as any,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const possessionType = watch('possession_type')

  useEffect(() => {
    if (possessionType === 'death' && !isEditMode) {
      setValue('animal_count' as any, undefined)
      clearErrors('animal_count' as any)
    } else if (possessionType === 'transfer' && !isEditMode) {
      setValue('gender', undefined as any)
      clearErrors('gender')
    }
  }, [possessionType])

  // Load entry data for edit mode
  useEffect(() => {
    if (!isEditMode || !entryId) return
    const fetchDataById = async () => {
      const params = { id: entryId, org_id: selectedParivesh?.id }
      const response = await getEntryListById(params)
      if (response?.success) {
        setEditParams(response.data)
        const specieObject = {
          id: response.data.tsn_id,
          common_name: response.data.common_name,
          scientific_name: response.data.scientific_name,
          tsn_relation: response.data.tsn_relation
        }
        setValue('specie', specieObject as any)
        for (const key of Object.keys(response.data)) {
          if (key === 'transaction_date') setValue(key as any, new Date(response.data[key]))
          else if (key === 'animal_count') setValue(key as any, Number(response.data[key]))
          else if (key === 'death_date' && response.data[key]) setValue(key as any, new Date(response.data[key]))
          else if (key === 'death_date') setValue(key as any, null)
          else if (!['scientific_name', 'tsn_id', 'common_name', 'tsn_relation'].includes(key)) setValue(key as any, response.data[key])
        }
        if (response.data?.attachments?.length) {
          const fetchedFiles = response.data.attachments.map((f: any) => ({ name: f.attachment_name, fileSrc: f.attachment, id: f.id, isBackendFile: true }))
          setDisplayFile(fetchedFiles)
        }
        if (response.data?.dgft_attachments?.length) {
          const fetchedDgft = response.data.dgft_attachments.map((f: any) => ({ name: f.dgft_attachment_name, fileSrc: f.dgft_attachment, id: f.id, isBackendFile: true }))
          setDgftDisplayFile(fetchedDgft)
        }
      }
    }
    fetchDataById()
  }, [entryId, isEditMode])

  const fetchSpeciesData = useCallback(async (q: string) => {
    try {
      const res = await getListAllSpeciesSearch({ params: { q } })
      setSpecies((res?.data?.result || []).map((s: any) => ({ id: s.tsn, common_name: s.common_name, scientific_name: s.scientific_name, tsn_relation: s.tsn_relation, zoo_id: s.zoo_id })))
    } catch {}
  }, [])

  useEffect(() => { fetchSpeciesData('') }, [fetchSpeciesData])

  const searchTableData = useCallback(debounce(async (q: string) => { await fetchSpeciesData(q) }, 500), [])

  const onSubmit = async (data: any) => {
    const isValid = await trigger()
    if (!isValid) return
    const selectedDate = new Date(data.transaction_date)
    const now = new Date()
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    const payload: any = {
      org_id: selectedParivesh?.id,
      tsn_id: data.specie?.id,
      tsn_relation: data.specie?.tsn_relation,
      possession_type: data.possession_type,
      transaction_date: moment.utc(selectedDate).format('YYYY-MM-DD HH:mm:ss'),
      attachment: data.attachments
    }
    if (data.possession_type === 'death') {
      payload.gender = data.gender
      payload.reason_for_death = data.reason_for_death
      payload.death_date = data.death_date ? moment.utc(data.death_date).format('YYYY-MM-DD HH:mm:ss') : null
      payload.death_animal_id = data.death_animal_id
      payload.animal_count = 1
    } else {
      if (data.male_count != null) payload.male_count = data.male_count
      if (data.female_count != null) payload.female_count = data.female_count
      if (data.other_count != null) payload.other_count = data.other_count
    }
    if (data.possession_type === 'birth') payload.parent_registration_id = data.parent_registration_id
    if (data.possession_type === 'transfer') payload.where_to_transfer = data.where_to_transfer
    if (data.possession_type === 'acquisition') {
      payload.where_to_acquisition = data.where_to_acquisition
      payload.dgft_number = data.dgft_number
      payload.dgft_attachment = data.dgft_attachments
      payload.cites_required = data.cites_required
      if (data.cites_required === 'yes') { payload.cites_appendix = data.cites_appendix; payload.cites_numbers = data.cites_numbers }
    }
    try {
      setBtnLoader(true)
      const response = isEditMode
        ? await updateSpeciesToOrganization(payload, editParams?.id)
        : await addSpeciesToOrganization(payload)
      if (response?.success) {
        // Refresh the New Entries list (and the org-count stats) so the new/updated entry
        // appears immediately when the user navigates back, without a hard reload.
        queryClient.invalidateQueries({ queryKey: ['parivesh-entries'] })
        queryClient.invalidateQueries({ queryKey: ['parivesh-org-count'] })

        reset({ ...defaultValues, transaction_date: new Date() })
        router.back()
        Toaster({ type: 'success', message: response.message })
      } else {
        Toaster({ type: 'error', message: response.message })
      }
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setBtnLoader(false)
    }
  }

  const getIconByFileType = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return { icon: imgPath?.pdf?.image_path, bgColor: imgPath?.pdf?.bg_color }
      case 'xls': case 'xlsx': return { icon: imgPath?.xls?.image_path, bgColor: imgPath?.xls?.bg_color }
      case 'doc': case 'docx': return { icon: imgPath?.document?.image_path, bgColor: imgPath?.document?.bg_color }
      default: return { icon: imgPath?.default?.image_path, bgColor: imgPath?.default?.bg_color }
    }
  }

  const truncateFilename = (filename?: string, maxLength = 16): string => {
    if (!filename || filename.length <= maxLength) return filename || ''
    return `${filename.slice(0, Math.floor(maxLength / 2))}...${filename.slice(-Math.floor(maxLength / 2))}`
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'], 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(f => Object.assign(f, { fileSrc: URL.createObjectURL(f), isBackendFile: false, uniqueId: Date.now() + Math.random() }))
      setImgSrc(prev => [...prev, ...newFiles])
      setDisplayFile(prev => [...prev, ...newFiles])
      setValue('attachments' as any, [...(getValues('attachments' as any) || []), ...newFiles])
      clearErrors('attachments' as any)
    }
  })

  const removeSelectedImage = async (index: number, fileId?: any) => {
    if (fileId) { setSelectedFileId(fileId); setIsDeleteModalOpen(true); return }
    setImgSrc(prev => prev.filter((_, i) => i !== index))
    setDisplayFile(prev => prev.filter((_, i) => i !== index))
    setValue('attachments' as any, (getValues('attachments' as any) || []).filter((_: any, i: number) => i !== index))
  }

  const confirmDeleteAction = async () => {
    try {
      setDeleteBtnLoader(true)
      const res = await deleteAttachment(selectedFileId, { apad_id: editParams?.id, attachment_for: 'animal' })
      if (res?.success) {
        const fetchedFiles = res.data?.attachments?.map((f: any) => ({ name: f.attachment_name, fileSrc: f.attachment, id: f.id, isBackendFile: true })) || []
        setDisplayFile([...fetchedFiles, ...displayFile.filter((f: any) => f.id !== selectedFileId && !f.isBackendFile)])
        Toaster({ type: 'success', message: res.message })
      } else {
        Toaster({ type: 'error', message: res.message })
      }
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setDeleteBtnLoader(false)
      setIsDeleteModalOpen(false)
      setSelectedFileId(null)
    }
  }

  const commonFieldProps = { control, errors, watch, getValues, setValue, clearErrors, isEditMode, editParams, setImgSrc, setDisplayFile, trigger }

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 4 }}>
          <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.push('/parivesh/home')}>
            {selectedParivesh?.organization_name}
          </Typography>
          <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.back()}>
            {t('parivesh_module.new_entries')}
          </Typography>
          <Typography color='text.primary'>
            {isEditMode ? t('parivesh_module.edit_entry') : t('parivesh_module.add_entry')}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ mt: 5, background: '#FFFFFF', borderRadius: '10px' }}>
          <CardContent>
            <Typography sx={{ mb: '20px' }} variant='h6'>
              {isEditMode ? t('parivesh_module.edit_entry') : t('parivesh_module.add_entry')}
            </Typography>

            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              {/* Species Search */}
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <Controller
                      name='specie'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          options={species}
                          value={value}
                          getOptionLabel={(opt: any) => opt.scientific_name || ''}
                          isOptionEqualToValue={(opt: any, val: any) => opt.id === val?.id}
                          onChange={(_, newVal) => { onChange(newVal); newVal ? trigger('specie') : clearErrors('specie') }}
                          onInputChange={(_, newInput) => searchTableData(newInput)}
                          filterOptions={(opts, params) => opts.filter((o: any) => o?.scientific_name?.toLowerCase().includes(params.inputValue.toLowerCase()) || o?.common_name?.toLowerCase().includes(params.inputValue.toLowerCase()))}
                          renderInput={params => <TextField {...params} label={t('parivesh_module.search_select_species')} error={Boolean(errors.specie)} />}
                          renderOption={(props, option: any) => {
                            const { key, ...optionProps } = props as { key?: React.Key } & React.HTMLAttributes<HTMLLIElement>

                            return (
                              <Box component='li' key={option.id ?? key} {...optionProps}>
                                {option.scientific_name}
                                <br />
                                <Typography variant='body2' color='textSecondary'>({option.common_name})</Typography>
                              </Box>
                            )
                          }}
                        />
                      )}
                    />
                    {errors.specie && <FormHelperText sx={{ color: 'error.main' }}>{(errors.specie as any)?.message}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>

              {/* Possession type fields */}
              {isEditMode ? (
                <>
                  {(possessionType === 'birth' || !possessionType) && <EditBirthFields {...commonFieldProps} reasonType={reasonType} setReasonType={setReasonType} dgftDisplayFile={dgftDisplayFile} setDgftDisplayFile={setDgftDisplayFile} />}
                  {possessionType === 'death' && <EditDeathFields {...commonFieldProps} possessionType={possessionType} />}
                  {possessionType === 'transfer' && <EditTransferFields {...commonFieldProps} reasonType={reasonType} setReasonType={setReasonType} />}
                  {possessionType === 'acquisition' && <EditAcquisitionFields {...commonFieldProps} getIconByFileType={getIconByFileType} truncateFilename={truncateFilename} reasonType={reasonType} dgftDisplayFile={dgftDisplayFile} setDgftDisplayFile={setDgftDisplayFile} setReasonType={setReasonType} />}
                </>
              ) : (
                <>
                  {(possessionType === 'birth' || !possessionType) && <BirthFields {...commonFieldProps} reasonType={reasonType} setReasonType={setReasonType} dgftDisplayFile={dgftDisplayFile} setDgftDisplayFile={setDgftDisplayFile} />}
                  {possessionType === 'death' && <DeathFields {...commonFieldProps} dgftDisplayFile={dgftDisplayFile} setDgftDisplayFile={setDgftDisplayFile} setReasonType={setReasonType} />}
                  {possessionType === 'transfer' && <TransferFields {...commonFieldProps} reasonType={reasonType} setReasonType={setReasonType} dgftDisplayFile={dgftDisplayFile} setDgftDisplayFile={setDgftDisplayFile} />}
                  {possessionType === 'acquisition' && <AcquisitionFields {...commonFieldProps} getIconByFileType={getIconByFileType} truncateFilename={truncateFilename} reasonType={reasonType} dgftDisplayFile={dgftDisplayFile} setDgftDisplayFile={setDgftDisplayFile} setReasonType={setReasonType} />}
                </>
              )}

              <Divider />

              {/* Attachments */}
              <Typography sx={{ mb: 6, mt: 6 }} variant='h6'>{t('attachments')}</Typography>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                  <Controller
                    name='attachments'
                    control={control}
                    render={() => (
                      <div {...getRootProps()} style={{ border: '1px solid #d3d3d3', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer' }}>
                        <input {...getInputProps()} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon icon='material-symbols-light:attach-file-add' fontSize='2rem' />
                          <Typography>{t('parivesh_module.add_attachments')}</Typography>
                        </Box>
                      </div>
                    )}
                  />
                  {(errors as any).attachments && <FormHelperText sx={{ color: 'error.main' }}>{(errors as any).attachments?.message}</FormHelperText>}
                </Grid>
                {displayFile.map((src: any, index: number) => {
                  const isImage = /\.(jpeg|jpg|gif|png|svg)$/i.test(src?.name)
                  return (
                    <Grid size={{ xs: 12, sm: 'auto' }} key={src.uniqueId || index}>
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', borderRadius: '8px', height: 60, bgcolor: isImage ? '#f0f0f0' : getIconByFileType(src?.name)?.bgColor }}>
                        {isImage ? (
                          <img style={{ height: 60, width: 60, borderRadius: '20%', objectFit: 'cover', padding: 8 }} alt={`file-${index}`} src={src.fileSrc} />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '4px', pr: '16px' }}>
                            <img src={getIconByFileType(src?.name)?.icon} alt='' style={{ height: 40, width: 40 }} />
                            <Tooltip title={src?.name}><Typography variant='body2' color='textSecondary'>{truncateFilename(src?.name)}</Typography></Tooltip>
                          </Box>
                        )}
                        <Box sx={{ cursor: 'pointer', position: 'absolute', top: 0, right: 0, zIndex: 10, height: 20, width: 20, borderRadius: '6px', bgcolor: theme.palette.customColors.secondaryBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => removeSelectedImage(index, src?.id)}>
                          <Icon icon='material-symbols-light:close' color='#fff' />
                        </Box>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <Button onClick={() => router.back()} size='large' color='error' variant='outlined'>{t('cancel')}</Button>
                <LoadingButton loading={btnLoader} size='large' variant='contained' type='submit'>
                  {isEditMode ? t('save') : t('parivesh_module.add_entry')}
                </LoadingButton>
              </Box>
            </form>
          </CardContent>
        </Box>
      </Box>

      {/* Delete attachment dialog */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DialogTitle>
          <IconButton onClick={() => setIsDeleteModalOpen(false)} sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}>
            <Icon icon='mdi:close' />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', pt: 4 }}>
            <Box sx={{ p: 4, borderRadius: 3, bgcolor: theme.palette.customColors.mdAntzNeutral }}>
              <Icon width='70px' height='70px' color='#ff3838' icon='mdi:delete' />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center' }}>
              {t('parivesh_module.are_you_sure_delete_attachment')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
              <Button variant='outlined' sx={{ color: 'gray', width: '45%' }} onClick={() => setIsDeleteModalOpen(false)}>{t('cancel')}</Button>
              <LoadingButton loading={deleteBtnLoader} variant='contained' color='error' sx={{ width: '45%' }} onClick={confirmDeleteAction}>{t('delete')}</LoadingButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent />
      </Dialog>
    </>
  )
}

export default EntryForm
