import React, { useState, useEffect, useCallback } from 'react'

import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'

import TabList from '@mui/lab/TabList'

import { getStocksReportById, getLocalStocksReportById } from 'src/lib/api/pharmacy/getStocksReportById'
import { getStocksByBatch } from 'src/lib/api/pharmacy/getStocksByBatch'

import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Card, CardHeader, Grid, debounce } from '@mui/material'

import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import StockMedicineConfigure from 'src/components/pharmacy/stock/StockMedicineConfigure'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'

const ListOfStocks = () => {
  // const TabList = styled(MuiTabList)(({ theme }) => ({
  //   '& .MuiTabs-indicator': {
  //     display: 'none'
  //   },
  //   '& .Mui-selected': {
  //     backgroundColor: theme.palette.primary.main,
  //     color: 'white'

  //     // color: theme.palette.common.white
  //   },
  //   '& .MuiTab-root': {
  //     minHeight: 38,
  //     minWidth: 110,
  //     borderRadius: 8,
  //     paddingTop: theme.spacing(2),
  //     paddingBottom: theme.spacing(2)
  //   }
  // }))

  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('asc')
  const [stockReport, setStockReport] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('stock_items_name')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const [batchLoading, setBatchLoading] = useState(false)
  const [batchSort, setBatchSort] = useState('asc')
  const [stockReportBatch, setStockReportBatch] = useState([])
  const [batchSearchValue, setBatchSearchValue] = useState('')
  const [batchSortColumn, setBatchSortColumn] = useState('stock_items_name')
  const [batchTotal, setBatchTotal] = useState(0)
  const [batchPaginationModel, setBatchPaginationModel] = useState({ page: 0, pageSize: 10 })

  const [stockId, setStockId] = useState('')
  const [loader, setLoader] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [show, setShow] = useState(false)
  const [value, setValue] = useState('1')

  const { selectedPharmacy } = usePharmacyContext()

  // console.log('selectedPharmacy', selectedPharmacy)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const closeDialog = () => {
    setConfigureMedId('')
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  function loadServerRows(currentPage, data) {
    return data
  }
  function loadBatchServerRows(currentPage, data) {
    return data
  }

  const getStocksReport = useCallback(
    async ({ sort, q, column, id }) => {
      if (id) {
        if (selectedPharmacy?.type == 'local') {
          try {
            setLoading(true)

            const params = {
              sort,
              q,
              column,
              page: paginationModel.page + 1,
              limit: paginationModel.pageSize
            }
            const result = await getLocalStocksReportById(params)
            if (result.success === true && result.data.length > 0) {
              setTotal(parseInt(result?.count))

              let listWithId = result.data
                ? result.data.map((el, i) => {
                    return { ...el, uid: i + 1 }
                  })
                : []
              setStockReport(loadServerRows(paginationModel.page, listWithId))
              setLoading(false)
            }
          } catch (error) {
            console.log('error', error)
            setLoading(false)
          }
        } else {
          try {
            setLoading(true)

            const params = {
              sort,
              q,
              column,
              page: paginationModel.page + 1,
              limit: paginationModel.pageSize
            }
            const result = await getStocksReportById(id, params)
            if (result?.data?.length > 0) {
              setTotal(parseInt(result?.count))

              // result.sort((a, b) => a.id - b.id)
              let listWithId = result?.data
                ? result?.data?.map((el, i) => {
                    return { ...el, uid: i + 1 }
                  })
                : []
              setStockReport(loadServerRows(paginationModel.page, listWithId))
            }
            setLoading(false)
          } catch (error) {
            console.log('error', error)
            setLoading(false)
          }
        }
      }
    },
    [paginationModel]
  )

  const indexedRows = stockReport?.map((row, index) => ({
    ...row,
    id: `${row.id}_${index}`,
    sl_no: index + 1
  }))

  const handleSearch = useCallback(
    debounce(async value => {
      setSearchValue(value)
      try {
        await getStocksReport({ sort, q: value, column: sortColumn, id: selectedPharmacy?.id })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // const getStocksReport = async id => {
  //   if (id) {
  //     if (selectedPharmacy?.type === 'local') {
  //       try {
  //         const result = await getLocalStocksReportById()
  //         console.log('res', result.data)
  //         if (result.success === true && result.data.length > 0) {
  //           let listWithId = result.data
  //             ? result.data.map((el, i) => {
  //                 return { ...el, uid: i + 1 }
  //               })
  //             : []
  //           setStockReport(listWithId)
  //         }
  //       } catch (error) {
  //         console.log('error', error)
  //       }
  //     } else {
  //       try {
  //         const result = await getStocksReportById(id)
  //         if (result?.length > 0) {
  //           // console.log('stocks', result)

  //           // result.sort((a, b) => a.id - b.id)
  //           let listWithId = result
  //             ? result.map((el, i) => {
  //                 return { ...el, uid: i + 1 }
  //               })
  //             : []
  //           setStockReport(listWithId)
  //         }
  //       } catch (error) {
  //         console.log('error', error)
  //       }
  //     }
  //   }
  // }

  const getStocksReportBatchWise = useCallback(
    async ({ batchSort, batchQ, batchColumn, id }) => {
      // console.log(stockId)
      // if (id === '' || undefined) {
      //   setErrors('Please select Store')

      //   return
      // } else {
      setBatchLoading(true)

      const batchParams = {
        sort: batchSort,
        q: batchQ,
        column: batchColumn,
        page: batchPaginationModel.page + 1,
        limit: batchPaginationModel.pageSize
      }
      if (selectedPharmacy?.type === 'local') {
        try {
          const result = await getStocksByBatch(id, batchParams)
          if (result.success === true && result.data.length > 0) {
            setBatchTotal(parseInt(result?.count))

            let listWithId = result.data
              ? result.data.map((el, i) => {
                  return { ...el, uid: i + 1 }
                })
              : []
            setStockReportBatch(loadBatchServerRows(batchPaginationModel.page, listWithId))
            setBatchLoading(false)
          }
        } catch (error) {
          console.log('error', error)
          setBatchLoading(false)
        }
      } else {
        try {
          const result = await getStocksByBatch(id, batchParams)
          if (result.success === true && result.data !== '') {
            setBatchTotal(parseInt(result?.count))

            let listWithId = result.data
              ? result.data.map((el, i) => {
                  return { ...el, uid: i + 1 }
                })
              : []
            setStockReportBatch(loadBatchServerRows(batchPaginationModel.page, listWithId))
            setBatchLoading(false)
          }
        } catch (error) {
          console.log('error', error)
          setBatchLoading(false)
        }
      }
    },
    [batchPaginationModel]
  )

  const batchIndexedRows = stockReportBatch?.map((row, index) => ({
    ...row,
    id: `${row.id}_${index}`,
    sl_no: index + 1
  }))

  const handleBatchSearch = useCallback(
    debounce(async value => {
      setBatchSearchValue(value)
      try {
        await getStocksReportBatchWise({
          batchSort: batchSort,
          batchQ: value,
          batchColumn: batchSortColumn,
          id: selectedPharmacy?.id
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )
  useEffect(() => {
    if (selectedPharmacy?.id !== '' || undefined) {
      // getStocksReport(selectedPharmacy?.id)
      getStocksReport({
        sort,
        q: searchValue,
        column: sortColumn,
        id: selectedPharmacy?.id
      })

      setStockId(selectedPharmacy?.id)
      getStocksReportBatchWise({
        batchSort: batchSort,
        batchQ: batchSearchValue,
        batchColumn: batchSortColumn,
        id: selectedPharmacy?.id
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id, getStocksReport, getStocksReportBatchWise, value])

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
      headerName: 'Product Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_items_name}
        </Typography>
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
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'batch_no',
    //   headerName: 'BATCH NUMBER',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.batch_no}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'expiry_date',
    //   headerName: 'EXPIRY DATE',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {Utility.formatDisplayDate(params.row.expiry_date)}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'min_qty',
      headerName: 'MIN QTY',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.min_qty}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_qty',
      headerName: 'QTY.IN STORE',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_qty}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'store_name',
    //   headerName: 'Store Name',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.store_name}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'purchase_price',
      headerName: 'STOCK PURCHASE PRICE',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.purchase_price}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //       {/* <IconButton size='small' sx={{ mr: 0.5 }}>
    //         <Icon icon='mdi:eye-outline' />
    //       </IconButton> */}
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

  const batchWiseColumn = [
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
      headerName: 'Product Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_items_name}
        </Typography>
      )
    },

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

    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_qty',
      headerName: 'QTY.IN STORE',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* {params.row.stock_qty} */}
          {parseInt(params.row.stock_qty) > 0 ? params.row.stock_qty : 0}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'purchase_price',
      headerName: 'STOCK PURCHASE PRICE',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.purchase_price}
        </Typography>
      )
    }

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

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButton
            title='Add Inventory'
            action={() => Router.push({ pathname: '/pharmacy/purchase/add-purchase/' })}
          />
        )}
    </div>
  )

  const handleStockRowClick = params => {
    setConfigureMedId(params?.row?.stock_item_id)
    showDialog()
  }

  return (
    <>
      <Grid>
        <TabContext value={value}>
          <TabList onChange={handleChange} aria-label='simple tabs example'>
            <Tab value='1' label='Stock Report' />
            <Tab value='2' label='Stock Report Batch Wise' />
          </TabList>
          <TabPanel value='1'>
            {loader ? (
              <FallbackSpinner />
            ) : (
              <>
                <CommonDialogBox
                  title={'Configure Medicine'}
                  dialogBoxStatus={show}
                  formComponent={<StockMedicineConfigure configureMedId={configureMedId} storeId={stockId} />}
                  close={closeDialog}
                  show={showDialog}
                />
                {/* <TableWithFilter
                  TableTitle={stockReport.length > 0 ? 'Stock Report' : 'Stock Report is empty'}
                  columns={columns}
                  rowCount={total}
                  setPaginationModel
                  rows={stockReport}
                  headerActions={headerAction}
                /> */}
                <Card>
                  <CardHeader
                    title={stockReport.length > 0 ? 'Stock Report' : 'Stock Report is empty'}
                    action={headerAction}
                  />
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
                    onRowClick={handleStockRowClick}
                  />
                </Card>
              </>
            )}
          </TabPanel>
          <TabPanel value='2'>
            <>
              {loader ? (
                <FallbackSpinner />
              ) : (
                <>
                  <CommonDialogBox
                    title={'Configure Medicine'}
                    dialogBoxStatus={show}
                    formComponent={<StockMedicineConfigure configureMedId={configureMedId} storeId={stockId} />}
                    close={closeDialog}
                    show={showDialog}
                  />
                  {/* <TableWithFilter
                    TableTitle={stockReportBatch.length > 0 ? 'Stock report batch wise' : 'Stock Report is empty'}
                    columns={batchWiseColumn}
                    rows={stockReportBatch}
                    headerActions={headerAction}
                  /> */}
                  <Card>
                    <CardHeader
                      title={stockReportBatch.length > 0 ? 'Stock report batch wise' : 'Stock Report is empty'}
                      action={headerAction}
                    />
                    <DataGrid
                      autoHeight
                      hideFooterSelectedRowCount
                      disableColumnSelector={true}
                      pagination
                      rows={batchIndexedRows === undefined ? [] : batchIndexedRows}
                      rowCount={batchTotal}
                      columns={batchWiseColumn}
                      sortingMode='server'
                      paginationMode='server'
                      pageSizeOptions={[7, 10, 25, 50]}
                      paginationModel={batchPaginationModel}
                      slots={{ toolbar: ServerSideToolbarWithFilter }}
                      onPaginationModelChange={setBatchPaginationModel}
                      loading={batchLoading}
                      slotProps={{
                        baseButton: {
                          variant: 'outlined'
                        },
                        toolbar: {
                          value: batchSearchValue,
                          clearSearch: () => handleBatchSearch(''),
                          onChange: event => {
                            setBatchSearchValue(event.target.value)

                            return handleBatchSearch(event.target.value)
                          }
                        }
                      }}
                    />
                  </Card>
                </>
              )}
            </>
          </TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default ListOfStocks
