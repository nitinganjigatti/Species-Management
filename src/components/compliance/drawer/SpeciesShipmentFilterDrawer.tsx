import { useTheme } from '@mui/material'
import { debounce } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import countryList from 'react-select-country-list'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import Toaster from 'src/components/Toaster'
import { getDocumentTypeList, getMasterImports } from 'src/lib/api/compliance/masters'
import type { SpeciesShipmentFilterDrawerProps, FilterSelectedOptions, FilterMenuData } from 'src/types/compliance'

const SpeciesShipmentFilterDrawer = ({
  open,
  onClose,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions
}: SpeciesShipmentFilterDrawerProps) => {
  const { t } = useTranslation()
  const [selectedMenu, setSelectedMenu] = useState<string>('Exporting country')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState<boolean>(false)
  const [localFilterCount, setLocalFilterCount] = useState<number>(0)

  const [menuData, setMenuData] = useState<FilterMenuData>({
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })

  const [selectedOptions, setSelectedOptions] = useState<FilterSelectedOptions>({
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })

  const leftMenu = ['Exporting country', 'Exporter', 'Importer', 'Documents']

  const filterLabels = useMemo(
    () => ({
      'Exporting country': t('compliance_module.exporting_country'),
      Exporter: t('compliance_module.exporter'),
      Importer: t('compliance_module.importer'),
      Documents: t('compliance_module.documents')
    }),
    [t]
  )

  const theme = useTheme()
  const countryListOptions = useMemo(() => countryList().getData(), [])

  const fetchMenuData = useCallback(
    async (menuName: string, query = '') => {
      try {
        setSearchLoading(true)
        let data = []
        let params: Record<string, unknown> = {}

        switch (menuName) {
          case 'Exporting country':
            data = query
              ? countryListOptions.filter((item: any) => item.label.toLowerCase().includes(query.toLowerCase()))
              : countryListOptions
            break

          case 'Exporter':
            params = { type: 'exporter' }
            if (query) params.q = query
            const exportersRes = (await getMasterImports(params)) as any
            data = exportersRes.success
              ? exportersRes?.data?.data?.map((item: any) => ({
                  label: item.name,
                  value: item.id
                }))
              : []
            break

          case 'Importer':
            params = { type: 'importer' }
            if (query) params.q = query
            const importersRes = (await getMasterImports(params)) as any
            data = importersRes.success
              ? importersRes?.data?.data?.map((item: any) => ({
                  label: item.name,
                  value: item.id
                }))
              : []
            break

          case 'Documents':
            params = {
              status: 1
            }
            if (query) params.q = query
            const documentsRes = (await getDocumentTypeList(params)) as any
            data = documentsRes.success
              ? documentsRes?.data?.records.map((item: any) => ({
                  label: item.name,
                  value: item.id
                }))
              : []
            break

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
          message: query
            ? t('compliance_module.failed_to_search_filter_options')
            : t('compliance_module.failed_to_load_filter_options')
        })
      } finally {
        setSearchLoading(false)
      }
    },
    [selectedMenu]
  )

  const handleClearAll = useCallback(() => {
    // Change state keys as per your requirement
    setSelectedOptions({
      Species: [],
      'Exporting country': [],
      Exporter: [],
      Importer: [],
      Documents: []
    })
    setLocalFilterCount(0)
    setFilterCount?.(0)
  }, [])

  // Debounced search for menu items
  const debouncedMenuSearch = useCallback(
    debounce(async (menuName: string, query: string) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [menuData]
  ) // Don't update this function

  // Handle search input
  const handleSearch = useCallback(
    (query: string, menuName: string) => {
      setSearchQuery(query)

      // Just to show how it works with already existing data is used. If not required remove this
      // For locally available data (countries), filter immediately
      if (menuName === 'Exporting country') {
        const filteredData = countryListOptions.filter((item: any) =>
          item.label.toLowerCase().includes(query.toLowerCase())
        )
        setMenuData(
          prev =>
            ({
              ...prev,
              [menuName]: query ? filteredData : countryListOptions
            } as any)
        )

        return
      }

      // For API-based data, use debounced search
      debouncedMenuSearch(menuName, query)
    },
    [debouncedMenuSearch]
  )

  // Do not change any functionalities below

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

  const handleCheckbox = useCallback((id: string | number, menuName: string) => {
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
    (menuName: string) => {
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
    setFilterCount?.(localFilterCount)
    onApplyFilters?.(selectedOptions)
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
        filterLabels={filterLabels}
        selectedOptions={selectedOptions}
        isSubmitting={onSubmitLoading}
        selectedItem={selectedMenu}
        onSelectItem={handleMenuClick}
      >
        {selectedMenu === 'Exporting country' && (
          <FilterContent
            menuName='Exporting country'
            searchQuery={searchQuery}
            onSearch={query => handleSearch(query, 'Exporting country')}
            selectedOptions={selectedOptions['Exporting country']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('Exporting country')}
            items={menuData['Exporting country']}
            isAllSelected={isAllSelected('Exporting country')}
            searchLoading={searchLoading}
            placeholder={`${t('compliance_module.search_countries')}...`}
          />
        )}

        {selectedMenu === 'Exporter' && (
          <FilterContent
            menuName='Exporter'
            searchQuery={searchQuery}
            onSearch={query => handleSearch(query, 'Exporter')}
            selectedOptions={selectedOptions['Exporter']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('Exporter')}
            items={menuData['Exporter']}
            isAllSelected={isAllSelected('Exporter')}
            searchLoading={searchLoading}
            placeholder={`${t('compliance_module.search_exporters')}...`}
          />
        )}
        {selectedMenu === 'Importer' && (
          <FilterContent
            menuName='Importer'
            searchQuery={searchQuery}
            onSearch={query => handleSearch(query, 'Importer')}
            selectedOptions={selectedOptions['Importer']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('Importer')}
            items={menuData['Importer']}
            isAllSelected={isAllSelected('Importer')}
            searchLoading={searchLoading}
            placeholder={`${t('compliance_module.search_importers')}...`}
          />
        )}
        {selectedMenu === 'Documents' && (
          <FilterContent
            menuName='Documents'
            searchQuery={searchQuery}
            onSearch={query => handleSearch(query, 'Documents')}
            selectedOptions={selectedOptions['Documents']}
            onOptionChange={handleCheckbox}
            selectAllHandler={() => handleSelectAll('Documents')}
            items={menuData['Documents']}
            isAllSelected={isAllSelected('Documents')}
            searchLoading={searchLoading}
            placeholder={`${t('compliance_module.search_documents')}...`}
          />
        )}
      </CustomFilterDrawer>
    </>
  )
}

export default SpeciesShipmentFilterDrawer
