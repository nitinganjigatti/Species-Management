import React, { useState, useEffect, useCallback } from 'react'

import { getExpiredMedicine } from 'src/lib/api/pharmacy/getStocksReportById'
import FallbackSpinner from 'src/@core/components/spinner'
import { debounce } from 'lodash'
import Typography from '@mui/material/Typography'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { ExportButton } from 'src/views/utility/render-snippets'

import { Grid, Tooltip, Box } from '@mui/material'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import StockReportSkeleton from 'src/views/utility/SkeletonLoading/StockReportSkeleton'

const ExpiredMedicine = () => {
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })

  const [excelLoader, setExcelLoader] = useState(false)
  const [tableLoader, setTableLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }
  const [errors, setErrors] = useState('')
  const [stores, setStores] = useState([])

  const [storeId, setStoreId] = useState(selectedPharmacy.id)

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
    async (sort, q, column, selectedStoreId) => {
      let selectedStorePharmacy = selectedPharmacy.type === 'local' ? selectedPharmacy.id : selectedStoreId
      try {
        setTableLoader(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ...(selectedStorePharmacy !== 'all' && { store_id: selectedStorePharmacy })
        }

        await getExpiredMedicine({ params }).then(res => {
          if (res?.list_items?.length > 0) {
            setTotal(parseInt(res?.total_count))
            setRows(loadServerRows(paginationModel.page, res.list_items))
            setTableLoader(true)
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setTableLoader(false)
      } catch (error) {
        console.log('error', error)
        setTotal(0)
        setRows([])
        setTableLoader(false)
      }
    },
    [paginationModel, selectedPharmacy.id]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, storeId)

    if (stores?.length === 0) {
      getStoresLists()
    }
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, storeId)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, storeId) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, storeId)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, storeId)
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
    //       {params.row.id + "."}
    //     </Typography>
    //   )
    // },
    {
      width: 350,
      minWidth: 100,
      field: 'stock_item_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.stock_item_name}
            subTitle={params?.row?.generic_name}
            icon={params?.row?.image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
          />
        </Box>
      )
    },
    ...(storeId === 'all'
      ? [
          {
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
          }
        ]
      : []),
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
      sortable: false,
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
      let selectedStorePharmacy = selectedPharmacy?.type === 'local' ? selectedPharmacy.id : storeId

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        ...(selectedStorePharmacy !== 'all' && { store_id: selectedStorePharmacy }),
        type: 'csv'
      }
      const response = await getExpiredMedicine({ params })
      if (response) {
        Utility.downloadFileFromURL(response)
        setExcelLoader(false)
      } else {
        setExcelLoader(false)
      }
    } catch (error) {
      setExcelLoader(false)

      console.log('error', error)
    }
  }

  return (
    <>
      {loader ? (
        <StockReportSkeleton ExpiredProducts />
      ) : (
        <>
          <PageCardLayout title={'Expired Products'}>
            <Grid container spacing={3} alignItems={'center'} justifyContent={'space-between'}>
              <Grid item size={{ xs: 12, md: 3.5 }}>
                <MUISearch
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                  value={searchValue}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 12, md: 8 }}>
                <Grid
                  container
                  sx={{
                    display: 'flex',
                    justifyContent: {
                      xs: selectedPharmacy.type === 'central' ? 'space-between' : 'flex-end',
                      md: 'flex-end'
                    },
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {selectedPharmacy.type === 'central' && (
                    <Grid item size={{ xs: 'grow', md: 5 }}>
                      <MUIAutocomplete
                        value={storeId}
                        label='Stores'
                        valueType='id'
                        onChange={e => {
                          let id = e

                          setStoreId(id)
                        }}
                        options={stores}
                      />
                    </Grid>
                  )}

                  <Grid item>
                    <ExportButton
                      loading={excelLoader}
                      onClick={getDataToExport}
                      disabled={total === 0 ? true : false}
                    />
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

export default ExpiredMedicine
