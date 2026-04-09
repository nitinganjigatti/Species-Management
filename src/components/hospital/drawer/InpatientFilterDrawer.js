'use client'

import { debounce } from 'lodash'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Toaster from 'src/components/Toaster'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'

const InpatientFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions,
  hospitalId
}) => {
  const [selectedMenu, setSelectedMenu] = useState('Chief Veterinarian')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [menuData, setMenuData] = useState({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const [selectedOptions, setSelectedOptions] = useState({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const leftMenu = ['Chief Veterinarian', 'Origin Site']

  const fetchMenuData = useCallback(
    async (menuName, query = '') => {
      try {
        setSearchLoading(true)
        let data = []
        let params = {}

        switch (menuName) {
          case 'Chief Veterinarian': {
            if (query.trim() !== '') {
              params.q = query
            }

            const res = await getHospitalStaff({
              params: { ...params, hospital_id: hospitalId }
            })

            data =
              res?.data?.records.length > 0
                ? res?.data?.records.map(item => ({
                    label: item?.user_full_name,
                    value: item?.user_id,
                    profile: item?.user_profile_pic
                  }))
                : []
            break
          }

          case 'Origin Site': {
            if (query.trim() !== '') {
              params.q = query
            }

            const res = await getZooWiseSiteLists(params)

            data =
              res?.data?.result?.length > 0
                ? res.data.result?.map(item => ({
                    label: item?.site_name,
                    value: item?.site_id
                  }))
                : []

            break
          }

          default:
            break
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
    },
    [selectedMenu, hospitalId]
  )

  const handleClearAll = useCallback(() => {
    setSelectedOptions({
      'Chief Veterinarian': [],
      'Origin Site': []
    })
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [])

  const debouncedMenuSearch = useCallback(
    debounce(async (menuName, query) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [menuData]
  )

  // Handle search input
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

  // Handle menu selection
  const handleMenuClick = useCallback(
    async menuName => {
      setSelectedMenu(menuName)
      setSearchQuery('')
      await fetchMenuData(menuName, '')
    },
    [menuData, fetchMenuData]
  )

  const handleCheckbox = useCallback((id, menuName) => {
    setSelectedOptions(prevOptions => {
      const isSelected = prevOptions[menuName]?.includes(id)

      const newOptions = {
        ...prevOptions,
        [menuName]: isSelected
          ? prevOptions[menuName].filter(itemId => itemId !== id)
          : [...(prevOptions[menuName] || []), id]
      }
      const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
      setLocalFilterCount(count)

      return newOptions
    })
  }, [])

  // Handle select all
  const handleSelectAll = useCallback(
    menuName => {
      setSelectedOptions(prevOptions => {
        const allIds = menuData[menuName]?.map(item => item.value) || []
        const currentSelected = prevOptions[menuName] || []
        const isAllSelected = currentSelected.length === allIds.length

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
    console.log('selectedOptions', selectedOptions)
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
  }

  const isAllSelected = menuName => {
    return menuData[menuName]?.length > 0 && selectedOptions[menuName]?.length === menuData[menuName]?.length
  }

  useEffect(() => {
    if (open) {
      handleFilterDrawerOpen()
    }
    if (initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
    }
  }, [open])

  return (
    <>
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
        {selectedMenu === 'Chief Veterinarian' && (
          <FilterContent
            menuName='Chief Veterinarian'
            searchQuery={searchQuery}
            onSearch={query => handleSearch(query, 'Chief Veterinarian')}
            selectedOptions={selectedOptions['Chief Veterinarian']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('Chief Veterinarian')}
            items={menuData['Chief Veterinarian']}
            isAllSelected={isAllSelected('Chief Veterinarian')}
            searchLoading={searchLoading}
            placeholder='Search Chief Veterinarian'
          />
        )}

        {selectedMenu === 'Origin Site' && (
          <FilterContent
            menuName='Origin Site'
            searchQuery={searchQuery}
            onSearch={query => handleSearch(query, 'Origin Site')}
            selectedOptions={selectedOptions['Origin Site']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('Origin Site')}
            items={menuData['Origin Site']}
            isAllSelected={isAllSelected('Origin Site')}
            searchLoading={searchLoading}
            placeholder='Search Origin Sites...'
          />
        )}
      </CustomFilterDrawer>
    </>
  )
}

export default InpatientFilterDrawer
