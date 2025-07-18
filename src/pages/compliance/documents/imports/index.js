import React, { useState, useCallback, useEffect, useContext } from 'react'
import { Badge, Box, Breadcrumbs, Button, Card, CardHeader, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import Router from 'next/router'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Search from 'src/views/utility/Search'
import { AddButtonContained } from 'src/components/ButtonContained'
import FilterListIcon from '@mui/icons-material/FilterList'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import { getImportsList } from 'src/lib/api/compliance/imports'
import moment from 'moment'

const ImportsPage = () => {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [selectedId, setSelectedId] = useState(null)
  const [sortModel, setSortModel] = useState([])
  const [filterDate, setFilterDate] = useState({})
  const filterCount = 0

  const handleFilterDrawer = () => {}

  const fetchExportPermits = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        q: searchValue,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sort: sortModel?.[0]?.sort,
        sortBy: sortModel?.[0]?.field,
        from_date: filterDate.startDate,
        to_date: filterDate.endDate
      }
      const res = await getImportsList(params)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(
        res.data.records.map((r, i) => ({
          ...r,
          uid: start + i + 1,
          import_number: r.import_number || '-',
          import_date: r.import_date || '-',
          exports_count: r.exports_count || '-',
          species_count: r.species_count || '-',
          animals_count: r.animals_count || '-',
          documents_count: r.documents_count || '-'
        }))
      )
      setTotal(res.data.count)
    } catch (error) {
      Toaster({ type: 'error', message: 'Failed to fetch export permits' })
    }
    setLoading(false)
  }, [searchValue, paginationModel, sortModel, filterDate])

  useEffect(() => {
    fetchExportPermits()
  }, [fetchExportPermits])

  const debouncedSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = val => {
    debouncedSearch(val)
  }

  const handleRowClick = params => {
    setSelectedId(params.row.id)

    Router.push(`/compliance/documents/imports/AddEditImport/?id=${params.row.id}&action=details`)
  }

  const columns = [
    {
      flex: 0.12,
      minWidth: 300,
      field: 'import_number',
      headerName: 'Import ID',
      renderCell: params => {
        return (
          <Typography
            sx={{
              cursor: 'pointer',
              px: 3,
              width: '100%'
            }}
          >
            {params.value || ''}
          </Typography>
        )
      }
    },
    {
      flex: 0.15,
      minWidth: 150,
      field: 'import_date',
      headerName: 'Issued',
      renderCell: params => (
        <Typography sx={{ px: 0, width: '100%' }}>
          {params?.value !== null ? moment(params.value).format('DD MMM YYYY') : '-'}
        </Typography>
      )
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'exports_count',
      headerName: 'EXPORTS',
      renderCell: params => <Typography sx={{ px: 3, width: '100%' }}>{params.value}</Typography>
    },

    {
      flex: 0.08,
      minWidth: 100,
      field: 'species_count',
      headerName: 'SPECIES',
      renderCell: params => <Typography sx={{ px: 3, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'animals_count',
      headerName: 'ANIMALS',
      renderCell: params => <Typography sx={{ px: 3, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'documents_count',
      headerName: 'DOCUMENTS',
      renderCell: params => <Typography sx={{ width: '100%', pl: 4 }}>{params.value}</Typography>
    }
  ]

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Imports</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title={<Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>Import Documents</Typography>}
          action={
            <AddButtonContained
              title='Add New'
              action={() => router.push('/compliance/documents/imports/AddEditImport')}
            />
          }
          sx={{ px: 5, pb: 0 }}
        />
        <Grid container spacing={4} sx={{ px: 5, py: 2, mt: 2 }} alignItems='center'>
          <Grid size={{ xs: 12, md: 4 }}>
            <Search
              placeholder='Search'
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }} />
          <Grid size={{ xs: 12, md: 4.5 }}>
            {/* <CommonDateRangePickers
              filterDates={filterDate}
              onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
            /> */}
          </Grid>

          {/* <Grid item xs={12} md={1.5}>
            <Grid item xs='auto'>
              <Button
                variant='outlined'
                startIcon={<FilterListIcon />}
                endIcon={
                  <Badge
                    badgeContent={filterCount}
                    color='primary'
                    invisible={filterCount === 0}
                    sx={{ ml: 2, mr: 2 }}
                  />
                }
                sx={{
                  border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  height: '40px',

                  // textTransform: 'none',
                  width: { xs: '100%', md: 'auto' },
                  color: 'customColors.OnSurfaceVariant'
                }}
                onClick={handleFilterDrawer}
              >
                Filter
              </Button>
            </Grid>
          </Grid> */}

          <Grid size={{ xs: 12 }}>
            <CommonTable
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={newModel => setSortModel(newModel)}
              loading={loading}
              onRowClick={handleRowClick}
            />
          </Grid>
        </Grid>
      </Card>
    </>
  )
}

export default ImportsPage
