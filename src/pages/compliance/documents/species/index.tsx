import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Badge, Box, Breadcrumbs, Button, Card, CardHeader, Grid, Typography } from '@mui/material'
import { AddButtonContained } from 'src/components/ButtonContained'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { debounce } from 'lodash'
import FilterListIcon from '@mui/icons-material/FilterList'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import { GridColDef, GridSortModel } from '@mui/x-data-grid'

interface SpeciesRecord {
  id: number
  species: string
  scientific_name: string
  shipments: number
  exports: number
  permitted_animals: number
  received_animals: number
}

// --- Mock API ---
const getSpeciesList = async (params: { page: number; limit: number; q: string; sort?: string; sortBy?: string }) => ({
  success: true,
  data: {
    total: 60,
    records: Array.from<unknown, SpeciesRecord>({ length: 10 }, (_, i) => ({
      id: i + 1 + params.page * params.limit,
      species: 'Rainbow Lorikeet',
      scientific_name: 'Trichoglossus moluccanus',
      shipments: 5,
      exports: 5,
      permitted_animals: 5,
      received_animals: 5
    }))
  }
})

const addSpecies = async (data: unknown) => ({ success: true, message: 'Species added' })
const updateSpecies = async (id: unknown, data: unknown) => ({ success: true, message: 'Species updated' })

const SpeciesPage = () => {
  const { userData } = useContext(AuthContext)
  const canEdit = (userData as any)?.roles?.settings?.species_module === 'EDIT'

  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState<GridSortModel>([])

  const filterCount = 0

  const fetchSpecies = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        q: searchValue,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        sort: sortModel[0]?.sort as string | undefined,
        sortBy: sortModel[0]?.field
      }
      const res = await getSpeciesList(params)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(res.data.records.map((r, i) => ({ ...r, uid: start + i + 1 })))
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [searchValue, paginationModel, sortModel])

  useEffect(() => {
    fetchSpecies()
  }, [fetchSpecies])

  const debouncedSearch = useCallback(
    debounce((val: string) => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = (val: string) => debouncedSearch(val)

  const columns: GridColDef[] = [
    {
      field: 'uid',
      headerName: 'No',
      flex: 0.1
    },
    {
      field: 'species',
      headerName: 'Species',
      flex: 0.3,
      renderCell: ({ row }) => (
        <Box>
          <Typography fontWeight={600}>{row.species}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {row.scientific_name}
          </Typography>
        </Box>
      )
    },
    { field: 'shipments', headerName: 'Shipments', flex: 0.15 },
    { field: 'exports', headerName: 'Exports', flex: 0.15 },
    { field: 'permitted_animals', headerName: 'Permitted Animals', flex: 0.2 },
    { field: 'received_animals', headerName: 'Received Animals', flex: 0.2 },
    {
      field: 'action',
      headerName: 'Actions',
      flex: 0.1,
      sortable: false,
      renderCell: () =>
        canEdit && (
          <Box sx={{ cursor: 'pointer' }}>
            <i className='tabler-dots-vertical' />
          </Box>
        )
    }
  ]

  const handleSubmit = async (data: unknown, editId?: unknown) => {
    const apiFn = editId ? updateSpecies : addSpecies
    try {
      const res = await apiFn(editId, data)
      Toaster({ type: res.success ? 'success' : 'error', message: res.message || 'Something went wrong' })

      if (res.success) {
        fetchSpecies()
      }
    } catch (error) {
      console.error('Species submit error:', error)
      Toaster({ type: 'error', message: (error as Error)?.message || 'An unexpected error occurred' })
    }
  }

  const handleFilterDrawer = () => {}

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Species</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title={<Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>Species</Typography>}
          sx={{ px: 5 }}
          action={
            <AddButtonContained
              title='ADD NEW'
              action={() => {
                // Replace with drawer opening logic
                console.log('Open add species drawer')
              }}
              disabled={false}
              styles={{}}
              fullWidth={false}
            />
          }
        />
        <Grid container spacing={2} sx={{ px: 5, py: 2 }} alignItems='center'>
          <Grid size={{ xs: 12 }}>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                />
              </Box>
              <Button
                variant='outlined'
                startIcon={<FilterListIcon />}
                endIcon={<Badge badgeContent={filterCount} color='primary' invisible={filterCount === 0} />}
                sx={{
                  border: (theme: any) =>
                    `1px solid ${theme.palette.customColors.OutlineVariant}`,
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

          <Grid size={{ xs: 12 }}>
            <CommonTable
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={(mod: GridSortModel) => setSortModel(mod)}
              loading={loading}
            />
          </Grid>
        </Grid>
      </Card>
    </>
  )
}

export default SpeciesPage
