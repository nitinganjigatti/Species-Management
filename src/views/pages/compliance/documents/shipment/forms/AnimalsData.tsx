import React, { useState, useCallback, useEffect, useRef } from 'react'
import SpeciesDetailsContainer from '../shipment-view/SpeciesDetails'
import SpeciesAddEdit from '../shipment-view/SpeciesAddEdit'
import { getExportList } from 'src/lib/api/compliance/exports'
import { createShipmentSpecies, getShipmentSpeciesData, updateShipmentSpecies } from 'src/lib/api/compliance/shipment'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import Toaster from 'src/components/Toaster'
import AddAnimalCountDrawer from '../drawer/AddAnimalCountDrawer'
import { MastersData, Species } from 'src/types/compliance'

interface AnimalItem {
  id?: string | number
  export_animal_id?: string | number
  gender?: string
  identifier_type?: string
  identifier_value?: string
  animal_type?: string
  animal_count?: number
  [key: string]: unknown
}

interface SpeciesData {
  id?: string | number
  tsn_id?: string | number
  taxonomy_id?: string | number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  shipment_species_id?: string | number
  male_count?: number
  female_count?: number
  undeterminate_count?: number
  total_count?: number
  animals?: AnimalItem[]
  [key: string]: unknown
}

interface SpeciesItem {
  id: string | number
  species: SpeciesData
}

interface ExportItem {
  export_id?: string | number
  export_number?: string
  attachment?: unknown
  species?: SpeciesData[]
  [key: string]: unknown
}

interface OtherItem {
  species?: SpeciesData
  [key: string]: unknown
}

interface SelectedExportData {
  export: ExportItem[]
  others: OtherItem[]
}

interface DraftData {
  export: ExportItem[]
  others: SpeciesItem[]
}

interface PaginationModel {
  page: number
  pageSize: number
  hasMore?: boolean
}

interface AnimalsDataProps {
  onEditClick: React.MutableRefObject<(() => void) | null>
  setShowEditAnimals: React.Dispatch<React.SetStateAction<boolean>>
  shipmentId: string | number
  totalSpecies: number
  totalAnimals: number
  setTotalAnimals: React.Dispatch<React.SetStateAction<number>>
  setTotalSpecies: React.Dispatch<React.SetStateAction<number>>
  setExpanded: React.Dispatch<React.SetStateAction<string[]>>
  fetchLinkedDocuments: () => void
  mastersData: MastersData
}

const AnimalsData = ({
  onEditClick,
  setShowEditAnimals,
  shipmentId,
  totalSpecies,
  totalAnimals,
  setTotalAnimals,
  setTotalSpecies,
  setExpanded,
  fetchLinkedDocuments,
  mastersData
}: AnimalsDataProps) => {
  const router = useRouter()
  const { id, action, export: exportCount } = router.query
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState<boolean>(false)
  const [exportPermitDrawerOpen, setexportPermitDrawerOpen] = useState<boolean>(false)
  const [linkedShipmentsDrawerOpen, setLinkedShipmentsDrawerOpen] = useState<boolean>(false)
  const [linkedShipmentsData, setlinkedShipmentsData] = useState<unknown[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 })
  const [exportsList, setexportsList] = useState<unknown[]>([])
  const [exportsTotalCount, setexportsTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loader, setLoader] = useState<boolean>(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentSpeciesId, setCurrentSpeciesId] = useState<string | number | null>(null)
  const [selectedSpeciesData, setSelectedSpeciesData] = useState<Species & { common_name?: string; scientific_name?: string; default_icon?: string }>({})
  const [animalCountDrawerOpen, setanimalCountDrawerOpen] = useState<boolean>(false)
  const [speciesList, setSpeciesList] = useState<SpeciesItem[]>([])
  const [draftData, setDraftData] = useState<DraftData>({ export: [], others: [] })

  const [selectedExportData, setSelectedExportData] = useState<SelectedExportData>({
    export: [],
    others: []
  })
  const [addAnimalsDrawerOpen, setAddAnimalsDrawerOpen] = useState<boolean>(false)
  const [exportID, setexportID] = useState<string>('')
  const [exportNumber, setExportNumber] = useState<string>('')
  const [animalDetails, setAnimalDetails] = useState<AnimalItem[]>([])
  const [exportAnimalData, setexportAnimalData] = useState<unknown[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [animalDetailsDrawerOpen, setanimalDetailsDrawerOpen] = useState<boolean>(false)
  const [detailtype, setDetailType] = useState<string>('')

  const handleExportCardSelect = useCallback(
    (exportData: SelectedExportData) => {
      setSelectedExportData(prev => ({
        ...prev,
        ...exportData,
        others: (speciesList.length > 0 ? speciesList : prev.others) as OtherItem[]
      }))
    },
    [speciesList]
  )

  const handleRemoveExportDataAtIndex = (exportIdToRemove: string | number) => {
    setSelectedExportData(prev => ({
      ...prev,
      export: prev.export.filter(exportItem => exportItem.export_id !== exportIdToRemove)
    }))
  }

  const handleEditClick = () => {
    setShowEditAnimals(true) // triggered from parent
  }

  const handleLinkedshipmentClick = (linkedshipments: unknown[]) => {
    setLinkedShipmentsDrawerOpen(true)
    setlinkedShipmentsData(linkedshipments)
  }

  React.useEffect(() => {
    if (onEditClick) onEditClick.current = handleEditClick
    if (shipmentId) {
      fetchShipmentspeciesDetails()
    }
  }, [onEditClick, shipmentId])

  useEffect(() => {
    setDraftData(prev => ({
      ...prev,
      others: speciesList
    }))
  }, [speciesList])

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement
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
            limit: paginationModel.pageSize,
            excludeShipped: 1
          }

          const response = await getExportList(params)
          if (response?.success && response.data?.records && response.data.records.length > 0) {
            setexportsList(prev => [...prev, ...response.data!.records!])
            setPaginationModel(prev => ({
              ...prev,
              page: nextPage,
              hasMore: response.data!.records!.length === prev.pageSize
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

  const fetchExportList = useCallback(
    async (reset = false) => {
      setIsLoading(true)
      setLoader(true)
      try {
        const params = {
          q: searchValue,
          page_no: reset ? 1 : paginationModel.page + 1,
          limit: paginationModel.pageSize,
          excludeShipped: 1
        }

        const response = await getExportList(params)
        if (response?.success) {
          setexportsList(reset ? (response.data?.records ?? []) : (prev: unknown[]) => [...prev, ...(response.data?.records ?? [])])
          setexportsTotalCount(response.data?.total_count ?? 0)
          setPaginationModel(prev => ({
            ...prev,
            page: reset ? 1 : prev.page,
            hasMore: (response.data?.records?.length ?? 0) === prev.pageSize
          }))
        }
      } catch (e) {
        setLoader(false)
        console.error(e)
      } finally {
        setLoader(false)
        setIsLoading(false)
      }
    },
    [searchValue, paginationModel.pageSize]
  )

  useEffect(() => {
    fetchExportList(true)
  }, [searchValue])

  const debouncedSearch = useCallback(
    debounce((val: string) => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = (val: string) => {
    debouncedSearch(val)
  }

  const handleSpeciesSelect = (selectedSpecies: Species[]) => {
    const newSpeciesItems = selectedSpecies
      .filter(species => !speciesList.some(existing => existing.species.tsn_id === species.tsn_id))
      .map(species => {
        setCurrentSpeciesId(species.tsn_id ?? null)
        setSelectedSpeciesData(species as Species & { common_name?: string; scientific_name?: string; default_icon?: string })

return {
          id: species.tsn_id as string | number,
          species: {
            id: species.tsn_id,
            tsn_id: species.tsn_id,
            taxonomy_id: species.taxonomy_id || species.tsn_id,
            common_name: species.common_name,
            scientific_name: species.scientific_name || (species as Record<string, unknown>).complete_name as string,
            default_icon: species.default_icon,
            male_count: 0,
            female_count: 0,
            undeterminate_count: 0,
            total_count: 0,
            animals: []
          }
        }
      })
    console.log(speciesList, 'speciesList')
    const updatedSpeciesList = [...speciesList, ...newSpeciesItems]

    setSpeciesList(updatedSpeciesList)

    setSpeciesDrawerOpen(false)
    setanimalCountDrawerOpen(true)
  }

  const handleAnimalDataSave = (
    speciesId: string | number,
    genderCounts: { male_count: number; female_count: number; undeterminate_count: number },
    animalDetails: Array<{
      animal_type: string
      animal_count: number
      gender?: string
      identifier_type?: string
      identifier_value?: string
    }>
  ) => {
    const updatedSpeciesList = speciesList.map(species => {
      if (species.id === speciesId) {
        const total_count =
          Number(genderCounts.male_count) + Number(genderCounts.female_count) + Number(genderCounts.undeterminate_count)

        return {
          ...species,
          species: {
            ...species.species,
            male_count: Number(genderCounts.male_count),
            female_count: Number(genderCounts.female_count),
            undeterminate_count: Number(genderCounts.undeterminate_count),
            total_count,
            animals: animalDetails.map(animal => ({
              animal_type: animal.gender === 'Unknown' ? 'group' : 'single',
              animal_count: 1,
              gender: animal?.gender,
              identifier_type: animal?.identifier_type,
              identifier_value: animal.identifier_value
            }))
          }
        }
      }

return species
    })

    setSpeciesList(updatedSpeciesList)

    setSelectedExportData(prev => ({
      ...prev,
      others: updatedSpeciesList as unknown as OtherItem[]
    }))

    setDraftData(prev => ({
      ...prev,
      others: updatedSpeciesList
    }))
    setanimalCountDrawerOpen(false)
  }

  const handleClose = () => {
    const selectedSpeciesIds = selectedExportData?.others?.map(item => (item as unknown as SpeciesItem).id)

    const filteredDraftData = draftData.others.filter(item => selectedSpeciesIds.includes(item.id))

    const filteredSpeciesList = speciesList.filter(item => selectedSpeciesIds.includes(item.id))

    setDraftData(prev => ({
      ...prev,
      others: filteredDraftData
    }))

    setSpeciesList(filteredSpeciesList)

    setanimalCountDrawerOpen(false)
  }

  const handleSave = async () => {
    if (!shipmentId) return

    const payload: Record<string, unknown> = {}
    setLoading(true)

    // Handle export data
    selectedExportData.export.forEach((exp, index) => {
      // species as JSON string
      payload[`export[${index}][species]`] = JSON.stringify(
        (exp.species || []).map(spec => ({
          export_id: spec.export_id || '',
          taxonomy_id: spec.taxonomy_id || null,
          common_name: spec.common_name || '',
          scientific_name: spec.scientific_name || '',

          //default_icon: '', // or use spec.default_icon if available
          shipment_species_id: spec?.shipment_species_id || '',
          appendix: spec.appendix || '',
          male_count: parseInt(String(spec.male_count)) || 0,
          female_count: parseInt(String(spec.female_count)) || 0,
          undeterminate_count: parseInt(String(spec.undeterminate_count)) || 0,
          animals: (spec.animals || []).map(animal => ({
            export_animal_id: animal.id || '',
            gender: animal.gender || '',
            identifier_type: animal.identifier_type || '',
            identifier_value: animal.identifier_value || '',
            animal_type: animal.animal_type || '',
            animal_count: parseInt(String(animal.animal_count)) || 0
          }))
        }))
      )

      payload[`export[${index}][attachment]`] = exp.attachment
    })

    selectedExportData.others.forEach((item, index) => {
      const species = (item as unknown as SpeciesItem).species
      payload[`others[${index}][species]`] = JSON.stringify([
        {
          taxonomy_id: species.taxonomy_id || '',
          common_name: species.common_name || '',
          scientific_name: species.scientific_name || '',
          shipment_species_id: species.shipment_species_id || '',
          default_icon: species.default_icon ? species.default_icon.split('path=')[1] : '',
          male_count: parseInt(String(species.male_count)) || 0,
          female_count: parseInt(String(species.female_count)) || 0,
          undeterminate_count: parseInt(String(species.undeterminate_count)) || 0,
          animals: (species.animals || []).map(animal => ({
            // id: animal.id,
            gender: animal.gender || '',
            identifier_type: animal.identifier_type || '',
            identifier_value: animal.identifier_value || '',
            animal_type: animal.animal_type || '',
            animal_count: parseInt(String(animal.animal_count)) || 0
          }))
        }
      ])
    })

    try {
      const response =
        Number(exportCount) > 0
          ? await updateShipmentSpecies(shipmentId, payload)
          : await createShipmentSpecies(shipmentId, payload)
      if (response?.success) {
        setShowEditAnimals(true)
        setLoading(false)
        router.push(`/compliance/documents/shipments/AddEditShipment/?id=${id}&action=details&export=1`)
        Toaster({ type: 'success', message: response?.message })
        fetchShipmentspeciesDetails()
        setExpanded(['permit-details'])
        fetchLinkedDocuments()
      } else {
        setLoading(false)
        Toaster({ type: 'error', message: response?.message })
        console.error('API Error:', response?.message)
      }
    } catch (error) {
      setLoading(false)
      console.error('Exception:', error)
    }
  }

  const fetchShipmentspeciesDetails = async () => {
    try {
      const response = await getShipmentSpeciesData(shipmentId)
      if (response?.success) {
        const exports = response?.data?.exports || []
        const others = response?.data?.others || []

        // Set main export and others data

        setTotalSpecies(response?.data?.total_species as number)
        setTotalAnimals(response?.data?.total_animals as number)

        const rawExports = (exports as ExportItem[]).map((exp: ExportItem) => ({
          ...exp,
          species: (exp.species || []).map(spec => ({
            ...spec,
            male_count: parseInt(String(spec.male_count)) || 0,
            female_count: parseInt(String(spec.female_count)) || 0,
            undeterminate_count: parseInt(String(spec.undeterminate_count)) || 0,
            animals: (spec.animals || []).map(animal => ({
              ...animal,
              id: animal.export_animal_id || ''
            }))
          }))
        }))

        const speciesList = (others as OtherItem[]).flatMap(item =>
          (Array.isArray((item as Record<string, unknown>).species) ? (item as Record<string, unknown>).species as SpeciesData[] : []).map(spec => ({
            id: spec.taxonomy_id || '',
            species: {
              id: spec.taxonomy_id || '',
              tsn_id: spec.taxonomy_id || '',
              taxonomy_id: spec.taxonomy_id || '',
              common_name: spec.common_name || '',
              scientific_name: spec.scientific_name || '',
              shipment_species_id: spec?.shipment_species_id || '',
              male_count: parseInt(String(spec.male_count)) || 0,
              female_count: parseInt(String(spec.female_count)) || 0,
              undeterminate_count: parseInt(String(spec.undeterminate_count)) || 0,
              animals: (spec.animals || []).map(animal => ({
                //export_animal_id: animal.export_animal_id || '',
                gender: animal.gender,
                identifier_type: animal.identifier_type,
                identifier_value: animal.identifier_value || '',
                animal_type: animal.animal_type || '',
                animal_count: parseInt(String(animal.animal_count)) || 0
              }))
            }
          }))
        )

        setSpeciesList(speciesList)
        setSelectedExportData({ export: rawExports, others: speciesList })
        setDraftData({ export: rawExports, others: speciesList })
      } else {
        // setLoader(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      // Toaster({ type: 'error', message: 'Error fetching shipment basic details' })
    }
  }

  const handleReset = () => {
    //setShowEditAnimals(false)
    setSelectedExportData({ export: [], others: [] })
    setDraftData({ export: [], others: [] })
    setSpeciesList([])
  }

  return (
    <>
      {(shipmentId && action === 'edit') || Number(exportCount) == 0 ? (
        <SpeciesAddEdit
          onSave={handleSave}
          onCancel={handleReset}
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
          scrollContainerRef={scrollContainerRef as any}
          handleScroll={handleScroll}
          isLoading={isLoading}
          loader={loader}
          onExportCardSelect={handleExportCardSelect as any}
          handleRemoveExportDataAtIndex={handleRemoveExportDataAtIndex}
          selectedExportData={selectedExportData as any}
          setSelectedExportData={setSelectedExportData as any}
          setDraftData={setDraftData as any}
          draftData={draftData as any}
          handleSpeciesSelect={handleSpeciesSelect}
          speciesList={speciesList}
          setSpeciesList={setSpeciesList as any}
          setAddAnimalsDrawerOpen={setAddAnimalsDrawerOpen}
          addAnimalsDrawerOpen={addAnimalsDrawerOpen}
          setexportAnimalData={setexportAnimalData}
          exportAnimalData={exportAnimalData}
          setexportID={setexportID}
          exportID={exportID}
          setExportNumber={setExportNumber}
          exportNumber={exportNumber}
          linkedShipmentsData={linkedShipmentsData}
          setLoading={setLoading}
          loading={loading}
          setanimalDetailsDrawerOpen={setanimalDetailsDrawerOpen}
          animalDetailsDrawerOpen={animalDetailsDrawerOpen}
          setAnimalDetails={setAnimalDetails}
          animalDetails={animalDetails}
          setDetailType={setDetailType}
          detailtype={detailtype}
          setanimalCountDrawerOpen={setanimalCountDrawerOpen}
          setCurrentSpeciesId={setCurrentSpeciesId}
          setSelectedSpeciesData={setSelectedSpeciesData}
          setSearchValue={setSearchValue}
          shipmentId={shipmentId}
        />
      ) : shipmentId && action === 'details' ? (
        <SpeciesDetailsContainer
          selectedExportData={selectedExportData as any}
          totalAnimals={totalAnimals}
          totalSpecies={totalSpecies}
          setAnimalDetails={setAnimalDetails}
          animalDetails={animalDetails}
          setanimalDetailsDrawerOpen={setanimalDetailsDrawerOpen}
          animalDetailsDrawerOpen={animalDetailsDrawerOpen}
          setDetailType={setDetailType}
          detailtype={detailtype}
          setanimalCountDrawerOpen={setanimalCountDrawerOpen}
        />
      ) : (
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
          scrollContainerRef={scrollContainerRef as any}
          handleScroll={handleScroll}
          isLoading={isLoading}
          onExportCardSelect={handleExportCardSelect as any}
          handleRemoveExportDataAtIndex={handleRemoveExportDataAtIndex}
          selectedExportData={selectedExportData as any}
          setSelectedExportData={setSelectedExportData as any}
          setDraftData={setDraftData as any}
          draftData={draftData as any}
          handleSpeciesSelect={handleSpeciesSelect}
          speciesList={speciesList}
          setSpeciesList={setSpeciesList as any}
          setAddAnimalsDrawerOpen={setAddAnimalsDrawerOpen}
          addAnimalsDrawerOpen={addAnimalsDrawerOpen}
          setexportAnimalData={setexportAnimalData}
          exportAnimalData={exportAnimalData}
          setexportID={setexportID}
          exportID={exportID}
          setExportNumber={setExportNumber}
          exportNumber={exportNumber}
          linkedShipmentsData={linkedShipmentsData}
          setLoading={setLoading}
          loading={loading}
          setanimalDetailsDrawerOpen={setanimalDetailsDrawerOpen}
          animalDetailsDrawerOpen={animalDetailsDrawerOpen}
          setAnimalDetails={setAnimalDetails}
          animalDetails={animalDetails}
          setDetailType={setDetailType}
          detailtype={detailtype}
          setanimalCountDrawerOpen={setanimalCountDrawerOpen}
          setCurrentSpeciesId={setCurrentSpeciesId}
          setSelectedSpeciesData={setSelectedSpeciesData}
          setSearchValue={setSearchValue}
          loader={loader}
          shipmentId={shipmentId}
        />
      )}
      <AddAnimalCountDrawer
        open={animalCountDrawerOpen}
        speciesList={speciesList}
        mastersData={mastersData}
        setSpeciesList={setSpeciesList as any}
        onClose={handleClose}
        title='Add Animals'
        onDone={handleAnimalDataSave}
        currentSpeciesId={currentSpeciesId}
        selectedExportData={selectedExportData as any}
        selectedSpeciesData={selectedSpeciesData}
        setanimalDetailsDrawerOpen={setanimalDetailsDrawerOpen}
      />
    </>
  )
}

export default AnimalsData
