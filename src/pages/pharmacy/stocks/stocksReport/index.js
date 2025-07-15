import React, { useState, useEffect, useCallback, useRef } from 'react'

import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'

import {
  getStocksReportById,
  getLocalStocksReportById,
  getStockReport,
  getStockReportByBatch,
  getPurchaseListByProduct
} from 'src/lib/api/pharmacy/getStocksReportById'

import FallbackSpinner from 'src/@core/components/spinner/index'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import {
  Box,
  Card,
  CardHeader,
  Grid,
  debounce,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  TextField,
  InputAdornment,
  Typography
} from '@mui/material'

import CommonDialogBox from 'src/components/CommonDialogBox'
import StockMedicineConfigure from 'src/components/pharmacy/stock/StockMedicineConfigure'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'

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
import ExpiringMedicine from '../expired-medicine/expiringStock'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import StockReportDetails from 'src/views/pages/pharmacy/stock/stockReportDetails'
import RenderUtility from 'src/utility/render'
import { ExportButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import MenuWithDots from 'src/components/MenuWithDots'
import AddReOrderDialog from 'src/components/pharmacy/stockLocation/AddReOrderDialog'
import StockConfigDetails from 'src/views/pages/pharmacy/stock/StockConfigDetails'

const ListOfStocks = () => {
  const theme = useTheme()
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }
  const { selectedPharmacy } = usePharmacyContext()

  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('asc')
  const [stockReport, setStockReport] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('stock_items_name')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })

  const [batchLoading, setBatchLoading] = useState(false)
  const [batchSort, setBatchSort] = useState('asc')
  const [stockReportBatch, setStockReportBatch] = useState([])
  const [batchSearchValue, setBatchSearchValue] = useState('')
  const [batchSortColumn, setBatchSortColumn] = useState('stock_items_name')
  const [batchTotal, setBatchTotal] = useState(0)
  const [batchPaginationModel, setBatchPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [excelLoader, setExcelLoader] = useState(false)

  const [stockId, setStockId] = useState(selectedPharmacy?.id)

  const [loader, setLoader] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [show, setShow] = useState(false)
  const [value, setValue] = useState(router.query.value || '1')
  const [stores, setStores] = useState([])
  const [errors, setErrors] = useState('')
  const [changeSwitch, setChangeSwitch] = useState(true)
  const [stockType, setStockType] = useState(selectedPharmacy?.type)

  const editParamsInitialState = { id: null, name: null, active: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  // const [purchaseByStockId, setPurchaseByStockId] = useState(null)
  const [purchaseByStockId, setPurchaseByStockId] = useState({ batch_no: null, stock_id: null })
  const [purchaseByStockIdList, setPurchaseByStockIdList] = useState([])
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [searchPurchase, setSearchPurchase] = useState('')
  const [openReOrderLevelDialog, setOpenReOrderLevelDialog] = useState(false)
  const [configReOrderMed, setConfigReOrderMed] = useState(null)
  const [dialogCheck, setDialogCheck] = useState(false)
  const textFieldRef = useRef(null)

  const handleChange = (event, newValue) => {
    setValue(newValue)
    updateUrlParams({
      value: newValue
    })
  }

  const closeDialog = () => {
    setConfigureMedId(null)
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

  // const getStocksReport = useCallback(
  //   async ({ sort, q, column, id, type }) => {
  //     let storeId = id === 'all' ? '' : id

  //     if (id) {
  //       try {
  //         setLoading(true)
  //         let result
  //         if (type === 'local') {
  //           const params = {
  //             sort,
  //             q,
  //             column,
  //             page: paginationModel.page + 1,
  //             limit: paginationModel.pageSize,
  //             store_id: storeId
  //           }

  //           result = await getLocalStocksReportById(params)
  //         } else {
  //           const params = {
  //             sort,
  //             q,
  //             column,
  //             page: paginationModel.page + 1,
  //             limit: paginationModel.pageSize
  //           }

  //           result = await getStocksReportById(storeId, params)
  //         }

  //         if (result.success === true && result.data.length > 0) {
  //           setTotal(parseInt(result.count))

  //           let listWithId = result.data
  //             ? result.data.map((el, i) => {
  //                 return { ...el, uid: i + 1 }
  //               })
  //             : []
  //           setStockReport(loadServerRows(paginationModel.page, listWithId))
  //           setLoading(false)
  //         } else {
  //           setTotal(0)
  //           setStockReport([])
  //           setLoading(false)
  //         }
  //       } catch (error) {
  //         setTotal(0)
  //         setStockReport([])
  //         console.log('error', error)
  //         setLoading(false)
  //       }
  //     }
  //   },
  //   [paginationModel, stockId]
  // )

  // const getStocksReport = useCallback(
  //   async ({ sort, q, column, id, type, page }) => {
  //     let storeId = id === 'all' ? '' : id
  //     if (id) {
  //       try {
  //         setLoading(true)
  //         let result

  //         const params = {
  //           sort,
  //           q,
  //           column,
  //           page: page || paginationModel.page + 1, // Use passed page or fallback
  //           limit: paginationModel.pageSize,
  //           store_id: type === 'local' ? storeId : undefined
  //         }

  //         if (type === 'local') {
  //           result = await getLocalStocksReportById(params)
  //         } else {
  //           result = await getStocksReportById(storeId, params)
  //         }

  //         if (result.success && result.data.length > 0) {
  //           setTotal(parseInt(result.count))
  //           const listWithId = result.data.map((el, i) => ({ ...el, uid: i + 1 }))
  //           setStockReport(loadServerRows(page || paginationModel.page, listWithId))
  //         } else {
  //           setTotal(0)
  //           setStockReport([])
  //         }
  //       } catch (error) {
  //         setTotal(0)
  //         setStockReport([])
  //         console.error('error', error)
  //       } finally {
  //         setLoading(false)
  //       }
  //     }
  //   },
  //   [paginationModel]
  // )

  const getStocksReport = useCallback(
    async ({ sort, q, column, id, type, paginationModel }) => {
      let storeId = id === 'all' ? '' : id
      if (id) {
        try {
          setLoading(true)
          let result

          // if (type === 'local') {
          //   const params = {
          //     sort,
          //     q,
          //     column,
          //     page: paginationModel.page + 1,
          //     limit: paginationModel.pageSize,
          //     store_id: storeId
          //   }

          //   result = await getLocalStocksReportById(params)
          // } else {
          const params = {
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize
          }

          result = await getStockReport(storeId, params)

          // }

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
          console.error('error', error)
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
    async ({ batchSort, batchQ, batchColumn, id, batchPaginationModel }) => {
      setBatchLoading(true)

      const batchParams = {
        sort: batchSort,
        q: batchQ,
        column: batchColumn,
        page: batchPaginationModel.page + 1,
        limit: batchPaginationModel.pageSize
      }

      if (id !== undefined) {
        try {
          const result = await getStockReportByBatch(id, batchParams)

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
          console.error('error', error)
          setBatchLoading(false)
        }
      }

      // }
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
    updateUrlParams({
      value: value
    })
  }, [])

  useEffect(() => {
    if (selectedPharmacy?.id !== '' && value == 1) {
      // getStocksReport(selectedPharmacy?.id)

      setStockType(selectedPharmacy?.type)

      setStockId(selectedPharmacy?.id)

      if (changeSwitch) {
        getStocksReportBatchWise({
          batchSort: batchSort,
          batchQ: batchSearchValue,
          batchColumn: batchSortColumn,
          id: selectedPharmacy?.id,
          storeType: selectedPharmacy?.type,
          batchPaginationModel
        })
      } else {
        getStocksReport({
          sort,
          q: searchValue,
          column: sortColumn,
          id: selectedPharmacy?.id,
          type: selectedPharmacy?.type,
          paginationModel
        })
      }

      // setStockId(selectedPharmacy?.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id, value])

  const getBatchWiseDataToExport = async () => {
    try {
      if (!changeSwitch) {
        setExcelLoader(true)
        const result = await getStockReport(stockId, { sort, q: searchValue, column: sortColumn })

        if (result?.success === true && result?.data?.length > 0) {
          const data = result?.data?.map(el => {
            return {
              ['Id']: Number(el?.stock_item_id),
              ['Medicine Name']: el?.stock_items_name,
              ['Quantity']: Number(el?.stock_qty),
              ['value']: Number(el?.total_cost),
              ['Average price']: Number(
                Number.isInteger(el.total_cost / el.stock_qty)
                  ? el.total_cost / el.stock_qty
                  : parseFloat(el.total_cost / el.stock_qty).toFixed(2)
              ),
              ['Package details']: `${el?.package} of ${Utility.formatNumber(el?.package_qty)}${
                el?.package_uom_label
              } ${el?.product_form_label}`
            }
          })

          Utility.exportToCSV(data, 'Stock Report')
        }
        setExcelLoader(false)
      } else {
        setExcelLoader(true)

        const batchParams = {
          sort: batchSort,
          q: batchSearchValue,
          column: batchSortColumn

          // page: batchPaginationModel.page + 1,
          // limit: batchPaginationModel.pageSize
        }
        const result = await getStockReportByBatch(stockId, batchParams)

        if (result?.success === true && result?.data?.length > 0) {
          const data = result?.data?.map(el => {
            return {
              ['Id']: Number(el?.stock_item_id),
              ['Medicine Name']: el?.stock_items_name,
              ['Quantity']: Number(el?.stock_qty),
              ['Unit Price']: Number(el?.unit_price),
              ['value']: Number(el?.total_cost),
              ['Batch Number']: el?.batch_no,
              ['Store Name']: el?.store_name,
              ['Expiry Date']: el?.expiry_date,
              ['Package details']: `${el?.package} of ${Utility.formatNumber(el?.package_qty)}${
                el?.package_uom_label
              } ${el?.product_form_label}`
            }
          })

          Utility.exportToCSV(data, 'Stock Report Batch wise')
        }
        setExcelLoader(false)
      }
    } catch (error) {
      setExcelLoader(false)

      console.error('error', error)
    }
  }

  const getMenuOptions = row => [
    {
      label: 'Add Re-Order Level',
      action: () => {
        setOpenReOrderLevelDialog(true)
        setConfigReOrderMed(row)
      }
    }
  ]

  const columns = [
    {
      Width: 40,
      field: 'uid',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      width: 260,
      field: 'stock_items_name',
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
      ...(stockId === 'all' && {
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
      minWidth: 160,
      field: 'stock_qty',
      headerName: 'QTY IN STORE',
      type: 'number',
      align: 'right',
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
    },

    {
      minWidth: 160,
      field: 'total_cost',
      headerName: 'Value(₹)',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatAmountToReadableDigit(params.row.total_cost)}
        </Typography>
      )
    },

    {
      minWidth: 160,
      field: 'stock_item_id',
      headerName: 'Average Price(₹)',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* {Number.isInteger(params.row.total_cost / params.row.stock_qty)
            ? params.row.total_cost / params.row.stock_qty
            : parseFloat(params.row.total_cost / params.row.stock_qty).toFixed(2)} */}
          {/* {parseFloat(params.row.total_cost / params.row.stock_qty).toPrecision(2)} */}
          {/* {params.row.total_cost / params.row.stock_qty} */}
          {Utility.formatAmountToReadableDigit(params.row.total_cost / params.row.stock_qty)}
        </Typography>
      )
    },
    {
      width: 260,
      field: 'package',
      headerName: 'PACKAGE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', ...RenderUtility.getEllipsisStyleForText('260') }}>
          {RenderUtility.getToolTipForText(`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`)}
        </Typography>
      )
    },
    ...(!changeSwitch && value === '1'
      ? [
          {
            width: 150,
            field: 'action', // replace with your field name
            headerName: 'Actions',
            renderCell: params => (
              <Tooltip title='More Options' placement='top'>
                <MenuWithDots options={getMenuOptions(params?.row)} />
              </Tooltip>
            )
          }
        ]
      : [])
  ]

  const batchWiseColumn = [
    {
      // flex: 0.15,
      Width: 40,
      field: 'uid',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      // flex: 0.4,
      minWidth: 260,
      field: 'stock_items_name',
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
      ...(stockId === 'all' && {
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
      minWidth: 160,
      field: 'stock_qty',
      headerName: 'QTY IN STORE',
      type: 'number',
      align: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.stock_qty) > 0 ? params.row.stock_qty : 0}
        </Typography>
      )
    },

    {
      minWidth: 200,
      field: 'unit_price',
      headerName: 'Net Unit Price(₹)',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatAmountToReadableDigit(params?.row?.unit_price)}
        </Typography>
      )
    },

    {
      minWidth: 160,
      field: 'total_cost',
      headerName: 'Value(₹)',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* {parseInt(params.row.total_cost) > 0 ? params.row.total_cost : 0} */}
          {Utility.formatAmountToReadableDigit(params?.row?.total_cost)}
        </Typography>
      )
    },
    {
      minWidth: 160,
      field: 'batch_no',
      type: 'text',
      align: 'center',
      headerName: 'BATCH NUMBER',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },

    {
      minWidth: 160,
      field: 'expiry_date',
      headerName: 'EXPIRY DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_type === 'non_medical' ? 'NA' : Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },
    {
      // flex: 0.4,
      minWidth: 260,
      field: 'package',
      headerName: 'PACKAGE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', ...RenderUtility.getEllipsisStyleForText('260') }}>
          {RenderUtility.getToolTipForText(`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
        ${params.row.package_uom_label} ${params.row.product_form_label}`)}
        </Typography>
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
      console.error('error', error)
    }
  }

  const handleSwitchChange = event => {
    setChangeSwitch(event.target.checked)
    setSearchValue('')
    setBatchSearchValue('')
    textFieldRef.current.value = ''
    if (event.target.checked) {
      getStocksReportBatchWise({
        batchSort: batchSort,
        batchQ: batchSearchValue,
        batchColumn: batchSortColumn,
        id: stockId,
        batchPaginationModel: { page: 0, pageSize: batchPaginationModel.pageSize }
      })
    } else {
      getStocksReport({
        sort,
        q: searchValue,
        column: sortColumn,
        id: stockId,
        paginationModel: { page: 0, pageSize: paginationModel.pageSize }
      })
    }
  }

  const handleStockRowClick = params => {
    if (
      selectedPharmacy?.id === stockId &&
      (params?.field === 'stock_items_name' ||
        params?.field === 'stock_qty' ||
        params?.field === 'total_cost' ||
        params?.field === 'unit_price' ||
        params?.field === 'package' ||
        params?.field === 'store_name' ||
        params?.field === 'stock_item_id' ||
        params?.field === 'batch_no' ||
        params?.field === 'expiry_date')
    ) {
      setConfigureMedId(params?.row)
      showDialog()
    }
  }

  const handleStockRowClickSideBar = async params => {
    addEventSidebarOpen()
    setPurchaseByStockId({
      batch_no: params.row?.batch_no,
      stock_id: params.row?.stock_item_id
    })
    await getPurchaseListByStockId(params.row?.stock_item_id, params.row?.batch_no)
  }

  const handleBatchSearch = useCallback(
    debounce(async (value, id, stockType, batchPaginationModel) => {
      setBatchSearchValue(value)
      setBatchPaginationModel(prev => ({ ...prev, page: 0 }))
      try {
        await getStocksReportBatchWise({
          batchSort: batchSort,
          batchQ: value,
          batchColumn: batchSortColumn,

          // id: stockId
          id: id,
          batchPaginationModel: { page: 0, pageSize: batchPaginationModel.pageSize }
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      const sortOrder = newModel[0].sort
      const sortField = newModel[0].field

      // Update sorting state
      setSort(sortOrder)
      setSortColumn(sortField)

      if (changeSwitch) {
        // Reset batch pagination and call batch API
        setBatchPaginationModel(prev => ({ ...prev, page: 0 }))
        getStocksReportBatchWise({
          batchSort: sortOrder,
          batchQ: searchValue, // Use the current search value
          batchColumn: sortField,
          id: stockId, // Use the current stock ID
          batchPaginationModel: { page: 0, pageSize: batchPaginationModel.pageSize } // Start from the first page
        })
      } else {
        // Reset main pagination and call main API
        setPaginationModel(prev => ({ ...prev, page: 0 }))
        getStocksReport({
          sort: sortOrder,
          q: searchValue, // Use the current search value
          column: sortField,
          id: stockId, // Use the current stock ID
          type: stockType, // Use the current stock type
          paginationModel: { page: 0, pageSize: paginationModel.pageSize } // Start from the first page
        })
      }
    }
  }

  const handleSearch = useCallback(
    debounce(async (value, stockId, stockType, paginationModel) => {
      setSearchValue(value)

      try {
        // Reset the page to 0 for new search queries

        setPaginationModel(prev => ({ ...prev, page: 0 }))

        // Call the API with the updated page index (0)
        await getStocksReport({
          sort,
          q: value,
          column: sortColumn,
          id: stockId,
          type: stockType,
          paginationModel: { page: 0, paginationModel: paginationModel.pageSize }

          // page: 0 // Explicitly pass page 0 for a search
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleBatchSortModel = newModel => {
    if (newModel.length) {
      setBatchSort(newModel[0].sort)
      setBatchSortColumn(newModel[0].field)
      getStocksReportBatchWise({
        batchSort: newModel[0].sort,
        batchQ: batchSearchValue,
        batchColumn: newModel[0].field,
        id: stockId,
        type: stockType,
        batchPaginationModel
      })
    } else {
      setBatchSort(null)
      getStocksReportBatchWise({
        batchSort: null,
        batchQ: batchSearchValue,
        batchColumn: batchSortColumn,
        id: stockId,
        type: stockType,
        batchPaginationModel
      })
    }
  }

  // const handleSortModel = newModel => {
  //   if (newModel.length) {
  //     setSort(newModel[0].sort)
  //     setSortColumn(newModel[0].field)
  //     getStocksReport({
  //       sort: newModel[0].sort,
  //       q: searchValue,
  //       column: newModel[0].field,
  //       id: stockId,
  //       type: stockType
  //     })
  //   } else {
  //     setSort(null)
  //     getStocksReport({
  //       sort: null,
  //       q: searchValue,
  //       column: sortColumn,
  //       id: stockId,
  //       type: stockType
  //     })
  //   }
  // }

  const addEventSidebarOpen = params => {
    setEditParams({ id: null, name: null, status: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    // setPurchaseByStockId({ batch_no: null, stock_id: null })
    setSearchPurchase('')
    setPurchaseByStockIdList([])
    setOpenDrawer(false)
  }

  const handleSubmitData = async payload => {
    try {
    } catch (e) {}
  }

  const handleSearchPurchase = useCallback(
    debounce(async (stock_id, batch_no, value) => {
      setSearchPurchase(value)
      try {
        await getPurchaseListByStockId(stock_id, batch_no, value)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const getPurchaseListByStockId = useCallback(async (stock_id, batch_no, q) => {
    const params = { stock_id, q }
    if (changeSwitch) {
      params.batch_no = batch_no
    }
    try {
      setPurchaseLoading(true)
      const result = await getPurchaseListByProduct(params)
      if (result !== undefined) {
        // console.log(result, 'res')
        setPurchaseByStockIdList(result.data)
        setPurchaseLoading(false)
      }
    } catch (error) {
      console.error('error', error)
      setPurchaseLoading(false)
    }
  }, [])

  const handleInputChange = event => {
    const value = event.target.value
    setSearchPurchase(value)
    handleSearchPurchase(purchaseByStockId.stock_id, purchaseByStockId.batch_no, value)
  }

  const handleClearSearch = event => {
    setSearchPurchase('')
    handleSearchPurchase(purchaseByStockId.stock_id, purchaseByStockId.batch_no, '')
  }

  const handleBatchPaginationChange = data => {
    setBatchPaginationModel({ page: data.page, pageSize: data.pageSize })
    getStocksReportBatchWise({
      batchSort: batchSort,
      batchQ: batchSearchValue,
      batchColumn: batchSortColumn,
      id: stockId,
      batchPaginationModel: { page: data.page, pageSize: data.pageSize }

      // storeType: selectedPharmacy?.type
    })

    // getStocksReportBatchWise({ sort, q: searchValue, column: sortColumn, id: storeId })
  }

  const handlePaginationChange = data => {
    setPaginationModel({ page: data.page, pageSize: data.pageSize })
    getStocksReport({
      sort,
      q: searchValue,
      column: sortColumn,
      id: stockId,

      // type: selectedPharmacy?.type
      paginationModel: { page: data.page, pageSize: data.pageSize }
    })
  }

  return (
    <>
      <Grid>
        <TabContext value={value}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <Box sx={{ m: 1 }}>

            </Box> */}
            <TabList
              variant='scrollable'
              allowScrollButtonsMobile
              onChange={handleChange}
              aria-label='simple tabs example'
            >
              <Tab sx={{ ml: 3 }} value='1' label='Stock Report' />
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
                {show && (
                  <StockConfigDetails
                    open={showDialog}
                    configMed={configureMedId}
                    setConfigMed={setConfigureMedId}
                    close={closeDialog}
                  />
                )}
                {/* <CommonDialogBox
                  title={'Configure Medicine'}
                  dialogBoxStatus={show}
                  formComponent={
                    <StockMedicineConfigure configureMedId={configureMedId} storeId={stockId} close={closeDialog} />
                  }
                  close={closeDialog}
                  show={showDialog}
                /> */}
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
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: { xs: 2, md: 5 },
                      py: 2
                    }}
                    title={RenderUtility.pageTitle('Stock Report')}

                    // action={headerAction}
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
                        inputRef={textFieldRef}
                        onChange={e => {
                          changeSwitch
                            ? handleBatchSearch(e.target.value, stockId, stockType, batchPaginationModel)
                            : handleSearch(e.target.value, stockId, stockType, paginationModel)
                        }}
                        fullWidth
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

                                const type = stores.find(el => el.id === id)?.type || ''

                                setStockType(type)
                                setStockId(id)

                                setStockReport([])
                                setConfigureMedId('')
                                setErrors('')
                                setBatchSearchValue('')
                                setBatchSort('asc')
                                setBatchSortColumn('stock_items_name')
                                setSort('asc')
                                setSortColumn('stock_items_name')

                                textFieldRef.current.value = ''
                                let storeId = id === 'all' ? 'all' : id

                                // getStocksReport({ sort, q: searchValue, column: sortColumn, id })

                                changeSwitch
                                  ? getStocksReportBatchWise({
                                      batchSort: 'asc',
                                      q: '',
                                      batchColumn: 'stock_items_name',
                                      id: storeId,
                                      batchPaginationModel: { page: 0, pageSize: batchPaginationModel.pageSize }
                                    })
                                  : getStocksReport({
                                      sort: 'asc',
                                      q: '',
                                      column: 'stock_items_name',
                                      id: storeId,
                                      type: type,
                                      paginationModel: { page: 0, pageSize: paginationModel.pageSize }
                                    })
                              }}
                              label='Stores'
                              value={stockId}
                              id='controlled-select'
                              labelId='controlled-select-label'
                              sx={{ width: '100%' }}
                              size='small'
                            >
                              <MenuItem value='all'>All</MenuItem>
                              {stores.length > 0 &&
                                stores.map(el => {
                                  return (
                                    <MenuItem key={el.id} value={el.id}>
                                      {el.name}
                                    </MenuItem>
                                  )
                                })}
                            </Select>
                            <FormHelperText sx={{ color: 'red' }}>{errors}</FormHelperText>
                          </FormControl>
                        </Grid>
                      )}
                      <Grid
                        item
                        size={{ xs: 12, md: 8, lg: 8 }}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          my: { xs: 1, md: 0, lg: 0 }
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              sx={{ mr: { sm: 5 }, mt: { xs: 1, sm: 1 } }}
                              checked={changeSwitch}
                              onChange={handleSwitchChange}
                            />
                          }
                          labelPlacement='start'
                          label='Batch Wise '
                        />
                        <ExportButton
                          loading={excelLoader}
                          onClick={getBatchWiseDataToExport}
                          disabled={changeSwitch ? (batchTotal === 0 ? true : false) : total === 0 ? true : false}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {changeSwitch ? (
                    <Grid
                      sx={{
                        mx: { xs: 2, sm: 3.5, md: 5.8 }
                      }}
                    >
                      <CommonTable
                        columnVisibilityModel={{ uid: false }}
                        onRowClick={handleStockRowClick}
                        indexedRows={batchIndexedRows === undefined ? [] : batchIndexedRows}
                        total={batchTotal}
                        columns={batchWiseColumn}
                        paginationModel={batchPaginationModel}
                        handleSortModel={handleBatchSortModel}
                        setPaginationModel={handleBatchPaginationChange}
                        loading={batchLoading}
                        searchValue={batchSearchValue}
                        onCellClick={(params, event) => {
                          event.stopPropagation()
                          event.preventDefault()

                          // Custom logic for cell clicks
                          if (selectedPharmacy.type === 'central' && params.field === 'stock_items_name') {
                            // addEventSidebarOpen()
                            // setPurchaseByStockId({
                            //   batch_no: params.row?.batch_no,
                            //   stock_id: params.row?.stock_item_id
                            // })
                            handleStockRowClickSideBar(params)
                            event.ignoreRowClick = true
                          } else {
                            handleStockRowClick(params)
                          }
                        }}
                      />
                    </Grid>
                  ) : (
                    <Grid
                      sx={{
                        mx: { xs: 2, sm: 3.5, md: 5.5 }
                      }}
                    >
                      <CommonTable
                        columnVisibilityModel={{ uid: false }}
                        onRowClick={''}
                        indexedRows={indexedRows}
                        total={total}
                        columns={columns}
                        paginationModel={paginationModel}
                        handleSortModel={handleSortModel}
                        onCellClick={(params, event) => {
                          event.stopPropagation()
                          event.preventDefault()

                          // Custom logic for cell clicks
                          if (selectedPharmacy.type === 'central' && params.field === 'stock_items_name') {
                            // addEventSidebarOpen()
                            // setPurchaseByStockId({
                            //   batch_no: params.row?.batch_no,
                            //   stock_id: params.row?.stock_item_id
                            // })
                            handleStockRowClickSideBar(params)
                            event.ignoreRowClick = true
                          } else {
                            handleStockRowClick(params)
                          }
                        }}
                        setPaginationModel={handlePaginationChange}
                        loading={loading}
                        searchValue={searchValue}
                      />
                    </Grid>
                  )}

                  {/* {changeSwitch ? (
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
                      onSortModelChange={handleBatchSortModel}
                      paginationMode='server'
                      sortingMode='server'
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

                          clearSearch: () => handleBatchSearch('', stockId),
                          onChange: event => {
                            setBatchSearchValue(event.target.value)

                            return handleBatchSearch(event.target.value, stockId)
                          }
                        }
                      }}
                      onRowClick={handleStockRowClick}
                      onCellClick={(params, event) => {
                        event.stopPropagation()
                        event.preventDefault()

                        // Custom logic for cell clicks
                        if (selectedPharmacy.type === 'central' && params.field === 'stock_items_name') {
                          addEventSidebarOpen()
                          setPurchaseByStockId({
                            batch_no: params.row?.batch_no,
                            stock_id: params.row?.stock_item_id
                          })
                          event.ignoreRowClick = true
                        } else {
                          handleStockRowClick(params)
                        }
                      }}
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
                      onSortModelChange={handleSortModel}
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

                            return handleSearch(event.target.value, stockId,
                         )
                          }
                        }
                      }}
                      onRowClick={handleStockRowClick}
                      onCellClick={(params, event) => {
                        event.stopPropagation()
                        event.preventDefault()

                        // Custom logic for cell clicks
                        if (params.field === 'stock_items_name') {
                          addEventSidebarOpen()
                          setPurchaseByStockId({
                            batch_no: params.row?.batch_no,
                            stock_id: params.row?.stock_item_id
                          })
                          event.ignoreRowClick = true
                        } else {
                          handleStockRowClick(params)
                        }
                      }}
                    />
                  )} */}
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

          <TabPanel value='5'>{loader ? <FallbackSpinner /> : <Escrow value={value} />}</TabPanel>
        </TabContext>
      </Grid>
      <StockReportDetails
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
        purchaseByStockIdList={purchaseByStockIdList}
        purchaseLoading={purchaseLoading}
        setPurchaseLoading={setPurchaseLoading}
        handleInputChange={handleInputChange}
        searchPurchase={searchPurchase}
        setSearchPurchase={setSearchPurchase}
        handleClearSearch={handleClearSearch}
      />
      {openReOrderLevelDialog && (
        <AddReOrderDialog
          openDrawer={openReOrderLevelDialog}
          setOpenDrawer={setOpenReOrderLevelDialog}
          stockDetails={configReOrderMed}
          setStockDetails={setConfigReOrderMed}
          dialogCheck={dialogCheck}
          setDialogCheck={setDialogCheck}
        />
      )}
    </>
  )
}

export default ListOfStocks
