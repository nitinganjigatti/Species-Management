import React, { useState, useEffect, useCallback, useContext } from 'react'
import Router from 'next/router'
import { useRouter, useSearchParams } from 'next/navigation'

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
  Breadcrumbs,
  Divider,
  Tooltip,
  DialogContent,
  IconButton,
  Typography,
  Card,
  CardHeader,
  Chip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import { DataGrid } from '@mui/x-data-grid'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

import moment from 'moment'
import { debounce } from 'lodash'

import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import FallbackSpinner from 'src/@core/components/spinner/index'
import ScrollToTop from 'src/@core/components/scroll-to-top'

import Toaster from 'src/components/Toaster'
import CommonMediaView from 'src/components/lab/CommonMediaView'
import MedicalRecordNotes from 'src/components/lab/request/MedicalRecordNotes'
import UploadReports from 'src/components/lab/request/UploadReports'

import AnimalParentCard from 'src/views/utility/animalParentCard'
import AnimalSideSheet from 'src/views/pages/lab/AnimalSideSheet'
import CommentSideSheet from 'src/views/pages/lab/CommentSideSheet'
import AttachmentSheet from 'src/views/pages/lab/AttachmentSheet'

import {
  GetRequestDetails,
  GetRequestPopUp,
  DeleteLAbRequestAttachment,
  // GetLabListByTestId,
  postBulkStatus,
  postBulkTransfer,
  getLabListByMultipleIds
} from 'src/lib/api/lab/getLabRequest'

const RequestDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)
  const localLabData = authData?.userData?.modules?.lab_data?.lab

  const { id, lab_id, page, q, pageSize } = Router.query
  const searchParams = useSearchParams()
  const Selectedlab_id = searchParams.get('lab_id')

  const [fileViews, setFileViews] = useState(authData?.userData?.settings?.DEFAULT_IMAGE_MASTER)

  const [loader, setLoader] = useState(false)
  const [deleteAttachmentLoader, setDeleteAttachmentLoader] = useState(false)

  const [medicalImage, setMedicalImage] = useState([])
  const [medicalDocument, setMedicalDocument] = useState([])

  const [image, setImage] = useState([])
  const [document, setDocument] = useState([])

  const [testImage, setTestImage] = useState([])
  const [testDoc, setTestDoc] = useState([])

  const [medicineId, setMedicineId] = useState()
  const [LabRequestId, setLabRequestId] = useState()
  const [animanlId, setAnimalId] = useState()

  const [request, setRequest] = useState([])

  const [openTransfer, setOpenTransfer] = useState(false)
  const [openUploader, setOpenUploader] = useState(false)
  const [open, setOpen] = React.useState(false)
  const [requestById, setRequestById] = useState()

  const [permissions, setPermissions] = useState(null)

  const [status, setStatus] = React.useState('awaiting_sample')

  const [lab, setLab] = React.useState([])

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [rowId, setRowId] = useState(null)

  const [searchValue, setSearchValue] = useState('')
  // const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [testId, setTestId] = useState([])
  const [requestId, setRequestId] = useState()
  // const [labId, setLab_id] = useState('')

  const [testName, setTestName] = useState()
  const [testSampleName, setTestSampleName] = useState('')

  const [showTestFile, setShowTestFile] = useState(false)

  const [headerStatus, setHeaderStatus] = useState('awaiting_sample')

  const [selectedRow, setSelectedRow] = useState([])
  const [fromParam, setFromParam] = useState(false)

  const [selectedRowData, setSelectedRowData] = useState([])
  const [hasCompletedStatus, setHasCompletedStatus] = useState(true)
  const [allCompleted, setAllCompleted] = useState(false)
  const [openAnimalSheet, setOpenAnimalSheet] = useState(false)
  const [openCommentSheet, setOpenCommentSheet] = useState(false)
  const [openAttachmentSheet, setOpenAttachmentSheet] = useState(false)
  const [CommentData, setCommentData] = useState({})

  const [medicalRecordNotes, setMedicalRecordNotes] = useState([])

  const [statusList, setStatusList] = useState([])
  const [filteredStatusData, setFilteredStatusData] = useState([])
  const [shouldShowBulkStatus, setShouldShowBulkStatus] = useState(false)
  const [selectedSample, setSelectedSample] = useState(false)

  useEffect(() => {
    const labObject = localLabData?.find(item => item?.lab_id === lab_id)
    if (labObject && labObject.permission) {
      setPermissions(labObject.permission)
    }
  }, [])

  const handleChangeStatus = async (event, params) => {
    const value = event.target.value

    if (
      (value === 'completed_positive' ||
        value === 'completed_negative' ||
        value === 'completed_detected' ||
        value === 'completed_not_detected' ||
        // value === 'completed_insufficient_samples'||
        value === 'completed_inconclusive' ||
        value === 'completed') &&
      !(image || document) // Ensuring at least one attachment is present
    ) {
      Toaster({ type: 'error', message: 'Attach the report before completing the test' })
      fetchRequestDetails()

      return
    }
    setStatus(value)

    let testIds = [params?.id] // Single ID ko array me store karna

    postMultipleStatus(testIds, value)
  }

  const getAllRequestDetails = useCallback(async id => {
    try {
      const response = await GetRequestPopUp(id)
      if (response.success) {
        return response?.data?.request[0]
      } else {
        return null
      }
    } catch (error) {
      console.log('Error:', error)
    }
  }, [])

  const handleClickOpen = async item => {
    const id = item?.request_id
    setSelectedSample([])
    setRequestById(null)
    setOpen(true)
    try {
      let data = await getAllRequestDetails(id)
      debugger
      data[0]['total_no_test'] = data[0]?.test_count
      data[0]['created_by'] = data[0]?.user_first_name

      setRequestById(data)
      setOpen(true)
    } catch (error) {
      console.log('Error:', error)
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    // const filteredStatusBlockData =
    //   permissions?.allow_full_access || (permissions?.allow_upload_reports && permissions?.perform_tests)
    //     ? statusList
    //     : permissions?.perform_tests
    //     ? statusList?.filter(item => ['pending', 'inprogress'].includes(item.status))
    //     : permissions?.transfer_tests && permissions?.perform_tests
    //     ? [
    //         ...statusList?.filter(item => ['pending', 'inprogress'].includes(item.status)),
    //         ...statusList?.filter(item =>
    //           ['sample_clotted', 'sample_haemolysed', 'completed_insufficient_samples'].includes(item.key)
    //         )
    //       ]
    //     : null
    const filteredStatusBlockData =
      permissions?.allow_full_access || (permissions?.allow_upload_reports && permissions?.perform_tests)
        ? statusList
        : permissions?.allow_upload_reports && permissions?.perform_tests
          ? statusList
          : permissions?.perform_tests
            ? // ? statusList?.filter(item => ['pending', 'inprogress'].includes(item.status)) // commneted cause of getting completed on status value so we are taking keys instead of status
            statusList?.filter(item =>
              [
                'awaiting_sample',
                'sample_received',
                'sample_rejected',
                'sample_clotted',
                'sample_haemolysed',
                'completed_insufficient_samples',
                'inprogress'
              ].includes(item.key)
            )
            : // : permissions?.transfer_tests && permissions?.perform_tests
            // ? [
            //     ...statusList?.filter(item => ['pending', 'inprogress'].includes(item.status)),
            //     ...statusList?.filter(item =>
            //       ['sample_clotted', 'sample_haemolysed', 'completed_insufficient_samples'].includes(item.key)
            //     )
            //   ]
            // https://antzsystems.atlassian.net/browse/WD-1784?linkSource=email
            // need to discuss commented ones in ticket they are asking for it
            null
    if (filteredStatusBlockData) {
      setFilteredStatusData(filteredStatusBlockData)
    }
  }, [statusList])

  const matchSample = useCallback((sampleName, labName) => {
    if (requestById?.length > 0) {
      const result = requestById[0]?.test_reports.some(
        (item, index) => sampleName === item?.sample_name && labName != item?.lab_name
      )

      return result
    }
  })

  const fetchRequestDetails = useCallback(async (sort, q) => {
    try {
      setLoading(true)

      const params = {
        lab_id: Selectedlab_id,
        q,
        sort
      }

      let allRequestedItems = await getAllRequestDetails(id)
      if (allRequestedItems) {
        allRequestedItems[0]['total_no_test'] = allRequestedItems?.test_count
        allRequestedItems[0]['created_by'] = allRequestedItems?.user_first_name
      }

      setRequestById(allRequestedItems)

      const response = await GetRequestDetails(id, { params })
      const requestData = response?.data?.result || []
      const testReports = requestData[0]?.test_reports || []

      setStatusList(response?.data?.lab_test_status_master)
      // setLab_id(requestData[0]?.lab_id)
      setAnimalId(requestData[0]?.animal_details?.animal_id)
      setLabRequestId(requestData[0]?.request_id)
      setMedicineId(requestData[0]?.medical_record_id)
      setRequest(requestData)
      setRequestId(requestData[0]?.id)
      setRows(loadServerRows(paginationModel.page, testReports))
      setTotal(parseInt(response?.data?.total_count))
      setImage(requestData[0]?.files?.images)
      setDocument(requestData[0]?.files?.files)
      setMedicalDocument(requestData[0]?.medical_attachements?.files)
      setMedicalImage(requestData[0]?.medical_attachements?.images)
      setMedicalRecordNotes(requestData[0]?.medical_attachements?.notes)

      const allowedStatuses = [
        'completed',
        'completed_positive',
        'completed_negative',
        'completed_detected',
        'completed_not_detected',
        'completed_inconclusive',
        'completed'
      ]

      // ✅ API call ke baad `allCompleted` ko update karein
      setAllCompleted(testReports.some(row => row.status && allowedStatuses.includes(row.status)))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const getAccessLabs = async (id, labId) => {
    const params = {
      test_ids: labId
    }
    const requestData = request
    await getLabListByMultipleIds(id, params).then(res => {
      const labList = res?.data?.filter(labListItem => {
        return labListItem.lab_id != requestData[0]?.lab_id
      })
      setLab(labList)
    })
  }

  const handleOpenTransfer = async params => {

    const hasCompleted = selectedRowData?.filter(item =>
      [
        'completed',
        'completed_positive',
        'completed_negative',
        'completed_detected',
        'completed_not_detected',
        'completed_inconclusive',
        'inprogress'
      ].includes(item?.key)
    )

    if (hasCompleted?.length > 0 && !params) {
      setHasCompletedStatus(true)
    } else {
      setHasCompletedStatus(false)
    }
    setOpenTransfer(true)
    const labTestId = [params?.row?.id]
    if (params?.row) {
      setFromParam(true)
      setTestName(params?.row?.test_name)
      setTestSampleName(params?.row?.sample_name)
      setTestId([params?.row?.id])
      await getAccessLabs(LabRequestId, labTestId)

    } else {
      setFromParam(false)
      // setTransferStatus(params?.row?.status)
      if (selectedRow?.length === 1) {
        setTestName(selectedRowData[0]?.test_name)
        setTestSampleName(selectedRowData[0]?.sample_name)
      }
      await getAccessLabs(LabRequestId, selectedRow)
    }
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

  const handleOpenUploader = (e, params) => {
    setOpenUploader(true)
    setTestId(params?.row?.id)
  }

  const handleOpenShowFile = (e, params) => {
    e.stopPropagation()
    setRowId(params?.id)
    setOpenAttachmentSheet(true)
  }

  const shouldShowDropdown =
    permissions?.allow_full_access ||
    permissions?.perform_tests ||
    (permissions?.perform_tests && permissions?.allow_upload_reports) ||
    (permissions?.perform_tests && !permissions?.allow_upload_reports)

  const handleOpenCommentSheet = (e, params) => {
    setOpenCommentSheet(true)
    setCommentData(params)
  }

  // need to discuss about efefct on dropdown of status value
  const handleRowPermission = ({ params }) => {
    const st = statusList.filter(status => status.key === params.row.status)
    const st1 = filteredStatusData.filter(status => status.key === params.row.status)

    if (st1?.length === 0) {
      return false
    } else if (
      (permissions?.perform_tests &&
        !permissions?.allow_upload_reports &&
        !permissions?.allow_full_access &&
        st[0].key != 'awaiting_sample') ||
      st[0].key != 'sample_received' ||
      st[0].key != 'sample_rejected' ||
      st[0].key != 'sample_clotted' ||
      st[0].key != 'sample_haemolysed' ||
      st[0].key != 'completed_insufficient_samples' ||
      st[0].key != 'inprogress'
    ) {
      return true
    } else if ((permissions?.perform_tests && permissions?.allow_upload_reports) || permissions?.allow_full_access) {
      return true
    } else {
      return false
    }
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
      // flex: 0.8,
      width: 300,
      field: 'test_name',
      sortable: false,
      headerName: 'Test Name',
      renderCell: params => (
        <Box>
          <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
            {params?.row?.test_name}
            {params.row.is_special_sample === '1' && (
              <span>
                <Chip
                  sx={{ ml: '6px', fontSize: '12px' }}
                  size='small'
                  variant='outlined'
                  label='Other'
                  color='success'
                />
              </span>
            )}
          </Typography>
        </Box>
      )
    },
    {
      width: 300,
      field: 'sample_name',
      sortable: false,
      headerName: 'Sample',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
          {matchSample(params?.row.sample_name, params?.row?.lab_name) && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'red',
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '8px'
              }}
            ></span>
          )}
          <span style={{ display: 'inline-block', verticalAlign: 'middle' }} alt={params?.row.sample_name}>
            {params.row.sample_name}
          </span>
        </Typography>
      )
    },

    {
      width: 300,
      field: 'status',
      sortable: false,
      headerName: 'STATUS',
      align: 'center',
      renderCell: params => {
        const isSelected = selectedRowData?.some(item => item?.id === params?.id)
        return (
          <>
            <Box sx={{ minWidth: 260 }}>
              {shouldShowDropdown && handleRowPermission({ params }) ? (
                <FormControl fullWidth variant='outlined'>
                  <Select
                    disabled={isSelected}
                    size='small'
                    labelId='demo-simple-select-label'
                    id='demo-simple-select'
                    defaultValue={status === 'transferred' ? 'awaiting_sample' : params.row.status}
                    value={params.row.status}
                    onChange={event => handleChangeStatus(event, params?.row)}
                    sx={{
                      width: 237,
                      fontSize: '14px',
                      backgroundColor:
                        params.row.status === 'pending' ||
                          params.row.status === 'transferred' ||
                          params.row.status === 'awaiting_sample' ||
                          params.row.status === 'sample_clotted' ||
                          params.row.status === 'completed_insufficient_samples' ||
                          params.row.status === 'sample_haemolysed' ||
                          params.row.status === 'sample_rejected'
                          ? 'rgba(255, 0, 0, 0.1)' // light red background for pending
                          : params.row.status === 'completed'
                            ? 'rgba(0, 128, 0, 0.1)' // light green background for completed
                            : params.row.status === 'inprogress'
                              ? 'rgba(228, 184, 25, 0.1)' // light yellow background for in progress
                              : params.row.status === 'sample_received'
                                ? 'rgba(0, 128, 0, 0.1)'
                                : 'rgba(0, 128, 0, 0.1)',

                      color:
                        params.row.status === 'pending' ||
                          params.row.status === 'transferred' ||
                          params.row.status === 'awaiting_sample' ||
                          params.row.status === 'sample_clotted' ||
                          params.row.status === 'completed_insufficient_samples' ||
                          params.row.status === 'sample_haemolysed' ||
                          params.row.status === 'sample_rejected'
                          ? theme.palette.customColors.customDropdownColor
                          : params.row.status === 'completed'
                            ? theme.palette.primary.main
                            : params.row.status === 'inprogress'
                              ? theme.palette.customColors.moderateSecondary
                              : params.row.status === 'sample_received'
                                ? theme.palette.primary.main
                                : theme.palette.primary.main,

                      borderRadius: '8px',
                      '& .MuiSelect-icon': {
                        color:
                          params.row.status === 'pending' ||
                            params.row.status === 'transferred' ||
                            params.row.status === 'awaiting_sample' ||
                            params.row.status === 'sample_clotted' ||
                            params.row.status === 'completed_insufficient_samples' ||
                            params.row.status === 'sample_haemolysed' ||
                            params.row.status === 'sample_rejected'
                            ? theme.palette.customColors.customDropdownColor
                            : params.row.status === 'completed'
                              ? theme.palette.primary.main
                              : params.row.status === 'inprogress'
                                ? theme.palette.customColors.moderateSecondary
                                : params.row.status === 'sample_received'
                                  ? theme.palette.primary.main
                                  : theme.palette.primary.main
                      },

                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '0'
                      },

                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '0'
                      }
                    }}
                  >
                    {filteredStatusData?.map((item, index) => (
                      <MenuItem key={index} value={item?.key}>
                        {item?.value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                  <span
                    alt={params.row.status}
                    style={{
                      color:
                        params.row.status === 'pending' ||
                          params.row.status === 'transferred' ||
                          params.row.status === 'awaiting_sample' ||
                          params.row.status === 'sample_clotted' ||
                          params.row.status === 'completed_insufficient_samples' ||
                          params.row.status === 'sample_haemolysed' ||
                          params.row.status === 'sample_rejected'
                          ? theme.palette.customColors.customDropdownColor
                          : params.row.status === 'completed'
                            ? theme.palette.primary.main
                            : params.row.status === 'inprogress'
                              ? theme.palette.customColors.moderateSecondary
                              : params.row.status === 'sample_received'
                                ? theme.palette.primary.main
                                : theme.palette.primary.main
                    }}
                  >
                    {params.row.status_label}
                  </span>
                </Typography>
              )}
            </Box>
          </>
        )
      }
    },
    ...(permissions?.allow_full_access ||
      permissions?.transfer_tests ||
      permissions?.perform_tests ||
      permissions?.allow_upload_reports
      ? [
        {
          // flex: 0.2,
          width: 300,
          field: 'References',
          headerName: 'References',
          sortable: false,
          renderCell: params => (
            <>
              <Box sx={{ display: 'flex', gap: 4 }}>
                {params?.row?.attachments?.images?.length > 0 || params?.row?.attachments?.docs?.length > 0 ? (
                  <Box
                    onClick={e => handleOpenShowFile(e, params)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      justifyContent: 'center',
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                      p: 2,
                      borderRadius: '15px',
                      width: 50,
                      cursor: 'pointer'
                    }}
                  >
                    <img src='/images/attach_file.png' alt='default icon' style={{ width: 12 }} />
                    <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '15px' }}>
                      {
                        params?.row?.attachments?.images?.length > 0 && params?.row?.attachments?.docs?.length > 0
                          ? params.row.attachments.images.length + params.row.attachments.docs.length
                          : params?.row?.attachments?.images?.length > 0
                            ? params.row.attachments.images.length
                            : params?.row?.attachments?.docs
                              ? params.row.attachments.docs.length
                              : null

                        // params?.row?.attachments?.docs?.length
                      }
                    </Typography>
                  </Box>
                ) : null}

                <Stack
                  direction='row'
                  className='customButton'
                  spacing={3}
                  sx={{
                    ml:
                      params?.row?.attachments?.images?.length > 0 || params?.row?.attachments?.docs?.length > 0
                        ? 0
                        : 16
                  }}
                >
                  <>
                    {(permissions?.allow_full_access || permissions?.allow_upload_reports) && (
                      <Tooltip
                        title='Upload'
                        arrow
                        placement='top-start'
                        sx={{
                          bgColor: 'red',
                          '& .MuiTooltip-tooltip': {
                            backgroundColor: 'blue', // Set your desired color
                            color: 'white' // Change text color if needed
                          }
                        }}
                      >
                        <IconButton
                          variant='outlined'
                          size='small'
                          sx={{
                            p: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(68, 84, 74, 0.1)' // Change background color on hover
                            }
                          }}
                          onClick={e => {
                            e.stopPropagation(), handleOpenUploader(e, params)
                          }}
                        >
                          <Icon icon='tabler:upload' width='24' height='24' color={'rgba(68, 84, 74, 1)'} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                  <>
                    {(permissions?.allow_full_access || permissions?.transfer_tests) &&
                      params.row.status.split('_')[0] !== 'completed' && (
                        <Tooltip title='Transfer' arrow placement='top-start'>
                          <IconButton
                            variant='outlined'
                            size='small'
                            sx={{
                              p: 2,
                              '&:hover': {
                                backgroundColor: 'rgba(68, 84, 74, 0.1)' // Change background color on hover
                              }
                            }}
                            onClick={e => {
                              e.stopPropagation(), handleOpenTransfer(params)
                            }}
                          >
                            <Icon
                              icon='mingcute:transfer-3-line'
                              width='24'
                              height='24'
                              color={'rgba(68, 84, 74, 1)'}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                  </>

                  {(permissions?.allow_full_access ||
                    permissions?.perform_tests ||
                    permissions?.allow_upload_reports) && (
                      <Tooltip title='Notes' arrow placement='top-start'>
                        <IconButton
                          variant='outlined'
                          size='small'
                          sx={{
                            p: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(68, 84, 74, 0.1)' // Change background color on hover
                            }
                          }}
                          onClick={e => {
                            e.stopPropagation(), handleOpenCommentSheet(e, params?.row)
                          }}
                        >
                          <Icon
                            icon='fluent:comment-note-24-regular'
                            width='28'
                            height='28'
                            color={'rgba(68, 84, 74, 1)'}
                          />
                        </IconButton>
                      </Tooltip>
                    )}
                </Stack>
              </Box>
            </>
          )
        }
      ]
      : []),
    ,
  ]

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  // const handleSearch = async value => {
  //   setSearchValue(value)
  //   await searchTableData({ sort, q: value, column: sortColumn })
  // }

  const handleCloseTransfer = () => {
    reset()
    setOpenTransfer(false)
    handleClosePopover()
    setTestId([])
    setLab([])
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
    transfer_reason: yup.string().trim().required('Transfer reason is required')
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
        ScrollToTop()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const onSubmit = async params => {
    const { lab_name, replaced_lab_id, transfer_reason } = {
      ...params
    }

    if (selectedRowData.some(item => item?.status === 'completed')) {
      Toaster({ type: 'error', message: "A test with status 'completed' was found!" })
      setOpenTransfer(false)
    } else {
      const payloadMulti = {
        test_ids: selectedRow,
        replaced_lab_id,
        transfer_reason
      }

      const payloadSingle = {
        test_ids: testId,
        replaced_lab_id,
        transfer_reason
      }

      const res = await postBulkTransfer({ params: testId.length ? payloadSingle : payloadMulti })
      if (res?.success) {
        handleCloseTransfer()

        Toaster({ type: 'success', message: res.message })
        reset({
          replaced_lab_id: '',
          transfer_reason: ''
        })
        fetchRequestDetails()
      } else {
        handleCloseTransfer()
        reset({
          replaced_lab_id: '',
          transfer_reason: ''
        })
        Toaster({ type: 'error', message: res.message.transfer_reason })
      }
    }
  }

  const handleDeleteImg = async (e, item) => {
    e.preventDefault()
    e.stopPropagation()

    const testId = item?.id
    // setFileId(item?.id)
    try {
      setDeleteAttachmentLoader(true)
      const params = { lab_test_id: id }
      const response = await DeleteLAbRequestAttachment(testId, params)
      fetchRequestDetails()
      if (response?.success) {
        Toaster({ type: 'success', message: response.message })
        fetchRequestDetails()
        setShowTestFile(false)
      } else {
        setShowTestFile(false)
        Toaster({ type: 'error', message: response.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: response.message || 'Failed to delete' })
    } finally {
      setDeleteAttachmentLoader(false)
    }
  }

  useEffect(() => {
    // for get updated UI in attachment side sheet
    if (openAttachmentSheet && rowId) {
      const selected = rows.find(item => item.id === rowId)
      setTestImage(selected?.attachments?.images || [])
      setTestDoc(selected?.attachments?.docs || [])
    }
  }, [rows, rowId, openAttachmentSheet])

  const handleRowSelection = (rowSelectionModel, details) => {
    setSelectedRow(rowSelectionModel)

    // Retrieve the complete row data based on selected row IDs
    const selectedRowData = rows.filter(row => rowSelectionModel.includes(row.id))

    setShouldShowBulkStatus(
      selectedRowData?.filter(item =>
        [
          'awaiting_sample',
          'sample_received',
          'sample_rejected',
          'sample_clotted',
          'sample_haemolysed',
          'completed_insufficient_samples',
          'inprogress'
        ].includes(item?.key)
      )
    )
    setSelectedRowData(selectedRowData)
  }

  const postMultipleStatus = async (testIds, status) => {
    try {
      // Make your API call here
      const params = {
        status: status || headerStatus,
        lab_request: id,
        test_ids: testIds || selectedRow
      }

      const res = await postBulkStatus({ params })
      if (res?.success) {
        Toaster({ type: 'success', message: res.message })
        fetchRequestDetails()
      }
    } catch (error) {
      Toaster({ type: 'error', message: res.message })
    }
  }

  const handleHeaderDropdown = e => {
    const value = e.target.value

    if (
      (value === 'completed_positive' ||
        value === 'completed_negative' ||
        value === 'completed_detected' ||
        value === 'completed_not_detected' ||
        value === 'completed_inconclusive' ||
        // value === 'completed_insufficient_samples' ||
        value === 'completed') &&
      !(image || document)
    ) {
      setHeaderStatus('awaiting_sample')
      Toaster({ type: 'error', message: 'Attach the report before completing the test' })
      fetchRequestDetails()
    } else {
      setHeaderStatus(value)
      postMultipleStatus(selectedRow, value)
    }
  }

  const HeaderCard = ({ item, handleClickOpen }) => {
    debugger
    if (!item) return null

    return (
      <Box>
        {/* Top row with optional back button */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant='h6'>
            Request ID -{' '}
            <span
              onClick={() => (handleClickOpen ? handleClickOpen(item) : null)}
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: `${handleClickOpen ? 'pointer' : 'default'}`,
                color: theme.palette.primary.main
              }}
            >
              {item.request_id}
            </span>
          </Typography>
        </Box>

        {/* Request details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap' }}>
          <Typography>
            Medical Record :{' '}
            <span
              style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: theme.palette.customColors.secondaryBg
              }}
            >
              {item.medical_record_code}
            </span>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap' }}>
          <Typography>
            Requested By :{' '}
            <span
              style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: theme.palette.customColors.secondaryBg
              }}
            >
              {item.created_by}
            </span>
          </Typography>
        </Box>

        <Typography>Requested On : {moment(item.created_at).format('DD MMM YYYY')}</Typography>

        <Typography>
          Site :{' '}
          <span
            style={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: theme.palette.customColors.secondaryBg
            }}
          >
            {item.site_name}
          </span>
        </Typography>

        <Typography>
          No. of Tests : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item.total_no_test}</span>
        </Typography>
      </Box>
    )
  }

  const onCellClick = params => {
    debugger
    if (params.field === 'sample_name') {
      const result = matchSample(params.formattedValue, params.row.lab_name)
      if (result) {
        setOpen(true)
        setSelectedSample([params.formattedValue, params.row.lab_name])
      }
    }
    console.log(params)
  }

  const TestListPopup = ({ open, handleClose, requestById, selectedSample }) => {
    var testList = requestById

    if (selectedSample.length > 0) {
      const filteredTest = requestById[0]?.test_reports.filter((item, index) => selectedSample[0] === item?.sample_name)
      testList[0]['test_reports'] = filteredTest
      testList[0]['total_no_test'] = filteredTest.length
      testList[0]['created_by'] = testList[0].user_first_name
      debugger
      console.log(testList)
    }

    return (
      <>
        {/* Open PopUp On Clicking Request Id */}
        <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              px: 2,
              py: 3,
              bgcolor: theme.palette.customColors.displaybgPrimary
            }}
          >
            <Typography variant='h6' sx={{ ml: 3 }}>
              Test list
            </Typography>
            <IconButton onClick={handleClose}>
              <Icon icon='ep:close-bold' fontSize={20} color={'red'} />
            </IconButton>
          </Box>
          {testList?.map((item, index) => (
            <Box key={index} sx={{ p: 2, minWidth: 600, m: 4 }}>
              <HeaderCard item={item} handleClickOpen={null} />
              <Box
                sx={{
                  mt: 2
                }}
              >
                <TableContainer component={Paper} style={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.customColors.displaybgPrimary }}>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Sample Name</TableCell>
                        <TableCell>Lab Name</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item?.test_reports?.map((data, dataID) => (
                        <TableRow key={dataID}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{data?.test_name}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{data?.sample_name}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{data?.lab_name}</TableCell>
                          <TableCell>
                            <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                              <span
                                alt={data?.status}
                                style={{
                                  color:
                                    data?.status === 'pending' ||
                                      data?.status === 'transferred' ||
                                      data?.status === 'awaiting_sample' ||
                                      data?.status === 'sample_rejected'
                                      ? theme.palette.customColors.customDropdownColor
                                      : data?.status === 'completed'
                                        ? theme.palette.primary.main
                                        : data?.status === 'inprogress'
                                          ? theme.palette.customColors.moderateSecondary
                                          : data?.status === 'sample_received'
                                            ? theme.palette.primary.main
                                            : theme.palette.primary.main
                                }}
                              >
                                {data?.status === 'awaiting_sample'
                                  ? 'Awaiting sample'
                                  : data?.status === 'sample_received'
                                    ? 'Sample received'
                                    : data?.status === 'sample_rejected'
                                      ? 'sample rejected'
                                      : data?.status === 'completed_positive'
                                        ? 'completed positive'
                                        : data?.status === 'completed_negative'
                                          ? 'completed negative'
                                          : data?.status === 'completed_detected'
                                            ? 'completed detected'
                                            : data?.status === 'completed_not_detected'
                                              ? 'completed not detected'
                                              : data?.status === 'completed_inconclusive'
                                                ? 'completed inconclusive'
                                                : data?.status === 'completed'
                                                  ? 'Completed'
                                                  : data?.status === 'completed_insufficient_samples'
                                                    ? 'Completed - Insufficient Samples'
                                                    : 'In Progress'}
                              </span>
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          ))}
        </Dialog>
      </>
    )
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography color='inherit'>
              Labs
            </Typography>
            <Typography
              sx={{ cursor: 'pointer' }}
              color='inherit'
              onClick={() =>
                router.push({
                  pathname: '/lab/request',
                  query: { page, pageSize, q }
                })
              }
            >
              Requests list
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
              }}
            >
              Lab request details
            </Typography>
          </Breadcrumbs>

          <Card sx={{ p: 5 }}>
            <CardHeader sx={{ py: 0, ml: -4 }} title='Request Details Page' />
            {request?.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <HeaderCard key={index} item={item} handleClickOpen={handleClickOpen} />
                <Box
                  sx={{
                    minWidth: '400px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    backgroundColor: theme.palette.customColors.cardHeaderBg,
                    borderRadius: '8px',
                    alignItems: ''
                  }}
                >
                  <AnimalParentCard
                    data={item?.animal_details[0]}
                    backgroundColor={theme.palette.customColors.cardHeaderBg}
                  />
                  {item?.animal_details?.length > 1 && (
                    <Box
                      onClick={() => setOpenAnimalSheet(true)}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        bgcolor: 'rgba(0, 128, 0, 0.1)',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        fontSize: '20px',
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: theme.palette.primary.main,
                        m: 3,
                        p: 3,
                        width: '50px',
                        height: '50px'
                      }}
                    >
                      +{item?.animal_details?.length - 1}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Card>

          <Card sx={{ mt: 5 }}>
            <Box
              sx={{
                px: 5,
                py: 3,
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography sx={{ fontSize: '20px', fontWeight: 500 }}>Lab Tests </Typography>
              {selectedRow?.length > 0 && (
                <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: theme.palette.customColors.mdAntzNeutral,
                      width: '35px',
                      height: '35px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px'
                    }}
                  >
                    <Typography sx={{ fontSize: '15px', fontWeight: 400 }}>{selectedRow?.length}</Typography>
                  </Box>

                  {(permissions?.transfer_tests === true || permissions?.allow_full_access === true) && (
                    <Button
                      disabled={selectedRowData?.some(item => item?.status === 'completed')}
                      variant='contained'
                      sx={{ display: 'flex', gap: 2 }}
                      onClick={() => handleOpenTransfer()}
                    >
                      <Icon icon='mingcute:transfer-3-line' width='24px' height='24px' /> Transfer
                    </Button>
                  )}

                  <Box>
                    {(permissions?.allow_full_access || permissions?.perform_tests) && shouldShowBulkStatus && (
                      <FormControl fullWidth variant='outlined'>
                        <Select
                          disabled={selectedRowData?.some(item => item?.status === 'completed')}
                          size='small'
                          labelId='demo-simple-select-label'
                          id='demo-simple-select'
                          // defaultValue={'awaiting_sample'}
                          value={headerStatus}
                          onChange={e => handleHeaderDropdown(e)}
                          sx={{
                            width: 237,
                            fontSize: '14px',
                            backgroundColor:
                              headerStatus === 'pending' ||
                                headerStatus === 'transferred' ||
                                headerStatus === 'awaiting_sample' ||
                                headerStatus === 'sample_clotted' ||
                                headerStatus === 'completed_insufficient_samples' ||
                                headerStatus === 'sample_haemolysed' ||
                                headerStatus === 'sample_rejected'
                                ? 'rgba(255, 0, 0, 0.1)' // light red background for pending
                                : headerStatus === 'completed'
                                  ? 'rgba(0, 128, 0, 0.1)' // light green background for completed
                                  : headerStatus === 'inprogress'
                                    ? 'rgba(228, 184, 25, 0.1)'
                                    : headerStatus === 'sample_received'
                                      ? 'rgba(0, 128, 0, 0.1)'
                                      : 'rgba(0, 128, 0, 0.1)',

                            color:
                              headerStatus === 'pending' ||
                                headerStatus === 'transferred' ||
                                headerStatus === 'awaiting_sample' ||
                                headerStatus === 'sample_clotted' ||
                                headerStatus === 'completed_insufficient_samples' ||
                                headerStatus === 'sample_haemolysed' ||
                                headerStatus === 'sample_rejected'
                                ? theme.palette.customColors.customDropdownColor
                                : headerStatus === 'completed'
                                  ? theme.palette.primary.main
                                  : headerStatus === 'inprogress'
                                    ? theme.palette.customColors.moderateSecondary
                                    : headerStatus === 'sample_received'
                                      ? theme.palette.primary.main
                                      : theme.palette.primary.main,

                            borderRadius: '8px',

                            '& .MuiSelect-icon': {
                              color:
                                headerStatus === 'pending' ||
                                  headerStatus === 'transferred' ||
                                  headerStatus === 'awaiting_sample' ||
                                  headerStatus === 'sample_clotted' ||
                                  headerStatus === 'completed_insufficient_samples' ||
                                  headerStatus === 'sample_haemolysed' ||
                                  headerStatus === 'sample_rejected'
                                  ? theme.palette.customColors.customDropdownColor
                                  : headerStatus === 'completed'
                                    ? theme.palette.primary.main
                                    : headerStatus === 'inprogress'
                                      ? theme.palette.customColors.moderateSecondary
                                      : headerStatus === 'sample_received'
                                        ? theme.palette.primary.main
                                        : theme.palette.primary.main
                            },

                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: '0',
                              borderColor:
                                headerStatus === 'pending' ||
                                  headerStatus === 'transferred' ||
                                  headerStatus === 'awaiting_sample' ||
                                  headerStatus === 'sample_rejected' ||
                                  headerStatus === 'sample_clotted' ||
                                  headerStatus === 'completed_insufficient_samples' ||
                                  headerStatus === 'sample_haemolysed' ||
                                  headerStatus === 'sample_received'
                                  ? theme.palette.customColors.customDropdownColor // Custom red border for these statuses
                                  : headerStatus === 'completed'
                                    ? theme.palette.primary.main // Custom green border for completed
                                    : headerStatus === 'inprogress'
                                      ? theme.palette.customColors.moderateSecondary // Custom yellow border for in progress
                                      : theme.palette.primary.main // Default green border
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: '0'
                            }
                          }}
                        >
                          {filteredStatusData?.map((item, index) => (
                            <MenuItem key={index} value={item?.key}>
                              {item?.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            <DataGrid
              checkboxSelection={
                permissions?.perform_tests || permissions?.allow_full_access || permissions?.transfer_tests
              }
              onRowSelectionModelChange={handleRowSelection}
              onCellClick={onCellClick}
              isRowSelectable={params => {
                if (
                  (permissions?.view &&
                    permissions?.transfer_tests === false &&
                    permissions?.perform_tests === false &&
                    permissions?.allow_upload_reports === false &&
                    permissions?.allow_full_access === false) ||
                  (permissions?.perform_tests === true &&
                    permissions?.allow_upload_reports === false &&
                    permissions?.allow_full_access === false &&
                    !statusList?.filter(item =>
                      [
                        'awaiting_sample',
                        'sample_received',
                        'sample_rejected',
                        'sample_clotted',
                        'sample_haemolysed',
                        'completed_insufficient_samples',
                        'inprogress'
                      ].includes(item.key)
                    )) ||
                  (permissions?.perform_tests === false &&
                    permissions?.transfer_tests === true &&
                    permissions?.allow_upload_reports === false &&
                    permissions?.allow_full_access === false &&
                    params.row.status.includes('completed'))
                ) {
                  return false
                } else {
                  return true
                }
              }}
              sx={{
                '& .MuiDataGrid-row:hover .customButton': {
                  display: 'block'
                },
                '& .MuiDataGrid-row .customButton': {
                  display: 'none'
                }
              }}
              autoHeight
              hideFooterPagination
              hideFooterSelectedRowCount
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              onSortModelChange={handleSortModel}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                }
              }}
            />
          </Card>

          {permissions?.allow_upload_reports ||
            permissions?.allow_full_access ||
            image?.length > 0 ||
            document?.length > 0 ? (
            <Card sx={{ mt: 5 }}>
              <Box sx={{ py: 5, px: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: 3 }}>
                  <img src='/images/attach_file_icon.png' alt='default icon' style={{ width: 12 }} />
                  <Typography sx={{ fontSize: 20, fontWeight: 500 }}>Lab Attachments</Typography>
                </Box>

                <Divider />
              </Box>
              <Box sx={{ mb: '20px', px: 0 }}>
                {permissions?.allow_upload_reports || permissions?.allow_full_access ? (
                  <UploadReports
                    animalID={animanlId}
                    labTestId={LabRequestId}
                    medicalRecordId={medicineId}
                    type='lab_test_request'
                    id={requestId === null ? '0' : requestId}
                    handleCloseUploader={setOpenUploader}
                    handleClosePopover={handleClosePopover}
                    fetchRequestDetails={fetchRequestDetails}
                    buttonText='Submit Reports'
                    restrictExecutiveFiles={true}
                  />
                ) : null}
              </Box>
              {/* image or Doc View */}
              {image?.length > 0 || document?.length > 0 ? (
                <Box sx={{ px: 5, mb: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {(image || document) && (
                      <CommonMediaView
                        allCompleted={allCompleted}
                        image={image}
                        document={document}
                        handleDeleteImg={handleDeleteImg}
                        fileViews={fileViews}
                        deleteAttachmentLoader={deleteAttachmentLoader}
                        permissions={permissions}
                      />
                    )}
                  </Box>
                </Box>
              ) : null}
              {/* allow user Only if user hand upload permissions */}
            </Card>
          ) : null}

          {(medicalDocument || medicalImage) && (
            <Card sx={{ mt: 5 }}>
              <Box sx={{ px: 5, mb: 10, mt: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src='/images/attach_file_icon.png' alt='default icon' style={{ width: 12 }} />

                  <Typography sx={{ fontSize: '20px', py: 2, fontWeight: 500 }}> Medical Report Attachments</Typography>
                </Box>
                <Divider />

                <>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4, mt: '16px' }}>
                    {medicalImage && (
                      <CommonMediaView
                        allCompleted={allCompleted}
                        image={medicalImage}
                        handleDeleteImg={handleDeleteImg}
                        fileViews={fileViews}
                        type='medical'
                        permissions={permissions}
                      />
                    )}
                    {medicalDocument && (
                      <CommonMediaView
                        allCompleted={allCompleted}
                        document={medicalDocument}
                        handleDeleteImg={handleDeleteImg}
                        fileViews={fileViews}
                        type='medical'
                        permissions={permissions}
                      />
                    )}
                  </Box>
                </>
                <></>
              </Box>
            </Card>
          )}
        </>
      )}
      <Card sx={{ mt: 5 }}>
        <Box sx={{ py: 5, px: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: 3 }}>
            <Icon icon='gg:notes' width='24' height='24' />
            <Typography sx={{ fontSize: 20, fontWeight: 500 }}>Medical Record Notes</Typography>
          </Box>

          <Divider />
          <MedicalRecordNotes notes={medicalRecordNotes} />
        </Box>
      </Card>
      <TestListPopup
        open={open}
        handleClose={handleClose}
        requestById={requestById}
        selectedSample={selectedSample}
      ></TestListPopup>
      <>
        <Dialog
          open={openTransfer}
          onClose={handleCloseTransfer}
          maxWidth='md'
          fullWidth
          sx={{ bgColor: theme.palette.primary.contrastText }}
        >
          <DialogContent sx={{ bgcolor: theme.palette.primary.contrastText }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon
                  icon='mingcute:transfer-3-line'
                  width='24'
                  height='24'
                  color={theme.palette.customColors.OnSurfaceVariant}
                />
                <Typography
                  sx={{ fontSize: '20px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}
                >
                  Lab Test Transfer
                </Typography>
              </Box>
              <IconButton onClick={handleCloseTransfer}>
                <Icon icon='ic:baseline-close' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
              </IconButton>
            </Box>
            <Divider />
            <Box
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                p: 5,
                px: 8,
                mt: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '8px'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Typography sx={{ fontSize: '14px' }}>Request ID : </Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{request[0]?.request_id || '-'} </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: 'column',
                  flexDirection: 'column',
                  alignItems: selectedRowData?.length > 1 && 'center'
                }}
              >
                {selectedRowData?.length > 1 && !fromParam ? (
                  <>
                    <Typography sx={{ fontSize: '14px' }}>No of Tests : </Typography>

                    <Tooltip
                      title={
                        <Box
                          sx={{
                            maxHeight: '250px',
                            overflowY: 'auto',
                            borderRadius: '4px',
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none'
                          }}
                        >
                          {selectedRowData.map(name => (
                            <Typography
                              key={name?.id}
                              sx={{ fontSize: '15px', color: theme.palette.primary.contrastText }}
                            >
                              {name?.test_name}
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '30px',
                          height: '30px',
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          borderRadius: '8px',
                          fontSize: '15px'
                        }}
                      >
                        {selectedRowData?.length}
                      </Box>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '14px' }}>Test Name : </Typography>

                    <Typography sx={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {testName || '-'}
                    </Typography>
                  </>
                )}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: 'column',
                  alignItems: selectedRowData?.length > 1 && 'center'
                }}
              >
                {selectedRowData?.length > 1 && !fromParam ? (
                  <>
                    <Typography sx={{ fontSize: '14px' }}>No of Samples : </Typography>

                    <Tooltip
                      title={
                        <Box
                          sx={{
                            maxHeight: '250px',
                            overflowY: 'auto',
                            borderRadius: '4px',
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none'
                          }}
                        >
                          {selectedRowData.map(name => (
                            <Typography
                              key={name?.id}
                              sx={{ fontSize: '15px', color: theme.palette.primary.contrastText }}
                            >
                              {name?.sample_name}
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '30px',
                          height: '30px',

                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          borderRadius: '8px',
                          fontSize: '15px'
                        }}
                      >
                        {selectedRowData?.length}
                      </Box>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '14px' }}>Sample Name : </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {testSampleName ? testSampleName : '-'}
                    </Typography>
                  </>
                )}
              </Box>{' '}
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Typography sx={{ fontSize: '14px' }}>Site : </Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{request[0]?.site_name || '-'}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 6 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={4}>
                  <Grid item size={{ xs: 6, sm: 6, md: 6 }} sx={{ mb: 2 }}>
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
                            placeholder=''
                            slotProps={{
                              input: { readOnly: true }
                            }}
                          />
                        )}
                      />
                      {errors.lab_name && (
                        <FormHelperText>
                          {errors?.lab_name?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item size={{ xs: 6, sm: 6, md: 6 }} sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.replaced_lab_id)} id='lab_type'>
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
                            }}
                            error={Boolean(errors?.replaced_lab_id)}
                            labelId='replaced_lab_id'
                          >
                            {lab?.length > 0 ? (
                              lab.map(item => (
                                <MenuItem key={item?.lab_id} value={item?.lab_id}>
                                  {item?.lab_name}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled value=''>
                                No labs to transfer
                              </MenuItem>
                            )}
                          </Select>
                        )}
                      />
                      {errors?.replaced_lab_id && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.replaced_lab_id?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item size={{ xs: 12, sm: 6, md: 12 }} sx={{ mb: 2 }}>
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
                            error={Boolean(errors.transfer_reason)}
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
                </Grid>
                {hasCompletedStatus && (
                  <Typography color='error' sx={{}}>
                    This transfer cannot be processed because one or more selected tests have been marked as completed.
                  </Typography>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    gap: 4,
                    mt: 10,
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end' // Align buttons to the right
                  }}
                >
                  <LoadingButton
                    onClick={handleCloseTransfer}
                    variant='outlined'
                    size='large'

                  // disabled={permissions?.allow_full_access !== true || permissions?.transfer_tests !== true}
                  >
                    Cancel
                  </LoadingButton>

                  <LoadingButton
                    disabled={hasCompletedStatus}
                    onClick={handleSubmitData}
                    type='submit'
                    variant='contained'
                    size='large'
                  >
                    CONFIRM
                  </LoadingButton>
                </Box>
              </form>
            </Box>
          </DialogContent>
        </Dialog>
      </>
      <>
        <Dialog
          open={openUploader}
          onClose={() => setOpenUploader(false)}
          fullWidth
          maxWidth='md'
          sx={{
            '& .MuiPaper-root': {
              minHeight: '200px' // Set your desired min-height here
            }
          }}
        >
          <DialogContent sx={{ bgcolor: theme.palette.primary.contrastText }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 5, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Icon icon='lucide:upload' fontSize={25} color={theme.palette.customColors.OnSurfaceVariant} />
                <Typography sx={{ fontSize: '20px', fontWeight: 500 }}>Upload</Typography>
              </Box>

              <IconButton onClick={() => setOpenUploader(false)} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Icon icon='ic:baseline-close' fontSize={25} color={theme.palette.customColors.OnSurfaceVariant} />
              </IconButton>
            </Box>
            <Divider sx={{ mx: 5 }} />
            <UploadReports
              animalID={animanlId}
              labTestId={LabRequestId}
              medicalRecordId={medicineId}
              type='lab_test'
              id={testId}
              handleCloseUploader={() => setOpenUploader(false)}
              fetchRequestDetails={fetchRequestDetails}
              buttonText='Upload'
            />
          </DialogContent>
        </Dialog>
      </>
      <>
        <Dialog open={showTestFile} onClose={() => setShowTestFile(false)} fullWidth maxWidth='lg' sx={{ py: 2 }}>
          <Box
            sx={{
              display: 'flex',
              px: 5,
              py: 3,
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: theme.palette.customColors.displaybgPrimary
            }}
          >
            <Typography sx={{ fontSize: '20px', fontWeight: 'bold' }}>Reports</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setShowTestFile(false)}>
                <Icon icon='ic:baseline-close' fontSize={25} color={'red'} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ py: 2, mb: 5 }}>
            {testImage || testDoc ? (
              <>
                <Box sx={{ px: 5 }}>
                  {testImage ? (
                    <Box>
                      <Typography sx={{ fontSize: '18px', mb: 2 }}>Images</Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 4,
                          minWidth: 500
                        }}
                      >
                        <CommonMediaView
                          allCompleted={allCompleted}
                          image={testImage}
                          handleDeleteImg={handleDeleteImg}
                          fileViews={fileViews}
                          permissions={permissions}
                        />
                      </Box>
                    </Box>
                  ) : null}

                  {testDoc ? (
                    <Box>
                      <Typography sx={{ fontSize: '18px', mb: 3, mt: 3 }}>Document</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        <CommonMediaView
                          allCompleted={allCompleted}
                          document={testDoc}
                          handleDeleteImg={handleDeleteImg}
                          fileViews={fileViews}
                          permissions={permissions}
                        />
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              </>
            ) : null}
          </Box>
        </Dialog>
      </>
      <>
        {openAnimalSheet && (
          <AnimalSideSheet
            openAnimalSheet={openAnimalSheet}
            setOpenAnimalSheet={setOpenAnimalSheet}
            request={request}
          />
        )}
      </>
      <>
        {openCommentSheet && (
          <CommentSideSheet
            openCommentSheet={openCommentSheet}
            setOpenCommentSheet={setOpenCommentSheet}
            CommentData={CommentData}
            api={() => fetchRequestDetails()}
          />
        )}
      </>
      <>
        {openAttachmentSheet && (
          <AttachmentSheet
            permissions={permissions}
            handleDeleteImg={handleDeleteImg}
            fileViews={fileViews}
            openAttachmentSheet={openAttachmentSheet}
            setOpenAttachmentSheet={setOpenAttachmentSheet}
            allCompleted={allCompleted}
            testImage={testImage}
            testDoc={testDoc}
            image={image}
            document={document}
            deleteAttachmentLoader={deleteAttachmentLoader}
          />
        )}
      </>
    </>
  )
}

export default RequestDetails
