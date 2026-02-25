import React, { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'

const incomingMenus = ['Sex', 'Site']
const baseMenus = ['Sex', 'Site', 'Necropsy Location']
const extendedMenus = [...baseMenus, 'Necropsy Conducted By', 'Created By']

const getInitialOptions = menus => menus.reduce((acc, key) => ({ ...acc, [key]: [] }), {})

const singleSelectMenus = ['Necropsy Location', 'Site']

const staticMenuData = {
  Sex: [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Indeterminate', value: 'Indeterminate' },
    { label: 'Undeterminate', value: 'Undeterminate' }
  ],
  'Necropsy Location': [
    { label: 'Onsite', value: 1 },
    { label: 'Necropsy Center', value: 0 }
  ]
}

const isSingleSelect = menuName => singleSelectMenus.includes(menuName)

const NecropsyFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions,
  activeCard
}) => {
  const auth = useAuth()
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const leftMenu =
    activeCard === 'INCOMING'
      ? incomingMenus
      : activeCard === 'DRAFT' || activeCard === 'COMPLETED'
      ? extendedMenus
      : baseMenus

  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [menuData, setMenuData] = useState({
    ...getInitialOptions(extendedMenus),
    ...staticMenuData
  })

  const [selectedOptions, setSelectedOptions] = useState(getInitialOptions(extendedMenus))

  const fetchMenuData = useCallback(async (menuName, query = '') => {
    if (staticMenuData[menuName]) return

    try {
      setSearchLoading(true)
      let data = []
      const params = {}

      if (query.trim() !== '') {
        params.q = query
      }

      switch (menuName) {
        case 'Site': {
          const res = await getZooWiseSiteLists(params)

          data =
            res?.data?.result?.length > 0
              ? res.data.result.map(item => ({
                  label: item?.site_name,
                  value: item?.site_id
                }))
              : []
          break
        }

        case 'Necropsy Conducted By':
        case 'Created By': {
          if (zooId) {
            params.zoo_id = zooId

            const res = await getUserList(params)

            data =
              res?.data?.length > 0
                ? res.data.map(item => ({
                    label: item?.user_name,
                    value: item?.user_id
                  }))
                : []
          }
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
  }, [zooId])

  const handleClearAll = useCallback(() => {
    setSelectedOptions(getInitialOptions(extendedMenus))
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
      if (isSingleSelect(menuName)) {
        const isSelected = prevOptions[menuName]?.includes(id)

        const newOptions = {
          ...prevOptions,
          [menuName]: isSelected ? [] : [id]
        }
        const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
        setLocalFilterCount(count)

        return newOptions
      }

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

  const handleSelectAll = useCallback(
    menuName => {
      if (isSingleSelect(menuName)) return

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
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
  }

  const isAllSelected = menuName => {
    if (isSingleSelect(menuName)) return false

    return menuData[menuName]?.length > 0 && selectedOptions[menuName]?.length === menuData[menuName]?.length
  }

  useEffect(() => {
    if (open) {
      handleFilterDrawerOpen()
    }
    if (initialSelectedOptions) {
      setSelectedOptions(prev => ({ ...prev, ...initialSelectedOptions }))
    }
  }, [open])

  useEffect(() => {
    if (!leftMenu.includes(selectedMenu)) {
      setSelectedMenu(leftMenu[0])
    }
  }, [activeCard])

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
              enableSelectAll={!isSingleSelect(menu)}
            />
          )
      )}
    </CustomFilterDrawer>
  )
}

export default NecropsyFilterDrawer
