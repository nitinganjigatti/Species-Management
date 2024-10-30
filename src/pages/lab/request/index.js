/* eslint-disable padding-line-between-statements */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback, useContext } from 'react'

import { getNoOfLab, GetLabReportById, GetLabRequestTestStatusById } from 'src/lib/api/lab/getLabRequest'
// import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'
import { useTheme } from '@emotion/react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge, Stack, CircularProgress, Grid, TextField } from '@mui/material'
import IconButton from '@mui/material/IconButton'
// import Router from 'next/router'
import Utility from 'src/utility'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import { useRouter } from 'next/router'
import { AuthContext } from 'src/context/AuthContext'
import { readAsync, write, remove } from 'src/lib/windows/utils'
import { jsx } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const ListOfRequest = () => {
  const theme = useTheme()
  const router = useRouter()

  const [loader, setLoader] = useState(false)
  const [selectLoader, setSelectLoader] = useState(false)
  const [labSelected, setLabSelected] = useState()
  console.log('labSelected', labSelected)
  const [lab, setLab] = React.useState([])
  const [selectedLab, setSelectedLab] = useState()

  const [storedData, setStoredData] = useState()
  const authData = useContext(AuthContext)
  const [stats, setStats] = useState()

  useEffect(() => {
    const Data = window.localStorage.getItem('userDetails')

    setStoredData(JSON.parse(Data))
  }, [])

  const handleClickRequestId = params => {
    const id = params.row.lab_test_id
    write('selectedLAB', labSelected)
    router.push({
      pathname: `/lab/${id}`,
      query: { lab_id: labSelected }
    })
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
      flex: 0.3,
      minWidth: 20,
      field: 'lab_test_id',
      headerName: 'REQUEST ID',
      renderCell: params => (
        <Typography
          variant='body2'
          onClick={() => handleClickRequestId(params)}
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter'
          }}
        >
          {params.row.lab_test_id}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'site_name',
      headerName: 'Site',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          <span alt={params.row.site_name}>{params.row.site_name}</span>
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 20,
      field: 'created_at',
      headerName: 'Date',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatDate(params.row.created_at)}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'total_test',
      headerName: 'No. of Tests ',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          <span alt={params.row.total_test}>{params.row.total_lab_tests}</span>
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'sample_count',
    //   headerName: 'No. Of Samples',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       <span alt={params.row.sample_count}>{params.row.sample_count}</span>
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Stack direction='row' spacing={2} gap={2} sx={{ display: 'flex', alignItems: 'center' }}>
          {params.row.total_tests_pending > 0 && (
            <Box
              sx={{
                bgcolor: '#E93353',
                color: 'white',
                borderRadius: '50px',
                height: 20,
                width: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {params.row.total_tests_pending}
            </Box>
          )}

          {params.row.total_tests_inprogress > 0 && (
            <Box
              sx={{
                bgcolor: '#00AEA4',
                color: 'white',
                borderRadius: '50px',
                height: 20,
                width: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {params.row.total_tests_inprogress}
            </Box>
          )}

          {params.row.total_tests_completed > 0 && (
            <Box
              sx={{
                bgcolor: '#2A9D0D',
                color: 'white',
                borderRadius: '50px',
                height: 20,
                width: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {params.row.total_tests_completed}
            </Box>
          )}
        </Stack>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      // field: 'Action',
      // headerName: 'Action',

      renderCell: params => (
        <>
          {params?.row?.total_attachments > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
              <Icon icon='et:attachments' fontSize={15} />
              <Typography variant='body2' sx={{ color: 'text.primary', ml: 1 }}>
                <span alt={params.row.total_attachments}>{params.row.total_attachments}</span>
              </Typography>
            </Box>
          )}
        </>
      )
    }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState()

  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column, lab_id }) => {
      setSearchValue(q)
      try {
        await fetchData({ sort, q, column, lab_id })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    const options = authData?.userData?.modules?.lab_data?.lab
    setLab(options)
  }, [])

  const GetLabRequestStatus = async params => {
    console.log('params2', params)
    try {
      const res = await GetLabRequestTestStatusById({ params })
      setStats(res?.data?.stats)
      console.log('res', res?.data?.stats)
    } catch (error) {
      console.log('error', error)
    }
  }
  const oldstoredData = async () => {
    const Data = await readAsync('selectedLAB')

    setLabSelected(Data)
    if (Data) {
      setSelectedLab(Data)

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        lab_id: Data
      }
      const params2 = { lab_id: Data }
      GetLabRequestStatus(params2)
      fetchData(params)
      setSelectLoader(false)
    } else {
      const data = authData?.userData?.modules?.lab_data?.lab[0]?.lab_id

      setSelectedLab(data)
      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        lab_id: data
      }
      const params2 = { lab_id: Data }
      GetLabRequestStatus(params2)
      fetchData(params)
      setSelectLoader(false)
    }
  }

  useEffect(() => {
    oldstoredData()
    // setSelectLoader(true)
  }, [])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const fetchData = async params => {
    try {
      setLoading(true)

      const response = await GetLabReportById({ params })
      setTotal(parseInt(response?.data?.total_count))
      setRows(loadServerRows(paginationModel.page, response?.data?.result))
      setStatus(response?.data?.stats)

      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const handleLabChange = async event => {
    // setSelectedLab(event.target.value)
    setLabSelected(event.target.value)
    const storedLabData = await readAsync('selectedLAB')
    if (storedLabData) {
      setSelectedLab(event.target.value)
      remove('selectedLAB')
    } else {
      setSelectedLab(event.target.value)
    }

    const params = {
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      lab_id: event.target.value
    }
    await fetchData(params)
    const params2 = { lab_id: event.target.value }
    GetLabRequestStatus(params2)
  }

  const handlePaginationModelChange = async newModel => {
    setPaginationModel(newModel)

    const params = {
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      lab_id: selectedLab
    }
    await fetchData(params)
  }
  const handleSearch = async value => {
    setSearchValue(value)
    console.log('value', value)

    await searchTableData({ sort, q: value, column: sortColumn, lab_id: selectedLab })
  }

  const getSlNo = (index, labTestId) => {
    if (labTestId !== null) {
      return labTestId + '_' + index
    }

    return 'no_lab_test_id_' + index
  }

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index, row.lab_test_id),
    sl_no: index + 1
  }))

  // const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  // const indexedRows = rows?.map((row, index) => ({
  //   ...row,
  //   sl_no: getSlNo(index)
  // }))

  // useEffect(() => {
  //   if (labSelected) {
  //     const params = { lab_id: labSelected }
  //     const res = GetLabRequestTestStatusById({ params })
  //     console.log('res', res)
  //   }
  // }, [])

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>Lab Requests</Typography>
    </>
  )

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card key={selectedLab}>
            <CardHeader title={title} />

            <Stack
              direction={{ md: 'row', sm: 'row', sx: 'column' }}
              sx={{ display: 'flex', justifyContent: 'space-between', mr: 5, alignItems: 'center' }}
            >
              <Box sx={{ minWidth: 250, maxWidth: 300, ml: 5 }}>
                {selectLoader ? (
                  <CircularProgress color='success' />
                ) : (
                  <FormControl fullWidth size='small'>
                    <InputLabel id='lab-select-label'>All Labs</InputLabel>
                    <Select
                      labelId='lab-select-label'
                      id='lab-select'
                      value={selectedLab}
                      label='All Labs'
                      onChange={handleLabChange}
                      sx={{ fontWeight: 'bold', borderRadius: '5px' }}
                    >
                      {lab?.map((item, index) => (
                        <MenuItem key={item?.lab_id} value={item?.lab_id}>
                          {item?.lab_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Stack>

            <Box
              sx={{
                bgcolor: '#F2F2F2',
                p: 2,
                mt: 3,

                ml: 5,
                mr: 5,
                borderRadius: '5px'
              }}
            >
              <Stack
                direction={{ md: 'row', sm: 'row', sx: 'column' }}
                spacing={2}
                gap={2}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Typography>
                  Total Requests - <span style={{ color: '#37BD69', fontWeight: 'bold' }}>{stats?.total_requests}</span>
                </Typography>

                <Box sx={{ border: '1px solid', borderColor: '#E93353', borderRadius: '15px', px: 3, py: 1 }}>
                  <Typography sx={{ color: '#E93353', fontSize: '12px' }}>
                    Pending Test - {stats?.total_tests_pending}
                  </Typography>
                </Box>
                <Box sx={{ border: '1px solid', borderColor: '#00AEA4', borderRadius: '15px', px: 3, py: 1 }}>
                  <Typography sx={{ color: '#00AEA4', fontSize: '12px' }}>
                    Test in Progress - {stats?.total_tests_inprogress}
                  </Typography>
                </Box>
                <Box sx={{ border: '1px solid', borderColor: '#2A9D0D', borderRadius: '15px', px: 3, py: 1 }}>
                  <Typography sx={{ color: '#2A9D0D', fontSize: '12px' }}>
                    Completed Test - {stats?.total_tests_completed}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            {/* Status */}
            <Box>
              <Stack
                direction={{ md: 'row', sm: 'row', sx: 'column' }}
                spacing={4}
                sx={{ alignItems: 'center', justifyContent: 'flex-end', m: 5 }}
              >
                <>
                  <Typography sx={{ fontWeight: 'bold' }}>Status : </Typography>
                </>
                <Box gap={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon icon='ic:baseline-circle' fontSize={15} color={'#E93353'} />
                  <Typography variant='subtitle1'>Pending</Typography>
                </Box>
                <Box gap={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon icon='ic:baseline-circle' fontSize={15} color={'#00AEA4'} />
                  <Typography variant='subtitle1'>In Progress</Typography>
                </Box>
                <Box gap={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon icon='ic:baseline-circle' fontSize={15} color={'#2A9D0D'} />
                  <Typography variant='subtitle1'>Completed</Typography>
                </Box>
              </Stack>
            </Box>

            <Box display='flex' justifyContent='space-between' alignItems='center'>
              {/* Left Box (Search Field) */}
              <Grid item xs={8}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #C3CEC7',
                    borderRadius: '8px',
                    padding: '0 8px',
                    ml: 5,
                    height: '40px',
                    width: '250px' // Set a fixed width for all status
                  }}
                >
                  <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                  <TextField
                    variant='outlined'
                    placeholder='Search...'
                    onChange={e => handleSearch(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        padding: '0',
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Box>
            {/* <Grid
              sx={{
                mx: 4
              }}
            >
              <CommonTable
                onRowClick={''}
                indexedRows={indexedRows}
                total={total}
                columns={columns}
                paginationModel={paginationModel}
                handleSortModel={handleSortModel}
                setPaginationModel={setPaginationModel}
                loading={loading}
                searchValue={searchValue}
              />
            </Grid> */}

            <DataGrid
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              onPaginationModelChange={handlePaginationModelChange}
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
                    handleSearch(event.target.value)
                  }
                }
              }}
            />
          </Card>
        </>
      )}
    </>
  )
}

export default ListOfRequest
