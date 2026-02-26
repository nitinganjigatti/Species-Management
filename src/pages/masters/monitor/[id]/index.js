import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButtonContained } from 'src/components/ButtonContained'
import { getAssessmentCategoriesList, getAssessmentTypesList } from 'src/lib/api/report'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Icon from 'src/@core/components/icon'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'

function AddMonitorCategory() {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('label')

  const fetchTableData = useCallback(
    async (sortValue, qValue, columnValue) => {
      try {
        setLoading(true)

        const params = {
          cat_id: id,
          sort: sortValue,
          q: qValue,
          column: columnValue,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        const res = await getAssessmentTypesList(params)

        if (res?.success) {
          setRows(res?.data?.result || [])
          setTotal(parseInt(res?.data?.total_count || 0))
        }

        setLoading(false)
      } catch (error) {
        setLoading(false)
        console.error(error)
      }
    },
    [id, paginationModel]
  )
  useEffect(() => {
    if (id) {
      fetchTableData(sort, searchValue, sortColumn)
    }
  }, [fetchTableData, id])

  const searchTableData = useCallback(
    debounce(async (sortValue, qValue, columnValue) => {
      setSearchValue(qValue)

      try {
        await fetchTableData(sortValue, qValue, columnValue)
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

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row.assessment_type_id,
    sl_no: paginationModel.page * paginationModel.pageSize + index + 1
  }))

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

  // console.log('aaa', indexedRows)
  console.log('aaa', rows)

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
      field: 'string_id',
      headerName: 'NAME',

      // color: theme.palette.customColors.customHeadingTextColor,

      renderCell: params => (
        <Tooltip title={params.row.assessments_type_label}>
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
            {params.row.assessments_type_label}
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
          <IconButton size='small'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  const headerAction = (
    <AddButtonContained
      title='Add Monitoring'
      action={() => ''}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
    />
  )

  const handleExport = async () => {
    // const params = {
    //   q: searchValue,
    //   sort: sort,
    //   column: sortColumn,
    //   response_type: 'csv'
    // }
    // try {
    //   setExportLoading(true)
    //   const response = await 'Api'({ params })
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

  return (
    <PageCardLayout title={rows?.[0]?.label || 'Monitor'} action={headerAction}>
      <Grid container>
        {/* <Grid item size={{ xs: 12, sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
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

            // onRowClick={handleRowClick}
          />
        </Grid>
      </Grid>
    </PageCardLayout>
  )
}

export default AddMonitorCategory
