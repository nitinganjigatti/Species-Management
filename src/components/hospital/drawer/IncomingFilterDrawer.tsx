'use client'

import { debounce } from 'lodash'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import type { BaseDrawerProps } from 'src/types/hospital'

interface IncomingFilterDrawerProps extends BaseDrawerProps {
  onSubmitLoading?: boolean
  onApplyFilters: (filters: any) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: any
}

const IncomingFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}: IncomingFilterDrawerProps) => {
  const { t } = useTranslation()
  const [selectedMenu, setSelectedMenu] = useState('User')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const authData = useContext(AuthContext)

  const [menuData, setMenuData] = useState<any>({
    User: [],
    'Origin Site': []
  })

  const [selectedOptions, setSelectedOptions] = useState<any>({
    User: [],
    'Origin Site': []
  })

  const leftMenu = ['User', 'Origin Site']

  const fetchMenuData = useCallback(
    async (menuName: string, query = '') => {
      try {
        setSearchLoading(true)
        let data: any[] = []
        const params: any = {}

        switch (menuName) {
          case 'User': {
            const userDetails: any = await readAsync('userDetails')

            if (userDetails?.user?.zoos?.length > 0) {
              const zoo_id = userDetails.user.zoos[0].zoo_id
              const params: any = { zoo_id }

              if (query.trim() !== '') {
                params.q = query
              }

              const res: any = await getUserList(params)

              data =
                res?.data?.length > 0
                  ? res.data.map((item: any) => ({
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

            const res: any = await getZooWiseSiteLists(params)

            data =
              res?.data?.result?.length > 0
                ? res.data.result?.map((item: any) => ({
                    label: item?.site_name,
                    value: item?.site_id
                  }))
                : []

            break
          }

          default:
            break
        }

        setMenuData((prev: any) => ({
          ...prev,
          [menuName]: data
        }))
      } catch (error) {
        console.error(`Error ${query ? 'searching' : 'fetching'} ${menuName}:`, error)
        Toaster({
          type: 'error',
          message: t('hospital_module.failed_to_load_hospital_staff')
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
    debounce(async (menuName: string, query: string) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [menuData]
  )

  // Handle search input
  const handleSearch = useCallback(
    (query: string, menuName: string) => {
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
    async (menuName: string) => {
      setSelectedMenu(menuName)
      setSearchQuery('')
      await fetchMenuData(menuName, '')
    },
    [menuData, fetchMenuData]
  )

  const handleCheckbox = useCallback((id: any, menuName: string) => {
    setSelectedOptions((prevOptions: any) => {
      const isSelected = prevOptions[menuName]?.includes(id)

      const newOptions = {
        ...prevOptions,
        [menuName]: isSelected
          ? prevOptions[menuName].filter((itemId: any) => itemId !== id)
          : [...(prevOptions[menuName] || []), id]
      }
      const count = Object.values(newOptions).reduce((acc: number, curr: any) => acc + curr.length, 0)
      setLocalFilterCount(count as number)

      return newOptions
    })
  }, [])

  // Handle select all
  const handleSelectAll = useCallback(
    (menuName: string) => {
      setSelectedOptions((prevOptions: any) => {
        const allIds = menuData[menuName]?.map((item: any) => item.value) || []
        const currentSelected = prevOptions[menuName] || []
        const isAllSelected = currentSelected.length === allIds.length

        const newOptions = {
          ...prevOptions,
          [menuName]: isAllSelected ? [] : allIds
        }

        const count = Object.values(newOptions).reduce((acc: number, curr: any) => acc + curr.length, 0)
        setLocalFilterCount(count as number)

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

  const isAllSelected = (menuName: string) => {
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
            onSearch={(query: string) => handleSearch(query, 'User')}
            selectedOptions={selectedOptions['User']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('User')}
            items={menuData['User']}
            isAllSelected={isAllSelected('User')}
            searchLoading={searchLoading}
            placeholder={(t('search') as string)}
          />
        )}

        {selectedMenu === 'Origin Site' && (
          <FilterContent
            menuName='Origin Site'
            searchQuery={searchQuery}
            onSearch={(query: string) => handleSearch(query, 'Origin Site')}
            selectedOptions={selectedOptions['Origin Site']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('Origin Site')}
            items={menuData['Origin Site']}
            isAllSelected={isAllSelected('Origin Site')}
            searchLoading={searchLoading}
            placeholder={(t('search') as string)}
          />
        )}
      </CustomFilterDrawer>
    </>
  )
}

export default IncomingFilterDrawer
