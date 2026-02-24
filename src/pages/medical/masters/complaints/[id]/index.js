import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import Router from 'next/router'
import {
  addMedicalComplaintOrDiagnosis,
  getMedicalCategoryListById,
  updateMedicalCategory,
  updateMedicalCategoryComplaint
} from 'src/lib/api/medical/masters'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import AddCategories from 'src/views/pages/medical/AddCategories'
import Error404 from 'src/pages/404'

const ComplaintsDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const authData = useContext(AuthContext)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('label')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const editParamsInitialState = { med_cat_id: null, label: null, type: null, key: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [type, setType] = useState('')

  function loadServerRows(currentPage, data) {
    return data
  }

  const zoo_id = authData?.userData?.user?.zoos[0].zoo_id
  const complaints_permission = authData?.userData?.permission?.user_settings?.medical_add_complaints
  console.log(id, 'id')

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

        await getMedicalCategoryListById(id, params).then(res => {
          console.log(res, 'resqwe')
          setType(res?.data?.type)
          setTotal(parseInt(res?.data?.total))
          setRows(loadServerRows(paginationModel.page, res?.data?.list))
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
    if (complaints_permission) {
      if (id) {
        fetchTableData(searchValue)
      }
    }
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
    setEditParams({ med_cat_id: null, label: null, type: null, key: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async params => {
    console.log(params, 'ghghhg')

    const payload = {
      label: params?.label,
      category_id: id
    }

    try {
      setSubmitLoader(true)
      var response
      if (editParams?.med_cat_id !== null) {
        response = await updateMedicalCategoryComplaint(editParams?.id, payload)
      } else {
        response = await addMedicalComplaintOrDiagnosis(type, payload)
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
    console.log('params >>', params)
  }

  const columns = [
    {
      flex: 0.1,
      Width: 20,
      field: 'id',
      headerName: 'NO',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => <Typography>{params.row.sl_no}</Typography>
    },

    {
      flex: 0.6,
      minWidth: 40,
      sortable: false,
      field: 'Complaints',
      headerName: 'Complaints',
      align: 'left',

      renderCell: params => <Typography noWrap>{params.row.label}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 10,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      renderCell: params => (
        <>
          {params.row.zoo_id === zoo_id && params?.row?.can_edit === 1 ? ( // Show only if the zoo_id matches
            (<Box sx={{}}>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </Box>)
          ) : null}
        </>
      )
    }
  ]

  const handleCellClick = params => {
    // router.push(`complaints/${params.row.id}`)
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
      {complaints_permission ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Medical
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.back()}>
              Category
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              Symptoms
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardHeader title='Symptoms List' action={headerAction} />

            <DataGrid
              //   hideFooterPagination={true}
              sx={{
                '.MuiDataGrid-cell:focus-within': {
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
              showToolbar />
          </Card>
          {openDrawer && (
            <AddCategories
              openDrawer={openDrawer}
              setOpenDrawer={setOpenDrawer}
              loading={submitLoader}
              editParams={editParams}
              resetForm={resetForm}
              handleSubmitData={handleSubmitData}
              type='complaints'
            />
          )}
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  );
}

export default ComplaintsDetails
