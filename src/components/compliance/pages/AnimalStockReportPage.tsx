'use client'

import { useTheme } from '@mui/material/styles'
import { Box, Button, Card, CardHeader, IconButton, Typography } from '@mui/material'
import React, { useMemo, useState, useCallback, useContext, useEffect } from 'react'
import Icon from 'src/@core/components/icon'
import ReactTable from 'src/views/table/ReactTable'
import Search from 'src/views/utility/Search'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import ReportCard from 'src/views/pages/report/ReportCard'
import SiteDrawer from 'src/views/pages/compliance/reports/animalStockReport/SiteDrawer'
import { AuthContext } from 'src/context/AuthContext'

const SPECIES_IMAGE = '/images/avatars/1.png'

interface StockValues {
  m?: number
  f?: number
  o?: number
  t?: number
}

interface StockRow {
  id: string
  species: {
    primary: string
    secondary: string
    image: string
  }
  speciesCard: {
    default_icon: string
    common_name: string
    scientific_name: string
    primary_identifier_type: string
    primary_identifier_value: string
  }
  openingStock: StockValues
  births: StockValues
  acquisitions: StockValues
  disposals: StockValues
  deaths: StockValues
  closingStock: StockValues
}

interface SiteItem {
  id: string
  site_id?: string
  site_name?: string
  name?: string
  site_type?: string
  location?: string
  description?: string
  site_image?: string
  image?: string
}

const withTotal = (stock: StockValues): StockValues => ({
  ...stock,
  t: (stock.m || 0) + (stock.f || 0) + (stock.o || 0)
})

const createClosingStock = ({
  opening,
  births,
  acquisitions,
  disposals,
  deaths
}: {
  opening: StockValues
  births: StockValues
  acquisitions: StockValues
  disposals: StockValues
  deaths: StockValues
}): StockValues => {
  const compute = (key: keyof StockValues) =>
    (opening[key] || 0) + (births[key] || 0) + (acquisitions[key] || 0) - (disposals[key] || 0) - (deaths[key] || 0)

  return withTotal({
    m: compute('m'),
    f: compute('f'),
    o: compute('o')
  })
}

const buildRow = ({
  id,
  primary,
  secondary,
  image = SPECIES_IMAGE,
  opening,
  births,
  acquisitions,
  disposals,
  deaths
}: {
  id: string
  primary: string
  secondary: string
  image?: string
  opening: StockValues
  births: StockValues
  acquisitions: StockValues
  disposals: StockValues
  deaths: StockValues
}): StockRow => {
  const openingStock = withTotal(opening)
  const birthStock = withTotal(births)
  const acquisitionStock = withTotal(acquisitions)
  const disposalStock = withTotal(disposals)
  const deathStock = withTotal(deaths)

  const closingStock = createClosingStock({
    opening: openingStock,
    births: birthStock,
    acquisitions: acquisitionStock,
    disposals: disposalStock,
    deaths: deathStock
  })

  return {
    id,
    species: {
      primary,
      secondary,
      image
    },
    speciesCard: {
      default_icon: image,
      common_name: primary,
      scientific_name: secondary,
      primary_identifier_type: 'Species ID',
      primary_identifier_value: id.toUpperCase()
    },
    openingStock,
    births: birthStock,
    acquisitions: acquisitionStock,
    disposals: disposalStock,
    deaths: deathStock,
    closingStock
  }
}

const STOCK_DATA: StockRow[] = [
  buildRow({
    id: 'row-1',
    primary: 'African Grey Parrot',
    secondary: 'Budgerigar',
    opening: { m: 150, f: 150, o: 150 },
    births: { m: 150, f: 150, o: 150 },
    acquisitions: { m: 150, f: 150, o: 150 },
    disposals: { m: 150, f: 150, o: 150 },
    deaths: { m: 150, f: 150, o: 150 }
  }),
  buildRow({
    id: 'row-2',
    primary: 'Hyacinth Macaw',
    secondary: 'Lovebird',
    opening: { m: 220, f: 220, o: 220 },
    births: { m: 220, f: 220, o: 220 },
    acquisitions: { m: 220, f: 220, o: 220 },
    disposals: { m: 220, f: 220, o: 220 },
    deaths: { m: 220, f: 220, o: 220 }
  }),
  buildRow({
    id: 'row-3',
    primary: 'Amazon Parrot',
    secondary: 'Eclectus Parrot',
    opening: { m: 190, f: 190, o: 190 },
    births: { m: 190, f: 190, o: 190 },
    acquisitions: { m: 190, f: 190, o: 190 },
    disposals: { m: 190, f: 190, o: 190 },
    deaths: { m: 190, f: 190, o: 190 }
  }),
  buildRow({
    id: 'row-4',
    primary: 'Nanday Parakeet',
    secondary: 'Canary Winged Parakeet',
    opening: { m: 165, f: 165, o: 165 },
    births: { m: 165, f: 165, o: 165 },
    acquisitions: { m: 165, f: 165, o: 165 },
    disposals: { m: 165, f: 165, o: 165 },
    deaths: { m: 165, f: 165, o: 165 }
  }),
  buildRow({
    id: 'row-5',
    primary: 'Senegal Parrot',
    secondary: 'Pionus Parrot',
    opening: { m: 140, f: 140, o: 140 },
    births: { m: 140, f: 140, o: 140 },
    acquisitions: { m: 140, f: 140, o: 140 },
    disposals: { m: 140, f: 140, o: 140 },
    deaths: { m: 140, f: 140, o: 140 }
  }),
  buildRow({
    id: 'row-6',
    primary: 'Green Cheek Conure',
    secondary: 'Crimson Rosella',
    opening: { m: 210, f: 210, o: 210 },
    births: { m: 210, f: 210, o: 210 },
    acquisitions: { m: 210, f: 210, o: 210 },
    disposals: { m: 210, f: 210, o: 210 },
    deaths: { m: 210, f: 210, o: 210 }
  }),
  buildRow({
    id: 'row-7',
    primary: 'Sun Conure',
    secondary: 'Parrotlet',
    opening: { m: 175, f: 175, o: 175 },
    births: { m: 175, f: 175, o: 175 },
    acquisitions: { m: 175, f: 175, o: 175 },
    disposals: { m: 175, f: 175, o: 175 },
    deaths: { m: 175, f: 175, o: 175 }
  }),
  buildRow({
    id: 'row-8',
    primary: 'Saddle-Backed Tern',
    secondary: "Bourke's Parakeet",
    opening: { m: 160, f: 160, o: 160 },
    births: { m: 160, f: 160, o: 160 },
    acquisitions: { m: 160, f: 160, o: 160 },
    disposals: { m: 160, f: 160, o: 160 },
    deaths: { m: 160, f: 160, o: 160 }
  }),
  buildRow({
    id: 'row-9',
    primary: 'Lories',
    secondary: 'Macaw',
    opening: { m: 250, f: 250, o: 250 },
    births: { m: 250, f: 250, o: 250 },
    acquisitions: { m: 250, f: 250, o: 250 },
    disposals: { m: 250, f: 250, o: 250 },
    deaths: { m: 250, f: 250, o: 250 }
  }),
  buildRow({
    id: 'row-10',
    primary: 'Cockatiel',
    secondary: 'Indian Ring Neck',
    opening: { m: 145, f: 145, o: 145 },
    births: { m: 145, f: 145, o: 145 },
    acquisitions: { m: 145, f: 145, o: 145 },
    disposals: { m: 145, f: 145, o: 145 },
    deaths: { m: 145, f: 145, o: 145 }
  }),
  buildRow({
    id: 'row-11',
    primary: 'Scarlet Macaw',
    secondary: 'Tamarin Parakeet',
    opening: { m: 230, f: 230, o: 230 },
    births: { m: 230, f: 230, o: 230 },
    acquisitions: { m: 230, f: 230, o: 230 },
    disposals: { m: 230, f: 230, o: 230 },
    deaths: { m: 230, f: 230, o: 230 }
  }),
  buildRow({
    id: 'row-12',
    primary: 'Yellow-Naped Amazon',
    secondary: 'Rainbow Lorikeet',
    opening: { m: 240, f: 240, o: 240 },
    births: { m: 240, f: 240, o: 240 },
    acquisitions: { m: 240, f: 240, o: 240 },
    disposals: { m: 240, f: 240, o: 240 },
    deaths: { m: 240, f: 240, o: 240 }
  }),
  buildRow({
    id: 'row-13',
    primary: 'Cockatoo',
    secondary: 'Quaker Parrot',
    opening: { m: 180, f: 180, o: 180 },
    births: { m: 180, f: 180, o: 180 },
    acquisitions: { m: 180, f: 180, o: 180 },
    disposals: { m: 180, f: 180, o: 180 },
    deaths: { m: 180, f: 180, o: 180 }
  })
]

const metricKeys = [
  { key: 'm', label: 'M' },
  { key: 'f', label: 'F' },
  { key: 'o', label: 'O' },
  { key: 't', label: 'T' }
]

const createNumberCell =
  (theme: Record<string, unknown>) =>
  ({ value }: { value: number | null }) =>
    (
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: 0,
          color: (theme as { palette: { customColors: { OnSurfaceVariant: string } } }).palette.customColors
            .OnSurfaceVariant,
          textAlign: 'center'
        }}
      >
        {value ?? '-'}
      </Typography>
    )

const createMetricGroup = (
  field: string,
  headerName: string,
  renderNumber: (props: { value: number | null }) => React.ReactElement
) => ({
  id: field,
  headerName,
  pinned: 'left',
  headerAlign: 'center',
  textAlign: 'center',
  columns: metricKeys.map(metric => ({
    id: `${field}_${metric.key}`,
    field: `${field}.${metric.key}`,
    headerName: metric.label,
    width: 96,
    minWidth: 80,
    textAlign: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: renderNumber
  }))
})

const createColumns = (theme: Record<string, unknown>) => {
  const numberCell = createNumberCell(theme)

  return [
    {
      id: 'species',
      field: 'species.primary',
      width: 280,
      headerName: 'Species Name',
      pinned: 'left',
      sortable: false,
      headerAlign: 'left',
      textAlign: 'left',
      renderCell: ({ row }: { row: StockRow }) => (
        <SpeciesCard
          species={{
            default_icon: row?.speciesCard?.default_icon || row?.species?.image || SPECIES_IMAGE,
            common_name: row?.speciesCard?.common_name || row?.species?.primary,
            scientific_name: row?.speciesCard?.scientific_name || row?.species?.secondary,
            primary_identifier_type: row?.speciesCard?.primary_identifier_type || 'Species ID',
            primary_identifier_value:
              row?.speciesCard?.primary_identifier_value ||
              (typeof row?.id === 'string' ? row.id.toUpperCase() : row?.id ?? 'STOCK-ID')
          } as any}
        />
      )
    },
    createMetricGroup('openingStock', 'Opening Stock', numberCell),
    createMetricGroup('births', 'Births', numberCell),
    createMetricGroup('acquisitions', 'Acquisitions', numberCell),
    createMetricGroup('disposals', 'Disposals', numberCell),
    createMetricGroup('deaths', 'Deaths', numberCell),
    createMetricGroup('closingStock', 'Closing Stock', numberCell)
  ]
}

const AnimalStockReport = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const [searchValue, setSearchValue] = useState<string>('')
  const [filterDates, setFilterDates] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  })
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [selectedSite, setSelectedSite] = useState<SiteItem | null>(null)
  const [isSiteDrawerOpen, setIsSiteDrawerOpen] = useState<boolean>(false)
  const [siteData, setSiteData] = useState<SiteItem[]>([])

  const loadSitesFromAuth = useCallback(() => {
    try {
      const sites = (authData as any)?.userData?.user?.zoos?.[0]?.sites || []
      const mapped = sites.map((site: Record<string, unknown>) => ({
        ...site,
        id: String(site.id ?? site.site_id ?? ''),
        site_id: String(site.id ?? site.site_id ?? ''),
        site_name: site.site_name || site.name || 'Unnamed Site'
      }))
      setSiteData(mapped)
    } catch (error) {
      console.error('Error loading site list for Animal Stock Report:', error)
    }
  }, [authData])

  useEffect(() => {
    loadSitesFromAuth()
  }, [loadSitesFromAuth])

  const drawerSites = useMemo(
    () =>
      siteData
        .filter(site => site.id)
        .map(site => {
          const descriptionParts = [site.site_type, site.location].filter(Boolean)
          const description = descriptionParts.length ? descriptionParts.join(' · ') : site.description || ''

          return {
            ...site,
            id: site.id,
            name: site.site_name || site.name || 'Unnamed Site',
            image: site.site_image || site.image || '/images/housing/site-icon-colored.svg',
            description
          }
        }),
    [siteData]
  )

  useEffect(() => {
    if (!selectedSite) return

    const exists = drawerSites.some(site => site.id === selectedSite.id)
    if (!exists) {
      setSelectedSite(null)
    }
  }, [drawerSites, selectedSite])

  const rows = useMemo(() => STOCK_DATA, [])
  const filteredRows = useMemo(() => {
    if (!selectedSite) {
      return []
    }

    if (!searchValue.trim()) {
      return rows
    }

    const needle = searchValue.trim().toLowerCase()

    return rows.filter(row => {
      const primary = row?.species?.primary?.toLowerCase?.() || ''
      const secondary = row?.species?.secondary?.toLowerCase?.() || ''

      return primary.includes(needle) || secondary.includes(needle)
    })
  }, [rows, searchValue, selectedSite])

  const columns = useMemo(() => createColumns(theme as unknown as Record<string, unknown>), [theme])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchValue('')
  }, [])

  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    if (startDate && endDate) {
      setFilterDates({ startDate, endDate })
    } else {
      setFilterDates({ startDate: '', endDate: '' })
    }
  }, [])

  const handleDownloadReport = useCallback(async () => {
    try {
      setIsDownloading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setIsDownloading(false)
    }
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedSite(null)
    setSearchValue('')
    setFilterDates({ startDate: '', endDate: '' })
  }, [])

  const handleSiteSelect = useCallback((site: SiteItem) => {
    setSelectedSite(site)
    setIsSiteDrawerOpen(false)
  }, [])

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        color: (theme as any).palette.customColors.OnSurfaceVariant
      }}
    >
      Animal Stock Report
    </Typography>
  )

  const headerAction = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={handleDownloadReport} />
      {selectedSite && (
        <Box
          sx={{
            backgroundColor: '#0000000D',
            height: '32px',
            width: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50px'
          }}
        >
          <IconButton onClick={handleClearSelection} size='small'>
            <Icon icon='mdi:close' color='red' fontSize={24} />
          </IconButton>
        </Box>
      )}
    </Box>
  )

  return (
    <>
      <Card>
        <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
        {selectedSite ? (
          <>
            <Box sx={{ p: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  background: '#E8F4F2',
                  p: '16px'
                }}
              >
                <Box sx={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                  <FallbackAvatar
                    src={selectedSite?.image || SPECIES_IMAGE}
                    alt={selectedSite?.name || 'Selected Site'}
                    sx={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 400,
                        letterSpacing: 0,
                        color: (theme as { palette: { customColors: { OnSurfaceVariant: string } } }).palette
                          .customColors.OnSurfaceVariant
                      }}
                    >
                      Site
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        letterSpacing: 0,
                        color: (theme as { palette: { customColors: { OnSurfaceVariant: string } } }).palette
                          .customColors.OnSurfaceVariant
                      }}
                    >
                      {selectedSite?.name}
                    </Typography>
                    {selectedSite?.description && (
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: (theme as any).palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {selectedSite.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 4,
                px: 6,
                pb: 4
              }}
            >
              <Search
                placeholder='Search by species name'
                value={searchValue}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                borderRadius='4px'
                sx={{
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '14px',
                    fontWeight: 400
                  },
                  width: '297px'
                }}
              />

              <CommonDateRangePickers filterDates={filterDates} onChange={handleDateRangeChange} />
            </Box>

            <Box sx={{ p: 5, pt: 0 }}>
              <ReactTable
                rows={filteredRows as any}
                columns={columns as any}
                rowCount={filteredRows.length}
                pagination={false}
                rowHeight={82}
                headerHeight={48}
                subHeaderHeight={32}
                cellStyle={{ padding: '12px 16px' }}
                rowsInView={filteredRows.length}
                paginationModel={{ page: 0, pageSize: filteredRows.length || 1 }}
                tableContainerSx={{ maxHeight: 'unset' }}
                modifyColumnPinning
                sx={{}}
                style={{}}
                tableContainerStyle={{}}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ p: 6 }}>
            <ReportCard
              subtitle='No Site Selected'
              description='Select any site to view its Animal Stock report'
              buttonText='SELECT SITE'
              addHandler={() => setIsSiteDrawerOpen(true)}
            />
          </Box>
        )}
      </Card>

      <SiteDrawer
        open={isSiteDrawerOpen}
        onClose={() => setIsSiteDrawerOpen(false)}
        sites={drawerSites}
        selectedSiteId={selectedSite?.id ?? null}
        onSelect={handleSiteSelect as any}
      />
    </>
  )
}

export default AnimalStockReport
