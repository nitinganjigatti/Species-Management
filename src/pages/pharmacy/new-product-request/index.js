import React, { useState, useEffect, useCallback, useContext } from 'react'

import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import DeleteIcon from '@mui/icons-material/Delete'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  debounce
} from '@mui/material'

import {
  addNonExistingProductStatus,
  deleteNonExistingProduct,
  getNonExistingProductById,
  getNonExistingProductList
} from 'src/lib/api/pharmacy/newMedicine'
import { useRouter } from 'next/router'
import { AddButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import CommonDialogBox from 'src/components/CommonDialogBox'
import { ProductDetail } from 'src/views/pages/pharmacy/product/product-details'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { useTheme } from '@emotion/react'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import toast from 'react-hot-toast'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained, ExcelExportButton } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import { AuthContext } from 'src/context/AuthContext'
import { width } from '@mui/system'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { ExportButton } from 'src/views/utility/render-snippets'

export default function NewProductList() {
  const theme = useTheme()
  const router = useRouter()

  const updateUrlParams = useCallback(params => {
    const newQuery = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query: newQuery }, undefined)
  }, [])

  console.log(router.query, 'updateUrlParams')

  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [detailsData, setDetailsData] = useState([])
  const [productDetails, setProductDetails] = useState({})
  const [reasonText, setReasonText] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [filterByPharmacyId, setFilterByPharmacyId] = useState(router.query.filterByPharmacyId || '' || 'all')

  const [prescriptionImages, setPrescriptionImages] = useState()
  const [statusCall, setStatusCall] = useState(false)
  const { selectedPharmacy } = usePharmacyContext()
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('')

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })

  const authData = useContext(AuthContext)

  console.log('Selected Pharmacy', authData.userData.modules.pharmacy_data.pharmacy)

  const handleRequestStatus = async (status, id, productDetails) => {
    const payload = {
      status: status,
      comments: productDetails?.comments ? productDetails?.comments : '',
      reject_reason: reasonText ? reasonText : ' '
    }

    try {
      const response = await addNonExistingProductStatus(payload, id)
      if (response?.success) {
        const toastMessage = id ? 'Product Status Updated Successfully' : 'Unable to Update the Product Status'
        toast.success(toastMessage)
        setShow(false)

        // Trigger table data refresh after status change
        // Call fetchTableData for 'Pending' tab if the new status is 'Cancelled'
        if (status === 'Cancelled' || 'Approved' || 'Rejected') {
          fetchTableData({
            sort,
            q: searchValue,
            column: sortColumn,
            status: 'Pending',
            filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
          })
          updateUrlParams({
            sort,
            q: searchValue,
            column: sortColumn,
            status: 'Pending',
            filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId,
            page: paginationModel?.page,
            limit: paginationModel?.pageSize
          }) // Refresh pending tab
        } else {
          fetchTableData({
            sort,
            q: searchValue,
            column: sortColumn,
            status: status,
            filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
          })
          updateUrlParams({
            sort,
            q: searchValue,
            column: sortColumn,
            status: status,
            filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId,
            page: paginationModel?.page,
            limit: paginationModel?.pageSize
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const columns = [
    {
      width: 80,
      minWidth: 100,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 150,
      field: 'request_number',
      headerName: 'Request Number',
      renderCell: (params, rowId) => (
        <div>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params?.row?.request_number}
          </Typography>
        </div>
      )
    },
    selectedPharmacy?.type === 'central' && {
      width: 150,
      minWidth: 180,
      field: 'to_store_name',
      headerName: 'From Store',
      renderCell: (params, rowId) => (
        <div>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params?.row?.to_store_name}
          </Typography>
        </div>
      )
    },
    {
      flex: 0.3,
      minWidth: 180,
      field: 'product_name',
      headerName: 'Product Name',
      renderCell: params => (
        <div>
          {params?.row.request_items?.map((item, index) => (
            <Typography
              key={index}
              sx={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}
            >
              {item?.product_name}
            </Typography>
          ))}
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 150,
      field: 'priority',
      headerName: 'Priority',
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
          {params?.row?.priority}
        </Typography>
      )
    },
    selectedPharmacy?.type === 'central' && {
      flex: 0.3,
      minWidth: 150,
      field: 'requested_by',
      headerName: 'Requested User',
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
          {params?.row?.requested_user_name}
        </Typography>
      )
    },
    {
      flex: selectedPharmacy.type === 'central' ? 0.2 : 0.3,
      minWidth: 150,
      field: 'quantity',
      headerName: 'Quantity',
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row.request_items?.map((item, index) => (
            <Typography
              key={index}
              sx={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}
            >
              {item?.quantity}
            </Typography>
          ))}
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 150,
      field: 'created_at',
      headerName: 'CREATED Date',
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
          {Utility.formatDisplayDate(params?.row?.created_at)}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 150,
      field: 'status',
      headerName: 'Status',
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
          {params?.row?.status}
        </Typography>
      )
    }
  ]

  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [total, setTotal] = useState(0)
  const [sortColumn, setSortColumn] = useState(router.query.column || 'id')
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [itemId, setItemId] = useState()
  const [imgUrl, setImageUrl] = useState()
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState(router.query.status || 'Approved')
  const [excelLoader, setExcelLoader] = useState(false)

  const handleChange = (event, newValue) => {
    setTotal(0)
    setSearchValue('')
    setPaginationModel({ page: 0, pageSize: 10 })
    setFilterDates('')

    setStatus(newValue)

    // Fetch table data with the new status
    fetchTableData({
      sort,
      q: '', // Clear the search value when status changes
      column: sortColumn,
      status: newValue, // Use the updated status
      filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId, // Use the current pharmacy filter
      page: 1,
      limit: paginationModel.pageSize,
      filterDates
    })
    updateUrlParams({
      sort,
      q: '',
      column: sortColumn,
      status: newValue,
      filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
    })
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, status, filterByPharmacyId, page, limit, filterDates }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: page || paginationModel.page + 1, // Fallback to current page if not provided
          limit: limit || paginationModel.pageSize, // Fallback to current limit if not provided
          type: status,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          pharmacy: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
        }

        await getNonExistingProductList({ params }).then(res => {
          if (res?.data?.length > 0) {
            setTotal(parseInt(res?.count, 10))
            setRows(loadServerRows(params.page - 1, res?.data)) // Convert back to 0-indexed for client-side
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        setTotal(0)
        setRows([])
        console.error(e)
        setLoading(false)
      }
    },
    [paginationModel.page, paginationModel.pageSize, filterDates] // Ensure state is watched properly
  )

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field, status, filterDates })
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        status: status,
        filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
      })
    } else {
    }
  }

  const headerAction = (
    <>
      {selectedPharmacy.type === 'local' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButtonContained
            title='Add Product'
            action={() => router.push('/pharmacy/new-product-request/request-product/')}
            fullWidth='fullWidth'
          />
        )}
    </>
  )

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column, status, filterByPharmacyId, filterDates }) => {
      setSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 10 })
      try {
        await fetchTableData({
          sort,
          q,
          column,
          status,
          filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId,
          page: paginationModel.page,
          limit: paginationModel.pageSize,
          filterDates
        })
        updateUrlParams({
          sort: sort,
          q: q,
          column: column,
          status: status,
          filterByPharmacyId: filterByPharmacyId,
          page: paginationModel.page,
          limit: paginationModel.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = async value => {
    setSearchValue(value)
    if (value === '') {
      await searchTableData({ sort, q: value, column: 'id', status, filterByPharmacyId, filterDates })
    } else {
      await searchTableData({ sort, q: value, column: 'id', status, filterByPharmacyId, filterDates })
    }
  }

  // useEffect(() => {
  //   fetchTableData({
  //     sort,
  //     q: searchValue,
  //     column: sortColumn,
  //     status,
  //     filterByPharmacyId: selectedPharmacy.type == 'central' ? '' : selectedPharmacy.id
  //   })
  // }, [fetchTableData, status, filterByPharmacyId])

  // useEffect(() => {
  //   if (selectedPharmacy.id && selectedPharmacy.type !== 'central') {
  //     setFilterByPharmacyId(selectedPharmacy.id) // Update dropdown to reflect selectedPharmacy
  //   } else {
  //     setFilterByPharmacyId('all')
  //   }
  // }, [selectedPharmacy])

  useEffect(() => {
    const pharmacyFilterValue = selectedPharmacy.type === 'central' ? '' : selectedPharmacy.id || ''

    setFilterByPharmacyId(selectedPharmacy.type === 'central' ? 'all' : selectedPharmacy.id || 'all')

    // setPaginationModel({ page: 0, pageSize: 10 })

    // Fetch table data with the appropriate filter value
    fetchTableData({
      sort,
      q: searchValue,
      column: sortColumn,
      status,
      filterByPharmacyId: pharmacyFilterValue,
      filterDates
    })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: status,
      filterByPharmacyId: pharmacyFilterValue,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
    })
  }, [sort, sortColumn, selectedPharmacy, filterDates])

  const handleEdit = id => {
    router.push({
      pathname: '/pharmacy/new-product-request/request-product/',
      query: { id: id }
    })
  }

  const onRowClick = async params => {
    console.log('Status', params)
    setShow(true)
    setSelectedPharmacyId(params?.row?.to_store)
    setItemId(params.id)
    await getNonExistingProductById(params.id)
      .then(res => {
        setProductDetails(res?.data)
        setPrescriptionImages(res?.data?.prescription_images)
        setDetailsData(res?.data?.request_item_details)
      })
      .catch(err => console.log(err))
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const getProductRequestToExport = async () => {
    try {
      setExcelLoader(true)

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        type: status,
        pharmacy: filterByPharmacyId === 'all' ? '' : filterByPharmacyId,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
      }

      const response = await getNonExistingProductList({ params })
      console.log('Response inventory>', response)
      setExcelLoader(false)
      if (response?.success === true && response?.data?.length > 0) {
        const data = response?.data
          ?.map(el => {
            return el.request_items.map(item => ({
              ['Request Number']: el?.request_number,
              ['Store Name']: el?.to_store_name,
              ['status']: el?.status,
              ['Product Name']: item.product_name,
              ['Quantity']: item.quantity,
              ['Priority']: item.priority,
              ['Created At']: Utility.formatDisplayDate(el?.created_at)
                ? Utility.formatDisplayDate(el?.created_at)
                : 'NA',
              ['Requested User']: el?.requested_user_name ? el?.requested_user_name : 'NA'
            }))
          })
          .flat() // Use flat() to flatten the array of arrays into a single array

        Utility.exportToCSV(data, 'Existing_ProductList')
      } else {
        toast.error('No data available for export')
        console.log('No data available for export.')
      }
    } catch (error) {
      console.log('Error >>', error)
      toast.error('Error >', error)
    }
  }

  const handleDateRangeChange = (startDate, endDate) => {
    setPaginationModel({ page: 0, pageSize: 10 })
    if (startDate && endDate) {
      setFilterDates({
        startDate: Utility.formatDate(startDate),
        endDate: Utility.formatDate(endDate)
      })

      console.log('Date range selected:', { startDate, endDate })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })

      console.log('Empty date range selected,', { startDate, endDate })
    }
  }

  const tableData = () => {
    return (
      <>
        <Card sx={{ cursor: 'pointer' }}>
          <CardHeader
            title={RenderUtility.pageTitle('New Product Request List')}
            action={headerAction}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', sm: 'space-between' },
              alignItems: { xs: 'flex-start', sm: 'flex-start' },
              flexDirection: { xs: 'column', sm: 'row' },
              '& .MuiCardHeader-title': {
                fontSize: { xs: '18px', sm: '20px', md: '24px' },
                flexGrow: 1
              },
              gap: { xs: 3, sm: 0 },
              '& .MuiCardHeader-action': {
                width: { xs: '100% ', sm: 'auto' },
                mb: filterByPharmacyId || searchValue || excelLoader ? { xs: 3, sm: 3 } : 0
              },
              mx: { xs: -1, sm: 1 },
              mt: 1
            }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' }, // Allow wrapping on small screens
              mx: { xs: 3, md: 5 },
              gap: { sm: 2 }
            }}
          >
            {/* Left Box (Date Picker) */}
            <Grid item size={{ xs: 12, sm: 4, md: 3 }} sx={{ mb: { xs: 3, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
              <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
            </Grid>

            {/* Right Box (Download, Pharmacy Filter, Search) */}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                mt: { xs: 1, sm: 0 }
              }}
            >
              {/* Search Field */}
              <TextField
                variant='outlined'
                size='small'
                placeholder='Search...'
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                sx={{
                  flex: 1,
                  mr: { sm: 2 },
                  borderRadius: '8px',
                  minWidth: 250

                  // mt: { xs: 3, sm: 0 }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                    </InputAdornment>
                  )
                }}
              />

              {/* Pharmacy Filter */}

              <FormControl
                size='small'
                sx={{
                  mt: { xs: 4, sm: 0 },

                  // mr: { sm: 2 },
                  // ml: { xs: 2 },
                  minWidth: { xs: '230px', sm: '10px' }, // Increased width for both small and larger screens
                  flex: { xs: 1, sm: 'auto' }
                }}
              >
                <InputLabel>Filter by Pharmacy</InputLabel>
                <Select
                  value={filterByPharmacyId}
                  label='Filter by Pharmacy'
                  onChange={e => {
                    setPaginationModel({ page: 0, pageSize: 10 })
                    const selectedId = e.target.value

                    // Update the dropdown value
                    setFilterByPharmacyId(selectedId)

                    // Fetch table data with the selected pharmacy filter
                    fetchTableData({
                      sort,
                      q: searchValue,
                      column: sortColumn,
                      status,
                      filterByPharmacyId: selectedId === 'all' ? '' : selectedId,
                      page: 0,
                      limit: 10,
                      filterDates
                    })
                  }}
                >
                  <MenuItem value='all'>All</MenuItem>
                  {authData.userData.modules.pharmacy_data.pharmacy?.map(
                    item =>
                      item.type === 'local' && (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      )
                  )}
                  {/* {authData.userData.modules.pharmacy_data.pharmacy?.map(item => (
                    console.log("Item >>", item),
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))} */}
                </Select>
              </FormControl>

              {/* Download Button */}
              <Box sx={{ mt: { xs: 4, sm: 0 }, ml: { xs: 2 } }}>
                <ExportButton
                  loading={excelLoader}
                  onClick={getProductRequestToExport}
                  disabled={total === 0 ? true : false}
                />
              </Box>

              {/* <Tooltip title='Export'>
                <>
                  {excelLoader ? (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        bgcolor: theme?.palette.customColors?.lightBg,
                        alignItems: 'center',
                        cursor: 'pointer',
                        mt: { xs: 3, sm: 0 },
                        ml: { xs: 2 }
                      }}
                    >
                      <CircularProgress color='success' size={30} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: { xs: '10%', sm: '40px' },
                        height: { xs: '40px', sm: '40px' },
                        borderRadius: '4px',
                        bgcolor: theme?.palette.customColors?.lightBg,
                        alignItems: 'center',
                        cursor: 'pointer',
                        mt: { xs: 3, sm: 0 },
                        ml: { xs: 2 }
                        // mr: { xs: 3 }
                      }}
                      onClick={getProductRequestToExport}
                    >
                      <Icon icon='ic:round-download' fontSize={20} />
                    </Box>
                  )}
                </>
              </Tooltip> */}
            </Box>
          </Box>

          <Grid
            sx={{
              mx: { xs: 2, md: 5 },
              mt: { xs: -1 }
            }}
          >
            <CommonTable
              onRowClick={onRowClick}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel} // Controlled model
              setPaginationModel={model => {
                // Update state first
                setPaginationModel(model)
                console.log(model, 'model')

                // Destructure the updated page and pageSize for clarity
                const { page, pageSize } = model

                // Fetch table data with the updated page and pageSize
                fetchTableData({
                  sort,
                  q: searchValue,
                  column: sortColumn,
                  status,
                  page: page + 1, // Convert to 1-indexed pages for API
                  limit: pageSize,
                  filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
                })
                updateUrlParams({
                  sort,
                  q: searchValue,
                  column: sortColumn,
                  status: status,
                  filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId,
                  page: page,
                  limit: pageSize
                })
              }}
              handleSortModel={handleSortModel}
              loading={loading}
            />
          </Grid>
        </Card>

        {show && (
          <>
            <CardContent>
              <Grid container>
                <CommonDialogBox
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>Product Details - {productDetails?.request_number}</div>
                      {selectedPharmacy.type === 'local' &&
                        selectedPharmacyId == selectedPharmacy.id &&
                        (selectedPharmacy.permission.key === 'allow_full_access' ||
                          selectedPharmacy.permission.key === 'ADD') &&
                        productDetails?.status === 'Pending' && (
                          <Grid
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'flex-end'
                            }}
                          >
                            <IconButton
                              size='small'
                              sx={{ mr: 0.5 }}
                              aria-label='Edit'
                              onClick={() => handleEdit(itemId)}
                            >
                              <Icon icon='mdi:pencil-outline' />
                            </IconButton>
                          </Grid>
                        )}
                    </div>
                  }
                  dialogBoxStatus={show}
                  formComponent={
                    <ProductDetail
                      setShow={setShow}
                      statusCall={statusCall}
                      submitLoader={submitLoader}
                      detailsData={detailsData}
                      handleRequestStatus={handleRequestStatus}
                      prescriptionImages={prescriptionImages}
                      reasonText={reasonText}
                      setReasonText={setReasonText}
                      imgUrl={imgUrl}
                      itemId={itemId}
                      handleEdit={handleEdit}
                      productDetails={productDetails}
                      selectedPharmacyId={selectedPharmacyId}
                    />
                  }
                  close={() => {
                    setShow(false)
                    setProductDetails({})
                    setDetailsData([])
                  }}
                  show={() => setShow(true)}
                />
              </Grid>
            </CardContent>
          </>
        )}
      </>
    )
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <TabContext value={status}>
          <TabList variant='scrollable' allowScrollButtonsMobile onChange={handleChange}>
            <Tab
              sx={{ ml: { xs: 1, sm: 3 } }} // Adjust margin for tabs
              value='Approved'
              label={<TabBadge label='Approved' totalCount={status === 'Approved' ? total : null} />}
            />

            <Tab
              value='Pending'
              label={<TabBadge label='Pending' totalCount={status === 'Pending' ? total : null} />}
            />

            <Tab
              value='Cancelled'
              label={<TabBadge label='Cancelled' totalCount={status === 'Cancelled' ? total : null} />}
            />
            <Tab
              value='Rejected'
              label={<TabBadge label='Rejected' totalCount={status === 'Rejected' ? total : null} />}
            />
          </TabList>
          <TabPanel value='Approved'>{tableData()}</TabPanel>
          <TabPanel value='Pending'>{tableData()}</TabPanel>

          <TabPanel value='Cancelled'>{tableData()}</TabPanel>
          <TabPanel value='Rejected'>{tableData()}</TabPanel>
        </TabContext>
      )}
    </>
  )
}

// import React, { useState, useEffect, useCallback, useContext } from 'react'

// import TableWithFilter from 'src/components/TableWithFilter'
// import FallbackSpinner from 'src/@core/components/spinner/index'
// import { DataGrid } from '@mui/x-data-grid'
// import CardHeader from '@mui/material/CardHeader'

// // ** MUI Imports
// import IconButton from '@mui/material/IconButton'
// import Typography from '@mui/material/Typography'
// import Chip from '@mui/material/Chip'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// // import DeleteIcon from '@mui/icons-material/Delete'
// import TabContext from '@mui/lab/TabContext'
// import TabList from '@mui/lab/TabList'
// import Tab from '@mui/material/Tab'
// import TabPanel from '@mui/lab/TabPanel'
// import {
//   Box,
//   Button,
//   Card,
//   CardContent,
//   FormControl,
//   Grid,
//   InputLabel,
//   MenuItem,
//   Select,
//   TextField,
//   debounce
// } from '@mui/material'

// import {
//   addNonExistingProductStatus,
//   deleteNonExistingProduct,
//   getNonExistingProductById,
//   getNonExistingProductList
// } from 'src/lib/api/pharmacy/newMedicine'
// import { useRouter } from 'next/router'
// import { AddButton } from 'src/components/Buttons'
// import Utility from 'src/utility'
// import CommonDialogBox from 'src/components/CommonDialogBox'
// import { ProductDetail } from 'src/views/pages/pharmacy/product/product-details'
// import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
// import { useTheme } from '@emotion/react'

// import { usePharmacyContext } from 'src/context/PharmacyContext'
// import toast from 'react-hot-toast'
// import CommonTable from 'src/views/table/data-grid/CommonTable'
// import { AddButtonContained } from 'src/components/ButtonContained'
// import RenderUtility from 'src/utility/render'
// import { AuthContext } from 'src/context/AuthContext'
// import { width } from '@mui/system'

// export default function NewProductList() {
//   const theme = useTheme()

//   const [loader, setLoader] = useState(false)
//   const [show, setShow] = useState(false)
//   const [detailsData, setDetailsData] = useState([])
//   const [productDetails, setProductDetails] = useState({})
//   const [reasonText, setReasonText] = useState('')
//   const [submitLoader, setSubmitLoader] = useState(false)
//   const [filterByPharmacyId, setFilterByPharmacyId] = useState('' || 'all')

//   const [prescriptionImages, setPrescriptionImages] = useState()
//   const [statusCall, setStatusCall] = useState(false)
//   const { selectedPharmacy } = usePharmacyContext()
//   const [selectedPharmacyId, setSelectedPharmacyId] = useState('')

//   const authData = useContext(AuthContext)

//   console.log('Selected Pharmacy', authData.userData.modules.pharmacy_data.pharmacy)

//   const handleRequestStatus = async (status, id, productDetails) => {
//     const payload = {
//       status: status,
//       comments: productDetails?.comments ? productDetails?.comments : '',
//       reject_reason: reasonText ? reasonText : ' '
//     }

//     try {
//       const response = await addNonExistingProductStatus(payload, id)
//       if (response?.success) {
//         const toastMessage = id ? 'Product Status Updated Successfully' : 'Unable to Update the Product Status'
//         toast.success(toastMessage)
//         setShow(false)

//         // Trigger table data refresh after status change
//         // Call fetchTableData for 'Pending' tab if the new status is 'Cancelled'
//         if (status === 'Cancelled' || 'Approved' || 'Rejected') {
//           fetchTableData({
//             sort,
//             q: searchValue,
//             column: sortColumn,
//             status: 'Pending',
//             filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
//           }) // Refresh pending tab
//         } else {
//           fetchTableData({
//             sort,
//             q: searchValue,
//             column: sortColumn,
//             status: status,
//             filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
//           })
//         }
//       }
//     } catch (error) {
//       console.log(error)
//     }
//   }

//   const columns = [
//     {
//       width: 80,
//       minWidth: 80,
//       field: 'id',
//       headerName:'SL.NO',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {parseInt(params.row.sl_no) + '.'}
//         </Typography>
//       )
//     },
//     {
//       width: 150,
//       minWidth: 150,
//       field: 'request_number',
//       headerName: 'Request Number',
//       renderCell: (params, rowId) => (
//         <div>
//           <Typography
//             variant='body2'
//             sx={{
//               color: theme.palette.customColors.customHeadingTextColor,
//               fontSize: '14px',
//               fontWeight: 500,
//               fontFamily: 'Inter'
//             }}
//           >
//             {params?.row?.request_number}
//           </Typography>
//         </div>
//       )
//     },
//     selectedPharmacy?.type === 'central' && {
//       width: 150,
//       minWidth: 150,
//       field: 'to_store_name',
//       headerName: 'From Store',
//       renderCell: (params, rowId) => (
//         <div>
//           <Typography
//             variant='body2'
//             sx={{
//               color: theme.palette.customColors.customHeadingTextColor,
//               fontSize: '14px',
//               fontWeight: 500,
//               fontFamily: 'Inter'
//             }}
//           >
//             {params?.row?.to_store_name}
//           </Typography>
//         </div>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 40,
//       field: 'product_name',
//       headerName: 'Product Name',
//       renderCell: params => (
//         <div>
//           {params?.row.request_items?.map((item, index) => (
//             <Typography
//               key={index}
//               sx={{
//                 color: theme.palette.customColors.customHeadingTextColor,
//                 fontSize: '14px',
//                 fontWeight: 500,
//                 fontFamily: 'Inter'
//               }}
//             >
//               {item?.product_name}
//             </Typography>
//           ))}
//         </div>
//       )
//     },

//     {
//       flex: 0.2,
//       minWidth: 40,
//       field: 'priority',
//       headerName: 'Priority',
//       renderCell: params => (
//         <Typography
//           variant='body2'
//           sx={{
//             color: theme.palette.customColors.customHeadingTextColor,
//             fontSize: '14px',
//             fontWeight: 500,
//             fontFamily: 'Inter'
//           }}
//         >
//           {params?.row?.priority}
//         </Typography>
//       )
//     },
//     selectedPharmacy?.type === 'central' && {
//       flex: 0.3,
//       minWidth: 40,
//       field: 'requested_by',
//       headerName: 'Requested User',
//       renderCell: params => (
//         <Typography
//           variant='body2'
//           sx={{
//             color: theme.palette.customColors.customHeadingTextColor,
//             fontSize: '14px',
//             fontWeight: 500,
//             fontFamily: 'Inter'
//           }}
//         >
//           {params?.row?.requested_user_name}
//         </Typography>
//       )
//     },
//     {
//       flex: selectedPharmacy.type === 'central' ? 0.2 : 0.3,
//       minWidth: 40,
//       field: 'quantity',
//       headerName: 'Quantity',
//       type: 'number',
//       headerAlign: 'left',
//       align: 'left',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params?.row.request_items?.map((item, index) => (
//             <Typography
//               key={index}
//               sx={{
//                 color: theme.palette.customColors.customHeadingTextColor,
//                 fontSize: '14px',
//                 fontWeight: 500,
//                 fontFamily: 'Inter'
//               }}
//             >
//               {item?.quantity}
//             </Typography>
//           ))}
//         </Typography>
//       )
//     },

//     {
//       flex: 0.3,
//       minWidth: 20,
//       field: 'created_at',
//       headerName: 'CREATED Date',
//       renderCell: params => (
//         <Typography
//           variant='body2'
//           sx={{
//             color: theme.palette.customColors.customHeadingTextColor,
//             fontSize: '14px',
//             fontWeight: 500,
//             fontFamily: 'Inter'
//           }}
//         >
//           {Utility.formatDisplayDate(params?.row?.created_at)}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 20,
//       field: 'status',
//       headerName: 'Status',
//       renderCell: params => (
//         <Typography
//           variant='body2'
//           sx={{
//             color: theme.palette.customColors.customHeadingTextColor,
//             fontSize: '14px',
//             fontWeight: 500,
//             fontFamily: 'Inter'
//           }}
//         >
//           {params?.row?.status}
//         </Typography>
//       )
//     }
//   ]
//   const router = useRouter()

//   const [loading, setLoading] = useState(false)

//   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
//   const [searchValue, setSearchValue] = useState('')
//   const [total, setTotal] = useState(0)
//   const [sortColumn, setSortColumn] = useState('id')
//   const [sort, setSort] = useState('desc')
//   const [itemId, setItemId] = useState()
//   const [imgUrl, setImageUrl] = useState()
//   const [rows, setRows] = useState([])
//   const [status, setStatus] = useState('Approved')

//   const handleChange = (event, newValue) => {

//     // Reset total and search value
//     setTotal(0)
//     setSearchValue('')
//     setPaginationModel({ page: 0, pageSize: 10 })

//     // Update the status
//     setStatus(newValue)

//     // Fetch table data with the new status
//     fetchTableData({
//       sort,
//       q: '', // Clear the search value when status changes
//       column: sortColumn,
//       status: newValue, // Use the updated status
//       filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId, // Use the current pharmacy filter
//       page: 1,
//       limit: paginationModel.pageSize
//     })
//   }

//   function loadServerRows(currentPage, data) {
//     return data
//   }

//   const fetchTableData = useCallback(
//     async ({ sort, q, column, status, filterByPharmacyId, page, limit }) => {
//       try {
//         setLoading(true)

//         const params = {
//           sort,
//           q,
//           column,
//           page: page || paginationModel.page + 1, // Fallback to current page if not provided
//           limit: limit || paginationModel.pageSize, // Fallback to current limit if not provided
//           type: status,
//           pharmacy: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
//         }

//         await getNonExistingProductList({ params }).then(res => {
//           if (res?.data?.length > 0) {
//             setTotal(parseInt(res?.count, 10))
//             setRows(loadServerRows(params.page - 1, res?.data)) // Convert back to 0-indexed for client-side
//           } else {
//             setTotal(0)
//             setRows([])
//           }
//         })
//         setLoading(false)
//       } catch (e) {
//         setTotal(0)
//         setRows([])
//         console.error(e)
//         setLoading(false)
//       }
//     },
//     [paginationModel.page, paginationModel.pageSize] // Ensure state is watched properly
//   )

//   const handleSortModel = async newModel => {
//     if (newModel.length > 0) {
//       await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field, status })
//     } else {
//     }
//   }

//   const headerAction = (
//     <>
//       {selectedPharmacy.type === 'local' &&
//         (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
//           <AddButtonContained
//             title='Add Product'
//             action={() => router.push('/pharmacy/new-product-request/request-product/')}
//             fullWidth='fullWidth'
//           />
//         )}
//     </>
//   )

//   const TabBadge = ({ label, totalCount }) => (
//     <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
//       {label}
//       {totalCount ? (
//         <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
//       ) : null}
//     </div>
//   )

//   const searchTableData = useCallback(
//     debounce(async ({ sort, q, column, status, filterByPharmacyId }) => {
//       setSearchValue(q)
//       setPaginationModel({ page: 0, pageSize: 10 })
//       try {
//         await fetchTableData({
//           sort,
//           q,
//           column,
//           status,
//           filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
//         })
//       } catch (error) {
//         console.error(error)
//       }
//     }, 1000),
//     []
//   )

//   const handleSearch = async value => {
//     setSearchValue(value)
//     if (value === '') {
//       await searchTableData({ sort, q: value, column: 'id', status, filterByPharmacyId })
//     } else {
//       await searchTableData({ sort, q: value, column: 'request_number', status, filterByPharmacyId })
//     }
//   }

//   // useEffect(() => {
//   //   fetchTableData({
//   //     sort,
//   //     q: searchValue,
//   //     column: sortColumn,
//   //     status,
//   //     filterByPharmacyId: selectedPharmacy.type == 'central' ? '' : selectedPharmacy.id
//   //   })
//   // }, [fetchTableData, status, filterByPharmacyId])

//   // useEffect(() => {
//   //   if (selectedPharmacy.id && selectedPharmacy.type !== 'central') {
//   //     setFilterByPharmacyId(selectedPharmacy.id) // Update dropdown to reflect selectedPharmacy
//   //   } else {
//   //     setFilterByPharmacyId('all')
//   //   }
//   // }, [selectedPharmacy])

//   useEffect(() => {
//     const pharmacyFilterValue = selectedPharmacy.type === 'central' ? '' : selectedPharmacy.id || ''

//     setFilterByPharmacyId(selectedPharmacy.type === 'central' ? 'all' : selectedPharmacy.id || 'all')

//     setPaginationModel({ page: 0, pageSize: 10 })

//     // Fetch table data with the appropriate filter value
//     fetchTableData({
//       sort,
//       q: searchValue,
//       column: sortColumn,
//       status,
//       filterByPharmacyId: pharmacyFilterValue
//     })
//   }, [sort, sortColumn, selectedPharmacy])

//   const handleEdit = id => {
//     router.push({
//       pathname: '/pharmacy/new-product-request/request-product/',
//       query: { id: id }
//     })
//   }

//   const onRowClick = async params => {
//     console.log('Status', params)
//     setShow(true)
//     setSelectedPharmacyId(params?.row?.to_store)
//     setItemId(params.id)
//     await getNonExistingProductById(params.id)
//       .then(res => {
//         setProductDetails(res?.data)
//         setPrescriptionImages(res?.data?.prescription_images)
//         setDetailsData(res?.data?.request_item_details)
//       })
//       .catch(err => console.log(err))
//   }

//   const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

//   const indexedRows = rows?.map((row, index) => ({
//     ...row,
//     sl_no: getSlNo(index)
//   }))

//   const tableData = () => {
//     return (
//       <>
//         <Card sx={{ cursor: 'pointer' }}>
//           <CardHeader
//             title={RenderUtility.pageTitle('New Product Request List')}
//             action={headerAction}
//             sx={{
//               display: 'flex',
//               justifyContent: { xs: 'flex-start', sm: 'space-between' },
//               alignItems: { xs: 'flex-start', sm: 'flex-start' },
//               flexDirection: { xs: 'column', sm: 'row' },
//               '& .MuiCardHeader-title': {
//                 fontSize: { xs: '18px', sm: '20px', md: '24px' },
//                 flexGrow: 1
//               },
//               gap: { xs: 3, sm: 0 },
//               '& .MuiCardHeader-action': {
//                 width: { xs: '100% ', sm: 'auto' }
//               },
//               mx: { xs: -1, sm: 1 },
//               mt: 1
//             }}
//           />

//           <Box
//             sx={{
//               display: 'flex',
//               flexDirection: { xs: 'column', md: 'row' },
//               justifyContent: { xs: 'center', md: 'space-between' },
//               alignItems: 'center',

//               // padding: '2px',
//               margin: selectedPharmacy?.type === 'local' ? '1rem 1.375rem 0px 1.375rem' : '0rem 1.375rem 0px 1.375rem',
//               gap: { xs: 2, md: 3 }
//             }}
//           >
//             {/* <Box
//                 sx={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
//                   borderRadius: '8px',
//                   padding: '0 8px',
//                   height: '40px',

//                   // ml: { sm: 4.5},
//                   width: { xs: '100%', md: '290px' },
//                   marginBottom: { xs: 2, md: 0 }
//                 }}
//               >
//                 <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} /> */}
//             <TextField
//               variant='outlined'
//               size='small'
//               placeholder='Search...'
//               value={searchValue}
//               onChange={e => handleSearch(e.target.value)}
//               fullWidth
//               sx={{
//                 borderRadius: '8px',
//                 width: { xs: '100%', md: '290px' }
//               }}
//             />
//             {/* </Box> */}

//             {/* Filters */}
//             <Grid
//               container
//               spacing={2}
//               sx={{
//                 display: 'flex',
//                 flexWrap: { xs: 'wrap', md: 'nowrap' },
//                 justifyContent: { xs: 'center', md: 'flex-end' },
//                 alignItems: 'center'

//                 // width: '100%'
//               }}
//             >
//               {/* Filter by Stores */}
//               <Grid
//                 item
//                 xs={12}
//                 sx={{
//                   maxWidth: { xs: '100%', md: '250px' },
//                   width: '100%',
//                   height: '48px',
//                   mt: { xs: 2, md: 0 }
//                 }}
//               >
//                 <FormControl fullWidth size='small'>
//                   <InputLabel>Filter by Pharmacy</InputLabel>
//                   <Select
//                     value={filterByPharmacyId}
//                     label='Filter by Pharmacy'
//                     onChange={e => {
//                       setPaginationModel({ page: 0, pageSize: 10 })
//                       const selectedId = e.target.value

//                       // Update the dropdown value
//                       setFilterByPharmacyId(selectedId)

//                       // Fetch table data with the selected pharmacy filter
//                       fetchTableData({
//                         sort,
//                         q: searchValue,
//                         column: sortColumn,
//                         status,
//                         filterByPharmacyId: selectedId === 'all' ? '' : selectedId,
//                         page: 0,
//                         limit: 10
//                       })
//                     }}
//                   >
//                     <MenuItem value='all'>All</MenuItem>
//                     {authData.userData.modules.pharmacy_data.pharmacy?.map(item => (
//                       <MenuItem key={item.id} value={item.id}>
//                         {item.name}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//             </Grid>
//           </Box>

//           <Grid
//             sx={{
//               mx: { xs: 3, md: 5 }
//             }}
//           >
//             <CommonTable
//               onRowClick={onRowClick}
//               indexedRows={indexedRows}
//               total={total}
//               columns={columns}
//               paginationModel={paginationModel} // Controlled model
//               setPaginationModel={model => {
//                 // Update state first
//                 setPaginationModel(model)

//                 // Destructure the updated page and pageSize for clarity
//                 const { page, pageSize } = model

//                 // Fetch table data with the updated page and pageSize
//                 fetchTableData({
//                   sort,
//                   q: searchValue,
//                   column: sortColumn,
//                   status,
//                   page: page + 1, // Convert to 1-indexed pages for API
//                   limit: pageSize,
//                   filterByPharmacyId: filterByPharmacyId === 'all' ? '' : filterByPharmacyId
//                 })
//               }}
//               handleSortModel={handleSortModel}
//               loading={loading}
//             />
//           </Grid>
//         </Card>

//         {show && (
//           <>
//             <CardContent>
//               <Grid container>
//                 <CommonDialogBox
//                   title={
//                     <div
//                       style={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center'
//                       }}
//                     >
//                       <div>Product Details - {productDetails?.request_number}</div>
//                       {selectedPharmacy.type === 'local' &&
//                         selectedPharmacyId == selectedPharmacy.id &&
//                         (selectedPharmacy.permission.key === 'allow_full_access' ||
//                           selectedPharmacy.permission.key === 'ADD') &&
//                         productDetails.status === 'Pending' && (
//                           <Grid
//                             sx={{
//                               display: 'flex',
//                               alignItems: 'flex-end',
//                               justifyContent: 'flex-end'
//                             }}
//                           >
//                             <IconButton
//                               size='small'
//                               sx={{ mr: 0.5 }}
//                               aria-label='Edit'
//                               onClick={() => handleEdit(itemId)}
//                             >
//                               <Icon icon='mdi:pencil-outline' />
//                             </IconButton>
//                           </Grid>
//                         )}
//                     </div>
//                   }
//                   dialogBoxStatus={show}
//                   formComponent={
//                     <ProductDetail
//                       setShow={setShow}
//                       statusCall={statusCall}
//                       submitLoader={submitLoader}
//                       detailsData={detailsData}
//                       handleRequestStatus={handleRequestStatus}
//                       prescriptionImages={prescriptionImages}
//                       reasonText={reasonText}
//                       setReasonText={setReasonText}
//                       imgUrl={imgUrl}
//                       itemId={itemId}
//                       handleEdit={handleEdit}
//                       productDetails={productDetails}
//                       selectedPharmacyId={selectedPharmacyId}
//                     />
//                   }
//                   close={() => {
//                     setShow(false)
//                     setProductDetails({})
//                     setDetailsData([])
//                   }}
//                   show={() => setShow(true)}
//                 />
//               </Grid>
//             </CardContent>
//           </>
//         )}
//       </>
//     )
//   }

//   return (
//     <>
//       {loader ? (
//         <FallbackSpinner />
//       ) : (
//         <TabContext value={status}>
//           <TabList onChange={handleChange}>
//             <Tab
//               sx={{ ml: { xs: 1, sm: 3 } }} // Adjust margin for tabs
//               value='Approved'
//               label={<TabBadge label='Approved' totalCount={status === 'Approved' ? total : null} />}
//             />

//             <Tab
//               value='Pending'
//               label={<TabBadge label='Pending' totalCount={status === 'Pending' ? total : null} />}
//             />

//             <Tab
//               value='Cancelled'
//               label={<TabBadge label='Cancelled' totalCount={status === 'Cancelled' ? total : null} />}
//             />
//             <Tab
//               value='Rejected'
//               label={<TabBadge label='Rejected' totalCount={status === 'Rejected' ? total : null} />}
//             />
//           </TabList>
//           <TabPanel value='Approved'>{tableData()}</TabPanel>
//           <TabPanel value='Pending'>{tableData()}</TabPanel>

//           <TabPanel value='Cancelled'>{tableData()}</TabPanel>
//           <TabPanel value='Rejected'>{tableData()}</TabPanel>
//         </TabContext>
//       )}
//     </>
//   )
// }
