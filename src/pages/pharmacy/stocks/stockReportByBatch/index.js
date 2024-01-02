import React, { useState, useEffect } from 'react'

import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getStocksByBatch } from 'src/lib/api/pharmacy/getStocksByBatch'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { Box } from '@mui/material'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import StockMedicineConfigure from 'src/components/pharmacy/stock/StockMedicineConfigure'

const ListOfStocksByBatch = () => {
  const [stores, setStores] = useState([])
  const [stockReport, setStockReport] = useState([])
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

  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { q: 'local', column: 'type' } })
      console.log('list', response)
      if (response?.data?.list_items?.length > 0) {
        console.log('list', response)
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStores(response?.data?.list_items)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      console.log('error', error)
    }
  }

  const getStocksReport = async id => {
    // console.log(stockId)
    if (id === '' || undefined) {
      setErrors('Please select Store')

      return
    } else {
      try {
        const result = await getStocksByBatch(id)
        if (result.success === true && result.data !== '') {
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
                setErrors('')
                getStocksReport(id)
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
      </Grid>
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
                formComponent={<StockMedicineConfigure configureMedId={configureMedId} storeId={stockId} />}
                close={closeDialog}
                show={showDialog}
              />
              <TableWithFilter
                TableTitle={stockReport.length > 0 ? 'Stock report batch wise' : 'Stock Report is empty'}
                inpFields={createForm()}
                columns={columns}
                rows={stockReport}
              />
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
