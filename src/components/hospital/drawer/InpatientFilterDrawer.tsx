'use client'

import { debounce } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Toaster from 'src/components/Toaster'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'
import type { BaseDrawerProps } from 'src/types/hospital'

interface InpatientFilterDrawerProps extends BaseDrawerProps {
  onSubmitLoading?: boolean
  onApplyFilters: (filters: any) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: any
  hospitalId?: any
}

const InpatientFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions,
  hospitalId
}: InpatientFilterDrawerProps) => {
  const [selectedMenu, setSelectedMenu] = useState('Chief Veterinarian')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [menuData, setMenuData] = useState<any>({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const [selectedOptions, setSelectedOptions] = useState<any>({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const leftMenu = ['Chief Veterinarian', 'Origin Site']

  const fetchMenuData = useCallback(
    async (menuName: string, query = '') => {
      try {
        setSearchLoading(true)
        let data: any[] = []
        const params: any = {}

        switch (menuName) {
          case 'Chief Veterinarian': {
            if (query.trim() !== '') {
              params.q = query
            }

            const res: any = await getHospitalStaff({
              params: { ...params, hospital_id: hospitalId }
            })

            data =
              res?.data?.records.length > 0
                ? res?.data?.records.map((item: any) => ({
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
    debounce(async (menuName: string, query: string) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [menuData]
  )

  // Handle search input
  const handleSearch = useCallback(
    (query: string, menuName: string) => {
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
        {selectedMenu === 'Chief Veterinarian' && (
          <FilterContent
            menuName='Chief Veterinarian'
            searchQuery={searchQuery}
            onSearch={(query: string) => handleSearch(query, 'Chief Veterinarian')}
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
            onSearch={(query: string) => handleSearch(query, 'Origin Site')}
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
