/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react'

import { getNoOfLab, GetLabReportById } from 'src/lib/api/lab/getLabRequest'
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

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge, Stack } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import Utility from 'src/utility'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'

const ListOfRequest = () => {
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [storedData, setStoredData] = useState()
  const [lab, setLab] = React.useState([])
  const [selectedLab, setSelectedLab] = useState(70)
  const [count, setCount] = useState()
  console.log('count', count)
  console.log('selectedLab', selectedLab)
  console.log('storedData', storedData)
  console.log('lab', lab)

  useEffect(() => {
    const Data = window.localStorage.getItem('userDetails')
    setStoredData(JSON.parse(Data))
  }, [])

  const handleClickRequestId = params => {
    const id = params.row.lab_test_id
    Router.push(`/lab/${id}`)
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
          sx={{ color: 'text.primary', cursor: 'pointer' }}
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.total_test}>{params.row.total_test}</span>
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'sample_count',
      headerName: 'No. Of Samples',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.sample_count}>{params.row.sample_count}</span>
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Stack direction='row' spacing={2} gap={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              bgcolor: 'red',
              color: 'white',
              borderRadius: '50px',
              height: 25,
              width: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {params.row.total_pending}
          </Box>

          <Box
            sx={{
              bgcolor: '#00AEA4',
              color: 'white',
              borderRadius: '50px',
              height: 25,
              width: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {params.row.total_inprogress}
          </Box>
          <Box
            sx={{
              bgcolor: '#2A9D0D',
              color: 'white',
              borderRadius: '50px',
              height: 25,
              width: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {params.row.total_completed}
          </Box>
        </Stack>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',

    //   renderCell: params => (
    //     <Box>
    //       <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
    //         <Icon icon='mdi:pencil-outline' />
    //       </IconButton>
    //       {/* <IconButton
    //           size='small'
    //           onClick={() => {
    //             setConfigureMedId(params.row.id)
    //             showDialog()
    //           }}
    //         >
    //           <Icon icon='grommet-icons:configure' />
    //         </IconButton> */}
    //       {/* <IconButton size='small'>
    //           <Icon icon='mdi:eye-outline' />
    //         </IconButton>

    //         <IconButton size='small'>
    //           <Icon icon='mdi:file' />
    //         </IconButton> */}
    //     </Box>
    //   )
    // }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  console.log('total', total)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  console.log('rows', rows)
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 })
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    getNoOfLab().then(res => {
      setLab(res?.data?.result)
      console.log('res?.data', res?.data)
      // setRows(loadServerRows(paginationModel.page, res?.data?.result))
    })
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const params = {
          lab_id: selectedLab
          // sort,
          // q,
          // column,
          // page: paginationModel.page + 1,
          // limit: paginationModel.pageSize
        }

        const response = await GetLabReportById({ params }).then(res => {
          console.log('restt', res)
          // setTotal(parseInt(res?.data?.total_count))
          console.log('res?.dataaaa', res?.data)
          setCount(res?.data?.count)
          // setRows(loadServerRows(paginationModel.page, res?.data?.result))
          setRows(res?.data?.result)
        })
        console.log('API Response:', response)
        // Handle the response as needed, e.g., update state or perform other actions

        setLoading(false)
      } catch (error) {
        console.error(error)
        setLoading(false)
      }
    }

    fetchData()
  }, [paginationModel.page, selectedLab])

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

  const handleLabChange = event => {
    setSelectedLab(event.target.value)
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.lab_test_id}_${index}`,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader title='Lab Requests' />

            <Stack
              direction={{ md: 'row', sm: 'row', sx: 'column' }}
              sx={{ display: 'flex', justifyContent: 'space-between', mr: 5, alignItems: 'center' }}
            >
              <Box sx={{ minWidth: 250, maxWidth: 300, ml: 5 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='lab-select-label'>Choose Lab</InputLabel>
                  <Select
                    labelId='lab-select-label'
                    id='lab-select'
                    value={selectedLab}
                    label='Choose Lab'
                    onChange={handleLabChange}
                    // defaultValue={lab.length > 0 ? lab[1].lab_id : ''}
                  >
                    {lab?.map((item, index) => (
                      <MenuItem key={item?.lab_id} value={item?.lab_id}>
                        {item?.lab_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Stack
                direction={{ md: 'row', sm: 'row', sx: 'column' }}
                spacing={4}
                gap={2}
                sx={{ alignItems: 'center' }}
              >
                <>
                  <Typography sx={{ fontWeight: 'bold' }}>Status : </Typography>
                </>
                <Box gap={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon icon='ic:baseline-circle' fontSize={15} color={'red'} />
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
            </Stack>

            <Box
              sx={{
                bgcolor: '#F2F2F2',
                p: 2,
                mt: 3,
                mb: 1,
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
                  Total Requests - <span style={{ color: '#37BD69', fontWeight: 'bold' }}>123</span>
                </Typography>

                <Box sx={{ border: '1px solid', borderColor: 'red', borderRadius: '10px', p: 1 }}>
                  <Typography sx={{ color: 'red', fontSize: '12px', fontWeight: 'bold' }}>
                    Pending Test - 123
                  </Typography>
                </Box>
                <Box sx={{ border: '1px solid', borderColor: '#00AEA4', borderRadius: '10px', p: 1 }}>
                  <Typography sx={{ color: '#00AEA4', fontSize: '12px', fontWeight: 'bold' }}>
                    Test in Progress - 123
                  </Typography>
                </Box>
                <Box sx={{ border: '1px solid', borderColor: '#2A9D0D', borderRadius: '10px', p: 1 }}>
                  <Typography sx={{ color: '#2A9D0D', fontSize: '12px', fontWeight: 'bold' }}>
                    Completed Test - 123
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <DataGrid
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
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
          </Card>
        </>
      )}
    </>
  )
}

export default ListOfRequest
