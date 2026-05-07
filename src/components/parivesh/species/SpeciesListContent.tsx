import React, { useCallback, useMemo, useState } from 'react'
import { Avatar, Box, Card, CardHeader, Typography } from '@mui/material'
import { GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getSpeciesListByOrg } from 'src/lib/api/parivesh/addSpecies'

const SpeciesListContent: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const { selectedParivesh } = usePariveshContext()

  const [localSearch, setLocalSearch] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('scientific_name')
  const [filters, setFilters] = useState({ page: 1, limit: 50 })

  const { data, isLoading } = useQuery({
    queryKey: ['parivesh-species-list', selectedParivesh?.id, filters, sortBy, sortColumn, searchValue],
    queryFn: () =>
      getSpeciesListByOrg({
        params: { q: searchValue, page: filters.page, sortBy, sortColumn, limit: filters.limit }
      }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const rows = useMemo(() => {
    return (data?.data?.species_data || []).map((el: any, i: number) => ({ ...el, id: i + 1 }))
  }, [data])

  const total = Number(data?.data?.total_count) || 0

  const debouncedSearch = useMemo(() => debounce((val: string) => setSearchValue(val), 500), [])

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSortBy(newModel[0].sort === 'asc' ? 'ASC' : 'DESC')
      setSortColumn(newModel[0].field)
    }
  }

  const getColumns = () => [
    {
      width: 60,
      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.id}</Typography>
    },
    {
      width: 280,
      field: 'species_name',
      headerName: t('parivesh_module.species'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => {
        // SpeciesCard expects `default_icon` as a string URL. The API returns `species_image`
        // either as a string or an array of {attachment, ...}. Normalise both shapes.
        const img = Array.isArray(p.row.species_image)
          ? p.row.species_image[0]?.attachment
          : p.row.species_image
        return <SpeciesCard species={{ ...p.row, default_icon: img }} />
      }
    },
    ...Object.keys(
      rows.reduce((acc: any, row: any) => {
        ;(row.organizations || []).forEach((org: any) => {
          acc[org.organization_name] = true
        })
        return acc
      }, {})
    ).map((orgName, index) => ({
      flex: 0.6,
      minWidth: 180,
      field: `org_${index}`,
      headerName: orgName,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => {
        const org = (p.row.organizations || []).find((o: any) => o.organization_name === orgName)
        return (
          <Box
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              if (org) {
                router.push(
                  `/parivesh/species/${p.row.tsn_id}?tsn_relation=${p.row.tsn_relation}&tsn_id=${p.row.tsn_id}&org_id=${org.org_id}`
                )
              }
            }}
          >
            <Typography variant='h6' sx={{ color: '#44544A' }}>
              {org ? org.animal_count : '-'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <Box sx={{ bgcolor: '#AFEFEB', px: 1.4, mx: 0.5, borderRadius: 0.4 }}>
                <Typography sx={{ color: '#1F515B' }} variant='caption'>
                  M-{org ? org.male_count : '0'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#FFD3D3', px: 1.4, mx: 0.5, borderRadius: 0.4 }}>
                <Typography sx={{ color: '#1F515B' }} variant='caption'>
                  F-{org ? org.female_count : '0'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#8479F91A', px: 1.4, mx: 0.5, borderRadius: 0.4 }}>
                <Typography sx={{ color: '#E93353' }} variant='caption'>
                  O-{org ? org.other_count : '0'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )
      }
    }))
  ]

  return (
    <Card sx={{ mt: 4, p: 4 }}>
      <CardHeader
        title={t('parivesh_module.species_overview')}
        action={
          <Search
            borderRadius='4px'
            width='220px'
            placeholder={t('search') as string}
            value={localSearch}
            onClear={() => {
              setLocalSearch('')
              setSearchValue('')
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setLocalSearch(e.target.value)
              debouncedSearch(e.target.value)
            }}
          />
        }
      />
      <CommonTable
        columns={getColumns()}
        indexedRows={rows}
        total={total}
        loading={isLoading}
        paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
        setPaginationModel={(m: any) => setFilters({ page: m.page + 1, limit: m.pageSize })}
        handleSortModel={handleSortModel}
        searchValue=''
        getRowHeight={() => 'auto'}
        onRowClick={() => {}}
        rowHeight={80}
        externalTableStyle={{
          '& .MuiDataGrid-cell': { py: 2.5, px: 3, display: 'flex', alignItems: 'center' },
          '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
          '& .MuiDataGrid-columnHeader': { px: 3 },

          // Sticky S.NO column (left edge)
          '& .MuiDataGrid-cell[data-field="sl_no"]': {
            position: 'sticky',
            left: 0,
            zIndex: 3,
            backgroundColor: theme.palette.background.paper
          },
          '& .MuiDataGrid-columnHeader[data-field="sl_no"]': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: theme.palette.customColors.customTableHeaderBg
          },

          // Sticky SPECIES column — offset by 60px (sl_no width)
          '& .MuiDataGrid-cell[data-field="species_name"]': {
            position: 'sticky',
            left: 60,
            zIndex: 3,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
          },
          '& .MuiDataGrid-columnHeader[data-field="species_name"]': {
            position: 'sticky',
            left: 60,
            zIndex: 5,
            backgroundColor: theme.palette.customColors.customTableHeaderBg,
            borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
          },

          // Maintain sticky bg on row hover so the pinned columns don't lose their solid background
          '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': {
            backgroundColor: theme.palette.customColors.Surface
          },
          '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="species_name"]': {
            backgroundColor: theme.palette.customColors.Surface
          }
        }}
      />
    </Card>
  )
}

export default SpeciesListContent
