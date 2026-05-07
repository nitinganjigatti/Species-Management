import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDropzone } from 'react-dropzone'
import { LoadingButton } from '@mui/lab'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Icon from 'src/@core/components/icon'
import ImageLightbox from 'src/components/parivesh/ImageLightbox'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getBatchListSpeciesById } from 'src/lib/api/parivesh/batchListSpecies'
import { updateBatchStatus } from 'src/lib/api/parivesh/updateBatchStatus'
import { uploadAttachmentForBatch, deleteAttachmentForBatch } from 'src/lib/api/parivesh/uploadAttachmentBatch'
import { downloadCsvForBatchData } from 'src/lib/api/parivesh/downloadBatchDetails'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'

// ==================== Types ====================

interface BatchAttachment {
  id: number
  attachment: string
  attachment_name: string
}

interface BatchDetails {
  batch_id: string
  batch_code: string
  status: string
  registration_id?: string
  created_on?: string
  submitted_on?: string
  created_by_user?: { user_name?: string }
  submitted_by_user?: { user_name?: string }
  entries_data: any[]
  attachments?: BatchAttachment[]
}

interface BatchDetailContentProps {
  batchId: string
}

interface RegistrationFormData {
  registrationId: string
}

// ==================== Helpers ====================

const CustomDropdownIcon = styled(ArrowDropDownIcon)({ color: '#FFFFFF' })

const schema = yup.object().shape({
  registrationId: yup
    .string()
    .required('Registration ID is required')
    .matches(/^[a-zA-Z0-9]+(?:[-\/][a-zA-Z0-9]+)*$/, { message: 'Invalid Registration ID format.' })
})

const isImageFile = (fileName: string) => /\.(jpeg|jpg|svg|png)$/i.test(fileName)

const truncateFileName = (fileName: string, maxLength = 16): string => {
  if (fileName.length <= maxLength) return fileName
  return fileName.substr(0, maxLength - 3) + '...'
}

const getFileNameFromUrl = (url: string): string => url.substring(url.lastIndexOf('/') + 1)

const getIconByFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return '/icons/pdf_icon.svg'
    case 'xls':
    case 'xlsx':
      return '/icons/xls_icon.svg'
    case 'doc':
    case 'docx':
      return '/icons/doc_icon.svg'
    default:
      return ''
  }
}

// ==================== Component ====================

const BatchDetailContent: React.FC<BatchDetailContentProps> = ({ batchId }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedParivesh } = usePariveshContext()

  const [selectedStatus, setSelectedStatus] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [filePreviews, setFilePreviews] = useState<BatchAttachment[]>([])
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null)
  const [btnLoader, setBtnLoader] = useState(false)
  const [attachmentLoader, setAttachmentLoader] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [regId, setRegId] = useState('NA')
  const [buttonEnabled, setButtonEnabled] = useState(false)

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm<RegistrationFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange'
  })

  // ==================== Data Fetching ====================

  const { data: batchResponse, isLoading } = useQuery({
    queryKey: ['parivesh-batch-detail', batchId],
    queryFn: () => getBatchListSpeciesById(batchId),
    enabled: Boolean(batchId)
  })

  const batchDetails: BatchDetails | undefined = batchResponse?.data?.data

  useEffect(() => {
    if (batchDetails) {
      setSelectedStatus(batchDetails.status)
      setFilePreviews(batchDetails.attachments || [])
    }
  }, [batchDetails])

  useEffect(() => {
    if (batchDetails?.status === 'withdrawn' || batchDetails?.status === 'submitted') {
      setButtonEnabled(true)
    } else {
      setButtonEnabled(false)
    }
  }, [batchDetails?.status])

  const rows = useMemo(() => {
    return (batchDetails?.entries_data || []).map((el: any, i: number) => ({ ...el, uid: i + 1 }))
  }, [batchDetails])

  const total = rows.length

  // ==================== Dropdown options ====================

  const dropdownOptions = useMemo(() => {
    if (batchDetails?.status === 'yet_to_submitted' || batchDetails?.status === 'yet_to_submit') {
      return [
        { value: 'yet_to_submitted', label: t('parivesh_module.yet_to_submit') },
        { value: 'submitted', label: t('parivesh_module.submitted') }
      ]
    }
    return [
      { value: 'submitted', label: t('parivesh_module.submitted') },
      { value: 'accepted', label: t('parivesh_module.approved') },
      { value: 'withdrawn', label: t('parivesh_module.withdrawn') },
      { value: 'rejected', label: t('parivesh_module.rejected') }
    ]
  }, [batchDetails?.status, t])

  // ==================== Handlers ====================

  const handleStatusChange = (event: any) => {
    const value = event.target.value
    setSelectedStatus(value)
    if (batchDetails?.status === 'withdrawn' && value === 'submitted') {
      setButtonEnabled(false)
    } else {
      setButtonEnabled(value === 'submitted' || batchDetails?.status === 'withdrawn')
    }
  }

  const onClickStatus = (event: any) => {
    if (event.target.dataset.value === 'submitted' && batchDetails?.status === 'yet_to_submitted') {
      setIsModalOpen(true)
    } else {
      setIsModalOpen(false)
      setRegId('NA')
      reset()
    }
  }

  const updateStatus = async (payload: any) => {
    try {
      setBtnLoader(true)
      const res = await updateBatchStatus(payload)
      if (res?.success) {
        // Invalidate every list query that could now contain stale data — without this,
        // navigating back shows the old status until a hard reload.
        queryClient.invalidateQueries({ queryKey: ['parivesh-batch-detail', batchId] })
        queryClient.invalidateQueries({ queryKey: ['parivesh-reported-batches'] })
        queryClient.invalidateQueries({ queryKey: ['parivesh-submitted-batches'] })
        queryClient.invalidateQueries({ queryKey: ['parivesh-approved-batches'] })
        queryClient.invalidateQueries({ queryKey: ['parivesh-org-count'] })

        router.back()
        setIsModalOpen(false)
        reset()
        Toaster({ type: 'success', message: res?.data?.length > 0 ? res.data : res.message })
      } else {
        Toaster({ type: 'error', message: res?.message })
      }
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setBtnLoader(false)
    }
  }

  const handleSaveBatch = async (saveType: 'save' | 'saveBatch') => {
    if (saveType === 'saveBatch') {
      const ids = batchDetails?.entries_data.map((item: any) => item.id)
      let payload: any = { batch_id: batchDetails?.batch_id, status: selectedStatus }
      if (batchDetails?.status === 'withdrawn') {
        payload = { ...payload, registration_id: batchDetails?.registration_id, id: ids }
      }
      await updateStatus(payload)
    }
    if (saveType === 'save') {
      await updateStatus({ batch_id: batchDetails?.batch_id, status: selectedStatus, registration_id: regId })
    }
  }

  const onSubmit = (data: RegistrationFormData) => {
    setRegId(data.registrationId)
    setIsModalOpen(false)
  }

  const downloadCsv = async () => {
    setCsvLoading(true)
    try {
      const response = await downloadCsvForBatchData({ batch_id: batchId })
      if (response?.success && response?.data) {
        const url = response.data
        if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
          const fetchResponse = await fetch(encodeURI(url))
          const blob = await fetchResponse.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = blobUrl
          link.setAttribute('download', `batch_data_${batchId}.csv`)
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(blobUrl)
          Toaster({ type: 'success', message: response.message })
        }
      } else {
        Toaster({ type: 'error', message: t('parivesh_module.failed_to_generate_csv') })
      }
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setCsvLoading(false)
    }
  }

  // ==================== Dropzone ====================

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: async acceptedFiles => {
      if (acceptedFiles.length + (filePreviews?.length || 0) > 3) {
        Toaster({ type: 'error', message: t('parivesh_module.max_3_files') })
        return
      }
      try {
        setAttachmentLoader(true)
        let successCount = 0
        let message = ''
        for (const file of acceptedFiles) {
          const res = await uploadAttachmentForBatch({
            batch_id: batchDetails?.batch_id,
            status: batchDetails?.status,
            batch_attachment: [file]
          })
          if (res?.success && res?.data?.length > 0) {
            successCount++
            message = res.message
            setFilePreviews(res.data)
          } else {
            Toaster({ type: 'error', message: res?.message })
          }
        }
        if (successCount === acceptedFiles.length) {
          Toaster({ type: 'success', message })
        }
      } catch {
        Toaster({ type: 'error', message: t('something_went_wrong') })
      } finally {
        setAttachmentLoader(false)
      }
    }
  })

  const removeAttachment = async () => {
    if (!selectedAttachmentId) return
    try {
      const res = await deleteAttachmentForBatch(selectedAttachmentId, { batch_id: batchDetails?.batch_id })
      if (res?.success) {
        Toaster({ type: 'success', message: res.message })
        setFilePreviews(res.data)
      } else {
        Toaster({ type: 'error', message: res?.message })
      }
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setIsDeleteModalOpen(false)
      setSelectedAttachmentId(null)
    }
  }

  // ==================== Columns ====================

  const columns = [
    {
      flex: 0.2,
      width: 60,
      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.uid}</Typography>
    },
    {
      flex: 0.2,
      minWidth: 80,
      field: 'image_type',
      headerName: t('image'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <div onClick={e => e.stopPropagation()}>
          <ImageLightbox images={p.row.species_image} />
        </div>
      )
    },
    {
      flex: 0.3,
      minWidth: 140,
      field: 'common_name',
      headerName: t('parivesh_module.common_name'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title={p.row.common_name || '-'}>
          <Typography noWrap variant='body2' sx={{ fontWeight: 500 }}>
            {p.row.common_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 140,
      field: 'scientific_name',
      headerName: t('parivesh_module.scientific_name'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title={p.row.scientific_name || '-'}>
          <Typography noWrap variant='body2'>
            {p.row.scientific_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'gender_count',
      headerName: t('parivesh_module.gender_count'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2'>
          {p.row.gender
            ? `${p.row.gender.charAt(0).toUpperCase() + p.row.gender.slice(1)} : ${p.row.animal_count}`
            : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'possession_type',
      headerName: t('category'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography noWrap variant='body2'>
          {p.row.possession_type ? p.row.possession_type.charAt(0).toUpperCase() + p.row.possession_type.slice(1) : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'date',
      headerName: t('date'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2'>
          {p.row.transaction_date ? Utility.formatDisplayDate(Utility.convertUTCToLocal(p.row.transaction_date)) : '-'}
        </Typography>
      )
    }
  ]

  // ==================== Render ====================

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
        <CircularProgress />
      </Box>
    )
  }

  const isAcceptedOrRejected = batchDetails?.status === 'accepted' || batchDetails?.status === 'rejected'

  return (
    <>
      {/* ===== HEADER CARD ===== */}
      <Card>
        <Box sx={{ p: 6, pb: 0 }}>
          <Grid container sx={{ justifyContent: 'space-between' }}>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <CardHeader
                sx={{ padding: 0 }}
                avatar={<Icon style={{ cursor: 'pointer' }} onClick={() => router.back()} icon='ep:back' />}
                title={t('parivesh_module.batch_details')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 2, sm: 0 } }}>
                <Typography variant='subtitle1'>{t('status')}:</Typography>
                {!isAcceptedOrRejected ? (
                  <Select
                    displayEmpty
                    sx={{
                      minWidth: 200,
                      height: 40,
                      background: '#00AFD6',
                      color: '#FFFFFF',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#00AFD6' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00AFD6' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00AFD6' },
                      '& .MuiSelect-icon': { color: '#FFFFFF' }
                    }}
                    IconComponent={CustomDropdownIcon}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    onClick={onClickStatus}
                  >
                    {dropdownOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <Typography sx={{ color: batchDetails?.status === 'rejected' ? '#FF0000' : '#37BD69' }}>
                    {batchDetails?.status === 'accepted'
                      ? t('parivesh_module.approved')
                      : t('parivesh_module.rejected')}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ===== BATCH INFO ===== */}
        <Box
          sx={{
            background: 'rgba(195, 206, 199, 0.3)',
            borderRadius: '10px',
            mx: { xs: 2, sm: 4, md: 6 },
            my: { xs: 2, sm: 4, md: 6 },
            p: { xs: 3, sm: 4, md: 6 }
          }}
        >
          <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant='subtitle1' sx={{ color: '#44544A', mb: 2 }}>
              {t('parivesh_module.batch_id')}: <span style={{ fontWeight: 600 }}>{batchDetails?.batch_code}</span>
            </Typography>
            <Typography variant='subtitle1' sx={{ color: '#44544A' }}>
              {t('parivesh_module.organization')}:{' '}
              <span style={{ fontWeight: 600 }}>{selectedParivesh?.organization_name}</span>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <Typography variant='subtitle1' sx={{ color: '#44544A', mb: 2 }}>
              {t('parivesh_module.batch_created')}:{' '}
              <span style={{ fontWeight: 600 }}>
                {batchDetails?.created_on
                  ? `${Utility.formatDisplayDate(
                      Utility.convertUTCToLocal(batchDetails.created_on)
                    )} ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(batchDetails.created_on))}`
                  : 'NA'}
              </span>
            </Typography>
            <Typography variant='subtitle1' sx={{ color: '#44544A' }}>
              {batchDetails?.status === 'yet_to_submitted'
                ? t('parivesh_module.created_by')
                : t('parivesh_module.submitted_by')}
              :{' '}
              <span style={{ fontWeight: 600 }}>
                {batchDetails?.status === 'yet_to_submitted'
                  ? batchDetails?.created_by_user?.user_name
                  : batchDetails?.submitted_by_user?.user_name}
              </span>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle1' sx={{ color: '#44544A', mb: 2 }}>
              {t('parivesh_module.submitted_date')}:{' '}
              <span style={{ fontWeight: 600 }}>
                {batchDetails?.submitted_on
                  ? `${Utility.formatDisplayDate(
                      Utility.convertUTCToLocal(batchDetails.submitted_on)
                    )} ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(batchDetails.submitted_on))}`
                  : 'NA'}
              </span>
            </Typography>
            <Typography variant='subtitle1' sx={{ color: '#44544A' }}>
              {t('parivesh_module.registration_id')}:{' '}
              <span style={{ fontWeight: 600 }}>{batchDetails?.registration_id || regId}</span>
            </Typography>
          </Grid>
          </Grid>
        </Box>

        {/* ===== ENTRIES TABLE ===== */}
        <Box sx={{ pl: 6, pr: 6, pb: 6 }}>
          <CommonTable
            columns={columns}
            indexedRows={rows}
            total={total}
            loading={isLoading}
            paginationModel={{ page: 0, pageSize: total || 10 }}
            setPaginationModel={() => {}}
            handleSortModel={() => {}}
            searchValue=''
            getRowHeight={() => 'auto'}
            onRowClick={() => {}}
            columnVisibilityModel={{ sl_no: false }}
            externalTableStyle={{ '& .MuiDataGrid-cell': { padding: '12px 8px' } }}
          />
        </Box>
      </Card>

      {/* ===== ACTIONS CARD ===== */}
      <Card sx={{ mt: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 6 }}>
          {/* Left: Print + Attachments */}
          <Box>
            <Grid container spacing={2}>
              <Grid>
                <Button
                  size='large'
                  variant='outlined'
                  sx={{ color: '#7A8684', mr: 3 }}
                  onClick={downloadCsv}
                  disabled={csvLoading}
                >
                  {csvLoading ? (
                    <CircularProgress size={24} sx={{ color: '#7A8684', mr: 1 }} />
                  ) : (
                    <Icon icon='mdi:printer-outline' />
                  )}
                  &nbsp; {t('parivesh_module.print')}
                </Button>
              </Grid>
              <Grid>
                <Button
                  size='large'
                  variant='outlined'
                  sx={{ color: '#7A8684', mr: 3 }}
                  {...getRootProps()}
                  disabled={attachmentLoader}
                >
                  {attachmentLoader ? (
                    <CircularProgress size={20} sx={{ color: '#7A8684', mr: 1 }} />
                  ) : (
                    <Icon icon='material-symbols-light:attach-file-add' color='#7A8684' />
                  )}
                  &nbsp; {t('parivesh_module.attachment')}
                  {filePreviews?.length ? ` (${filePreviews.length})` : ''}
                  <input {...getInputProps()} />
                </Button>
              </Grid>
              {filePreviews?.map((fp, index) => (
                <Grid key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        position: 'relative',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        height: 42,
                        padding: isImageFile(fp.attachment_name) ? '8px' : '4px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {isImageFile(fp.attachment_name) ? (
                        <ImageLightbox images={fp} />
                      ) : (
                        <a
                          href={fp.attachment}
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Tooltip title={fp.attachment_name} arrow>
                            <Typography component='div' variant='body2' sx={{ m: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <img
                                  src={getIconByFileType(fp.attachment_name)}
                                  alt=''
                                  style={{ height: 20, width: 20 }}
                                />
                                <span style={{ marginLeft: '6px' }}>
                                  {truncateFileName(getFileNameFromUrl(fp.attachment_name))}
                                </span>
                              </Box>
                            </Typography>
                          </Tooltip>
                        </a>
                      )}
                      <Box
                        sx={{
                          cursor: 'pointer',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          zIndex: 10,
                          height: 16,
                          width: 16,
                          borderRadius: 0.4,
                          backgroundColor: theme.palette.customColors.secondaryBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => {
                          setSelectedAttachmentId(fp.id)
                          setIsDeleteModalOpen(true)
                        }}
                      >
                        <Icon icon='material-symbols-light:close' color='#fff' />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Right: Save buttons */}
          <Box>
            <Grid container spacing={2}>
              {batchDetails?.status === 'yet_to_submitted' && (
                <Grid>
                  <Button
                    variant='contained'
                    size='large'
                    disabled={regId === 'NA'}
                    onClick={() => handleSaveBatch('save')}
                  >
                    {t('save')}
                  </Button>
                </Grid>
              )}
              {!isAcceptedOrRejected && (batchDetails?.status === 'submitted' || batchDetails?.status === 'withdrawn') && (
                <Grid>
                  <Button
                    variant='contained'
                    size='large'
                    onClick={() => handleSaveBatch('saveBatch')}
                    // Note: `buttonEnabled` is named misleadingly — it's used as the *disabled* flag here
                    // (legacy convention preserved from pre-migration code so the surrounding handler logic still works).
                    disabled={buttonEnabled}
                  >
                    {t('parivesh_module.save_batch')}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Card>

      {/* ===== REGISTRATION ID DIALOG ===== */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>
          {t('parivesh_module.registration_id')}*
          <IconButton
            onClick={() => setIsModalOpen(false)}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ width: 350 }}>
          <Box sx={{ mt: 6 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl fullWidth>
                <Controller
                  name='registrationId'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label={t('parivesh_module.registration_id')}
                      value={value || ''}
                      onChange={onChange}
                      placeholder={t('parivesh_module.enter_registration_id') as string}
                      error={Boolean(errors.registrationId)}
                    />
                  )}
                />
                {errors.registrationId && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.registrationId.message}</FormHelperText>
                )}
              </FormControl>
            </form>
          </Box>
        </DialogContent>
        <DialogActions>
          <LoadingButton
            loading={btnLoader}
            size='large'
            sx={{ width: '100%' }}
            variant='contained'
            onClick={handleSubmit(onSubmit)}
          >
            {t('parivesh_module.add_id')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* ===== DELETE ATTACHMENT DIALOG ===== */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DialogTitle>
          <IconButton
            onClick={() => setIsDeleteModalOpen(false)}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', pt: 4 }}>
            <Box sx={{ p: 4, borderRadius: 3, backgroundColor: theme.palette.customColors.mdAntzNeutral }}>
              <Icon width='70px' height='70px' color='#ff3838' icon='mdi:delete' />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center' }}>
              {t('parivesh_module.are_you_sure_delete_attachment')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
              <Button
                variant='outlined'
                sx={{ color: 'gray', width: '45%' }}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                {t('cancel')}
              </Button>
              <LoadingButton
                loading={btnLoader}
                variant='contained'
                color='error'
                sx={{ width: '45%' }}
                onClick={removeAttachment}
              >
                {t('delete')}
              </LoadingButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent />
      </Dialog>
    </>
  )
}

export default BatchDetailContent
