import React, { useState, useCallback, useEffect } from 'react'
import {
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/router'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Search from 'src/views/utility/Search'
import { AddButtonContained } from 'src/components/ButtonContained'
import FilterListIcon from '@mui/icons-material/FilterList'

const ShipmentPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('cities')
  const [searchValue, setSearchValue] = useState('')
  const [filterDate, setFilterDate] = useState({})
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState([])
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const filterCount = 0

  const handleSearch = useCallback(val => {
    setPaginationModel({ page: 0, pageSize: 10 })
    setSearchValue(val)
  }, [])

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue)
  }

  const fetchShipments = useCallback(() => {
    setLoading(true)

    // mock API call logic here
    const sampleData = Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      shipmentId: `72WS124243${20 + i}`,
      shipmentDate: '30 Oct 2024',
      exports: 2,
      species: 5,
      animals: 3,
      documents: 1
    }))
    setRows(sampleData)
    setTotal(60)
    setLoading(false)
  }, [])

  const handleFilterDrawer = () => {}

  useEffect(() => {
    fetchShipments()
  }, [searchValue, filterDate, activeTab])

  const columns = [
    { field: 'shipmentId', headerName: 'SHIPMENT ID', flex: 0.2 },
    { field: 'shipmentDate', headerName: 'SHIPMENT DATE', flex: 0.2 },
    { field: 'exports', headerName: 'EXPORTS', flex: 0.1 },
    { field: 'species', headerName: 'SPECIES', flex: 0.1 },
    { field: 'animals', headerName: 'ANIMALS', flex: 0.1 },
    { field: 'documents', headerName: 'DOCUMENTS', flex: 0.1 },
    {
      field: 'actions',
      headerName: 'ACTIONS',
      flex: 0.1,
      sortable: false,
      renderCell: () => (
        <IconButton>
          <Icon icon='tabler:dots-vertical' />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Shipments</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title='Shipment Documents'
          titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
          action={
            <AddButtonContained
              title='Add New'
              action={() => router.push('/compliance/documents/shipments/AddEditShipment')}
            />
          }
          sx={{ px: 5, pb: 0 }}
        />
        {/* <Box sx={{ px: 5, borderBottom: theme => `1px solid ${theme.palette.divider}`, mt: 2, mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange} indicatorColor='primary' textColor='primary'>
            <Tab value='cities' label='CITIES' />
            <Tab value='non-cities' label='Non - CITIES' />
          </Tabs>
        </Box> */}

        <Grid container spacing={4} sx={{ px: 5, py: 2, mt: 2 }} alignItems='center'>
          <Grid item xs={12} md={4}>
            <Search
              placeholder='Search'
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
            />
          </Grid>
          <Grid item xs={12} md={2} />
          <Grid item xs={12} md={4.5}>
            <CommonDateRangePickers
              filterDates={filterDate}
              onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
            />
          </Grid>
          <Grid item xs={12} md={1.5}>
            <Grid item xs='auto'>
              <Button
                variant='outlined'
                startIcon={<FilterListIcon />}
                endIcon={
                  <Badge
                    badgeContent={filterCount}
                    color='primary'
                    invisible={filterCount === 0}
                    sx={{ ml: 2, mr: 2 }}
                  />
                }
                sx={{
                  border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  height: '40px',

                  // textTransform: 'none',
                  width: { xs: '100%', md: 'auto' },
                  color: 'customColors.OnSurfaceVariant'
                }}
                onClick={handleFilterDrawer}
              >
                Filter
              </Button>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <CommonTable
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={newModel => setSortModel(newModel)}
              loading={loading}
            />
          </Grid>
        </Grid>
      </Card>
    </>
  )
}

export default ShipmentPage
