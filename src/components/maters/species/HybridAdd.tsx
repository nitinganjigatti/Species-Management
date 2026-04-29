import React, { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Box, Button } from '@mui/material'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import {
  getSearchTaxonomyList,
  getSpeciesVernacularDataList,
  UploadBannerImages,
  addHybrid,
  UpdateHybrid,
  getSpeciesList,
  getBreed,
  getLocalityById,
  getMutationById,
  addBreed,
  addMutation,
  addLocality,
  DeleteType,
  GetBannerImages,
  DeleteBannerById,
  getMutationList,
  getLocalityList
} from 'src/lib/api/species'
import HybridForm from 'src/views/pages/species/HybridForm'

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

interface TaxonomyField {
  taxonomy_id: string
  scientific_name: string
  common_name: string
}

interface HybridFormData {
  taxonomyFields: TaxonomyField[]
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
  breedingPriority: string
  showAdditionalFields: boolean
}

interface HybridAddProps {
  isEditMode: boolean
  id?: string
  name?: string
  onCancel: () => void
}

const HybridAdd: React.FC<HybridAddProps> = ({ isEditMode, id, name, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [isBreedDialogOpen, setIsBreedDialogOpen] = useState(false)
  const [breedName, setBreedName] = useState('')
  const [isMorphDialogOpen, setIsMorphDialogOpen] = useState(false)
  const [isLocalityDialogOpen, setIsLocalityDialogOpen] = useState(false)
  const [availableMorphs, setAvailableMorphs] = useState<MorphItem[]>([])
  const [availableLocalities, setAvailableLocalities] = useState<LocalityItem[]>([])
  const [isLoadingMorphs, setIsLoadingMorphs] = useState(false)
  const [isLoadingLocalities, setIsLoadingLocalities] = useState(false)
  const [isCreateTaxonomyDrawerOpen, setIsCreateTaxonomyDrawerOpen] = useState(false)

  const [searchResults, setSearchResults] = useState<Record<number, TaxonomyOption[]>>({})
  const [searchLoading, setSearchLoading] = useState<Record<number, boolean>>({})

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

  const [formData, setFormData] = useState<HybridFormData>({
    taxonomyFields: [
      { taxonomy_id: '', scientific_name: '', common_name: '' },
      { taxonomy_id: '', scientific_name: '', common_name: '' }
    ],
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
    breedingPriority: '',
    showAdditionalFields: false
  })

  const validationSchema = yup.object().shape({
    scientific_name: yup.string().required('Scientific name is required')
  })

  const {
    control,
    setValue,
    formState: { errors: formErrors }
  } = useForm({
    defaultValues: {
      taxonomy_id: '',
      scientific_name: '',
      vernacular_id: '',
      species_image: '',
      banner_images: [],
      common_name: '',
      breeding_priority: ''
    },
    resolver: yupResolver(validationSchema),
    mode: 'onBlur'
  })

  const hasMinimumTaxonomies = useCallback(() => {
    if (isEditMode) return true
    const selectedCount = formData.taxonomyFields.filter(field => field.taxonomy_id && field.taxonomy_id !== '').length
    return selectedCount >= 2
  }, [formData.taxonomyFields, isEditMode])

  useEffect(() => {
    const shouldShow = hasMinimumTaxonomies()
    if (shouldShow !== formData.showAdditionalFields) {
      setFormData(prev => ({ ...prev, showAdditionalFields: shouldShow }))
    }
  }, [formData.taxonomyFields, hasMinimumTaxonomies])

  const getFieldOptions = useCallback(
    (fieldIndex: number) => {
      const currentField = formData.taxonomyFields[fieldIndex]
      const currentSelected =
        currentField?.taxonomy_id && currentField?.scientific_name
          ? [
              {
                taxonomy_id: currentField.taxonomy_id,
                scientific_name: currentField.scientific_name,
                common_name: currentField.common_name
              }
            ]
          : []

      const fieldSearchResults = searchResults[fieldIndex] || []
      const uniqueSearchResults = fieldSearchResults.filter(
        r => !currentSelected.some(s => s.taxonomy_id === r.taxonomy_id)
      )

      return [...currentSelected, ...uniqueSearchResults]
    },
    [formData.taxonomyFields, searchResults]
  )

  const searchTaxonomy = useCallback(async (searchText: string, fieldIndex: number) => {
    if (searchText.length < 3) return

    setSearchLoading(prev => ({ ...prev, [fieldIndex]: true }))
    try {
      const response = await getSearchTaxonomyList({ q: searchText })
      if (response?.data) {
        setSearchResults(prev => ({
          ...prev,
          [fieldIndex]: response.data
        }))
      }
    } catch (error) {
      console.error('Error searching taxonomy:', error)
    } finally {
      setSearchLoading(prev => ({ ...prev, [fieldIndex]: false }))
    }
  }, [])

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

  const handleMorphDialogOpen = () => {
    fetchAvailableMorphs()
    setIsMorphDialogOpen(true)
  }

  const handleLocalityDialogOpen = () => {
    fetchAvailableLocalities()
    setIsLocalityDialogOpen(true)
  }

  const fetchHybridData = async () => {
    if (!isEditMode || !id) return

    const params = {
      q: name,
      zoo_id: 11,
      is_hybrid: true
    }
    setLoading(true)
    try {
      const response = await getSpeciesList(params)

      if (response?.success && response?.data) {
        const data = response.data.taxonomy_list?.find((item: any) => item.tsn === id)

        if (!data) {
          toast.error('Hybrid not found')
          return
        }

        const scientificNameValue = data.complete_name || name || ''

        let taxonomyNames: string[] = []
        if (scientificNameValue && scientificNameValue.includes(' X ')) {
          taxonomyNames = scientificNameValue.split(' X ')
        } else if (name && name.includes(' X ')) {
          taxonomyNames = name.split(' X ')
        } else {
          taxonomyNames = [scientificNameValue]
        }

        const taxonomyFields: TaxonomyField[] = taxonomyNames?.map(sciName => ({
          taxonomy_id: '',
          scientific_name: sciName.trim(),
          common_name: ''
        }))

        while (taxonomyFields.length < 2) {
          taxonomyFields.push({ taxonomy_id: '', scientific_name: '', common_name: '' })
        }

        let vernacularOptionsData: any[] = []

        const vernacularResponse = await getSpeciesVernacularDataList(id)
        if (vernacularResponse?.data) {
          vernacularOptionsData = vernacularResponse.data
          setFormData(prev => ({ ...prev, vernacularOptions: vernacularResponse.data }))
        }

        let bannerImages: BannerImage[] = []
        try {
          const bannerResponse = await GetBannerImages(id)
          if (bannerResponse?.success && bannerResponse?.data && Array.isArray(bannerResponse.data)) {
            bannerImages = bannerResponse?.data?.map((img: any) => ({
              id: img.id,
              image_url: img.image_url || img.url,
              file: undefined
            }))
          }
        } catch (bannerError) {
          console.error('Error fetching banner images:', bannerError)
        }

        let selectedId = ''

        if (vernacularOptionsData.length > 0 && data.default_common_name) {
          const matchByName = vernacularOptionsData.find(
            (item: any) => item.vernacular_name === data.default_common_name
          )
          if (matchByName) {
            selectedId = matchByName.id
          }
        }

        if (!selectedId && data.default_common_name_id && vernacularOptionsData.length > 0) {
          const matchById = vernacularOptionsData.find(
            (item: any) => String(item.id) === String(data.default_common_name_id)
          )
          if (matchById) {
            selectedId = matchById.id
          }
        }

        setFormData(prev => ({
          ...prev,
          taxonomyFields: taxonomyFields,
          scientificName: scientificNameValue,
          selectedVernacularId: selectedId,
          manualVernacularName: '',
          profileImage: data.default_icon || data.species_image || null,
          profileImagePreview: data.default_icon || data.species_image || '',
          bannerImages: bannerImages,
          showAdditionalFields: true
        }))

        setValue('scientific_name', scientificNameValue)
        setValue('taxonomy_id', id)

        if (selectedId) {
          setValue('vernacular_id', selectedId)
        }

        setValue('common_name', '')

        if (data.breeding_priority) {
          setValue('breeding_priority', data.breeding_priority)
        }

        if (id) {
          await fetchBreedData(id)
          await fetchMutationData(id)
          await fetchLocalityData(id)
        }
      }
    } catch (error) {
      console.error('Error fetching hybrid data:', error)
      toast.error('Failed to load hybrid data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEditMode && id) {
      fetchHybridData()
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

  const handleTaxonomyFieldChange = (index: number, taxonomy: TaxonomyOption | null) => {
    const newTaxonomyFields = [...formData.taxonomyFields]

    if (taxonomy) {
      newTaxonomyFields[index] = {
        taxonomy_id: taxonomy.taxonomy_id,
        scientific_name: taxonomy.scientific_name,
        common_name: taxonomy.common_name
      }
    } else {
      newTaxonomyFields[index] = {
        taxonomy_id: '',
        scientific_name: '',
        common_name: ''
      }
    }

    const scientificNames = newTaxonomyFields
      .filter(field => field.scientific_name && field.scientific_name !== '')
      .map(field => field.scientific_name)

    const combinedScientificName = scientificNames.join(' X ')

    setFormData(prev => ({
      ...prev,
      taxonomyFields: newTaxonomyFields,
      scientificName: combinedScientificName
    }))

    setValue('scientific_name', combinedScientificName)

    if (index === 0 && taxonomy) {
      fetchVernacularData(taxonomy.taxonomy_id)
    }
  }

  const handleAddTaxonomyField = () => {
    setFormData(prev => ({
      ...prev,
      taxonomyFields: [...prev.taxonomyFields, { taxonomy_id: '', scientific_name: '', common_name: '' }]
    }))
  }

  const handleRemoveTaxonomyField = (index: number) => {
    if (formData.taxonomyFields.length <= 2) {
      toast.error('At least 2 taxonomies are required for a hybrid')
      return
    }

    const newTaxonomyFields = formData.taxonomyFields.filter((_, i) => i !== index)

    const scientificNames = newTaxonomyFields
      .filter(field => field.scientific_name && field.scientific_name !== '')
      .map(field => field.scientific_name)

    const combinedScientificName = scientificNames.join(' X ')

    setFormData(prev => ({
      ...prev,
      taxonomyFields: newTaxonomyFields,
      scientificName: combinedScientificName
    }))

    setValue('scientific_name', combinedScientificName)
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
    const previewUrl = URL.createObjectURL(file)
    setFormData(prev => ({
      ...prev,
      profileImage: file,
      profileImagePreview: previewUrl
    }))
  }

  const handleBannerImagesChange = (files: File[]) => {
    const newImages = files?.map(file => ({
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

    const primaryTaxonomyId = id

    if (!primaryTaxonomyId) {
      toast.error('Please select a primary taxonomy first')
      return
    }

    setLoading(true)
    try {
      const response = await addBreed({
        taxonomy_id: primaryTaxonomyId,
        breed_name: breedName.trim()
      })

      if (response?.success) {
        toast.success('Breed added successfully')
        await fetchBreedData(primaryTaxonomyId)
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

  const commitBreedDelete = async (breedId: string) => {
    const primaryTaxonomyId = id
    const entry = pendingBreedDeletesRef.current.get(breedId)
    pendingBreedDeletesRef.current.delete(breedId)

    if (!primaryTaxonomyId) return

    try {
      const response = await DeleteType({
        taxonomy_id: primaryTaxonomyId,
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
    const primaryTaxonomyId = id
    if (!primaryTaxonomyId) return

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

  const handleAddMorph = async (morphs: MorphItem[]) => {
    if (morphs.length === 0) {
      toast.error('Please select at least one morph')
      return
    }

    const primaryTaxonomyId = id
    if (!primaryTaxonomyId) return

    setLoading(true)
    try {
      const response = await addMutation({
        taxonomy_id: primaryTaxonomyId,
        sub_taxon_type: 'morph',
        selected_id: morphs?.map(m => m.sub_taxon_id)
      })

      if (response?.success) {
        toast.success('Morphs added successfully')
        await fetchMutationData(primaryTaxonomyId)
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

  const commitMorphDelete = async (morphId: string) => {
    const primaryTaxonomyId = id
    const entry = pendingMorphDeletesRef.current.get(morphId)
    pendingMorphDeletesRef.current.delete(morphId)

    if (!primaryTaxonomyId) return

    try {
      const response = await DeleteType({
        taxonomy_id: primaryTaxonomyId,
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
    const primaryTaxonomyId = id
    if (!primaryTaxonomyId) return

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

  const handleAddLocality = async (localities: LocalityItem[]) => {
    if (localities.length === 0) {
      toast.error('Please select at least one locality')
      return
    }

    const primaryTaxonomyId = id
    if (!primaryTaxonomyId) return

    setLoading(true)
    try {
      const response = await addLocality({
        taxonomy_id: primaryTaxonomyId,
        sub_taxon_type: 'locality',
        selected_id: localities?.map(l => l.sub_taxon_id)
      })

      if (response?.success) {
        toast.success('Localities added successfully')
        await fetchLocalityData(primaryTaxonomyId)
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

  const commitLocalityDelete = async (localityId: string) => {
    const primaryTaxonomyId = id
    const entry = pendingLocalityDeletesRef.current.get(localityId)
    pendingLocalityDeletesRef.current.delete(localityId)

    if (!primaryTaxonomyId) return

    try {
      const response = await DeleteType({
        taxonomy_id: primaryTaxonomyId,
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
    const primaryTaxonomyId = id
    if (!primaryTaxonomyId) return

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

  const uploadBannerImages = async (taxonomyId: string, bannerImages: BannerImage[]) => {
    const newBannerFiles = bannerImages.filter(img => img.file && !img.id)?.map(img => img.file)

    if (newBannerFiles.length === 0) return true

    try {
      const bannerFormData = new FormData()
      bannerFormData.append('tsn_id', id || taxonomyId)

      newBannerFiles.forEach(file => {
        bannerFormData.append('banner_images[]', file || '')
      })

      const response = await UploadBannerImages(bannerFormData)

      if (!response?.success) {
        toast.error('Failed to upload banner images')
        return false
      }

      return true
    } catch (error) {
      console.error('Error uploading banner images:', error)
      toast.error('Failed to upload banner images')
      return false
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const selectedTaxonomies = formData.taxonomyFields.filter(field => field.taxonomy_id && field.taxonomy_id !== '')

      if (!isEditMode && selectedTaxonomies.length < 2) {
        toast.error('Please select at least 2 taxonomies for hybrid')
        setLoading(false)
        return
      }

      if (!formData.selectedVernacularId && !formData.manualVernacularName) {
        setFormData(prev => ({ ...prev, commonNameError: 'Please select or enter a common name' }))
        setLoading(false)
        return
      }

      const primaryTaxonomyId = selectedTaxonomies[0]?.taxonomy_id

      const formDataToSend = new FormData()

      if (isEditMode && id) {
        formDataToSend.append('tsn_id', id)
      } else {
        formDataToSend.append('taxonomy_id', primaryTaxonomyId)
      }

      formDataToSend.append('scientific_name', formData.scientificName)
      formDataToSend.append('zoo_id', '11')

      if (formData.manualVernacularName && formData.manualVernacularName.trim() !== '') {
        formDataToSend.append(
          isEditMode && id ? 'vernacular_name' : 'common_name',
          formData.manualVernacularName.trim()
        )
      } else if (formData.selectedVernacularId) {
        formDataToSend.append('vernacular_id', formData.selectedVernacularId)
      }

      if (formData.profileImage && formData.profileImage instanceof File) {
        formDataToSend.append('species_image', formData.profileImage)
      } else if (formData.profileImage && typeof formData.profileImage === 'string') {
        formDataToSend.append('species_image', formData.profileImage)
      }

      let response
      const hasPendingBanners = formData.bannerImages.some(img => img.file && !img.id)

      if (isEditMode && id) {
        if (hasPendingBanners) {
          const bannerUploadSuccess = await uploadBannerImages(id, formData.bannerImages)
          if (!bannerUploadSuccess) {
            setLoading(false)
            return
          }
        }
        response = await UpdateHybrid(formDataToSend, id)
      } else {
        response = await addHybrid(formDataToSend)
      }

      if (response?.success) {
        if (!isEditMode && hasPendingBanners) {
          const newTaxonomyId = response?.data?.tsn_id || response?.data?.taxonomy_id
          if (newTaxonomyId) {
            await uploadBannerImages(newTaxonomyId, formData.bannerImages)
          }
        }

        toast.success(isEditMode ? 'Hybrid updated successfully' : 'Hybrid added successfully')
        onCancel()
      } else {
        toast.error(response?.message || 'Failed to save hybrid')
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
    <HybridForm
      control={control}
      setValue={setValue}
      formErrors={formErrors}
      isEditMode={isEditMode}
      loading={loading}
      formData={formData}
      vernacularOptions={formData.vernacularOptions}
      breedList={formData.breedList}
      morphList={formData.selectedMorphs}
      localityList={formData.selectedLocalities}
      availableMorphs={availableMorphs}
      availableLocalities={availableLocalities}
      isLoadingMorphs={isLoadingMorphs}
      isLoadingLocalities={isLoadingLocalities}
      getFieldOptions={getFieldOptions}
      searchLoading={searchLoading}
      onTaxonomySearch={searchTaxonomy}
      onTaxonomyFieldChange={handleTaxonomyFieldChange}
      onAddTaxonomyField={handleAddTaxonomyField}
      onRemoveTaxonomyField={handleRemoveTaxonomyField}
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
      hasMinimumTaxonomies={hasMinimumTaxonomies()}
      isCreateTaxonomyDrawerOpen={isCreateTaxonomyDrawerOpen}
      onOpenCreateTaxonomyDrawer={handleOpenCreateTaxonomyDrawer}
      onCloseCreateTaxonomyDrawer={handleCloseCreateTaxonomyDrawer}
    />
  )
}

export default HybridAdd
