import React, { useState, useMemo } from 'react'

// ** MUI Imports
import {
  alpha,
  Box,
  Button,
  Card,
  CardHeader,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  useTheme,
  Tooltip,
  Badge
} from '@mui/material'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

// ** Table Component
import CommonTable from 'src/views/table/data-grid/CommonTable'

import { AddButtonContained } from 'src/components/ButtonContained'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import AddEnclosures from 'src/views/pages/hospital/roomsAndEnclosures/AddEnclosures'

const tableDta = [
  { id: 1, enclosure_name: 'Enclosure name 1', area: 'Emergency Room ', floor: 'Ground', occupancy: 'Available' },
  { id: 2, enclosure_name: 'Enclosure name 2', area: 'ICU', floor: 'Ground', occupancy: 'Occupied' }
]

const RoomsAndEnclosures = () => {
  const theme = useTheme()

  const editParamsInitialState = { id: null, area: null, floor: null, enclosure: '', occupancy: null }

  const occupancyOptions = ['Available', 'Occupied', 'Unavailable']

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const [rowData, setRowData] = useState(tableDta)

  // Filter rows by search value
  const filteredRows = useMemo(() => {
    if (!searchValue) return rowData
    const search = searchValue.toLowerCase()

    return rowData.filter(
      row =>
        row.enclosure_name.toLowerCase().includes(search) ||
        row.area.toLowerCase().includes(search) ||
        row.floor.toLowerCase().includes(search) ||
        row.occupancy.toLowerCase().includes(search)
    )
  }, [searchValue, rowData])

  // ** Returns styling for each occupancy status (for dropdown and chip backgrounds)
  const getOccupancyStyles = status => {
    switch (status.toLowerCase()) {
      case 'available':
        return {
          backgroundColor: theme.palette.customColors.antzInfoLight,
          color: theme.palette.customColors.addPrimary
        }
      case 'occupied':
        return {
          backgroundColor: theme.palette.customColors.OnBackground,
          color: theme.palette.customColors.OnSurface
        }
      case 'unavailable':
        return {
          backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.4),
          color: theme.palette.customColors.Tertiary
        }
      default:
        return {
          backgroundColor: theme.palette.customColors.Surface,
          color: theme.palette.text.primary
        }
    }
  }

  const columns = [
    {
      minWidth: 50,
      field: 'id',
      headerName: 'NO',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.OnSurfaceVariant, pl: 3 }}>
          {parseInt(params.row.id)}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'enclosure_name',
      headerName: 'Enclosure Name',
      textAlign: 'center',
      renderCell: params => (
        <TextEllipsisWithModal
          text={params.row.enclosure_name}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '230px'
          }}
        />
      )
    },
    {
      minWidth: 250,
      field: 'area',
      headerName: 'Area/Zone',
      textAlign: 'center',
      renderCell: params => (
        <TextEllipsisWithModal
          text={params.row.area}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '230px'
          }}
        />
      )
    },

    {
      minWidth: 200,
      field: 'floor',
      headerName: 'Floor',
      renderCell: params => (
        <TextEllipsisWithModal
          text={params.row.floor}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '180px'
          }}
        />
      )
    },
    {
      minWidth: 200,
      field: 'occupancy',
      headerName: 'Occupancy',
      sortable: false,
      renderCell: params => {
        const styles = getOccupancyStyles(params.row.occupancy)

        const handleChange = event => {
          const newValue = event.target.value
          setRowData(prev => prev.map(row => (row.id === params.row.id ? { ...row, occupancy: newValue } : row)))
        }

        return (
          <Box sx={{ width: '100%', px: 2, py: 1, borderRadius: '4px', backgroundColor: styles.backgroundColor }}>
            <TextField
              select
              value={params.row.occupancy}
              onChange={handleChange}
              variant='standard'
              fullWidth
              slotProps={{
                input: {
                  disableUnderline: true, // remove underline,
                  onClick: e => e.stopPropagation()
                }
              }}
              sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                '& .MuiSelect-select': { color: styles.color }
              }}
            >
              {occupancyOptions.map(option => {
                const optionStyle = getOccupancyStyles(option)

                return (
                  <MenuItem key={option} value={option} sx={{ color: optionStyle.color }}>
                    {option}
                  </MenuItem>
                )
              })}
            </TextField>
          </Box>
        )
      }
    },
    {
      minWidth: 150,
      field: 'Action',
      headerAlign: 'right',
      headerName: 'Actions',
      align: 'right',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Tooltip title='Delete' placement='top'>
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:delete' color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  const handleSearch = value => {
    setSearchValue(value)
  }

  const handleSubmitData = async payload => {
    console.log('Submit Payload:', payload)
    setOpenDrawer(false)
  }

  const addEventSidebarOpen = () => {
    setEditParams(editParamsInitialState)
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  return (
    <>
      <Card sx={{ p: 6 }}>
        <CardHeader
          sx={{
            display: 'flex',
            padding: '0 0 24px 0'
          }}
          title={
            <Typography
              sx={{
                color: theme.palette.customColors.onSurfaceVariant,
                fontSize: '1.25rem',
                fontWeight: 500
              }}
            >
              Enclosures
            </Typography>
          }
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              sx={{ py: 2, borderRadius: '4px' }}
              onClick={addEventSidebarOpen}
            >
              Add New
            </Button>
          }
        />

        {/* Search + Filter */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: { sm: 'space-between' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 3,
            mb: 1
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${theme.palette.customColors.Outline}`,
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px',
              width: {
                xs: '100%',
                sm: '220px'
              }
            }}
          >
            <Icon icon='mi:search' fontSize={20} color={theme.palette.customColors.onSurfaceVariant} />
            <TextField
              variant='outlined'
              placeholder='Search'
              onChange={e => handleSearch(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-end', sm: 'flex-start' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <Button
              variant='outlined'
              startIcon={
                <TuneRoundedIcon
                  sx={{ height: '24px', width: '24px' }}
                  color={theme.palette.customColors.OnSurfaceVariant}
                />
              }
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                borderColor: theme.palette.customColors.OutlineVariant,
                borderRadius: '4px',
                py: 2
              }}
            >
              Filter
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <CommonTable
          columns={columns}
          loading={loading}
          indexedRows={filteredRows}
          rowHeight={60}
          total={filteredRows.length}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          searchValue={searchValue}
        />
      </Card>

      {/* Drawer */}
      <AddEnclosures
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
      />
    </>
  )
}

export default RoomsAndEnclosures
