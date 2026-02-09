import React, { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getMannerOfDeath } from 'src/lib/api/necropsy'
import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'
import Toaster from 'src/components/Toaster'

const leftMenu = ['Manner of Death', 'Organization', 'Sex']

const getInitialOptions = () => ({
  'Manner of Death': [],
  Organization: [],
  Sex: []
})

const staticMenuData = {
  Sex: [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Indeterminate', value: 'indeterminate' },
    { label: 'Undetermined', value: 'undetermined' }
  ]
}

const SpeciesAnimalFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const [selectedMenu, setSelectedMenu] = useState('Manner of Death')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [menuData, setMenuData] = useState({
    'Manner of Death': [],
    Organization: [],
    ...staticMenuData
  })

  const [selectedOptions, setSelectedOptions] = useState(getInitialOptions())

  const fetchMenuData = useCallback(async (menuName, query = '') => {
    if (staticMenuData[menuName]) return

    try {
      setSearchLoading(true)
      let data = []

      if (menuName === 'Manner of Death') {
        const res = await getMannerOfDeath()
        data =
          res?.data?.length > 0
            ? res.data.map(item => ({
                label: item?.name,
                value: item?.id
              }))
            : []
      } else if (menuName === 'Organization') {
        const res = await getOrganizationList({ params: { q: query } })
        data =
          res?.length > 0
            ? res.map(item => ({
                label: item?.organization_name || item?.name,
                value: item?.id
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
    debounce(async (menuName, query) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [fetchMenuData]
  )

  const handleSearch = useCallback(
    (query, menuName) => {
      setSearchQuery(query)
      if (menuName === 'Organization') {
        debouncedMenuSearch(menuName, query)
      }
    },
    [debouncedMenuSearch]
  )

  const handleFilterDrawerOpen = async () => {
    setSearchQuery('')
    fetchMenuData(selectedMenu)
  }

  const handleMenuClick = useCallback(
    async menuName => {
      setSelectedMenu(menuName)
      setSearchQuery('')
      await fetchMenuData(menuName, '')
    },
    [fetchMenuData]
  )

  // Multi-select for Manner of Death and Sex, single-select for Organization
  const handleCheckbox = useCallback((id, menuName) => {
    setSelectedOptions(prevOptions => {
      let newOptions

      if (menuName === 'Organization') {
        // Single select for Organization
        const isSelected = prevOptions[menuName]?.includes(id)
        newOptions = {
          ...prevOptions,
          [menuName]: isSelected ? [] : [id]
        }
      } else {
        // Multi-select for Manner of Death and Sex
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
    menuName => {
      if (menuName === 'Organization') return // No select all for single-select

      setSelectedOptions(prevOptions => {
        const allIds = menuData[menuName]?.map(item => item.value) || []
        const isAllSelected = allIds.every(id => prevOptions[menuName]?.includes(id))

        const newOptions = {
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

  const applyFilters = () => {
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

  const isAllSelected = menuName => {
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
              onSearch={query => handleSearch(query, menu)}
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

export default SpeciesAnimalFilterDrawer
