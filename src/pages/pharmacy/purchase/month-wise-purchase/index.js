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
import MonthWisepurchaseFilter from './monthwisePurchaseFilterDrawer'
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
  { id: 10, name: 'Cherry' },
  { id: 11, name: 'Cherry1' },
  { id: 12, name: 'Cherry2' },
  { id: 13, name: 'Cherry3' },
  { id: 14, name: 'Cherry4' }
]

const MonthWisePurchase = () => {
  const [loader, setLoader] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [openDoctorListDrawer, setOpenDoctorListDrawer] = useState(false)
  const [date, setDate] = useState(new Date())
  const [selectedFruits, setSelectedFruits] = useState([])
  const [filtersApplied, setFiltersApplied] = useState(false)
  const [filterlength, setFilterLength] = useState('')
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
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
      width: 200,
      field: 'name',
      headerName: 'MEDICINE NAMES',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            Medicine
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            Names
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            Purchase Value (in lac)
          </Typography>
        </Box>
      ),
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
      width: 100,
      field: 'jan',
      headerName: 'January ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            January
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          999
        </Typography>
      )
    },
    {
      width: 100,
      field: 'feb',
      headerName: 'February ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            February
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          888
        </Typography>
      )
    },
    {
      width: 100,
      field: 'mar',
      headerName: 'March ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            March
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          9100
        </Typography>
      )
    },
    {
      width: 100,
      field: 'apr',
      headerName: 'April ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            April
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          8888
        </Typography>
      )
    },
    {
      width: 100,
      field: 'may',
      headerName: 'May ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            May
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          398
        </Typography>
      )
    },
    {
      width: 100,
      field: 'jun',
      headerName: 'June ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            June
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          7100
        </Typography>
      )
    },
    {
      width: 100,
      field: 'jul',
      headerName: 'July ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            July
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          898
        </Typography>
      )
    },
    {
      width: 100,
      field: 'aug',
      headerName: 'August ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            August
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          1009
        </Typography>
      )
    },
    {
      width: 100,
      field: 'sep',
      headerName: 'September ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            September
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          989
        </Typography>
      )
    },
    {
      width: 100,
      field: 'oct',
      headerName: 'October ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            October
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          3838
        </Typography>
      )
    },
    {
      width: 100,
      field: 'nov',
      headerName: 'November ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            November
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          9789
        </Typography>
      )
    },
    {
      width: 100,
      field: 'dec',
      headerName: 'December ',
      renderHeader: () => (
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            December
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
            2024
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
            (2024)
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          898
        </Typography>
      )
    }
  ]

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleCloseDrawer = () => {
    setSelectedFruits([])
    setOpenFilterDrawer(false)
    setFiltersApplied(true)
    setFilterLength('')
  }

  // This function will handle the selected fruits from the child component
  const handleFruitSelection = fruitId => {
    setFiltersApplied(false)
    setSelectedFruits(prevSelectedFruits => {
      // If the fruit is already selected, remove it; otherwise, add it
      if (prevSelectedFruits.includes(fruitId)) {
        return prevSelectedFruits.filter(id => id !== fruitId)
      } else {
        return [...prevSelectedFruits, fruitId]
      }
    })
  }

  const onApplyFilters = () => {
    setFiltersApplied(true)
    setOpenFilterDrawer(false)
    setFilterLength(selectedFruits.length)
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: statusFilter })
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

        // Append selected fruit ids to params if any fruits are selected and filters are applied
        if (filtersApplied || selectedFruits.length > 0) {
          // Use array notation for fruit IDs
          params['fruitid[]'] = selectedFruits
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
    [paginationModel, filtersApplied]
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
                    Month wise purchase report
                  </Typography>
                  {/* <Typography color='text.primary'>Diet Details</Typography> */}
                </Breadcrumbs>
              </Box>
              <Card>
                <CardHeader title='Month wise purchase' action={headerAction} />
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
                      onClick={() => {
                        setFiltersApplied(false) // Reset filters state
                        setOpenFilterDrawer(true) // Open the filter drawer
                      }}
                    >
                      {filterlength <= 0 ? 'Filter' : filterlength}
                    </LoadingButton>
                  </Grid>
                </Grid>
                {console.log(indexedRows, 'indexedRows')}
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
                  columnHeaderHeight={100}
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
                <MonthWisepurchaseFilter
                  setOpenFilterDrawer={setOpenFilterDrawer}
                  openFilterDrawer={openFilterDrawer}
                  handleFruitSelection={handleFruitSelection}
                  selectedFruits={selectedFruits}
                  handleSelectAllChange={handleSelectAllChange}
                  fruitList={fruitList}
                  onApplyFilters={onApplyFilters}
                  handleCloseDrawer={handleCloseDrawer}
                  setFiltersApplied={setFiltersApplied}
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

export default MonthWisePurchase
