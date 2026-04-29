import React, { useState, useMemo, useCallback } from 'react'
import { Avatar, Box, Button, FormControl, MenuItem, Select, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import StatChip from 'src/views/utility/StatChip'
import Icon from 'src/@core/components/icon'
import MortalityFilterDrawer, { MortalityFilterOptions } from 'src/components/collection/MortalityFilterDrawer'
import { getMortalitySpeciesList, MortalitySpeciesItem } from 'src/lib/api/collection/species'

interface MortalityTabProps {
  speciesId?: string
}

const GENDER_LABELS: Record<string, string> = {
  male: 'M',
  female: 'F',
  undetermined: 'UD',
  indeterminate: 'ID'
}

const formatDiedOn = (iso?: string) => {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso
  const datePart = d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return `${datePart} • ${timePart}`
}

const titleCase = (s?: string | null): string => {
  if (!s) return '-'

  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

const mapMortalityRow = (item: MortalitySpeciesItem, slNo: number) => ({
  id: `${item.mortality_id}_${slNo}`,
  sl_no: slNo,
  animal_id: item.animal_id ? `AAID : ${item.animal_id}` : '-',
  uid: '-',
  animal_name: item.local_identifier_value || item.common_name || '-',
  scientific_name: item.scientific_name || '',
  gender: (item.type || '').toLowerCase() === 'group' ? 'G' : GENDER_LABELS[(item.sex || '').toLowerCase()] || '-',
  breed: item.breed_name ? `B - ${item.breed_name}` : 'B - -',
  morph: item.morph_name ? `M - ${item.morph_name}` : 'M - -',
  died_on: formatDiedOn(item.discovered_date),
  cause_of_death: item.reason_name || '-',
  approval_status: titleCase(item.mortality_status || item.status),
  necropsy_performed: item.necropsy_performed ? 'Yes' : 'No',
  necropsy_report: item.necropsy_performed ? 'Available' : '-',
  section: item.section_name || '-',
  reported_by: item.reported_by || '-',
  enclosure: item.user_enclosure_name || '-',
  site: item.site_name || '-',
  image: item.default_icon || ''
})

const MortalityTab: React.FC<MortalityTabProps> = ({ speciesId }) => {
  const theme = useTheme() as any
  const [searchValue, setSearchValue] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [appliedFilters, setAppliedFilters] = useState<MortalityFilterOptions>({ sites: [], Gender: [], Breed: [], 'Cause of Death': [], 'Approval Status': [], 'Necropsy Taken': [], 'Necropsy Status': [], 'Reported by': [] })
  const [filters, setFilters] = useState({ page: 1, limit: 50, q: '', status: 'APPROVED' })

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setFilters(prev => ({ ...prev, q: value, page: 1 })), 500),
    []
  )
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const { data: mortalityResponse, isLoading } = useQuery({
    queryKey: ['species-mortality-list', speciesId, filters],
    queryFn: () =>
      getMortalitySpeciesList({
        taxonomy_id: speciesId as string,
        page_no: filters.page,
        status: filters.status,
        order: 'DESC',
        purpose: 'animals',
        q: filters.q
      }),
    placeholderData: (prev: any) => prev,
    enabled: Boolean(speciesId)
  })

  const totalCount = Number(mortalityResponse?.total_count) || 0
  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const mortalityRows = useMemo(
    () => (mortalityResponse?.result || []).map((item, index) => mapMortalityRow(item, getSlNo(index))),
    [mortalityResponse, filters.page, filters.limit]
  )

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    setFilters(prev => ({ ...prev, page: model.page + 1, limit: model.pageSize }))
  }

  const columns = [
    { width: 50, sortable: false, field: 'sl_no', headerName: 'NO', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.sl_no}</Typography> },
    { minWidth: 180, sortable: false, field: 'animal_id', headerName: 'ANIMAL ID', renderCell: (p: GridRenderCellParams) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={p.row.image} sx={{ width: 32, height: 32, bgcolor: theme.palette.customColors.Surface }}><Icon icon='mdi:paw' fontSize={16} /></Avatar>
        <Box><Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurface }}>{p.row.animal_id}</Typography><Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>{p.row.uid}</Typography></Box>
      </Box>
    )},
    { width: 200, sortable: false, field: 'animal_name', headerName: 'ANIMAL NAME', renderCell: (p: GridRenderCellParams) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.4 }} title={p.row.animal_name}>
          {p.row.animal_name || '-'}
        </Typography>
        {p.row.scientific_name && (
          <Typography variant='caption' sx={{ fontStyle: 'italic', color: theme.palette.customColors.neutralSecondary, lineHeight: 1.4 }} title={p.row.scientific_name}>
            {p.row.scientific_name}
          </Typography>
        )}
      </Box>
    )},
    { width: 90, sortable: false, field: 'gender', headerName: 'GENDER', renderCell: (p: GridRenderCellParams) => {
      const g = p.row.gender
      const bg = g === 'M' ? `${theme.palette.customColors.SecondaryContainer}80`
        : g === 'F' ? `${theme.palette.customColors.Tertiary}4D`
        : g === 'G' ? theme.palette.customColors.addPrimary
        : theme.palette.customColors.SurfaceVariant
      const tc = g === 'M' ? theme.palette.customColors.addPrimary
        : g === 'F' ? theme.palette.customColors.Tertiary
        : g === 'G' ? theme.palette.common.white
        : theme.palette.customColors.Error

      return <StatChip value={g} bgcolor={bg} color={tc} />
    }},
    { width: 160, sortable: false, field: 'breed', headerName: 'BREED & MORPH', renderCell: (p: GridRenderCellParams) => (<Box><Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '0.8rem' }}>{p.row.breed}</Typography><Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>{p.row.morph}</Typography></Box>) },
    { width: 180, sortable: false, field: 'died_on', headerName: 'DIED ON', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.died_on}</Typography> },
    { width: 140, sortable: false, field: 'cause_of_death', headerName: 'CAUSE OF DEATH', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.cause_of_death}</Typography> },
    { width: 150, sortable: false, field: 'approval_status', headerName: 'APPROVAL STATUS', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ fontWeight: 500, color: p.row.approval_status === 'Approved' ? theme.palette.primary.dark : p.row.approval_status === 'Pending' ? theme.palette.customColors.Tertiary : theme.palette.customColors.neutralSecondary }}>{p.row.approval_status}</Typography> },
    { width: 160, sortable: false, field: 'necropsy_performed', headerName: 'NECROPSY PERFORMED', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ fontWeight: 500, color: p.row.necropsy_performed === 'Yes' ? theme.palette.customColors.addPrimary : theme.palette.customColors.neutralSecondary }}>{p.row.necropsy_performed}</Typography> },
    { width: 160, sortable: false, field: 'necropsy_report', headerName: 'NECROPSY REPORT', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ fontWeight: 500, color: p.row.necropsy_report === 'Available' ? theme.palette.primary.main : theme.palette.customColors.neutralSecondary }}>{p.row.necropsy_report}</Typography> },
    { width: 180, sortable: false, field: 'section', headerName: 'SECTION', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.section}</Typography> },
    { width: 150, sortable: false, field: 'reported_by', headerName: 'REPORTED BY', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.reported_by}</Typography> },
    { width: 180, sortable: false, field: 'enclosure', headerName: 'ENCLOSURE', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.enclosure}</Typography> },
    { width: 150, sortable: false, field: 'site', headerName: 'SITE', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.site}</Typography> }
  ]

  const stickyStyles = {
    '& .MuiDataGrid-cell': { py: 2.5, px: 3, display: 'flex', alignItems: 'center' },
    '& .MuiDataGrid-row:hover': { cursor: 'pointer' }, '& .MuiDataGrid-columnHeader': { px: 3 },
    '& .MuiDataGrid-cell[data-field="sl_no"]': { position: 'sticky', left: 0, zIndex: 3, backgroundColor: theme.palette.background.paper },
    '& .MuiDataGrid-columnHeader[data-field="sl_no"]': { position: 'sticky', left: 0, zIndex: 5, backgroundColor: theme.palette.customColors.customTableHeaderBg },
    '& .MuiDataGrid-cell[data-field="animal_id"]': { position: 'sticky', left: 50, zIndex: 3, backgroundColor: theme.palette.background.paper, borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}` },
    '& .MuiDataGrid-columnHeader[data-field="animal_id"]': { position: 'sticky', left: 50, zIndex: 5, backgroundColor: theme.palette.customColors.customTableHeaderBg, borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}` },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': { backgroundColor: theme.palette.customColors.Surface },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="animal_id"]': { backgroundColor: theme.palette.customColors.Surface }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>Mortality ({totalCount})</Typography>
        <Button variant='text' onClick={() => {}} endIcon={<Icon icon='solar:download-square-linear' />} sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500, textTransform: 'none', fontSize: '0.875rem' }}>Download</Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 4, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size='small' sx={{ minWidth: 100 }}>
            <Select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as string, page: 1 }))}
              sx={{ borderRadius: '4px', fontSize: '0.875rem', color: theme.palette.customColors.OnSurfaceVariant, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.customColors.OutlineVariant } }}
            >
              <MenuItem value='APPROVED'>Approved</MenuItem>
              <MenuItem value='PENDING'>Pending</MenuItem>
              <MenuItem value='REJECTED'>Rejected</MenuItem>
            </Select>
          </FormControl>
          <Search borderRadius='4px' width='180px' placeholder='Search' value={searchValue} onClear={() => handleSearch('')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)} />
        </Box>
        <FilterButtonWithNotification label='Filter' onClick={() => setFilterOpen(true)} appliedFiltersCount={filterCount || undefined} sx={{ height: 36 }} />
      </Box>
      <CommonTable
        columns={columns}
        indexedRows={mortalityRows}
        total={totalCount}
        loading={isLoading}
        paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
        setPaginationModel={handlePaginationModelChange}
        handleSortModel={() => {}}
        searchValue=''
        getRowHeight={() => 'auto'}
        onRowClick={() => {}}
        externalTableStyle={stickyStyles}
      />
      <MortalityFilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} onApplyFilters={f => setAppliedFilters(f)} setFilterCount={setFilterCount} initialSelectedOptions={appliedFilters} />
    </Box>
  )
}

export default MortalityTab
