import { Avatar, Box, Breadcrumbs, Button, Card, CardHeader, IconButton, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import Router from 'next/router'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import AddLabTest from 'src/views/pages/lab/test/addTest'
import { addLabTest, deleteLabTest, getLabTestList, updateLabTest } from 'src/lib/api/lab/master'
import moment from 'moment'
import TestDetails from 'src/views/pages/lab/test/testDetails'
import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'
import Error404 from 'src/pages/404'
import { AuthContext } from 'src/context/AuthContext'

const LabTest = () => {
  const theme = useTheme()
  const router = useRouter()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('label')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const editParamsInitialState = { id: null, label: null, sample_type_count: null, sub_test_count: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const authData = useContext(AuthContext)

  const medical_add_samples = authData?.userData?.permission?.user_settings?.medical_add_samples
  const medical_add_tests = authData?.userData?.permission?.user_settings?.medical_add_tests

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        const params = {
          q,
          sort,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getLabTestList({ params: params }).then(res => {
          console.log(res, 'resqwe')
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.data))
        })
        setResetForm(true)
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(searchValue)
  }, [fetchTableData])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, label: null, sample_type_count: null, sub_test_count: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async payload => {
    console.log(payload, 'ghghhg')

    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateLabTest(editParams?.id, payload)
      } else {
        response = await addLabTest(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setResetForm(true)
        setSubmitLoader(false)
        setOpenDrawer(false)
        await fetchTableData()
      } else {
        Toaster({ type: 'error', message: response?.message })
        setSubmitLoader(false)
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleEdit = async (event, params) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams(params)
    setOpenDrawer(true)
    // console.log('params >>', params)
  }

  const confirmDeleteAction = async () => {
    try {
      setBtnLoader(true)
      const res = await deleteLabTest(selectedId)
      if (res?.success) {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'success', message: res?.message })
        await fetchTableData()
      } else {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setBtnLoader(false)
      setIsModalOpenDelete(false)
    }
  }

  const handleDelete = (event, testId) => {
    event.stopPropagation()
    console.log('Delete:', testId)
    setIsModalOpenDelete(true)
    setSelectedId(testId?.id)

    // Add your logic to handle the delete action
  }

  const columns = [
    {
      flex: 0.3,
      minWidth: 30,
      sortable: false,
      field: 'LAB TEST NAME',
      headerName: 'LAB TEST NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.label ? params.row.label : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.3,
      Width: 30,
      field: 'NO OF SAMPLES TYPES',
      headerName: 'NO OF SAMPLES TYPES',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.sample_type_count ? params.row.sample_type_count : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.3,
      Width: 30,
      field: 'NO OF SUB TESTS ',
      headerName: 'NO OF SUB TESTS ',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.sub_test_count ? params.row.sub_test_count : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 40,
      field: 'user_name',
      headerName: 'CREATED BY',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: theme.palette.customColors.displaybgPrimary,
              overflow: 'hidden'
            }}
          >
            {params.row.created_by_user?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.created_by_user?.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
            </Typography>
            <Typography
              noWrap
              variant='body2'
              sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: 12 }}
            >
              {params.row.created_on ? moment(params.row.created_on).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 30,
      field: 'Action',
      headerName: 'Action',
      sortable: false,

      // headerAlign: 'center',
      renderCell: params => (
        <>
          {parseInt(params.row.zoo_id) === 0 ? null : (
            <Box>
              {/* <FormControlLabel control={<Switch defaultChecked size='small' />} /> */}

              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
              {/* <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleDelete(e, params.row)} aria-label='delete'>
                <Icon icon='mdi:delete-outline' />
              </IconButton> */}
            </Box>
          )}
        </>
      )
    }
  ]

  const handleCellClick = params => {
    setEditParams(params)
    setOpenDetailsDrawer(true)
  }

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.id,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {medical_add_tests ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            {/* <Typography sx={{ cursor: 'pointer' }} color='inherit'>
          Lab
        </Typography> */}
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Lab Master
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
              Lab Tests
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardHeader title='Lab Tests' sx={{ paddingX: 5 }} action={headerAction} />

            <DataGrid
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              columnVisibilityModel={{
                sl_no: false
              }}
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              disableColumnMenu
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbarWithFilter }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => handleSearch(event.target.value)
                }
              }}
              onCellClick={handleCellClick}
            />
          </Card>
          {openDrawer && (
            <AddLabTest
              addEventSidebarOpen={openDrawer}
              setOpenDrawer={setOpenDrawer}
              handleSubmitData={handleSubmitData}
              resetForm={resetForm}
              submitLoader={submitLoader}
              editParams={editParams}
            />
          )}
          {openDetailsDrawer && (
            <TestDetails
              addEventSidebarOpen={openDetailsDrawer}
              setOpenDetailsDrawer={setOpenDetailsDrawer}
              editParams={editParams}
              setOpenDrawer={setOpenDrawer}
              fetchTableData={fetchTableData}
            />
          )}
          <ConfirmationDeleteDialog
            open={isModalOpenDelete}
            onClose={() => setIsModalOpenDelete(false)}
            confirmLoading={btnLoader}
            onConfirm={confirmDeleteAction}
            title='Are you sure you want to delete this lab test?'
          />
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default LabTest
