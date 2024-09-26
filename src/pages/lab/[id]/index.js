import React, { useState, useEffect, useCallback, useContext } from 'react'

import {
  GetRequestDetails,
  GetRequestPopUp,
  transferLab,
  getNoOfLab,
  UpdateStatus,
  DeleteLAbRequestAttachment,
  GetLabListByTestId
} from 'src/lib/api/lab/getLabRequest'

import FallbackSpinner from 'src/@core/components/spinner/index'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// ** MUI Imports
import { LoadingButton } from '@mui/lab'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import {
  Button,
  Box,
  Stack,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  FormControl,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Popover
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import Utility from 'src/utility'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'
import UploadReports from 'src/components/lab/request/UploadReports'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import UserSnackbar from 'src/components/utility/snackbar'
import moment from 'moment'
import CommonMediaView from 'src/components/lab/CommonMediaView'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'

const RequestDetails = () => {
  const router = useRouter()
  const authData = useContext(AuthContext)

  // console.log('authData :>> ', authData?.userData?.settings?.DEFAULT_IMAGE_MASTER)
  const [fileViews, setFileViews] = useState(authData?.userData?.settings?.DEFAULT_IMAGE_MASTER)

  const [loader, setLoader] = useState(false)
  const [selectedLab, setSelectedLab] = useState()
  const [image, setImage] = useState()
  const [document, setDocument] = useState()
  const [testImage, setTestImage] = useState()

  const [testDoc, setTestDoc] = useState()
  const [popUpRow, setPopUpRow] = useState([])
  const [transferStatus, setTransferStatus] = useState('')

  const { id, lab_id } = Router.query

  const searchParams = useSearchParams()
  const Selectedlab_id = searchParams.get('lab_id')

  const [medicineId, setMedicineId] = useState()

  const [LabRequestId, setLabRequestId] = useState()
  const [animanlId, setAnimalId] = useState()

  const [request, setRequest] = useState([])

  const [openTransfer, setOpenTransfer] = useState(false)
  const [openUploader, setOpenUploader] = useState(false)
  const [open, setOpen] = React.useState(false)
  const [requestById, setRequestById] = useState()

  const [permissions, setPermissions] = useState(null)

  // console.log('permissions :>> ', permissions)

  const storedData = JSON.parse(localStorage.getItem('userDetails'))

  const [status, setStatus] = React.useState()

  const localLabData = storedData?.modules?.lab_data?.lab

  const PrvLabId = request[0]?.lab_id

  const [lab, setLab] = React.useState([])

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])

  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [testId, setTestId] = useState()
  const [requestId, setRequestId] = useState()
  const [labId, setLab_id] = useState('')

  const [fileId, setFileId] = useState()
  const [testName, setTestName] = useState()

  // ........... snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')
  const [statusId, setStatusId] = useState()
  const [showTestFile, setShowTestFile] = useState(false)
  const [transferTestId, setTransferTestId] = useState('')

  const setAlertDefaults = ({ message, severity, status }) => {
    setOpenSnackbar(status)
    setSnackbarMessage(message)
    setSeverity(severity)
  }

  //...........

  useEffect(() => {
    const labObject = localLabData?.find(item => item?.lab_id === lab_id)

    // console.log('localLabData :>> ', localLabData)

    if (labObject && labObject.permission) {
      setPermissions(labObject.permission)
    }
  }, [])

  const handleChangeStatus = async (event, params) => {
    setStatus(event.target.value)

    const id = params

    const payload = {
      status: event.target.value
    }

    // console.log('payload', payload)

    const response = await UpdateStatus(id, payload)
    if (response?.success) {
      Toaster({ type: 'success', message: response.message })

      fetchRequestDetails()
    } else {
      fetchRequestDetails()
      setStatus(params?.row?.status)
      Toaster({ type: 'error', message: response.message })
    }
  }

  const handleClickOpen = async item => {
    const id = item?.request_id
    setOpen(true)
    try {
      const response = await GetRequestPopUp(id).then(res => {
        setRequestById(res?.data?.request[0])
      })
      setOpen(true)
    } catch (error) {
      console.log('Error:', error)
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const fetchRequestDetails = async (sort, q) => {
    try {
      // Make your API call here
      setLoading(true)

      const params = {
        lab_id: Selectedlab_id,
        q,
        sort
      }

      const response = await GetRequestDetails(id, { params }).then(res => {
        setLab_id(res?.data.result[0]?.lab_id)
        setAnimalId(res?.data?.result[0]?.animal_id)
        setLabRequestId(res?.data?.result[0]?.request_id)
        setMedicineId(res?.data?.result[0]?.medical_record_id)
        setRequest(res?.data?.result)
        setRequestId(res?.data?.result[0]?.id)
        setRows(loadServerRows(paginationModel.page, res?.data?.result[0].test_reports))
        setTotal(parseInt(res?.data?.total_count))
        setImage(res?.data?.result[0]?.files?.images)
        setDocument(res?.data?.result[0]?.files?.files)
        setLoading(false)
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleOpenTransfer = async () => {
    if (permissions?.transfer_tests === true || permissions?.allow_full_access === true) {
      setOpenTransfer(true)

      // setSelectedLab(params.row)

      const params = {
        test_id: transferTestId,
        lab_id: labId
      }
      await GetLabListByTestId({ params: params }).then(res => {
        setLab(res?.data?.result)

        // setRows(loadServerRows(paginationModel.page, res?.data?.result))
      })
    }
    handleClosePopover()
  }

  useEffect(() => {
    fetchRequestDetails(sort, searchValue)
  }, [id, paginationModel])

  function loadServerRows(currentPage, data) {
    return data
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchRequestDetails(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const [anchorEl, setAnchorEl] = useState(null)

  const handleOpenPopOver = (event, params) => {
    setAnchorEl(event.currentTarget)
    setTestId(params?.row?.id)
    setTransferTestId(params?.row?.test_id)
    setTransferStatus(params?.row?.status)
    setTestName(params?.row?.test_name)
  }

  const handleClosePopover = () => {
    setAnchorEl(null)
  }

  const openPopover = Boolean(anchorEl)

  const handleOpenUploader = () => {
    setOpenUploader(true)
    handleClosePopover()
  }

  const handleOpenShowFile = (e, params) => {
    setShowTestFile(true)

    setTestImage(params?.row?.attachments?.images)
    setTestDoc(params?.row?.attachments?.docs)
  }

  const columns = [
    // {
    //   flex: 0.05,
    //   Width: 40,
    //   field: 'id',
    //   headerName: 'SL ',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {parseInt(params.row.sl_no)}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.8,
      minWidth: 20,
      field: 'test_name',
      headerName: 'Test Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.test_name}
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'sample_name',
      headerName: 'Sample',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params?.row.sample_name}>{params.row.sample_name}</span>
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <>
          {}
          <Box sx={{ minWidth: 120 }}>
            {permissions?.allow_full_access === true || permissions?.perform_tests === true ? (
              <FormControl fullWidth size='small' sx={{ borderColor: 'red' }}>
                <InputLabel id='demo-simple-select-label'>Status</InputLabel>
                <Select
                  size='small'
                  labelId='demo-simple-select-label'
                  id='demo-simple-select'
                  defaultValue={params.row.status === 'transferred' ? 'pending' : params.row.status}
                  value={params.row.status} // Assuming params.row.status contains the current status value
                  label='Status'
                  onChange={event => handleChangeStatus(event, params?.row?.id)}
                  sx={{
                    color:
                      params.row.status === 'pending' || params.row.status === 'transferred'
                        ? 'red'
                        : params.row.status === 'completed'
                        ? '#2a9d0d'
                        : params.row.status === 'inprogress'
                        ? '#00aea4'
                        : 'black'
                  }}
                >
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                  <MenuItem value='inprogress'>In Progress</MenuItem>
                  {/* <MenuItem value='transferred'>Pending</MenuItem> */}
                </Select>
              </FormControl>
            ) : (
              <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                <span
                  alt={params.row.status}
                  style={{
                    color:
                      params.row.status === 'pending'
                        ? 'red'
                        : params.row.status === 'completed'
                        ? 'green'
                        : params.row.status === 'in progress'
                        ? 'blue'
                        : 'black'
                  }}
                >
                  {params.row.status}
                </span>
              </Typography>
            )}
          </Box>
        </>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box>
          <IconButton size='small' onClick={e => handleOpenPopOver(e, params)}>
            <Icon icon='charm:menu-kebab' />
          </IconButton>

          <Popover
            sx={{
              '& .MuiPaper-root': {
                minWidth: 140,
                borderRadius: '5px'
              },
              '& .MuiBackdrop-root': {
                bgcolor: 'transparent'
              }
            }}
            open={openPopover}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            {(permissions?.allow_full_access === true || permissions?.transfer_tests === true) && (
              <MenuItem onClick={() => handleOpenTransfer(params)}>Transfer</MenuItem>
            )}

            {(permissions?.allow_full_access === true || permissions?.perform_tests === true) && (
              <MenuItem onClick={handleOpenUploader}>Upload</MenuItem>
            )}
          </Popover>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 10,

      // field: 'Action',
      // headerName: 'Action',

      renderCell: params => (
        <>
          {params?.row?.attachments?.images?.length > 0 || params?.row?.attachments?.docs?.length > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={e => handleOpenShowFile(e, params)}>
                <Icon icon='et:attachments' fontSize={15} />
              </IconButton>

              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                {
                  params?.row?.attachments?.images?.length > 0 && params?.row?.attachments?.docs?.length > 0
                    ? params.row.attachments.images.length + params.row.attachments.docs.length
                    : params?.row?.attachments?.images?.length > 0
                    ? params.row.attachments.images.length
                    : params?.row?.attachments?.docs
                    ? params.row.attachments.docs.length
                    : null

                  // params?.row?.attachments?.docs?.length

                  // console.log(' params.row.attachments.docs.length :>> ', params.row.attachments)
                }
              </Typography>
            </Box>
          ) : null}
        </>
      )
    }
  ]

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn })
  }

  const handleCloseTransfer = () => {
    setOpenTransfer(false)
    handleClosePopover()
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  // form

  const defaultValues = {
    lab_name: request?.lab_id,
    replaced_lab_id: '',
    transfer_reason: ''
  }

  const schema = yup.object().shape({
    lab_name: yup.string(),
    replaced_lab_id: yup.string().required('Transfer to is required'),
    transfer_reason: yup.string().required('Transfer reason is required')
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const handleSubmitData = async () => {
    try {
      const errors = await trigger()
      if (errors) {
        handleSubmit(onSubmit)
      } else {
        scrollToTop()
      }
    } catch (error) {
      console.error(error)
    }

    // handleSubmit(onSubmit)()
  }

  const onSubmit = async params => {
    // setSubmitLoader(true)
    const { lab_name, replaced_lab_id, transfer_reason } = {
      ...params
    }
    const id = testId

    const payload = {
      replaced_lab_id,
      transfer_reason
    }

    // console.log('payload', payload)

    if (transferStatus !== 'completed') {
      const response = await transferLab(id, payload)
      if (response?.success) {
        handleCloseTransfer()

        Toaster({ type: 'success', message: response.message })

        reset()

        fetchRequestDetails()
      } else {
        handleCloseTransfer()
        reset()
        Toaster({ type: 'error', message: response.message })
      }
    } else {
      handleCloseTransfer()
      reset()
      Toaster({ type: 'error', message: 'Completed test can not be transferred' })
    }

    // // setSubmitLoader(false)
  }

  const handleDeleteImg = async (e, item) => {
    // console.log('Delete id :>> ', item)
    e.preventDefault()
    e.stopPropagation()

    const testId = item?.id

    setFileId(item?.id)
    try {
      const params = { lab_test_id: id }
      const response = await DeleteLAbRequestAttachment(testId, params)
      fetchRequestDetails()
      if (response?.success) {
        Toaster({ type: 'success', message: response.message })

        // setAlertDefaults({ status: true, message: response?.message, severity: 'success' })

        fetchRequestDetails()
        setShowTestFile(false)
      } else {
        setShowTestFile(false)
        Toaster({ type: 'error', message: response.message })

        // setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
      }
    } catch (error) {}
  }

  const openFileInNewTab = imageUrl => {
    window.open(imageUrl, '_blank')
  }

  const handleCloseSnackBar = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpenSnackbar(false)
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card sx={{ p: 5 }}>
            {request?.map((item, index) => (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {' '}
                      <IconButton
                        sx={{ mr: 1 }}
                        onClick={() =>
                          router.push({
                            pathname: '/lab/request'
                          })
                        }
                      >
                        <Icon icon='ep:back' fontSize={25} />
                      </IconButton>
                      <Typography variant='h6'>
                        Request -{' '}
                        <span
                          onClick={() => handleClickOpen(item)}
                          style={{ fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          {item?.request_id}
                        </span>
                      </Typography>
                    </Box>

                    <Typography> {moment(item?.created_at).format('DD MMM YYYY')}</Typography>
                  </Box>
                  <Box gap={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        bgcolor: '#EDEDFF',
                        display: 'flex',
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '10px'
                      }}
                    >
                      <Icon icon='ion:location-outline' fontSize={25} color={'#37BD69'} />
                    </Box>
                    <Typography variant='h6'>
                      Site -{' '}
                      <span style={{ color: '#37BD69', fontSize: '20px', fontWeight: 'bold' }}>{item?.site_name}</span>
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, flexWrap: 'wrap' }}>
                  <Stack direction='row' gap={3}>
                    <Typography>
                      No. of Tests : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item?.total_no_test}</span>
                    </Typography>
                    {/* <Typography>
                      No. of Samples :{' '}
                      <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item?.total_no_sample}</span>
                    </Typography> */}
                  </Stack>

                  <Typography>
                    Requested By- <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item?.user_first_name}</span>
                  </Typography>
                </Box>
              </>
            ))}
          </Card>
          <UserSnackbar
            status={openSnackbar}
            message={snackbarMessage}
            severity={severity}
            handleClose={handleCloseSnackBar}
            indexedRows
          />

          <Card sx={{ mt: 5 }}>
            <CardHeader title='Test Reports' />

            <DataGrid
              autoHeight
              hideFooterPagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              // getRowId={row => row?.test_id}
              onSortModelChange={handleSortModel}
              // slots={{ toolbar: ServerSideToolbar }}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                }

                // toolbar: {
                //   value: searchValue,
                //   clearSearch: () => handleSearch(''),
                //   onChange: event => {
                //     setSearchValue(event.target.value)

                //     return handleSearch(event.target.value)
                //   }
                // }
              }}
            />
            {/* image or Doc View */}
            {image || document ? (
              <Box sx={{ px: 5, mb: 6 }}>
                <Typography sx={{ fontSize: '20px', fontWeight: 'bold', mb: 3 }}>Reports</Typography>

                {/* <CommonMediaView /> */}
                {image ? (
                  <Box>
                    <Typography sx={{ fontSize: '18px', mb: 2 }}>Images</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <CommonMediaView image={image} handleDeleteImg={handleDeleteImg} fileViews={fileViews} />
                    </Box>
                  </Box>
                ) : null}

                {document ? (
                  <Box>
                    <Typography sx={{ fontSize: '18px', mb: 3, mt: 3 }}>Document</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <CommonMediaView document={document} handleDeleteImg={handleDeleteImg} fileViews={fileViews} />
                    </Box>
                  </Box>
                ) : null}
              </Box>
            ) : null}

            {/* allow user Only if user hand upload permissions */}

            {permissions?.perform_tests === true && permissions?.allow_full_access === true ? (
              <UploadReports
                animalID={animanlId}
                labTestId={LabRequestId}
                medicalRecordId={medicineId}
                type='lab_test_request'
                id={requestId === null ? '0' : requestId}
                handleCloseUploader={setOpenUploader}
                setAlertDefaults={setAlertDefaults}
                handleClosePopover={handleClosePopover}
                fetchRequestDetails={fetchRequestDetails}
              />
            ) : null}
          </Card>
        </>
      )}

      <>
        {/* Open PopUp On Clicking Request Id */}
        <Dialog open={open} onClose={handleClose}>
          {requestById?.map((item, index) => (
            <Card key={index} sx={{ p: 2, minWidth: 600 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={handleClose}>
                  <Icon icon='ep:close-bold' fontSize={15} color={'red'} />
                </IconButton>
              </Box>
              <Box ml={3}>
                <Typography variant='h6'>
                  Request - <span style={{ color: '#37BD69', fontWeight: 'bold' }}>{item.request_id}</span>
                </Typography>
                <Typography>{Utility.formatDate(item.created_at)}</Typography>
                <Typography>
                  Site - <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item.site_name}</span>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, ml: 3, mr: 3 }}>
                <Box gap={4} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>
                    No. of Tests : <span style={{ fontWeight: 'bold' }}>{item?.test_count}</span>
                  </Typography>
                  {/* <Typography>
                    No. of Samples : <span style={{ fontWeight: 'bold' }}>{item?.sample_count}</span>
                  </Typography> */}
                </Box>
                <Typography>
                  Request By - <span style={{ fontWeight: 'bold' }}>{item?.user_first_name}</span>
                </Typography>
              </Box>

              <Box mt={2}>
                <TableContainer component={Paper} style={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#e8f4f2' }}>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Lab Name</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item?.test_reports?.map((data, dataID) => (
                        <TableRow key={dataID}>
                          <TableCell>{data?.test_name}</TableCell>
                          <TableCell>{data?.lab_name}</TableCell>
                          <TableCell>
                            {' '}
                            <span
                              style={{
                                color:
                                  data?.status === 'transferred' || data?.status === 'pending'
                                    ? 'red'
                                    : data?.status === 'completed'
                                    ? '#2a9d0d'
                                    : '#00aea4',
                                textTransform: 'capitalize',
                                fontSize: '15px'
                              }}
                            >
                              {data?.status === 'transferred' ? 'pending' : data?.status}
                            </span>{' '}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Card>
          ))}
        </Dialog>
      </>

      <>
        <Dialog open={openTransfer} onClose={handleCloseTransfer}>
          <Card sx={{ p: 5, minWidth: 500 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={handleCloseTransfer}>
                <Icon icon='ic:baseline-close' fontSize={25} color={'red'} />
              </IconButton>
            </Box>
            <Box>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Transfer test to another lab
              </Typography>

              <Box>
                <Typography>
                  Test name - <span style={{ color: '#37BD69', fontWeight: 'bold' }}>{testName}</span>
                </Typography>
                <Typography>
                  Request - <span style={{ fontSize: 15, fontWeight: 'bold' }}>{request[0]?.request_id}</span>
                </Typography>
                <Typography>
                  Site- <span style={{ fontSize: 15, fontWeight: 'bold' }}>{request[0]?.site_name}</span>
                </Typography>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid item xs={12} md={6} sm={6} sx={{ mt: 2, mb: 2 }}>
                  <FormControl fullWidth>
                    <Controller
                      name='lab_name'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={request[0]?.lab_name}
                          disabled
                          label='Transfer From*'
                          name='lab_name'
                          error={Boolean(errors.lab_name)}
                          onChange={onChange}
                          InputProps={{ readOnly: true }}
                          placeholder=''
                        />
                      )}
                    />
                    {errors.lab_name && (
                      <FormHelperText

                      //  sx={{ color: 'error.main' }}
                      >
                        {errors?.lab_name?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} sm={6} sx={{ mt: 2, mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel error={Boolean(errors?.lab_type)} id='lab_type'>
                      Transfer To
                    </InputLabel>
                    <Controller
                      name='replaced_lab_id'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='replaced_lab_id'
                          value={value}
                          label='Transfer To*'
                          onChange={e => {
                            onChange(e.target.value)

                            // setLabType(e.target.value)
                          }}
                          error={Boolean(errors?.replaced_lab_id)}
                          labelId='replaced_lab_id'
                        >
                          {lab?.map(item => (
                            <MenuItem key={item?.lab_id} value={item?.lab_id}>
                              {item?.lab_name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors?.replaced_lab_id && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.replaced_lab_id?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} sm={6} sx={{ mt: 2, mb: 2 }}>
                  <FormControl fullWidth mt={2}>
                    <Controller
                      name='transfer_reason'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          label='Transfer Reason'
                          name='transfer_reason'
                          error={Boolean(errors.lab_name)}
                          onChange={onChange}
                          placeholder='Add transfer reason'
                        />
                      )}
                    />
                    {errors.transfer_reason && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.transfer_reason?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Box>
                  <LoadingButton
                    onClick={handleSubmitData}
                    type='submit'
                    variant='contained'
                    sx={{ bgcolor: '#1F515B' }}
                    disabled={permissions?.allow_full_access !== true || permissions?.transfer_tests !== true}
                  >
                    CONFIRM
                  </LoadingButton>
                </Box>
              </form>
            </Box>
          </Card>
        </Dialog>
      </>
      <>
        <Dialog open={openUploader} onClose={() => setOpenUploader(false)}>
          <Card sx={{ width: 600, height: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setOpenUploader(false)}>
                <Icon icon='ic:baseline-close' fontSize={25} color={'red'} />
              </IconButton>
            </Box>
            <UploadReports
              animalID={animanlId}
              labTestId={LabRequestId}
              medicalRecordId={medicineId}
              type='lab_test'
              id={testId}
              handleCloseUploader={setOpenUploader}
              setAlertDefaults={setAlertDefaults}
              handleClosePopover={handleClosePopover}
              fetchRequestDetails={fetchRequestDetails}
            />
          </Card>
        </Dialog>
      </>
      <>
        <Dialog open={showTestFile} onClose={() => setShowTestFile(false)}>
          <Box sx={{ py: 2, minWidth: 200 }}>
            {testImage || testDoc ? (
              <>
                <Box sx={{ display: 'flex', px: 5, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '20px', fontWeight: 'bold', mb: 3 }}>Reports</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={() => setShowTestFile(false)}>
                      <Icon icon='ic:baseline-close' fontSize={25} color={'red'} />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ px: 5 }}>
                  {/* <CommonMediaView /> */}
                  {testImage ? (
                    <Box>
                      <Typography sx={{ fontSize: '18px', mb: 2 }}>Images</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        <CommonMediaView image={testImage} handleDeleteImg={handleDeleteImg} fileViews={fileViews} />
                      </Box>
                    </Box>
                  ) : null}

                  {testDoc ? (
                    <Box>
                      <Typography sx={{ fontSize: '18px', mb: 3, mt: 3 }}>Document</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        <CommonMediaView document={testDoc} handleDeleteImg={handleDeleteImg} fileViews={fileViews} />
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              </>
            ) : null}
          </Box>
        </Dialog>
      </>
    </>
  )
}

export default RequestDetails
