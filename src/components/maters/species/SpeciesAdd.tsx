import React, { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Box, Button } from '@mui/material'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import {
  getDynamicFormData,
  addBreed,
  addLocality,
  addMutation,
  getBreed,
  getLocalityById,
  getMutationById,
  getSearchTaxonomyList,
  getSpeciesVernacularDataList,
  UpdateSpeciesWithAdditionInfo,
  UploadBannerImages,
  addSpecies,
  getSpeciesList,
  getMutationList,
  getLocalityList,
  DeleteType,
  GetBannerImages,
  DeleteBannerById
} from 'src/lib/api/species'
import SpeciesForm from 'src/views/pages/species/SpeciesForm'

interface TaxonomyOption {
  taxonomy_id: string
  scientific_name: string
  common_name: string
}

interface BreedItem {
  sub_taxon_id: string
  sub_taxon_name: string
}

interface MorphItem {
  sub_taxon_id: string
  sub_taxon_name: string
}

interface LocalityItem {
  sub_taxon_id: string
  sub_taxon_name: string
}

interface BannerImage {
  id?: string
  image_url?: string
  file?: File
  preview?: string
}

interface DynamicFieldValue {
  [key: string]: any
}

interface DynamicSection {
  id: string
  label: string
  string_id: string
  field_type: string
  fields: DynamicField[]
  additional_info?: any
}

interface DynamicField {
  id: string
  label: string
  string_id: string
  field_type: string
  is_repetative: number | string
  is_required: number
  default_values?: any[]
  selected_value?: any
  selected_unit?: string | null
  additional_info?: any
  display_type?: string
  parent_id?: string
}

interface SpeciesFormData {
  taxonomyId: string
  selectedTaxonomy: TaxonomyOption | null
  taxonomyOptions: TaxonomyOption[]
  scientificName: string
  vernacularOptions: any[]
  selectedVernacularId: string
  manualVernacularName: string
  commonNameError: string
  profileImage: File | string | null
  profileImagePreview: string
  bannerImages: BannerImage[]
  breedList: BreedItem[]
  selectedMorphs: MorphItem[]
  selectedLocalities: LocalityItem[]

  dynamicSchema: DynamicSection[]
  dynamicFormValues: DynamicFieldValue
  showAdditionalFields: boolean
}

interface SpeciesAddProps {
  isEditMode: boolean
  id?: string
  name?: string
  onCancel: () => void
}

const SpeciesAdd: React.FC<SpeciesAddProps> = ({ isEditMode, id, name, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [isTaxonomySearching, setIsTaxonomySearching] = useState(false)
  const [isBreedDialogOpen, setIsBreedDialogOpen] = useState(false)
  const [breedName, setBreedName] = useState('')
  const [isMorphDialogOpen, setIsMorphDialogOpen] = useState(false)
  const [isLocalityDialogOpen, setIsLocalityDialogOpen] = useState(false)
  const [availableMorphs, setAvailableMorphs] = useState<MorphItem[]>([])
  const [availableLocalities, setAvailableLocalities] = useState<LocalityItem[]>([])
  const [isLoadingMorphs, setIsLoadingMorphs] = useState(false)
  const [isLoadingLocalities, setIsLoadingLocalities] = useState(false)
  const [isCreateTaxonomyDrawerOpen, setIsCreateTaxonomyDrawerOpen] = useState(false)

  const pendingBreedDeletesRef = useRef<
    Map<string, { breed: BreedItem; index: number; timerId: ReturnType<typeof setTimeout>; toastId: string }>
  >(new Map())

  const pendingMorphDeletesRef = useRef<
    Map<string, { morph: MorphItem; index: number; timerId: ReturnType<typeof setTimeout>; toastId: string }>
  >(new Map())

  const pendingLocalityDeletesRef = useRef<
    Map<string, { locality: LocalityItem; index: number; timerId: ReturnType<typeof setTimeout>; toastId: string }>
  >(new Map())

  const pendingBannerDeletesRef = useRef<
    Map<string, { image: BannerImage; index: number; timerId: ReturnType<typeof setTimeout>; toastId: string }>
  >(new Map())

  const [formData, setFormData] = useState<SpeciesFormData>({
    taxonomyId: '',
    selectedTaxonomy: null,
    taxonomyOptions: [],
    scientificName: '',
    vernacularOptions: [],
    selectedVernacularId: '',
    manualVernacularName: '',
    commonNameError: '',
    profileImage: null,
    profileImagePreview: '',
    bannerImages: [],
    breedList: [],
    selectedMorphs: [],
    selectedLocalities: [],

    dynamicSchema: [],
    dynamicFormValues: {},
    showAdditionalFields: false
  })

  const shouldShowDynamicFields = isEditMode

  const validationSchema = yup.object().shape({
    tsn_id: yup.string().required('Please choose Taxonomy'),
    scientificName: yup.string().required('Scientific name is required')
  })

  const {
    control,
    setValue,
    formState: { errors: formErrors }
  } = useForm({
    defaultValues: {
      tsn_id: '',
      taxonomy_id: '',
      vernacular_id: '',
      species_image: '',
      scientificName: '',
      banner_images: [],
      vernacular_name: ''
    },
    resolver: yupResolver(validationSchema),
    mode: 'onBlur'
  })

  const searchTaxonomy = useCallback(async (searchText: string) => {
    if (isEditMode) return
    if (searchText.length < 3) return
    setIsTaxonomySearching(true)
    try {
      const response = await getSearchTaxonomyList({ q: searchText })
      if (response?.data) {
        setFormData(prev => ({ ...prev, taxonomyOptions: response.data }))
      }
    } catch (error) {
      console.error('Error searching taxonomy:', error)
    } finally {
      setIsTaxonomySearching(false)
    }
  }, [])

  const fetchAvailableMorphs = async () => {
    setIsLoadingMorphs(true)
    try {
      const response = await getMutationList()
      if (response?.data) {
        setAvailableMorphs(response.data)
      }
    } catch (error) {
      console.error('Error fetching morphs list:', error)
      toast.error('Failed to load morphs list')
    } finally {
      setIsLoadingMorphs(false)
    }
  }

  const handleMorphDialogOpen = () => {
    fetchAvailableMorphs()
    setIsMorphDialogOpen(true)
  }

  const handleLocalityDialogOpen = () => {
    fetchAvailableLocalities()
    setIsLocalityDialogOpen(true)
  }

  const fetchAvailableLocalities = async () => {
    setIsLoadingLocalities(true)
    try {
      const response = await getLocalityList()
      if (response?.data) {
        setAvailableLocalities(response.data)
      }
    } catch (error) {
      console.error('Error fetching localities list:', error)
      toast.error('Failed to load localities list')
    } finally {
      setIsLoadingLocalities(false)
    }
  }

  const fetchVernacularData = async (taxonomyId: string) => {
    try {
      const response = await getSpeciesVernacularDataList(taxonomyId)
      if (response?.data) {
        setFormData(prev => ({ ...prev, vernacularOptions: response.data }))
      }
    } catch (error) {
      console.error('Error fetching vernacular data:', error)
    }
  }

  const fetchBreedData = async (taxonomyId: string) => {
    try {
      const response = await getBreed(taxonomyId)
      if (response?.data) {
        setFormData(prev => ({ ...prev, breedList: response.data }))
      }
    } catch (error) {
      console.error('Error fetching breed data:', error)
    }
  }

  const fetchMutationData = async (taxonomyId: string) => {
    try {
      const response = await getMutationById(taxonomyId)
      if (response?.data) {
        setFormData(prev => ({ ...prev, selectedMorphs: response.data }))
      }
    } catch (error) {
      console.error('Error fetching mutation data:', error)
    }
  }

  const fetchLocalityData = async (taxonomyId: string) => {
    try {
      const response = await getLocalityById(taxonomyId)
      if (response?.data) {
        setFormData(prev => ({ ...prev, selectedLocalities: response.data }))
      }
    } catch (error) {
      console.error('Error fetching locality data:', error)
    }
  }

  const commitBreedDelete = async (breedId: string) => {
    const taxonomyId = formData.taxonomyId
    const entry = pendingBreedDeletesRef.current.get(breedId)
    pendingBreedDeletesRef.current.delete(breedId)

    if (!taxonomyId) return

    try {
      const response = await DeleteType({
        taxonomy_id: taxonomyId,
        sub_taxon_type: 'breed',
        selected_id: breedId
      })

      if (!response?.success) {
        toast.error(response?.message || 'Failed to remove breed')
        if (entry) {
          setFormData(prev => {
            const next = [...prev.breedList]
            next.splice(entry.index, 0, entry.breed)
            return { ...prev, breedList: next }
          })
        }
      }
    } catch (error) {
      console.error('Error removing breed:', error)
      toast.error('Something went wrong')
      if (entry) {
        setFormData(prev => {
          const next = [...prev.breedList]
          next.splice(entry.index, 0, entry.breed)
          return { ...prev, breedList: next }
        })
      }
    }
  }

  const handleUndoRemoveBreed = (breedId: string) => {
    const entry = pendingBreedDeletesRef.current.get(breedId)
    if (!entry) return

    clearTimeout(entry.timerId)
    toast.dismiss(entry.toastId)
    pendingBreedDeletesRef.current.delete(breedId)

    setFormData(prev => {
      const next = [...prev.breedList]
      const insertAt = Math.min(entry.index, next.length)
      next.splice(insertAt, 0, entry.breed)
      return { ...prev, breedList: next }
    })
  }

  const handleRemoveBreed = async (breedId: string) => {
    const index = formData.breedList.findIndex(b => b.sub_taxon_id === breedId)
    if (index === -1) return
    const breed = formData.breedList[index]

    setFormData(prev => ({
      ...prev,
      breedList: prev.breedList.filter(b => b.sub_taxon_id !== breedId)
    }))

    const toastId = toast(
      (t: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>Breed removed</Box>
          <Button
            size='small'
            onClick={() => {
              toast.dismiss(t.id)
              handleUndoRemoveBreed(breedId)
            }}
          >
            Undo
          </Button>
        </Box>
      ),
      { duration: 3000 }
    )

    const timerId = setTimeout(() => {
      toast.dismiss(toastId)
      commitBreedDelete(breedId)
    }, 3000)

    pendingBreedDeletesRef.current.set(breedId, { breed, index, timerId, toastId })
  }

  const commitMorphDelete = async (morphId: string) => {
    const taxonomyId = formData.taxonomyId
    const entry = pendingMorphDeletesRef.current.get(morphId)
    pendingMorphDeletesRef.current.delete(morphId)

    if (!taxonomyId) return

    try {
      const response = await DeleteType({
        taxonomy_id: taxonomyId,
        sub_taxon_type: 'morph',
        selected_id: morphId
      })

      if (!response?.success) {
        toast.error(response?.message || 'Failed to remove morph')
        if (entry) {
          setFormData(prev => {
            const next = [...prev.selectedMorphs]
            next.splice(entry.index, 0, entry.morph)
            return { ...prev, selectedMorphs: next }
          })
        }
      }
    } catch (error) {
      console.error('Error removing morph:', error)
      toast.error('Something went wrong')
      if (entry) {
        setFormData(prev => {
          const next = [...prev.selectedMorphs]
          next.splice(entry.index, 0, entry.morph)
          return { ...prev, selectedMorphs: next }
        })
      }
    }
  }

  const handleUndoRemoveMorph = (morphId: string) => {
    const entry = pendingMorphDeletesRef.current.get(morphId)
    if (!entry) return

    clearTimeout(entry.timerId)
    toast.dismiss(entry.toastId)
    pendingMorphDeletesRef.current.delete(morphId)

    setFormData(prev => {
      const next = [...prev.selectedMorphs]
      const insertAt = Math.min(entry.index, next.length)
      next.splice(insertAt, 0, entry.morph)
      return { ...prev, selectedMorphs: next }
    })
  }

  const handleRemoveMorph = async (morphId: string) => {
    const index = formData.selectedMorphs.findIndex(m => m.sub_taxon_id === morphId)
    if (index === -1) return
    const morph = formData.selectedMorphs[index]

    setFormData(prev => ({
      ...prev,
      selectedMorphs: prev.selectedMorphs.filter(m => m.sub_taxon_id !== morphId)
    }))

    const toastId = toast(
      (t: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>Morph removed</Box>
          <Button
            size='small'
            onClick={() => {
              toast.dismiss(t.id)
              handleUndoRemoveMorph(morphId)
            }}
          >
            Undo
          </Button>
        </Box>
      ),
      { duration: 3000 }
    )

    const timerId = setTimeout(() => {
      toast.dismiss(toastId)
      commitMorphDelete(morphId)
    }, 3000)

    pendingMorphDeletesRef.current.set(morphId, { morph, index, timerId, toastId })
  }

  const commitLocalityDelete = async (localityId: string) => {
    const taxonomyId = formData.taxonomyId
    const entry = pendingLocalityDeletesRef.current.get(localityId)
    pendingLocalityDeletesRef.current.delete(localityId)

    if (!taxonomyId) return

    try {
      const response = await DeleteType({
        taxonomy_id: taxonomyId,
        sub_taxon_type: 'locality',
        selected_id: localityId
      })

      if (!response?.success) {
        toast.error(response?.message || 'Failed to remove locality')
        if (entry) {
          setFormData(prev => {
            const next = [...prev.selectedLocalities]
            next.splice(entry.index, 0, entry.locality)
            return { ...prev, selectedLocalities: next }
          })
        }
      }
    } catch (error) {
      console.error('Error removing locality:', error)
      toast.error('Something went wrong')
      if (entry) {
        setFormData(prev => {
          const next = [...prev.selectedLocalities]
          next.splice(entry.index, 0, entry.locality)
          return { ...prev, selectedLocalities: next }
        })
      }
    }
  }

  const handleUndoRemoveLocality = (localityId: string) => {
    const entry = pendingLocalityDeletesRef.current.get(localityId)
    if (!entry) return

    clearTimeout(entry.timerId)
    toast.dismiss(entry.toastId)
    pendingLocalityDeletesRef.current.delete(localityId)

    setFormData(prev => {
      const next = [...prev.selectedLocalities]
      const insertAt = Math.min(entry.index, next.length)
      next.splice(insertAt, 0, entry.locality)
      return { ...prev, selectedLocalities: next }
    })
  }

  const handleRemoveLocality = async (localityId: string) => {
    const index = formData.selectedLocalities.findIndex(l => l.sub_taxon_id === localityId)
    if (index === -1) return
    const locality = formData.selectedLocalities[index]

    setFormData(prev => ({
      ...prev,
      selectedLocalities: prev.selectedLocalities.filter(l => l.sub_taxon_id !== localityId)
    }))

    const toastId = toast(
      (t: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>Locality removed</Box>
          <Button
            size='small'
            onClick={() => {
              toast.dismiss(t.id)
              handleUndoRemoveLocality(localityId)
            }}
          >
            Undo
          </Button>
        </Box>
      ),
      { duration: 3000 }
    )

    const timerId = setTimeout(() => {
      toast.dismiss(toastId)
      commitLocalityDelete(localityId)
    }, 3000)

    pendingLocalityDeletesRef.current.set(localityId, { locality, index, timerId, toastId })
  }

  const fetchDynamicSchema = async (taxonomyId: string) => {
    if (!shouldShowDynamicFields) return

    try {
      const response = await getDynamicFormData({
        use_case: 'edit',
        taxonomy_id: taxonomyId
      })

      if (response?.success && response?.data) {
        let schemaData = response.data

        if (typeof schemaData === 'string') {
          schemaData = JSON.parse(schemaData)
        }

        if (!Array.isArray(schemaData)) {
          console.error('Invalid schema data format:', schemaData)
          return
        }

        setFormData(prev => ({ ...prev, dynamicSchema: schemaData }))

        const initialValues: DynamicFieldValue = {}

        schemaData.forEach((section: DynamicSection) => {
          if (!section?.fields) return

          section.fields.forEach((field: DynamicField) => {
            if (field.is_repetative === 1 || field.is_repetative === '1') {
              if (field.selected_value && Array.isArray(field.selected_value) && field.selected_value.length > 0) {
                field.selected_value.forEach((item: any, index: number) => {
                  const key = `${field.id}_${index}`
                  if (field.field_type === 'url') {
                    initialValues[key] = {
                      title: item?.title || '',
                      url: item?.url || ''
                    }
                  } else if (field.field_type === 'number_with_unit') {
                    initialValues[key] = {
                      selected_value: item?.selected_value || item,
                      selected_unit: item?.selected_unit || ''
                    }
                  } else {
                    initialValues[key] = item
                  }
                })
              } else {
                const key = `${field.id}_0`
                initialValues[key] = ''
              }
            } else {
              const key = `${field.id}_0`

              if (
                field?.selected_value !== null &&
                field?.selected_value !== undefined &&
                field?.selected_value !== ''
              ) {
                if (field?.field_type === 'number_with_unit') {
                  initialValues[key] = {
                    selected_value: field.selected_value,
                    selected_unit: field.selected_unit || ''
                  }
                } else if (field.field_type === 'radio_button') {
                  const option = field.default_values?.find(
                    (opt: any) =>
                      String(opt.id) === String(field.selected_value) ||
                      String(opt.string_id) === String(field.selected_value)
                  )
                  if (option) {
                    initialValues[key] = {
                      id: option.id,
                      string_id: option.string_id,
                      extra_data: option.extra_data || null
                    }
                  } else {
                    initialValues[key] = field.selected_value
                  }
                } else if (field.field_type === 'toggle_button') {
                  initialValues[key] =
                    field.selected_value === true || field.selected_value === 1 || field.selected_value === '1'
                      ? '1'
                      : '0'
                } else if (field.field_type === 'select' && field.display_type === 'circular_badge') {
                  initialValues[key] = String(field.selected_value)
                } else {
                  initialValues[key] = field.selected_value
                }
              } else {
                initialValues[key] =
                  field.field_type === 'number_with_unit' ? { selected_value: '', selected_unit: '' } : ''
              }
            }
          })
        })

        setFormData(prev => ({ ...prev, dynamicFormValues: initialValues }))
      }
    } catch (error) {
      console.error('Error fetching dynamic schema:', error)
    }
  }

  const fetchSpeciesData = async () => {
    if (!isEditMode || !id) return

    setLoading(true)
    try {
      const response = await getSpeciesList({ q: name, zoo_id: 11 })

      if (response?.success && response?.data) {
        const data = response.data.taxonomy_list?.find((item: any) => item.tsn === id)

        if (!data) {
          toast.error('Species not found')
          return
        }

        const taxonomyObj = {
          taxonomy_id: data.tsn_id || data.taxonomy_id || data.tsn,
          scientific_name: data.scientific_name || data.complete_name || data.scientificName,
          common_name: data.common_name || data.default_common_name || ''
        }

        const taxonomyIdForFetch = data.tsn_id || data.taxonomy_id || data.tsn

        if (taxonomyIdForFetch) {
          await fetchVernacularData(taxonomyIdForFetch)
        }

        let bannerImages: BannerImage[] = []
        try {
          const bannerResponse = await GetBannerImages(taxonomyIdForFetch)
          if (bannerResponse?.success && bannerResponse?.data && Array.isArray(bannerResponse.data)) {
            bannerImages = bannerResponse.data?.map((img: any) => ({
              id: img.id,
              image_url: img.image_url || img.url,
              file: undefined
            }))
          }
        } catch (bannerError) {
          console.error('Error fetching banner images:', bannerError)
        }

        setFormData(prev => ({
          ...prev,
          taxonomyId: taxonomyIdForFetch,
          selectedTaxonomy: taxonomyObj,
          scientificName: taxonomyObj?.scientific_name,
          selectedVernacularId: data?.vernacular_id || data?.default_common_name_id || '',
          manualVernacularName: '',
          profileImage: data?.species_image || data?.default_icon || null,
          profileImagePreview: data?.species_image || data?.default_icon || '',
          bannerImages: bannerImages,

          showAdditionalFields: true
        }))

        setValue('tsn_id', taxonomyIdForFetch)
        setValue('scientificName', taxonomyObj.scientific_name)

        if (data?.vernacular_id || data?.default_common_name_id) {
          setValue('vernacular_id', data?.vernacular_id || data?.default_common_name_id)
        }

        if (taxonomyIdForFetch) {
          await fetchBreedData(taxonomyIdForFetch)
          await fetchMutationData(taxonomyIdForFetch)
          await fetchLocalityData(taxonomyIdForFetch)
          await fetchDynamicSchema(taxonomyIdForFetch)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEditMode && id) {
      fetchSpeciesData()
    }
  }, [isEditMode, id])

  useEffect(() => {
    return () => {
      pendingBreedDeletesRef.current.forEach((entry, breedId) => {
        clearTimeout(entry.timerId)
        toast.dismiss(entry.toastId)
        commitBreedDelete(breedId)
      })
      pendingBreedDeletesRef.current.clear()

      pendingMorphDeletesRef.current.forEach((entry, morphId) => {
        clearTimeout(entry.timerId)
        toast.dismiss(entry.toastId)
        commitMorphDelete(morphId)
      })
      pendingMorphDeletesRef.current.clear()

      pendingLocalityDeletesRef.current.forEach((entry, localityId) => {
        clearTimeout(entry.timerId)
        toast.dismiss(entry.toastId)
        commitLocalityDelete(localityId)
      })
      pendingLocalityDeletesRef.current.clear()

      pendingBannerDeletesRef.current.forEach((entry, key) => {
        clearTimeout(entry.timerId)
        toast.dismiss(entry.toastId)
        commitBannerDelete(key)
      })
      pendingBannerDeletesRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTaxonomySelect = async (taxonomy: TaxonomyOption | null) => {
    if (!taxonomy) {
      setFormData(prev => ({
        ...prev,
        selectedTaxonomy: null,
        taxonomyId: '',
        scientificName: '',
        showAdditionalFields: false,
        vernacularOptions: [],
        dynamicSchema: [],
        dynamicFormValues: {}
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      selectedTaxonomy: taxonomy,
      taxonomyId: taxonomy?.taxonomy_id,
      scientificName: taxonomy?.scientific_name,
      showAdditionalFields: true
    }))

    setValue('tsn_id', taxonomy?.taxonomy_id)
    setValue('scientificName', taxonomy?.scientific_name)

    await fetchVernacularData(taxonomy?.taxonomy_id)

    if (shouldShowDynamicFields) {
      await fetchDynamicSchema(taxonomy?.taxonomy_id)
    }
  }

  const handleVernacularSelect = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedVernacularId: value,
      manualVernacularName: '',
      commonNameError: ''
    }))
  }

  const handleVernacularNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      manualVernacularName: value,
      selectedVernacularId: '',
      commonNameError: ''
    }))
  }

  const handleProfileImageChange = (file: File) => {
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png']
    const maxSizeMB = 28

    if (!allowedFormats.includes(file.type)) {
      toast.error('Only PNG, JPG, and JPEG formats are allowed for profile image')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`${file.name}:File size too large. Maximum ${maxSizeMB}MB allowed`)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setFormData(prev => ({
      ...prev,
      profileImage: file,
      profileImagePreview: previewUrl
    }))
  }

  const handleBannerImagesChange = (files: File[]) => {
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png']
    const maxSizeMB = 28

    const validFiles = files?.filter(file => {
      const isValidFormat = allowedFormats.includes(file.type)
      const isValidSize = file.size <= maxSizeMB * 1024 * 1024

      if (!isValidFormat) {
        toast.error(`${file.name}: Only PNG, JPG, and JPEG formats are allowed`)
      } else if (!isValidSize) {
        toast.error(`${file.name}: File size should be less than ${maxSizeMB}MB`)
      }

      return isValidFormat && isValidSize
    })

    if (!validFiles || validFiles.length === 0) return

    const newImages = validFiles.map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }))

    setFormData(prev => ({
      ...prev,
      bannerImages: [...prev.bannerImages, ...newImages]
    }))
  }

  const getBannerKey = (image: BannerImage) => image.id || image.preview || ''

  const commitBannerDelete = async (key: string) => {
    const entry = pendingBannerDeletesRef.current.get(key)
    pendingBannerDeletesRef.current.delete(key)
    if (!entry) return

    if (entry.image.preview) {
      URL.revokeObjectURL(entry.image.preview)
    }

    if (entry.image.id) {
      try {
        await DeleteBannerById(entry.image)
      } catch (error) {
        console.error('Error deleting banner image:', error)
        toast.error('Failed to delete image')
        setFormData(prev => {
          const next = [...prev.bannerImages]
          next.splice(entry.index, 0, entry.image)
          return { ...prev, bannerImages: next }
        })
      }
    }
  }

  const handleUndoRemoveBannerImage = (key: string) => {
    const entry = pendingBannerDeletesRef.current.get(key)
    if (!entry) return

    clearTimeout(entry.timerId)
    toast.dismiss(entry.toastId)
    pendingBannerDeletesRef.current.delete(key)

    setFormData(prev => {
      const next = [...prev.bannerImages]
      const insertAt = Math.min(entry.index, next.length)
      next.splice(insertAt, 0, entry.image)
      return { ...prev, bannerImages: next }
    })
  }

  const handleRemoveBannerImage = async (image: BannerImage) => {
    const key = getBannerKey(image)
    if (!key) return

    const index = formData.bannerImages.findIndex(img => getBannerKey(img) === key)
    if (index === -1) return

    setFormData(prev => ({
      ...prev,
      bannerImages: prev.bannerImages.filter(img => getBannerKey(img) !== key)
    }))

    const toastId = toast(
      (t: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>Image removed</Box>
          <Button
            size='small'
            onClick={() => {
              toast.dismiss(t.id)
              handleUndoRemoveBannerImage(key)
            }}
          >
            Undo
          </Button>
        </Box>
      ),
      { duration: 3000 }
    )

    const timerId = setTimeout(() => {
      toast.dismiss(toastId)
      commitBannerDelete(key)
    }, 3000)

    pendingBannerDeletesRef.current.set(key, { image, index, timerId, toastId })
  }

  const handleAddBreed = async () => {
    if (!breedName.trim() || breedName.length < 3) {
      toast.error('Breed name must be at least 3 characters')
      return
    }

    setLoading(true)
    try {
      const response = await addBreed({
        taxonomy_id: formData.taxonomyId,
        breed_name: breedName.trim()
      })

      if (response?.success) {
        toast.success('Breed added successfully')
        await fetchBreedData(formData.taxonomyId)
        setBreedName('')
        setIsBreedDialogOpen(false)
      } else {
        toast.error(response?.message || 'Failed to add breed')
      }
    } catch (error) {
      console.error('Error adding breed:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMorph = async (morphs: MorphItem[]) => {
    if (morphs.length === 0) {
      toast.error('Please select at least one morph')
      return
    }

    setLoading(true)
    try {
      const response = await addMutation({
        taxonomy_id: formData.taxonomyId,
        sub_taxon_type: 'morph',
        selected_id: morphs?.map(m => m.sub_taxon_id)
      })

      if (response?.success) {
        toast.success('Morphs added successfully')
        await fetchMutationData(formData.taxonomyId)
        setIsMorphDialogOpen(false)
      } else {
        toast.error(response?.message || 'Failed to add morphs')
      }
    } catch (error) {
      console.error('Error adding morphs:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocality = async (localities: LocalityItem[]) => {
    if (localities.length === 0) {
      toast.error('Please select at least one locality')
      return
    }

    setLoading(true)
    try {
      const response = await addLocality({
        taxonomy_id: formData.taxonomyId,
        sub_taxon_type: 'locality',
        selected_id: localities?.map(l => l.sub_taxon_id)
      })

      if (response?.success) {
        toast.success('Localities added successfully')
        await fetchLocalityData(formData.taxonomyId)
        setIsLocalityDialogOpen(false)
      } else {
        toast.error(response?.message || 'Failed to add localities')
      }
    } catch (error) {
      console.error('Error adding localities:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const uploadBannerImages = async (taxonomyId: string, bannerImages: BannerImage[]) => {
    const newBannerFiles = bannerImages.filter(img => img.file && !img.id)?.map(img => img.file)

    if (newBannerFiles.length === 0) return true

    try {
      const bannerFormData = new FormData()
      bannerFormData.append('tsn_id', taxonomyId)

      newBannerFiles.forEach((file, index) => {
        if (file) {
          bannerFormData.append('banner_images[]', file)
        }
      })

      const response = await UploadBannerImages(bannerFormData)

      if (!response?.success) {
        toast.error('Failed to upload banner images')
        return false
      }

      if (response?.data && Array.isArray(response.data)) {
        const existingImages = bannerImages.filter(img => img.id)
        setFormData(prev => ({
          ...prev,
          bannerImages: [...existingImages, ...response.data]
        }))
      }

      return true
    } catch (error) {
      console.error('Error uploading banner images:', error)
      toast.error('Failed to upload banner images')
      return false
    }
  }

  const processDynamicFieldsForSubmit = () => {
    if (!shouldShowDynamicFields || formData.dynamicSchema.length === 0) return null

    const updatedSchema = JSON.parse(JSON.stringify(formData.dynamicSchema))

    updatedSchema.forEach((section: DynamicSection) => {
      if (!section?.fields) return

      const visibleFields = section.fields.filter((field: DynamicField) => {
        if (field.additional_info?.hide_parent_id) {
          const parentStringId = field.additional_info.hide_parent_id
          const parentField = section.fields.find((f: DynamicField) =>
            f.default_values?.some((opt: any) => opt.string_id === parentStringId)
          )

          if (parentField) {
            const parentKey = `${parentField.id}_0`
            const parentValue = formData.dynamicFormValues[parentKey]

            if (parentValue && (parentValue.string_id === parentStringId || parentValue === parentStringId)) {
              return false
            }
          }
        }
        return true
      })

      section.fields = visibleFields

      visibleFields.forEach((field: DynamicField) => {
        const fieldId = String(field.id)

        if (field.field_type === 'toggle_button' && field.string_id === 'species_section.cites_listed') {
          const toggleKey = `${fieldId}_0`
          const isEnabled = formData.dynamicFormValues[toggleKey] === '1'

          const appendixField = section.fields.find(
            (f: DynamicField) => f.string_id === 'species_section.cites_appendix'
          )

          if (appendixField && !isEnabled) {
            section.fields = section.fields.filter(
              (f: DynamicField) => f.string_id !== 'species_section.cites_appendix'
            )
          }
        }

        if (field.is_repetative == 1) {
          const values: any[] = []
          Object.keys(formData.dynamicFormValues)
            .filter(key => key.startsWith(`${fieldId}_`))
            .sort((a, b) => {
              const indexA = parseInt(a.split('_')[1])
              const indexB = parseInt(b.split('_')[1])
              return indexA - indexB
            })
            .forEach(key => {
              const val = formData.dynamicFormValues[key]
              if (val !== null && val !== undefined && val !== '') {
                if (typeof val === 'object') {
                  if ('selected_value' in val) {
                    values.push(val.selected_value)
                  } else if ('title' in val && 'url' in val) {
                    values.push({
                      title: String(val.title),
                      url: String(val.url)
                    })
                  } else {
                    values.push(val)
                  }
                } else {
                  values.push(val)
                }
              }
            })

          field.selected_value = values
          field.selected_unit = null
        } else {
          const key = `${fieldId}_0`
          const val = formData.dynamicFormValues[key]

          if (val !== undefined && val !== null && val !== '') {
            if (typeof val === 'object') {
              if ('selected_value' in val) {
                field.selected_value = val.selected_value ?? null
                field.selected_unit = val.selected_unit ?? null
              } else if ('id' in val) {
                field.selected_value = val.id ?? null
                field.selected_unit = null
              } else if ('title' in val && 'url' in val) {
                field.selected_value = {
                  title: String(val.title),
                  url: String(val.url)
                }
                field.selected_unit = null
              } else {
                field.selected_value = val
                field.selected_unit = null
              }
            } else {
              field.selected_value = val ?? null
              field.selected_unit = null
            }
          } else if (field.is_required === 1) {
            field.selected_value = null
          } else {
            field.selected_value = null
          }
        }
      })
    })

    return updatedSchema
  }

  const handleDynamicFieldChange = (fieldId: string, index: number, value: any) => {
    setFormData(prev => {
      const newFormValues = {
        ...prev.dynamicFormValues,
        [`${fieldId}_${index}`]: value
      }

      return {
        ...prev,
        dynamicFormValues: newFormValues
      }
    })
  }

  const handleDynamicFieldRemove = (fieldId: string, removeIndex: number, instanceCount: number) => {
    setFormData(prev => {
      const newFormValues = { ...prev.dynamicFormValues }

      delete newFormValues[`${fieldId}_${removeIndex}`]

      for (let i = removeIndex + 1; i < instanceCount; i++) {
        const oldKey = `${fieldId}_${i}`
        const newKey = `${fieldId}_${i - 1}`
        if (oldKey in newFormValues) {
          newFormValues[newKey] = newFormValues[oldKey]
          delete newFormValues[oldKey]
        }
      }

      return {
        ...prev,
        dynamicFormValues: newFormValues
      }
    })
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (!formData.selectedVernacularId && !formData.manualVernacularName) {
        setFormData(prev => ({ ...prev, commonNameError: 'Please select or enter a common name' }))
        setLoading(false)
        return
      }

      const newBannerFiles = formData.bannerImages.filter(img => img.file && !img.id)

      if (isEditMode && formData.taxonomyId && newBannerFiles.length > 0) {
        const bannerUploadSuccess = await uploadBannerImages(formData.taxonomyId, formData.bannerImages)
        if (!bannerUploadSuccess) {
          setLoading(false)
          return
        }
      }

      const formDataToSend = new FormData()

      formDataToSend.append('tsn_id', formData.taxonomyId)
      formDataToSend.append('zoo_id', '11')
      formDataToSend.append('scientificName', formData.scientificName)
      formDataToSend.append('species_image', formData.profileImage || '')

      if (formData.manualVernacularName && formData.manualVernacularName.trim() !== '') {
        formDataToSend.append('vernacular_name', formData.manualVernacularName.trim())
      } else if (formData.selectedVernacularId) {
        formDataToSend.append('vernacular_id', formData.selectedVernacularId)
      }

      if (shouldShowDynamicFields) {
        const dynamicData = processDynamicFieldsForSubmit()
        if (dynamicData && dynamicData.length > 0) {
          formDataToSend.append('additional_info', JSON.stringify(dynamicData))
        } else {
          formDataToSend.append('additional_info', '[]')
        }
      }

      let response
      if (isEditMode) {
        response = await UpdateSpeciesWithAdditionInfo(formDataToSend, formData.taxonomyId)
      } else {
        response = await addSpecies(formDataToSend)
      }

      if (response?.success) {
        if (!isEditMode && newBannerFiles.length > 0) {
          const newTaxonomyId = response?.data?.tsn_id || response?.data?.taxonomy_id || formData.taxonomyId
          if (newTaxonomyId) {
            await uploadBannerImages(newTaxonomyId, formData.bannerImages)
          }
        }

        toast.success(isEditMode ? 'Species updated successfully' : 'Species added successfully')
        onCancel()
      } else {
        toast.error(response?.message || 'Failed to save species')
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      if (error.response) {
        toast.error(error.response.data?.message || 'Server error occurred')
      } else {
        toast.error(error?.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreateTaxonomyDrawer = () => {
    setIsCreateTaxonomyDrawerOpen(true)
  }

  const handleCloseCreateTaxonomyDrawer = () => {
    setIsCreateTaxonomyDrawerOpen(false)
  }

  return (
    <SpeciesForm
      control={control}
      setValue={setValue}
      formErrors={formErrors}
      isEditMode={isEditMode}
      shouldShowDynamicFields={shouldShowDynamicFields}
      loading={loading}
      isTaxonomySearching={isTaxonomySearching}
      formData={formData}
      taxonomyOptions={formData.taxonomyOptions}
      vernacularOptions={formData.vernacularOptions}
      breedList={formData.breedList}
      morphList={formData.selectedMorphs}
      localityList={formData.selectedLocalities}
      availableMorphs={availableMorphs}
      availableLocalities={availableLocalities}
      isLoadingMorphs={isLoadingMorphs}
      isLoadingLocalities={isLoadingLocalities}
      dynamicSchema={formData.dynamicSchema}
      dynamicFormValues={formData.dynamicFormValues}
      onTaxonomySearch={searchTaxonomy}
      onTaxonomySelect={handleTaxonomySelect}
      onVernacularSelect={handleVernacularSelect}
      onVernacularNameChange={handleVernacularNameChange}
      onProfileImageChange={handleProfileImageChange}
      onBannerImagesChange={handleBannerImagesChange}
      onRemoveBannerImage={handleRemoveBannerImage}
      onAddBreed={handleAddBreed}
      onRemoveBreed={handleRemoveBreed}
      onAddMorph={handleAddMorph}
      onRemoveMorph={handleRemoveMorph}
      onAddLocality={handleAddLocality}
      onRemoveLocality={handleRemoveLocality}
      onDynamicFieldChange={handleDynamicFieldChange}
      onDynamicFieldRemove={handleDynamicFieldRemove}
      isBreedDialogOpen={isBreedDialogOpen}
      breedName={breedName}
      onBreedNameChange={setBreedName}
      onBreedDialogOpen={() => setIsBreedDialogOpen(true)}
      onBreedDialogClose={() => {
        setIsBreedDialogOpen(false)
        setBreedName('')
      }}
      isMorphDialogOpen={isMorphDialogOpen}
      onMorphDialogOpen={handleMorphDialogOpen}
      onMorphDialogClose={() => setIsMorphDialogOpen(false)}
      isLocalityDialogOpen={isLocalityDialogOpen}
      onLocalityDialogOpen={handleLocalityDialogOpen}
      onLocalityDialogClose={() => setIsLocalityDialogOpen(false)}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isCreateTaxonomyDrawerOpen={isCreateTaxonomyDrawerOpen}
      onOpenCreateTaxonomyDrawer={handleOpenCreateTaxonomyDrawer}
      onCloseCreateTaxonomyDrawer={handleCloseCreateTaxonomyDrawer}
    />
  )
}

export default SpeciesAdd
