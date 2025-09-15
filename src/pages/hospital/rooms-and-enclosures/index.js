import React, { useState, useMemo, useCallback, useEffect } from 'react'

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

import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import AddEnclosures from 'src/views/pages/hospital/roomsAndEnclosures/AddEnclosures'
import {
  addRoomsAndEnclosures,
  deleteRoomsAndEnclosures,
  getRoomsAndEnclosures,
  updateRoomsAndEnclosures
} from 'src/lib/api/hospital/roomsAndEnclosures'
import toast from 'react-hot-toast'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { useRouter } from 'next/router'

const RoomsAndEnclosures = () => {
  const theme = useTheme()
  const router = useRouter()

  const editParamsInitialState = { id: null, bed_name: '' }

  const occupancyOptions = [
    { label: 'Available', value: '0' },
    { label: 'Occupied', value: '1' }
  ]

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [rowData, setRowData] = useState([])
  const [total, setTotal] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null)

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  // ** Returns styling for each occupancy status (for dropdown and chip backgrounds)
  const getOccupancyStyles = status => {
    switch (status) {
      // case 'available':
      case '0':
        return {
          backgroundColor: theme.palette.customColors.antzInfoLight,
          color: theme.palette.customColors.addPrimary
        }

      // case 'occupied':
      case '1':
        return {
          backgroundColor: theme.palette.customColors.OnBackground,
          color: theme.palette.customColors.OnSurface
        }

      // case 'unavailable':
      //   return {
      //     backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.4),
      //     color: theme.palette.customColors.Tertiary
      //   }
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
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.OnSurfaceVariant, pl: 3 }}>
          {parseInt(params.row.sl_no)}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'bed_name',
      headerName: 'Enclosure Name',
      textAlign: 'center',
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          text={params.row.bed_name}
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
      field: 'is_occupied',
      headerName: 'Occupancy',
      sortable: false,
      renderCell: params => {
        const styles = getOccupancyStyles(params.row.is_occupied)

        const handleChange = event => {
          const newValue = event.target.value
          setRowData(prev => prev.map(row => (row.id === params.row.id ? { ...row, is_occupied: newValue } : row)))
        }

        return (
          <Box sx={{ width: '100%', px: 2, py: 1, borderRadius: '4px', backgroundColor: styles.backgroundColor }}>
            <TextField
              select
              value={params.row.is_occupied}
              onChange={handleChange}
              variant='standard'
              fullWidth
              slotProps={{
                input: {
                  disableUnderline: true, // to remove underline,
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
                const optionStyle = getOccupancyStyles(option.value)

                return (
                  <MenuItem key={option.value} value={option.value} sx={{ color: optionStyle.color }}>
                    {option.label}
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
            <IconButton size='small' onClick={() => handleDeleteDialogOpen(params.row)}>
              <Icon icon='mdi:delete' color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  // Fetch enclosure data and update table
  const fetchTableData = useCallback(async (page, limit, q = '') => {
    try {
      setLoading(true)

      const params = {
        page: page + 1,
        limit,
        hospital_id: 1,
        q
      }
      const res = await getRoomsAndEnclosures(params)
      if (res?.success && res?.data?.records?.length > 0) {
        setTotal(res?.data?.total)
        setRowData(res?.data?.records)
      } else {
        setTotal(0)
        setRowData([])
      }
    } catch (e) {
      console.log('Error fetching enclosures lists', e)
      setTotal(0)
      setRowData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTableData(paginationModel.page, paginationModel.pageSize, searchValue)
    updateUrlParams({
      page: paginationModel.page,
      limit: paginationModel.pageSize,
      q: searchValue
    })
  }, [fetchTableData, paginationModel.page, paginationModel.pageSize, searchValue])

  // Add serial numbers to each row based on current pagination
  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rowData?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handlePaginationChange = model => {
    setPaginationModel(model)
    updateUrlParams({
      page: model.page,
      limit: model.pageSize,
      q: searchValue
    })
  }

  // update and add enclosures
  const handleSubmitData = async payload => {
    console.log('Submit Payload:', payload)

    try {
      setSubmitLoader(true)

      let response
      if (editParams?.id !== null) {
        response = await updateRoomsAndEnclosures(editParams.id, payload)
      } else {
        response = await addRoomsAndEnclosures(payload)
      }
      if (response?.success) {
        setResetForm(true)
        toast.success(response.message)

        await fetchTableData({
          page: paginationModel.page,
          limit: paginationModel.pageSize
        })
      } else {
        toast.error(response?.message)
      }
    } catch (error) {
      console.error('Submit Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSubmitLoader(false)
      setOpenDrawer(false)
    }
  }

  const addEventSidebarOpen = () => {
    setEditParams(editParamsInitialState)
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleDeleteDialogOpen = row => {
    setDeleteDialog(true)
    setSelectedItemToDelete(row)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false)
    setDeleteLoading(false)
    setSelectedItemToDelete(null)
  }

  const handleSearch = value => {
    setSearchValue(value)
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
  }

  const confirmDeleteAction = async () => {
    try {
      setDeleteLoading(true)

      const payLoad = { hospital_id: 1, bed_id: selectedItemToDelete?.id }
      const response = await deleteRoomsAndEnclosures(payLoad)
      if (response?.success) {
        await fetchTableData({
          page: paginationModel.page,
          limit: paginationModel.pageSize
        })

        handleCloseDeleteDialog()
        toast.success(response.message)
      } else {
        toast.error(response?.message)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An error occurred while deleting.')
    } finally {
      setDeleteLoading(false)
    }
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
          loading={loading}
          columns={columns}
          indexedRows={indexedRows}
          total={total}
          rowHeight={60}
          searchValue={searchValue}
          paginationModel={paginationModel}
          setPaginationModel={handlePaginationChange}
        />
      </Card>

      {/* Drawer */}
      {openDrawer && (
        <AddEnclosures
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={handleSidebarClose}
          handleSubmitData={handleSubmitData}
          resetForm={resetForm}
          submitLoader={submitLoader}
          editParams={editParams}
        />
      )}
      {/* delete  */}
      {deleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={deleteDialog}
          onClose={handleCloseDeleteDialog}
          title={'Delete Enclosure?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={confirmDeleteAction}
          loading={deleteLoading}
          ConfirmationText={'DELETE'}
          description={'Are you sure you want to permanently delete this Enclosure?'}
        />
      )}
    </>
  )
}

export default RoomsAndEnclosures
