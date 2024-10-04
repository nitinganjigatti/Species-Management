import {
  Avatar,
  Button,
  Card,
  CardHeader,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  TextField,
  CircularProgress
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { styled } from '@mui/system'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import IconButton from '@mui/material/IconButton'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import Icon from 'src/@core/components/icon'
import Router, { useRouter } from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { Controller, useForm } from 'react-hook-form'
import { getBatchListSpeciesById } from 'src/lib/api/parivesh/batchListSpecies'
import { usePariveshContext } from 'src/context/PariveshContext'
import { updateBatchStatus } from 'src/lib/api/parivesh/updateBatchStatus'
import Toaster from 'src/components/Toaster'
import { LoadingButton } from '@mui/lab'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { deleteAttachmentForBatch, uploadAttachmentForBatch } from 'src/lib/api/parivesh/uploadAttachmentBatch'
import pdfIcon from 'public/icons/pdf_icon.svg'
import xlsIcon from 'public/icons/xls_icon.svg'
import docIcon from 'public/icons/doc_icon.svg'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import ImageLightbox from 'src/components/parivesh/ImageLightbox'
import Utility from 'src/utility'
import { downloadCsvForBatchData } from 'src/lib/api/parivesh/downloadBatchDetails'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'

const CustomDropdownIcon = styled(ArrowDropDownIcon)({
  color: '#FFFFFF' // Change this to your desired color
})
// /^[a-zA-Z0-9]+(?:-[/][a-zA-Z0-9]+)?$/
const schema = yup.object().shape({
  registrationId: yup
    .string()
    .required('Registration ID is required')
    .matches(/^[a-zA-Z0-9]+(?:[-\/][a-zA-Z0-9]+)*$/, {
      message: 'Invalid Registration ID format.'
    })
})

const BatchDetails = ({ params, searchParams }) => {
  const router = useRouter()
  const { id, type } = router.query
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange'
  })

  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [loader, setLoader] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [batchDetails, setBatchDetails] = useState()
  const [dropdownOptions, setDropdownOptions] = useState([])
  const [btnLoader, setBtnLoader] = useState(false)
  const [attachmentLoader, setAttachmentLoader] = useState(false)
  const [regId, setRegId] = useState('NA')
  const { selectedParivesh } = usePariveshContext()
  const [filePreviews, setFilePreviews] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [buttonEnabled, setButtonEnabled] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const authData = useContext(AuthContext)
  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  const onClose = () => {
    setDialog(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const getBatchListById = useCallback(
    async id => {
      try {
        const response = await getBatchListSpeciesById(id)
        // debugger
        if (response?.success) {
          setBatchDetails(response?.data?.data)
          setSelectedStatus(response?.data?.data?.status)
          setFilePreviews(response?.data?.data?.attachments)

          // console.log(response.data.data.entries_data, 'response')

          let listWithId = response.data.data.entries_data.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
          setTotal(parseInt(response?.data?.total_count))

          setPaginationModel(prev => ({
            ...prev,
            pageSize: response?.data?.total_count
          }))
          console.log(response?.data, 'response?.data?.data')
          setRows(loadServerRows(paginationModel.page, listWithId))
        } else {
        }
      } catch (e) {
        console.log(e)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    if (id) {
      getBatchListById(id)
    }
  }, [id])

  const updateStatus = async payload => {
    try {
      setBtnLoader(true)
      const res = await updateBatchStatus(payload)
      if (res?.success) {
        router.back()
        setIsModalOpen(false)
        reset()
        setBtnLoader(false)

        const msg = res?.data.length > 0 ? res?.data : res?.message
        Toaster({ type: 'success', message: msg })
      } else {
        setBtnLoader(false)
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.log('error', error)
      setBtnLoader(false)
    }
  }

  const handleStatusChange = async event => {
    const value = event.target.value
    setSelectedStatus(value)
    if (batchDetails?.status === 'withdrawn' && value === 'submitted') {
      setButtonEnabled(false) // Disable if status is 'withdrawn' and dropdown is 'submitted'
    } else {
      setButtonEnabled(value === 'submitted' || batchDetails?.status === 'withdrawn')
    }
  }

  useEffect(() => {
    // Enable button if status is 'withdrawn' or 'submitted'
    if (batchDetails?.status === 'withdrawn') {
      setButtonEnabled(true) // Default to false, will change based on dropdown value
    } else if (batchDetails?.status === 'submitted') {
      setButtonEnabled(true) // Button enabled if status is 'submitted'
    } else {
      setButtonEnabled(false)
    }
  }, [batchDetails?.status])

  const onClickStatus = async event => {
    if (event.target.dataset.value === 'submitted' && type === 'toBeSubmittedBatch') {
      setIsModalOpen(prevState => !prevState)
    } else {
      setIsModalOpen(false) // Close modal for other selections
      setRegId('NA')
      reset()
    }
  }

  const handleSaveBatch = async type => {
    if (type === 'saveBatch') {
      const ids = batchDetails?.entries_data.map(item => item.id)
      let payload = {
        batch_id: batchDetails?.batch_id,
        status: selectedStatus
      }
      if (batchDetails?.status === 'withdrawn') {
        payload = {
          ...payload,
          registration_id: batchDetails?.registration_id,
          id: ids
        }
      }

      await updateStatus(payload)
    }
    if (type === 'save') {
      const payload = {
        batch_id: batchDetails?.batch_id,
        status: selectedStatus,
        registration_id: regId
      }
      await updateStatus(payload)
    }
  }

  const onSubmit = async data => {
    setRegId(data.registrationId)
    setIsModalOpen(false)
    // const payload = {
    //   batch_id: batchDetails?.batch_id,
    //   status: selectedStatus,
    //   registration_id: data.registrationId
    // }
    // await updateStatus(payload)
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  useEffect(() => {
    if (type === 'toBeSubmittedBatch') {
      setDropdownOptions([
        { value: 'yet_to_submitted', label: 'Yet to Submit' },
        { value: 'submitted', label: 'Submitted' }
      ])
    } else {
      setDropdownOptions([
        { value: 'submitted', label: 'Submitted' },
        { value: 'accepted', label: 'Approved' },
        { value: 'withdrawn', label: 'Withdrawn' },
        { value: 'rejected', label: 'Rejected' }
      ])
    }
  }, [type])

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 30,
      field: 'image_type',
      headerName: 'IMAGE',
      sortable: false,
      renderCell: params => (
        <>
          <ImageLightbox images={params.row.species_image} />
          {/* <Avatar variant='square' src={params.row.species_image} alt={''} sx={{ height: 'auto' }} /> */}
          {/* <Tooltip title={params.row.image_type} placement='right'> */}
          {/* <Typography
              variant='body2'
              sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {' '}
              {params.row.image_type}
            </Typography>
          </Tooltip> */}
        </>
      )
    },
    {
      flex: 0.3,
      minWidth: 30,
      field: 'common_name',
      headerName: 'COMMON NAME',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.common_name || '-'}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
            {params.row.common_name ? params.row.common_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'scientific_name',
      headerName: 'SCIENTIFIC NAME',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.scientific_name || '-'}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.scientific_name ? params.row.scientific_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    // {
    //   flex: 0.4,
    //   minWidth: 10,
    //   field: 'gender_count',
    //   headerName: 'GENDER / COUNT',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.gender ? params.row.gender + ' : ' + params.row.animal_count : '-'}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'gender_count',
      headerName: 'Gender / Count',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.gender
            ? params.row.gender.charAt(0).toUpperCase() + params.row.gender.slice(1) + ' : ' + params.row.animal_count
            : '-'}
        </Typography>
      )
    },
    // {
    //   flex: 0.3,
    //   minWidth: 30,
    //   field: 'age',
    //   headerName: 'Age',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
    //           {params.row.age ? params.row.age : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 30,
      field: 'possession_type',
      headerName: 'Category',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
              {params.row.possession_type
                ? params.row.possession_type.charAt(0).toUpperCase() + params.row.possession_type.slice(1)
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'date',
      headerName: 'DATE',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.transaction_date
            ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.transaction_date))
            : '-'}
        </Typography>
      )
    }
  ]

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <ConfirmationDialog
              image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
              iconColor={'#ff3838'}
              title={'Are you sure you want to delete this ingredient?'}
              formComponent={
                <ConfirmationCheckBox
                  title={'This ingredient is part of 15 recipes and 10 diets.'}
                  label={'Deactivate this ingredient in all records'}
                  description={
                    'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
                  }
                  color={theme.palette.formContent?.tertiary}
                  value={check}
                  setValue={setCheck}
                />
              }
              dialogBoxStatus={dialog}
              onClose={onClose}
              ConfirmationText={'Delete'}
              confirmAction={onClose}
            />
            <DataGrid
              disableColumnMenu
              disableColumnFilter
              // disableColumnSorting
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              columnVisibilityModel={{
                sl_no: false
              }}
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[total]}
              paginationModel={paginationModel}
              // slots={{ toolbar: ServerSideToolbarWithFilter }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => handleSearch(event.target.value)
                }
              }}
              onCellClick={onCellClick}
            />
          </Card>
        )}
      </>
    )
  }
  const onCellClick = params => {
    // Handle cell click logic here
  }

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true, // Allow multiple files
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: async acceptedFiles => {
      const filePreviewsLength = filePreviews ? filePreviews.length : 0
      const totalFiles = acceptedFiles?.length + filePreviewsLength

      if (totalFiles > 3) {
        Toaster({ type: 'error', message: 'You can only upload up to 3 files.' })
        return
      }

      try {
        setAttachmentLoader(true) // Show loader
        let successCount = 0 // Track successful uploads count
        let message = ''

        for (const file of acceptedFiles) {
          const payload = {
            batch_id: batchDetails?.batch_id,
            status: batchDetails?.status,
            batch_attachment: [file]
          }

          // Call your upload API function with formData
          const res = await uploadAttachmentForBatch(payload)
          console.log(res, 'uploadFile')

          // Handle API response
          if (res?.success && res?.data?.length > 0) {
            successCount++ // Increment successful uploads count
            message = res?.message

            setFilePreviews(res?.data)

            // await getBatchListById(batchDetails?.batch_id)
          } else {
            Toaster({ type: 'error', message: res?.message })
          }
        }

        if (successCount === acceptedFiles.length) {
          Toaster({ type: 'success', message: message })
        }

        setAttachmentLoader(false) // Hide loader after processing files
      } catch (error) {
        console.error('Error uploading files:', error)
        setAttachmentLoader(false) // Hide loader on error
      }
    }
  })

  const removeFilePreview = async id => {
    setIsModalOpenDelete(true)
    setSelectedId(id)
  }
  const confirmDeleteAction = async () => {
    try {
      const payload = {
        batch_id: batchDetails?.batch_id
      }
      setIsModalOpenDelete(false)
      const res = await deleteAttachmentForBatch(selectedId, payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message })
        setFilePreviews(res?.data)
        // await getBatchListById(batchDetails?.batch_id)
      } else {
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }

  console.log(filePreviews, 'filePreviews')

  const isImage = fileName => fileName.match(/\.(jpeg|jpg|svg|png)$/i)

  const getFileNameFromUrl = url => {
    return url.substring(url.lastIndexOf('/') + 1)
  }

  // Function to truncate the file name
  const truncateFileName = (fileName, maxLength = 16) => {
    if (fileName.length <= maxLength) {
      return fileName
    }
    return fileName.substr(0, maxLength - 3) + '...'
  }
  const getIconByFileType = fileName => {
    const extension = fileName.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return pdfIcon
      case 'xls':
      case 'xlsx':
        return xlsIcon
      case 'doc':
      case 'docx':
        return docIcon
      default:
        return '' // default icon if the file type is unknown
    }
  }

  const downloadCsvForBatchDetails = async batchId => {
    const payload = { batch_id: batchId }
    setCsvLoading(true) // Start loading

    try {
      const response = await downloadCsvForBatchData(payload)
      console.log('API Response:', response)

      if (response.success && response.data) {
        // Fetch the file content
        const urlParts = response.data.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const fetchResponse = await fetch(response.data)
        const blob = await fetchResponse.blob()

        // Create a Blob URL
        const blobUrl = window.URL.createObjectURL(blob)

        // Create a temporary anchor element
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', `batch_data_${batchId}.csv`) // Set the file name
        link.style.display = 'none'
        document.body.appendChild(link)

        // Trigger download
        if (typeof link.click === 'function') {
          link.click()
        } else {
          // For browsers that don't support link.click()
          link.dispatchEvent(
            new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            })
          )
        }

        // Clean up
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)

        // Show success toaster
        Toaster({ type: 'success', message: response.message })
      } else {
        Toaster({ type: 'error', message: 'Failed to generate CSV' })
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error downloading CSV:', error)
      Toaster({ type: 'error', message: 'Error downloading CSV' })
    } finally {
      setCsvLoading(false) // Stop loading
    }
  }

  return (
    <>
      {pariveshAccess ? (
        <>
          <Card>
            <Box sx={{ p: 6, pb: 0 }}>
              <Grid container justifyContent='space-between'>
                <Grid item xs={12} sm='auto'>
                  <CardHeader
                    sx={{ padding: 0 }}
                    avatar={
                      <Icon
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          router.back()
                        }}
                        icon='ep:back'
                      />
                    }
                    title='Batch Details'
                  />
                </Grid>
                <Grid item xs={12} sm='auto'>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: { sm: 'space-between' },
                      alignItems: 'center',
                      gap: 2,
                      mt: { xs: 2, sm: 0 }
                    }}
                  >
                    <Typography variant='subtitle1'>Status:</Typography>
                    <Typography variant='subtitle1'>
                      {batchDetails?.status !== 'accepted' && batchDetails?.status !== 'rejected' ? (
                        <Select
                          displayEmpty
                          sx={{
                            minWidth: 200,
                            height: 40,
                            background: '#00AFD6',
                            color: '#FFFFFF',
                            borderColor: '#00AFD6',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#00AFD6'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#00AFD6'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#00AFD6'
                            },
                            '& .MuiSelect-icon': {
                              color: '#FFFFFF'
                            }
                          }}
                          IconComponent={CustomDropdownIcon}
                          value={selectedStatus}
                          onChange={handleStatusChange}
                          onClick={onClickStatus}
                        >
                          {dropdownOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Typography
                          sx={{
                            color: batchDetails.status === 'rejected' ? '#FF0000' : '#37BD69'
                          }}
                        >
                          {batchDetails.status === 'accepted'
                            ? 'Approved'
                            : batchDetails.status === 'rejected'
                            ? 'Rejected'
                            : NA}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* <Box
          sx={{
            background: 'rgba(195, 206, 199, 0.3)',
            borderRadius: '10px',
            m: 6, // Adjust margin for smaller screens
            p: 6, // Adjust padding for smaller screens
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Stack columns on mobile, row on larger screens
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              marginBottom: { xs: 3, sm: 0 }
            }}
          >
            <Typography variant='subtitle1' sx={{ color: '#44544A', marginBottom: 4 }}>
              Batch ID: <span style={{ fontWeight: '600' }}>{batchDetails?.batch_code}</span>
            </Typography>
            <Typography variant='subtitle1' sx={{ color: '#44544A', marginBottom: 1 }}>
              Organization: <span style={{ fontWeight: '600' }}>{selectedParivesh?.organization_name}</span>
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              marginBottom: { xs: 3, sm: 0 }
            }}
          >
            <Typography variant='subtitle1' sx={{ color: '#44544A', marginBottom: 4 }}>
              Batch Created:{' '}
              <span style={{ fontWeight: '600' }}>
                {Utility.formatDisplayDate(Utility.convertUTCToLocal(batchDetails?.created_on)) +
                  ' ' +
                  Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(batchDetails?.created_on))}
              </span>
            </Typography>

            <Typography variant='subtitle1' style={{ color: '#44544A' }}>
              {type === 'toBeSubmittedBatch' ? 'Created By' : 'Submitted By'}:{' '}
              <span style={{ color: '#44544A', fontWeight: '600' }}>
                {type === 'toBeSubmittedBatch'
                  ? batchDetails?.created_by_user?.user_name
                  : batchDetails?.submitted_by_user?.user_name}
              </span>
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              marginBottom: { xs: 3, sm: 0 },
              marginRight: 20
            }}
          >
            <Typography variant='subtitle1' sx={{ color: '#44544A', marginBottom: 4 }}>
              Submitted Date:{' '}
              <span style={{ color: '#44544A', fontWeight: '600' }}>
                {batchDetails?.submitted_on !== null
                  ? Utility.formatDisplayDate(Utility.convertUTCToLocal(batchDetails?.submitted_on)) +
                    ' ' +
                    Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(batchDetails?.submitted_on))
                  : 'NA'}
              </span>
            </Typography>

            <Typography variant='subtitle1' sx={{ color: '#44544A' }}>
              Registration ID:{' '}
              <span style={{ fontWeight: '600' }}>
                {batchDetails?.registration_id !== '' ? batchDetails?.registration_id : regId}
              </span>
            </Typography>
          </Box>
        </Box> */}

            <Grid
              container
              spacing={3}
              sx={{
                background: 'rgba(195, 206, 199, 0.3)',
                borderRadius: '10px',
                m: { xs: 2, sm: 4, md: 6 },
                p: { xs: 3, sm: 4, md: 6 },
                width: 'auto'
              }}
            >
              {/* First Column */}
              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start'
                  }}
                >
                  <Typography variant='subtitle1' sx={{ color: '#44544A', mb: 2 }}>
                    Batch ID: <span style={{ fontWeight: '600' }}>{batchDetails?.batch_code}</span>
                  </Typography>
                  <Typography variant='subtitle1' sx={{ color: '#44544A', mb: 2 }}>
                    Organization: <span style={{ fontWeight: '600' }}>{selectedParivesh?.organization_name}</span>
                  </Typography>
                </Box>
              </Grid>

              {/* Second Column */}
              <Grid item xs={12} sm={6} md={5}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start'
                  }}
                >
                  <Typography variant='subtitle1' sx={{ color: '#44544A', mb: 2 }}>
                    Batch Created:{' '}
                    <span style={{ fontWeight: '600' }}>
                      {Utility.formatDisplayDate(Utility.convertUTCToLocal(batchDetails?.created_on)) +
                        ' ' +
                        Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(batchDetails?.created_on))}
                    </span>
                  </Typography>
                  <Typography variant='subtitle1' sx={{ color: '#44544A' }}>
                    {type === 'toBeSubmittedBatch' ? 'Created By' : 'Submitted By'}:{' '}
                    <span style={{ fontWeight: '600' }}>
                      {type === 'toBeSubmittedBatch'
                        ? batchDetails?.created_by_user?.user_name
                        : batchDetails?.submitted_by_user?.user_name}
                    </span>
                  </Typography>
                </Box>
              </Grid>

              {/* Third Column */}
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start' // Align items to the start (left)
                  }}
                >
                  <Typography variant='subtitle1' sx={{ color: '#44544A', mb: 2 }}>
                    Submitted Date:{' '}
                    <span style={{ fontWeight: '600' }}>
                      {batchDetails?.submitted_on
                        ? Utility.formatDisplayDate(Utility.convertUTCToLocal(batchDetails?.submitted_on)) +
                          ' ' +
                          Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(batchDetails?.submitted_on))
                        : 'NA'}
                    </span>
                  </Typography>
                  <Typography variant='subtitle1' sx={{ color: '#44544A' }}>
                    Registration ID:{' '}
                    <span style={{ fontWeight: '600' }}>
                      {batchDetails?.registration_id !== '' ? batchDetails?.registration_id : regId}
                    </span>
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ pl: 6, pr: 6, pb: 6 }}>
              <Grid>{tableData()}</Grid>
            </Box>
          </Card>

          <Card sx={{ mt: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 6 }}>
              <Box>
                <Grid container spacing={2}>
                  <Grid item>
                    {/* <Button
                  size='large'
                  variant='outlined'
                  sx={{ color: '#7A8684', mr: 3 }}
                  onClick={() => downloadCsvForBatchDetails(id)}
                >
                  <Icon icon='mdi:printer-outline' size={1} />
                  &nbsp; Print
                </Button> */}
                    <Button
                      size='large'
                      variant='outlined'
                      sx={{ color: '#7A8684', mr: 3 }}
                      onClick={() => downloadCsvForBatchDetails(id)}
                      disabled={csvLoading} // Disable the button while loading
                    >
                      {csvLoading ? (
                        <CircularProgress size={24} sx={{ color: '#7A8684', mr: 1 }} /> // Loader icon
                      ) : (
                        <Icon icon='mdi:printer-outline' size={1} />
                      )}
                      &nbsp; Print
                    </Button>
                  </Grid>
                  <Grid item>
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
                        <Icon icon='mdi:attachment-plus' size={1} />
                      )}
                      &nbsp; {`Attachment${filePreviews?.length ? ` (${filePreviews?.length})` : ''}`}
                      <input {...getInputProps()} />
                    </Button>
                  </Grid>

                  {filePreviews?.map((filePreview, index) => (
                    <Grid item key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            position: 'relative',
                            backgroundColor: '#f0f0f0', // Adjust background color as needed
                            borderRadius: '8px',
                            height: 42,
                            width: 'auto',
                            padding: isImage(filePreview.attachment) ? '8px' : '4px',
                            boxSizing: 'border-box'
                          }}
                        >
                          {isImage(filePreview.attachment) ? (
                            // <img
                            //   style={{
                            //     height: '100%',
                            //     borderRadius: '5%',
                            //     objectFit: 'cover',
                            //     width: '100%'
                            //   }}
                            //   alt='Attachment'
                            //   src={filePreview.attachment}
                            // />
                            <ImageLightbox images={filePreview} />
                          ) : (
                            <a
                              href={filePreview.attachment}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Tooltip title={filePreview.attachment_name} arrow>
                                <Typography variant='body2' sx={{ m: 2 }}>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {/* <Image src={pdfIcon} alt='' width={50} height={50} /> */}
                                    <Image
                                      src={getIconByFileType(filePreview.attachment_name)}
                                      alt=''
                                      width={20}
                                      height={20}
                                    />
                                    <span style={{ marginLeft: '6px' }}>
                                      {truncateFileName(getFileNameFromUrl(filePreview.attachment_name))}
                                    </span>
                                  </div>
                                </Typography>
                              </Tooltip>
                            </a>
                          )}

                          {/* Button to remove selected file */}
                          <Box
                            sx={{
                              cursor: 'pointer',
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              zIndex: 10,
                              height: '16px',
                              width: '16px',
                              borderRadius: 0.4,
                              backgroundColor: theme.palette.customColors.secondaryBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onClick={() => removeFilePreview(filePreview.id)}
                          >
                            <Icon icon='material-symbols-light:close' color='#fff' />
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <Box>
                <Grid container spacing={2}>
                  <Grid item>
                    {batchDetails?.status !== 'accepted' && type !== 'submittedBatch' && (
                      <Button
                        disabled={regId !== 'NA' ? false : true}
                        variant='contained'
                        color='primary'
                        onClick={() => handleSaveBatch('save')}
                        size='large'
                      >
                        Save
                      </Button>
                    )}
                  </Grid>
                  <Grid item>
                    {batchDetails?.status !== 'accepted' &&
                      batchDetails?.status !== 'rejected' &&
                      type === 'submittedBatch' && (
                        <Button
                          variant='contained'
                          color='primary'
                          onClick={() => handleSaveBatch('saveBatch')}
                          disabled={buttonEnabled}
                          size='large'
                        >
                          Save Batch
                        </Button>
                      )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Card>

          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <DialogTitle>
              Registration ID*
              <IconButton
                aria-label='close'
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
                      rules={{ required: 'Registration ID is required' }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Registration ID'
                          value={value}
                          onChange={onChange}
                          placeholder='Enter Registration ID'
                          error={Boolean(errors.registrationId)}
                          name='registrationId'
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
                Add ID
              </LoadingButton>
            </DialogActions>
          </Dialog>
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
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default BatchDetails
