import React, { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import Toaster from 'src/components/Toaster'

const leftMenu = ['Site', 'Priority']

const getInitialOptions = () => ({ Site: [], Priority: [] })

const staticMenuData = {
  Priority: [
    { label: 'Low', value: 'Low' },
    { label: 'High', value: 'High' }
  ]
}

const SpeciesFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const [selectedMenu, setSelectedMenu] = useState('Site')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [menuData, setMenuData] = useState({
    Site: [],
    ...staticMenuData
  })

  const [selectedOptions, setSelectedOptions] = useState(getInitialOptions())

  const fetchMenuData = useCallback(async (menuName, query = '') => {
    if (staticMenuData[menuName]) return

    try {
      setSearchLoading(true)
      let data = []
      const params = {}

      if (query.trim() !== '') {
        params.q = query
      }

      if (menuName === 'Site') {
        const res = await getZooWiseSiteLists(params)

        data =
          res?.data?.result?.length > 0
            ? res.data.result.map(item => ({
                label: item?.site_name,
                value: item?.site_id
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
  }, [])

  const debouncedMenuSearch = useCallback(
    debounce(async (menuName, query) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [fetchMenuData]
  )

  const handleSearch = useCallback(
    (query, menuName) => {
      setSearchQuery(query)
      debouncedMenuSearch(menuName, query)
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

  const handleCheckbox = useCallback((id, menuName) => {
    setSelectedOptions(prevOptions => {
      const isSelected = prevOptions[menuName]?.includes(id)

      const newOptions = {
        ...prevOptions,
        [menuName]: isSelected ? [] : [id]
      }
      const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
      setLocalFilterCount(count)

      return newOptions
    })
  }, [])

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
              selectAllHandler={() => {}}
              items={menuData[menu]}
              isAllSelected={false}
              searchLoading={searchLoading}
              placeholder={`Search ${menu}...`}
              enableSelectAll={false}
            />
          )
      )}
    </CustomFilterDrawer>
  )
}

export default SpeciesFilterDrawer
