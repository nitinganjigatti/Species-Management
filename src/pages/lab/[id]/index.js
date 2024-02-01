/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react'

import { GetRequestDetails, GetRequestPopUp, transferLab, getNoOfLab } from 'src/lib/api/lab/getLabRequest'

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
  FormHelperText
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import Utility from 'src/utility'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'

const RequestDetails = () => {
  const [loader, setLoader] = useState(false)
  const [selectedLab, setSelectedLab] = useState()
  // console.log('selectedLab', selectedLab)
  const [popUpRow, setPopUpRow] = useState([])

  const { id } = Router.query

  const requestId = id
  // console.log('id', id)
  const [request, setRequest] = useState([])
  // console.log('request', request)
  const [openTransfer, setOpenTransfer] = useState(false)
  const [open, setOpen] = React.useState(false)
  const [requestById, setRequestById] = useState()
  // console.log('requestById', requestById)
  // const [storedData, setStoredData] = useState()
  // console.log('storedData', storedData)
  const [permissions, setPermissions] = useState(null)
  // console.log('permissions', permissions)

  const storedData = JSON.parse(localStorage.getItem('userDetails'))
  // console.log('storedData', storedData)
  const [status, setStatus] = React.useState({})

  const localLabData = storedData?.modules?.lab_data.lab
  // console.log('localLabData', localLabData)

  const PrvLabId = request[0]?.lab_id // 68
  // console.log('PrvLabId', PrvLabId)
  const [lab, setLab] = React.useState([])

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  // console.log('total', total)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  // console.log('rows', rows)
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const labObject = localLabData?.find(item => item[0]?.lab_id === PrvLabId)
    if (labObject && labObject.permission) {
      setPermissions(labObject.permission)
    }
  }, [PrvLabId])

  const handleChangeStatus = event => {
    setStatus(event.target.value)
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

  const fetchRequestDetails = async () => {
    try {
      // Make your API call here
      setLoading(true)

      const response = await GetRequestDetails(id).then(res => {
        setRequest(res?.data?.result)
        console.log('nih', res?.data?.result)
        setRows(res?.data?.result[0].test_reports)
        setTotal(parseInt(res?.data?.total_count))
        setLoading(false)
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    getNoOfLab().then(res => {
      setLab(res?.data?.result)
      console.log('res?.data', res?.data)
      // setRows(loadServerRows(paginationModel.page, res?.data?.result))
    })
  }, [])

  const handleOpenTransfer = params => {
    if (permissions?.transfer_tests === true) {
      setOpenTransfer(true)
      setSelectedLab(params.row)
    }
  }

  useEffect(() => {
    fetchRequestDetails()
  }, [id, paginationModel])

  function loadServerRows(currentPage, data) {
    return data
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchRequestDetails({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

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
      flex: 0.3,
      minWidth: 20,
      field: 'test_name',
      headerName: 'Test Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.test_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'sample_name',
      headerName: 'Sample Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params?.row.sample_name}>{params.row.sample_name}</span>
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'sample_id',
      headerName: 'Sample id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.sample_id}>{params.row.sample_id}</span>
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <>
          {}
          <Box sx={{ minWidth: 120 }}>
            {/* {permissions?.transfer_tests === true ? (
              <FormControl fullWidth size='small' sx={{ borderColor: 'red' }}>
                <InputLabel id='demo-simple-select-label'>Status</InputLabel>
                <Select
                  size='small'
                  labelId='demo-simple-select-label'
                  id='demo-simple-select'
                  value={status}
                  label='Age'
                  onChange={handleChangeStatus}
                  defaultValue={'Pending'}
                >
                  <MenuItem value={10}>Pending</MenuItem>
                  <MenuItem value={20}>Completed</MenuItem>
                  <MenuItem value={30}>In Progress</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
            )} */}

            <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
          <IconButton
            size='small'
            onClick={() => handleOpenTransfer(params)}
            //  aria-label='Edit'
          >
            <Icon icon='charm:menu-kebab' />
          </IconButton>
        </Box>
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
  }

  // const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1
  const getSlNo = index => index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  // form

  const defaultValues = {
    lab_name: request?.lab_id,
    transferTo: '',
    reason: ''
  }

  const schema = yup.object().shape({
    lab_name: yup.string(),
    transferTo: yup.string().required(' is required'),
    reason: yup.string().required('  is required')
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
        handleSubmit(onSubmit)()
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
    const { lab_name, transferTo, reason } = {
      ...params
    }

    const payload = {
      // lab_name: request[0]?.lab_id,
      transferTo,
      reason
    }

    console.log('payload', payload)

    const res = await transferLab(payload).then(res => {
      if (res?.status) {
        setSubmitLoader(false)
        handleCloseTransfer()
      }
    })
    console.log('res', res)
    // if (id !== undefined && action === 'edit') {
    //   console.log('payload', payload)
    //   // await updateMedicine(payload, id)
    // } else {
    //   await addLabToList(payload)
    // }
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card sx={{ p: 5 }}>
            <IconButton sx={{ mr: 1 }} onClick={() => Router.back()}>
              <Icon icon='ep:back' fontSize={25} color={'#37BD69'} />
            </IconButton>

            {request?.map((item, index) => (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant='h6'>
                      Request -{' '}
                      <span
                        onClick={() => handleClickOpen(item)}
                        style={{ color: '#37BD69', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {item?.request_id}
                      </span>
                    </Typography>
                    <Typography> {Utility.formatDate(item?.created_at)}</Typography>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
                  <Stack direction='row' gap={3}>
                    <Typography>
                      No. of Tests : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item?.total_no_test}</span>
                    </Typography>
                    <Typography>
                      No. of Samples :{' '}
                      <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item?.total_no_sample}</span>
                    </Typography>
                  </Stack>

                  <Typography>
                    Request by - <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{item?.user_first_name}</span>
                  </Typography>
                </Box>
              </>
            ))}
          </Card>

          <Card sx={{ mt: 5 }}>
            <CardHeader title='Test Reports' />

            <DataGrid
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              getRowId={row => row?.sample_id}
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => {
                    setSearchValue(event.target.value)

                    return handleSearch(event.target.value)
                  }
                }
              }}
            />
            {/* allow user Only if user hand upload permissions */}
            {permissions?.perform_tests === true && permissions?.allow_full_access === true ? (
              <Box>
                <Box sx={{ p: 5, display: 'flex', justifyContent: 'flex-end' }}>
                  <LoadingButton variant='contained'>UPLOAD REPORT</LoadingButton>
                </Box>
                <Box sx={{ p: 5 }}>
                  <Typography variant='h6'>Reports</Typography>
                  <Typography>Images</Typography>
                  <Typography>Documents</Typography>

                  {/* <form onSubmit={handleUloadSubmit(onSubmit)}>
                  <FileUploaderSingle onImageUpload={onImageUpload} image={uploadedImage} />
                </form> */}
                </Box>
              </Box>
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
                  <Typography>
                    No. of Samples : <span style={{ fontWeight: 'bold' }}>{item?.sample_count}</span>
                  </Typography>
                </Box>
                <Typography>
                  Request By - <span style={{ fontWeight: 'bold' }}>{item?.user_first_name}</span>
                </Typography>
              </Box>

              <Box mt={2}>
                <TableContainer component={Paper} style={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F5F5F7' }}>
                        <TableCell>Test Type</TableCell>
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
                                  data?.status === 'pending'
                                    ? 'red'
                                    : data?.status === 'complete'
                                    ? '#2a9d0d'
                                    : '#00aea4'
                              }}
                            >
                              {data?.status}
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
                  Test name - <span style={{ color: '#37BD69', fontWeight: 'bold' }}>{selectedLab?.test_name}</span>
                </Typography>
                <Typography>
                  Request - <span style={{ fontSize: 15, fontWeight: 'bold' }}>{request?.request_id}</span>
                </Typography>
                <Typography>
                  Site- <span style={{ fontSize: 15, fontWeight: 'bold' }}>{request?.site_name}</span>
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
                          value={request[0]?.lab_id}
                          disabled
                          label='Transfer From*'
                          name='lab_name'
                          error={Boolean(errors.lab_name)}
                          onChange={onChange}
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
                      name='transferTo'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='transferTo'
                          value={value}
                          label='Transfer To*'
                          onChange={e => {
                            onChange(e.target.value)
                            // setLabType(e.target.value)
                          }}
                          error={Boolean(errors?.transferTo)}
                          labelId='transferTo'
                        >
                          {lab?.map(item => (
                            <MenuItem key={item?.lab_id} value={item?.lab_id}>
                              {item?.lab_name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors?.transferTo && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.transferTo?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} sm={6} sx={{ mt: 2, mb: 2 }}>
                  <FormControl fullWidth mt={2}>
                    <Controller
                      name='reason'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          label='Reason'
                          name='reason'
                          error={Boolean(errors.lab_name)}
                          onChange={onChange}
                          placeholder='Add Reason'
                        />
                      )}
                    />
                    {errors.reason && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.reason?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Box>
                  <LoadingButton
                    // loading={submitLoader}
                    onClick={handleSubmitData}
                    type='submit'
                    variant='contained'
                    sx={{ bgcolor: '#1F515B' }}
                  >
                    CONFIRM
                  </LoadingButton>
                </Box>
              </form>
            </Box>
          </Card>
        </Dialog>
      </>
    </>
  )
}

export default RequestDetails
