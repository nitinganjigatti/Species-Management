import React, { useState, useEffect, useCallback, forwardRef } from 'react'

import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
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
import { Box, TextField, Breadcrumbs, Tooltip } from '@mui/material'
import Router from 'next/router'
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { usePharmacyContext } from 'src/context/PharmacyContext'

import Error404 from 'src/pages/404'
import { LoadingButton } from '@mui/lab'
import SingleDatePicker from 'src/components/SingleDatePicker'
import MonthWisedispatchFilter from './monthwiseDispatchFilterDrawer'
import MedicineNamedoctorsList from './doctorsList'

const fruitList = [
  { id: 1, name: 'Banana' },
  { id: 2, name: 'Apple' },
  { id: 3, name: 'Orange' },
  { id: 4, name: 'Mango' },
  { id: 5, name: 'Pineapple' },
  { id: 6, name: 'Grapes' },
  { id: 7, name: 'Watermelon' },
  { id: 8, name: 'Strawberry' },
  { id: 9, name: 'Peach' },
  { id: 10, name: 'Cherry' }
]

const MonthWiseDispatch = () => {
  const [loader, setLoader] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [openDoctorListDrawer, setOpenDoctorListDrawer] = useState(false)
  const [date, setDate] = useState(new Date())
  const [selectedFruits, setSelectedFruits] = useState([])
  const { selectedPharmacy } = usePharmacyContext()

  const handlecheckcell = val => {
    console.log(val, 'val')
    if (val.field === 'name') {
      return
    } else {
      setOpenDoctorListDrawer(true)
      alert(val.row.name)
    }
  }

  const columns = [
    {
      //flex: 0.3,
      width: 200,
      field: 'name',
      headerName: 'MEDICINE NAMES',
      renderCell: params => (
        <Tooltip title={params.row.name}>
          <Typography
            variant='body2'
            sx={{
              color: 'text.primary',
              whiteSpace: 'nowrap',
              width: '160px',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {params.row.name}
          </Typography>
        </Tooltip>
      )
    },

    {
      // // flex: 0.2,
      width: 100,
      field: 'jan',
      headerName: 'January ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          999
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'feb',
      headerName: 'February ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          888
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'mar',
      headerName: 'March ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          9100
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'apr',
      headerName: 'April ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          8888
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'may',
      headerName: 'May ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          398
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'jun',
      headerName: 'June ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          7100
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'jul',
      headerName: 'July ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          898
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'aug',
      headerName: 'August ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          1009
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'sep',
      headerName: 'September ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          989
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'oct',
      headerName: 'October ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          3838
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'nov',
      headerName: 'November ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          9789
        </Typography>
      )
    },
    {
      // flex: 0.2,
      width: 100,
      field: 'dec',
      headerName: 'December ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          898
        </Typography>
      )
    }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  function loadServerRows(currentPage, data) {
    return data
  }

  // This function will handle the selected fruits from the child component
  const handleFruitSelection = fruitId => {
    setSelectedFruits(prevSelectedFruits => {
      // If the fruit is already selected, remove it; otherwise, add it
      if (prevSelectedFruits.includes(fruitId)) {
        return prevSelectedFruits.filter(id => id !== fruitId)
      } else {
        return [...prevSelectedFruits, fruitId]
      }
    })
  }

  const handleSelectAllChange = event => {
    if (event.target.checked) {
      // If "Select All" is checked, select all fruits
      setSelectedFruits(fruitList.map(fruit => fruit.id))
    } else {
      // If unchecked, clear all selections
      setSelectedFruits([])
    }
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, status }) => {
      let params = {}
      const activeStatus = status ?? statusFilter
      try {
        setLoading(true)
        if (activeStatus === 'all') {
          params = {
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize
          }
        } else {
          params = {
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            active: activeStatus
          }
        }

        // Append selected fruit ids to params if any fruits are selected
        if (selectedFruits.length > 0) {
          selectedFruits.forEach((fruitId, index) => {
            params[`fruitid:${index + 1}`] = fruitId
          })
        }

        await getMedicineList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
          } else {
            setTotal(parseInt(res?.data?.total_count))
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel, selectedFruits]
  )

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column, status: statusFilter })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: statusFilter })
  }, [fetchTableData])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn, status: statusFilter })
  }

  const handleStatusFilterChange = newFilter => {
    setStatusFilter(newFilter)
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: newFilter })
  }

  const headerAction = (
    <div>
      <LoadingButton
        // disabled={disabled}
        // loading={loader}
        // onClick={action ? action : null}
        size='medium'
        variant='contained'
        endIcon={<Icon icon='material-symbols:download' />}
      >
        Download Report
      </LoadingButton>
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        {...props}
        sx={{ width: '100%' }}
        InputProps={{
          autoComplete: 'off'
        }}
      />
    )
  })

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <Box container spacing={6}>
                <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                  <Typography color='inherit'>Pharmacy Dashboard</Typography>
                  <Typography
                    sx={{ cursor: 'pointer' }}
                    color='text.primary'
                    onClick={() => Router.push('/pharmacy/dashboard')}
                  >
                    Month wise dispatch report
                  </Typography>
                  {/* <Typography color='text.primary'>Diet Details</Typography> */}
                </Breadcrumbs>
              </Box>
              <Card>
                <CardHeader title='Month wise dispatch' action={headerAction} />
                <Grid container sx={{ display: 'flex', pr: 5, pt: 2 }} className=''>
                  <Grid item xs={12} sm={2} md={2} sx={{ ml: 4, mr: 4 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel id='demo-simple-select-label'>Select Days</InputLabel>
                      <Select
                        size='small'
                        value={statusFilter}
                        label='Select Days'
                        onChange={e => {
                          handleStatusFilterChange(e.target.value)
                        }}
                      >
                        <MenuItem value='all'>Daily</MenuItem>
                        <MenuItem value='weekly'>Weekly</MenuItem>
                        <MenuItem value='monthly'>Monthly </MenuItem>
                        <MenuItem value='yearly'>Yearly </MenuItem>
                        <MenuItem value='custom'>custom Range </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {statusFilter === 'custom' ? (
                    <>
                      <span style={{}}>
                        <SingleDatePicker
                          fullWidth
                          className=''
                          width={'100%'}
                          date={date}
                          value={date}
                          name={'From Date*'}
                          label='From Date*'
                          placeholderText={'From Date*'}
                          size='small'
                          onChangeHandler={date => {
                            setDate(date)
                          }}
                          customInput={<CustomInput label='From Date*' auto />}
                        />
                      </span>
                      <span style={{ paddingLeft: '15px' }}>
                        <SingleDatePicker
                          fullWidth
                          className=''
                          width={'100%'}
                          date={date}
                          value={date}
                          name={'To Date*'}
                          label='To Date*'
                          placeholderText={'To Date*'}
                          size='small'
                          onChangeHandler={date => {
                            setDate(date)
                          }}
                          customInput={<CustomInput label='To Date*' auto />}
                        />
                      </span>
                    </>
                  ) : (
                    ''
                  )}
                  <Grid item xs={12} sm={2} md={2} sx={{ ml: 4, mr: 4 }}>
                    <LoadingButton
                      // disabled={disabled}
                      // loading={loader}
                      // onClick={action ? action : null}
                      size='medium'
                      variant='outlined'
                      startIcon={<Icon icon='bi:filter' />}
                      onClick={() => setOpenFilterDrawer(true)}
                    >
                      {selectedFruits.length <= 0 ? 'Filter' : selectedFruits.length}
                    </LoadingButton>
                  </Grid>
                </Grid>
                <DataGrid
                  sx={{ cursor: 'pointer' }}
                  columnVisibilityModel={{
                    id: false
                  }}
                  className=''
                  autoHeight
                  pagination
                  hideFooterSelectedRowCount
                  disableColumnSelector={true}
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
                  disableColumnMenu
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
                  //onRowClick={handleEdit}
                  onCellClick={handlecheckcell}
                />
              </Card>
              {openFilterDrawer && (
                <MonthWisedispatchFilter
                  setOpenFilterDrawer={setOpenFilterDrawer}
                  openFilterDrawer={openFilterDrawer}
                  handleFruitSelection={handleFruitSelection}
                  selectedFruits={selectedFruits}
                  handleSelectAllChange={handleSelectAllChange}
                  fruitList={fruitList}
                />
              )}
              {openDoctorListDrawer && (
                <MedicineNamedoctorsList
                  openDoctorListDrawer={openDoctorListDrawer}
                  setOpenDoctorListDrawer={setOpenDoctorListDrawer}
                />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default MonthWiseDispatch
