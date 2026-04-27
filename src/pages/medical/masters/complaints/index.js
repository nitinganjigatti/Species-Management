import { Box, Button, Grid, IconButton, Tooltip, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import { addMedicalCategory, getCategoriesList, updateMedicalCategory } from 'src/lib/api/medical/masters'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import AddCategories from 'src/views/pages/medical/AddCategories'
import Error404 from 'src/pages/404'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const Complaints = () => {
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
  const complaints_permission = authData?.userData?.permission?.user_settings?.medical_add_complaints

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        const params = {
          type: 'complaints',
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
    if (complaints_permission) {
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
      type: 'complaints'
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
      width: 120,
      field: 'id',
      headerName: 'NO',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => <Typography>{params.row.sl_no}</Typography>
    },

    {
      flex: 1,
      minWidth: 350,
      sortable: false,
      field: 'Category',
      headerName: 'Category',
      align: 'left',

      renderCell: params => (
        <Tooltip title={params.row.label}>
          {' '}
          <Typography noWrap>{params.row.label}</Typography>
        </Tooltip>
      )
    },
    {
      flex: 1,
      minWidth: 150,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      renderCell: params => (
        <>
          {params.row.zoo_id === zoo_id ? (
            <Box>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </Box>
          ) : null}
        </>
      )
    }
  ]

  const handleCellClick = params => {
    const { id, label } = params.row
    router.push({
      pathname: `complaints/${id}`,
      query: { label: label }
    })
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
      {complaints_permission ? (
        <>
          <DynamicBreadcrumbs pageItems={[{ title: 'Medical' }, { title: 'Category' }]} />
          <PageCardLayout title='Category List' action={headerAction}>
            <Grid container>
              <Grid item size={{ xs: 12, sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
                <MUISearch
                  placeholder='Search...'
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                  value={searchValue}
                />
              </Grid>

              <Grid item size={{ xs: 12 }}>
                <CommonTable
                  indexedRows={indexedRows === undefined ? [] : indexedRows}
                  total={total}
                  columns={columns}
                  handleSortModel={handleSortModel}
                  loading={loading}
                  searchValue={searchValue}
                  handleSearch={handleSearch}
                  onCellClick={handleCellClick}
                  hideFooterPagination={true}
                  disablePagination={true}
                  columnVisibilityModel={{
                    sl_no: false
                  }}
                />
              </Grid>
            </Grid>
          </PageCardLayout>

          {openDrawer && (
            <AddCategories
              openDrawer={openDrawer}
              setOpenDrawer={setOpenDrawer}
              loading={submitLoader}
              editParams={editParams}
              resetForm={resetForm}
              handleSubmitData={handleSubmitData}
              type='Category'
            />
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default Complaints
