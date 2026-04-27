import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getTaxonomyListByType, addTaxonomySpecies } from 'src/lib/api/species'
import AddTaxonomyDrawer, { TaxonomyItem, FormValues } from 'src/views/pages/species/AddTaxonomyDrawer'

interface CreateTaxonomyProps {
  open: boolean
  handleClose: () => void
  onSuccess?: (newTaxonomy: any) => void
}

const defaultFormValues: FormValues = {
  new_common_name: '',
  new_scientific_name: '',
  subspecies_common_name: '',
  subspecies_scientific_name: '',
  selected_class_display: '',
  selected_order_display: '',
  selected_family_display: '',
  selected_genus_display: '',
  selected_species_display: ''
}

const formatDisplay = (item: TaxonomyItem | null) => {
  if (!item) return ''
  return `${item.common_name || ''} (${item.scientific_name || ''})`
}

const typeHierarchy = ['class', 'order', 'family', 'genus', 'species', 'subspecies']

const CreateTaxonomy = ({ open, handleClose, onSuccess }: CreateTaxonomyProps) => {
  const { control, watch, getValues, setValue, reset } = useForm<FormValues>({
    defaultValues: defaultFormValues
  })

  const [selectedClass, setSelectedClass] = useState<TaxonomyItem | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<TaxonomyItem | null>(null)
  const [selectedFamily, setSelectedFamily] = useState<TaxonomyItem | null>(null)
  const [selectedGenus, setSelectedGenus] = useState<TaxonomyItem | null>(null)
  const [selectedSpecies, setSelectedSpecies] = useState<TaxonomyItem | null>(null)

  const [currentType, setCurrentType] = useState<string>('class')
  const [newlyCreated, setNewlyCreated] = useState<TaxonomyItem[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState<TaxonomyItem[]>([])
  const [loading, setLoading] = useState(false)

  const [showSubSpecies, setShowSubSpecies] = useState(false)

  const subspeciesCommon = watch('subspecies_common_name')
  const subspeciesScientific = watch('subspecies_scientific_name')

  const getCurrentParentId = useCallback(() => {
    switch (currentType) {
      case 'order':
        return selectedClass?.id
      case 'family':
        return selectedOrder?.id
      case 'genus':
        return selectedFamily?.id
      case 'species':
        return selectedGenus?.id
      default:
        return undefined
    }
  }, [currentType, selectedClass, selectedOrder, selectedFamily, selectedGenus])

  const fetchTaxonomyList = useCallback(
    async (search: string = '') => {
      const parentId = getCurrentParentId()

      if (currentType !== 'class' && !parentId) return

      setLoading(true)
      try {
        const response = await getTaxonomyListByType({
          type: currentType,
          taxonomy_id: parentId,
          q: search
        })

        let data: TaxonomyItem[] = []

        if (response?.success && response?.data) {
          if (response.data.taxa_list && Array.isArray(response.data.taxa_list)) {
            data = response.data.taxa_list
          } else if (Array.isArray(response.data)) {
            data = response.data
          }
        } else if (Array.isArray(response)) {
          data = response
        }
        setOptions(data)
      } catch (error) {
        console.error(`Error fetching ${currentType} list:`, error)
        toast.error(`Failed to fetch ${currentType} list`)
        setOptions([])
      } finally {
        setLoading(false)
      }
    },
    [currentType, getCurrentParentId]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && (currentType === 'class' || getCurrentParentId())) {
        fetchTaxonomyList(searchQuery)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, currentType, getCurrentParentId, open, fetchTaxonomyList])

  const resetAll = () => {
    setSelectedClass(null)
    setSelectedOrder(null)
    setSelectedFamily(null)
    setSelectedGenus(null)
    setSelectedSpecies(null)
    setCurrentType('class')
    setNewlyCreated([])
    setShowSubSpecies(false)
    setSearchQuery('')
    setOptions([])
    setCreateModalOpen(false)
    reset(defaultFormValues)
  }

  useEffect(() => {
    if (open) {
      resetAll()
      setCurrentType('class')
      fetchTaxonomyList('')
    }
  }, [open])

  const handleSelect = (item: TaxonomyItem) => {
    const selectedItem = { ...item, type: currentType }

    switch (currentType) {
      case 'class':
        setSelectedClass(selectedItem)
        setValue('selected_class_display', formatDisplay(selectedItem))
        setCurrentType('order')
        setOptions([])
        setSearchQuery('')
        break
      case 'order':
        setSelectedOrder(selectedItem)
        setValue('selected_order_display', formatDisplay(selectedItem))
        setCurrentType('family')
        setOptions([])
        setSearchQuery('')
        break
      case 'family':
        setSelectedFamily(selectedItem)
        setValue('selected_family_display', formatDisplay(selectedItem))
        setCurrentType('genus')
        setOptions([])
        setSearchQuery('')
        break
      case 'genus':
        setSelectedGenus(selectedItem)
        setValue('selected_genus_display', formatDisplay(selectedItem))
        setCurrentType('species')
        setOptions([])
        setSearchQuery('')
        break
      case 'species':
        setSelectedSpecies(selectedItem)
        setValue('selected_species_display', formatDisplay(selectedItem))
        setCurrentType('')
        setOptions([])
        setShowSubSpecies(true)
        break
    }
  }

  const removeNewlyCreatedFromLevel = (type: string) => {
    const typeIndex = typeHierarchy.indexOf(type)
    setNewlyCreated(prev =>
      prev.filter(item => {
        const itemIndex = typeHierarchy.indexOf(item.type || '')
        return itemIndex < typeIndex
      })
    )
  }

  const handleRemove = (type: string) => {
    switch (type) {
      case 'class':
        setSelectedClass(null)
        setSelectedOrder(null)
        setSelectedFamily(null)
        setSelectedGenus(null)
        setSelectedSpecies(null)
        setCurrentType('class')
        setNewlyCreated([])
        setShowSubSpecies(false)
        setValue('selected_class_display', '')
        setValue('selected_order_display', '')
        setValue('selected_family_display', '')
        setValue('selected_genus_display', '')
        setValue('selected_species_display', '')
        setValue('subspecies_common_name', '')
        setValue('subspecies_scientific_name', '')
        break
      case 'order':
        setSelectedOrder(null)
        setSelectedFamily(null)
        setSelectedGenus(null)
        setSelectedSpecies(null)
        setCurrentType('order')
        removeNewlyCreatedFromLevel('order')
        setShowSubSpecies(false)
        setValue('selected_order_display', '')
        setValue('selected_family_display', '')
        setValue('selected_genus_display', '')
        setValue('selected_species_display', '')
        break
      case 'family':
        setSelectedFamily(null)
        setSelectedGenus(null)
        setSelectedSpecies(null)
        setCurrentType('family')
        removeNewlyCreatedFromLevel('family')
        setShowSubSpecies(false)
        setValue('selected_family_display', '')
        setValue('selected_genus_display', '')
        setValue('selected_species_display', '')
        break
      case 'genus':
        setSelectedGenus(null)
        setSelectedSpecies(null)
        setCurrentType('genus')
        removeNewlyCreatedFromLevel('genus')
        setShowSubSpecies(false)
        setValue('selected_genus_display', '')
        setValue('selected_species_display', '')
        break
      case 'species':
        setSelectedSpecies(null)
        setCurrentType('species')
        removeNewlyCreatedFromLevel('species')
        setShowSubSpecies(false)
        setValue('selected_species_display', '')
        setValue('subspecies_common_name', '')
        setValue('subspecies_scientific_name', '')
        break
    }
    if (currentType !== 'class') {
      fetchTaxonomyList('')
    }
  }

  const handleCreateNew = async () => {
    const values = getValues()
    const common = values.new_common_name
    const scientific = values.new_scientific_name

    if (!common.trim() || !scientific.trim()) {
      toast.error('Please fill both common name and scientific name')
      return
    }

    const newItem: TaxonomyItem = {
      common_name: common,
      scientific_name: scientific,
      type: currentType
    }

    setNewlyCreated(prev => [...prev, newItem])

    switch (currentType) {
      case 'order':
        setSelectedOrder(newItem)
        setValue('selected_order_display', formatDisplay(newItem))
        setCurrentType('family')
        break
      case 'family':
        setSelectedFamily(newItem)
        setValue('selected_family_display', formatDisplay(newItem))
        setCurrentType('genus')
        break
      case 'genus':
        setSelectedGenus(newItem)
        setValue('selected_genus_display', formatDisplay(newItem))
        setCurrentType('species')
        break
      case 'species':
        setSelectedSpecies(newItem)
        setValue('selected_species_display', formatDisplay(newItem))
        setCurrentType('')
        break
    }

    setCreateModalOpen(false)
    setValue('new_common_name', '')
    setValue('new_scientific_name', '')
    setOptions([])
    setSearchQuery('')
  }

  const handleSubmit = async () => {
    const taxa = newlyCreated.map(item => ({
      type: item.type,
      scientific_name: item.scientific_name,
      common_name: item.common_name
    }))

    const subCommon = getValues('subspecies_common_name')
    const subScientific = getValues('subspecies_scientific_name')

    if (showSubSpecies && subCommon.trim() && subScientific.trim()) {
      taxa.push({
        type: 'subspecies',
        scientific_name: subScientific,
        common_name: subCommon
      })
    }

    let parentId: string | undefined
    let parentType = ''

    if (selectedSpecies?.id) {
      parentId = selectedSpecies.id
      parentType = 'species'
    } else if (selectedGenus?.id) {
      parentId = selectedGenus.id
      parentType = 'genus'
    } else if (selectedFamily?.id) {
      parentId = selectedFamily.id
      parentType = 'family'
    } else if (selectedOrder?.id) {
      parentId = selectedOrder.id
      parentType = 'order'
    } else if (selectedClass?.id) {
      parentId = selectedClass.id
      parentType = 'class'
    }

    if (taxa.length > 0 && !parentId) {
      const lastTaxon = taxa[taxa.length - 1]
      parentType = lastTaxon.type || parentType
    }

    const payload = {
      parent_id: parentId || '',
      parent_type: parentType,
      taxa: taxa
    }

    try {
      const response = await addTaxonomySpecies(payload)
      if (response?.success) {
        toast.success('Taxonomy created successfully')

        let finalTaxonomy = selectedSpecies || selectedGenus || selectedFamily || selectedOrder || selectedClass

        if (showSubSpecies && subCommon) {
          finalTaxonomy = {
            taxonomy_id: response.data?.final_taxonomy_id,
            common_name: subCommon,
            scientific_name: subScientific
          }
        } else if (selectedSpecies && !selectedSpecies.id) {
          finalTaxonomy = {
            taxonomy_id: response.data?.final_taxonomy_id,
            common_name: selectedSpecies.common_name,
            scientific_name: selectedSpecies.scientific_name
          }
        }

        if (onSuccess) {
          onSuccess(finalTaxonomy)
        }
        resetAll()
        handleClose()
      } else {
        toast.error(response?.message || 'Failed to create taxonomy')
      }
    } catch (error) {
      console.error('Error creating taxonomy:', error)
      toast.error('Something went wrong')
    }
  }

  const isSubmitEnabled = () => {
    if (!selectedSpecies) return false

    const speciesFromDropdown = Boolean(selectedSpecies.id)

    if (speciesFromDropdown) {
      return subspeciesCommon.trim().length > 0 && subspeciesScientific.trim().length > 0
    }

    if (showSubSpecies) {
      const hasAny = subspeciesCommon.trim().length > 0 || subspeciesScientific.trim().length > 0
      if (hasAny) {
        return subspeciesCommon.trim().length > 0 && subspeciesScientific.trim().length > 0
      }
    }

    return true
  }

  const getOptionLabel = (option: TaxonomyItem) => {
    if (!option) return ''
    return option.scientific_name || option.common_name || ''
  }

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    setValue('new_common_name', '')
    setValue('new_scientific_name', '')
  }

  const handleCloseSubSpecies = () => {
    setShowSubSpecies(false)
    setValue('subspecies_common_name', '')
    setValue('subspecies_scientific_name', '')
  }

  return (
    <AddTaxonomyDrawer
      open={open}
      onClose={handleClose}
      control={control}
      selectedClass={selectedClass}
      selectedOrder={selectedOrder}
      selectedFamily={selectedFamily}
      selectedGenus={selectedGenus}
      selectedSpecies={selectedSpecies}
      currentType={currentType}
      options={options}
      loading={loading}
      createModalOpen={createModalOpen}
      showSubSpecies={showSubSpecies}
      isSubmitEnabled={isSubmitEnabled()}
      onSearchChange={setSearchQuery}
      onSelect={handleSelect}
      onRemove={handleRemove}
      onCreateNew={handleCreateNew}
      onOpenCreateModal={() => setCreateModalOpen(true)}
      onCloseCreateModal={handleCloseCreateModal}
      onOpenSubSpecies={() => setShowSubSpecies(true)}
      onCloseSubSpecies={handleCloseSubSpecies}
      onSubmit={handleSubmit}
      getOptionLabel={getOptionLabel}
    />
  )
}

export default CreateTaxonomy
