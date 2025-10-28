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
import { AddNursery, GetNurseryList } from 'src/lib/api/egg/nursery'
import moment from 'moment'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import Router from 'next/router'
import { addMedicalCategory, getCategoriesList, updateMedicalCategory } from 'src/lib/api/medical/masters'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import AddCategories from 'src/views/pages/medical/AddCategories'
import { AuthContext } from 'src/context/AuthContext'

import Error404 from 'src/pages/404'

const Diagnosis = () => {
  const theme = useTheme()
  const router = useRouter()
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

  function loadServerRows(currentPage, data) {
    return data
  }

  const zoo_id = authData?.userData?.user?.zoos[0].zoo_id
  const diagnosis_permission = authData?.userData?.permission?.user_settings?.medical_add_diagnosis
  console.log(zoo_id, 'zoo_id')

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        const params = {
          type: 'diagnosis',
          q

          // sort,
          // page: paginationModel.page + 1,
          // limit: paginationModel.pageSize
        }

        await getCategoriesList({ params: params }).then(res => {
          console.log(res, 'res123')

          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data))
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
    if (diagnosis_permission) {
      fetchTableData(searchValue)
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
    const payload = {
      label: params?.label,
      type: 'diagnosis'
    }
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.med_cat_id !== null) {
        response = await updateMedicalCategory(editParams?.med_cat_id, payload)
      } else {
        response = await addMedicalCategory(payload)
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
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.6,
      minWidth: 40,
      sortable: false,
      field: 'Category',
      headerName: 'Category',

      // headerAlign: 'left',
      align: 'left',

      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.label}
        </Typography>
      )
    },
    {
      flex: 0.1,
      minWidth: 10,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          {params.row.zoo_id === zoo_id ? ( // Show only if the zoo_id matches
            <Box>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </Box>
          ) : null}
        </>
      )

      // renderCell: params => (
      //   <>
      //     <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
      //       <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
      //         <Icon icon='mdi:pencil-outline' />
      //       </IconButton>
      //       {/* <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleDelete(params.row.id)} aria-label='Edit'>
      //         <Icon icon='mdi:delete-outline' />
      //       </IconButton> */}
      //     </Box>
      //   </>
      // )
    }

    // {
    //   flex: 0.3,
    //   minWidth: 30,
    //   sortable: false,
    //   field: 'Type',
    //   headerName: 'Type',
    //   align: 'left',

    //   renderCell: params => (
    //     <Typography
    //       noWrap
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '16px',
    //         fontWeight: '400',
    //         lineHeight: '19.36px'
    //       }}
    //     >
    //       {params.row.type}
    //     </Typography>
    //   )
    // }
  ]

  const handleCellClick = params => {
    router.push(`diagnosis/${params.row.id}`)
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
    id: row.med_cat_id,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer' }} color='inherit'>
          Medical
        </Typography>
        <Typography
          sx={{
            color: 'text.primary',
            cursor: 'pointer'
          }}
        >
          Category
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title='Category List' action={headerAction} />

        <DataGrid
          hideFooterPagination={true}
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

          // pagination
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          columns={columns}
          sortingMode='server'
          paginationMode='server'

          // pageSizeOptions={[7, 10, 25, 50]}
          // paginationModel={paginationModel}
          onSortModelChange={handleSortModel}
          slots={{ toolbar: ServerSideToolbarWithFilter }}

          // onPaginationModelChange={setPaginationModel}
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
        <AddCategories
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
          loading={submitLoader}
          editParams={editParams}
          resetForm={resetForm}
          handleSubmitData={handleSubmitData}
          type='category'
        />
      )}
    </>
  )
}

export default Diagnosis
