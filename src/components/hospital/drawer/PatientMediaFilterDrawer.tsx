'use client'

import React, { useCallback, useEffect, useState } from 'react'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import MediaFilterContent from './MediaFilterContent'
import type { BaseDrawerProps } from 'src/types/hospital'

interface PatientMediaFilterDrawerProps extends BaseDrawerProps {
  onApplyFilters: (filters: any) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: any
}

const PatientMediaFilterDrawer = ({
  open,
  onClose,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}: PatientMediaFilterDrawerProps) => {
  const [selectedMenu, setSelectedMenu] = useState('Media Type')
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [selectedOptions, setSelectedOptions] = useState<any>({
    'Media Type': [],
    'Medical Record': [],
    Feature: []
  })

  const leftMenu = ['Media Type', 'Medical Record', 'Feature']

  // Static data for filters
  const menuData: any = {
    'Media Type': [
      { label: 'Images', value: 'image' },
      { label: 'Documents', value: 'document' },
      { label: 'Videos', value: 'video' },
      { label: 'Audio', value: 'audio' }
    ],
    'Medical Record': [
      { label: 'Current Medical Record', value: 'current' },
      { label: 'All Medical Records', value: 'all' }
    ],
    Feature: [
      { label: 'Surgery', value: 'surgery' },
      { label: 'Discharge', value: 'discharge' },
      { label: 'Mortality', value: 'mortality' }
    ]
  }

  const handleClearAll = useCallback(() => {
    setSelectedOptions({
      'Media Type': [],
      'Medical Record': [],
      Feature: []
    })
    setLocalFilterCount(0)
    setFilterCount(0)
  }, [setFilterCount])

  // Handle menu selection
  const handleMenuClick = useCallback((menuName: string) => {
    setSelectedMenu(menuName)
  }, [])

  const handleCheckbox = useCallback((id: any, menuName: string) => {
    setSelectedOptions((prevOptions: any) => {
      const isSelected = prevOptions[menuName]?.includes(id)

      let newOptions: any
      // For Medical Record, only allow single selection
      if (menuName === 'Medical Record') {
        newOptions = {
          ...prevOptions,
          [menuName]: isSelected ? [] : [id]
        }
      } else {
        // For other menus, allow multiple selection
        newOptions = {
          ...prevOptions,
          [menuName]: isSelected
            ? prevOptions[menuName].filter((itemId: any) => itemId !== id)
            : [...(prevOptions[menuName] || []), id]
        }
      }

      // Update filter count
      const count = Object.values(newOptions).reduce((acc: number, curr: any) => acc + curr.length, 0)
      setLocalFilterCount(count as number)

      return newOptions
    })
  }, [])

  // Handle select all
  const handleSelectAll = useCallback(
    (menuName: string) => {
      // Don't allow select all for Medical Record (single selection only)
      if (menuName === 'Medical Record') return

      setSelectedOptions((prevOptions: any) => {
        const allIds = menuData[menuName]?.map((item: any) => item.value) || []
        const currentSelected = prevOptions[menuName] || []
        const isAllSelected = currentSelected.length === allIds.length

        const newOptions = {
          ...prevOptions,
          [menuName]: isAllSelected ? [] : allIds
        }

        // Update filter count
        const count = Object.values(newOptions).reduce((acc: number, curr: any) => acc + curr.length, 0)
        setLocalFilterCount(count as number)

        return newOptions
      })
    },
    [menuData]
  )

  const applyFilters = () => {
    setFilterCount(localFilterCount)
    onApplyFilters(selectedOptions)
    onClose()
  }

  const isAllSelected = (menuName: string) => {
    if (menuName === 'Medical Record') return false

    return menuData[menuName]?.length > 0 && selectedOptions[menuName]?.length === menuData[menuName]?.length
  }

  useEffect(() => {
    if (initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
      const count = Object.values(initialSelectedOptions).reduce((acc: number, curr: any) => acc + curr.length, 0)
      setLocalFilterCount(count as number)
    }
  }, [initialSelectedOptions, open])

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={leftMenu}
      selectedOptions={selectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {selectedMenu === 'Media Type' && (
        <MediaFilterContent
          menuName='Media Type'
          selectedOptions={selectedOptions['Media Type']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Media Type')}
          items={menuData['Media Type']}
          isAllSelected={isAllSelected('Media Type')}
        />
      )}

      {selectedMenu === 'Medical Record' && (
        <MediaFilterContent
          menuName='Medical Record'
          selectedOptions={selectedOptions['Medical Record']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Medical Record')}
          items={menuData['Medical Record']}
          isAllSelected={isAllSelected('Medical Record')}
          hideSelectAll={true}
        />
      )}

      {selectedMenu === 'Feature' && (
        <MediaFilterContent
          menuName='Feature'
          selectedOptions={selectedOptions['Feature']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Feature')}
          items={menuData['Feature']}
          isAllSelected={isAllSelected('Feature')}
        />
      )}
    </CustomFilterDrawer>
  )
}

export default PatientMediaFilterDrawer
