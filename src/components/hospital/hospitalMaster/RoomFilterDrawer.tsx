'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Box, Radio, Typography, FormControlLabel, RadioGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'

const DEFAULT_OPTIONS: any = { Availability: [], Status: [] }

interface RoomFilterDrawerProps {
  openFilterDrawer?: boolean
  onCloseFilterDrawer?: () => void
  onSubmitLoading?: boolean
  onApplyFilters?: (selected: any) => void
  setFilterCount?: (count: number) => void
  initialSelectedOptions?: any
}

const RoomFilterDrawer = ({
  openFilterDrawer,
  onCloseFilterDrawer,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}: RoomFilterDrawerProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  const [selectedMenu, setSelectedMenu] = useState<string>('Availability')
  const [selectedOptions, setSelectedOptions] = useState<any>(DEFAULT_OPTIONS)
  const [localFilterCount, setLocalFilterCount] = useState<number>(0)

  const MENU_DATA: any = useMemo(
    () => ({
      Availability: [
        { label: t('hospital_module.available'), value: 'Available' },
        { label: t('hospital_module.occupied'), value: 'Occupied' }
      ],
      Status: [
        { label: t('hospital_module.active'), value: 'active' },
        { label: t('hospital_module.inactive'), value: 'inactive' }
      ]
    }),
    [t]
  )

  const isFilterEmpty = (filters: any) => {
    if (!filters) return true

    for (const value of Object.values(filters)) {
      if (Array.isArray(value) && value.length > 0) {
        return false
      }
    }

    return true
  }

  const checkFiltersEqual = (a: any = {}, b: any = {}) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])

    for (const key of keys) {
      const valA = a[key]?.[0] || ''
      const valB = b[key]?.[0] || ''

      if (valA !== valB) return false
    }

    return true
  }

  const handleRadioChange = useCallback((value: string, menu: string) => {
    setSelectedOptions((prev: any) => {
      const updated = { ...prev, [menu]: [value] }
      const count = Object.values(updated).reduce((acc: number, arr: any) => acc + arr.length, 0)

      setLocalFilterCount(count)

      return updated
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedOptions(DEFAULT_OPTIONS)
    setLocalFilterCount(0)
  }, [])

  const applyFilters = () => {
    if (isFilterEmpty(selectedOptions) && isFilterEmpty(initialSelectedOptions)) {
      onCloseFilterDrawer && onCloseFilterDrawer()

      return
    }

    if (checkFiltersEqual(selectedOptions, initialSelectedOptions)) {
      onCloseFilterDrawer && onCloseFilterDrawer()

      return
    }

    setFilterCount && setFilterCount(localFilterCount)
    onApplyFilters && onApplyFilters(selectedOptions)
  }

  // Restore applied filters on close (Cancel button and icon close)
  useEffect(() => {
    if (!openFilterDrawer) {
      const restored = initialSelectedOptions || DEFAULT_OPTIONS
      setSelectedOptions(restored)
      setLocalFilterCount(Object.values(restored).reduce((acc: number, arr: any) => acc + arr.length, 0))
      setSelectedMenu('Availability')
    }
  }, [openFilterDrawer, initialSelectedOptions])

  const FilterContent = ({ menu }: { menu: string }) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <RadioGroup value={selectedOptions[menu]?.[0] || ''} onChange={e => handleRadioChange(e.target.value, menu)}>
          {MENU_DATA[menu].map((item: any) => (
            <FormControlLabel
              key={item.value}
              value={item.value}
              control={<Radio />}
              label={
                <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors?.Outline }}>
                  {item.label}
                </Typography>
              }
            />
          ))}
        </RadioGroup>
      </Box>
    )
  }

  return (
    <CustomFilterDrawer
      open={openFilterDrawer}
      onClose={onCloseFilterDrawer}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={['Availability', 'Status']}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={setSelectedMenu}
    >
      <FilterContent menu={selectedMenu} />
    </CustomFilterDrawer>
  )
}

export default RoomFilterDrawer
