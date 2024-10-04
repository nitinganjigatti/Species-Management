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
import {
  Box,
  Card,
  CardHeader,
  Grid,
  debounce,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material'

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
import { Avatar, Badge } from '@mui/material'
import { ExcelExportButton } from 'src/components/Buttons'
import ExpiringMedicine from '../expired-medicine/expiringStock'

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
  const [excelLoader, setExcelLoader] = useState(false)

  const [stockId, setStockId] = useState(selectedPharmacy?.id)

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
      let storeId = id === 'all' ? '' : id

      if (id) {
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
              store_id: storeId
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

            result = await getStocksReportById(storeId, params)
          }

          if (result.success === true && result.data.length > 0) {
            setTotal(parseInt(result.count))

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

          if (result?.success === true) {
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
    if (selectedPharmacy?.id !== '' || undefined) {
      // getStocksReport(selectedPharmacy?.id)
      setStockType(selectedPharmacy?.type)

      setStockId(selectedPharmacy?.id)

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

      setStockId(selectedPharmacy?.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id, value])

  useEffect(() => {
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
  const getBatchWiseDataToExport = async () => {
    try {
      setExcelLoader(true)

      const result = await getStocksByBatch(stockId, { params: '' })
      if (result?.success === true && result?.data?.length > 0) {
        const data = result?.data?.map(el => {
          return {
            ['Medicine Name']: el?.stock_items_name,
            ['Package details']: `${el?.package} of ${Utility.formatNumber(el?.package_qty)}${el?.package_uom_label} ${
              el?.product_form_label
            }`,
            ['Manufacture Name']: el?.manufacturer_name,
            ['Expiry Date']: el?.expiry_date,
            ['Batch Number']: el?.batch_no,
            ['Quantity']: el?.stock_qty
          }
        })

        Utility.exportToCSV(data, 'Batch wise Products')
      }
      setExcelLoader(false)
    } catch (error) {
      setExcelLoader(false)

      console.log('error', error)
    }
  }

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
      flex: 0.12,
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
      field: 'stock_items_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Tooltip title={params.row.stock_items_name} placement='top'>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.stock_items_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'package',
      headerName: 'PACKAGE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
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
    {
      flex: 0.2,
      minWidth: 20,
      field: 'procured_date',
      headerName: 'PROCURED DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.procured_date)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'purchase_price',
      headerName: 'Purchase Price',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseFloat(params.row.unit_price) > 0 && parseFloat(params?.row?.stock_qty) > 0
            ? (parseFloat(params.row.unit_price) * parseFloat(params.row.stock_qty)).toFixed(2)
            : 'NA'}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'min_qty',
    //   headerName: 'Reorder Level',
    //   type: 'number',
    //   align: 'right',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.min_qty}
    //     </Typography>
    //   )
    // },

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
      field: 'rack_info',
      headerName: 'Rack',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <>
          {params?.row?.stock_config ? (
            params?.row?.stock_config?.map(el => {
              return (
                <Typography key={el} variant='body2' sx={{ color: 'text.primary' }}>
                  {el.rack}
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
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_config',
      headerName: 'Shelf',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <>
          {params?.row?.stock_config ? (
            params?.row?.stock_config?.map(el => {
              return (
                <Typography key={el} variant='body2' sx={{ color: 'text.primary' }}>
                  {el.shelf}
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
      flex: 0.15,

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
      field: 'stock_items_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Tooltip title={params.row.stock_items_name} placement='top'>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.stock_items_name}
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'package',
      headerName: 'PACKAGE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'procured_date',
      headerName: 'PROCURED DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.procured_date)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'purchase_price',
      headerName: 'Purchase Price',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseFloat(params.row.unit_price) > 0 && parseFloat(params?.row?.stock_qty) > 0
            ? (parseFloat(params.row.unit_price) * parseFloat(params.row.stock_qty)).toFixed(2)
            : 'NA'}
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
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'rack_info',
      headerName: 'Rack',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <>
          {params?.row?.stock_config ? (
            params?.row?.stock_config?.map(el => {
              return (
                <Typography key={el} variant='body2' sx={{ color: 'text.primary' }}>
                  {el.rack}
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
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_config',
      headerName: 'Shelf',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <>
          {params?.row?.stock_config ? (
            params?.row?.stock_config?.map(el => {
              return (
                <Typography key={el} variant='body2' sx={{ color: 'text.primary' }}>
                  {el.shelf}
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
  ]

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

              setStockReport([])
              setConfigureMedId('')
              setErrors('')
              let storeId = id === 'all' ? null : id

              // getStocksReport({ sort, q: searchValue, column: sortColumn, id })

              changeSwitch
                ? getStocksReportBatchWise({ sort, q: searchValue, column: sortColumn, storeId })
                : getStocksReport({ sort, q: searchValue, column: sortColumn, storeId, type: type })
            }}
            label='Stores'
            value={stockId}
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
        {/* </Grid> */}
      </>
    )
  }

  const handleSwitchChange = event => {
    setChangeSwitch(event.target.checked)
    setSearchValue('')
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
              <Tab value='4' label='Expired Products' />
              <Tab value='6' label='About To Expire Products' />

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
                  <Grid sx={{ ml: 3, display: 'flex' }}>
                    <Grid>
                      {selectedPharmacy.type === 'central' && createForm()}
                      <FormControlLabel
                        control={<Switch checked={changeSwitch} onChange={handleSwitchChange} />}
                        labelPlacement='start'
                        label='Batch Wise'
                      />
                    </Grid>

                    {changeSwitch ? (
                      <Box sx={{ ml: 'auto', float: 'right', mr: 6 }}>
                        <ExcelExportButton
                          disabled={total === 0 ? true : false}
                          action={() => {
                            getBatchWiseDataToExport()
                          }}
                          loader={excelLoader}
                          title='Download'
                        />
                      </Box>
                    ) : null}
                  </Grid>

                  {changeSwitch ? (
                    <DataGrid
                      autoHeight
                      columnVisibilityModel={{
                        uid: false
                      }}
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
                      disableColumnMenu
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
                      onRowClick={handleStockRowClick}
                    />
                  ) : (
                    <DataGrid
                      autoHeight
                      columnVisibilityModel={{
                        uid: false
                      }}
                      hideFooterSelectedRowCount
                      disableColumnSelector={true}
                      pagination
                      disableColumnMenu
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
          <TabPanel value='6'>{loader ? <FallbackSpinner /> : <ExpiringMedicine />}</TabPanel>

          <TabPanel value='5'>{loader ? <FallbackSpinner /> : <Escrow />}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default ListOfStocks
