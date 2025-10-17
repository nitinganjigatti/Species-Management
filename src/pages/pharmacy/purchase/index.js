import React, { useState, useEffect, useCallback } from 'react'

import { getPurchaseList, printPurchaseInvoice } from 'src/lib/api/pharmacy/getPurchaseList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import {
  Card,
  CardHeader,
  Typography,
  Grid,
  TextField,
  CardContent,
  InputAdornment,
  Autocomplete,
  MenuItem,
  Switch,
  FormControl,
  InputLabel,
  Tooltip,
  Select
} from '@mui/material'

// ** Icon Imports
import { Box } from '@mui/material'
import { format, subMonths } from 'date-fns'

import Router from 'next/router'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { ExcelExportButton } from 'src/components/Buttons'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { ExportButton } from 'src/views/utility/render-snippets'
import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
import toast from 'react-hot-toast'
import Utility from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const ListOfPurchase = () => {
  const router = useRouter()
  const theme = useTheme()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'po_date')

  const [filterDates, setFilterDates] = useState({
    startDate:
      router.query.from_date === ''
        ? ''
        : router.query.from_date || Utility.formatDate(format(subMonths(new Date(), 1), 'dd MMM, yyyy')),
    endDate:
      router.query.to_date === '' ? '' : router.query.to_date || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })
  const [loading, setLoading] = useState(false)
  const [excelLoader, setExcelLoader] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState(router.query.supplier || 'All')
  const [invoicePrintLoaderId, setInvoicePrintLoaderId] = useState(null)

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async ({ sort, q, column, filterDates }) => {
      try {
        setLoading(true)

        const isEmptyDates = filterDates?.startDate === '' && filterDates?.endDate === ''

        const params = {
          sort,
          q,
          column,
          ...(isEmptyDates
            ? { from_date: '', to_date: '' }
            : filterDates?.startDate && filterDates?.endDate
            ? { from_date: filterDates.startDate, to_date: filterDates.endDate }
            : {}),
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ...(selectedSupplier !== 'All' && { supplier_id: selectedSupplier })
        }

        await getPurchaseList({ params }).then(res => {
          if (res?.success === true && res?.data?.length > 0) {
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))

            const urlParams = {
              sort,
              q,
              column,
              page: paginationModel?.page,
              limit: paginationModel?.pageSize,
              ...(isEmptyDates
                ? { from_date: '', to_date: '' }
                : filterDates?.startDate && filterDates?.endDate
                ? { from_date: filterDates.startDate, to_date: filterDates.endDate }
                : {}),
              supplier: selectedSupplier
            }

            updateUrlParams(urlParams)
          } else {
            setTotal(0)
            setRows([])
          }
        })

        setLoading(false)
      } catch (error) {
        console.log('error', error)
        setLoading(false)
        setTotal(0)
        setRows([])
      }
    },
    [paginationModel, filterDates, selectedSupplier]
  )
  useEffect(() => {
    if (filterDates?.startDate !== undefined && filterDates?.endDate !== undefined) {
      fetchTableData({ sort, q: searchValue, column: sortColumn, filterDates })

      updateUrlParams({
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize,
        from_date: filterDates?.startDate || '',
        to_date: filterDates?.endDate || '',
        supplier: selectedSupplier
      })
    }
  }, [selectedPharmacy.id, paginationModel.page, paginationModel.pageSize, filterDates, selectedSupplier])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field, filterDates })
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        supplier: selectedSupplier
      })
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, filterDates) => {
      setSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 50 })
      try {
        await fetchTableData({ sort, q, column, filterDates })
        updateUrlParams({
          sort: sort,
          q: q,
          column: column,
          page: paginationModel?.page,
          limit: paginationModel?.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          supplier: selectedSupplier
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/purchase/add-purchase/',
      query: { id: id, action: 'edit' }
    })
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, filterDates)
  }

  const handleDateRangeChange = (startDate, endDate) => {
    setPaginationModel({ page: 0, pageSize: 50 })
    if (startDate && endDate) {
      setFilterDates({
        startDate: Utility.formatDate(startDate),
        endDate: Utility.formatDate(endDate)
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
    }
  }

  const getSuppliersLists = async () => {
    try {
      const response = await getSuppliers({})

      if (response.data.data.list_items?.length > 0) {
        const options = [{ id: 'All', company_name: 'All' }, ...response.data.data.list_items]
        setSuppliers(options)
      }
    } catch (error) {
      console.log('supplier error', error)
    }
  }

  const printInventory = async purchaseId => {
    try {
      setInvoicePrintLoaderId(purchaseId)
      const printInvoice = await printPurchaseInvoice(purchaseId)
      if (printInvoice?.success && printInvoice?.data) {
        Utility?.downloadFileFromURL(printInvoice?.data, 'Invoice.Pdf')
        toast.success(printInvoice?.message)
        setInvoicePrintLoaderId(null)
      } else {
        toast.error(printInvoice?.message)
        setInvoicePrintLoaderId(null)
      }
    } catch (error) {
      toast.error(error?.message)
      setInvoicePrintLoaderId(null)
    } finally {
      setInvoicePrintLoaderId(null)
    }
  }

  const columns = [
    {
      width: 80,
      headerName: 'SL.NO',
      sortable: false,
      field: 'id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl + '.'}
        </Typography>
      )
    },
    {
      minWidth: 140,
      field: 'po_date',
      headerName: 'Purchase Date',
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
          {Utility.formatDisplayDate(params.row.po_date)}
        </Typography>
      )
    },

    {
      width: 120,
      field: 'po_no',
      headerName: 'Invoice NO',
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
          {params.row.po_no}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'supplier_name',
      headerName: 'SUPPLIER NAME',
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
          {params.row.supplier_name}
        </Typography>
      )
    },
    {
      minWidth: 120,
      field: 'created_at',
      headerName: 'Entry Date',
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
          {Utility.formatDisplayDate(params.row.created_at)}
        </Typography>
      )
    },
    {
      minWidth: 180,
      field: 'net_amount',
      headerName: 'Purchase Amount(₹)',
      type: 'number',
      align: 'right',
      headerAlign: 'right',
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
          {Utility.formatAmountToReadableDigit(params?.row?.net_amount)}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'created_by',
      headerName: 'Created by ',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
      )
    },
    {
      minWidth: 250,
      field: 'updated_by',
      headerName: 'Updated by',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_updated_profile_pic}
            user_name={params?.row?.updated_by_user_name}
            date={params?.row?.updated_at}
          />
        </>
      )
    },
    {
      minWidth: 80,
      headerName: 'Action',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      field: 'action',
      renderCell: params => (
        <ExportButton
          bgcolor='transparent'
          tooltip='Download  Invoice'
          loading={invoicePrintLoaderId === params.row.id}
          onClick={event => {
            event.stopPropagation()
            printInventory(params.row.id)
          }}
        />
      )
    }
  ]
  useEffect(() => {
    getSuppliersLists()
  }, [])

  const getInventoryDataToExport = async () => {
    try {
      setExcelLoader(true)

      const now = new Date()

      const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
      }
      const response = await getPurchaseList({ params })
      setExcelLoader(false)

      if (response?.success === true && response?.data?.length > 0) {
        const data = response.data.map(el => ({
          ['Invoice No']: el?.po_no,
          ['Purchase Date']: el?.po_date,
          ['Supplier Name']: el?.supplier_name,
          ['Entry Date']: Utility.formatDisplayDate(el?.created_at) ? Utility.formatDisplayDate(el?.created_at) : 'NA',
          ['Purchase Amount']: Number(el?.net_amount),
          ['Created By']: el?.created_by_user_name ? el?.created_by_user_name : 'NA',
          ['Updated By']: el?.updated_by_user_name ? el?.updated_by_user_name : 'NA',
          ['Created At']: Utility.formatDisplayDate(el?.created_at) ? Utility.formatDisplayDate(el?.created_at) : 'NA',
          ['Updated At']: Utility.formatDisplayDate(el?.updated_at) ? Utility.formatDisplayDate(el?.updated_at) : 'NA'
        }))

        Utility.exportToCSV(data, `Purchase_list ${timestamp}`)
      } else {
        console.log('No data available for export.')
      }
    } catch (error) {
      console.log('Error >', error)
      setExcelLoader(false)
    }
  }

  const headerAction = (
    <>
      {(selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: { xs: 'center', sm: 'flex-start' },
            whiteSpace: 'nowrap'
          }}
        >
          {/* <ExcelExportButton
            disabled={total === 0}
            action={() => {
              getInventoryDataToExport()
            }}
            loader={excelLoader}
            title='Download'
            fullWidth='fullWidth'
          /> */}
          <ExcelExportButton
            action={() => {
              Router.push({
                pathname: '/pharmacy/purchase/import-purchases/'
              })
            }}
            title='Import Inventory'
            fullWidth='fullWidth'
          />
          <AddButtonContained
            title='Add Inventory'
            action={() => Router.push({ pathname: '/pharmacy/purchase/add-purchase/' })}
            fullWidth='fullWidth'
          />
        </Box>
      )}
    </>
  )

  const onRowClick = params => {
    if (
      selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD')
    ) {
      handleEdit(params.row.id)
    }
  }

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <Card>
            <CardHeader
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                width: '100%',
                '& .MuiCardHeader-content': {
                  flexGrow: 1
                },
                '& .MuiCardHeader-action': {
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'stretch',
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  gap: 1,
                  width: { xs: '100%', sm: 'auto' }
                }
              }}
              title={RenderUtility.pageTitle('Inventory List')}
              action={headerAction}
            />

            <CardContent sx={{ paddingTop: '4px' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: { xs: 2, sm: 0 },
                  width: '100%'
                }}
              >
                <Grid
                  container
                  spacing={4}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Grid item size={{ xs: 12, sm: 5, md: 5 }}>
                    <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
                  </Grid>
                  <Grid
                    item
                    size={{ xs: 12, sm: 7 / 2, md: 7 / 2, lg: 7 / 2 }}
                    sx={{
                      my: 0
                    }}
                  >
                    <FormControl fullWidth>
                      <InputLabel id='controlled-select-label'>Supplier</InputLabel>
                      <Select
                        fullWidth
                        onChange={e => {
                          let id = e.target.value

                          setSelectedSupplier(id)
                        }}
                        label='Supplier'
                        value={selectedSupplier}
                        id='controlled-select'
                        labelId='controlled-select-label'
                        sx={{ width: '100%' }}
                        size='small'
                      >
                        {suppliers.length > 0 &&
                          suppliers.map(el => {
                            return (
                              <MenuItem key={el.id} value={el.id}>
                                {el.company_name}
                              </MenuItem>
                            )
                          })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid
                    item
                    size={{ xs: 12, sm: 7 / 2, md: 7 / 2 }}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TextField
                      fullWidth
                      variant='outlined'
                      size='small'
                      placeholder='Search...'
                      value={searchValue}
                      onChange={e => handleSearch(e.target.value)}
                      sx={{
                        borderRadius: '8px'
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Icon
                                icon='mi:search'
                                fontSize={24}
                                color={theme.palette.customColors.neutralSecondary}
                              />
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                    <ExportButton
                      loading={excelLoader}
                      onClick={getInventoryDataToExport}
                      disabled={total === 0 ? true : false}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid>
                <CommonTable
                  onRowClick={onRowClick}
                  indexedRows={indexedRows}
                  total={total}
                  columns={columns}
                  paginationModel={paginationModel}
                  onPaginationModelChange={model => {
                    setPaginationModel(model)
                    router.replace({
                      pathname: router.pathname,
                      query: {
                        ...router.query,
                        page: model.page + 1,
                        pageSize: model.pageSize,
                        searchValue,
                        sort,
                        sortColumn
                      }
                    })
                  }}
                  handleSortModel={handleSortModel}
                  setPaginationModel={setPaginationModel}
                  loading={loading}
                  searchValue={searchValue}
                />
              </Grid>
            </CardContent>
          </Card>
        )
      ) : null}
    </>
  )
}

export default ListOfPurchase
