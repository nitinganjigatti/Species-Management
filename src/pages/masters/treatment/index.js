import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Icon from 'src/@core/components/icon'
import { AddButtonContained } from 'src/components/ButtonContained'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Utility from 'src/utility'
import toast from 'react-hot-toast'
import AddTreatmentMastersDrawer from 'src/views/pages/masters/AddTreatmentMastersDrawer'
import {
  addTreatmentMasters,
  getTreatmentMasterList,
  updateTreatmentMasters
} from 'src/lib/api/hospital/treatmentMaster'

function Treatment() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('treatment_name')
  const [exportLoading, setExportLoading] = useState(false)

  // drawer :

  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState({ id: null, treatment_name: null })

  const fetchTableData = useCallback(
    async (sort, searchValue, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q: searchValue,
          column,
          limit: paginationModel.pageSize,
          page: paginationModel.page + 1
        }

        const res = await getTreatmentMasterList(params)

        if (res?.success && res?.data) {
          setRows(res?.data?.records || [])
          setTotal(res?.data?.total || 0)
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
      } catch (error) {
        console.error(error)
      }
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

  const handleEdit = async (id, treatment_name) => {
    setEditParams({ id: id, treatment_name: treatment_name })
    setOpenDrawer(true)
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
      field: 'treatment_name',
      headerName: 'NAME',

      renderCell: params => (
        <Tooltip title={params.row.treatment_name}>
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
            {params.row.treatment_name}
          </Typography>
        </Tooltip>
      )
    },

    {
      width: 150,
      field: 'action',
      headerName: 'Action',
      color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Box key={params.index}>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              handleEdit(params.row.id, params.row.treatment_name)
            }}
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, treatment_name: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const headerAction = (
    <AddButtonContained
      title='Add Treatment'
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
        response = await updateTreatmentMasters(payload)
      } else {
        response = await addTreatmentMasters(payload)
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
      console.log(e)
      setSubmitLoader(false)
    } finally {
      setSubmitLoader(false)
      setLoading(false)
    }
  }

  const handleExport = async ({ column = sortColumn, q = searchValue }) => {
    const params = { response_type: 'csv', column, sort, q }

    try {
      setExportLoading(true)

      const response = await getTreatmentMasterList(params)
      if (response?.success && response?.data?.download_url) {
        Utility.downloadFileFromURL(response?.data?.download_url)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <PageCardLayout title='Treatment' action={headerAction}>
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
        <AddTreatmentMastersDrawer
          drawerWidth={400}
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={() => {
            setOpenDrawer(false)
            setResetForm(true)
            setEditParams({ id: null, treatment_name: null })
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

export default Treatment
