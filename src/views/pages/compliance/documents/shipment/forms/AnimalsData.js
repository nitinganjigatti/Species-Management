import React, { useState, useCallback, useEffect, useRef } from 'react'
import SpeciesDetailsContainer from '../view-component/SpeciesDetails'
import SpeciesAddEdit from '../view-component/SpeciesAddEdit'
import { getExportList } from 'src/lib/api/compliance/exports'
import { debounce } from 'lodash'

const AnimalsData = ({ onEditClick, showEditAnimals, setShowEditAnimals }) => {
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [exportPermitDrawerOpen, setexportPermitDrawerOpen] = useState(false)
  const [linkedShipmentsDrawerOpen, setLinkedShipmentsDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 1, pageSize: 10 })
  const [exportsList, setexportsList] = useState([])
  const [exportsTotalCount, setexportsTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const scrollContainerRef = useRef(null)
  const [draftData, setDraftData] = useState({ export: [], others: [] })
  const [selectedExportData, setSelectedExportData] = useState({
    export: [],
    others: []
  })

  // Handler to receive data from child
  const handleExportCardSelect = useCallback(exportData => {
    setSelectedExportData(exportData)
    // You can do additional processing here
  }, [])

  // const handleRemoveExportDataAtIndex = exportIdToRemove => {
  //   setSelectedExportData(prev => prev.filter((_, index) => index !== indexToRemove))
  // }

  const handleRemoveExportDataAtIndex = exportIdToRemove => {
    setSelectedExportData(prev => ({
      ...prev,
      export: prev.export.filter(exportItem => exportItem.export_id !== exportIdToRemove)
    }))
  }

  const handleSave = () => {
    setShowEditAnimals(false) // on save, hide edit
  }

  const handleEditClick = () => {
    setShowEditAnimals(true) // triggered from parent
  }

  const handleLinkedshipmentClick = () => {
    setLinkedShipmentsDrawerOpen(true)
  }

  // listen to parent instruction to trigger edit mode
  React.useEffect(() => {
    if (onEditClick) onEditClick.current = handleEditClick
  }, [onEditClick])

  const handleScroll = async e => {
    const container = e.target
    const threshold = 20

    if (exportsTotalCount > exportsList.length && !isLoading) {
      const isNearBottom =
        container.scrollHeight - Math.round(container.scrollTop) <= container.clientHeight + threshold

      if (isNearBottom) {
        try {
          setIsLoading(true)
          const nextPage = paginationModel.page + 1
          const params = {
            q: searchValue,
            page_no: nextPage,
            limit: paginationModel.pageSize
          }

          const response = await getExportList(params)
          if (response?.success && response.data.records.length > 0) {
            setexportsList(prev => [...prev, ...response.data.records])
            setPaginationModel(prev => ({
              ...prev,
              page: nextPage,
              hasMore: response.data.records.length === prev.pageSize
            }))
          }
        } catch (error) {
          console.error('Error loading more exports:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
  }

  // Modify your fetchExportList to reset properly on new searches
  const fetchExportList = useCallback(
    async (reset = false) => {
      setIsLoading(true)
      try {
        const params = {
          q: searchValue,
          page_no: reset ? 1 : paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        const response = await getExportList(params)
        if (response?.success) {
          setexportsList(reset ? response.data.records : prev => [...prev, ...response.data.records])
          setexportsTotalCount(response.data.total)
          setPaginationModel(prev => ({
            ...prev,
            page: reset ? 1 : prev.page,
            hasMore: response.data.records.length === prev.pageSize
          }))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    },
    [searchValue, paginationModel.pageSize]
  )

  // Reset to first page when search changes
  useEffect(() => {
    fetchExportList(true)
  }, [searchValue])

  const debouncedSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = val => {
    debouncedSearch(val)
  }

  return (
    <>
      {showEditAnimals ? (
        <SpeciesAddEdit
          onSave={handleSave}
          onCancel={() => setShowEditAnimals(false)}
          handleLinkedshipmentClick={handleLinkedshipmentClick}
          speciesDrawerOpen={speciesDrawerOpen}
          linkedShipmentsDrawerOpen={linkedShipmentsDrawerOpen}
          setLinkedShipmentsDrawerOpen={setLinkedShipmentsDrawerOpen}
          setSpeciesDrawerOpen={setSpeciesDrawerOpen}
          setexportPermitDrawerOpen={setexportPermitDrawerOpen}
          exportPermitDrawerOpen={exportPermitDrawerOpen}
          handleSearch={handleSearch}
          exportsList={exportsList}
          exportsTotalCount={exportsTotalCount}
          scrollContainerRef={scrollContainerRef}
          handleScroll={handleScroll}
          isLoading={isLoading}
          onExportCardSelect={handleExportCardSelect}
          handleRemoveExportDataAtIndex={handleRemoveExportDataAtIndex}
          selectedExportData={selectedExportData}
          setSelectedExportData={setSelectedExportData}
          setDraftData={setDraftData}
          draftData={draftData}
        />
      ) : (
        <SpeciesDetailsContainer />
      )}
    </>
  )
}

export default AnimalsData
