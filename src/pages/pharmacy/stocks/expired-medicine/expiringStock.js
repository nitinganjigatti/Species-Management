import React, { useState, useEffect, useCallback } from 'react'

import { aboutExpiringProduct } from 'src/lib/api/pharmacy/getStocksReportById'
import FallbackSpinner from 'src/@core/components/spinner'
import { debounce } from 'lodash'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import { Typography, Grid, Tooltip, Box } from '@mui/material'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { ExportButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import StockReportSkeleton from 'src/views/utility/SkeletonLoading/StockReportSkeleton'

const ExpiringMedicine = () => {
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [searchTriggered, setSearchTriggered] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })

  const [filterDates, setFilterDates] = useState({
    startDate: Utility?.formattedPresentDate(),
    endDate: Utility?.getFeaturesDates(new Date(), 7)
  })
  const [selectDays, setSelectDays] = useState(7)

  const [excelLoader, setExcelLoader] = useState(false)
  const [tableLoader, setTableLoader] = useState(false)

  const [stores, setStores] = useState([])
  const [errors, setErrors] = useState('')

  const [storeId, setStoreId] = useState(selectedPharmacy.id)
  function loadServerRows(currentPage, data) {
    return data
  }

  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { column: 'type' } })
      if (response?.data?.list_items?.length > 0) {
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStores(response?.data?.list_items)
        if (response?.data?.list_items.length > 0) {
        }
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      console.error('error', error)
    }
  }

  const fetchTableData = useCallback(
    async (sort, q, column, startDate, endDate, id) => {
      if (!searchTriggered && q) return
      try {
        setTableLoader(true)
        let selectedStorePharmacy = selectedPharmacy?.type === 'local' ? selectedPharmacy?.id : id

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          pending_days_start: startDate || filterDates?.startDate,
          pending_days_end: endDate || filterDates?.endDate,
          ...(selectedStorePharmacy !== 'all' && { store_id: selectedStorePharmacy }),
          is_medical_only: 1
        }

        const res = await aboutExpiringProduct({ params })
        if (res?.data?.length > 0) {
          setTotal(parseInt(res?.count))
          setRows(loadServerRows(paginationModel.page, res?.data))
        } else {
          setTotal(0)
          setRows([])
        }
        setTableLoader(false)
      } catch (error) {
        console.error('Error fetching table data:', error)
        setTotal(0)
        setRows([])
        setTableLoader(false)
      }
    },
    [paginationModel, filterDates, searchTriggered, selectedPharmacy.id, storeId]
  )

  useEffect(() => {
    if (stores?.length === 0) {
      getStoresLists()
    }
    fetchTableData(sort, searchValue, sortColumn, filterDates?.startDate, filterDates?.endDate, storeId)
  }, [fetchTableData, selectedPharmacy.id, filterDates, storeId])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(prev => (prev === 'asc' ? 'desc' : 'asc'))

      // setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(
        newModel[0].sort,
        searchValue,
        newModel[0].field,
        filterDates?.startDate,
        filterDates?.endDate,
        storeId
      )
    }
  }

  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchTriggered(true)
      fetchTableData(sort, value, sortColumn, filterDates?.startDate, filterDates?.endDate, storeId)
    }, 1000),
    [fetchTableData, sort, sortColumn, filterDates, selectedPharmacy]
  )

  const handleSearch = value => {
    setSearchValue(value)
    setSearchTriggered(false)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
    if (value.trim()) {
      debouncedSearch(value)
    }
  }

  const columns = [
    // {
    //   flex: 0.1,
    //   Width: 40,
    //   alignItems: 'right',
    //   field: 'id',
    //   headerName: 'SL',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.id + '.'}
    //     </Typography>
    //   )
    // },
    {
      width: 350,
      minWidth: 200,
      field: 'stock_item_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.stock_items_name}
            subTitle={params?.row?.generic_name}
            icon={params?.row?.image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
          />
        </Box>
      )
    },
    {
      ...(storeId === 'all' && {
        width: 200,
        field: 'store_name',
        headerName: 'Store Name',
        renderCell: params => (
          <Tooltip title={params.row.store_name} placement='top'>
            <Typography
              variant='body2'
              sx={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {params.row.store_name}
            </Typography>
          </Tooltip>
        )
      })
    },
    {
      width: 250,
      minWidth: 100,
      field: 'batch_no',
      headerName: 'Batch',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.batch_no}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'supplier_name',
    //   headerName: 'Supplier name',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.supplier_name ? params.row.supplier_name : 'NA'}
    //     </Typography>
    //   )
    // },
    {
      width: 250,
      minWidth: 100,
      field: 'expiry_date',
      headerName: 'Expiry Date',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },

    {
      width: 250,
      minWidth: 100,
      field: 'stock_qty',
      headerName: 'Qty',
      type: 'number',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.stock_qty}
        </Typography>
      )
    }
  ]

  const getDataToExport = async () => {
    try {
      setExcelLoader(true)
      let selectedStorePharmacy = selectedPharmacy?.type === 'local' ? selectedPharmacy?.id : storeId

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        pending_days_start: filterDates?.startDate,
        pending_days_end: filterDates?.endDate,
        ...(selectedStorePharmacy !== 'all' && { store_id: selectedStorePharmacy }),
        type: 'csv'
      }
      const response = await aboutExpiringProduct({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response?.data)
        setExcelLoader(false)
      } else {
        setExcelLoader(false)
      }
    } catch (error) {
      setExcelLoader(false)

      console.log('error', error)
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const formattedStartDate = formatDate(startDate)
      const formattedEndDate = formatDate(endDate)
      setFilterDates({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
    }
  }

  return (
    <>
      {loader ? (
        <StockReportSkeleton AboutToExpire selectedPharmacy={selectedPharmacy} />
      ) : (
        <>
          <PageCardLayout title={'About To Expire'}>
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, sm: 12, md: 3 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <MUISearch
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                  value={searchValue}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 12, md: 9 }}>
                <Grid
                  container
                  spacing={3}
                  sx={{
                    display: 'flex',
                    justifyContent: { xs: 'space-between', sm: 'flex-end' }
                  }}
                >
                  {selectedPharmacy.type === 'central' && (
                    <Grid item size={{ xs: 12, sm: 12, md: 4, lg: 3 }} sx={{ display: 'flex', alignItems: 'center' }}>
                      <MUIAutocomplete
                        label='Stores'
                        value={storeId}
                        valueType='id'
                        onChange={e => {
                          setStoreId(e)
                        }}
                        options={[{ id: 'all', name: 'All' }, ...stores]}
                        getOptionLabel={option => option.name}
                      />
                    </Grid>
                  )}
                  <Grid
                    item
                    size={{
                      xs: 12,
                      md: selectedPharmacy.type === 'central' ? 7 : 'auto',
                      lg: 'auto'
                    }}
                    sx={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <CommonDateRangePickers
                      onChange={handleDateRangeChange}
                      filterDates={filterDates}
                      showFutureDates={true}
                      useCustomText={true}
                      customText='Select Near Expiry'
                    />

                    <Grid item minWidth={'40px'}>
                      <ExportButton
                        loading={excelLoader}
                        onClick={getDataToExport}
                        disabled={total === 0 ? true : false}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid>
              <CommonTable
                onRowClick={''}
                indexedRows={indexedRows}
                total={total}
                columns={columns}
                paginationModel={paginationModel}
                handleSortModel={handleSortModel}
                setPaginationModel={setPaginationModel}
                loading={tableLoader}
                searchValue={searchValue}
              />
            </Grid>
          </PageCardLayout>
        </>
      )}
    </>
  )
}

export default ExpiringMedicine
