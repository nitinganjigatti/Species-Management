import React, { useCallback, useEffect, useState, useContext } from 'react'
import { Badge, Box, Breadcrumbs, Button, Card, CardHeader, Grid, Typography } from '@mui/material'
import { AddButtonContained } from 'src/components/ButtonContained'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { debounce } from 'lodash'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import FilterListIcon from '@mui/icons-material/FilterList'
import withModuleAccess from 'src/components/ProtectedRoute'

// Mock API
const getFilesList = async params => ({
  success: true,
  data: {
    total: 60,
    records: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1 + params.page * params.limit,
      name: 'File 306',
      shipments: 5,
      created_on: '30 Oct 2024'
    }))
  }
})

const addFile = async data => ({ success: true, message: 'File added' })
const updateFile = async (id, data) => ({ success: true, message: 'File updated' })

const FilesPage = () => {
  const { userData } = useContext(AuthContext)
  const canEdit = userData?.roles?.settings?.file_module === 'EDIT'

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState([])

  const filterCount = 0

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        q: searchValue,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        sort: sortModel[0]?.sort,
        sortBy: sortModel[0]?.field
      }
      const res = await getFilesList(params)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(res.data.records.map((r, i) => ({ ...r, uid: start + i + 1 })))
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [searchValue, paginationModel, sortModel])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const debouncedSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = val => debouncedSearch(val)

  const columns = [
    { field: 'name', headerName: 'File Name', flex: 0.4 },
    { field: 'shipments', headerName: 'Shipments', flex: 0.2 },
    { field: 'created_on', headerName: 'Created On', flex: 0.25 },
    {
      field: 'action',
      headerName: 'Actions',
      flex: 0.15,
      sortable: false,
      renderCell: () =>
        canEdit && (
          <Box sx={{ cursor: 'pointer' }}>
            <i className='tabler-dots-vertical' />
          </Box>
        )
    }
  ]

  const handleSubmit = async (data, editId) => {
    const apiFn = editId ? updateFile : addFile
    try {
      const res = await apiFn(editId, data)
      Toaster({ type: res.success ? 'success' : 'error', message: res.message || 'Something went wrong' })

      if (res.success) {
        fetchFiles()
      }
    } catch (error) {
      console.error('File submit error:', error)
      Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })
    }
  }

  const handleFilterDrawer = () => {}

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Files</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title='Files'
          sx={{ px: 5 }}
          action={
            <AddButtonContained
              title='ADD NEW'
              titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
              action={() => {
                // Replace with drawer opening logic
                console.log('Open add file drawer')
              }}
            />
          }
        />
        <Grid container spacing={2} sx={{ px: 5, py: 2 }} alignItems='center'>
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Search
                  placeholder='Search...'
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                />
              </Box>
              <Button
                variant='outlined'
                startIcon={<FilterListIcon />}
                endIcon={<Badge badgeContent={filterCount} color='primary' invisible={filterCount === 0} />}
                sx={{
                  border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  height: '40px',
                  color: 'customColors.OnSurfaceVariant',
                  mr: 1
                }}
                onClick={handleFilterDrawer}
              >
                Filter
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <CommonTable
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={mod => setSortModel(mod)}
              loading={loading}
            />
          </Grid>
        </Grid>
      </Card>
    </>
  )
}

export default withModuleAccess(FilesPage, 'compliance_module')
