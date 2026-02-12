import React, { useCallback, useEffect, useState } from 'react'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import MediaFilterContent from './MediaFilterContent'

const PatientMediaFilterDrawer = ({ open, onClose, onApplyFilters, setFilterCount, initialSelectedOptions }) => {
  const [selectedMenu, setSelectedMenu] = useState('Media Type')
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [selectedOptions, setSelectedOptions] = useState({
    'Media Type': [],
    'Medical Record': [],
    Feature: []
  })

  const leftMenu = ['Media Type', 'Medical Record', 'Feature']

  // Static data for filters
  const menuData = {
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
  const handleMenuClick = useCallback(menuName => {
    setSelectedMenu(menuName)
  }, [])

  const handleCheckbox = useCallback((id, menuName) => {
    setSelectedOptions(prevOptions => {
      const isSelected = prevOptions[menuName]?.includes(id)

      let newOptions
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
            ? prevOptions[menuName].filter(itemId => itemId !== id)
            : [...(prevOptions[menuName] || []), id]
        }
      }

      // Update filter count
      const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
      setLocalFilterCount(count)

      return newOptions
    })
  }, [])

  // Handle select all
  const handleSelectAll = useCallback(
    menuName => {
      // Don't allow select all for Medical Record (single selection only)
      if (menuName === 'Medical Record') return

      setSelectedOptions(prevOptions => {
        const allIds = menuData[menuName]?.map(item => item.value) || []
        const currentSelected = prevOptions[menuName] || []
        const isAllSelected = currentSelected.length === allIds.length

        const newOptions = {
          ...prevOptions,
          [menuName]: isAllSelected ? [] : allIds
        }

        // Update filter count
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
    onClose()
  }

  const isAllSelected = menuName => {
    if (menuName === 'Medical Record') return false

    return menuData[menuName]?.length > 0 && selectedOptions[menuName]?.length === menuData[menuName]?.length
  }

  useEffect(() => {
    if (initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
      const count = Object.values(initialSelectedOptions).reduce((acc, curr) => acc + curr.length, 0)
      setLocalFilterCount(count)
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
