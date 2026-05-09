import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, CircularProgress, IconButton, Tooltip, Typography, Skeleton } from '@mui/material'
import { useRouter } from 'next/router'
import debounce from 'lodash/debounce'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { AuthContext } from 'src/context/AuthContext'
import { getEnclosureCountRegister } from 'src/lib/api/compliance/reports'
import { downloadPDF } from 'src/utility'
import SiteDrawer from 'src/views/pages/compliance/reports/enclosureCountRegister/SiteDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import StickyTableBase from 'src/views/table/sticky-table'
const StickyTable = StickyTableBase as any
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { GridColDef } from '@mui/x-data-grid'

interface SiteData {
  site_id: string
  site_name: string
  [key: string]: unknown
}

interface SelectedItemsState {
  Site: string[]
  Section: string[]
  Enclosure: string[]
  reportType: string
}

interface RegisterStats {
  site_name?: string | string[]
  section_name?: string
  enclosure_name?: string | string[]
  total_sections?: number
  total_enclosures?: number
  total_count?: number
  [key: string]: unknown
}

type EmotionTheme = {
  palette: {
    customColors: Record<string, string>
    primary: { main: string }
  }
}

const EnclosureCountRegister = () => {
  const theme = useTheme() as EmotionTheme
  const router = useRouter()
  const authData = useContext(AuthContext)

  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null)
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [indexedRows, setIndexedRows] = useState<Record<string, unknown>[]>([])
  const [searchValue, setSearchValue] = useState<string>((router.query.q as string) || '')
  const [searchInput, setSearchInput] = useState<string>((router.query.q as string) || '')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [siteLoader, setSiteLoader] = useState<boolean>(false)
  const [enclosuresData, setEnclosuresData] = useState<Record<string, unknown>[]>([])
  const [selectedEnclosures, setSelectedEnclosures] = useState<string[]>([])
  const [siteSummaryLabel, setSiteSummaryLabel] = useState<string>('-')
  const [siteExtraCount, setSiteExtraCount] = useState<number | null>(null)
  const [siteExtraNames, setSiteExtraNames] = useState<string[]>([])
  const [enclosureSummaryLabel, setEnclosureSummaryLabel] = useState<string>('-')
  const [enclosureExtraCount, setEnclosureExtraCount] = useState<number | null>(null)
  const [enclosureExtraNames, setEnclosureExtraNames] = useState<string[]>([])

  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const tabsForfilter = ['Site', 'Report Type']
  const [activeTab, setActiveTab] = useState<string>('Site')
  const [openSiteListDrawer, setSiteListDrawer] = useState<boolean>(false)

  const [siteData, setSiteData] = useState<SiteData[]>([])
  const [sectionsData, setSectionsData] = useState<Record<string, unknown>[]>([])
  const [selectedSections, setSelectedSections] = useState<string[]>([])

  const initialSelectedItems: SelectedItemsState = {
    Site: [],
    Section: [],
    Enclosure: [],
    reportType: ''
  }
  const [selectedItems, setSelectedItems] = useState<SelectedItemsState>(initialSelectedItems)
  const [tempSelectedItems, setTempSelectedItems] = useState<SelectedItemsState>(initialSelectedItems)
  const [filterCount, setFilterCount] = useState<number>(0)

  const [showDetailsPopUp, setShowDetailsPopUp] = useState<boolean>(false)
  const [animalDetailsData, setAnimalDetailsData] = useState<Record<string, unknown>>({})
  const [registerStats, setRegisterStats] = useState<RegisterStats | null>(null)

  //////////////////////////////////////////////////////////////
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const searchRef = useRef<HTMLInputElement | null>(null)

  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: parseInt(router.query.page as string) || 0,
    pageSize: parseInt(router.query.limit as string) || 50
  })

  const prevStatKeyRef = useRef<{ siteKey: string; type: string; sectionKey: string; enclosureKey: string }>({
    siteKey: '',
    type: '',
    sectionKey: '',
    enclosureKey: ''
  })
  const lastFetchKeyRef = useRef<string>('')
  // ----- derived keys -----
  const siteIdsArr = (
    selectedItems?.Site?.length
      ? selectedItems.Site
      : selectedSite?.site_id || router.query.site_id
      ? [String(selectedSite?.site_id || router.query.site_id)]
      : []
  ).map(String)
  const siteKey = siteIdsArr.join(',')
  const typeKey =
    selectedItems?.reportType === 'individual' ? 'individual' : selectedItems?.reportType ? 'species-wise' : ''
  const sectionKey = (selectedItems?.Section || []).join(',')
  const enclosureKey = (selectedItems?.Enclosure || []).join(',')

  const fetchKey = [
    siteKey,
    typeKey,
    sectionKey,
    enclosureKey,
    searchValue,
    paginationModel?.page,
    paginationModel?.pageSize
  ].join('|')

  const reportCardEventHandler = () => {
    setOpenFilterDrawer(!openFilterDrawer)
  }

  const siteList = useCallback(
    async (q = '') => {
      try {
        const sites = (authData as any)?.userData?.user?.zoos?.[0]?.sites || []
        const filteredSites = q
          ? sites.filter((site: Record<string, unknown>) =>
              (site.site_name as string).toLowerCase().includes(q.toLowerCase())
            )
          : sites

        setSiteData(
          filteredSites.map((site: Record<string, unknown>) => ({
            site_id: String(site.id ?? site.site_id ?? ''), // <- robust
            site_name: site.site_name,
            ...site
          }))
        )
      } catch (e) {
        console.error('Error processing site list:', e)
      }
    },
    [(authData as any)?.userData?.user?.zoos]
  )

  useEffect(() => {
    if (openFilterDrawer) siteList()
  }, [openFilterDrawer, siteList])

  // Sync selected site from filter drawer selections
  useEffect(() => {
    if (selectedItems?.Site?.length > 0 && siteData?.length > 0) {
      const siteId = selectedItems.Site[0]
      const site = siteData.find(s => String(s.site_id) === String(siteId))
      if (site) setSelectedSite(site)
    }
  }, [selectedItems?.Site, siteData])

  useEffect(() => {
    setSelectedEnclosures(selectedItems?.Enclosure || [])
  }, [selectedItems?.Enclosure])

  // Fetch list data — ensure single call when generating
  useEffect(() => {
    if (!siteKey || !typeKey) return
    if (fetchKey === lastFetchKeyRef.current) return
    lastFetchKeyRef.current = fetchKey

    const params: Record<string, unknown> = {
      site_id: siteKey,
      type: typeKey,
      q: searchValue || '',
      page: (paginationModel?.page || 0) + 1,
      limit: paginationModel?.pageSize || 50,
      response_type: 'json'
    }
    if (sectionKey) params.section_id = sectionKey
    if (enclosureKey) params.enclosure_id = enclosureKey

    let canceled = false
    const statKeyChanged =
      prevStatKeyRef.current.siteKey !== siteKey ||
      prevStatKeyRef.current.type !== typeKey ||
      prevStatKeyRef.current.sectionKey !== sectionKey ||
      prevStatKeyRef.current.enclosureKey !== enclosureKey

    if (statKeyChanged) {
      setRegisterStats(null)
    }
    ;(async () => {
      try {
        setLoading(true)
        const res = await getEnclosureCountRegister(params) as any
        if (canceled) return
        if (res?.success) {
          const animals = res?.data?.animals || res?.data?.records || []
          const rows = animals.map((item: Record<string, unknown>, idx: number) => {
            if (selectedItems?.reportType === 'individual') {
              return {
                id: item.animal_id || idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
                sl_no: idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
                animal_id: item.animal_id || null,
                common_name: item['Common Name'] || item.common_name || '',
                scientific_name: item['Scientific Name'] || item.scientific_name || '',
                default_icon: item.default_icon || '',
                enclosureName: item.user_enclosure_name || '',
                user_enclosure_name: item.user_enclosure_name || '',
                breed_name: item.breed_name || '',
                morph_name: item.morph_name || '',
                type: item.type || '',
                sex: item.sex || '-',
                primary_identifier_type: item.primary_identifier_type || null,
                primary_identifier_value: item.primary_identifier_value || null,
                // Map to AnimalCard expected keys
                local_identifier_name: item.primary_identifier_type || null,
                local_identifier_value: item.primary_identifier_value || null,
                total_animal: Number(item.total_animal || 0)
              }
            }

            // species-wise mapping
            return {
              id: idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
              sl_no: idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
              common_name: item['Common Name'] || item.common_name || '',
              scientific_name: item['Scientific Name'] || item.scientific_name || '',
              default_icon: item.default_icon,
              enclosureName: item.user_enclosure_name || '',
              user_enclosure_name: item.user_enclosure_name || '',
              male: Number(item.male_count || 0),

              female: Number(item.female_count || 0),
              others: Number(item.other_count || 0),
              total: Number(item.total_count || 0),
              primary_identifier_type: item.primary_identifier_type || null,
              primary_identifier_value: item.primary_identifier_value || null,
              local_identifier_name: item.primary_identifier_type || null,
              local_identifier_value: item.primary_identifier_value || null
            }
          })
          setIndexedRows(rows)
          setTotal(Number(res?.data?.stats?.total_count || res?.data?.total || 0))
          if (statKeyChanged) {
            setRegisterStats(res?.data?.stats || null)
            prevStatKeyRef.current = { siteKey, type: typeKey, sectionKey, enclosureKey }
          }
        } else {
          setIndexedRows([])
          setTotal(0)
          if (statKeyChanged) {
            setRegisterStats(null)
            prevStatKeyRef.current = { siteKey, type: typeKey, sectionKey, enclosureKey }
          }
        }
      } catch (err) {
        if (!canceled) {
          console.error('Error fetching Enclosure Count Register:', err)
          setIndexedRows([])
          setTotal(0)
          if (statKeyChanged) setRegisterStats(null)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    })()

    return () => {
      canceled = true
    }
  }, [fetchKey])

  const pageTitle = !registerStats
    ? 'Enclosure Count Register'
    : selectedItems?.reportType === 'individual'
    ? 'Animal count register'
    : 'Species-wise animal count register'

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      {pageTitle}
    </Typography>
  )

  const specieColumn: GridColDef[] = [
    {
      minWidth: 250,
      width: 300,
      field: 'speciesName',
      headerName: 'SPECIES NAME',
      sortable: false,
      renderCell: params => <SpeciesCard species={params.row} />
    },
    {
      minWidth: 200,
      width: 250,
      field: 'enclosureName',
      headerName: 'ENCLOSURE NAME',
      sortable: false,
      renderCell: params => (
        <Tooltip
          title={params.row.enclosureName}
          placement='top-start'
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 2] }
                }
              ]
            }
          }}
        >
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.enclosureName}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'male',
      headerName: 'MALE',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip
          title={params.row.male}
          placement='top-start'
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 2] }
                }
              ]
            }
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.male}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'female',
      headerName: 'FEMALE',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip
          title={params.row.female}
          placement='top-start'
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 2] }
                }
              ]
            }
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.female}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'others',
      headerName: 'OTHERS',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip
          title={params.row.others}
          placement='top-start'
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 2] }
                }
              ]
            }
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.others}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'total',
      headerName: 'TOTAL',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip
          title={params.row.total}
          placement='top-start'
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 2] }
                }
              ]
            }
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.total}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const individualColumns: GridColDef[] = [
    {
      width: 320,
      field: 'animal_name',
      headerName: 'ANIMAL NAME',
      sortable: false,
      renderCell: params => (
        <Box sx={{ py: 2 }}>
          <AnimalCard data={params.row} size='14px' />
        </Box>
      )
    },
    {
      width: 200,
      field: 'enclosureName',
      headerName: 'ENCLOSURE NAME',
      sortable: false,
      renderCell: params => (
        <Tooltip
          title={params.row.enclosureName}
          placement='top-start'
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 2] }
                }
              ]
            }
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 400,
              letterSpacing: 0,
              fontFamily: 'Inter',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.enclosureName}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      field: 'gender',
      headerName: 'GENDER',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Tooltip
          title={params.row.gender || params.row.sex}
          placement='top-start'
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 2] }
                }
              ]
            }
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500,
              letterSpacing: 0,
              fontFamily: 'Inter',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.gender || params.row.sex}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const downloadEnclosureCountRegister = async () => {
    const siteIdsDownload = (selectedItems?.Site?.length ? selectedItems.Site : []).map(String)
    if (!siteIdsDownload.length && (selectedSite?.site_id || router.query.site_id)) {
      siteIdsDownload.push(String(selectedSite?.site_id || router.query.site_id))
    }
    if (!siteIdsDownload.length || !selectedItems?.reportType) return

    const params: Record<string, unknown> = {
      site_id: siteIdsDownload.join(','),
      type: selectedItems?.reportType === 'individual' ? 'individual' : 'species-wise',
      q: searchValue || '',
      page: (paginationModel?.page || 0) + 1,
      limit: paginationModel?.pageSize || 50,
      response_type: 'pdf'
    }
    if (selectedItems?.Section?.length > 0) params.section_id = selectedItems.Section.join(',')
    if (selectedItems?.Enclosure?.length > 0) params.enclosure_id = selectedItems.Enclosure.join(',')

    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getEnclosureCountRegister,
        params,
        fileName: `enclosure_count_register_${
          selectedItems?.reportType === 'individual' ? 'individual' : 'species'
        }_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Reset all user selections and restore initial state (before any site selection)
  const clearUserSelection = () => {
    // Clear selected site and related stats/data
    setSelectedSite(null)
    setRegisterStats(null)
    setIndexedRows([])
    setTotal(0)

    // Clear filters and temporary selections
    setSelectedSections([])
    setSelectedEnclosures([])
    setEnclosuresData([])
    setSelectedItems({ Site: [], Section: [], Enclosure: [], reportType: '' })
    setTempSelectedItems({ Site: [], Section: [], Enclosure: [], reportType: '' })
    setSiteSummaryLabel('-')
    setSiteExtraCount(null)
    setSiteExtraNames([])
    setEnclosureSummaryLabel('-')
    setEnclosureExtraCount(null)
    setEnclosureExtraNames([])

    // Reset search and pagination
    setSearchValue('')
    setSearchInput('')
    setPaginationModel({ page: 0, pageSize: 50 })

    // Remove site/section params from URL
    const { site_id, section_id, enclosure_id, ...rest } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: rest
      },
      undefined,
      { shallow: false }
    )
  }

  useEffect(() => {
    const names = registerStats?.site_name
    const list = Array.isArray(names) ? names.filter(Boolean) : names ? [names] : []

    if (!list.length) {
      setSiteSummaryLabel('-')
      setSiteExtraCount(null)
      setSiteExtraNames([])
      return
    }

    const visibleList = list.slice(0, 4)
    const extras = list.slice(4)

    setSiteSummaryLabel(visibleList.join(', '))
    setSiteExtraNames(extras)
    setSiteExtraCount(extras.length > 0 ? extras.length : null)
  }, [registerStats?.site_name])

  useEffect(() => {
    const names = registerStats?.enclosure_name
    const list = Array.isArray(names) ? names.filter(Boolean) : names ? [names] : []

    if (!list.length) {
      setEnclosureSummaryLabel('-')
      setEnclosureExtraCount(null)
      setEnclosureExtraNames([])
      return
    }

    const visibleList = list.slice(0, 4)
    const extras = list.slice(4)

    setEnclosureSummaryLabel(visibleList.join(', '))
    setEnclosureExtraNames(extras)
    setEnclosureExtraCount(extras.length > 0 ? extras.length : null)
  }, [registerStats?.enclosure_name])

  const siteNamesList = Array.isArray(registerStats?.site_name)
    ? (registerStats!.site_name as string[]).filter(Boolean)
    : registerStats?.site_name
    ? [registerStats.site_name as string]
    : []
  const siteLabelPrefix = siteNamesList.length > 1 ? 'Sites' : 'Site'

  const enclosureNamesList = Array.isArray(registerStats?.enclosure_name)
    ? (registerStats!.enclosure_name as string[]).filter(Boolean)
    : registerStats?.enclosure_name
    ? [registerStats.enclosure_name as string]
    : []
  const hasEnclosureNames = enclosureNamesList.length > 0
  const enclosureLabelPrefix = enclosureNamesList.length > 1 ? 'Enclosures' : 'Enclosure'

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      <DownloadReport
        isDownloading={isDownloading}
        handleDownloadReport={downloadEnclosureCountRegister}
        containerStyles={loading || isDownloading ? { pointerEvents: 'none', opacity: 0.5 } : {}}
      />
      <Box
        sx={{
          backgroundColor: theme.palette.customColors.mdAntzNeutral,
          height: '32px',
          width: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50px'
        }}
      >
        <IconButton onClick={clearUserSelection} disabled={loading || isDownloading}>
          <Icon icon='mdi:close' color='red' fontSize={24} />
        </IconButton>
      </Box>
    </Box>
  )

  // Debounced apply of search to trigger API
  const applySearchDebounced = useCallback(
    debounce((val: string) => {
      setSearchValue(val)
      // Reset page after settling search
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }, 600),
    []
  )

  useEffect(() => {
    return () => {
      applySearchDebounced.cancel()
    }
  }, [applySearchDebounced])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    applySearchDebounced(value)
  }

  return (
    <>
      {selectedSite ? (
        <>
          <Card sx={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CardHeader title={title} action={headerAction} sx={{ p: 0 }} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: { sm: 'row', xs: 'column' },
                justifyContent: { sm: 'space-between', xs: 'flex-start' },
                alignItems: 'center',
                gap: 4
              }}
            >
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Search
                  onChange={handleSearchChange}
                  onClear={() => {
                    setSearchInput('')
                    setSearchValue('')
                    setPaginationModel(prev => ({ ...prev, page: 0 }))
                  }}
                  placeholder='Search by Species name'
                  value={searchInput}
                  // disabled={loading}
                  width={297}
                  borderRadius='4px'
                  inputStyle={{ padding: '10px 12px' }}
                  textFielsSX={{
                    height: '40px',
                    '& fieldset': { borderColor: theme.palette.customColors.OutlineVariant },
                    '&:hover fieldset': { borderColor: theme.palette.customColors.OutlineVariant },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.customColors.OutlineVariant }
                  }}
                  sx={{
                    gap: '4px',
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '14px',
                      fontWeight: 400
                    }
                  }}
                />
              </Box>
            </Box>
            <Box
              sx={{
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backgroundColor: theme.palette.customColors.displaybgPrimary
              }}
            >
              {loading || !registerStats ? (
                <>
                  <Skeleton variant='text' width={220} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant='text' width={180} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant='text' width={220} height={24} sx={{ borderRadius: 1 }} />
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 400,
                      letterSpacing: 0,
                      fontFamily: 'Inter'
                    }}
                  >
                    {siteLabelPrefix}: <span style={{ fontWeight: 500 }}>{siteSummaryLabel}</span>
                    {siteExtraCount !== null && siteExtraNames.length > 0 && (
                      <Tooltip title={siteExtraNames.join(', ')} arrow placement='top'>
                        <Typography
                          sx={{
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 16,
                            color: theme.palette.primary.main,
                            display: 'inline'
                          }}
                          component='span'
                        >
                          {' '}
                          +{siteExtraCount}
                        </Typography>
                      </Tooltip>
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 400,
                      letterSpacing: 0,
                      fontFamily: 'Inter'
                    }}
                  >
                    {registerStats?.section_name ? 'Section' : 'Total Section Count'}:{' '}
                    <span style={{ fontWeight: 500 }}>
                      {registerStats?.section_name || registerStats?.total_sections || '-'}
                    </span>
                  </Typography>
                  {hasEnclosureNames ? (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 400,
                        letterSpacing: 0,
                        fontFamily: 'Inter'
                      }}
                    >
                      {enclosureLabelPrefix}: <span style={{ fontWeight: 500 }}>{enclosureSummaryLabel}</span>
                      {enclosureExtraCount !== null && enclosureExtraNames.length > 0 && (
                        <Tooltip title={enclosureExtraNames.join(', ')} arrow placement='top'>
                          <Typography
                            component='span'
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: 16,
                              color: theme.palette.primary.main,
                              display: 'inline'
                            }}
                          >
                            {' '}
                            +{enclosureExtraCount}
                          </Typography>
                        </Tooltip>
                      )}
                    </Typography>
                  ) : (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 400,
                        letterSpacing: 0,
                        fontFamily: 'Inter'
                      }}
                    >
                      Total Enclosure Count:{' '}
                      <span style={{ fontWeight: 500 }}>{registerStats?.total_enclosures || '-'}</span>
                    </Typography>
                  )}
                </>
              )}
            </Box>
            <StickyTable
              columns={(selectedItems?.reportType === 'individual' ? individualColumns : specieColumn) as any}
              rows={indexedRows as any}
              loading={loading}
              rowCount={total}
              rowHeight={72}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              searchValue={searchValue}
              onPaginationModelChange={((model: any) => {
                setPaginationModel(model)
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    page: model.page + 1,
                    pageSize: model.pageSize,
                    searchValue
                  }
                })
              }) as any}
              sx={{}}
              style={{}}
              tableContainerStyle={{}}
            />
          </Card>
        </>
      ) : siteLoader ? (
        <Box display='flex' justifyContent='center' alignItems='center'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card sx={{ p: 6 }}>
            <CardHeader title={title} sx={{ p: 0, pb: 4 }} />
            <ReportCard
              subtitle='No Site selected'
              description='Select any Site to view its report'
              buttonText='SELECT SITE & REPORT TYPE'
              addHandler={reportCardEventHandler}
            />
          </Card>
        </>
      )}

      {openFilterDrawer && (
        <SiteDrawer
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openFilterDrawer={openFilterDrawer}
          setOpenFilterDrawer={setOpenFilterDrawer}
          tabsForfilter={tabsForfilter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setFilterCount={setFilterCount}
          openSiteListDrawer={openSiteListDrawer}
          setSiteListDrawer={setSiteListDrawer}
          selectedSections={selectedSections as any}
          setSelectedSections={setSelectedSections as any}
          siteData={siteData}
          selectedItems={selectedItems as any}
          setSelectedItems={setSelectedItems as any}
          tempSelectedItems={tempSelectedItems as any}
          setTempSelectedItems={setTempSelectedItems as any}
          sectionsData={sectionsData as any}
          setSectionsData={setSectionsData as any}
          selectedEnclosures={selectedEnclosures as any}
          setSelectedEnclosures={setSelectedEnclosures as any}
          enclosuresData={enclosuresData as any}
          setEnclosuresData={setEnclosuresData as any}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(EnclosureCountRegister, 'compliance_module')
