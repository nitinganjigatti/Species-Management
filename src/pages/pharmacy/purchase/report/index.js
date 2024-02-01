import React, { useState } from 'react'

import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Button, Card, CardHeader, Grid } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import QuickSearchToolbar from 'src/views/table/data-grid/QuickSearchToolbar'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import styled from '@emotion/styled'
import MuiTabList from '@mui/lab/TabList'

const ListOfStocks = () => {
  const TabList = styled(MuiTabList)(({ theme }) => ({
    // '& .MuiTabs-indicator': {
    //   display: 'none'
    // },
    // '& .Mui-selected': {
    //   backgroundColor: theme.palette.primary.main,
    //   color: 'white'
    //   // color: theme.palette.common.white
    // },
    // '& .MuiTab-root': {
    //   minHeight: 38,
    //   minWidth: 110,
    //   borderRadius: 8,
    //   paddingTop: theme.spacing(2),
    //   paddingBottom: theme.spacing(2)
    // }
  }))

  const [searchValue, setSearchValue] = useState('')
  const [loader, setLoader] = useState(false)
  const [value, setValue] = useState('1')
  const [startYear, setStartYear] = useState(null)
  const [endYear, setEndYear] = useState(null)

  const { selectedPharmacy } = usePharmacyContext()

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await fetchScrewTableData({ sort, q: value, column: sortColumn })
  }

  const purchaseArry = [
    {
      id: '01',
      month: 'jan',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '02',
      month: 'feb',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '03',
      month: 'mar',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '04',
      month: 'apr',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '05',
      month: 'may',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '06',
      month: 'june',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '07',
      month: 'july',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '08',
      month: 'aug',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '09',
      month: 'sep',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '10',
      month: 'oct',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '11',
      month: 'nov',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '12',
      month: 'dec',
      2023: '34000',
      2022: '15000',
      2021: '1230',
      2020: '3400',
      2019: '50000',
      2018: '3450'
    },
    {
      id: '13',
      total: 'Total',
      2023: '408000',
      2022: '180000',
      2021: '14760',
      2020: '40800',
      2019: '600000',
      2018: '41400'
    }
  ]

  const pharmacyArry = [
    {
      id: '146',
      date: '2023-02-22',
      invoice_no: 'INV-002',
      purchase_order: 'company eleven',
      amount: '10'
    },
    {
      id: '321',
      date: '2023-02-25',
      invoice_no: 'INV-002',
      purchase_order: 'company nine',
      amount: '20'
    },
    {
      id: '367',
      date: '2023-02-26',
      invoice_no: 'INV-002',
      purchase_order: 'company ten',
      amount: '40'
    },
    {
      id: '383',
      date: '2023-02-27',
      invoice_no: 'INV-002',
      purchase_order: 'company one',
      amount: '30'
    },
    {
      id: '156',
      date: '2023-02-24',
      invoice_no: 'INV-002',
      purchase_order: 'company two',
      amount: '60'
    },
    {
      id: '145',
      date: '2023-02-23',
      invoice_no: 'INV-002',
      purchase_order: 'company three',
      amount: '50'
    },
    {
      id: '146',
      date: '2023-02-22',
      invoice_no: 'INV-002',
      purchase_order: 'company four',
      amount: '70'
    },
    {
      id: '142',
      date: '2023-02-10',
      invoice_no: 'INV-002',
      purchase_order: 'company five',
      amount: '80'
    },
    {
      id: '113',
      date: '2023-02-04',
      invoice_no: 'INV-002',
      purchase_order: 'company six',
      amount: '120'
    },
    {
      id: '112',
      date: '2023-02-29',
      invoice_no: 'INV-002',
      purchase_order: 'company seven',
      amount: '20'
    },
    {
      id: '111',
      date: '2023-02-14',
      invoice_no: 'INV-002',
      purchase_order: 'company eight',
      amount: '50'
    },
    {
      id: '677',
      total: '5678'
    }
  ]

  const purchaseColumn = [
    {
      field: 'id',
      headerName: '# No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          {params.row.total ? '' : params.row.id}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: 'month',
      headerName: 'MONTH',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          {params.row.month ? params.row.month : params.row.total}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '900',
      headerName: '2030',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '300',
      headerName: '2029',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '400',
      headerName: '2028',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '500',
      headerName: '2027',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '600',
      headerName: '2026',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '700',
      headerName: '2025',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '800',
      headerName: '2024',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '2023',
      headerName: '2023',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: 'text.primary',
            fontWeight: params.row.total ? 'bold' : null,
            fontWeight: params.row.total ? 'bold' : null
          }}
        >
          ${params.row[2023]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '2022',
      headerName: '2022',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2022]}
        </Typography>
      )
    },

    {
      minWidth: 20,
      field: '2021',
      headerName: '2021',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2021]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '2020',
      headerName: '2020',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2020]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '2019',
      headerName: '2019',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2019]}
        </Typography>
      )
    },
    {
      minWidth: 20,
      field: '2018',
      headerName: '2018',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row[2018]}
        </Typography>
      )
    }
  ]

  const pharmacyColumn = [
    {
      flex: 0.1,
      Width: 40,
      field: 'id',
      headerName: '#NO ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total ? '' : params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'date',
      headerName: 'DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.date}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'invoice_no',
      headerName: 'INVOICE NUMBER',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.invoice_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'purchase_order',
      headerName: 'PURCHASE ORDER',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          {params.row.total ? 'Total' : params.row.purchase_order}
        </Typography>
      )
    },

    {
      flex: 0.15,
      minWidth: 20,
      field: 'amount',
      headerName: 'AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: params.row.total ? 'bold' : null }}>
          ${params.row.total ? params.row.total : params.row.amount}
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
          {params.row.total ? null : (
            <>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => {}}>
                <Icon icon='material-symbols:download' />
              </IconButton>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => {}}>
                <Icon icon='material-symbols:visibility' />
              </IconButton>
            </>
          )}
        </Box>
      )
    }
  ]

  return selectedPharmacy.type === 'central' ? (
    <>
      <Grid>
        <TabContext value={value}>
          <TabList onChange={handleChange} aria-label='simple tabs example'>
            <Tab value='1' label='Purchase' />
            <Tab value='2' label='Pharmacy' />
          </TabList>
          <TabPanel value='1'>
            {loader ? (
              <FallbackSpinner />
            ) : (
              <>
                <Card>
                  <CardHeader
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Purchase Overview</span>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              value={startYear}
                              onChange={e => setStartYear(e)}
                              slotProps={{ textField: { size: 'small' } }}
                              label={'Start Year'}
                              views={['year']}
                            />
                          </LocalizationProvider>
                          <Typography>To</Typography>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              onChange={e => {
                                setEndYear(e)
                                console.log(e.$y)
                              }}
                              value={endYear}
                              slotProps={{ textField: { size: 'small' } }}
                              label={'End Year'}
                              views={['year']}
                            />
                          </LocalizationProvider>
                          <Button
                            onClick={() => {
                              setStartYear(null)
                              setEndYear(null)
                            }}
                            disabled={startYear === null || endYear === null}
                            variant='contained'
                          >
                            Find
                          </Button>
                        </Box>
                      </div>
                    }
                  />
                  <DataGrid
                    hideFooterPagination
                    hideFooter
                    autoHeight
                    columns={purchaseColumn}
                    slots={{ toolbar: QuickSearchToolbar }}
                    rows={purchaseArry}
                    slotProps={{
                      toolbar: {
                        value: searchValue,
                        clearSearch: () => handleSearch(''),
                        onChange: event => handleSearch(event.target.value)
                      }
                    }}

                    // onRowClick={onRowClick}
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
                  <Card>
                    <CardHeader title='Crocin' />
                    <DataGrid
                      hideFooterPagination
                      autoHeight
                      columns={pharmacyColumn}
                      slots={{ toolbar: QuickSearchToolbar }}
                      rows={pharmacyArry}
                      slotProps={{
                        toolbar: {
                          value: searchValue,
                          clearSearch: () => handleSearch(''),
                          onChange: event => handleSearch(event.target.value)
                        }
                      }}

                      // onRowClick={onRowClick}
                    />
                  </Card>
                </>
              )}
            </>
          </TabPanel>
        </TabContext>
      </Grid>
    </>
  ) : (
    <>
      <Error404></Error404>
    </>
  )
}

export default ListOfStocks
