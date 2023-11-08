import React, { useState, useEffect } from 'react'

import { getStoreList } from 'src/lib/api/getStoreList'
import { getStocksReportById } from 'src/lib/api/getStocksReportById'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import StockMedicineConfigure from 'src/components/pharmacy/stock/StockMedicineConfigure'

const ListOfStocks = () => {
  const [stores, setStores] = useState([])
  const [stockReport, setStockReport] = useState([])
  const [stockId, setStockId] = useState('')
  const [loader, setLoader] = useState(false)
  const [errors, setErrors] = useState('')
  const [configureMedId, setConfigureMedId] = useState('')
  const [show, setShow] = useState(false)

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const getStoresLists = async () => {
    setLoader(true)
    const response = await getStoreList()
    if (response?.length > 0) {
      // console.log('list', response)
      response.sort((a, b) => a.id - b.id)
      setStores(response)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const getStocksReport = async () => {
    // console.log(stockId)
    if (stockId === '' || undefined) {
      setErrors('Please select Store')

      return
    } else {
      const result = await getStocksReportById(stockId)
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
    }
  }
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_items_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'unit_name',
      headerName: 'UOM',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.unit_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'leaf_name',
      headerName: 'LEAF',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.leaf_name}
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
      field: 'stock_box_qty',
      headerName: 'STOCK BOX',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_box_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_purchase_price',
      headerName: 'STOCK PURCHASE PRICE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_purchase_price}
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

              // console.log('line items', params.row)
              // console.log('line itemsb id', params.row.stock_item_id)
              // console.log('storrrrr', stockId)
            }}
          >
            <Icon icon='grommet-icons:configure' />
          </IconButton>
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:delete-outline' />
          </IconButton> */}
        </Box>
      )
    }
  ]

  const createForm = () => {
    return (
      <Grid
        container
        gap={3}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyItems: 'center',
          mx: 6,
          my: 4
        }}
      >
        <Grid item lg={2}>
          <FormControl sx={{ width: '100%' }}>
            <InputLabel id='controlled-select-label'>Stores</InputLabel>
            <Select
              onChange={e => {
                let id = e.target.value
                setStockId(id)
                setStockReport([])
                setConfigureMedId('')
              }}
              label='Stores'
              value={stockId}
              id='controlled-select'
              labelId='controlled-select-label'
              sx={{ width: '100%' }}
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
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

        <Grid item lg={2}>
          <Button
            size='large'
            sx={{ py: 3 }}
            variant='contained'
            onClick={() => {
              getStocksReport()
            }}
          >
            Find
          </Button>
        </Grid>
      </Grid>
    )
  }

  return (
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
            TableTitle={stockReport.length > 0 ? 'Stock Report' : 'Stock Report is empty'}
            inpFields={createForm()}
            headerActions={
              <div>
                <Button
                  onClick={() => {
                    Router.push('/pharmacy/stocks/stockReportByBatch')
                  }}
                  size='big'
                  variant='contained'
                >
                  Stock report bach wise
                </Button>
              </div>
            }
            columns={columns}
            rows={stockReport}
          />
        </>
      )}
    </>
  )
}

export default ListOfStocks
