import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { getSpeciesList } from 'src/lib/api/compliance/exports'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getMastersOrganization } from 'src/lib/api/egg/egg/createAnimal'
import { getAllEnclosures, getAllSections, getAllSites, getAllSpeciesList, getMannerOfDeath } from 'src/lib/api/housing'
import SelectSites from 'src/components/report/SelectSite'
import SelectSectionList from 'src/components/diet/SelectSectionList'
import SelectEnclosureList from 'src/components/diet/SelectEnclosureList'

const MENU = {
  ORGANIZATIONS: 'Organizations',
  LOCATION: 'Site, Sec or Encl.',
  SPECIES: 'Species',
  GENDER: 'Gender',
  AGE: 'Age',
  MORTALITY: 'Mortality'
} as const

type MenuKey = (typeof MENU)[keyof typeof MENU]

const MENU_ORDER: MenuKey[] = [MENU.ORGANIZATIONS, MENU.LOCATION, MENU.SPECIES, MENU.GENDER, MENU.AGE, MENU.MORTALITY]

interface FilterOption {
  label: string
  value: string
  image?: string
}

const GENDER_OPTIONS: FilterOption[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Undetermined', value: 'undetermined' },
  { label: 'Indeterminate', value: 'indeterminate' }
]

const AGE_OPTIONS: FilterOption[] = [
  { label: '0 - 1 year', value: '0-1' },
  { label: '1 - 5 years', value: '1-5' },
  { label: '5 - 10 years', value: '5-10' },
  { label: '10 - 20 years', value: '10-20' },
  { label: '20+ years', value: '20-plus' }
]

const SELECT_ALL_ENABLED = new Set<MenuKey>([
  MENU.ORGANIZATIONS,
  MENU.LOCATION,
  MENU.SPECIES,
  MENU.GENDER,
  MENU.AGE,
  MENU.MORTALITY
])

type SelectedOptions = Record<MenuKey, string[]>
type MenuData = Record<MenuKey, FilterOption[]>

interface LocationSelections {
  Site: (string | number)[]
  Section: (string | number)[]
  Enclosure: (string | number)[]
}

interface LocationCollapsed {
  site: boolean
  section: boolean
  enclosure: boolean
}

interface SiteRecord {
  site_id: string | number
  site_name: string
  [key: string]: unknown
}

interface SectionRecord {
  section_id: string | number
  section_name: string
  [key: string]: unknown
}

interface EnclosureRecord {
  enclosure_id: string | number
  user_enclosure_name: string
  [key: string]: unknown
}

interface RenderLocationCardOptions {
  locked?: boolean
  disabled?: boolean
  onRemove?: (value: string | number) => void
  onClick?: () => void
  collapseKey?: keyof LocationCollapsed
}

interface AnimalFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApplyFilters?: (options: SelectedOptions) => void
  onSubmitLoading?: boolean
  setFilterCount?: (count: number) => void
  initialSelectedOptions?: Partial<SelectedOptions>
}

const areArraysEqual = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && a.every((value, index) => value === b[index])

const normalizeId = (id: unknown): string | number => {
  if (id === undefined || id === null || id === '') return ''
  const parsed = Number(id)
  return Number.isNaN(parsed) ? (id as string) : parsed
}

const parseLocationTokens = (tokens?: string[]) => {
  const sites: (string | number)[] = []
  const sections: (string | number)[] = []
  const enclosures: (string | number)[] = []

  tokens?.forEach(token => {
    if (typeof token !== 'string') return
    const [type, id] = token.split(':')
    if (!id) return

    if (type === 'site') sites.push(normalizeId(id))
    if (type === 'section') sections.push(normalizeId(id))
    if (type === 'enclosure') enclosures.push(normalizeId(id))
  })

  return { sites, sections, enclosures }
}

const buildInitialSelectionState = (initial?: Partial<SelectedOptions>): SelectedOptions => {
  const base = {} as SelectedOptions
  MENU_ORDER.forEach(key => {
    base[key] = initial?.[key] ? [...initial[key]!] : []
  })
  return base
}

const AnimalFilterDrawer = ({
  open,
  onClose,
  onApplyFilters,
  onSubmitLoading,
  setFilterCount,
  initialSelectedOptions
}: AnimalFilterDrawerProps) => {
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>(MENU.ORGANIZATIONS)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState<boolean>(false)
  const [localFilterCount, setLocalFilterCount] = useState<number>(0)

  const [menuData, setMenuData] = useState<MenuData>({
    [MENU.ORGANIZATIONS]: [],
    [MENU.LOCATION]: [],
    [MENU.SPECIES]: [],
    [MENU.GENDER]: GENDER_OPTIONS,
    [MENU.AGE]: AGE_OPTIONS,
    [MENU.MORTALITY]: []
  })

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(() =>
    buildInitialSelectionState(initialSelectedOptions)
  )
  const [locationSelections, setLocationSelections] = useState<LocationSelections>({
    Site: [],
    Section: [],
    Enclosure: []
  })
  const [siteData, setSiteData] = useState<SiteRecord[]>([])
  const [sectionsData, setSectionsData] = useState<SectionRecord[]>([])
  const [enclosuresData, setEnclosuresData] = useState<EnclosureRecord[]>([])
  const [siteDrawerOpen, setSiteDrawerOpen] = useState<boolean>(false)
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState<boolean>(false)
  const [enclosureDrawerOpen, setEnclosureDrawerOpen] = useState<boolean>(false)
  const [locationCollapsed, setLocationCollapsed] = useState<LocationCollapsed>({
    site: true,
    section: true,
    enclosure: true
  })
  const [drawerSearchTerm, setDrawerSearchTerm] = useState<string>('')
  const [selectedSectionsState, setSelectedSectionsState] = useState<(string | number)[]>([])
  const [selectedEnclosuresState, setSelectedEnclosuresState] = useState<(string | number)[]>([])

  const calculateFilterCount = useCallback((options: SelectedOptions) => {
    return MENU_ORDER.reduce((acc, key) => acc + (options?.[key]?.length || 0), 0)
  }, [])

  const updateLocalFilterCount = useCallback(
    (options: SelectedOptions) => {
      setLocalFilterCount(calculateFilterCount(options))
    },
    [calculateFilterCount]
  )

  const syncLocationOptions = useCallback(
    (nextSelections: LocationSelections) => {
      const tokens = [
        ...nextSelections.Site.map(id => `site:${String(id)}`),
        ...nextSelections.Section.map(id => `section:${String(id)}`),
        ...nextSelections.Enclosure.map(id => `enclosure:${String(id)}`)
      ]

      setSelectedOptions(prev => {
        const current = prev[MENU.LOCATION] || []
        if (areArraysEqual(current, tokens)) return prev

        const updated = {
          ...prev,
          [MENU.LOCATION]: tokens
        }
        updateLocalFilterCount(updated)

        return updated
      })
      setSelectedSectionsState(nextSelections.Section)
      setSelectedEnclosuresState(nextSelections.Enclosure)
    },
    [updateLocalFilterCount]
  )

  const updateLocationSelections = useCallback(
    (updater: LocationSelections | ((prev: LocationSelections) => LocationSelections)) => {
      setLocationSelections(prevSelections => {
        const nextSelections = typeof updater === 'function' ? updater(prevSelections) : updater
        syncLocationOptions(nextSelections)
        return nextSelections
      })
    },
    [syncLocationOptions]
  )

  const fetchSites = useCallback(async () => {
    try {
      const res = await getAllSites({ page_no: 1, limit: 100 }) as any
      const sites: any[] = res?.data?.result || []
      setSiteData(
        sites.map((site: any) => ({
          site_id: site?.site_id ?? site?.id,
          site_name: site?.site_name || site?.name || 'Site',
          ...site
        })) as SiteRecord[]
      )
    } catch (error) {
      console.error('Failed to load sites', error)
    }
  }, [])

  const fetchSectionsForSite = useCallback(async (siteId: string | number) => {
    if (!siteId) return
    try {
      const res = await getAllSections({ site_id: siteId as number, page_no: 1, limit: 100 }) as any
      setSectionsData((res?.data?.result || []) as SectionRecord[])
    } catch (error) {
      console.error('Failed to load sections', error)
      setSectionsData([])
    }
  }, [])

  const fetchEnclosuresForSection = useCallback(async (sectionId: string | number) => {
    if (!sectionId) return
    try {
      const res = await getAllEnclosures({ section_id: sectionId as number, page_no: 1, limit: 100 }) as any
      setEnclosuresData((res?.data?.result || []) as unknown as EnclosureRecord[])
    } catch (error) {
      console.error('Failed to load enclosures', error)
      setEnclosuresData([])
    }
  }, [])

  useEffect(() => {
    setSelectedOptions(buildInitialSelectionState(initialSelectedOptions))
  }, [initialSelectedOptions])

  useEffect(() => {
    if (!open) return

    const currentTokens = selectedOptions[MENU.LOCATION] || []
    const parsed = parseLocationTokens(currentTokens)
    const initialLocation: LocationSelections = {
      Site: parsed.sites,
      Section: parsed.sections,
      Enclosure: parsed.enclosures
    }
    setLocationSelections(initialLocation)
    setSelectedSectionsState(parsed.sections)
    setSelectedEnclosuresState(parsed.enclosures)
  }, [open])

  useEffect(() => {
    if (!open) return
    fetchSites()
  }, [open, fetchSites])

  useEffect(() => {
    if (!open) return

    if (locationSelections.Site.length === 1) {
      fetchSectionsForSite(locationSelections.Site[0])
    } else {
      setSectionsData([])
    }
  }, [open, locationSelections.Site, fetchSectionsForSite])

  useEffect(() => {
    if (!open) return

    if (locationSelections.Section.length === 1) {
      fetchEnclosuresForSection(locationSelections.Section[0])
    } else {
      setEnclosuresData([])
    }
  }, [open, locationSelections.Section, fetchEnclosuresForSection])

  const fetchMenuData = useCallback(async (menuName: MenuKey, query = '') => {
    if (menuName === MENU.LOCATION) {
      setSearchLoading(false)
      return
    }

    try {
      setSearchLoading(true)
      let items: FilterOption[] = []

      switch (menuName) {
        case MENU.ORGANIZATIONS: {
          const params = query ? { search: query } : undefined
          const res = await getMastersOrganization(params)
          items = (res || []).map((org: Record<string, unknown>) => ({
            label: (org?.organization_name || org?.name || 'Unnamed organization') as string,
            value: org?.id
              ? String(org.id)
              : org?.organization_id
              ? String(org.organization_id)
              : (org?.name as string)
          }))
          break
        }
        case MENU.SPECIES: {
          const params = query ? { page_no: 1, limit: 50, search: query } : { page_no: 1, limit: 50 }
          const res = await getSpeciesList(params)
          items = (res?.data?.data || []).map((species: Record<string, unknown>) => ({
            label: (species?.common_name ||
              species?.complete_name ||
              species?.scientific_name ||
              'Unknown species') as string,
            value: species?.taxonomy_id ? String(species.taxonomy_id) : (species?.taxonomy_id as string),
            image: species?.default_icon as string
          }))
          break
        }
        case MENU.GENDER: {
          const base = GENDER_OPTIONS
          items = query ? base.filter(option => option.label.toLowerCase().includes(query.toLowerCase())) : base
          break
        }
        case MENU.AGE: {
          const base = AGE_OPTIONS
          items = query ? base.filter(option => option.label.toLowerCase().includes(query.toLowerCase())) : base
          break
        }
        case MENU.MORTALITY: {
          const res = await getMannerOfDeath()
          const rawRes = res as any
          const source = Array.isArray(rawRes?.data) ? rawRes.data : Array.isArray(rawRes) ? rawRes : []
          items = source.map((item: Record<string, unknown>) => ({
            label: (item?.name || 'Mortality Reason') as string,
            value: item?.id ? String(item.id) : (item?.name as string)
          }))
          break
        }
        default:
          items = []
      }

      setMenuData(prev => ({
        ...prev,
        [menuName]: items
      }))
    } catch (error) {
      console.error(`Failed to load ${menuName} options`, error)
      toast.error(`Unable to load ${menuName.toLowerCase()} right now`)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    setSearchQuery('')

    if (selectedMenu === MENU.GENDER) {
      setMenuData(prev => ({ ...prev, [MENU.GENDER]: GENDER_OPTIONS }))
      setSearchLoading(false)
      return
    }

    if (selectedMenu === MENU.AGE) {
      setMenuData(prev => ({ ...prev, [MENU.AGE]: AGE_OPTIONS }))
      setSearchLoading(false)
      return
    }

    fetchMenuData(selectedMenu)
  }, [open, selectedMenu, fetchMenuData])

  const handleClearAll = useCallback(() => {
    const cleared = buildInitialSelectionState({})
    setSelectedOptions(cleared)
    setLocationSelections({ Site: [], Section: [], Enclosure: [] })
    setSelectedSectionsState([])
    setSelectedEnclosuresState([])
    setLocalFilterCount(0)
    setFilterCount?.(0)
    setSectionsData([])
    setEnclosuresData([])
  }, [setFilterCount])

  const debouncedMenuSearch = useMemo(
    () =>
      debounce((menuName: MenuKey, query: string) => {
        fetchMenuData(menuName, query)
      }, 400),
    [fetchMenuData]
  )

  useEffect(() => {
    return () => {
      debouncedMenuSearch.cancel()
    }
  }, [debouncedMenuSearch])

  const handleSearch = useCallback(
    (query: string, menuName: MenuKey) => {
      setSearchQuery(query)

      if (menuName === MENU.GENDER || menuName === MENU.AGE) {
        const source = menuName === MENU.GENDER ? GENDER_OPTIONS : AGE_OPTIONS
        const filtered = query
          ? source.filter(option => option.label.toLowerCase().includes(query.toLowerCase()))
          : source
        setMenuData(prev => ({
          ...prev,
          [menuName]: filtered
        }))

        return
      }

      if (menuName === MENU.LOCATION) return

      debouncedMenuSearch(menuName, query)
    },
    [debouncedMenuSearch]
  )

  const handleMenuClick = useCallback((menuName: MenuKey) => {
    setSelectedMenu(menuName)
    if (menuName === MENU.LOCATION) {
      setLocationCollapsed({ site: true, section: true, enclosure: true })
    }
  }, [])

  const handleCheckbox = useCallback(
    (id: string, menuName: MenuKey) => {
      setSelectedOptions(prev => {
        const current = prev[menuName] || []
        const exists = current.includes(id)
        const next: SelectedOptions = {
          ...prev,
          [menuName]: exists ? current.filter(item => item !== id) : [...current, id]
        }
        updateLocalFilterCount(next)

        return next
      })
    },
    [updateLocalFilterCount]
  )

  const handleSelectAll = useCallback(
    (menuName: MenuKey) => {
      if (!SELECT_ALL_ENABLED.has(menuName)) return

      setSelectedOptions(prev => {
        const allValues = menuData[menuName]?.map(item => item.value) || []
        const current = prev[menuName] || []
        const allSelected = allValues.length > 0 && current.length === allValues.length
        const next: SelectedOptions = {
          ...prev,
          [menuName]: allSelected ? [] : allValues
        }
        updateLocalFilterCount(next)

        return next
      })
    },
    [menuData, updateLocalFilterCount]
  )

  const applyFilters = () => {
    setFilterCount?.(localFilterCount)
    onApplyFilters?.(selectedOptions)
  }

  const isAllSelected = (menuName: MenuKey) => {
    const items = menuData[menuName] || []
    if (!items.length) return false

    return (selectedOptions[menuName] || []).length === items.length
  }

  const getSiteName = (siteId: string | number) =>
    siteData.find(site => String(site.site_id) === String(siteId))?.site_name || 'Site'

  const getSectionName = (sectionId: string | number) =>
    sectionsData.find(section => String(section.section_id) === String(sectionId))?.section_name || 'Section'

  const getEnclosureName = (enclosureId: string | number) =>
    enclosuresData.find(enclosure => String(enclosure.enclosure_id) === String(enclosureId))?.user_enclosure_name ||
    'Enclosure'

  const handleRemoveSite = (siteId: string | number) => {
    updateLocationSelections(prev => ({
      Site: prev.Site.filter(id => id !== siteId),
      Section: [],
      Enclosure: []
    }))
    setSectionsData([])
    setEnclosuresData([])
  }

  const handleRemoveSection = (sectionId: string | number) => {
    updateLocationSelections(prev => ({
      ...prev,
      Section: prev.Section.filter(id => id !== sectionId),
      Enclosure: []
    }))
    setEnclosuresData([])
  }

  const handleRemoveEnclosure = (enclosureId: string | number) => {
    updateLocationSelections(prev => ({
      ...prev,
      Enclosure: prev.Enclosure.filter(id => id !== enclosureId)
    }))
  }

  const handleSiteDrawerSelections = (updated: unknown) => {
    if (!updated || typeof updated !== 'object') return
    const sites = Array.isArray((updated as Record<string, unknown>).Site)
      ? ((updated as Record<string, unknown>).Site as (string | number)[])
      : []

    updateLocationSelections(prev => ({
      Site: sites,
      Section: sites.length === 1 ? prev.Section : [],
      Enclosure: sites.length === 1 ? prev.Enclosure : []
    }))

    if (sites.length === 1) {
      fetchSectionsForSite(sites[0])
    } else {
      setSectionsData([])
      setEnclosuresData([])
    }
  }

  const handleSectionDrawerSelections = (sections: unknown) => {
    const nextSections = Array.isArray(sections) ? (sections as (string | number)[]) : []

    updateLocationSelections(prev => ({
      ...prev,
      Section: nextSections,
      Enclosure: nextSections.length === 1 ? prev.Enclosure : []
    }))

    if (nextSections.length === 1) {
      fetchEnclosuresForSection(nextSections[0])
    } else {
      setEnclosuresData([])
    }
  }

  const handleEnclosureDrawerSelections = (enclosures: unknown) => {
    const nextEnclosures = Array.isArray(enclosures) ? (enclosures as (string | number)[]) : []
    updateLocationSelections(prev => ({ ...prev, Enclosure: nextEnclosures }))
  }

  const renderLocationCard = (
    title: string,
    values: (string | number)[],
    getName: (value: string | number) => string,
    options: RenderLocationCardOptions = {}
  ) => {
    const { locked = false, disabled = false, onRemove, onClick, collapseKey } = options

    return (
      <Card
        sx={{
          width: '100%',
          border: (theme: import('@mui/material').Theme) => `1px solid ${theme.palette.customColors.OutlineVariant}`,
          boxShadow: 'none'
        }}
      >
        <CardHeader
          title={title}
          onClick={disabled || locked ? undefined : onClick}
          sx={{
            cursor: disabled || locked ? 'default' : 'pointer',
            backgroundColor: (theme: import('@mui/material').Theme) =>
              locked
                ? theme.palette.customColors.mdAntzNeutral
                : disabled
                ? theme.palette.customColors.mdAntzNeutral
                : theme.palette.customColors.tableHeaderBg,
            px: 3,
            py: 2,
            '& .MuiCardHeader-title': {
              fontWeight: 500,
              fontSize: 16,
              color: (theme: import('@mui/material').Theme) =>
                locked || disabled ? theme.palette.customColors.OnSurfaceVariant : theme.palette.primary.light
            }
          }}
          action={
            locked ? (
              <Icon icon='mdi:lock' fontSize={20} color='#7C8B9A' />
            ) : (
              <IconButton
                size='small'
                onClick={event => {
                  event.stopPropagation()
                  if (disabled) return
                  if (collapseKey) {
                    setLocationCollapsed(prev => ({
                      ...prev,
                      [collapseKey]: !prev[collapseKey]
                    }))
                  }
                }}
                disabled={disabled}
                sx={{ color: (theme: import('@mui/material').Theme) => theme.palette.customColors.OnSurfaceVariant }}
              >
                <Icon
                  fontSize={20}
                  icon={collapseKey && locationCollapsed[collapseKey] ? 'mdi:chevron-down' : 'mdi:chevron-up'}
                />
              </IconButton>
            )
          }
        />
        {values.length > 0 && (
          <CardContent sx={{ pt: 2, pb: '4px !important' }}>
            {values.map(value => (
              <Box
                key={String(value)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 500 }}>
                  {getName(value)}
                </Typography>
                <IconButton
                  edge='end'
                  onClick={() => onRemove?.(value)}
                  sx={{ color: (theme: import('@mui/material').Theme) => theme.palette.error.dark }}
                  disabled={locked}
                >
                  <Icon icon='carbon:close-outline' fontSize={20} />
                </IconButton>
              </Box>
            ))}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={MENU_ORDER}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {selectedMenu === MENU.ORGANIZATIONS && (
        <FilterContent
          menuName={MENU.ORGANIZATIONS}
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, MENU.ORGANIZATIONS)}
          selectedOptions={selectedOptions[MENU.ORGANIZATIONS]}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll(MENU.ORGANIZATIONS)}
          items={menuData[MENU.ORGANIZATIONS]}
          isAllSelected={isAllSelected(MENU.ORGANIZATIONS)}
          searchLoading={searchLoading}
          placeholder='Search organizations...'
          enableSelectAll
        />
      )}

      {selectedMenu === MENU.LOCATION && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {renderLocationCard('Select Site', locationSelections.Site, getSiteName, {
            locked: locationSelections.Section.length > 0 || locationSelections.Enclosure.length > 0,
            onRemove: handleRemoveSite,
            onClick: () => setSiteDrawerOpen(true),
            collapseKey: 'site'
          })}

          {locationSelections.Site.length === 1 &&
            renderLocationCard('Select Sections', locationSelections.Section, getSectionName, {
              locked: locationSelections.Enclosure.length > 0,
              disabled: locationSelections.Site.length !== 1,
              onRemove: handleRemoveSection,
              onClick: () => setSectionDrawerOpen(true),
              collapseKey: 'section'
            })}

          {locationSelections.Section.length === 1 &&
            renderLocationCard('Select Enclosures', locationSelections.Enclosure, getEnclosureName, {
              locked: false,
              disabled: locationSelections.Section.length !== 1,
              onRemove: handleRemoveEnclosure,
              onClick: () => setEnclosureDrawerOpen(true),
              collapseKey: 'enclosure'
            })}
        </Box>
      )}

      {selectedMenu === MENU.SPECIES && (
        <FilterContent
          menuName={MENU.SPECIES}
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, MENU.SPECIES)}
          selectedOptions={selectedOptions[MENU.SPECIES]}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll(MENU.SPECIES)}
          items={menuData[MENU.SPECIES]}
          isAllSelected={isAllSelected(MENU.SPECIES)}
          searchLoading={searchLoading}
          placeholder='Search species...'
          enableSelectAll
        />
      )}

      {selectedMenu === MENU.GENDER && (
        <FilterContent
          menuName={MENU.GENDER}
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, MENU.GENDER)}
          selectedOptions={selectedOptions[MENU.GENDER]}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll(MENU.GENDER)}
          items={menuData[MENU.GENDER]}
          isAllSelected={isAllSelected(MENU.GENDER)}
          searchLoading={searchLoading}
          placeholder='Search gender...'
          enableSelectAll
        />
      )}

      {selectedMenu === MENU.AGE && (
        <FilterContent
          menuName={MENU.AGE}
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, MENU.AGE)}
          selectedOptions={selectedOptions[MENU.AGE]}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll(MENU.AGE)}
          items={menuData[MENU.AGE]}
          isAllSelected={isAllSelected(MENU.AGE)}
          searchLoading={searchLoading}
          placeholder='Search age ranges...'
          enableSelectAll
        />
      )}

      {selectedMenu === MENU.MORTALITY && (
        <FilterContent
          menuName={MENU.MORTALITY}
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, MENU.MORTALITY)}
          selectedOptions={selectedOptions[MENU.MORTALITY]}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll(MENU.MORTALITY)}
          items={menuData[MENU.MORTALITY]}
          isAllSelected={isAllSelected(MENU.MORTALITY)}
          searchLoading={searchLoading}
          placeholder='Search mortality reasons...'
          enableSelectAll
        />
      )}

      <SelectSites
        openSiteListDrawer={siteDrawerOpen}
        setSiteListDrawer={setSiteDrawerOpen}
        siteData={siteData}
        setSearchTerm={setDrawerSearchTerm}
        searchTerm={drawerSearchTerm}
        tempSelectedItems={locationSelections}
        setTempSelectedItems={handleSiteDrawerSelections}
      />

      <SelectSectionList
        open={sectionDrawerOpen}
        onClose={() => setSectionDrawerOpen(false)}
        siteId={locationSelections.Site[0]}
        onSelectSections={handleSectionDrawerSelections}
        setSectionsData={setSectionsData}
        sectionsData={sectionsData}
        setSelectedSections={setSelectedSectionsState}
        selectedSections={selectedSectionsState}
        tempSelectedItems={locationSelections}
        openFilterDrawer={open}
      />

      <SelectEnclosureList
        open={enclosureDrawerOpen}
        onClose={() => setEnclosureDrawerOpen(false)}
        sectionId={locationSelections.Section[0]}
        onSelectEnclosures={handleEnclosureDrawerSelections}
        enclosuresData={enclosuresData}
        setEnclosuresData={setEnclosuresData}
        setSelectedEnclosures={setSelectedEnclosuresState}
        selectedEnclosures={selectedEnclosuresState}
        tempSelectedItems={locationSelections}
        openFilterDrawer={open}
      />
    </CustomFilterDrawer>
  )
}

export default AnimalFilterDrawer
