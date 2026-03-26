import { Grid, Tooltip, Typography, useTheme } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { getAssessmentCategoriesList } from 'src/lib/api/report'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'

function AddMonitorCategory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState([])
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [allRows, setAllRows] = useState([])

  const router = useRouter()

  const handleRowClick = params => {
    const { assessment_category_id, label } = params.row

    router.push({
      pathname: `/masters/monitor/${assessment_category_id}`,
      query: { label: label }
    })
  }

  const fetchTableData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {
        cat_id: router.query.id,
        ref_type: 'animal'
      }
      const res = await getAssessmentCategoriesList(params)

      if (res?.success) {
        setTotal(res?.data?.length || 0)

        setAllRows(res?.data || [])
        setRows(res?.data || [])
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const searchTableData = useCallback(
    debounce(value => {
      setSearchValue(value)

      if (!value || '' || null) {
        setRows(allRows)
      }

      const filteredData = allRows.filter(row => row.label?.toLowerCase().includes(value.toLowerCase()))

      setRows(filteredData)
      setTotal(filteredData.length)
    }),
    [allRows]
  )

  const handleSearch = value => {
    searchTableData(value)
  }

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row.assessment_category_id,
    sl_no: paginationModel.page * paginationModel.pageSize + index + 1
  }))

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
      field: 'label',
      headerName: 'NAME',
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
              color: theme.palette.customColors.customHeadingTextColor,
              pl: '6px'
            }}
          >
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 280,
      field: 'assessment_type_count',
      headerName: 'Active Assessment Type Count',

      renderCell: params => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: theme.palette.customColors.customHeadingTextColor,
            display: 'flex',
            justifyContent: 'center',
            flex: 1
          }}
          variant='body2'
        >
          {params.row.assessment_type_count}
        </Typography>
      )
    },

    {
      width: 140,
      field: 'active',
      headerName: 'STATUS',

      renderCell: params => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: theme.palette.customColors.customHeadingTextColor,
            pl: '6px'
          }}
          variant='body2'
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    }
  ]

  return (
    <PageCardLayout title='Monitoring'>
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
        </Grid>

        <Grid item size={{ xs: 12 }}>
          <CommonTable
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            loading={loading}
            searchValue={searchValue}
            paginationModel={paginationModel}
            onRowClick={handleRowClick}
            setPaginationModel={setPaginationModel}
          />
        </Grid>
      </Grid>
    </PageCardLayout>
  )
}

export default AddMonitorCategory
