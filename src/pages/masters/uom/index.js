import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Icon from 'src/@core/components/icon'
import { AddButtonContained } from 'src/components/ButtonContained'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import AddUOMDrawer from 'src/views/pages/masters/AddUOMDrawer'
import toast from 'react-hot-toast'
import { addMeasurementUnits, getMeasurementUnitsMasters, updateMeasurementUnits } from 'src/lib/api/medical/masters'
import Utility from 'src/utility'

function UOM() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('unit_name')
  const [exportLoading, setExportLoading] = useState(false)

  // drawer :
  const editParamsInitialState = { id: null, unit_name: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          limit: paginationModel.pageSize,
          page: paginationModel.page + 1
        }

        const res = await getMeasurementUnitsMasters({ params })

        if (res?.success && res?.data) {
          setRows(res?.data)
          setTotal(res?.total)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData()
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

  const handleExport = async () => {
    setLoading(true)

    const params = {
      sort,
      q: searchValue,
      column: sortColumn,
      response_type: 'csv'
    }

    try {
      setExportLoading(true)
      const response = await getMeasurementUnitsMasters({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response?.data)
        setExportLoading(false)
      }
    } catch (error) {
      setExportLoading(false)
    } finally {
      setExportLoading(false)
      setLoading(false)
    }
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field

      setSort(newSort)
      setSortColumn(newColumn)
      setPaginationModel(prev => ({ ...prev, page: 0 }))

      fetchTableData(newSort, searchValue, newColumn, 0)
    }
  }

  const columns = [
    {
      width: 120,
      field: 'sl_no',
      headerName: 'SL.NO',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.customHeadingTextColor }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      width: 350,
      field: 'unit_name',
      headerName: 'UOM NAME',

      // color: theme.palette.customColors.customHeadingTextColor,

      renderCell: params => (
        <Tooltip title={params.row.label}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.customColors.customHeadingTextColor
            }}
          >
            {params.row.unit_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 300,
      field: 'uom_abbr',
      headerName: 'UOM  ABBR ',

      renderCell: params => (
        <Tooltip title={params.row.label}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.customColors.customHeadingTextColor
            }}
          >
            {params.row.uom_abbr}
          </Typography>
        </Tooltip>
      )
    },

    {
      width: 120,
      field: 'action',
      headerName: 'Action',
      color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Box key={params.index}>
          {params?.row?.zoo_id === '0' || params?.row?.zoo_id == null ? null : (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()

                setEditParams({
                  id: params?.row?.id,
                  unit_name: params?.row?.unit_name,
                  uom_abbr: params?.row?.uom_abbr,
                  measurement_type: params?.row?.measurement_type,
                  conversion_factor: params?.row?.conversion_factor,
                  same_base_uom: params?.row?.same_base_uom
                })
                setOpenDrawer(true)
              }}
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          )}
        </Box>
      )
    }
  ]

  const headerAction = (
    <AddButtonContained
      title='Add UOM'
      action={() => {
        setOpenDrawer(true), setEditParams({ id: null, unit_name: null, uom_abbr: null })
      }}
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
        response = await updateMeasurementUnits(payload)
      } else {
        response = await addMeasurementUnits(payload)
      }

      if (response?.success) {
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        toast.success(response?.message)

        await fetchTableData()
        setSearchValue('')
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
      console.log(e)
      setSubmitLoader(false)
    } finally {
      setSubmitLoader(false)
      setLoading(false)
    }
  }

  return (
    <PageCardLayout title=' UOM (Units Of Measurements)' action={headerAction}>
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
        <AddUOMDrawer
          drawerWidth={400}
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={() => {
            setOpenDrawer(false)
            setResetForm(true)
            setEditParams({ id: null, unit_name: null, uom_abbr: null })
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

export default UOM
