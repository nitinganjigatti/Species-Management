/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react'

import { getLabList } from 'src/lib/api/addLab'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

// import { getMedicineConfig } from 'src/lib/api/getMedicineConfig'
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
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import { Label } from 'recharts'

const ListOfRequest = () => {
  // const [medicineList, setMedicineList] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [storedData, setStoredData] = useState()
  const [lab, setLab] = React.useState('')
  console.log('storedData', storedData)

  useEffect(() => {
    const Data = window.localStorage.getItem('userDetails')
    setStoredData(JSON.parse(Data))
  }, [])

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  // const handleEdit = async id => {
  //   Router.push({
  //     pathname: '/pharmacy/settings/labs/lab-list',
  //     query: { id: id, action: 'edit' }
  //   })
  // }

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
      field: 'lab_name',
      headerName: 'REQUEST ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.lab_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'site',
      headerName: 'Site',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.type}>{params.row.type}</span>
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
      field: 'date',
      headerName: 'No. of Tests ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* <span alt={params.row.address}>{params.row.address}</span> */}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'sample',
      headerName: 'No. Of Samples',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.status) === 0 ? 'Inactive' : 'Active'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* {parseInt(params.row.status) === 0 ? 'Inactive' : 'Active'} */}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box>
          <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          {/* <IconButton
              size='small'
              onClick={() => {
                setConfigureMedId(params.row.id)
                showDialog()
              }}
            >
              <Icon icon='grommet-icons:configure' />
            </IconButton> */}
          {/* <IconButton size='small'>
              <Icon icon='mdi:eye-outline' />
            </IconButton>

            <IconButton size='small'>
              <Icon icon='mdi:file' />
            </IconButton> */}
        </Box>
      )
    }
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

  // const fetchTableData = useCallback(
  //   async ({ sort, q, column }) => {
  //     try {
  //       setLoading(true)

  //       const params = {
  //         sort,
  //         q,
  //         column,
  //         page: paginationModel.page + 1,
  //         limit: paginationModel.pageSize
  //       }

  //       await getLabList({ params: params }).then(res => {
  //         setTotal(parseInt(res?.data?.total_count))
  //         console.log('res?.data', res?.data)
  //         setRows(loadServerRows(paginationModel.page, res?.data?.result))
  //       })
  //       setLoading(false)
  //     } catch (e) {
  //       console.log(e)
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )

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

  // useEffect(() => {
  //   fetchTableData({ sort, q: searchValue, column: sortColumn })
  // }, [fetchTableData])

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

  // const headerAction = (
  //   <>
  //     {storedData.roles.settings.add_lab === true ? (
  //       <div>
  //         <Button
  //           size='big'
  //           variant='contained'
  //           onClick={() => {
  //             Router.push('/lab/add-Lab')
  //           }}
  //         >
  //           Add Lab
  //         </Button>
  //       </div>
  //     ) : null}
  //   </>
  // )

  const handleLabChange = () => {}

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <CommonDialogBox
            title={'Configure Medicine'}
            dialogBoxStatus={show}
            formComponent={<MedicineConfigure configureMedId={configureMedId} />}
            close={closeDialog}
            show={showDialog}
          />
          <Card>
            <CardHeader
              title='Lab Requests'
              //  action={headerAction}
            />

            <Stack
              direction={{ md: 'row', sm: 'row', sx: 'column' }}
              sx={{ display: 'flex', justifyContent: 'space-between', mr: 5, alignItems: 'center' }}
            >
              <Box sx={{ minWidth: 250, maxWidth: 300, ml: 5 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='demo-simple-select-label'>Choose Lab</InputLabel>
                  <Select
                    labelId='demo-simple-select-label'
                    id='demo-simple-select'
                    value={lab}
                    label='Choose Lab'
                    onChange={handleLabChange}
                  >
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem>
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
