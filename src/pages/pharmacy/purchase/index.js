import React, { useState, useEffect, useCallback } from 'react'

import { getPurchaseList, printPurchaseInvoice } from 'src/lib/api/pharmacy/getPurchaseList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { debounce } from 'lodash'

// ** MUI Imports
import { Box, Typography, Grid } from '@mui/material'

// ** Icon Imports
import { format, subMonths } from 'date-fns'

import Router from 'next/router'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { ExcelExportButton } from 'src/components/Buttons'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { ExportButton } from 'src/views/utility/render-snippets'
import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
import toast from 'react-hot-toast'
import Utility, { downloadPDF } from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
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
      await downloadPDF({
        apiCall: printPurchaseInvoice,
        params: purchaseId,
        fileName: `Purchase_Invoice${Date.now()}.pdf`
      })
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
            fontWeight: 500
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
            fontWeight: 500
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
            fontWeight: 500
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
            fontWeight: 500
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
            fontWeight: 500
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
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        type: 'csv'
      }
      const response = await getPurchaseList({ params })

      if (response?.success === true && response?.data?.length > 0) {
          Utility.downloadFileFromURL(response?.data, Utility.extractHoursAndMinutes)
          setExcelLoader(false)
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
            whiteSpace: 'nowrap',
            width: { xs: '100%' }
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
            styles={{
              mr: 0
            }}
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
      {selectedPharmacy.type === 'central' &&
        (loader ? (
          <FallbackSpinner />
        ) : (
          <PageCardLayout title='Inventory List' action={headerAction}>
            <Grid
              container
              sx={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Grid item size={{ xs: 12, sm: 12, md: 4.5, lg: 4.5 }}>
                <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4, lg: 3.5 }}>
                <MUIAutocomplete
                  value={selectedSupplier}
                  label='Supplier'
                  valueType='id'
                  onChange={newValue => {
                    setTotal(0)
                    setPaginationModel({ page: 0, pageSize: 50 })
                    setSelectedSupplier(newValue)
                    setSearchValue('')
                  }}
                  getOptionLabel={option => option.company_name}
                  options={suppliers}
                />
              </Grid>
              <Grid
                size={{ xs: 12, sm: 12, md: 3, lg: 3.5 }}
                sx={{
                  display: 'flex',
                  gap: '24px'
                }}
              >
                <MUISearch
                  width={'100%'}
                  placeholder='Search...'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  onClear={() => handleSearch('')}
                />

                <Grid size={{ xs: 'auto' }}>
                  <ExportButton
                    loading={excelLoader}
                    onClick={getInventoryDataToExport}
                    disabled={total === 0 ? true : false}
                  />
                </Grid>
              </Grid>
            </Grid>
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
          </PageCardLayout>
        ))}
    </>
  )
}

export default ListOfPurchase
