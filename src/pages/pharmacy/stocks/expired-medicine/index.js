import React, { useState, useEffect, useCallback } from 'react'

import { getExpiredMedicine } from 'src/lib/api/pharmacy/getStocksReportById'
import FallbackSpinner from 'src/@core/components/spinner'
import { debounce } from 'lodash'
import Typography from '@mui/material/Typography'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { ExportButton } from 'src/views/utility/render-snippets'

import {
  Card,
  CardHeader,
  Grid,
  MenuItem,
  Tooltip,
  TextField,
  FormControl,
  Select,
  InputLabel,
  FormHelperText,
  InputAdornment,
  Box
} from '@mui/material'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

const ExpiredMedicine = () => {
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)

  const [excelLoader, setExcelLoader] = useState(false)

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
        setLoading(true)

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
            setRows(
              loadServerRows(
                paginationModel.page,
                res?.list_items?.sort((a, b) => a?.stock_item_name?.localeCompare(b?.stock_item_name))
              )
            )
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
    [paginationModel, selectedPharmacy.id, storeId]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, storeId)

    if (stores?.length === 0) {
      getStoresLists()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                fontWeight: 500,
                fontFamily: 'Inter'
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
            fontWeight: 500,
            fontFamily: 'Inter'
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
            fontWeight: 500,
            fontFamily: 'Inter'
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
            fontWeight: 500,
            fontFamily: 'Inter'
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
      let selectedStorePharmacy = selectedPharmacy.type === 'local' ? selectedPharmacy.id : storeId

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        ...(selectedStorePharmacy !== 'all' && { store_id: selectedStorePharmacy })
      }
      const result = await getExpiredMedicine({ params })

      if (result?.list_items.length > 0) {
        const data = result?.list_items.map(el => {
          return {
            ['Medicine Name']: el?.stock_item_name,
            ['Batch']: el?.batch_no,
            ['Expire Date']: el?.expiry_date,
            ['Quantity']: el?.stock_qty,
            ['Store Name']: el?.store_name
          }
        })

        Utility.exportToCSV(data, `expired_products_datetime ${Utility.convertUTCToLocal(new Date())}`)
        setExcelLoader(false)
      } else {
        setExcelLoader(false)
      }
    } catch (error) {
      setExcelLoader(false)

      console.log('error', error)
    }
  }

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }
  if (loading) {
    return <FallbackSpinner />
  }

  // if (isError) {
  //   return <h1>{error.message}</h1>
  // }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', sm: 'space-between' },
                alignItems: { xs: 'flex-start', sm: 'flex-start' },
                flexDirection: { xs: 'column', sm: 'row' },
                '& .MuiCardHeader-title': {
                  fontSize: { xs: '18px', sm: '20px', md: '24px' },
                  flexGrow: 1
                },
                '& .MuiCardHeader-action': {
                  mt: 3,
                  width: { xs: '100% ', sm: 'auto' }
                },
                mx: { xs: -2, sm: 1 }
              }}
              title={RenderUtility.pageTitle('Expired Products')}

              // action={

              // }
            />

            <Grid
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',

                mx: { xs: 2, sm: 6, md: 6, lg: 6 }
              }}
            >
              <Grid item size={{ xs: 12, md: 8, lg: 8 }}>
                <TextField
                  variant='outlined'
                  size='small'
                  placeholder='Search...'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  sx={{
                    borderRadius: '8px'
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>

              <Grid sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                {selectedPharmacy.type === 'central' && (
                  <Grid item size={{ xs: 12, md: 4, lg: 4 }}>
                    <FormControl
                      sx={{
                        width: { xs: '100%', md: 200, lg: 200 },
                        mx: { xs: 0, md: 2, lg: 2 },
                        my: { xs: 2, md: 0, lg: 0 }
                      }}
                    >
                      <InputLabel id='controlled-select-label'>Stores</InputLabel>
                      <Select
                        onChange={e => {
                          let id = e.target.value

                          // const store = id === 'all' ? '' : id

                          // const type = stores.find(el => el.id === id)?.type || ''

                          // setStockType(type)
                          setStoreId(id)

                          // let storeId = id === 'all' ? 'all' : id
                        }}
                        label='Stores'
                        value={storeId}
                        id='controlled-select'
                        labelId='controlled-select-label'
                        sx={{ width: '100%' }}
                        size='small'
                      >
                        <MenuItem value='all'>All</MenuItem>
                        {stores.length > 0
                          ? stores.map(el => {
                              return (
                                <MenuItem key={el.id} value={el.id}>
                                  {el.name}
                                </MenuItem>
                              )
                            })
                          : null}
                      </Select>
                      <FormHelperText sx={{ color: 'red' }}>{errors}</FormHelperText>
                    </FormControl>
                  </Grid>
                )}

                <Grid
                  item
                  size={{ xs: 12, md: 4, lg: 4 }}
                  sx={{
                    my: selectedPharmacy.type === 'central' ? 0 : 2
                  }}
                >
                  <ExportButton loading={excelLoader} onClick={getDataToExport} disabled={total === 0 ? true : false} />
                </Grid>
              </Grid>
            </Grid>

            <Grid
              sx={{
                mx: { xs: 2, sm: 5 }
              }}
            >
              <CommonTable
                onRowClick={''}
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
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              // columnVisibilityModel={{
              //   id: false
              // }}
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              total
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
                  onChange: event => handleSearch(event.target.value)
                }
              }}

              // onRowClick={onRowClick}
            /> */}
          </Card>
        </>
      )}
    </>
  )
}

export default ExpiredMedicine
