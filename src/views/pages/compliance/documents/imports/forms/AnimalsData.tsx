import React, { useState, useCallback, useEffect, useRef } from 'react'
import SpeciesDetailsContainer from '../import-view/SpeciesDetails'
import SpeciesAddEdit from '../import-view/SpeciesAddEdit'
import { getExportListForImports } from 'src/lib/api/compliance/imports'
import { createImportSpecies, getImportSpeciesData, updateImportSpecies } from 'src/lib/api/compliance/imports'
import { getMastersData } from 'src/lib/api/compliance/exports'
import { debounce } from 'lodash'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Toaster from 'src/components/Toaster'
import * as yup from 'yup'
import dayjs, { Dayjs } from 'dayjs'
import type { ExportPermit, ExportSpecies, MastersData, Id } from 'src/types/compliance'

interface AnimalsDataProps {
  onEditClick?: React.MutableRefObject<(() => void) | null>
  setShowEditAnimals: (val: boolean) => void
  importId?: Id
  totalSpecies?: number
  totalAnimals?: number
  setTotalAnimals: (count: number) => void
  setTotalSpecies: (count: number) => void
  setAirwaybillvalue: (val: string) => void
  airwaybillvalue: string
}

interface DraftData {
  export: ExportPermit[]
  others?: unknown[]
  [key: string]: unknown
}

interface PaginationModel {
  page: number
  pageSize: number
  hasMore?: boolean
}

const validationSchema = yup.object({
  airwaybillvalue: yup.string().required('Certificate Id is required'),

  startDate: yup.date().nullable().required('Date of Issue is required'),

  uploadedFile: yup
    .mixed()
    .required('File is required')
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true

      // If it's a File object (i.e., new upload)
      if ((value as File).type) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/x-png', 'application/pdf']

return allowedTypes.includes((value as File).type)
      }

      // If it's an existing uploaded file (edit mode)
      if ((value as { file_original_name?: string }).file_original_name) {
        const ext = (value as { file_original_name: string }).file_original_name.split('.').pop()!.toLowerCase()
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']

return allowedExtensions.includes(ext)
      }

      return false
    })
})

const AnimalsData = ({
  onEditClick,
  setShowEditAnimals,
  importId,
  totalSpecies,
  totalAnimals,
  setTotalAnimals,
  setTotalSpecies,
  setAirwaybillvalue,
  airwaybillvalue
}: AnimalsDataProps) => {
  const router = useSafeRouter()
  const { id, action } = router.query
  const [exportPermitDrawerOpen, setexportPermitDrawerOpen] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 })
  const [exportsList, setexportsList] = useState<ExportPermit[]>([])
  const [exportsTotalCount, setexportsTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loader, setLoader] = useState<boolean>(false)
  const [mastersData, setMastersData] = useState<MastersData>({})
  const scrollContainerRef = useRef<HTMLElement>(null as unknown as HTMLElement)
  const [draftData, setDraftData] = useState<DraftData>({ export: [] })

  const [selectedExportData, setSelectedExportData] = useState<{ export: ExportPermit[]; others?: unknown[] }>({
    export: []
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [animalDetails, setAnimalDetails] = useState<ExportSpecies>({})
  const [animalDetailsDrawerOpen, setanimalDetailsDrawerOpen] = useState<boolean>(false)
  const [detailtype, setDetailType] = useState<string>('')
  const [startDate, setStartDate] = useState<string | Date | Dayjs | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | { name?: string; file_original_name?: string; [key: string]: unknown } | null>(null)
  const [errors, setErrors] = useState<Record<string, string | null | undefined>>({})

  const handleRemoveExportDataAtIndex = (exportIdToRemove: unknown) => {
    const filterFn = (item: ExportPermit) => item.id !== exportIdToRemove

    setSelectedExportData(prev => ({ ...prev, export: prev.export.filter(filterFn) }))
    setDraftData(prev => ({ ...prev, export: prev.export.filter(filterFn) }))
  }

  const handleEditClick = () => {
    setShowEditAnimals(true)
  }

  React.useEffect(() => {
    if (onEditClick) onEditClick.current = handleEditClick
    if (importId && mastersData?.document_type_id) {
      fetchImportspeciesDetails()
    }
  }, [onEditClick, importId, mastersData])

  const handleScroll = async (e: React.UIEvent<HTMLElement>) => {
    const container = e.target as HTMLElement
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

          const response = await getExportListForImports(params)
          if (response?.success && (response.data?.records || []).length > 0) {
            setexportsList(prev => [...prev, ...(response.data?.records || [])])
            setPaginationModel(prev => ({
              ...prev,
              page: nextPage,
              hasMore: (response.data?.records || []).length === prev.pageSize
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
          limit: paginationModel.pageSize
        }

        const response = await getExportListForImports(params)
        if (response?.success) {
          setexportsList(reset ? (response.data?.records || []) : prev => [...prev, ...(response.data?.records || [])])
          setexportsTotalCount((response.data as any)?.total || response.data?.total_count || 0)
          setPaginationModel(prev => ({
            ...prev,
            page: reset ? 1 : prev.page,
            hasMore: (response.data?.records || []).length === prev.pageSize
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

  const scrollToFirstError = () => {
    const errorElements = document.querySelectorAll('[data-error="true"]')

    if (errorElements.length > 0) {
      errorElements[0].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      const firstInput = errorElements[0].querySelector('input, select, textarea') as HTMLElement | null
      if (firstInput) {
        firstInput.focus()
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const validateFields = async (): Promise<{ isValid: boolean; firstError?: string | null }> => {
    try {
      await validationSchema.validate({ airwaybillvalue, startDate, uploadedFile }, { abortEarly: false })
      const hasExports = (selectedExportData?.export?.length || 0) > 0 || (selectedExportData?.others?.length || 0) > 0

      if (!hasExports) {
        setErrors(prev => ({
          ...prev,
          selectedExportData: 'At least one species must be selected'
        }))

return { isValid: false, firstError: 'selectedExportData' }
      }

      setErrors({})

return { isValid: true }
    } catch (validationErrors: unknown) {
      const formattedErrors: Record<string, string> = {}
      let firstErrorPath: string | null = null
      ;(validationErrors as yup.ValidationError).inner.forEach(error => {
        formattedErrors[error.path!] = error.message
        if (!firstErrorPath) firstErrorPath = error.path ?? null
      })

      // Also check for selectedExportData even when Yup fails
      const hasExports = (selectedExportData?.export?.length || 0) > 0 || (selectedExportData?.others?.length || 0) > 0

      if (!hasExports) {
        formattedErrors.selectedExportData = 'At least one species must be selected'
        if (!firstErrorPath) firstErrorPath = 'selectedExportData'
      }
      setErrors(formattedErrors)

return { isValid: false, firstError: firstErrorPath }
    }
  }

  const handleSave = async () => {
    const { isValid, firstError } = await validateFields()
    if (!isValid) {
      Object.keys(errors).forEach(key => {
        const element = document.querySelector(`[name="${key}"]`)
        if (element) {
          element.closest('.MuiFormControl-root')?.setAttribute('data-error', 'true')
        }
      })

      scrollToFirstError()

return
    }

    setLoading(true)
    const exportIds = selectedExportData?.export?.map(e => Number(e.id))

    let payload = {
      import_number: airwaybillvalue,
      import_date: dayjs(startDate as string).format('YYYY-MM-DD'),
      document_type_id: mastersData.document_type_id,
      attachment: uploadedFile,
      exports: exportIds
    }

    try {
      const response = importId ? await updateImportSpecies(importId, payload) : await createImportSpecies(payload)
      if (response?.success) {
        setShowEditAnimals(true)
        setLoading(false)
        router.push(`/compliance/documents/imports/AddEditImport/?id=${response?.data?.id}&action=details`)
        Toaster({ type: 'success', message: response?.message })

        //fetchImportspeciesDetails()
      } else {
        setLoading(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      setLoading(false)
      console.error('Exception:', error)
    }
  }

  const fetchImportspeciesDetails = async () => {
    try {
      setLoader(true)
      const response = await getImportSpeciesData(importId as unknown as Id, mastersData?.document_type_id as Id)
      if (response?.success) {
        const exports = (response?.data as any)?.exports || []
        const others = response?.data || []

        setTotalSpecies((response?.data as any)?.total_species || 0)
        setTotalAnimals((response?.data as any)?.total_animals || 0)

        const rawExports = exports.map((exp: ExportPermit) => ({
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

        setSelectedExportData({ export: rawExports })
        setDraftData({ export: rawExports })
        setAirwaybillvalue((others as any).import_number)
        setStartDate((others as any).import_date ? (others as any).import_date : null)
        setUploadedFile((others as any).documents)
        setLoader(false)
      } else {
        setLoader(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      setLoader(false)
      Toaster({ type: 'error', message: 'Error fetching shipment basic details' })
    }
  }

  const handleReset = () => {
    setSelectedExportData({ export: [], others: [] })
    setDraftData({ export: [], others: [] })
    setAirwaybillvalue('')
    setStartDate(null)
    setUploadedFile(null)
  }

  const fetchMastersData = async () => {
    try {
      const res = await getMastersData()
      if (res?.success) {
        const data = res.data
        setMastersData(data as MastersData)
      }
    } catch (e) {
      console.error(e)
    } finally {
    }
  }

  useEffect(() => {
    fetchMastersData()
  }, [])

  return (
    <>
      {importId && action === 'edit' ? (
        <SpeciesAddEdit
          onSave={handleSave}
          onCancel={handleReset}
          setexportPermitDrawerOpen={setexportPermitDrawerOpen}
          exportPermitDrawerOpen={exportPermitDrawerOpen}
          handleSearch={handleSearch}
          exportsList={exportsList}
          exportsTotalCount={exportsTotalCount}
          scrollContainerRef={scrollContainerRef}
          handleScroll={handleScroll}
          isLoading={isLoading}
          loader={loader}
          handleRemoveExportDataAtIndex={handleRemoveExportDataAtIndex}
          selectedExportData={selectedExportData}
          setSelectedExportData={setSelectedExportData}
          setDraftData={setDraftData}
          draftData={draftData}
          setanimalDetailsDrawerOpen={setanimalDetailsDrawerOpen}
          animalDetailsDrawerOpen={animalDetailsDrawerOpen}
          setAnimalDetails={setAnimalDetails}
          animalDetails={animalDetails}
          setDetailType={setDetailType}
          detailtype={detailtype}
          setSearchValue={setSearchValue}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          setErrors={setErrors}
          errors={errors}
          airwaybillvalue={airwaybillvalue}
          setAirwaybillvalue={setAirwaybillvalue}
          startDate={startDate}
          setStartDate={setStartDate}
          loading={loading}
        />
      ) : importId && action === 'details' ? (
        <SpeciesDetailsContainer
          selectedExportData={selectedExportData}
          totalAnimals={totalAnimals}
          totalSpecies={totalSpecies}
          setAnimalDetails={setAnimalDetails}
          animalDetails={animalDetails}
          setanimalDetailsDrawerOpen={setanimalDetailsDrawerOpen}
          animalDetailsDrawerOpen={animalDetailsDrawerOpen}
          setDetailType={setDetailType}
          detailtype={detailtype}
          airwaybillvalue={airwaybillvalue}
          startDate={startDate as string | null}
          uploadedFile={uploadedFile as { file_path?: string; file_original_name?: string; name?: string } | null}
          loader={loader}
        />
      ) : (
        <SpeciesAddEdit
          onSave={handleSave}
          onCancel={handleReset}
          setexportPermitDrawerOpen={setexportPermitDrawerOpen}
          exportPermitDrawerOpen={exportPermitDrawerOpen}
          handleSearch={handleSearch}
          exportsList={exportsList}
          exportsTotalCount={exportsTotalCount}
          scrollContainerRef={scrollContainerRef}
          handleScroll={handleScroll}
          isLoading={isLoading}
          handleRemoveExportDataAtIndex={handleRemoveExportDataAtIndex}
          selectedExportData={selectedExportData}
          setSelectedExportData={setSelectedExportData}
          setDraftData={setDraftData}
          draftData={draftData}
          setanimalDetailsDrawerOpen={setanimalDetailsDrawerOpen}
          animalDetailsDrawerOpen={animalDetailsDrawerOpen}
          setAnimalDetails={setAnimalDetails}
          animalDetails={animalDetails}
          setDetailType={setDetailType}
          detailtype={detailtype}
          setSearchValue={setSearchValue}
          loader={loader}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          setErrors={setErrors}
          errors={errors}
          airwaybillvalue={airwaybillvalue}
          setAirwaybillvalue={setAirwaybillvalue}
          startDate={startDate}
          setStartDate={setStartDate}
          loading={loading}
        />
      )}
    </>
  )
}

export default AnimalsData
