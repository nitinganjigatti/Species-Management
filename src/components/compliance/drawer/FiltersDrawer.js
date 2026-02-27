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
    async (menuName, query = '') => {
      try {
        setSearchLoading(true)
        let data = []
        let params = {}

        switch (menuName) {
          case 'Species':
            params = query ? { q: query } : {}
            const speciesRes = await getSpeciesList(params)
            data = speciesRes.success
              ? speciesRes?.data?.data?.map(item => ({
                  label: item?.common_name || item?.scientific_name || '',
                  image: item?.default_icon || '/images/default_specie_icon.png',
                  value: item?.taxonomy_id || ''
                }))
              : []
            break

          case 'Exporting country':
            data = query
              ? countryListOptions.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
              : countryListOptions
            break

          case 'Exporter':
            params = { type: 'exporter' }
            if (query) params.q = query
            const exportersRes = await getMasterImports(params)
            data = exportersRes.success
              ? exportersRes?.data?.data?.map(item => ({
                  label: item.name,
                  value: item.id
                }))
              : []
            break

          case 'Importer':
            params = { type: 'importer' }
            if (query) params.q = query
            const importersRes = await getMasterImports(params)
            data = importersRes.success
              ? importersRes?.data?.data?.map(item => ({
                  label: item.name,
                  value: item.id
                }))
              : []
            break

          case 'Documents':
            params = {
              context_id: contextId,
              status: 1
            }
            if (query) params.q = query
            const documentsRes = await getDocumentTypeList(params)
            data = documentsRes.success
              ? documentsRes?.data?.records.map(item => ({
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
          message: `Failed to ${query ? 'search' : 'load'} ${menuName} options`
        })
      } finally {
        setSearchLoading(false)
      }
    },
    [selectedMenu]
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

  // Debounced search for menu items
  const debouncedMenuSearch = useCallback(
    debounce(async (menuName, query) => {
      await fetchMenuData(menuName, query)
    }, 500),
    [menuData]
  ) // Don't update this function

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
    async menuName => {
      setSelectedMenu(menuName)
      setSearchQuery('')
      await fetchMenuData(menuName, '')
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
        (<FilterContent
          menuName='Species'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Species')}
          selectedOptions={selectedOptions['Species']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Species')}
          items={menuData['Species']}
          isAllSelected={isAllSelected('Species')}
          searchLoading={searchLoading}
          placeholder='Search species...'
        />)
      )}
      {selectedMenu === 'Exporting country' && ( // Change state keys as per your requirement
        (<FilterContent
          menuName='Exporting country'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Exporting country')}
          selectedOptions={selectedOptions['Exporting country']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Exporting country')}
          items={menuData['Exporting country']}
          isAllSelected={isAllSelected('Exporting country')}
          searchLoading={searchLoading}
          placeholder='Search countries...'
        />)
      )}
      {selectedMenu === 'Exporter' && ( // Change state keys as per your requirement
        (<FilterContent
          menuName='Exporter'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Exporter')}
          selectedOptions={selectedOptions['Exporter']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Exporter')}
          items={menuData['Exporter']}
          isAllSelected={isAllSelected('Exporter')}
          searchLoading={searchLoading}
          placeholder='Search exporters...'
        />)
      )}
      {selectedMenu === 'Importer' && ( // Change state keys as per your requirement
        (<FilterContent
          menuName='Importer'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Importer')}
          selectedOptions={selectedOptions['Importer']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Importer')}
          items={menuData['Importer']}
          isAllSelected={isAllSelected('Importer')}
          searchLoading={searchLoading}
          placeholder='Search importers...'
        />)
      )}
      {selectedMenu === 'Documents' && ( // Change state keys as per your requirement
        (<FilterContent
          menuName='Documents'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Documents')}
          selectedOptions={selectedOptions['Documents']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Documents')}
          items={menuData['Documents']}
          isAllSelected={isAllSelected('Documents')}
          searchLoading={searchLoading}
          placeholder='Search documents...'
        />)
      )}
    </CustomFilterDrawer>
  );
}

export default FiltersDrawer
