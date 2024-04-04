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
import { Box, Card, CardHeader, Grid, debounce, Button, MenuItem, Switch, FormControlLabel } from '@mui/material'

import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import StockMedicineConfigure from 'src/components/pharmacy/stock/StockMedicineConfigure'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import ListOfStocksByBatch from '../stockReportByBatch'
import StockOut from '../out-of-stock'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import FormHelperText from '@mui/material/FormHelperText'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import ExpiredMedicine from '../expired-medicine'
import Escrow from '../escrow'

const ListOfStocks = () => {
  const { selectedPharmacy } = usePharmacyContext()
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

  const [stockId, setStockId] = useState(selectedPharmacy?.id)

  console.log('stockId', stockId)

  const [loader, setLoader] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [show, setShow] = useState(false)
  const [value, setValue] = useState('1')
  const [stores, setStores] = useState([])
  const [errors, setErrors] = useState('')
  const [changeSwitch, setChangeSwitch] = useState()
  const [stockType, setStockType] = useState(selectedPharmacy?.type)

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
    async ({ sort, q, column, id, type }) => {
      if (id) {
        console.log('id callback', id)
        try {
          setLoading(true)
          let result
          if (type === 'local') {
            const params = {
              sort,
              q,
              column,
              page: paginationModel.page + 1,
              limit: paginationModel.pageSize,
              store_id: id
            }
            result = await getLocalStocksReportById(params)
          } else {
            const params = {
              sort,
              q,
              column,
              page: paginationModel.page + 1,
              limit: paginationModel.pageSize
            }
            result = await getStocksReportById(id, params)
          }

          if (result.success === true) {
            setTotal(parseInt(result.count))

            let listWithId = result.data
              ? result.data.map((el, i) => {
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
    },
    [paginationModel, stockId]
  )

  const indexedRows = stockReport?.map((row, index) => ({
    ...row,
    id: `${row.id}_${index}`,
    sl_no: index + 1
  }))

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
          if (result.success === true) {
            // console.log('result', result)
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
          if (result.success === true) {
            // console.log('result else', result)
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

  useEffect(() => {
    getStoresLists()
  }, [])

  useEffect(() => {
    console.log('1 ', selectedPharmacy?.id)
    if (selectedPharmacy?.id !== '' || undefined) {
      // getStocksReport(selectedPharmacy?.id)
      setStockType(selectedPharmacy?.type)

      setStockId(selectedPharmacy?.id)

      console.log('setStockType ', selectedPharmacy?.type)
      console.log('payload', {
        sort,
        q: searchValue,
        column: sortColumn,
        id: selectedPharmacy?.id,
        type: selectedPharmacy?.type
      })

      getStocksReport({
        sort,
        q: searchValue,
        column: sortColumn,
        id: selectedPharmacy?.id,
        type: selectedPharmacy?.type
      })

      if (changeSwitch) {
        getStocksReportBatchWise({
          batchSort: batchSort,
          batchQ: batchSearchValue,
          batchColumn: batchSortColumn,
          id: selectedPharmacy?.id,
          storeType: selectedPharmacy?.type
        })
      }

      // setStoreType(selectedPharmacy?.type)
      setStockId(selectedPharmacy?.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id, value])

  useEffect(() => {
    console.log('2')

    // getStocksReport(selectedPharmacy?.id)

    if (changeSwitch) {
      getStocksReportBatchWise({
        batchSort: batchSort,
        batchQ: batchSearchValue,
        batchColumn: batchSortColumn,
        id: stockId
      })
    } else {
      getStocksReport({
        sort,
        q: searchValue,
        column: sortColumn,
        id: stockId,
        type: stockType
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeSwitch, getStocksReportBatchWise, getStocksReport])

  // useEffect(() => {
  //   setStockId(selectedPharmacy?.id)
  // }, [])
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
      headerName: 'Reorder Level',
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
      headerName: 'QTY IN STORE',
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
    //   align: 'right',
    //   headerAlign: 'right',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.store_name}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_config',
      headerName: 'Rack & Shelf',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <>
          {params?.row?.stock_config ? (
            params?.row?.stock_config?.map(el => {
              return (
                <Typography key={el} variant='body2' sx={{ color: 'text.primary' }}>
                  {el.rack},{el.shelf}
                </Typography>
              )
            })
          ) : (
            <Typography key={el} variant='body2' sx={{ color: 'text.primary' }}>
              NA
            </Typography>
          )}
        </>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'purchase_price',
    //   headerName: 'STOCK PURCHASE PRICE',
    //   type: 'number',
    //   align: 'right',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.purchase_price}
    //     </Typography>
    //   )
    // }

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
          {params.row.stock_type === 'non_medical' ? 'NA' : Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_qty',
      headerName: 'QTY IN STORE',
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

  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { column: 'type' } })
      if (response?.data?.list_items?.length > 0) {
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStores(response?.data?.list_items)
        if (response?.data?.list_items.length > 0) {
          // setStockId(response?.data?.list_items)
          // console.log('response?.data?.list_items[0].id', response?.data?.list_items)
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

  const createForm = () => {
    return (
      <>
        {/* <Grid> */}
        <FormControl sx={{ width: 200, ml: 2 }}>
          <InputLabel id='controlled-select-label'>Stores</InputLabel>
          <Select
            onChange={e => {
              let id = e.target.value

              const type = stores.find(el => el.id === id)?.type || ''
              setStockType(type)
              setStockId(id)
              console.log('id', id)
              console.log('type', type)
              setStockReport([])
              setConfigureMedId('')
              setErrors('')

              // getStocksReport({ sort, q: searchValue, column: sortColumn, id })

              changeSwitch
                ? getStocksReportBatchWise({ sort, q: searchValue, column: sortColumn, id })
                : getStocksReport({ sort, q: searchValue, column: sortColumn, id, type: type })
            }}
            label='Stores'
            value={stockId}
            id='controlled-select'
            labelId='controlled-select-label'
            sx={{ width: '100%' }}
            size='small'
          >
            {stores.length > 0
              ? stores.map(el => {
                  // console.log('el', el.type)
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
      </>
    )
  }

  const handleSwitchChange = event => {
    setChangeSwitch(event.target.checked)
    setSearchValue('')

    // setValue(event.target.checked ? '2' : '1')
    // console.log('value', value)
  }

  const headerAction = (
    <div>
      {/* {selectedPharmacy.type === 'central' && (
        <Button
          onClick={() => Router.push({ pathname: '/pharmacy/purchase/purchase-list/' })}
          size='large'
          variant='outlined'
          sx={{ mr: '6px' }}
        >
          Inventory List
        </Button>
      )}
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButton
            title='Add Inventory'
            action={() => Router.push({ pathname: '/pharmacy/purchase/add-purchase/' })}
          />
        )} */}
      {selectedPharmacy.type === 'central' && createForm()}

      <FormControlLabel
        control={<Switch checked={changeSwitch} onChange={handleSwitchChange} />}
        labelPlacement='start'
        label='Stock Report Batch Wise'
      />
    </div>
  )

  const handleStockRowClick = params => {
    if (selectedPharmacy?.id === stockId) {
      setConfigureMedId(params?.row?.stock_item_id)
      showDialog()
    }
  }

  const handleBatchSearch = useCallback(
    debounce(async value => {
      setBatchSearchValue(value)
      try {
        await getStocksReportBatchWise({
          batchSort: batchSort,
          batchQ: value,
          batchColumn: batchSortColumn,
          id: stockId
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = useCallback(
    debounce(async value => {
      setSearchValue(value)
      try {
        // console.log('value', value)
        // console.log('payload search', { sort, q: value, column: sortColumn, id: stockId, type: stockType })
        await getStocksReport({ sort, q: value, column: sortColumn, id: stockId, type: stockType })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [getStocksReport]
  )

  return (
    <>
      <Grid>
        <TabContext value={value}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <Box sx={{ m: 1 }}>

            </Box> */}
            <TabList onChange={handleChange} aria-label='simple tabs example'>
              <Tab value='1' label='Stock Report' />
              {/* <Tab value='2' label='Stock Report Batch Wise' /> */}
              <Tab value='3' label='Low stock' />
              <Tab value='4' label='Expired Medicine' />

              <Tab value='5' label='Escrow' />
            </TabList>
          </Box>
          <TabPanel value='1'>
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
                    title={
                      stockReport.length > 0 || stockReportBatch.length > 0 ? 'Stock Report' : 'Stock Report is empty'
                    }

                    // action={headerAction}
                  />
                  <Box sx={{ ml: 3 }}>
                    {selectedPharmacy.type === 'central' && createForm()}

                    <FormControlLabel
                      control={<Switch checked={changeSwitch} onChange={handleSwitchChange} />}
                      labelPlacement='start'
                      label='Batch Wise'
                    />
                  </Box>

                  {changeSwitch ? (
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
                  ) : (
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
                          clearSearch: () => handleSearch('', stockId, stockType),
                          onChange: event => {
                            setSearchValue(event.target.value)

                            return handleSearch(event.target.value, stockId, stockType)
                          }
                        }
                      }}
                      onRowClick={handleStockRowClick}
                    />
                  )}
                </Card>
              </>
            )}
          </TabPanel>
          {/* <TabPanel value='2'>
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
                  <TableWithFilter
                    TableTitle={stockReportBatch.length > 0 ? 'Stock report batch wise' : 'Stock Report is empty'}
                    columns={batchWiseColumn}
                    rows={stockReportBatch}
                    headerActions={headerAction}
                  />
                  <Card>
                    <CardHeader
                      title={stockReportBatch.length > 0 ? 'Stock report batch wise' : 'Stock Report is empty'}
                      action={headerAction}
                    />
                  </Card>
                </>
              )}
              <ListOfStocksByBatch />
            </>
          </TabPanel> */}
          <TabPanel value='3'>
            <>{loader ? <FallbackSpinner /> : <StockOut />}</>
          </TabPanel>
          <TabPanel value='4'>{loader ? <FallbackSpinner /> : <ExpiredMedicine />}</TabPanel>
          <TabPanel value='5'>{loader ? <FallbackSpinner /> : <Escrow />}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default ListOfStocks
