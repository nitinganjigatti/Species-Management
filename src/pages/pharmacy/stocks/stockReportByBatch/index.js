import React, { useState, useEffect, useCallback } from 'react'

import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getStocksByBatch } from 'src/lib/api/pharmacy/getStocksByBatch'

import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { Box, Card, CardHeader, LinearProgress, debounce, Tooltip } from '@mui/material'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import StockMedicineConfigure from 'src/components/pharmacy/stock/StockMedicineConfigure'
import Utility from 'src/utility'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { DataGrid } from '@mui/x-data-grid'
import toast from 'react-hot-toast'

const ListOfStocksByBatch = () => {
  const [stores, setStores] = useState([])

  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('asc')
  const [stockReport, setStockReport] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const [stockId, setStockId] = useState('')
  const [loader, setLoader] = useState(false)
  const [errors, setErrors] = useState('')
  const [configureMedId, setConfigureMedId] = useState('')
  const [show, setShow] = useState(false)
  const { selectedPharmacy } = usePharmacyContext()

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const getStocksReport = useCallback(
    async ({ sort, q, column, id }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }
        const result = await getStocksByBatch(id, params)
        if (result?.data?.length === 0) {
          toast.success('There is no stock for this store')
        }
        if (result.success === true && result?.data?.length > 0) {
          setTotal(parseInt(result?.count))

          let listWithId = result.data
            ? result.data.map((el, i) => {
                return { ...el, uid: i + 1 }
              })
            : []
          setStockReport(loadServerRows(paginationModel.page, listWithId))
          setLoading(false)
        } else {
          setTotal(0)
          setStockReport([])
          setLoading(false)
        }
      } catch (error) {
        setTotal(0)
        setStockReport([])
        console.log('error', error)
        setLoading(false)
      }

      // }
    },
    [paginationModel]
  )

  const indexedRows = stockReport?.map((row, index) => ({
    ...row,
    id: `${row.id}_${index}`,
    sl_no: index + 1
  }))

  const handleSearch = useCallback(
    debounce(async (value, id) => {
      setSearchValue(value)
      try {
        await getStocksReport({
          sort,
          q: value,
          column: sortColumn,
          id

          // id: stockId
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { type: 'local' } })
      if (response?.data?.list_items?.length > 0) {
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStores(response?.data?.list_items)
        if (response?.data?.list_items.length > 0) {
          setStockId(response?.data?.list_items[0].id)
          getStocksReport({ sort, q: searchValue, column: sortColumn, id: response?.data?.list_items[0].id })
        }
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      console.log('error', error)
    }
  }

  useEffect(() => {
    if (stockId !== '') {
      getStocksReport({ sort, q: searchValue, column: sortColumn, id: stockId })
    }
  }, [getStocksReport])

  useEffect(() => {
    getStoresLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_items_name',
      headerName: 'MEDICINE NAME',
      renderCell: params => (
        <Tooltip title={params.row.stock_items_name} placement='top'>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.stock_items_name}
          </Typography>
        </Tooltip>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'unit_name',
    //   headerName: 'UOM',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.unit_name}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'batch_no',
      headerName: 'BATCH NUMBER',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'EXPIRY DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'leaf_name',
    //   headerName: 'LEAF',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.leaf_name}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_qty',
      headerName: 'QTY.IN STORE',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.stock_qty) > 0 ? params.row.stock_qty : 0}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'stock_box_qty',
    //   headerName: 'STOCK BOX',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.stock_box_qty}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'stock_purchase_price',
    //   headerName: 'STOCK PURCHASE PRICE',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.stock_purchase_price}
    //     </Typography>
    //   )
    // },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //       <IconButton
    //         size='small'
    //         sx={{ mr: 0.5 }}
    //         onClick={() => {
    //           setConfigureMedId(params.row.stock_item_id)
    //           showDialog()
    //         }}
    //       >
    //         <Icon icon='grommet-icons:configure' />
    //       </IconButton>
    //     </Box>
    //   )
    // }
  ]

  const createForm = () => {
    return (
      <>
        {/* <Grid
        container
        gap={3}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyItems: 'center',
          mx: 6,
          my: 4
        }}
      > */}
        {/* <Grid item lg={2}> */}
        <FormControl sx={{ width: 250 }}>
          <InputLabel id='controlled-select-label'>Stores</InputLabel>
          <Select
            onChange={e => {
              let id = e.target.value
              setStockId(id)
              setStockReport([])
              setConfigureMedId('')
              setErrors('')
              getStocksReport({ sort, q: searchValue, column: sortColumn, id })
            }}
            label='Stores'
            value={stockId}
            id='controlled-select'
            labelId='controlled-select-label'
            sx={{ width: '100%' }}
          >
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
        {/* </Grid> */}

        {/* <Grid item lg={2}>
          <Button
            size='large'
            sx={{ py: 3 }}
            variant='contained'
            onClick={() => {
              // getStocksReport()
            }}
          >
            Find
          </Button>
        </Grid> */}
        {/* </Grid> */}
      </>
    )
  }

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
                formComponent={
                  <StockMedicineConfigure configureMedId={configureMedId} storeId={stockId} close={closeDialog} />
                }
                close={closeDialog}
                show={showDialog}
              />

              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant='h6'>Stock report Store wise</Typography>

                      {createForm()}
                    </Box>
                  }

                  // action={createForm}
                />
                {indexedRows.length > 0 ? (
                  <DataGrid
                    autoHeight
                    hideFooterSelectedRowCount
                    disableColumnSelector={true}
                    pagination
                    rows={indexedRows === undefined ? [] : indexedRows}
                    rowCount={total}
                    columns={columns}
                    sortingMode='server'
                    paginationMode='server'
                    pageSizeOptions={[7, 10, 25, 50]}
                    paginationModel={paginationModel}
                    slots={{ toolbar: ServerSideToolbarWithFilter }}
                    onPaginationModelChange={setPaginationModel}
                    loading={loading}
                    disableColumnMenu
                    slotProps={{
                      baseButton: {
                        variant: 'outlined'
                      },
                      toolbar: {
                        value: searchValue,
                        clearSearch: () => handleSearch('', stockId),
                        onChange: event => {
                          setSearchValue(event.target.value)

                          return handleSearch(event.target.value, stockId)
                        }
                      }
                    }}

                    // onRowClick={onRowClick}
                  />
                ) : loading ? (
                  <LinearProgress />
                ) : null}
              </Card>
            </>
          )}
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default ListOfStocksByBatch
