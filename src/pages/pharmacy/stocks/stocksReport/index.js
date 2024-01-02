import React, { useState, useEffect } from 'react'

import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TabList from '@mui/lab/TabList'

import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getStocksReportById } from 'src/lib/api/pharmacy/getStocksReportById'
import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Grid } from '@mui/material'

import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import StockMedicineConfigure from 'src/components/pharmacy/stock/StockMedicineConfigure'

import ListOfStocksByBatch from '../stockReportByBatch'

const ListOfStocks = () => {
  const [stockReport, setStockReport] = useState([])
  const [stockReportBatch, setStockReportBatch] = useState([])
  const [stockId, setStockId] = useState('')
  const [loader, setLoader] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')
  const [show, setShow] = useState(false)
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const getStocksReport = async id => {
    if (id) {
      if (selectedPharmacy?.type === 'local') {
        try {
          const result = await getLocalStocksReportById()
          console.log('res', result.data)
          if (result.success === true && result.data.length > 0) {
            let listWithId = result.data
              ? result.data.map((el, i) => {
                  return { ...el, uid: i + 1 }
                })
              : []
            setStockReport(listWithId)
          }
        } catch (error) {
          console.log('error', error)
        }
      } else {
        try {
          const result = await getStocksReportById(id)
          if (result?.length > 0) {
            // console.log('stocks', result)

            // result.sort((a, b) => a.id - b.id)
            let listWithId = result
              ? result.map((el, i) => {
                  return { ...el, uid: i + 1 }
                })
              : []
            setStockReport(listWithId)
          }
        } catch (error) {
          console.log('error', error)
        }
      }
    }
  }

  const getStocksReportBatchWise = async id => {
    // console.log(stockId)
    if (id === '' || undefined) {
      setErrors('Please select Store')

      return
    } else {
      if (selectedPharmacy?.type === 'local') {
        try {
          const result = await getLocalStocksReportById()
          console.log('res', result.data)
          if (result.success === true && result.data.length > 0) {
            let listWithId = result.data
              ? result.data.map((el, i) => {
                  return { ...el, uid: i + 1 }
                })
              : []
            setStockReportBatch(listWithId)
          }
        } catch (error) {
          console.log('error', error)
        }
      } else {
        try {
          const result = await getStocksByBatch(id)
          if (result.success === true && result.data !== '') {
            let listWithId = result.data
              ? result.data.map((el, i) => {
                  return { ...el, uid: i + 1 }
                })
              : []
            setStockReportBatch(listWithId)
          }
        } catch (error) {
          console.log('error', error)
        }
      }
    }
  }
  useEffect(() => {
    if (selectedPharmacy?.id !== '' || undefined) {
      getStocksReport(selectedPharmacy?.id)
      setStockId(selectedPharmacy?.id)
      getStocksReportBatchWise(selectedPharmacy?.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy])

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
    {
      flex: 0.2,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'EXPIRY DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.expiry_date}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'min_qty',
      headerName: 'MIN QTY',
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
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'store_name',
      headerName: 'Store Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.store_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'purchase_price',
      headerName: 'STOCK PURCHASE PRICE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.purchase_price}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:eye-outline' />
          </IconButton> */}
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={() => {
              setConfigureMedId(params.row.stock_item_id)
              showDialog()
            }}
          >
            <Icon icon='grommet-icons:configure' />
          </IconButton>
        </Box>
      )
    }
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
      headerName: 'MEDICINE NAME',
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
          {params.row.expiry_date}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_qty',
      headerName: 'QTY.IN STORE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_qty}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'purchase_price',
      headerName: 'STOCK PURCHASE PRICE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.purchase_price}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={() => {
              setConfigureMedId(params.row.stock_item_id)
              showDialog()
            }}
          >
            <Icon icon='grommet-icons:configure' />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <>
      <Box>
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
                <TableWithFilter
                  TableTitle={stockReport.length > 0 ? 'Stock Report' : 'Stock Report is empty'}
                  inpFields={createForm()}
                  columns={columns}
                  rows={stockReport}
                />
              </>
            )}
          </TabPanel>
          <TabPanel value='2'>
            <Typography>
              <ListOfStocksByBatch />
            </Typography>
          </TabPanel>
        </TabContext>
      </Box>
    </>
  )
}

export default ListOfStocks
