import React, { FC, memo, useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getMannerOfDeath } from 'src/lib/api/necropsy'
import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'
import Toaster from 'src/components/Toaster'
import { SelectOption } from 'src/types/necropsy'

type MenuName = 'Manner of Death' | 'Organization' | 'Sex'

interface SelectedOptions {
  'Manner of Death': (string | number)[]
  Organization: (string | number)[]
  Sex: (string | number)[]
}

interface MenuData {
  'Manner of Death': SelectOption[]
  Organization: SelectOption[]
  Sex: SelectOption[]
}

interface SpeciesAnimalFilterDrawerProps {
  open: boolean
  onClose: () => void
  onSubmitLoading?: boolean
  onApplyFilters: (selectedOptions: SelectedOptions) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: Partial<SelectedOptions>
}

const leftMenu: MenuName[] = ['Manner of Death', 'Organization', 'Sex']

const getInitialOptions = (): SelectedOptions => ({
  'Manner of Death': [],
  Organization: [],
  Sex: []
})

const staticMenuData: Partial<MenuData> = {
  Sex: [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Indeterminate', value: 'indeterminate' },
    { label: 'Undetermined', value: 'undetermined' }
  ]
}

const SpeciesAnimalFilterDrawer: FC<SpeciesAnimalFilterDrawerProps> = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const [selectedMenu, setSelectedMenu] = useState<MenuName>('Manner of Death')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState<boolean>(false)
  const [localFilterCount, setLocalFilterCount] = useState<number>(0)

  const [menuData, setMenuData] = useState<MenuData>({
    'Manner of Death': [],
    Organization: [],
    ...staticMenuData
  } as MenuData)

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(getInitialOptions())

  const fetchMenuData = useCallback(async (menuName: MenuName, query: string = '') => {
    if (staticMenuData[menuName]) return

    try {
      setSearchLoading(true)
      let data: SelectOption[] = []

      if (menuName === 'Manner of Death') {
        const res = await getMannerOfDeath()
        data =
          res?.data && res.data.length > 0
            ? res.data.map((item: { name?: string; id?: string | number }) => ({
                label: item?.name || '',
                value: item?.id || 0
              }))
            : []
      } else if (menuName === 'Organization') {
        const res = await getOrganizationList({ params: { q: query } })
        data =
          res?.length > 0
            ? res.map((item: { organization_name?: string; name?: string; id?: number }) => ({
                label: item?.organization_name || item?.name || '',
                value: item?.id || 0
              }))
            : []
      }

      setMenuData(prev => ({
        ...prev,
        [menuName]: data
      }))
    } catch (error) {
      console.error(`Error ${query ? 'searching' : 'fetching'} ${menuName}:`, error)
      Toaster({
        type: 'error',
        message: `Failed to ${query ? 'search' : 'load'} ${menuName} options`
      })
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedOptions(getInitialOptions())
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  const debouncedMenuSearch = useCallback(
    debounce(async (menuName: MenuName, query: string) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [fetchMenuData]
  )

  const handleSearch = useCallback(
    (query: string, menuName: MenuName) => {
      setSearchQuery(query)
      if (menuName === 'Organization') {
        debouncedMenuSearch(menuName, query)
      }
    },
    [debouncedMenuSearch]
  )

  const handleFilterDrawerOpen = async (): Promise<void> => {
    setSearchQuery('')
    fetchMenuData(selectedMenu)
  }

  const handleMenuClick = useCallback(
    async (menuName: MenuName) => {
      setSelectedMenu(menuName)
      setSearchQuery('')
      await fetchMenuData(menuName, '')
    },
    [fetchMenuData]
  )

  const handleCheckbox = useCallback((id: string | number, menuName: MenuName) => {
    setSelectedOptions(prevOptions => {
      let newOptions: SelectedOptions

      if (menuName === 'Organization') {
        const isSelected = prevOptions[menuName]?.includes(id)
        newOptions = {
          ...prevOptions,
          [menuName]: isSelected ? [] : [id]
        }
      } else {
        const isSelected = prevOptions[menuName]?.includes(id)
        newOptions = {
          ...prevOptions,
          [menuName]: isSelected
            ? prevOptions[menuName].filter(item => item !== id)
            : [...(prevOptions[menuName] || []), id]
        }
      }

      const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
      setLocalFilterCount(count)

      return newOptions
    })
  }, [])

  const handleSelectAll = useCallback(
    (menuName: MenuName) => {
      if (menuName === 'Organization') return

      setSelectedOptions(prevOptions => {
        const allIds = menuData[menuName]?.map(item => item.value) || []
        const isAllSelected = allIds.every(id => prevOptions[menuName]?.includes(id))

        const newOptions: SelectedOptions = {
          ...prevOptions,
          [menuName]: isAllSelected ? [] : allIds
        }

        const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
        setLocalFilterCount(count)

        return newOptions
      })
    },
    [menuData]
  )

  const applyFilters = (): void => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
  }

  useEffect(() => {
    if (open) {
      handleFilterDrawerOpen()
    }
    if (initialSelectedOptions) {
      setSelectedOptions(prev => ({ ...prev, ...initialSelectedOptions }))
    }
  }, [open])

  const isAllSelected = (menuName: MenuName): boolean => {
    if (menuName === 'Organization') return false
    const allIds = menuData[menuName]?.map(item => item.value) || []

    return allIds.length > 0 && allIds.every(id => selectedOptions[menuName]?.includes(id))
  }

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={leftMenu}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {leftMenu.map(
        menu =>
          selectedMenu === menu && (
            <FilterContent
              key={menu}
              menuName={menu}
              searchQuery={searchQuery}
              onSearch={(query: string) => handleSearch(query, menu)}
              selectedOptions={selectedOptions[menu]}
              onOptionChange={handleCheckbox}
              selectAllHandler={() => handleSelectAll(menu)}
              items={menuData[menu]}
              isAllSelected={isAllSelected(menu)}
              searchLoading={searchLoading}
              placeholder={`Search ${menu}...`}
              enableSelectAll={menu !== 'Organization'}
              showSearch={menu === 'Organization'}
            />
          )
      )}
    </CustomFilterDrawer>
  )
}

export default memo(SpeciesAnimalFilterDrawer)
