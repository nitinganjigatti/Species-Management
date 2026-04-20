import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { getSpeciesList } from 'src/lib/api/compliance/exports'
import { getDocumentTypeList } from 'src/lib/api/compliance/masters'
import { Toaster } from 'react-hot-toast'
import { debounce } from 'lodash'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterContent from 'src/components/drawers/FilterContent'
import AddPatientSiteFilter from './AddPatientSiteFilter'
import { getAllSpeciesListForHospital } from 'src/lib/api/hospital/inpatient'
import { useAuth } from 'src/hooks/useAuth'

const AddPatientFiltersDrawer = ({
  openFilterDrawer,
  onCloseFilterDrawer,
  onSubmitLoading,
  onApplyFilters,
  setFilterCount,
  initialSelectedOptions,
  filterCount
}) => {
  const auth = useAuth()

  const [selectedMenu, setSelectedMenu] = useState('Gender')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [localFilterCount, setLocalFilterCount] = useState(0)

  const [menuData, setMenuData] = useState({
    Gender: [],
    Species: [],
    Site: [],
    Section: [],
    Enclosure: []
  })

  const [selectedOptions, setSelectedOptions] = useState({
    Gender: [],
    Species: [],
    Site: [],
    Section: [],
    Enclosure: []
  })

  const [localSelections, setLocalSelections] = useState({
    Sites: initialSelectedOptions?.Site || [],
    Sections: initialSelectedOptions?.Section || [],
    Enclosures: initialSelectedOptions?.Enclosure || []
  })

  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const leftMenu = ['Gender', 'Species', 'Site'] // Change Items as per your requirement

  const theme = useTheme()

  const genderListOptions = useMemo(
    () => [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
      { label: 'Undetermined', value: 'undetermined' },
      { label: 'Indeterminate', value: 'indeterminate' }
    ],
    []
  )

  // Fetch data for specific menu
  const fetchMenuData = useCallback(
    async (menuName, query = '') => {
      try {
        setSearchLoading(true)
        let data = []
        let params = {}

        switch (menuName) {
          case 'Gender':
            data = query
              ? genderListOptions.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
              : genderListOptions
            break
          case 'Species':
            params = query ? { q: query, zoo_id: zooId } : { zoo_id: zooId }
            const speciesRes = await getAllSpeciesListForHospital(params)
            data = speciesRes.success
              ? speciesRes?.data?.taxonomy_list?.map(item => ({
                  label: item?.default_common_name || '',
                  scientific_name: item?.complete_name || '',
                  default_icon: item?.default_icon,

                  // image: item?.default_icon || '/images/default_specie_icon.png',
                  value: Number(item?.tsn) || ''
                }))
              : []
            break

          // case 'Site':
          //   params = {
          //     status: 1
          //   }
          //   if (query) params.q = query
          //   const siteRes = await getDocumentTypeList(params)
          //   data = siteRes.success
          //     ? siteRes?.data?.records.map(item => ({
          //         label: item.name,
          //         value: item.id
          //       }))
          //     : []
          //   break

          // case 'Section':
          //   // Fetch sections based on selected site
          //   if (selectedOptions.Site.length === 1) {
          //     const siteId = selectedOptions.Site[0]
          //     params = { site_id: siteId, status: 1 }
          //     if (query) params.q = query
          //     const sectionRes = await getDocumentTypeList(params) // Replace with actual API
          //     data = sectionRes.success
          //       ? sectionRes?.data?.records.map(item => ({
          //           label: item.name,
          //           value: item.id
          //         }))
          //       : []
          //   }
          //   break

          // case 'Enclosure':
          //   // Fetch enclosures based on selected section
          //   if (selectedOptions.Section.length === 1) {
          //     const sectionId = selectedOptions.Section[0]
          //     params = { section_id: sectionId, status: 1 }
          //     if (query) params.q = query
          //     const enclosureRes = await getDocumentTypeList(params) // Replace with actual API
          //     data = enclosureRes.success
          //       ? enclosureRes?.data?.records.map(item => ({
          //           label: item.name,
          //           value: item.id
          //         }))
          //       : []
          //   }
          //   break

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
    [selectedMenu, selectedOptions.Site, selectedOptions.Section]
  )

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setSelectedOptions({
      Gender: [],
      Species: [],
      Site: [],
      Section: [],
      Enclosure: []
    })
    setLocalSelections({
      Sites: [],
      Sections: [],
      Enclosures: []
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
      if (menuName === 'Gender') {
        const filteredData = genderListOptions.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
        setMenuData(prev => ({
          ...prev,
          [menuName]: query ? filteredData : genderListOptions
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

      // If Site selection changes, clear Section and Enclosure
      if (menuName === 'Site') {
        if (!isSelected && newOptions.Site.length === 1) {
          // When selecting first site, keep sections and enclosures for now
        } else {
          newOptions.Section = []
          newOptions.Enclosure = []
        }
      }

      // If Section selection changes, clear Enclosure
      if (menuName === 'Section') {
        newOptions.Enclosure = []
      }

      // const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
      // setLocalFilterCount(count)

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

        // If selecting all Sites, clear Section and Enclosure
        if (menuName === 'Site' && !isAllSelected) {
          newOptions.Section = []
          newOptions.Enclosure = []
        }

        // If selecting all Sections, clear Enclosure
        if (menuName === 'Section' && !isAllSelected) {
          newOptions.Enclosure = []
        }

        // const count = Object.values(newOptions).reduce((acc, curr) => acc + curr.length, 0)
        // setLocalFilterCount(count)

        return newOptions
      })
    },
    [menuData]
  )

const getFilterCount = () => {
  const hasSiteFilter =
    (localSelections.Sites?.length || 0) > 0 ||
    (localSelections.Sections?.length || 0) > 0 ||
    (localSelections.Enclosures?.length || 0) > 0
  const genderCount = selectedOptions.Gender?.length || 0
  const speciesCount = selectedOptions.Species?.length || 0

  return genderCount + speciesCount + (hasSiteFilter ? 1 : 0)
}

useEffect(() => {
  const siteIds = localSelections.Sites?.map(item => item?.site_id ?? item) || []
  const sectionIds = localSelections.Sections?.map(item => item?.section_id ?? item) || []
  const enclosureIds = localSelections.Enclosures?.map(item => item?.enclosure_id ?? item) || []

  setSelectedOptions(prev => ({
    ...prev,
    Site: siteIds,
    Section: sectionIds,
    Enclosure: enclosureIds
  }))

  setLocalFilterCount(getFilterCount())
}, [localSelections, selectedOptions.Gender, selectedOptions.Species])

  const applyFilters = () => {
    const convertToNumbers = arr => arr?.map(id => Number(id)) || []

    setFilterCount(getFilterCount())
    onApplyFilters({
      ...selectedOptions,
      Site: convertToNumbers(localSelections.Sites?.map(item => item?.site_id ?? item)),
      Section: convertToNumbers(localSelections.Sections?.map(item => item?.section_id ?? item)),
      Enclosure: convertToNumbers(localSelections.Enclosures?.map(item => item?.enclosure_id ?? item))
    })
  }

  const isAllSelected = menuName => {
    return menuData[menuName]?.length > 0 && selectedOptions[menuName]?.length === menuData[menuName]?.length
  }

  // Fetch hierarchical data when dependencies change
  useEffect(() => {
    if (selectedOptions.Site.length === 1) {
      fetchMenuData('Section')
    }
  }, [selectedOptions.Site])

  useEffect(() => {
    if (selectedOptions.Section.length === 1) {
      fetchMenuData('Enclosure')
    }
  }, [selectedOptions.Section])

  useEffect(() => {
    if (openFilterDrawer) {
      handleFilterDrawerOpen()
    }
    if (initialSelectedOptions) {
      setSelectedOptions(initialSelectedOptions)
    }
  }, [openFilterDrawer])

  const handleCloseFilterDrawer = () => {
    // setLocalSelections({
    //   Sites: initialSelectedOptions?.Site || [],
    //   Sections: initialSelectedOptions?.Section || [],
    //   Enclosures: initialSelectedOptions?.Enclosure || []
    // })

    // setSelectedOptions(initialSelectedOptions || {})
    // setLocalFilterCount(0)
    onCloseFilterDrawer()
  }

  return (
    <CustomFilterDrawer
      open={openFilterDrawer}
      onClose={handleCloseFilterDrawer}
      onApply={applyFilters}
      onClearAll={handleClearAll}
      filterLists={leftMenu}
      selectedOptions={selectedOptions}
      isSubmitting={onSubmitLoading}
      selectedItem={selectedMenu}
      onSelectItem={handleMenuClick}
    >
      {selectedMenu === 'Gender' && (
        <FilterContent
          menuName='Gender'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Gender')}
          selectedOptions={selectedOptions['Gender']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Gender')}
          items={menuData['Gender']}
          isAllSelected={isAllSelected('Gender')}
          searchLoading={searchLoading}
          placeholder='Search gender...'
          enableSelectAll
        />
      )}

      {selectedMenu === 'Species' && (
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
          placeholder='Search species...'
          enableSelectAll
        />
      )}

      {selectedMenu === 'Site' && (
        <AddPatientSiteFilter
          menuName='Site'
          searchQuery={searchQuery}
          onSearch={query => handleSearch(query, 'Site')}
          selectedOptions={selectedOptions['Site']}
          onOptionChange={handleCheckbox}
          selectAllHandler={() => handleSelectAll('Site')}
          items={menuData['Site']}
          isAllSelected={isAllSelected('Site')}
          searchLoading={searchLoading}
          localSelections={localSelections}
          setLocalSelections={setLocalSelections}
          placeholder='Search sites...'
        />
      )}
    </CustomFilterDrawer>
  )
}

export default AddPatientFiltersDrawer
