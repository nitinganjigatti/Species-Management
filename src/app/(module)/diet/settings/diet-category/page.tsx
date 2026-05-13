'use client';
import { Card, CardHeader, Box, debounce, Tooltip, Grid } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Toaster from 'src/components/Toaster'
import { addDietCategory, getDietCategoryList, UpdateDietCategory } from 'src/lib/api/diet/settings/dietCategory'
import AddEditDietCategory from 'src/views/pages/diet/dietCategories/AddEditDietCategory'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AuthContext } from 'src/context/AuthContext'
import { useTranslation } from 'react-i18next'

const DietCategory = () => {
  const editParamsInitialState = { id: null, label: null, status: null }
  const { t } = useTranslation()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState<any>(editParamsInitialState)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)

  const dietModuleAccessContext = useContext(AuthContext) as any
  const dietModuleAccess: string = (dietModuleAccessContext as any)?.userData?.roles?.settings?.diet_module_access || ''

  const hasAddAccess = dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE'
  const hasEditAccess = dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE'
  const hasFullAccess = dietModuleAccess === 'allow_full_access'

  function loadServerRows(currentPage: any, data: any) {
    return data
  }

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, status: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleEdit = async (id: any, label: any, status: any) => {
    setEditParams({ id, label, status })
    setOpenDrawer(true)
  }

  const baseColumns = [
    {
      flex: 0.14,
      width: 40,
      field: 'uid',
      headerName: 'SL No',
      sortable: false,
      renderCell: (params: any) => (
        <Typography sx={{ color: 'text.primary', pl: 4, fontSize: '0.875rem', fontWeight: 400 }}>
          {parseInt(params.row.uid)}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 100,
      field: 'label',
      headerName: t('name'),
      renderCell: (params: any) => (
        <Tooltip title={params.row.label?.length > 30 ? params.row.label : ''}>
          <Typography
            sx={{ color: 'text.primary', pl: 1, fontSize: '0.875rem', fontWeight: 400 }}
            className='text_overflow_moduled'
          >
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 100,
      field: 'active',
      headerName: t('status'),
      renderCell: (params: any) => (
        <Typography sx={{ color: 'text.primary', pl: 2, fontSize: '0.875rem', fontWeight: 400 }}>
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    }
  ]

  // Conditionally add Action column
  if (hasAddAccess || hasEditAccess || hasFullAccess) {
    baseColumns.push({
      flex: 0.2,
      minWidth: 100,
      field: 'Action',
      headerName: t('action'),
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
          {parseInt(params.row.zoo_id) === 0 ? null : (
            <IconButton
              size='small'
              sx={{ mr: 0.5 }}
              onClick={() => handleEdit(params.row.id, params.row.label, params.row.status)}
              aria-label='Edit'
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          )}
        </Box>
      )
    })
  }

  const columns = baseColumns

  const headerAction =
    hasAddAccess || hasFullAccess ? (
      // @ts-ignore
      <AddButton title={t('diet_module.add_diet_category')} action={addEventSidebarOpen} />
    ) : null

  const fetchTableData = useCallback(
    async (sortBy: any, q: any, column: any) => {
      try {
        setLoading(true)

        const params = {
          sortBy,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getDietCategoryList(params).then(res => {
          const startingIndex = paginationModel.page * paginationModel.pageSize
          console.log('res.data', res?.data)

          let listWithId = res?.data?.list_items?.map((el: any, i: any) => {
            return { ...el, uid: startingIndex + i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const handleSortModel = (newModel: any) => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sortBy, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = useCallback(
    (value: any) => {
      setSearchValue(value)
      searchTableData(sort, value, sortColumn)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort, sortColumn, searchTableData, searchValue]
  )

  const handleSubmitData = async (payload: any) => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id) {
        response = await UpdateDietCategory(editParams?.id, payload)
      } else {
        response = await addDietCategory(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await fetchTableData(sort, searchValue, sortColumn)
      } else {
        setSubmitLoader(false)
        setOpenDrawer(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenDrawer(false)
      Toaster({ type: 'error', message: JSON.stringify(e) })
    }
  }

  const getSlNo = (index: any) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row: any, index: any) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      <Card>
        <CardHeader title={t('navigation.diet_category')} action={headerAction} sx={{ px: 5 }} />
        <Grid sx={{ mx: 5 }}>
          <Grid container sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MUISearch
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                onClear={() => handleSearch('')}
                placeholder='Search…'
              />
            </Grid>
          </Grid>
          <CommonTable
            columnVisibilityModel={{ id: false }}
            columns={columns}
            indexedRows={indexedRows}
            total={total}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            setPaginationModel={setPaginationModel}
            loading={loading}
            searchValue={searchValue}
            handleSearchOverride={handleSearch}
          />
        </Grid>
      </Card>
      {React.createElement(AddEditDietCategory as any, {
        drawerWidth: 400,
        addEventSidebarOpen: openDrawer,
        handleSidebarClose,
        handleSubmitData,
        resetForm,
        submitLoader,
        editParams
      })}
    </>
  )
}

export default React.memo(DietCategory)
