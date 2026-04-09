'use client'

/* eslint-disable no-undef */
import React, { useState, useMemo, useEffect, useCallback } from 'react'

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
  Tooltip
} from '@mui/material'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

// ** Custom Components
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import Toaster from 'src/components/Toaster'

//api functions
import {
  addRoomsAndEnclosures,
  deleteRoomsAndEnclosures,
  getRoomsAndEnclosures,
  updateRoomsAndEnclosures
} from 'src/lib/api/hospital/roomsAndEnclosures'

// ** Next.js Router
import useSafeRouter from 'src/hooks/useSafeRouter'
import { debounce } from 'lodash'

// ** React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ** View component
import AddEnclosures from 'src/views/pages/hospital/add-enclosure-drawer'
import Search from 'src/views/utility/Search'

const RoomsAndEnclosures = () => {
  const theme = useTheme()
  const router = useSafeRouter()
  const queryClient = useQueryClient()

  const occupancyOptions = [
    { label: 'Available', value: '0' },
    { label: 'Occupied', value: '1' }
  ]

  const editParamsInitialState = { id: null, bed_name: '' }

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [selectedOccupancy, setSelectedOccupancy] = useState(occupancyOptions)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null)
  const [searchValue, setSearchValue] = useState('')

  const [filters, setFilters] = useState({
    page: 1,
    per_page: 50,
    q: ''
  })

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

  useEffect(() => {
    const { page = '1', per_page = '50', q = '' } = router.query
    setFilters({
      page: parseInt(page),
      per_page: parseInt(per_page),
      q
    })
    setSearchValue(q)
  }, [router.query])

  const queryKey = useMemo(() => ['enclosure-list', filters], [filters])

  // ** React Query: Fetch Room & Enclosure Data with Pagination
  const { data, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      getRoomsAndEnclosures({
        hospital_id: 1, // later need to change dynamically hospital_id
        page: filters.page,
        per_page: filters.per_page
      }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 1, // 1 min cache
    refetchOnMount: true, // fetch latest when component mounts if stale
    refetchOnWindowFocus: true
  })

  // ** Extract Table Rows and Total Count
  const rows = data?.data?.records || []
  const total = parseInt(data?.data?.total) || 0

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== '') params.set(key, value.toString())
    })
    const queryString = params.toString()
    router.push(`${router.pathname}?${queryString}`)
  }

  // ** Handle Pagination Change and Sync with URL
  const handlePaginationChange = model => {
    const updated = {
      ...filters,
      page: model.page + 1,
      per_page: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        const updated = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters]
  )

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const getSlNo = index => (filters.page - 1) * filters.per_page + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

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

  const handleDeleteDialogClose = () => {
    setDeleteDialog(false)
    setSelectedItemToDelete(null)
  }

  // ** React Query: delete enclosures
  const deleteEnclosureMutation = useMutation({
    mutationFn: async id => {
      const payload = { hospital_id: 1, bed_id: id } // later need to change  hospital_id

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

  // update and add enclosures
  const handleSubmitData = async payload => {
    setSubmitLoader(true)

    try {
      let response
      if (editParams?.id) {
        response = await updateRoomsAndEnclosures(editParams?.id, payload)
      } else {
        response = await addRoomsAndEnclosures(payload)
      }
      if (response?.success) {
        setResetForm(true)
        Toaster({ type: 'success', message: response?.message || 'Enclosure created successfully' })

        await refetch() // Refetch data after successful submit
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error) {
      console.error('Submit Error:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setSubmitLoader(false)
      setOpenDrawer(false)
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
      minWidth: 300,
      field: 'bed_name',
      headerName: 'Enclosure Name',
      textAlign: 'center',
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          enableDialog={false}
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
          setSelectedOccupancy(prev =>
            prev.map(row => (row.id === params.row.id ? { ...row, is_occupied: newValue } : row))
          )
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => handleDeleteDialogOpen(params.row)}>
              <Icon icon='mdi:delete' color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

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
          <Search
            borderRadius={'4px'}
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={handleSearchClear}
            placeholder='Search by Enclosure Name'
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontSize: '13px'
              }
            }}
          />
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
          loading={isFetching}
          columns={columns}
          indexedRows={indexedRows}
          total={total}
          rowHeight={60}
          paginationModel={{ page: filters.page - 1, pageSize: filters.per_page }}
          setPaginationModel={handlePaginationChange}
          searchValue=''
        />
      </Card>
      {/* Drawer */}
      {openDrawer && (
        <AddEnclosures
          handleSidebarOpen={openDrawer}
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
