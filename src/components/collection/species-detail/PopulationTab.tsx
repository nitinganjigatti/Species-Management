import React, { useState, useMemo, useCallback } from 'react'
import { Avatar, Box, Button, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import StatChip from 'src/views/utility/StatChip'
import AnimalIdCard from 'src/views/utility/AnimalIdCard'
import Icon from 'src/@core/components/icon'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import PopulationFilterDrawer, { PopulationFilterOptions } from 'src/components/collection/PopulationFilterDrawer'
import { getAllAnimalReport } from 'src/lib/api/report'

interface PopulationTabProps {
  speciesId?: string
  animalCount?: number
}

// Map a row from /v1/all/animal/report animal_list into the table row shape.
// Fields the API does not currently return are filled with '-' (or '00' for medical counts) — see
// docs/modules/collection/species-pending.md for the backend punch list.
const GENDER_LABELS: Record<string, string> = {
  male: 'M',
  female: 'F',
  undetermined: 'UD',
  indeterminate: 'ID'
}

const formatBirthDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  return `DOB : ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

const buildIdentifiers = (item: any): Array<{ label: string; value: string }> => {
  const identifiers: Array<{ label: string; value: string }> = []

  // API ships these as named keys on the row when the species/animal has them
  if (item?.['Micro Chip']) identifiers.push({ label: 'Micro Chip', value: String(item['Micro Chip']) })
  if (item?.['Ring Number']) identifiers.push({ label: 'Ring Number', value: String(item['Ring Number']) })

  // Fallback: primary identifier (only when its type isn't already covered above)
  const primaryType = item?.primary_identifier_type
  const primaryValue = item?.primary_identifier_value
  if (primaryType && primaryValue && !identifiers.some(i => i.label === primaryType)) {
    identifiers.push({ label: primaryType, value: String(primaryValue) })
  }

  return identifiers
}

const mapAnimalRow = (item: any, index: number, slNo: number) => ({
  id: `${index}_${item?.animal_id ?? 'row'}`,
  sl_no: slNo,
  animal_id: item?.animal_id ? `AAID : ${item.animal_id}` : '-',
  uid: '-', // TODO: API does not return UAID separately yet
  identifiers: buildIdentifiers(item),
  common_name: item?.common_name || '',
  scientific_name: item?.scientific_name || '',
  gender: GENDER_LABELS[String(item?.gender || '').toLowerCase()] || '-',
  age: item?.age || '-',
  birth_date: formatBirthDate(item?.birth_date),
  current_weight: item?.weight || '-',
  current_weight_change: '-', // TODO: API does not return weight change %
  current_weight_date: '-', // TODO: API does not return weight recorded date
  previous_weight: '-', // TODO: API does not return previous weight
  previous_weight_change: '-',
  previous_weight_date: '-',
  life_stage: '-', // TODO: API does not return life stage
  breed: item?.breed_name ? `Breed : ${item.breed_name}` : 'Breed : -',
  morph: item?.morph_name ? `Morph : ${item.morph_name}` : 'Morph : -',
  active_complaints: '00', // TODO: API does not return active medical counts
  active_diagnosis: '00',
  active_prescriptions: '00',
  active_medicines: '00',
  enclosure: item?.user_enclosure_name || '-',
  section: item?.section_name || '-',
  site: item?.site_name || '-',
  image: item?.default_icon || '',
  raw_animal_id: item?.animal_id // for routing — keep the bare id
})

const PopulationTab: React.FC<PopulationTabProps> = ({ speciesId, animalCount = 1237 }) => {
  const theme = useTheme() as any
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [appliedFilters, setAppliedFilters] = useState<PopulationFilterOptions>({
    sites: [],
    sections: [],
    enclosures: [],
    Gender: [],
    Age: [],
    'Life Stage': [],
    'Identifier Type': [],
    Breed: [],
    'Health Status': []
  })
  const [animalDrawerOpen, setAnimalDrawerOpen] = useState(false)
  const [animalDrawerData, setAnimalDrawerData] = useState<any>(null)
  const [animalTotalCount, setAnimalTotalCount] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const [filters, setFilters] = useState({ page: 1, limit: 10, q: '' })

  // Debounced search → updates filters.q (which is in the React Query key)
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => ({ ...prev, q: value, page: 1 }))
      }, 500),
    []
  )
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // Fetch animals for this species — /v1/all/animal/report?tids={speciesId}
  const { data: animalsResponse, isLoading } = useQuery({
    queryKey: ['species-animals-report', speciesId, filters],
    queryFn: () =>
      getAllAnimalReport({
        tids: speciesId,
        page: filters.page,
        limit: filters.limit,
        q: filters.q,
        include_class: 1,
        include_order: 1,
        include_family: 1,
        include_genus: 1,
        include_site: 1,
        include_section: 1,
        include_enclosure: 1,
        include_organization: 1,
        include_cluster: 0,
        include_housing: 0
      }),
    placeholderData: (prev: any) => prev,
    enabled: Boolean(speciesId)
  })

  // Note: this endpoint returns `total_animal` (not `total_count` like /v1/species/reportv1).
  // Falls back to total_count just in case the backend ever normalizes the shape.
  const totalCount = Number(animalsResponse?.data?.total_animal ?? animalsResponse?.data?.total_count) || 0
  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const animals = useMemo(
    () =>
      (animalsResponse?.data?.animal_list || []).map((item: any, index: number) =>
        mapAnimalRow(item, index, getSlNo(index))
      ),
    [animalsResponse, filters.page, filters.limit]
  )

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    setFilters(prev => ({ ...prev, page: model.page + 1, limit: model.pageSize }))
  }

  // Download animals report as CSV — same /v1/all/animal/report endpoint with response_type='csv'.
  // All include_* flags on so the CSV ships every column. Honors the active species + search.
  // The API returns a presigned URL string in `response.data`; we open it via a temp <a> to trigger download.
  const handleDownload = async () => {
    if (isDownloading || !speciesId) return
    try {
      setIsDownloading(true)
      const response: any = await getAllAnimalReport({
        tids: speciesId,
        q: filters.q,
        include_class: 1,
        include_order: 1,
        include_family: 1,
        include_genus: 1,
        include_site: 1,
        include_section: 1,
        include_enclosure: 1,
        include_organization: 1,
        include_cluster: 1,
        include_housing: 1,
        response_type: 'csv'
      })

      const csvUrl = response?.data
      if (typeof csvUrl === 'string' && csvUrl) {
        const link = document.createElement('a')
        link.href = csvUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error('Could not generate report')
      }
    } catch {
      toast.error('Error connecting to the server')
    } finally {
      setIsDownloading(false)
    }
  }
  const columns = [
    {
      width: 50,
      sortable: false,
      field: 'sl_no',
      headerName: 'NO',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.sl_no}
        </Typography>
      )
    },
    {
      minWidth: 220,
      sortable: false,
      field: 'animal_id',
      headerName: 'ANIMAL ID',
      renderCell: (p: GridRenderCellParams) => (
        <Box
          sx={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
          onClick={() => {
            const animalId = p.row.raw_animal_id
            if (animalId) router.push(`/collection/species/${speciesId}/animal/${animalId}`)
          }}
        >
          <AnimalIdCard animalId={p.row.animal_id} uid={p.row.uid} image={p.row.image} avatarSize={36} iconSize={18} />
        </Box>
      )
    },
    {
      width: 180,
      sortable: false,
      field: 'identifiers',
      headerName: 'IDENTIFIER TYPE',
      renderCell: (p: GridRenderCellParams) => {
        const items = (p.row.identifiers || []) as Array<{ label: string; value: string }>
        if (items.length === 0) {
          return (
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              -
            </Typography>
          )
        }

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {items.map(it => (
              <Typography
                key={it.label}
                variant='caption'
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.4 }}
              >
                <Box component='span' sx={{ fontWeight: 600 }}>
                  {it.label}
                </Box>
                {`: ${it.value}`}
              </Typography>
            ))}
          </Box>
        )
      }
    },
    {
      width: 200,
      sortable: false,
      field: 'common_name',
      headerName: 'ANIMAL NAME',
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            variant='body2'
            sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.4 }}
            title={p.row.common_name}
          >
            {p.row.common_name || '-'}
          </Typography>
          {p.row.scientific_name && (
            <Typography
              variant='caption'
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customColors.neutralSecondary,
                lineHeight: 1.4
              }}
              title={p.row.scientific_name}
            >
              {p.row.scientific_name}
            </Typography>
          )}
        </Box>
      )
    },
    {
      width: 90,
      sortable: false,
      field: 'gender',
      headerName: 'GENDER',
      renderCell: (p: GridRenderCellParams) => {
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
      }
    },
    {
      width: 160,
      sortable: false,
      field: 'age',
      headerName: 'AGE & BIRTH DATE',
      renderCell: (p: GridRenderCellParams) => (
        <Box>
          <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
            {p.row.age}
          </Typography>
          <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '0.7rem' }}>
            {p.row.birth_date}
          </Typography>
        </Box>
      )
    },
    {
      width: 150,
      sortable: false,
      field: 'current_weight',
      headerName: 'CURRENT WEIGHT',
      renderCell: (p: GridRenderCellParams) => (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              {p.row.current_weight}
            </Typography>
            <Typography sx={{ color: theme.palette.primary.main, fontWeight: 600, fontSize: '0.7rem' }}>
              {p.row.current_weight_change}
            </Typography>
          </Box>
          <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '0.7rem' }}>
            {p.row.current_weight_date}
          </Typography>
        </Box>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'previous_weight',
      headerName: 'PREVIOUS WEIGHT',
      renderCell: (p: GridRenderCellParams) => (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              {p.row.previous_weight}
            </Typography>
            <Typography sx={{ color: theme.palette.primary.main, fontWeight: 600, fontSize: '0.7rem' }}>
              {p.row.previous_weight_change}
            </Typography>
          </Box>
          <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '0.7rem' }}>
            {p.row.previous_weight_date}
          </Typography>
        </Box>
      )
    },
    {
      width: 100,
      sortable: false,
      field: 'life_stage',
      headerName: 'LIFE STAGE',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.life_stage}
        </Typography>
      )
    },
    {
      width: 180,
      sortable: false,
      field: 'breed',
      headerName: 'BREED & MORPH',
      renderCell: (p: GridRenderCellParams) => (
        <Box>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '0.8rem' }}>
            {p.row.breed}
          </Typography>
          <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
            {p.row.morph}
          </Typography>
        </Box>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'active_complaints',
      headerName: 'ACTIVE COMPLAINTS',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>
          {p.row.active_complaints}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'active_diagnosis',
      headerName: 'ACTIVE DIAGNOSIS',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>
          {p.row.active_diagnosis}
        </Typography>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'active_prescriptions',
      headerName: 'ACTIVE PRESCRIPTIONS',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>
          {p.row.active_prescriptions}
        </Typography>
      )
    },
    {
      width: 150,
      sortable: false,
      field: 'active_medicines',
      headerName: 'ACTIVE MEDICINES',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>
          {p.row.active_medicines}
        </Typography>
      )
    },
    {
      width: 120,
      sortable: false,
      field: 'enclosure',
      headerName: 'ENCLOSURES',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.enclosure}
        </Typography>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'section',
      headerName: 'SECTION',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.section}
        </Typography>
      )
    },
    {
      width: 180,
      sortable: false,
      field: 'site',
      headerName: 'SITE',
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.site}
        </Typography>
      )
    }
  ]

  const stickyStyles = {
    '& .MuiDataGrid-cell': { py: 2.5, px: 3, display: 'flex', alignItems: 'center' },
    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
    '& .MuiDataGrid-columnHeader': { px: 3 },
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
    '& .MuiDataGrid-cell[data-field="animal_id"]': {
      position: 'sticky',
      left: 50,
      zIndex: 3,
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
    },
    '& .MuiDataGrid-columnHeader[data-field="animal_id"]': {
      position: 'sticky',
      left: 50,
      zIndex: 5,
      backgroundColor: theme.palette.customColors.customTableHeaderBg,
      borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
    },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': {
      backgroundColor: theme.palette.customColors.Surface
    },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="animal_id"]': {
      backgroundColor: theme.palette.customColors.Surface
    }
  }

  return (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}
      >
        <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
          Animals ({(totalCount || animalCount || 0).toLocaleString()})
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => {}}>
          <Button
            variant='text'
            onClick={handleDownload}
            disabled={isDownloading}
            endIcon={
              isDownloading ? (
                <CircularProgress size={16} sx={{ color: theme.palette.customColors.OnSurface }} />
              ) : (
                <Icon icon='solar:download-square-linear' />
              )
            }
            sx={{
              color: theme.palette.customColors.OnSurface,
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.875rem'
            }}
          >
            {isDownloading ? 'Preparing…' : 'Download'}
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 2,
          gap: 2
        }}
      >
        <Search
          borderRadius='4px'
          width='220px'
          placeholder='Search'
          value={searchValue}
          onClear={() => handleSearch('')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
        />
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 2 }}>
          <FilterButtonWithNotification
            label='Filter'
            onClick={() => setFilterOpen(true)}
            appliedFiltersCount={filterCount || undefined}
            sx={{ height: 36 }}
          />
          <Button
            variant='contained'
            sx={{
              textTransform: 'uppercase',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.75rem',
              px: 2.5,
              height: 36,
              whiteSpace: 'nowrap'
            }}
          >
            Batch Assessment
          </Button>
        </Box>
      </Box>
      {searchValue && (
        <Typography
          sx={{ mb: 3, fontSize: '0.875rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Results ({totalCount.toLocaleString()})
        </Typography>
      )}
      <CommonTable
        columns={columns}
        indexedRows={animals}
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

      {animalDrawerOpen && (
        <AnimalDrawer
          open={!!animalDrawerData}
          onClose={() => {
            setAnimalDrawerOpen(false)
            setAnimalDrawerData(null)
          }}
          data={animalDrawerData}
          totalCount={animalTotalCount}
          defaultImage='/images/housing/species-icon-colored.svg'
          objectFit='contain'
        />
      )}
      <PopulationFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApplyFilters={f => setAppliedFilters(f)}
        setFilterCount={setFilterCount}
        initialSelectedOptions={appliedFilters}
      />
    </Box>
  )
}

export default PopulationTab
