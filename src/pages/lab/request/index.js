import React, { useState, useEffect, useCallback, useContext } from 'react'

import { getNoOfLab, GetLabReportById, GetLabRequestTestStatusById } from 'src/lib/api/lab/getLabRequest'

import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'
// import { useTheme } from '@emotion/react'
import { useTheme } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge, Stack, CircularProgress, Breadcrumbs } from '@mui/material'
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

import moment from 'moment'

// import { callRefreshToken } from 'src/lib/api/auth'

const ListOfRequest = () => {
  const theme = useTheme()
  const router = useRouter()

  const [loader, setLoader] = useState(false)
  const [selectLoader, setSelectLoader] = useState(false)
  const [labSelected, setLabSelected] = useState()

  const authData = useContext(AuthContext)
  const [lab, setLab] = useState(authData?.userData?.modules?.lab_data?.lab)

  const [selectedLab, setSelectedLab] = useState(
    authData?.userData?.modules?.lab_data?.lab.length > 0 ? authData?.userData?.modules?.lab_data?.lab[0]?.lab_id : null
  )
  const [stats, setStats] = useState()

  const handleClickRequestId = params => {
    const id = params.row.lab_test_id
    router.push({
      pathname: `/lab/request/${id}`,
      query: {
        lab_id: params.row.lab_id,
        page: router.query?.page,
        pageSize: router.query?.pageSize,
        q: router.query.q
      }
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
      width: 300,
      field: 'lab_test_id',
      headerName: 'REQUEST ID',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', cursor: 'pointer', ml: 3 }}>
          {params.row.lab_test_id}
        </Typography>
      )
    },

    {
      width: 200,
      sortable: false,
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
      width: 150,
      field: 'created_at',
      sortable: false,
      headerName: 'Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {moment(params.row.created_at).format('DD MMM YYYY')}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'total_test',
      headerName: 'No. of Tests ',
      sortable: false,
      align: 'center',
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

    {
      width: 200,
      field: 'status',
      sortable: false,
      headerName: 'Status',
      renderCell: params => (
        <Stack direction='row' spacing={2} gap={2} sx={{ display: 'flex', alignItems: 'center' }}>
          {params.row.total_tests_pending > 0 && (
            <Box
              sx={{
                bgcolor: theme.palette.customColors.Tertiary,
                color: 'white',
                borderRadius: '50px',
                height: 20,
                minWidth: 20,
                paddingX: 1.4,
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
                bgcolor: theme.palette.customColors.moderateSecondary,
                color: 'white',
                borderRadius: '50px',
                height: 20,
                minWidth: 20,
                paddingX: 1.4,
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
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderRadius: '50px',
                height: 20,
                minWidth: 20,
                paddingX: 1.4,
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
      width: 200,
      field: 'Reports',
      headerName: 'Reports',

      // align: 'center',
      sortable: false,

      renderCell: params => (
        <>
          {params?.row?.total_attachments > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'center',
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                p: 2,
                borderRadius: '15px',
                width: 50
              }}
            >
              <img src='/images/attach_file.png' alt='default icon' style={{ width: 12 }} />
              <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '15px' }}>
                {params.row.total_attachments}
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
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({
    page: router?.query?.page ? parseInt(router?.query?.page) : 0,
    pageSize: router?.query?.pageSize ? parseInt(router?.query?.pageSize) : 10
  })
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column, lab_id }) => {
      setSearchValue(q)
      try {
        await fetchData({
          sort,
          q,
          column,
          lab_id,
          page: paginationModel.page + 1,
          pageSize: paginationModel.pageSize
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // useEffect(() => {
  // const refreshToken = async () => {
  //   const res = await callRefreshToken()
  //   if (res?.success) {
  //     setLab(res?.modules?.lab_data?.lab)
  //   }
  // }
  // refreshToken()
  // setSelectedLab(authData?.userData?.modules?.lab_data?.lab[0]?.lab_id)
  // }, [])

  const GetLabRequestStatus = async params => {
    try {
      const res = await GetLabRequestTestStatusById({ params })
      setStats(res?.data?.stats)
    } catch (error) {
      console.log('error', error)
    }
  }

  const oldstoredData = async () => {
    const Data = await readAsync('selectedLAB')

    setLabSelected(Data)
    if (Data) {
      const labList = authData?.userData?.modules?.lab_data?.lab
      const firstLab = authData?.userData?.modules?.lab_data?.lab[0]?.lab_id
      const labExists = labList.some(lab => lab.lab_id === Data)

      if (labExists) {
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
        handleLabChange(firstLab)
      }
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
      const params2 = { lab_id: data }
      GetLabRequestStatus(params2)
      fetchData(params)
      setSelectLoader(false)
    }
  }

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  // const fetchData = async params => {
  //   try {
  //     setLoading(true)
  //     const response = await GetLabReportById({ params })
  //     if (response?.success) {
  //       setTotal(parseInt(response?.data?.total_count))
  //       setRows(loadServerRows(paginationModel.page, response?.data?.result))
  //     }

  //     setLoading(false)
  //   } catch (error) {
  //     console.error(error)
  //     setLoading(false)
  //   }
  // }

  const fetchData = useCallback(async params => {
    try {
      setLoading(true)
      const response = await GetLabReportById({ params })
      if (response?.success) {
        setTotal(parseInt(response?.data?.total_count))
        setRows(loadServerRows(paginationModel.page, response?.data?.result))
      }

      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }, [])

  const handleLabChange = async value => {
    // setSelectedLab(event.target.value)
    write('selectedLAB', value)
    setPaginationModel({ page: 0, pageSize: 10 })
    setLabSelected(value)
    const storedLabData = await readAsync('selectedLAB')
    if (storedLabData) {
      setSelectedLab(value)

      // remove('selectedLAB')
    } else {
      setSelectedLab(value)
    }
    // updateUrlParams({
    //   q: searchValue,
    //   page: paginationModel.page + 1,
    //   pageSize: paginationModel.pageSize
    // })

    const params = {
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      lab_id: value
    }
    await fetchData(params)
    const params2 = { lab_id: value }
    GetLabRequestStatus(params2)
  }

  const handlePaginationModelChange = async data => {
    // if (paginationModel?.page == 0) return
    const params = {
      sort,
      q: searchValue,
      column: sortColumn,
      page: data.page + 1,
      limit: data.pageSize,
      lab_id: selectedLab
    }
    updateUrlParams({
      q: searchValue,
      page: data.page,
      pageSize: data.pageSize
    })

    setPaginationModel(data)

    await fetchData(params)
  }

  // useEffect(() => {
  //   handlePaginationModelChange()
  // }, [paginationModel])

  const handleSearch = async value => {
    setSearchValue(value)
    updateUrlParams({
      page: 0,
      pageSize: 10,
      q: value
    })
    setPaginationModel({ page: 0, pageSize: 10 })
    await searchTableData({ sort, q: value, column: sortColumn, lab_id: selectedLab })
  }

  // const getSlNo = (index, labTestId) => {
  //   if (labTestId !== null) {
  //     return labTestId + '_' + index
  //   }

  //   return 'no_lab_test_id_' + index
  // }

  // const indexedRows = rows?.map((row, index) => ({
  //   ...row,
  //   id: getSlNo(index, row.lab_test_id),
  //   sl_no: index + 1
  // }))

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  useEffect(() => {
    oldstoredData()
  }, [])

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            {/* <Typography sx={{ cursor: 'pointer' }} color='inherit'>
      Lab
    </Typography> */}
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Labs
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
              Requests list
            </Typography>
          </Breadcrumbs>
          <Card key={selectedLab}>
            <CardHeader title={'Requests lists'} />

            <Stack
              direction={{ md: 'row', sm: 'row', sx: 'column' }}
              sx={{ display: 'flex', justifyContent: 'space-between', mr: 5, alignItems: 'center' }}
            >
              <Box sx={{ minWidth: 250, maxWidth: 300, ml: 5 }}>
                {selectLoader ? (
                  <CircularProgress color='success' />
                ) : (
                  <FormControl fullWidth size='small'>
                    <InputLabel id='lab-select-label'>Select Lab</InputLabel>
                    <Select
                      labelId='lab-select-label'
                      id='lab-select'
                      value={selectedLab}
                      label='Select Lab'
                      onChange={event => handleLabChange(event.target.value)}
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
                bgcolor: theme.palette.customColors.cardHeaderBg,
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
                  Total Requests -{' '}
                  <span style={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>{stats?.total_requests}</span>
                </Typography>

                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: theme.palette.customColors.customDropdownColor,
                    borderRadius: '15px',
                    px: 3,
                    py: 1
                  }}
                >
                  <Typography sx={{ color: theme.palette.customColors.customDropdownColor, fontSize: '12px' }}>
                    Pending Tests - {stats?.total_tests_pending}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: theme.palette.customColors.moderateSecondary,
                    borderRadius: '15px',
                    px: 3,
                    py: 1
                  }}
                >
                  <Typography sx={{ color: theme.palette.customColors.moderateSecondary, fontSize: '12px' }}>
                    Tests in Progress - {stats?.total_tests_inprogress}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: theme.palette.primary.main,
                    borderRadius: '15px',
                    px: 3,
                    py: 1
                  }}
                >
                  <Typography sx={{ color: theme.palette.primary.main, fontSize: '12px' }}>
                    Completed Tests - {stats?.total_tests_completed}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            {/* Status */}

            <Stack
              direction={{ md: 'row', sm: 'row', sx: 'column' }}
              spacing={4}
              sx={{ alignItems: 'center', justifyContent: 'flex-end', m: 5 }}
            >
              <>
                <Typography sx={{ fontWeight: 'bold' }}>Status : </Typography>
              </>
              <Box gap={1} sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ic:baseline-circle' fontSize={15} color={theme.palette.customColors.customDropdownColor} />
                <Typography variant='subtitle1'>Pending</Typography>
              </Box>
              <Box gap={1} sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ic:baseline-circle' fontSize={15} color={theme.palette.customColors.moderateSecondary} />
                <Typography variant='subtitle1'>In Progress</Typography>
              </Box>
              <Box gap={1} sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ic:baseline-circle' fontSize={15} color={theme.palette.primary.main} />
                <Typography variant='subtitle1'>Completed</Typography>
              </Box>
            </Stack>

            <DataGrid
              sx={{
                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              disableColumnMenu
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              // onPaginationModelChange={setPaginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              loading={loading}
              onCellClick={handleClickRequestId}
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
