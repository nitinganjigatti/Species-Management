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

//icons
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

// ** Custom Components
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import ConfirmationDialog from 'src/components/confirmation-dialog'

//toast
import Toaster from 'src/components/Toaster'

//api functions
import {
  addRoomsAndEnclosures,
  deleteRoomsAndEnclosures,
  getRoomsAndEnclosures,
  updateRoomsAndEnclosures
} from 'src/lib/api/hospital/roomsAndEnclosures'

//router
import { useRouter } from 'next/router'

// ** React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const RoomsAndEnclosures = () => {
  const theme = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const occupancyOptions = [
    { label: 'Available', value: '0' },
    { label: 'Occupied', value: '1' }
  ]

  const editParamsInitialState = { id: null, bed_name: '' }

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [searchValue, setSearchValue] = useState(router.query.q || '')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null)

  // ** styling for each occupancy status (for dropdown and chip backgrounds)
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

  // ** Update URL Query Parameters
  const updateUrlParams = params => {
    const query = {
      ...router.query,
      ...params,
      hospital_id: 1
    }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  // ** Handle Pagination Change and Sync with URL
  const handlePaginationChange = newModel => {
    setPaginationModel(newModel)
    updateUrlParams(newModel)
  }

  // ** Query Key and Params (memoized for stability)
  const queryKey = useMemo(
    () => ['enclosure-list', paginationModel.page, paginationModel.pageSize],
    [paginationModel.page, paginationModel.pageSize]
  )

  const queryParams = useMemo(
    () => ({
      hospital_id: 1,
      page: paginationModel.page + 1, // assuming backend expects 1-based pages
      limit: paginationModel.pageSize
    }),
    [paginationModel.page, paginationModel.pageSize]
  )

  // ** React Query: Fetch Room & Enclosure Data with Pagination
  const {
    data,
    isFetching: loading,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => getRoomsAndEnclosures(queryParams),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 1 // 1 min cache
  })

  // ** React Query: Fetch Room & Enclosure Data with Pagination
  // const {
  //   data,
  //   isFetching: loading,
  //   refetch
  // } = useQuery({
  //   queryKey: ['enclosure-list', paginationModel.page, paginationModel.pageSize],
  //   queryFn: () =>
  //     getRoomsAndEnclosures({
  //       hospital_id: 1,
  //       page: paginationModel.page + 1,
  //       limit: paginationModel.pageSize
  //     }),
  //   keepPreviousData: true,
  //   staleTime: 1000 * 60 * 1 // Optional: Cache data for 1 minute
  // })

  // ** Extract Table Rows and Total Count
  const rows = data?.data?.records || []
  const total = data?.data?.total ? parseInt(data.data.total) : 0

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
          setRows(prev => prev.map(row => (row.id === params.row.id ? { ...row, is_occupied: newValue } : row)))
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
            <span>
              <IconButton size='small' onClick={() => handleDeleteDialogOpen(params.row)}>
                <Icon icon='mdi:delete' color={theme.palette.customColors.Error} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )
    }
  ]

  // Add serial numbers to each row based on current pagination
  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  // update and add enclosures
  const handleSubmitData = async payload => {
    setSubmitLoader(true)

    try {
      let response
      if (editParams?.id !== null) {
        response = await updateRoomsAndEnclosures(editParams.id, payload)
      } else {
        response = await addRoomsAndEnclosures(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Successfully saved' })
        setResetForm(true)

        await refetch() // Refetch data after successful submit
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to save' })
      }
    } catch (error) {
      console.error('Submit Error:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setSubmitLoader(false)
      setOpenDrawer(false)
    }
  }

  const handleSidebarOpen = () => {
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

  const handleDeleteDialogClose = () => {
    setDeleteDialog(false)
    setSelectedItemToDelete(null)
  }

  // ** React Query: delete enclosures
  const deleteEnclosureMutation = useMutation({
    mutationFn: async id => {
      const payload = { hospital_id: 1, bed_id: id }

      return await deleteRoomsAndEnclosures(payload)
    },
    onSuccess: response => {
      Toaster({ type: 'success', message: response?.message || 'Enclosure deleted successfully' })
      queryClient.invalidateQueries({ queryKey: ['enclosure-list'] })
      handleDeleteDialogClose()
    },
    onError: error => {
      console.error('Delete Error:', error)
      Toaster({ type: 'error', message: error?.message || 'An error occurred while deleting' })
    }
  })

  // ** Confirm Delete Action
  const confirmDeleteAction = () => {
    if (!selectedItemToDelete?.id) return
    deleteEnclosureMutation.mutate(selectedItemToDelete.id)
  }

  const handleSearch = value => {
    setSearchValue(value)
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
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
              onClick={handleSidebarOpen}
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
          // setPaginationModel={setPaginationModel}
          setPaginationModel={handlePaginationChange}
        />
      </Card>
      {/* Drawer */}
      {/* {openDrawer && (
        <AddEnclosures
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={handleSidebarClose}
          handleSubmitData={handleSubmitData}
          resetForm={resetForm}
          submitLoader={submitLoader}
          editParams={editParams}
        />
      )} */}
      {/* delete  */}
      {deleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={deleteDialog}
          onClose={handleDeleteDialogClose}
          title={'Delete Enclosure?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={confirmDeleteAction}
          loading={deleteEnclosureMutation.isPending}
          ConfirmationText={'DELETE'}
          description={'Are you sure you want to permanently delete this Enclosure?'}
        />
      )}
    </>
  )
}

export default RoomsAndEnclosures
