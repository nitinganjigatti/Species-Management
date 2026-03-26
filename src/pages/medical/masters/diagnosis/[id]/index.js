import { Box, Button, Grid, IconButton, Tooltip, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import CommonTable from 'src/views/table/data-grid/CommonTable'

import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'

import {
  addMedicalComplaintOrDiagnosis,
  getMedicalCategoryListById,
  updateMedicalCategoryDiagnosis
} from 'src/lib/api/medical/masters'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import AddCategories from 'src/views/pages/medical/AddCategories'
import Error404 from 'src/pages/404'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const DiagnosisDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id, label } = router.query
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
  const [exportLoading, setExportLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const zoo_id = authData?.userData?.user?.zoos[0].zoo_id
  const diagnosis_permission = authData?.userData?.permission?.user_settings?.medical_add_diagnosis

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        const params = {
          q,
          sort,
          columns: sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getMedicalCategoryListById(id, params).then(res => {
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
    [paginationModel, sort, sortColumn]
  )

  const handleExport = async ({ q = searchValue }) => {
    const params = {
      q,
      sort,
      columns: sortColumn,
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      response_type: 'csv'
    }
    try {
      setExportLoading(true)

      const response = await getMedicalCategoryListById(id, params)

      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setExportLoading(false)
    }
  }

  useEffect(() => {
    if (diagnosis_permission) {
      if (id) {
        fetchTableData(searchValue)
      }
    }
  }, [fetchTableData])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
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
      category_id: id
    }

    try {
      setSubmitLoader(true)
      var response
      if (editParams?.med_cat_id !== null) {
        response = await updateMedicalCategoryDiagnosis(editParams?.id, payload)
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
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleEdit = async (event, params) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams(params)
    setOpenDrawer(true)
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
      width: 350,
      field: 'label',
      headerName: 'Diagnosis',
      align: 'left',

      renderCell: params => (
        <Tooltip title={params.row.label}>
          <Typography noWrap>{params.row.label}</Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      renderCell: params => (
        <>
          {params.row.zoo_id === zoo_id && params?.row?.can_edit === 1 ? (
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
      {diagnosis_permission ? (
        <>
          <DynamicBreadcrumbs
            pageItems={[{ title: 'Medical' }, { title: 'Category', onClick: () => router.back() }, { title: label }]}
          />
          <PageCardLayout title={label || 'Diagnosis List'} action={headerAction}>
            <Grid container>
              <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
                  <MUISearch
                    sx={{
                      width: {
                        xs: '100%',
                        sm: '250px'
                      }
                    }}
                    placeholder='Search...'
                    onChange={e => handleSearch(e.target.value)}
                    onClear={() => handleSearch('')}
                    value={searchValue}
                  />
                </Grid>
                <Grid item>
                  <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} />
                </Grid>
              </Grid>

              <Grid item size={{ xs: 12 }}>
                <CommonTable
                  indexedRows={indexedRows === undefined ? [] : indexedRows}
                  total={total}
                  columns={columns}
                  paginationModel={paginationModel}
                  handleSortModel={handleSortModel}
                  setPaginationModel={setPaginationModel}
                  pageSizeOptions={[7, 10, 30, 50]}
                  loading={loading}
                  searchValue={searchValue}
                  handleSearch={handleSearch}
                  onCellClick={handleCellClick}
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
              type='diagnosis'
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

export default DiagnosisDetails
