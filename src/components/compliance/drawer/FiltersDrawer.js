import React, { useCallback, useEffect, useMemo, useState } from 'react'
import countryList from 'react-select-country-list'
import { useTheme } from '@mui/material/styles'
import { getSpeciesList } from 'src/lib/api/compliance/exports'
import { getDocumentTypeList, getMasterImports } from 'src/lib/api/compliance/masters'
import { Toaster } from 'react-hot-toast'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'

const FiltersDrawer = ({
  openFilterDrawer,
  onCloseFilterDrawer,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions,
  contextId // Don't include contextId in props. As I was having this requirement for API call I used it here
}) => {
  const [selectedMenu, setSelectedMenu] = useState('Species') // Change state value to select default menu item
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [menuData, setMenuData] = useState({
    // Change state keys as per your requirement
    Species: [],
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })

  const [selectedOptions, setSelectedOptions] = useState({
    // Change state keys as per your requirement
    Species: [],
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })

  const leftMenu = ['Species', 'Exporting country', 'Exporter', 'Importer', 'Documents'] // Change Items as per your requirement

  const theme = useTheme()
  const countryListOptions = useMemo(() => countryList().getData(), []) // Just to show how it works with already existing data is used. If not requirement remove this

  // Fetch data for specific menu
  const fetchMenuData = useCallback(
    async menuName => {
      try {
        setSearchLoading(true)
        let data = []
        let params

        switch (menuName) {
          case 'Species': // Change case name as per your requirement
            const speciesRes = await getSpeciesList() // Change API as per your requirement
            data = speciesRes.success
              ? speciesRes?.data?.data?.map(item => ({
                  label: item?.common_name || item?.scientific_name || '',
                  image: item?.default_icon || '/images/default_specie_icon.png',
                  value: item?.taxonomy_id || ''
                }))
              : []
            break
          case 'Exporting country':
            data = countryListOptions
            break
          case 'Exporter': // Change case name as per your requirement
            params = {
              type: 'exporter'
            }
            const exportersRes = await getMasterImports(params) // Change API as per your requirement
            data = exportersRes.success
              ? exportersRes?.data?.data?.map(item => ({ label: item.name, value: item.id }))
              : []
            break
          case 'Importer': // Change case name as per your requirement
            params = {
              type: 'importer'
            }
            const importersRes = await getMasterImports(params) // Change API as per your requirement
            data = importersRes.success
              ? importersRes?.data?.data?.map(item => ({ label: item.name, value: item.id }))
              : []
            break
          case 'Documents': // Change case name as per your requirement
            params = {
              context_id: contextId,
              status: 1
            }
            const documentsRes = await getDocumentTypeList(params) // Change API as per your requirement
            console.log('documentsRes', documentsRes)
            data = documentsRes.success
              ? documentsRes?.data?.records.map(item => ({ label: item.name, value: item.id }))
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
        console.error(`Error fetching ${menuName} data:`, error)
        Toaster({ type: 'error', message: `Failed to load ${menuName} options` })
      } finally {
        setSearchLoading(false)
      }
    },
    [selectedMenu]
  )

  // Debounced search for menu items

  const debouncedMenuSearch = useCallback(
    debounce(async (query, menuName) => {
      if (!query) {
        await fetchMenuData(menuName)

        return
      }

      try {
        setSearchLoading(true)
        let data = []
        let params

        switch (menuName) {
          case 'Exporting country': // Change case name as per your requirement
            // Filter local country data
            data = countryListOptions.filter(item => item.label.toLowerCase().includes(query.toLowerCase())) // Change API as per your requirement
            break

          case 'Species': // Change case name as per your requirement
            // Make fresh API call for species search
            const speciesRes = await getSpeciesList({ q: query }) // Change API as per your requirement
            data = speciesRes.success
              ? speciesRes?.data?.data?.map(item => ({
                  label: item?.common_name || item?.scientific_name || '',
                  image: item?.default_icon || '/images/default_specie_icon.png',
                  value: item?.taxonomy_id || ''
                }))
              : []
            break

          case 'Exporter': // Change case name as per your requirement
            params = { type: 'exporter', q: query }
            const exportersRes = await getMasterImports(params) // Change API as per your requirement
            data = exportersRes.success
              ? exportersRes?.data?.data?.map(item => ({
                  label: item.name,
                  value: item.id
                }))
              : []
            break

          case 'Importer': // Change case name as per your requirement
            params = { type: 'importer', q: query }
            const importersRes = await getMasterImports(params) // Change API as per your requirement
            data = importersRes.success
              ? importersRes?.data?.data?.map(item => ({
                  label: item.name,
                  value: item.id
                }))
              : []
            break
          case 'Documents': // Change case name as per your requirement
            const params = {
              context_id: contextId,
              status: 1,
              q: query
            }
            const documentsRes = await getDocumentTypeList(params) // Change API as per your requirement
            console.log('documentsRes', documentsRes)
            data = documentsRes.success
              ? documentsRes?.data?.records.map(item => ({ label: item.name, value: item.id }))
              : []
            break

          default:
            return
        }

        setMenuData(prev => ({
          ...prev,
          [menuName]: data
        }))
      } catch (error) {
        console.error(`Error searching ${menuName}:`, error)
        Toaster({ type: 'error', message: `Failed to search ${menuName}` })
      } finally {
        setSearchLoading(false)
      }
    }, 500),
    [menuData, countryListOptions, getSpeciesList, getMasterImports]
  )

  // Clear all filters
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
    setFilterCount(0)
  }, [])

  // Handle search input
  const handleSearch = useCallback(
    (query, menuName) => {
      setSearchQuery(query)

      // Just to show how it works with already existing data is used. If not required remove this
      // For locally available data (countries), filter immediately
      if (menuName === 'Exporting country') {
        const filteredData = countryListOptions.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
        setMenuData(prev => ({
          ...prev,
          [menuName]: query ? filteredData : countryListOptions
        }))

        return
      }

      // For API-based data, use debounced search
      debouncedMenuSearch(query, menuName)
    },
    [debouncedMenuSearch, countryListOptions]
  )

  // Do not change any functionalities below

  const handleFilterDrawerOpen = async () => {
    setSearchQuery('')
    fetchMenuData(selectedMenu)
  }

  // Handle menu selection
  const handleMenuClick = useCallback(
    async menuName => {
      setSelectedMenu(menuName)
      setSearchQuery('')
      if (!menuData[menuName] || menuData[menuName].length === 0) {
        await fetchMenuData(menuName)
      }
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
    if (openFilterDrawer) {
      handleFilterDrawerOpen()
    }
    if (initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
    }
  }, [openFilterDrawer])

  return (
    <CustomFilterDrawer
      open={openFilterDrawer}
      onClose={onCloseFilterDrawer}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={leftMenu}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {selectedMenu === 'Species' && ( // Change state keys as per your requirement
        <FilterContent
          menuName='Species'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Species')}
          selectedOptions={selectedOptions['Species']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Species')}
          items={menuData['Species']}
          isAllSelected={isAllSelected('Species')}
          searchLoading={searchLoading}
          theme={theme}
          placeholder='Search species...'
        />
      )}

      {selectedMenu === 'Exporting country' && ( // Change state keys as per your requirement
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
          theme={theme}
          placeholder='Search countries...'
        />
      )}

      {selectedMenu === 'Exporter' && ( // Change state keys as per your requirement
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
          theme={theme}
          placeholder='Search exporters...'
        />
      )}
      {selectedMenu === 'Importer' && ( // Change state keys as per your requirement
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
          theme={theme}
          placeholder='Search importers...'
        />
      )}
      {selectedMenu === 'Documents' && ( // Change state keys as per your requirement
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
          theme={theme}
          placeholder='Search documents...'
        />
      )}
    </CustomFilterDrawer>
  )
}

export default FiltersDrawer
