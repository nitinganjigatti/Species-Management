import React, { useState, useMemo, useEffect, useCallback } from 'react'

// ** MUI Imports
import { Box, Button, Card, CardHeader, Typography, IconButton, useTheme, Tooltip, MenuItem } from '@mui/material'

// ** Icons
import { Add as AddIcon } from '@mui/icons-material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'

// ** Custom Components
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'

// ** API
import { addHospitalMaster, getHospitalMaster, updateHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'
import AddHospital from 'src/views/pages/hospital/masters/hospital'

// ** View component

const Hospital = () => {
  const theme = useTheme()
  const router = useRouter()

  const editParamsInitialState = {
    id: null,
    hospital_name: '',
    location: '',
    is_internal_hospital: null
  }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [resetForm, setResetForm] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [searchValue, setSearchValue] = useState('')

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: ''
  })

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query
    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q
    })
    setSearchValue(q)
  }, [router.query])

  const queryKey = useMemo(() => ['hospital-list', filters], [filters])

  const { data, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      getHospitalMaster({
        params: {
          page: filters.page,
          limit: filters.limit,
          q: filters.q
        }
      }),
    keepPreviousData: true,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true
  })

  const rows = data?.data?.hospitals || []
  const total = data?.data?.total || 0

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== '') params.set(key, value.toString())
    })
    router.push({ pathname: router.pathname, query: params.toString() }, undefined, {
      shallow: true
    })
  }

  const handlePaginationChange = model => {
    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
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

  // Add serial numbers to each row based on current pagination
  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

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

  const handleEdit = row => {
    setEditParams(row)
    setOpenDrawer(true)
  }

  const handleDeleteDialogOpen = row => {
    setSelectedItemToDelete(row)
    setDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false)
    setDeleteLoading(false)
    setSelectedItemToDelete(null)
  }

  // update and add hospital
  const handleSubmitData = async payload => {
    setSubmitLoader(true)
    try {
      const response = editParams.id
        ? await updateHospitalMaster(editParams.id, payload)
        : await addHospitalMaster(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response.message || 'Hospital created successfully' })
        refetch()

        setResetForm(true)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error) {
      console.error(error)
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
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      minWidth: 230,
      field: 'hospital_name',
      headerName: 'Hospital Name',
      textAlign: 'center',
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params.row.hospital_name}
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
      field: 'location',
      headerName: 'Location',
      textAlign: 'center',
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params.row.location}
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
      minWidth: 180,
      field: 'is_internal_hospital',
      headerName: 'Internal Hospital',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4
          }}
        >
          {params.row.is_internal_hospital === '1' ? 'Yes' : 'No'}
        </Typography>
      )
    },
    {
      minWidth: 130,
      field: 'active',
      headerName: 'Status',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4
          }}
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      minWidth: 150,
      field: 'actions',
      headerName: 'Actions',
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title='Delete'>
            <IconButton onClick={() => handleDeleteDialogOpen(params.row)} size='small'>
              <Icon icon='mdi:delete' color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
          <Tooltip title='Edit'>
            <IconButton onClick={() => handleEdit(params.row)} size='small'>
              <Icon icon='mdi:pencil-outline' />
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
              Hospital
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
            placeholder='Search by Hospital Name / Location'
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
          columns={columns}
          indexedRows={indexedRows}
          rowHeight={60}
          total={total}
          loading={isFetching}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
          setPaginationModel={handlePaginationChange}
          searchValue=''
        />
      </Card>

      {/* Drawer */}
      {openDrawer && (
        <AddHospital
          handleSidebarOpen={openDrawer}
          handleSidebarClose={handleSidebarClose}
          handleSubmitData={handleSubmitData}
          resetForm={resetForm}
          submitLoader={submitLoader}
          editParams={editParams}
        />
      )}
      {/* Confirmation Dialog for delete */}
      {deleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={deleteDialog}
          onClose={handleCloseDeleteDialog}
          title={'Delete Hospital?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={() => {}}
          loading={deleteLoading}
          ConfirmationText={'DELETE'}
          description={'Are you sure you want to permanently delete this Hospital?'}
        />
      )}
    </>
  )
}

export default Hospital
