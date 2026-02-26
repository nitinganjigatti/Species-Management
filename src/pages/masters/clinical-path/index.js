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

function ClinicalPath() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('label')
  const [exportLoading, setExportLoading] = useState(false)

  // drawer :
  const editParamsInitialState = { id: null, name: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const router = useRouter()

  const handleRowClick = params => {
    router.push(`/masters/monitor/${params.row.assessment_category_id}`)
  }

  const fetchTableData = useCallback(
    async (sortValue = sort, qValue = searchValue, columnValue = sortColumn, pageValue = paginationModel.page) => {
      try {
        setLoading(true)

        // Plain query params
        const params = {
          cat_id: router.query.id,
          sort: sortValue,
          q: qValue,
          column: columnValue,
          page: pageValue + 1,
          limit: paginationModel.pageSiz,
          ref_type: 'animal'
        }

        // Send queryParams directly, not nested in { params: ... }
        const res = await 'api'(params)

        if (res?.success) {
          setRows(res?.data || [])
          setTotal(res?.data?.length || 0)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    },
    [router.query.id, paginationModel.page, paginationModel.pageSize, sort, searchValue, sortColumn]
  )

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row.assessment_category_id,
    sl_no: paginationModel.page * paginationModel.pageSize + index + 1
  }))

  const searchTableData = useCallback(
    debounce(q => {
      setSearchValue(q)
      setPaginationModel(prev => ({ ...prev, page: 0 })) // reset page on search
      fetchTableData(sort, q, sortColumn, 0)
    }, 500),
    [sort, sortColumn, fetchTableData]
  )

  const handleSearch = value => {
    // searchTableData(value)
  }

  const handleExport = async (
    sortValue = sort,
    qValue = searchValue,
    columnValue = sortColumn,
    pageValue = paginationModel.page
  ) => {
    // const params = {
    //   cat_id: router.query.id,
    //   sort: sortValue,
    //   q: qValue,
    //   column: columnValue,
    //   page: pageValue + 1,
    //   limit: paginationModel.pageSize

    //   // response_type: 'csv'
    // }
    // try {
    //   setExportLoading(true)
    //   const response = await getAssessmentCategoriesList({ params })
    //   if (response?.success && response?.data) {
    //     Utility.downloadFileFromURL(response?.data)
    //     setExportLoading(false)
    //   }
    // } catch (error) {
    //   setExportLoading(false)
    // } finally {
    //   setExportLoading(false)
    // }

    alert('export will implement waiting for API ')
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field

      setSort(newSort)
      setSortColumn(newColumn)
      setPaginationModel(prev => ({ ...prev, page: 0 })) // reset page
      fetchTableData(newSort, searchValue, newColumn, 0)
    }
  }

  const handleEdit = async (id, name, status) => {
    setEditParams({ id: id, name: name, status: status })
    setOpenDrawer(true)
  }

  const columns = [
    {
      flex: 0.2,
      minWidth: 80,
      field: 'sl_no',
      headerName: 'SL.NO',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.customHeadingTextColor }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 150,
      field: 'label',
      headerName: 'NAME',

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
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.2,
      minWidth: 120,
      field: 'active',
      headerName: 'STATUS',

      // color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: theme.palette.customColors.customHeadingTextColor
          }}
          variant='body2'
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 80,
      field: 'action',
      headerName: 'Action',
      color: theme.palette.customColors.customHeadingTextColor,
      renderCell: params => (
        <Box key={params.index}>
          {params?.row?.zoo_id === '0' ? null : (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()

                handleEdit()
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
      title='Add Clinical Path'
      action={() => setOpenDrawer(true)}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
    />
  )

  return (
    <PageCardLayout title=' Clinical Path' action={headerAction}>
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
        {/* <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
          <MUISearch
            sx={{
              width: {
                xs: '100%',
                sm: '250px'
              }
            }}
            placeholder='Search...'
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
          />
        </Grid> */}

        <Grid item size={{ xs: 12 }}>
          <CommonTable
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            loading={loading}
            searchValue={searchValue}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            onRowClick={handleRowClick}
            setPaginationModel={setPaginationModel}
          />
        </Grid>
      </Grid>
    </PageCardLayout>
  )
}

export default ClinicalPath
