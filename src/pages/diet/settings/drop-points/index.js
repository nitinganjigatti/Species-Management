import { Card, CardHeader, Box, Tooltip, Grid, Typography, debounce, IconButton } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { getDropPointList, createDropPoint, editDropPoint } from 'src/lib/api/diet/mealgroup'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AuthContext } from 'src/context/AuthContext'
import Search from 'src/views/utility/Search'
import { AddButton } from 'src/components/Buttons'
import AddEditDropPoint from 'src/views/pages/diet/dropPoint/AddEditDropPoint'
import Toaster from 'src/components/Toaster'
import Icon from 'src/@core/components/icon'
import { useTranslation } from 'react-i18next'

const DropPoints = () => {
  const editParamsInitialState = { id: null, drop_point_name: null, site_id: null }
  const { t } = useTranslation()
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const dietModuleAccessContext = useContext(AuthContext)
  const dietModuleAccess = dietModuleAccessContext?.userData?.roles?.settings?.diet_module_access || ''

  const hasAddAccess = dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE'
  const hasEditAccess = dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE'
  const hasFullAccess = dietModuleAccess === 'allow_full_access'

  function loadServerRows(currentPage, data) {
    return data
  }

  const addEventSidebarOpen = () => {
    setEditParams(editParamsInitialState)
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
    setResetForm(false)
  }

  const handleEdit = async (id, drop_point_name, site_id, meal_group_count) => {
    console.log('Edit params:', { id, drop_point_name, site_id, meal_group_count })
    setEditParams({ id, drop_point_name, site_id, meal_group_count })
    setOpenDrawer(true)
  }

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id) {
        response = await editDropPoint(payload)
      } else {
        response = await createDropPoint(payload)
      }

      if (response?.success) {
        Toaster({
          type: 'success',
          message: response?.message || `Drop Point ${editParams?.id ? 'updated' : 'created'} successfully`
        })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        await fetchTableData(searchValue)
      } else {
        setSubmitLoader(false)
        setOpenDrawer(false)
        Toaster({
          type: 'error',
          message: response?.message || `Failed to ${editParams?.id ? 'update' : 'create'} drop point`
        })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenDrawer(false)
      Toaster({
        type: 'error',
        message: `An error occurred while ${editParams?.id ? 'updating' : 'creating'} drop point`
      })
    }
  }

  const columns = [
    {
      flex: 0.1,
      width: 40,
      field: 'sl_no',
      headerName: 'SL No',
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Typography sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 400 }}>
          {parseInt(params.row.sl_no)}
        </Typography>
      )
    },
    {
      flex: 0.25,
      minWidth: 150,
      field: 'drop_point_name',
      headerName: t('diet_module.drop_point_name'),
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Tooltip title={params.row.drop_point_name?.length > 30 ? params.row.drop_point_name : ''}>
          <Typography
            sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 }}
            className='text_overflow_moduled'
          >
            {params.row.drop_point_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 120,
      field: 'site_name',
      headerName: t('navigation.site'),
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Tooltip title={params.row.site_name?.length > 30 ? params.row.site_name : ''}>
          <Typography
            sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 400 }}
            className='text_overflow_moduled'
          >
            {params.row.site_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.15,
      minWidth: 100,
      field: 'meal_group_count',
      headerName: t('navigation.meal_groups'),
      headerAlign: 'center',
      align: 'center',
      renderCell: params => (
        <Typography sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 400 }}>
          {params.row.meal_group_count || 0}
        </Typography>
      )
    }
  ]

  // Conditionally add Action column
  if (hasEditAccess || hasFullAccess) {
    columns.push({
      flex: 0.1,
      minWidth: 80,
      field: 'Action',
      headerName: t('action'),
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={() =>
              handleEdit(
                params.row.drop_point_id || params.row.id,
                params.row.drop_point_name,
                params.row.site_id,
                params.row.meal_group_count
              )
            }
            aria-label='Edit'
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    })
  }

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        const params = {
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        const res = await getDropPointList(params)

        if (res?.success) {
          const startingIndex = paginationModel.page * paginationModel.pageSize

          let listWithId = res?.data?.result?.map((el, i) => {
            return { ...el, sl_no: startingIndex + i + 1 }
          })

          // Debug: Check what fields are in the first row
          if (listWithId && listWithId.length > 0) {
            console.log('First drop point data from API:', listWithId[0])
          }

          setTotal(parseInt(res?.data?.count || 0))
          setRows(loadServerRows(paginationModel.page, listWithId))
        }

        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(searchValue)
  }, [fetchTableData])

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchTableData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      searchTableData(value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchTableData, searchValue]
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.drop_point_id || row.id || `drop-point-${index}`,
    drop_point_id: row.drop_point_id || row.id,
    sl_no: getSlNo(index)
  }))

  const headerAction =
    hasAddAccess || hasFullAccess ? (
      <AddButton title={t('diet_module.add_drop_point')} action={addEventSidebarOpen} />
    ) : null

  return (
    <>
      <Card>
        <CardHeader title={t('navigation.drop_points')} action={headerAction} sx={{ px: 5 }} />
        <Grid sx={{ mx: 5 }}>
          <Search
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ mt: 2, justifyContent: 'flex-end' }}
          />
          <CommonTable
            columnVisibilityModel={{ id: false }}
            columns={columns}
            indexedRows={indexedRows}
            total={total}
            paginationModel={paginationModel}
            handleSortModel={() => {}}
            setPaginationModel={setPaginationModel}
            loading={loading}
            searchValue={searchValue}
            handleSearchOverride={handleSearch}
          />
        </Grid>
      </Card>
      <AddEditDropPoint
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

export default React.memo(DropPoints)
