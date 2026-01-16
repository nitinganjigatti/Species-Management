import { useTheme } from '@mui/material'
import { debounce } from 'lodash'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import { getMasterImports } from 'src/lib/api/compliance/masters'
import { getAllSites } from 'src/lib/api/housing'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'

const IncomingFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const [selectedMenu, setSelectedMenu] = useState('User')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const authData = useContext(AuthContext)

  const [menuData, setMenuData] = useState({
    User: [],
    'Origin Site': []
  })

  const [selectedOptions, setSelectedOptions] = useState({
    User: [],
    'Origin Site': []
  })

  const leftMenu = ['User', 'Origin Site']

  const fetchMenuData = useCallback(
    async (menuName, query = '') => {
      try {
        setSearchLoading(true)
        let data = []
        let params = {}

        switch (menuName) {
          case 'User': {
            const userDetails = await readAsync('userDetails')

            if (userDetails?.user?.zoos?.length > 0) {
              const zoo_id = userDetails.user.zoos[0].zoo_id
              const params = { zoo_id }

              if (query.trim() !== '') {
                params.q = query
              }

              const res = await getUserList(params)

              data =
                res?.data?.length > 0
                  ? res.data.map(item => ({
                      label: item?.user_name,
                      value: item?.user_id
                    }))
                  : []
            } else {
              data = []
            }
            break
          }

          case 'Origin Site': {
            if (query.trim() !== '') {
              params.q = query
            }

            const res = await getAllSites(params)

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
    [selectedMenu]
  )

  const handleClearAll = useCallback(() => {
    setSelectedOptions({
      User: [],
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

      // if (menuName === 'User') {
      //   const filteredData = countryListOptions.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
      //   setMenuData(prev => ({
      //     ...prev,
      //     [menuName]: query ? filteredData : countryListOptions
      //   }))

      //   return
      // }
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
        {selectedMenu === 'User' && (
          <FilterContent
            menuName='User'
            searchQuery={searchQuery}
            onSearch={query => handleSearch(query, 'User')}
            selectedOptions={selectedOptions['User']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('User')}
            items={menuData['User']}
            isAllSelected={isAllSelected('User')}
            searchLoading={searchLoading}
            placeholder='Search User'
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

export default IncomingFilterDrawer
