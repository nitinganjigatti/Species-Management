import React, { useEffect, useMemo, useState } from 'react'
import { Box, Checkbox, CircularProgress, Divider, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import { getAnimalMaster } from 'src/lib/api/egg/egg/createAnimal'
import { getAllSites } from 'src/lib/api/housing/site'

// ============== Types =================

export interface AssessmentFilters {
  siteIds: number[]
  genders: string[]
  lifeStageIds: number[]
}

interface AssessmentFilterDrawerProps {
  open: boolean
  onClose: () => void
  initialFilters: AssessmentFilters
  onApply: (filters: AssessmentFilters) => void
}

// Internal shape mirrors the PopulationFilterDrawer convention:
// - keys match the menu list (FILTER_MENUS) so CustomFilterDrawer can read badge counts directly
// - values are arrays of stringified IDs / values (uniform type for the shell)
type SelectedOptions = Record<'Site' | 'Gender' | 'Life Stage', string[]>

const FILTER_MENUS: Array<keyof SelectedOptions> = ['Site', 'Gender', 'Life Stage']

const EMPTY_OPTIONS: SelectedOptions = { Site: [], Gender: [], 'Life Stage': [] }

// Standard sex values — same canonical set used in PopulationFilterDrawer.
const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'undetermined', label: 'Undetermined' },
  { value: 'indeterminate', label: 'Indeterminate' }
]

// ============== Component =================

const AssessmentFilterDrawer: React.FC<AssessmentFilterDrawerProps> = ({
  open,
  onClose,
  initialFilters,
  onApply
}) => {
  const theme = useTheme() as any

  const [selectedMenu, setSelectedMenu] = useState<keyof SelectedOptions>(FILTER_MENUS[0])
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({ ...EMPTY_OPTIONS })

  // Reset on open — seed from URL-derived initialFilters every time the drawer opens.
  useEffect(() => {
    if (!open) return
    setSelectedOptions({
      Site: initialFilters.siteIds.map(String),
      Gender: [...initialFilters.genders],
      'Life Stage': initialFilters.lifeStageIds.map(String)
    })
    setSelectedMenu(FILTER_MENUS[0])
  }, [open, initialFilters])

  // ===== Data sources =====

  const sitesQuery = useQuery({
    queryKey: ['filter-sites'],
    queryFn: () => getAllSites(),
    enabled: open,
    staleTime: 5 * 60 * 1000
  })

  const masterQuery = useQuery({
    queryKey: ['filter-animal-master'],
    queryFn: () => getAnimalMaster(),
    enabled: open,
    staleTime: 5 * 60 * 1000
  })

  const sites = useMemo(() => {
    const d: any = sitesQuery.data
    const list = (d?.data?.result ?? d?.data ?? d?.result ?? []) as any[]

    return Array.isArray(list)
      ? list.map(s => ({ value: String(s.site_id ?? s.id), label: String(s.site_name ?? s.name ?? '') }))
      : []
  }, [sitesQuery.data])

  const lifeStages = useMemo(() => {
    const d: any = masterQuery.data
    const list = (d?.data?.life_stage ?? d?.life_stage ?? []) as any[]

    return Array.isArray(list)
      ? list.map(s => ({ value: String(s.id), label: String(s.name ?? '') }))
      : []
  }, [masterQuery.data])

  // ===== Per-menu metadata (data + loading) =====

  const optionsByMenu: Record<keyof SelectedOptions, Array<{ value: string; label: string }>> = {
    Site: sites,
    Gender: GENDER_OPTIONS,
    'Life Stage': lifeStages
  }

  const loadingByMenu: Record<keyof SelectedOptions, boolean> = {
    Site: sitesQuery.isLoading,
    Gender: false,
    'Life Stage': masterQuery.isLoading
  }

  // ===== Toggling =====

  const toggleValue = (menu: keyof SelectedOptions, value: string) => {
    setSelectedOptions(prev => {
      const current = prev[menu]
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]

      return { ...prev, [menu]: next }
    })
  }

  const toggleSelectAll = (menu: keyof SelectedOptions) => {
    const allValues = optionsByMenu[menu].map(o => o.value)
    setSelectedOptions(prev => {
      const current = prev[menu]
      const allSelected = allValues.length > 0 && allValues.every(v => current.includes(v))
      const next = allSelected
        ? current.filter(v => !allValues.includes(v))
        : [...new Set([...current, ...allValues])]

      return { ...prev, [menu]: next }
    })
  }

  // ===== Apply / Clear =====

  const totalCount =
    selectedOptions.Site.length + selectedOptions.Gender.length + selectedOptions['Life Stage'].length

  const handleApply = () => {
    onApply({
      siteIds: selectedOptions.Site.map(Number).filter(n => Number.isFinite(n)),
      genders: [...selectedOptions.Gender],
      lifeStageIds: selectedOptions['Life Stage'].map(Number).filter(n => Number.isFinite(n))
    })
    onClose()
  }

  const handleClearAll = () => {
    setSelectedOptions({ ...EMPTY_OPTIONS })
  }

  // ===== Right-pane checkbox list (mirrors PopulationFilterDrawer.renderCheckboxFilter) =====

  const renderCheckboxFilter = (menu: keyof SelectedOptions) => {
    const items = optionsByMenu[menu]
    const current = selectedOptions[menu]
    const allValues = items.map(i => i.value)
    const allSelected = allValues.length > 0 && allValues.every(v => current.includes(v))
    const isLoading = loadingByMenu[menu]

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {/* Select All */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={current.length > 0 && !allSelected}
              onChange={() => toggleSelectAll(menu)}
              disabled={isLoading || items.length === 0}
            />
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.Outline }}>Select All</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Options */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : items.length === 0 ? (
            <Typography
              sx={{ fontSize: '14px', color: theme.palette.customColors.Outline, textAlign: 'center', py: 4 }}
            >
              No options found
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
              {items.map(item => (
                <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={current.includes(item.value)}
                    onChange={() => toggleValue(menu, item.value)}
                  />
                  <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  const filterTitle = totalCount > 0 ? `Filter - ${totalCount}` : 'Filter'

  // CustomFilterDrawer reads `selectedOptions[menuName].length` for badge counts on the left nav.
  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      title={filterTitle}
      onApply={handleApply as any}
      onClearAll={handleClearAll as any}
      filterLists={FILTER_MENUS as any}
      selectedOptions={selectedOptions as any}
      selectedItem={selectedMenu as any}
      onSelectItem={(item: any) => setSelectedMenu(item as keyof SelectedOptions)}
    >
      {renderCheckboxFilter(selectedMenu)}
    </CustomFilterDrawer>
  )
}

export default AssessmentFilterDrawer
