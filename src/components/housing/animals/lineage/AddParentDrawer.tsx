import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  IconButton,
  Autocomplete,
  Card
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Cancel as CancelIcon,
  AddCircleOutline as AddCircleOutlineIcon
} from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { format } from 'date-fns'

import Toaster from 'src/components/Toaster'
import MultiSelectAnimalDrawer, { type Animal } from './MultiSelectAnimalDrawer'
import AnimalCard from 'src/views/utility/AnimalCard'
import { addLineageParent, editExternalParent, getClutchList, getLitterList } from 'src/lib/api/housing'
import { getAnimalGetconfigs, getMasterInstitutes } from 'src/lib/api/egg/egg/createAnimal'
import { getBreed, getMutationById, getSearchTaxonomyList } from 'src/lib/api/species'
import type {
  AddParentPayload,
  EditExternalParentPayload,
  ExternalAnimal,
  ClutchItem,
  LitterItem
} from 'src/types/housing'

interface AddParentDrawerProps {
  open: boolean
  onClose: () => void
  animalId: number | string
  taxonomyId?: number | string
  parentType: 'sire' | 'dam'
  onSuccess: () => void
  editMode?: boolean
  editData?: ExternalAnimal | null
  isEggAnimal?: boolean
  // Parent counts for disabling radio options
  externalMotherCount?: number
  externalFatherCount?: number
  internalMotherCount?: number
  internalFatherCount?: number
}

interface IdentifierType {
  id: number
  label: string
  string_id?: string
}

interface InstituteOption {
  id: number
  label: string
  name?: string
}

interface SubTaxonOption {
  sub_taxon_id: number
  sub_taxon_name: string
}

interface TaxonomyOption {
  tsn: number
  complete_name?: string
  default_common_name?: string
  scientific_name?: string
}

interface ExternalParentFormData {
  taxonomy_id: string
  taxonomy_name: string
  identifier_type_id: string
  local_identifier: string
  institute_id: string
  institute_name: string
  is_alive: string
  breed_id: string
  breed_name: string
  morph_id: string
  morph_name: string
}

const externalSchema = yup.object().shape({
  taxonomy_id: yup.string().required('Species is required'),
  taxonomy_name: yup.string(),
  identifier_type_id: yup.string().required('Identity type is required'),
  local_identifier: yup.string().required('ID Number is required'),
  institute_id: yup.string().required('Institute is required'),
  institute_name: yup.string(),
  is_alive: yup.string().required('Status is required'),
  breed_id: yup.string(),
  breed_name: yup.string(),
  morph_id: yup.string(),
  morph_name: yup.string()
})

const AddParentDrawer: React.FC<AddParentDrawerProps> = ({
  open,
  onClose,
  animalId,
  taxonomyId,
  parentType,
  onSuccess,
  editMode = false,
  editData = null,
  isEggAnimal = false,
  externalMotherCount = 0,
  externalFatherCount = 0,
  internalMotherCount = 0,
  internalFatherCount = 0
}) => {
  const theme = useTheme() as any
  const [parentSource, setParentSource] = useState<'internal' | 'external'>(editMode ? 'external' : 'internal')

  // Disable logic for radio buttons (matching mobile implementation)
  // External option disabled when: NOT editMode AND already has a parent (internal or external)
  const isExternalDisabled =
    !editMode &&
    ((parentType === 'dam' && (externalMotherCount >= 1 || internalMotherCount >= 1)) ||
      (parentType === 'sire' && (externalFatherCount >= 1 || internalFatherCount >= 1)))

  // Internal option disabled when: editing an external parent
  const isInternalDisabled = editMode
  const [selectedAnimals, setSelectedAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(false)

  // Animal Drawer state
  const [animalDrawerOpen, setAnimalDrawerOpen] = useState(false)

  // Clutch/Litter state (for Dam with egg-laying animals)
  const [clutchLitterMode, setClutchLitterMode] = useState<'existing' | 'new'>('new')
  const [selectedClutchLitter, setSelectedClutchLitter] = useState<ClutchItem | LitterItem | null>(null)

  // Selected dropdown values for external form
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<TaxonomyOption | null>(null)
  const [taxonomySearchInput, setTaxonomySearchInput] = useState('')
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteOption | null>(null)
  const [selectedBreed, setSelectedBreed] = useState<SubTaxonOption | null>(null)
  const [selectedMorph, setSelectedMorph] = useState<SubTaxonOption | null>(null)

  // Show clutch/litter selector only for Dam (mother) with egg-laying animals
  const showClutchLitterSelector = parentType === 'dam' && isEggAnimal && !editMode

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ExternalParentFormData>({
    defaultValues: {
      taxonomy_id: taxonomyId?.toString() || '',
      taxonomy_name: '',
      identifier_type_id: '',
      local_identifier: '',
      institute_id: '',
      institute_name: '',
      is_alive: '1',
      breed_id: '',
      breed_name: '',
      morph_id: '',
      morph_name: ''
    },
    resolver: yupResolver(externalSchema)
  })

  // Get the current taxonomy ID (from selected or prop)
  const currentTaxonomyId = selectedTaxonomy?.tsn || taxonomyId

  // Fetch taxonomy search results
  const { data: taxonomyOptions, isLoading: isTaxonomyLoading } = useQuery({
    queryKey: ['taxonomy-search', taxonomySearchInput],
    queryFn: async () => {
      if (!taxonomySearchInput || taxonomySearchInput.length < 3) return []
      const res = await getSearchTaxonomyList({ q: taxonomySearchInput })

      return res?.data || []
    },
    enabled: Boolean(
      open && taxonomySearchInput && taxonomySearchInput.length >= 3 && (parentSource === 'external' || editMode)
    )
  })

  // Fetch animal configs for identifier types
  const { data: animalConfigs, isLoading: isConfigsLoading } = useQuery({
    queryKey: ['animal-configs'],
    queryFn: async () => {
      const res = await getAnimalGetconfigs({})

      return res?.data || res
    },
    enabled: Boolean(open && (parentSource === 'external' || editMode))
  })

  // Fetch institutes list
  const { data: institutesList, isLoading: isInstitutesLoading } = useQuery({
    queryKey: ['master-institutes'],
    queryFn: async () => {
      const res = await getMasterInstitutes({})

      return res?.data || []
    },
    enabled: Boolean(open && (parentSource === 'external' || editMode))
  })

  // Fetch breed list based on selected taxonomy
  const { data: breedList, isLoading: isBreedLoading } = useQuery({
    queryKey: ['breed-list', currentTaxonomyId],
    queryFn: async () => {
      if (!currentTaxonomyId) return []
      const res = await getBreed(currentTaxonomyId)

      return res?.data || []
    },
    enabled: Boolean(open && currentTaxonomyId && (parentSource === 'external' || editMode))
  })

  // Fetch morph list based on selected taxonomy
  const { data: morphList, isLoading: isMorphLoading } = useQuery({
    queryKey: ['morph-list', currentTaxonomyId],
    queryFn: async () => {
      if (!currentTaxonomyId) return []
      const res = await getMutationById(currentTaxonomyId)

      return res?.data || []
    },
    enabled: Boolean(open && currentTaxonomyId && (parentSource === 'external' || editMode))
  })

  const identifierTypes: IdentifierType[] = animalConfigs?.animal_indetifier || []

  // Reset form when drawer opens/closes or editMode changes
  useEffect(() => {
    if (open) {
      if (editMode && editData) {
        setParentSource('external')
        // In edit mode, taxonomy comes from the prop (the animal's taxonomy)
        setSelectedTaxonomy(null)
        setTaxonomySearchInput('')
        setSelectedInstitute(
          editData.institute_id ? { id: Number(editData.institute_id), label: editData.organization_name || '' } : null
        )
        setSelectedBreed(
          editData.breed_id
            ? { sub_taxon_id: Number(editData.breed_id), sub_taxon_name: editData.breed_name || '' }
            : null
        )
        setSelectedMorph(
          editData.morph_id
            ? { sub_taxon_id: Number(editData.morph_id), sub_taxon_name: editData.morph_name || '' }
            : null
        )
        reset({
          taxonomy_id: taxonomyId?.toString() || '',
          taxonomy_name: '',
          identifier_type_id: editData.local_identifier_id?.toString() || '',
          local_identifier: editData.local_identifier || '',
          institute_id: editData.institute_id?.toString() || '',
          institute_name: editData.organization_name || '',
          is_alive: String(editData.is_alive || '1'),
          breed_id: editData.breed_id?.toString() || '',
          breed_name: editData.breed_name || '',
          morph_id: editData.morph_id?.toString() || '',
          morph_name: editData.morph_name || ''
        })
      } else {
        setParentSource('internal')
        setSelectedAnimals([])
        setClutchLitterMode('new')
        setSelectedClutchLitter(null)
        setSelectedTaxonomy(null)
        setTaxonomySearchInput('')
        setSelectedInstitute(null)
        setSelectedBreed(null)
        setSelectedMorph(null)
        reset({
          taxonomy_id: '',
          taxonomy_name: '',
          identifier_type_id: '',
          local_identifier: '',
          institute_id: '',
          institute_name: '',
          is_alive: '1',
          breed_id: '',
          breed_name: '',
          morph_id: '',
          morph_name: ''
        })
      }
    }
  }, [open, editMode, editData, reset, taxonomyId])

  // Fetch clutch list for egg-laying animals
  const { data: clutchListData, isLoading: isClutchLoading } = useQuery({
    queryKey: ['clutch-list', animalId, open],
    queryFn: async () => {
      const res = await getClutchList({ animal_id: animalId })

      return res?.data?.result || []
    },
    enabled: Boolean(open && showClutchLitterSelector && isEggAnimal)
  })

  // Fetch litter list for live-bearing animals
  const { data: litterListData, isLoading: isLitterLoading } = useQuery({
    queryKey: ['litter-list', animalId, open],
    queryFn: async () => {
      const res = await getLitterList({ animal_id: animalId, is_recent: 0 })

      return res?.data?.result || []
    },
    enabled: Boolean(open && showClutchLitterSelector && !isEggAnimal && parentType === 'dam')
  })

  const clutchLitterList = isEggAnimal ? clutchListData : litterListData
  const isClutchLitterLoading = isEggAnimal ? isClutchLoading : isLitterLoading

  const handleRemoveSelected = (animalIdToRemove: number | undefined) => {
    setSelectedAnimals(prev => prev.filter(a => a.animal_id !== animalIdToRemove))
  }

  const handleAnimalSelection = (animals: Animal[]) => {
    setSelectedAnimals(animals)
  }

  const handleSubmitInternal = async () => {
    if (selectedAnimals.length === 0) {
      Toaster({ type: 'error', message: 'Please select at least one animal' })

      return
    }

    // Validate clutch/litter selection for Dam with egg-laying animals
    if (showClutchLitterSelector && clutchLitterMode === 'existing' && !selectedClutchLitter) {
      Toaster({ type: 'error', message: `Please select a ${isEggAnimal ? 'clutch' : 'litter'}` })

      return
    }

    setLoading(true)
    try {
      const payload: AddParentPayload = {
        animal_id: animalId,
        is_mother: parentType === 'dam' ? 1 : 0,
        type: 'internal',
        parent_id: JSON.stringify(selectedAnimals.map(a => Number(a.animal_id)))
      }

      // Add clutch/litter fields for Dam
      if (showClutchLitterSelector) {
        payload.ref_type = isEggAnimal ? 'clutch' : 'litter'
        if (clutchLitterMode === 'new') {
          payload.create_new = true
        } else if (selectedClutchLitter) {
          payload.ref_id = isEggAnimal
            ? (selectedClutchLitter as ClutchItem).clutch_id
            : (selectedClutchLitter as LitterItem).litter_id
        }
      }

      const res = await addLineageParent(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Parent added successfully' })
        onSuccess()
        onClose()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to add parent' })
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitExternal = async (data: ExternalParentFormData) => {
    setLoading(true)
    try {
      if (editMode && editData?.external_parent_id) {
        const payload: EditExternalParentPayload = {
          external_parent_id: editData.external_parent_id,
          animal_id: animalId,
          parent_type: parentType,
          local_identifier: data.local_identifier,
          organization_name: data.institute_name,
          is_alive: data.is_alive
        }

        const res = await editExternalParent(payload)
        if (res?.success) {
          Toaster({ type: 'success', message: res?.message || 'Parent updated successfully' })
          onSuccess()
          onClose()
        } else {
          Toaster({ type: 'error', message: res?.message || 'Failed to update parent' })
        }
      } else {
        // External parent - parent_id is a JSON stringified object
        const parentObject = {
          taxonomy_id: currentTaxonomyId,
          identifier: data.local_identifier,
          identifier_type: data.identifier_type_id ? Number(data.identifier_type_id) : undefined,
          is_alive: data.is_alive === '1' ? 1 : 0,
          institute_id: data.institute_id ? Number(data.institute_id) : undefined,
          institute_name: data.institute_name,
          breed_id: data.breed_id ? Number(data.breed_id) : undefined,
          breed_name: data.breed_name,
          morph_id: data.morph_id ? Number(data.morph_id) : undefined,
          morph_name: data.morph_name
        }

        const payload: AddParentPayload = {
          animal_id: animalId,
          is_mother: parentType === 'dam' ? 1 : 0,
          type: 'external',
          parent_id: JSON.stringify(parentObject)
        }

        // Add clutch/litter fields for Dam
        if (showClutchLitterSelector) {
          payload.ref_type = isEggAnimal ? 'clutch' : 'litter'
          if (clutchLitterMode === 'new') {
            payload.create_new = true
          } else if (selectedClutchLitter) {
            payload.ref_id = isEggAnimal
              ? (selectedClutchLitter as ClutchItem).clutch_id
              : (selectedClutchLitter as LitterItem).litter_id
          }
        }

        const res = await addLineageParent(payload)
        if (res?.success) {
          Toaster({ type: 'success', message: res?.message || 'Parent added successfully' })
          onSuccess()
          onClose()
        } else {
          Toaster({ type: 'error', message: res?.message || 'Failed to add parent' })
        }
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const getLocalIdentifier = (animal: Animal) => {
    if (animal.local_identifier_value) {
      const name = animal.local_identifier_name ? `${animal.local_identifier_name}: ` : ''

      return `${name}${animal.local_identifier_value}`
    }

    return `AID: ${animal.animal_id}`
  }

  const title = editMode
    ? `Edit External ${parentType === 'sire' ? 'Sire' : 'Dam'}`
    : `Add ${parentType === 'sire' ? 'Sire (Father)' : 'Dam (Mother)'}`

  const isInternalFormValid = selectedAnimals.length > 0

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '562px'],
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            p: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
            backgroundColor: theme.palette.customColors?.OnPrimary
          }}
        >
          <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors?.OnSurfaceVariant }}>
            {title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon sx={{ color: theme.palette.customColors?.OnSurfaceVariant }} />
          </IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            px: 5,
            py: 4
          }}
        >
          {/* Parent Source Toggle - Hide in edit mode */}
          {!editMode && (
            <Card
              elevation={0}
              sx={{
                p: 4
              }}
            >
              {/* Header with icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurfaceVariant
                  }}
                >
                  Animal is part of which system?
                </Typography>
              </Box>

              {/* Toggle Buttons */}
              <Box sx={{ display: 'flex', gap: 0 }}>
                {/* Antz (Internal) Option */}
                <Box
                  onClick={() => !isInternalDisabled && setParentSource('internal')}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 3,
                    px: 4,
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    cursor: isInternalDisabled ? 'not-allowed' : 'pointer',
                    opacity: isInternalDisabled ? 0.5 : 1,
                    backgroundColor:
                      parentSource === 'internal'
                        ? theme.palette.customColors?.OnPrimaryContainer
                        : theme.palette.background.paper,
                    border: `1px solid ${
                      parentSource === 'internal'
                        ? theme.palette.customColors?.OnPrimaryContainer
                        : theme.palette.customColors?.OutlineVariant || theme.palette.divider
                    }`,
                    borderRight: parentSource === 'internal' ? undefined : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color:
                        parentSource === 'internal' ? theme.palette.customColors?.OnPrimary : theme.palette.text.primary
                    }}
                  >
                    Antz
                  </Typography>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${
                        parentSource === 'internal' ? theme.palette.primary.main : theme.palette.grey[400]
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent'
                    }}
                  >
                    {parentSource === 'internal' && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.primary.main
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* External Option */}
                <Box
                  onClick={() => !isExternalDisabled && setParentSource('external')}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 3,
                    px: 4,
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    cursor: isExternalDisabled ? 'not-allowed' : 'pointer',
                    opacity: isExternalDisabled ? 0.5 : 1,
                    backgroundColor:
                      parentSource === 'external'
                        ? theme.palette.customColors?.OnPrimaryContainer
                        : theme.palette.background.paper,
                    border: `1px solid ${
                      parentSource === 'external'
                        ? theme.palette.customColors?.OnPrimaryContainer
                        : theme.palette.customColors?.OutlineVariant || theme.palette.divider
                    }`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color:
                        parentSource === 'external' ? theme.palette.customColors?.OnPrimary : theme.palette.text.primary
                    }}
                  >
                    External
                  </Typography>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${
                        parentSource === 'external' ? theme.palette.primary.main : theme.palette.grey[400]
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent'
                    }}
                  >
                    {parentSource === 'external' && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.primary.main
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Card>
          )}

          {/* Clutch/Litter Selector for Dam with egg-laying animals */}
          {showClutchLitterSelector && (
            <Box
              sx={{
                p: 4,
                border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                borderRadius: '8px',
                backgroundColor: alpha(theme.palette.primary.main, 0.02)
              }}
            >
              <Typography
                sx={{ fontSize: '16px', fontWeight: 500, mb: 3, color: theme.palette.customColors?.OnSurfaceVariant }}
              >
                {isEggAnimal ? 'Clutch Details' : 'Litter Details'}
              </Typography>

              {/* Existing vs New Toggle */}
              <RadioGroup
                row
                value={clutchLitterMode}
                onChange={e => {
                  setClutchLitterMode(e.target.value as 'existing' | 'new')
                  setSelectedClutchLitter(null)
                }}
              >
                <FormControlLabel
                  value='existing'
                  control={<Radio size='small' />}
                  label='Existing'
                  disabled={!clutchLitterList || clutchLitterList.length === 0}
                  sx={{ mr: 4 }}
                />
                <FormControlLabel value='new' control={<Radio size='small' />} label='Create New' />
              </RadioGroup>

              {/* Clutch/Litter Dropdown for existing */}
              {clutchLitterMode === 'existing' && (
                <Box sx={{ mt: 3 }}>
                  {isClutchLitterLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : clutchLitterList && clutchLitterList.length > 0 ? (
                    <FormControl fullWidth size='small'>
                      <InputLabel>{isEggAnimal ? 'Select Clutch' : 'Select Litter'}</InputLabel>
                      <Select
                        value={
                          selectedClutchLitter
                            ? isEggAnimal
                              ? (selectedClutchLitter as ClutchItem).clutch_id
                              : (selectedClutchLitter as LitterItem).litter_id
                            : ''
                        }
                        label={isEggAnimal ? 'Select Clutch' : 'Select Litter'}
                        onChange={e => {
                          const id = e.target.value

                          const selected = clutchLitterList?.find((item: ClutchItem | LitterItem) =>
                            isEggAnimal ? (item as ClutchItem).clutch_id === id : (item as LitterItem).litter_id === id
                          )
                          setSelectedClutchLitter(selected || null)
                        }}
                      >
                        {clutchLitterList.map((item: ClutchItem | LitterItem) => {
                          const id = isEggAnimal ? (item as ClutchItem).clutch_id : (item as LitterItem).litter_id
                          const label = isEggAnimal ? (item as ClutchItem).clutch_no : (item as LitterItem).litter_no
                          const date = item.start_date || item.created_at

                          return (
                            <MenuItem key={id} value={id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography>{label}</Typography>
                                {date && (
                                  <>
                                    <Typography sx={{ color: theme.palette.text.secondary }}>|</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <CalendarIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                      <Typography sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                                        {format(new Date(date), 'dd MMM yyyy')}
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                              </Box>
                            </MenuItem>
                          )
                        })}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary, textAlign: 'center' }}>
                      No {isEggAnimal ? 'clutches' : 'litters'} found
                    </Typography>
                  )}
                </Box>
              )}

              {clutchLitterMode === 'new' && (
                <Typography sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, mt: 2 }}>
                  A new {isEggAnimal ? 'clutch' : 'litter'} will be created automatically when you add the parent.
                </Typography>
              )}
            </Box>
          )}

          {/* Internal Parent Selection */}
          {parentSource === 'internal' && !editMode && (
            <Card
              sx={{
                p: 4,
                borderRadius: '8px'
              }}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant,
                  mb: 3
                }}
              >
                {parentType === 'sire' ? 'Add Sire' : 'Add Dam'}
              </Typography>

              {/* No animals selected - Show Select Animal Button */}
              {selectedAnimals.length === 0 && (
                <Box
                  onClick={() => setAnimalDrawerOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 4,
                    border: `2px dashed ${theme.palette.primary.main}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.primary.main }}>
                    Select Animal
                  </Typography>
                  <AddIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
              )}

              {/* Selected Animals Display */}
              {selectedAnimals.length > 0 && (
                <>
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pb: 2,
                      borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`
                    }}
                  >
                    <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.text.primary }}>
                      Selected - {selectedAnimals.length}
                    </Typography>
                    <IconButton
                      onClick={() => setAnimalDrawerOpen(true)}
                      sx={{ color: theme.palette.primary.main, p: 0.5 }}
                    >
                      <AddCircleOutlineIcon />
                    </IconButton>
                  </Box>

                  {/* Animal Cards - Show all selected */}
                  {selectedAnimals.map((animal, index) => (
                    <Box
                      key={animal.animal_id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 3,
                        borderBottom:
                          index < selectedAnimals.length - 1
                            ? `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`
                            : 'none'
                      }}
                    >
                      {/* Animal Card */}
                      <AnimalCard data={animal} />

                      {/* Remove Button */}
                      <IconButton
                        onClick={() => handleRemoveSelected(animal.animal_id)}
                        sx={{ color: theme.palette.error.main, p: 0.5, alignSelf: 'center' }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  ))}
                </>
              )}
            </Card>
          )}

          {/* External Parent Form */}
          {(parentSource === 'external' || editMode) && (
            <Card sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
              {/* Species/Taxonomy Autocomplete */}
              <Controller
                name='taxonomy_id'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={taxonomyOptions || []}
                    getOptionLabel={(option: TaxonomyOption) =>
                      option.complete_name || option.default_common_name || option.scientific_name || ''
                    }
                    value={selectedTaxonomy}
                    loading={isTaxonomyLoading}
                    inputValue={taxonomySearchInput}
                    onInputChange={(_, newInputValue) => {
                      setTaxonomySearchInput(newInputValue)
                    }}
                    onChange={(_, newValue) => {
                      setSelectedTaxonomy(newValue)
                      setValue('taxonomy_id', newValue?.tsn?.toString() || '')
                      setValue('taxonomy_name', newValue?.complete_name || newValue?.default_common_name || '')
                      // Reset breed and morph when taxonomy changes
                      setSelectedBreed(null)
                      setSelectedMorph(null)
                      setValue('breed_id', '')
                      setValue('breed_name', '')
                      setValue('morph_id', '')
                      setValue('morph_name', '')
                    }}
                    filterOptions={x => x} // Disable client-side filtering since we search server-side
                    renderOption={(props, option) => (
                      <Box component='li' {...props} key={option.tsn}>
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>
                            {option.default_common_name || option.complete_name}
                          </Typography>
                          {option.complete_name && option.default_common_name && (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              {option.complete_name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Species *'
                        placeholder='Search species (min 3 characters)'
                        error={!!errors.taxonomy_id}
                        helperText={errors.taxonomy_id?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isTaxonomyLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                )}
              />

              {/* Identity Type Dropdown */}
              <Controller
                name='identifier_type_id'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.identifier_type_id}>
                    <InputLabel>Identity Type *</InputLabel>
                    <Select
                      {...field}
                      label='Identity Type *'
                      disabled={isConfigsLoading}
                      startAdornment={isConfigsLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                    >
                      {identifierTypes.map(type => (
                        <MenuItem key={type.id} value={type.id.toString()}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.identifier_type_id && (
                      <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                        {errors.identifier_type_id.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* ID Number */}
              <Controller
                name='local_identifier'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='ID Number *'
                    placeholder='Enter ID number'
                    fullWidth
                    error={!!errors.local_identifier}
                    helperText={errors.local_identifier?.message}
                  />
                )}
              />

              {/* Institute Autocomplete */}
              <Controller
                name='institute_id'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={institutesList || []}
                    getOptionLabel={(option: InstituteOption) => option.label || option.name || ''}
                    value={selectedInstitute}
                    loading={isInstitutesLoading}
                    onChange={(_, newValue) => {
                      setSelectedInstitute(newValue)
                      setValue('institute_id', newValue?.id?.toString() || '')
                      setValue('institute_name', newValue?.label || newValue?.name || '')
                    }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Institute/Organization *'
                        placeholder='Select institute'
                        error={!!errors.institute_id}
                        helperText={errors.institute_id?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isInstitutesLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                )}
              />

              {/* Status Dropdown */}
              <Controller
                name='is_alive'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.is_alive}>
                    <InputLabel>Status *</InputLabel>
                    <Select {...field} label='Status *'>
                      <MenuItem value='1'>Alive</MenuItem>
                      <MenuItem value='0'>Dead</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              {/* Breed Autocomplete - Only show if breeds available */}
              {breedList && breedList.length > 0 && (
                <Controller
                  name='breed_id'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={breedList || []}
                      getOptionLabel={(option: SubTaxonOption) => option.sub_taxon_name || ''}
                      value={selectedBreed}
                      loading={isBreedLoading}
                      onChange={(_, newValue) => {
                        setSelectedBreed(newValue)
                        setValue('breed_id', newValue?.sub_taxon_id?.toString() || '')
                        setValue('breed_name', newValue?.sub_taxon_name || '')
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Breed'
                          placeholder='Select breed'
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isBreedLoading ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                    />
                  )}
                />
              )}

              {/* Morph Autocomplete - Only show if morphs available */}
              {morphList && morphList.length > 0 && (
                <Controller
                  name='morph_id'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={morphList || []}
                      getOptionLabel={(option: SubTaxonOption) => option.sub_taxon_name || ''}
                      value={selectedMorph}
                      loading={isMorphLoading}
                      onChange={(_, newValue) => {
                        setSelectedMorph(newValue)
                        setValue('morph_id', newValue?.sub_taxon_id?.toString() || '')
                        setValue('morph_name', newValue?.sub_taxon_name || '')
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Morph/Variant'
                          placeholder='Select morph'
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isMorphLoading ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                    />
                  )}
                />
              )}
            </Card>
          )}
        </Box>

        {/* Footer Button */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            gap: 2
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            color='primary'
            sx={{
              p: 3,
              fontWeight: 600,
              color: theme.palette.customColors?.OnPrimaryContainer,
              borderColor: theme.palette.customColors?.OnPrimaryContainer
            }}
            onClick={onClose}
          >
            CANCEL
          </Button>
          {parentSource === 'internal' && !editMode ? (
            <Button
              variant='contained'
              fullWidth
              color='primary'
              onClick={handleSubmitInternal}
              disabled={loading || !isInternalFormValid}
              sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors?.OnPrimaryContainer }}
            >
              {loading ? (
                <CircularProgress size={24} color='inherit' />
              ) : selectedAnimals.length > 1 ? (
                `ADD ${selectedAnimals.length} PARENTS`
              ) : (
                'ADD PARENT'
              )}
            </Button>
          ) : (
            <Button
              variant='contained'
              fullWidth
              color='primary'
              onClick={handleSubmit(handleSubmitExternal)}
              disabled={loading}
              sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors?.OnPrimaryContainer }}
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : editMode ? 'UPDATE PARENT' : 'ADD PARENT'}
            </Button>
          )}
        </Box>
      </Drawer>

      {/* Animal Selection Drawer */}
      <MultiSelectAnimalDrawer
        open={animalDrawerOpen}
        onClose={() => setAnimalDrawerOpen(false)}
        onSelect={handleAnimalSelection}
        initialSelectedAnimals={selectedAnimals}
        title={`Select ${parentType === 'sire' ? 'Sire (Father)' : 'Dam (Mother)'}`}
        btnText='SELECT'
        searchPlaceholder={`Search ${parentType === 'sire' ? 'male' : 'female'} animals`}
        extraParams={{
          type: 'single',
          gender: parentType === 'sire' ? 'male' : 'female',
          include_dead_animal: 1,
          ignore_permission: 1,
          tsn_id: taxonomyId,
          use_case: 'add_parent',
          relevant_animal_id: animalId
        }}
        zIndex={1300}
      />
    </>
  )
}

export default React.memo(AddParentDrawer)
