import React, { useState, useMemo, useCallback } from 'react'
import { Avatar, Box, Button, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Icon from 'src/@core/components/icon'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import EnclosureDrawer from 'src/components/housing/utils/EnclosureDrawer'
import { getSpeciesWiseDetails, SpeciesWiseSectionItem, getAnimalListing } from 'src/lib/api/collection/species'
import LocationNameCard from 'src/views/utility/LocationNameCard'

interface SectionsTabProps {
  speciesId?: string
}

const pickSectionImage = (item: SpeciesWiseSectionItem): string => {
  const images = item?.images || []
  const banner = images.find(img => img.display_type === 'banner' && img.file_type === 'image')
  if (banner?.file) return banner.file
  const firstImage = images.find(img => img.file_type === 'image')

  return firstImage?.file || ''
}

const mapSectionRow = (item: SpeciesWiseSectionItem, slNo: number) => ({
  id: item.section_id,
  sl_no: slNo,
  section_name: item.section_name || '-',
  image: pickSectionImage(item),
  animals: Number(item.animal_count) || 0,
  enclosures: Number(item.enclosure_count) || 0,
  site: item.site_name || '-'
})

const SectionsTab: React.FC<SectionsTabProps> = ({ speciesId }) => {
  const theme = useTheme() as any
  const [searchValue, setSearchValue] = useState('')
  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<any>(null)
  const [animalCount, setAnimalCount] = useState(0)
  const [filters, setFilters] = useState({ page: 1, limit: 50, q: '' })

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
  const handleDrawerClose = () => { setDrawerType(null); setDrawerData(null) }

  const { data: sectionsResponse, isLoading } = useQuery({
    queryKey: ['species-wise-details-sections', speciesId, filters],
    queryFn: () =>
      getSpeciesWiseDetails<SpeciesWiseSectionItem>({
        species_id: speciesId as string,
        type: 'section',
        page_no: filters.page,
        q: filters.q
      }),
    placeholderData: (prev: any) => prev,
    enabled: Boolean(speciesId)
  })

  const totalCount = Number(sectionsResponse?.data?.total_count) || 0
  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const sections = useMemo(
    () => (sectionsResponse?.data?.result || []).map((item, index) => mapSectionRow(item, getSlNo(index))),
    [sectionsResponse, filters.page, filters.limit]
  )

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    setFilters(prev => ({ ...prev, page: model.page + 1, limit: model.pageSize }))
  }

  const openDrawer = (type: string, row: any, queryKey: string) => {
    setDrawerType(type)
    setDrawerData({
      queryKey,
      id: row.id,
      name: row.section_name,
      image: row.image,
      params: type === 'animals'
        ? { taxonomy_id: speciesId, section_id: row.id }
        : { section_id: row.id }
    })
    if (type === 'animals') setAnimalCount(row.animals || 0)
  }

  const clickableCell = (row: any, value: any, type: string, queryKey: string) => (
    <Box sx={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); openDrawer(type, row, queryKey) }}>
      <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurface }}>{value}</Typography>
    </Box>
  )

  const columns = [
    { width: 50, sortable: false, field: 'sl_no', headerName: 'NO', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.sl_no}</Typography> },
    { minWidth: 200, flex: 1, sortable: false, field: 'section_name', headerName: 'SECTION NAME', renderCell: (p: GridRenderCellParams) => (
      <LocationNameCard name={p.row.section_name} image={p.row.image} icon='mdi:view-grid-outline' />
    )},
    { width: 110, sortable: false, field: 'animals', headerName: 'ANIMALS', renderCell: (p: GridRenderCellParams) => clickableCell(p.row, p.row.animals?.toLocaleString(), 'animals', 'section-animals-drawer') },
    { width: 130, sortable: false, field: 'enclosures', headerName: 'ENCLOSURES', renderCell: (p: GridRenderCellParams) => clickableCell(p.row, p.row.enclosures, 'enclosures', 'section-enclosures-drawer') },
    { minWidth: 200, flex: 1, sortable: false, field: 'site', headerName: 'SITE', renderCell: (p: GridRenderCellParams) => <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{p.row.site}</Typography> }
  ]

  const stickyStyles = {
    '& .MuiDataGrid-cell': { py: 2.5, px: 3, display: 'flex', alignItems: 'center' },
    '& .MuiDataGrid-row:hover': { cursor: 'pointer' }, '& .MuiDataGrid-columnHeader': { px: 3 },
    '& .MuiDataGrid-cell[data-field="sl_no"]': { position: 'sticky', left: 0, zIndex: 3, backgroundColor: theme.palette.background.paper },
    '& .MuiDataGrid-columnHeader[data-field="sl_no"]': { position: 'sticky', left: 0, zIndex: 5, backgroundColor: theme.palette.customColors.customTableHeaderBg },
    '& .MuiDataGrid-cell[data-field="section_name"]': { position: 'sticky', left: 50, zIndex: 3, backgroundColor: theme.palette.background.paper, borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}` },
    '& .MuiDataGrid-columnHeader[data-field="section_name"]': { position: 'sticky', left: 50, zIndex: 5, backgroundColor: theme.palette.customColors.customTableHeaderBg, borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}` },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': { backgroundColor: theme.palette.customColors.Surface },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="section_name"]': { backgroundColor: theme.palette.customColors.Surface }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>Sections ({totalCount})</Typography>
        <Button variant='text' onClick={() => {}} endIcon={<Icon icon='solar:download-square-linear' />} sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500, textTransform: 'none', fontSize: '0.875rem' }}>Download</Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 4, gap: 2 }}>
        <Search borderRadius='4px' width='220px' placeholder='Search' value={searchValue} onClear={() => handleSearch('')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)} />
        <FilterButtonWithNotification label='Filter' onClick={() => {}} sx={{ height: 36 }} />
      </Box>
      <CommonTable
        columns={columns}
        indexedRows={sections}
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

      {drawerType === 'animals' && <AnimalDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} totalCount={animalCount} defaultImage='/images/housing/site-icon-colored.svg'
        fetchFn={(params) => getAnimalListing({ taxonomy_id: params.taxonomy_id as string, section_id: params.section_id as string, page_no: params.page_no as number, q: params.q as string })}
      />}
      {drawerType === 'enclosures' && <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
    </Box>
  )
}

export default SectionsTab
