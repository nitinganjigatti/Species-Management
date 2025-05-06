import { Card, CardHeader, Box, debounce, Tooltip, Grid } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Toaster from 'src/components/Toaster'
import { addDietCategory, getDietCategoryList, UpdateDietCategory } from 'src/lib/api/diet/settings/dietCategory'
import AddEditDietCategory from 'src/views/pages/diet/dietCategories/AddEditDietCategory'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AuthContext } from 'src/context/AuthContext'

const DietCategory = () => {
  const editParamsInitialState = { id: null, label: null, status: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const dietModuleAccessContext = useContext(AuthContext)
  const dietModuleAccess = dietModuleAccessContext?.userData?.roles?.settings?.diet_module_access || ""

  const hasAddEditAccess = dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT'
  const hasFullAccess = dietModuleAccess === 'allow_full_access'

  function loadServerRows(currentPage, data) {
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

  const handleEdit = async (id, label, status) => {
    setEditParams({ id, label, status })
    setOpenDrawer(true)
  }

  const baseColumns = [
    {
      flex: 0.14,
      width: 40,
      field: 'uid',
      headerName: 'SL No',
      renderCell: params => (
        <Typography sx={{ color: 'text.primary', pl: 4, fontSize: '0.875rem', fontWeight: 400 }}>
          {parseInt(params.row.uid)}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 100,
      field: 'label',
      headerName: 'NAME',
      renderCell: params => (
        <Tooltip title={params.row.label?.length > 30 ? params.row.label : ''}>
          <Typography sx={{ color: 'text.primary', pl: 1, fontSize: '0.875rem', fontWeight: 400 }} className='text_overflow_moduled'>
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 100,
      field: 'active',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography sx={{ color: 'text.primary', pl: 2, fontSize: '0.875rem', fontWeight: 400 }}>
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    }
  ]
  
  // Conditionally add Action column
  if (hasAddEditAccess || hasFullAccess) {
    baseColumns.push({
      flex: 0.2,
      minWidth: 100,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={() => handleEdit(params.row.id, params.row.label, params.row.status)}
            aria-label='Edit'
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    })
  }
  
  const columns = baseColumns
  

  const headerAction = (hasAddEditAccess || hasFullAccess) ? <AddButton title='Add Diet Category' action={addEventSidebarOpen} /> : null

  const fetchTableData = useCallback(
    async (sortBy, q, column) => {
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

          let listWithId = res?.data?.list_items?.map((el, i) => {
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

  const handleSortModel = newModel => {
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
    value => {
      setSearchValue(value)
      searchTableData(sort, value, sortColumn)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort, sortColumn, searchTableData, searchValue]
  )
  

  const handleSubmitData = async payload => {
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

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      <Card>
        <CardHeader title='Diet Category' action={headerAction} sx={{ px: 5 }} />
        <Grid sx={{ mx: 5 }}>
          <Search
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ mt: 2 }}
          />
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
      <AddEditDietCategory
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
      />
    </>
  )
}

export default React.memo(DietCategory)
