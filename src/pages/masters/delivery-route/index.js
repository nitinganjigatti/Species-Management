import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Icon from 'src/@core/components/icon'
import { AddButtonContained } from 'src/components/ButtonContained'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { getMedicalDeliveryRoute, addDeliveryRoute, updateDeliveryRoute } from 'src/lib/api/medical/masters'
import Utility from 'src/utility'
import toast from 'react-hot-toast'
import AddDeliveryRouteDrawer from 'src/views/pages/masters/AddDeliveryRouteDrawer'

function DeliveryRoute() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('delivery')
  const [exportLoading, setExportLoading] = useState(false)

  // drawer :
  const editParamsInitialState = { id: null, name: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const router = useRouter()

  const fetchTableData = useCallback(
    async (sort_order = sort, q, sort_by = sortColumn) => {
      try {
        setLoading(true)

        const params = {
          sort_order,
          q,
          sort_by,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getMedicalDeliveryRoute({ params: params }).then(res => {
          setRows(res?.data?.medical_delivery_route || [])
          setTotal(res?.data?.total_count || 0)
        })
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row.id,
    sl_no: paginationModel.page * paginationModel.pageSize + index + 1
  }))

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
      } catch (error) {}
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, paginationModel)
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const handleEdit = async (id, name) => {
    setEditParams({ id: id, name: name })
    setOpenDrawer(true)
  }

  const columns = [
    {
      width: 120,
      field: 'sl_no',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      width: 350,
      field: 'delivery',
      headerName: 'NAME',
      renderCell: params => (
        <Tooltip title={params.row.delivery}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.customColors.customHeadingTextColor,
              pl: '6px'
            }}
          >
            {params.row.delivery}
          </Typography>
        </Tooltip>
      )
    },

    {
      width: 140,
      field: 'action',
      headerName: 'Action',
      color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Box key={params.index} sx={{ pl: '6px' }}>
          {params?.row?.zoo_id === '0' || params?.row?.zoo_id == null ? null : (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()
                handleEdit(params.row.id, params.row.delivery)
              }}
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          )}
        </Box>
      )
    }
  ]

  const addEventSidebarOpen = () => {
    setEditParams({ id: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const headerAction = (
    <AddButtonContained
      title='Add Delivery Route'
      action={() => addEventSidebarOpen()}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
    />
  )

  const handleSubmitData = async payload => {
    try {
      setLoading(true)
      setSubmitLoader(true)

      var response
      if (editParams?.id !== null) {
        response = await updateDeliveryRoute(payload)
      } else {
        response = await addDeliveryRoute(payload)
      }

      if (response?.success) {
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        toast.success(response?.message)

        await fetchTableData()
      } else {
        if (response?.message && typeof response.message === 'object') {
          Object.values(response.message).forEach(msg => {
            toast.error(msg)
          })
        } else {
          toast.error(response?.message || 'Something went wrong')
        }
        setSubmitLoader(false)
        setLoading(false)
      }
      setLoading(false)
    } catch (e) {
      setSubmitLoader(false)
    } finally {
      setSubmitLoader(false)
      setLoading(false)
      setSearchValue('')
    }
  }

  const handleExport = async ({ sort_by = sortColumn, sort_order = sort, q = searchValue }) => {
    const params = { response_type: 'csv', sort_by, sort_order, q }

    try {
      setExportLoading(true)

      const response = await getMedicalDeliveryRoute({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data)
      }
    } catch {
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <PageCardLayout title='Delivery Route' action={headerAction}>
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
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            loading={loading}
            searchValue={searchValue}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            setPaginationModel={setPaginationModel}
          />
        </Grid>
        <AddDeliveryRouteDrawer
          drawerWidth={400}
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={() => {
            setOpenDrawer(false)
            setResetForm(true)
          }}
          editParams={editParams}
          resetForm={resetForm}
          handleSubmitData={handleSubmitData}
          submitLoader={submitLoader}
        />
      </Grid>
    </PageCardLayout>
  )
}

export default DeliveryRoute
