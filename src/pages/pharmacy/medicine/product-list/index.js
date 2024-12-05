import React, { useState, useEffect, useCallback } from 'react'

import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

// import { getMedicineConfig } from 'src/lib/api/getMedicineConfig'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge, TextField } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

import { usePharmacyContext } from 'src/context/PharmacyContext'

import Error404 from 'src/pages/404'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'

const ListOfMedicine = () => {
  const theme = useTheme()
  const router = useRouter()

  const [medicineList, setMedicineList] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')

  const { selectedPharmacy } = usePharmacyContext()

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const handleEdit = async row => {
    if (
      selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD')
    ) {
      router.push({
        pathname: '/pharmacy/medicine/add-product',
        query: { id: row?.row?.id, action: 'edit' }
      })
    }
  }

  const handleRowClick = params => {
    Router.push({
      pathname: `/pharmacy/medicine/${params.row?.id}`
    })
  }

  const columns = [
    {
      flex: 0.15,
      Width: 30,
      field: 'id',
      headerName: 'SL NO ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'name',
      headerName: 'PRODUCT NAME',
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
          {params.row.name}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'stock_type',
    //   headerName: 'Type',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       <span alt={params.row.stock_type}>{params.row.stock_type}</span>
    //     </Typography>
    //   )
    // },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'package',
      headerName: 'PACKAGE',
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
          {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'manufacturer_name',
      headerName: 'Manufacturer Name',
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
          <span alt={params.row.manufacturer_name}>{params.row.manufacturer_name}</span>
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 20,
      field: 'created_at',
      headerName: 'Product Type',
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
          {params.row.stock_type}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'image',
      headerName: 'IMAGE',
      renderCell: params => (
        <Badge
          sx={{ ml: 2, cursor: 'pointer' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{ width: 40, height: 40 }}
            src={params.row.image ? `${params.row.image}` : '/images/tablet.png'}
          />
        </Badge>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'active',
      headerName: 'STATUS',
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
          {parseInt(params.row.active) === 0 ? 'Inactive' : 'Active'}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',

    //   renderCell: params => (
    //     <>
    //       {selectedPharmacy.type === 'central' &&
    //         (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
    //           <Box>
    //             <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
    //               <Icon icon='mdi:pencil-outline' />
    //             </IconButton>
    //           </Box>
    //         )}
    //     </>

    //     // {selectedPharmacy.type === 'central' && (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') &&(<Box>
    //     //   <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
    //     //     <Icon icon='mdi:pencil-outline' />
    //     //   </IconButton>
    //     //   {/* <IconButton
    //     //     size='small'
    //     //     onClick={() => {
    //     //       setConfigureMedId(params.row.id)
    //     //       showDialog()
    //     //     }}
    //     //   >
    //     //     <Icon icon='grommet-icons:configure' />
    //     //   </IconButton> */}
    //     //   {/* <IconButton size='small'>
    //     //     <Icon icon='mdi:eye-outline' />
    //     //   </IconButton>

    //     //   <IconButton size='small'>
    //     //     <Icon icon='mdi:file' />
    //     //   </IconButton> */}
    //     // </Box>)}
    //   )
    // }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.sortColumn || 'name')
  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: parseInt(router.query.pageSize, 10) || 10
  })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState(true)
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, status, page, pageSize }) => {
      let params = {}
      const activeStatus = status ?? statusFilter
      try {
        setLoading(true)
        if (activeStatus === 'all') {
          params = {
            sort,
            q,
            column,
            page: page + 1, // 1-based page index for API
            limit: pageSize
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

        await getMedicineList({ params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(page, res?.data?.list_items))
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
    [paginationModel]
  )

  // Fetching Data
  // const fetchTableData = useCallback(
  //   async (params = { sort, q, column, status, page, pageSize }) => {
  //     try {
  //       setLoading(true)
  //       const response = await getMedicineList({ params })
  //       const { list_items, total_count } = response?.data || {}

  //       setRows(list_items || [])
  //       setTotal(total_count || 0)
  //     } catch (error) {
  //       console.error('Failed to fetch medicine data:', error)
  //     } finally {
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )

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

  // useEffect(() => {
  //   fetchTableData({
  //     sort,
  //     q: searchValue,
  //     column: sortColumn,
  //     status: statusFilter,
  //     page: paginationModel.page,
  //     pageSize: paginationModel.pageSize
  //   })
  // }, [sort, searchValue, sortColumn, statusFilter, paginationModel.page, paginationModel.pageSize])

  useEffect(() => {
    fetchTableData({
      sort,
      q: searchValue,
      status: statusFilter,
      column: sortColumn,
      page: paginationModel.page + 1, // API expects 1-based index
      pageSize: paginationModel.pageSize
    })
  }, [sort, searchValue, sortColumn, statusFilter, paginationModel.page, paginationModel.pageSize, selectedPharmacy])

  useEffect(() => {
    router.replace({
      pathname: router.pathname,
      query: {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        q: searchValue,
        sort,
        column: sortColumn,
        status: statusFilter
      }
    })
  }, [paginationModel.page, paginationModel.pageSize, searchValue, sort, sortColumn, statusFilter])

  useEffect(() => {
    const { q, page, pageSize, sort, column, status } = router.query

    setSearchValue(q || '')
    setSort(sort || 'asc')
    setSortColumn(column || 'name')
    setStatusFilter(status || true)
    setPaginationModel({
      page: parseInt(page, 10) - 1 || 0,
      pageSize: parseInt(pageSize, 10) || 10
    })
  }, [])

  // const handleSortModel = async newModel => {
  //   if (newModel.length > 0) {
  //     setSort(newModel[0].sort)
  //     await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
  //   } else {
  //   }
  // }

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field
      setSort(newSort)
      setSortColumn(newColumn)
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            sort: newSort,
            column: newColumn
          }
        },
        undefined,
        { shallow: true }
      )
      fetchTableData(newSort, searchValue, newColumn)
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn, status: statusFilter })
  }
  // const handleSearch = useCallback(
  //   debounce(value => {
  //     setSearchValue(value)

  //     // Reset the page to the first page (page 0 in your `paginationModel`)
  //     setPaginationModel(prevModel => ({
  //       ...prevModel,
  //       page: 0
  //     }))

  //     // Update the URL query parameters
  //     Router.replace({
  //       pathname: Router.pathname,
  //       query: {
  //         ...Router.query,
  //         q: value,
  //         page: 1 // Update to 1-indexed for the URL
  //       }
  //     })
  //   }, 500),
  //   []
  // )

  // const handleSearch = useCallback(
  //   debounce(value => {
  //     setSearchValue(value)
  //     fetchTableData({
  //       sort,
  //       q: value,
  //       column: sortColumn,
  //       page: paginationModel.page,
  //       pageSize: paginationModel.pageSize
  //     })
  //   }, 500),
  //   [sort, sortColumn, paginationModel]
  // )

  const handleStatusFilterChange = newFilter => {
    setStatusFilter(newFilter)
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: newFilter })
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButtonContained
            title='Add Product'
            action={() => {
              router.push('/pharmacy/medicine/add-product')
            }}
          />
        )}
      {/* <Button
        size='big'
        variant='contained'
        onClick={() => {
          Router.push('/pharmacy/medicine/add-product')
        }}
      >
        Add Product
      </Button> */}
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>Product List</Typography>
    </>
  )

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
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
                <CardHeader title={title} action={headerAction} />
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
                        value={searchValue}
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
                  <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', display: 'flex', mr: 5, mt: 3 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel id='demo-simple-select-label'>Filter by Status</InputLabel>
                      <Select
                        size='small'
                        value={statusFilter}
                        label='Filter by Status'
                        onChange={e => {
                          handleStatusFilterChange(e.target.value)
                        }}
                      >
                        <MenuItem value='all'>All</MenuItem>
                        <MenuItem value={true}>Active</MenuItem>
                        <MenuItem value={false}>In-Active </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Box>

                <Grid
                  sx={{
                    mx: 4
                  }}
                >
                  <CommonTable
                    onRowClick={handleRowClick}
                    // onRowClick={handleEdit}
                    indexedRows={indexedRows}
                    total={total}
                    columns={columns}
                    paginationModel={paginationModel}
                    handleSortModel={handleSortModel}
                    setPaginationModel={setPaginationModel}
                    loading={loading}
                    searchValue={searchValue}
                  />
                </Grid>

                {/* <DataGrid
                  sx={{ cursor: 'pointer' }}
                  columnVisibilityModel={{
                    id: false
                  }}
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
                  onRowClick={handleEdit}
                /> */}
              </Card>
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

export default ListOfMedicine
