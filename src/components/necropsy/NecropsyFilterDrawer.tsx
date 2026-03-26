import React, { FC, memo, useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import { SelectOption, ActiveCard } from 'src/types/necropsy'

type MenuName = 'Sex' | 'Site' | 'Necropsy Location' | 'Necropsy Conducted By' | 'Created By'

interface SelectedOptions {
  Sex: (string | number)[]
  Site: (string | number)[]
  'Necropsy Location': (string | number)[]
  'Necropsy Conducted By': (string | number)[]
  'Created By': (string | number)[]
}

interface MenuData {
  Sex: SelectOption[]
  Site: SelectOption[]
  'Necropsy Location': SelectOption[]
  'Necropsy Conducted By': SelectOption[]
  'Created By': SelectOption[]
}

interface NecropsyFilterDrawerProps {
  open: boolean
  onClose: () => void
  onSubmitLoading?: boolean
  onApplyFilters: (selectedOptions: SelectedOptions) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: Partial<SelectedOptions>
  activeCard?: ActiveCard | string
}

const incomingMenus: MenuName[] = ['Sex', 'Site']
const baseMenus: MenuName[] = ['Sex', 'Site', 'Necropsy Location']
const extendedMenus: MenuName[] = [...baseMenus, 'Necropsy Conducted By', 'Created By']

const getInitialOptions = (menus: MenuName[]): SelectedOptions =>
  menus.reduce(
    (acc, key) => ({ ...acc, [key]: [] }),
    {} as SelectedOptions
  )

const singleSelectMenus: MenuName[] = ['Necropsy Location', 'Site']

const staticMenuData: Partial<MenuData> = {
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

const isSingleSelect = (menuName: MenuName): boolean => singleSelectMenus.includes(menuName)

const NecropsyFilterDrawer: FC<NecropsyFilterDrawerProps> = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions,
  activeCard
}) => {
  const auth = useAuth() as unknown as { userData?: { user?: { zoos?: { zoo_id?: number | string }[] } } } | null
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const leftMenu: MenuName[] =
    activeCard === 'INCOMING'
      ? incomingMenus
      : activeCard === 'DRAFT' || activeCard === 'COMPLETED'
      ? extendedMenus
      : baseMenus

  const [selectedMenu, setSelectedMenu] = useState<MenuName>(leftMenu[0])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState<boolean>(false)
  const [localFilterCount, setLocalFilterCount] = useState<number>(0)

  const [menuData, setMenuData] = useState<MenuData>({
    ...getInitialOptions(extendedMenus),
    ...staticMenuData
  } as MenuData)

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(getInitialOptions(extendedMenus))

  const fetchMenuData = useCallback(async (menuName: MenuName, query: string = '') => {
    if (staticMenuData[menuName]) return

    try {
      setSearchLoading(true)
      let data: SelectOption[] = []
      const params: Record<string, string | number> = {}

      if (query.trim() !== '') {
        params.q = query
      }

      switch (menuName) {
        case 'Site': {
          const res = await getZooWiseSiteLists(params)

          data =
            res?.data?.result?.length > 0
              ? res.data.result.map((item: { site_name?: string; site_id?: number }) => ({
                  label: item?.site_name || '',
                  value: item?.site_id || 0
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
                ? res.data.map((item: { user_name?: string; user_id?: number }) => ({
                    label: item?.user_name || '',
                    value: item?.user_id || 0
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
      debouncedMenuSearch(menuName, query)
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
      if (isSingleSelect(menuName)) {
        const isSelected = prevOptions[menuName]?.includes(id)

        const newOptions: SelectedOptions = {
          ...prevOptions,
          [menuName]: isSelected ? [] : [id]
        }
        const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
        setLocalFilterCount(count)

        return newOptions
      }

      const isSelected = prevOptions[menuName]?.includes(id)

      const newOptions: SelectedOptions = {
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
    (menuName: MenuName) => {
      if (isSingleSelect(menuName)) return

      setSelectedOptions(prevOptions => {
        const allIds = menuData[menuName]?.map(item => item.value) || []
        const currentSelected = prevOptions[menuName] || []
        const isAllSelected = currentSelected.length === allIds.length

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

  const isAllSelected = (menuName: MenuName): boolean => {
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
  }, [activeCard, leftMenu, selectedMenu])

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
              enableSelectAll={!isSingleSelect(menu)}
            />
          )
      )}
    </CustomFilterDrawer>
  )
}

export default memo(NecropsyFilterDrawer)
