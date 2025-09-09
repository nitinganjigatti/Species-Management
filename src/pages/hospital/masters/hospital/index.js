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

// ** Table Component
import CommonTable from 'src/views/table/data-grid/CommonTable'

import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import AddHospital from 'src/views/pages/hospital/masters/hospital'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { addHospitalMaster, getHospitalMaster, updateHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

const Hospital = () => {
  const theme = useTheme()
  const router = useRouter()

  const editParamsInitialState = {
    id: null,
    hospital_name: null,
    location: null,
    is_internal_hospital: null
  }

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const updateUrlParams = params => {
    console.log(params, 'params')

    const query = { ...router.query, ...params }
    console.log(query, 'query')

    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
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
      minWidth: 230,
      field: 'hospital_name',
      headerName: 'Hospital Name',
      textAlign: 'center',
      renderCell: params => (
        <TextEllipsisWithModal
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
      renderCell: params => (
        <TextEllipsisWithModal
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
      renderCell: params => (
        <Typography
          variant='body2'
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
            alignItems: 'center',
            gap: 1
          }}
        >
          <Tooltip title='Delete' placement='top'>
            <IconButton size='small' aria-label='Delete' onClick={handleDeleteDialog}>
              <Icon icon='mdi:delete' color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
          <Tooltip title='Edit' placement='top'>
            <IconButton size='small' aria-label='Edit' onClick={() => handleEdit(params.row)}>
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  const fetchTableData = useCallback(async ({ search, page, per_page }) => {
    try {
      setLoading(true)

      const params = {
        search,
        page: page + 1,
        per_page
      }

      const res = await getHospitalMaster({ params })
      if (res?.success && res?.data?.hospitals?.length > 0) {
        setTotal(parseInt(res?.data?.total))
        setRows(res?.data?.hospitals)
      } else {
        setRows([])
        setTotal(0)
      }

      setLoading(false)
    } catch (e) {
      console.error('Error fetching hospital Lists', e)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTableData({
      search: searchValue,
      page: paginationModel?.page,
      per_page: paginationModel?.pageSize
    })
  }, [paginationModel?.page, paginationModel?.pageSize, searchValue, fetchTableData])

  // const handleSortModel = async newModel => {
  //   if (newModel.length > 0) {
  //     setSort(newModel[0].sort)
  //     setSortColumn(newModel[0].field)
  //     await fetchTableData({
  //       search: searchValue,
  //       page: paginationModel?.page,
  //       per_page: paginationModel?.pageSize,
  //       sort: newModel[0].sort,
  //       column: newModel[0].field
  //     })

  //     updateUrlParams({
  //       search: searchValue,
  //       page: paginationModel?.page,
  //       per_page: paginationModel?.pageSize,
  //       sort: newModel[0].sort,
  //       column: newModel[0].field
  //     })
  //   }
  // }

  const searchTableData = useCallback(
    debounce(async search => {
      try {
        setSearchValue(search)
        await fetchTableData({ search, page: 0, per_page: paginationModel?.pageSize })
        setPaginationModel(prev => ({
          ...prev,
          page: 0
        }))

        updateUrlParams({
          search,
          page: 0,
          per_page: paginationModel?.pageSize
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [fetchTableData]
  )

  const handleSearch = value => {
    searchTableData(value, paginationModel?.page, paginationModel?.pageSize)
  }

  // update and add hospital
  const handleSubmitData = async payload => {
    console.log(payload, 'editPayload')

    try {
      setSubmitLoader(true)
      console.log('sssssss:', payload)

      let response
      if (editParams?.id !== null) {
        response = await updateHospitalMaster(editParams?.id, payload)
        console.log(response, 'response')
      } else {
        response = await addHospitalMaster(payload)
      }
      if (response?.success) {
        toast.success(response?.message)
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await fetchTableData({
          search: searchValue,
          page: paginationModel.page,
          per_page: paginationModel.pageSize
        })
      } else {
        setSubmitLoader(false)
        toast.error(response?.message)
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
    }
  }

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const addEventSidebarOpen = () => {
    setEditParams({
      id: null,
      hospital_name: null,
      location: null,
      is_internal_hospital: null
    })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleDeleteDialog = () => {
    setDeleteDialog(true)
  }

  const handleEdit = params => {
    const { id, hospital_name, location, is_internal_hospital } = params
    console.log(params, 'params')

    setEditParams({
      id,
      hospital_name,
      location,
      is_internal_hospital
    })

    setOpenDrawer(true)
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
          indexedRows={indexedRows}
          rowHeight={60}
          total={total}
          paginationModel={paginationModel}
          // handleSortModel={handleSortModel}
          setPaginationModel={setPaginationModel}
          loading={loading}
          searchValue={searchValue}
        />
      </Card>

      {/* Drawer */}
      {openDrawer && (
        <AddHospital
          addEventSidebarOpen={openDrawer}
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
          onClose={() => setDeleteDialog(false)}
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
