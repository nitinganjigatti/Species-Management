import React, { useCallback, useEffect, useState, FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce, DebouncedFunc } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import Toaster from 'src/components/Toaster'

// ==================== Types ====================

type MenuName = 'Site'

interface FilterOption {
  label: string
  value: string | number
}

interface SelectedOptionsMap {
  Site: (string | number)[]
}

interface MenuDataMap {
  Site: FilterOption[]
}

interface SiteListParams {
  q?: string
}

interface SiteItem {
  site_name?: string
  site_id?: string | number
}

interface SiteListResponse {
  data?: {
    result?: SiteItem[]
  }
}

interface CarcassTransferFilterDrawerProps {
  open: boolean
  onClose: () => void
  onSubmitLoading?: boolean
  onApplyFilters: (selectedOptions: SelectedOptionsMap) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: Partial<SelectedOptionsMap>
}

// ==================== Constants ====================

const leftMenu: MenuName[] = ['Site']

const getInitialOptions = (): SelectedOptionsMap => ({ Site: [] })

// ==================== Component ====================

const CarcassTransferFilterDrawer: FC<CarcassTransferFilterDrawerProps> = ({
  open,
  onClose,
  onSubmitLoading = false,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}) => {
  const { t } = useTranslation('common')
  const [selectedMenu, setSelectedMenu] = useState<MenuName>('Site')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState<boolean>(false)
  const [localFilterCount, setLocalFilterCount] = useState<number>(0)

  const [menuData, setMenuData] = useState<MenuDataMap>({
    Site: []
  })

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>(getInitialOptions())

  const fetchMenuData = useCallback(async (menuName: MenuName, query: string = ''): Promise<void> => {
    try {
      setSearchLoading(true)
      let data: FilterOption[] = []
      const params: SiteListParams = {}

      if (query.trim() !== '') {
        params.q = query
      }

      if (menuName === 'Site') {
        const res: SiteListResponse = await getZooWiseSiteLists(params)

        data =
          res?.data?.result && res.data.result.length > 0
            ? res.data.result.map((item: SiteItem) => ({
                label: item?.site_name ?? '',
                value: item?.site_id ?? ''
              }))
            : []
      }

      setMenuData((prev: MenuDataMap) => ({
        ...prev,
        [menuName]: data
      }))
    } catch (error) {
      console.error(`Error ${query ? 'searching' : 'fetching'} ${menuName}:`, error)
      Toaster({
        type: 'error',
        message: t('necropsy_module.failed_to_load_options', { action: query ? t('search') : 'load', menu: menuName })
      })
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const handleClearAll = useCallback((): void => {
    setSelectedOptions(getInitialOptions())
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  const debouncedMenuSearch: DebouncedFunc<(menuName: MenuName, query: string) => Promise<void>> = useCallback(
    debounce(async (menuName: MenuName, query: string) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [fetchMenuData]
  )

  const handleSearch = useCallback(
    (query: string, menuName: MenuName): void => {
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
    async (menuName: MenuName): Promise<void> => {
      setSelectedMenu(menuName)
      setSearchQuery('')
      await fetchMenuData(menuName, '')
    },
    [fetchMenuData]
  )

  const handleCheckbox = useCallback((id: string | number, menuName: MenuName): void => {
    setSelectedOptions((prevOptions: SelectedOptionsMap) => {
      const isSelected = prevOptions[menuName]?.includes(id)

      const newOptions: SelectedOptionsMap = {
        ...prevOptions,
        [menuName]: isSelected ? [] : [id]
      }
      const count = Object.values(newOptions).reduce((acc: number, curr: (string | number)[]) => acc + curr.length, 0)
      setLocalFilterCount(count)

      return newOptions
    })
  }, [])

  const applyFilters = (): void => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
  }

  useEffect(() => {
    if (open) {
      handleFilterDrawerOpen()
    }
    if (initialSelectedOptions) {
      setSelectedOptions((prev: SelectedOptionsMap) => ({ ...prev, ...initialSelectedOptions }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        (menu: MenuName): ReactNode =>
          selectedMenu === menu && (
            <FilterContent
              key={menu}
              menuName={menu}
              searchQuery={searchQuery}
              onSearch={(query: string) => handleSearch(query, menu)}
              selectedOptions={selectedOptions[menu]}
              onOptionChange={handleCheckbox}
              selectAllHandler={() => {}}
              items={menuData[menu]}
              isAllSelected={false}
              searchLoading={searchLoading}
              placeholder={t('necropsy_module.search_menu', { menu })}
              enableSelectAll={false}
            />
          )
      )}
    </CustomFilterDrawer>
  )
}

export default CarcassTransferFilterDrawer
