// src/components/species/SpeciesForm.tsx
import React, { useState } from 'react'
import { Box, Button, Card, TextField, Typography, useTheme } from '@mui/material'
import { AddBoxOutlined, BiotechRounded, FilterListRounded } from '@mui/icons-material'
import { BannerImagesUpload, CommonNamesSection, ProfileImageUpload } from './SpeciesFields'
import { BreedDialog, BreedList, LocalityDialog, LocalityList, MorphDialog, MorphList } from './SpeciesListComponent'
import SpeciesDynamicFields from './SpeciesDynamicFields'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import CreateTaxonomy from 'src/components/maters/species/CreateTaxonomy'

const MUIAutoComplete = MUIAutocomplete as React.FC<any>

// Interfaces
interface TaxonomyOption {
  scientific_name: string
  common_name: string
  taxonomy_id: string
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

interface DynamicSection {
  id: string
  label: string
  string_id: string
  field_type: string
  fields: any[]
  additional_info?: any
}

interface DynamicFieldValue {
  [key: string]: any
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

interface SpeciesFormProps {
  control: any
  setValue: (name: string, value: any) => void
  formErrors: any
  isEditMode: boolean
  shouldShowDynamicFields: boolean
  loading: boolean
  isTaxonomySearching: boolean
  formData: SpeciesFormData
  taxonomyOptions: TaxonomyOption[]
  vernacularOptions: any[]
  breedList: BreedItem[]
  morphList: MorphItem[]
  localityList: LocalityItem[]
  availableMorphs?: MorphItem[]
  availableLocalities?: LocalityItem[]
  isLoadingMorphs?: boolean
  isLoadingLocalities?: boolean
  dynamicSchema: DynamicSection[]
  dynamicFormValues: DynamicFieldValue
  onTaxonomySearch: (searchText: string) => void
  onTaxonomySelect: (taxonomy: TaxonomyOption | null) => void
  onVernacularSelect: (value: string) => void
  onVernacularNameChange: (value: string) => void
  onProfileImageChange: (file: File) => void
  onBannerImagesChange: (files: File[]) => void
  onRemoveBannerImage: (image: BannerImage) => void
  onAddBreed: () => void
  onRemoveBreed: (id: string) => void
  onAddMorph: (morphs: MorphItem[]) => void
  onRemoveMorph: (id: string) => void
  onAddLocality: (localities: LocalityItem[]) => void
  onRemoveLocality: (id: string) => void
  onDynamicFieldChange: (fieldId: string, index: number, value: any) => void
  onDynamicFieldRemove: (fieldId: string, removeIndex: number, instanceCount: number) => void
  isBreedDialogOpen: boolean
  breedName: string
  onBreedNameChange: (value: string) => void
  onBreedDialogOpen: () => void
  onBreedDialogClose: () => void
  isMorphDialogOpen: boolean
  onMorphDialogOpen: () => void
  onMorphDialogClose: () => void
  isLocalityDialogOpen: boolean
  onLocalityDialogOpen: () => void
  onLocalityDialogClose: () => void
  onSubmit: () => void
  onCancel: () => void
  isCreateTaxonomyDrawerOpen: boolean
  onOpenCreateTaxonomyDrawer: () => void
  onCloseCreateTaxonomyDrawer: () => void
}

const SpeciesForm: React.FC<SpeciesFormProps> = ({
  control,
  setValue,
  formErrors,
  isEditMode,
  shouldShowDynamicFields,
  loading,
  isTaxonomySearching,
  formData,
  taxonomyOptions,
  vernacularOptions,
  breedList,
  morphList,
  localityList,
  availableMorphs = [],
  availableLocalities = [],
  isLoadingMorphs = false,
  isLoadingLocalities = false,
  dynamicSchema,
  dynamicFormValues,
  onTaxonomySearch,
  onTaxonomySelect,
  onVernacularSelect,
  onVernacularNameChange,
  onProfileImageChange,
  onBannerImagesChange,
  onRemoveBannerImage,
  onAddBreed,
  onRemoveBreed,
  onAddMorph,
  onRemoveMorph,
  onAddLocality,
  onRemoveLocality,
  onDynamicFieldChange,
  onDynamicFieldRemove,
  isCreateTaxonomyDrawerOpen,
  onOpenCreateTaxonomyDrawer,
  onCloseCreateTaxonomyDrawer,

  isBreedDialogOpen,
  breedName,
  onBreedNameChange,
  onBreedDialogOpen,
  onBreedDialogClose,
  isMorphDialogOpen,
  onMorphDialogOpen,
  onMorphDialogClose,
  isLocalityDialogOpen,
  onLocalityDialogOpen,
  onLocalityDialogClose,
  onSubmit,
  onCancel
}) => {
  const theme = useTheme()
  const [selectedMorphsTemp, setSelectedMorphsTemp] = useState<MorphItem[]>([])
  const [selectedLocalitiesTemp, setSelectedLocalitiesTemp] = useState<LocalityItem[]>([])
  const [searchMorphValue, setSearchMorphValue] = useState('')
  const [searchLocalityValue, setSearchLocalityValue] = useState('')

  // Filter available morphs - exclude already selected ones
  const filteredAvailableMorphs = availableMorphs.filter(
    item =>
      item.sub_taxon_name.toLowerCase().includes(searchMorphValue.toLowerCase()) &&
      !morphList.some(selected => selected.sub_taxon_id === item.sub_taxon_id)
  )

  // Filter available localities - exclude already selected ones
  const filteredAvailableLocalities = availableLocalities.filter(
    item =>
      item.sub_taxon_name.toLowerCase().includes(searchLocalityValue.toLowerCase()) &&
      !localityList.some(selected => selected.sub_taxon_id === item.sub_taxon_id)
  )

  const handleAddMorphLocal = () => {
    onAddMorph(selectedMorphsTemp)
    setSelectedMorphsTemp([])
    setSearchMorphValue('')
    onMorphDialogClose()
  }

  const handleAddLocalityLocal = () => {
    onAddLocality(selectedLocalitiesTemp)
    setSelectedLocalitiesTemp([])
    setSearchLocalityValue('')
    onLocalityDialogClose()
  }

  return (
    <Box sx={{ p: 4, backgroundColor: theme.palette.customColors.displaybgPrimary, borderRadius: '12px' }}>
      <form
        onSubmit={e => {
          e.preventDefault()
          onSubmit()
        }}
      >
        {/* Taxonomy Selection */}
        <Card sx={{ mb: 4, p: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                borderRadius: 2,

                height: 30,
                width: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${theme?.palette?.customColors?.OnSurface}24`
              }}
            >
              {' '}
              <FilterListRounded sx={{ color: theme?.palette?.customColors?.Outline, fontSize: 22 }} />
            </Box>
            <Typography
              sx={{ color: theme?.palette?.customColors?.customHeadingTextColor, fontSize: '16px', fontWeight: 500 }}
            >
              Choose Taxonomy
            </Typography>
          </Box>

          <MUIAutoComplete
            name='taxonomy_select'
            label='Choose Taxonomy *'
            size='medium'
            disabled={isEditMode}
            options={
              formData.selectedTaxonomy &&
              !taxonomyOptions.some(opt => opt.taxonomy_id === formData.selectedTaxonomy?.taxonomy_id)
                ? [formData.selectedTaxonomy, ...taxonomyOptions]
                : taxonomyOptions
            }
            value={formData.selectedTaxonomy}
            getOptionLabel={(option: any) => {
              if (!option) return ''
              return `${option.common_name || ''} (${option.scientific_name || ''})`
            }}
            isOptionEqualToValue={(option: any, value: any) => {
              if (!option || !value) return false
              return option.taxonomy_id === value.taxonomy_id
            }}
            onInputChange={(value: string) => {
              if (value.length >= 3) {
                onTaxonomySearch(value)
              }
            }}
            onChange={(value: any) => onTaxonomySelect(value)}
            loading={isTaxonomySearching}
            textFieldProps={{
              placeholder: 'Enter at least 3 characters to search',
              error: !formData.taxonomyId && formData.showAdditionalFields,
              helperText: !formData.taxonomyId && formData.showAdditionalFields ? 'Please select a taxonomy' : ''
            }}
          />
        </Card>
        {/* scientificName */}
        {formData.scientificName && (
          <Card sx={{ mb: 4, p: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  borderRadius: 2,

                  height: 30,
                  width: 30,
                  display: 'flex',

                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme?.palette?.customColors?.OnSurface}24`
                }}
              >
                {' '}
                <BiotechRounded sx={{ color: theme?.palette?.customColors?.Outline, fontSize: 24 }} />
              </Box>
              <Typography
                sx={{ color: theme?.palette?.customColors?.customHeadingTextColor, fontSize: '16px', fontWeight: 500 }}
              >
                Scientific Name
              </Typography>
            </Box>

            <ControlledTextField name='scientificName' control={control} label='Scientific Name' fullWidth disabled />
          </Card>
        )}

        {!formData.showAdditionalFields && (
          <Card sx={{ mb: 4, p: 2, bgcolor: theme.palette.customColors.SecondaryContainer, cursor: 'pointer' }}>
            <Box
              onClick={onOpenCreateTaxonomyDrawer}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography variant='body2'>Could not find the required taxonomy?</Typography>
                <Typography variant='subtitle2' fontWeight='bold'>
                  Create a new taxonomy
                </Typography>
              </Box>
              <AddBoxOutlined />
            </Box>
          </Card>
        )}

        {/* Additional Fields */}
        {formData.showAdditionalFields && (
          <>
            <ProfileImageUpload
              profileImagePreview={formData.profileImagePreview}
              onProfileImageChange={onProfileImageChange}
            />

            <CommonNamesSection
              vernacularOptions={vernacularOptions}
              selectedVernacularId={formData.selectedVernacularId}
              manualVernacularName={formData.manualVernacularName}
              commonNameError={formData.commonNameError}
              onVernacularSelect={onVernacularSelect}
              onVernacularNameChange={onVernacularNameChange}
              isEditMode={isEditMode}
              isHybrid={false}
            />

            {/* Edit Mode Sections */}
            {isEditMode && (
              <>
                <BreedList breedList={breedList} onRemoveBreed={onRemoveBreed} onAddClick={onBreedDialogOpen} />
                <MorphList morphList={morphList} onRemoveMorph={onRemoveMorph} onAddClick={onMorphDialogOpen} />
                <LocalityList
                  localityList={localityList}
                  onRemoveLocality={onRemoveLocality}
                  onAddClick={onLocalityDialogOpen}
                />
              </>
            )}

            <BannerImagesUpload
              bannerImages={formData.bannerImages}
              onBannerImagesChange={onBannerImagesChange}
              onRemoveBannerImage={onRemoveBannerImage}
            />

            {/* Dynamic Fields */}
            {shouldShowDynamicFields && dynamicSchema.length > 0 && (
              <SpeciesDynamicFields
                dynamicSchema={dynamicSchema}
                dynamicFormValues={dynamicFormValues}
                onDynamicFieldChange={onDynamicFieldChange}
                onDynamicFieldRemove={onDynamicFieldRemove}
                control={control}
                setValue={setValue}
              />
            )}
          </>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button fullWidth variant='outlined' onClick={onCancel} disabled={loading} size='large'>
            Cancel
          </Button>
          <Button
            fullWidth
            variant='contained'
            type='submit'
            size='large'
            disabled={loading || !formData.showAdditionalFields}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update' : 'Submit'}
          </Button>
        </Box>
      </form>
      {/* Dialogs */}
      <BreedDialog
        open={isBreedDialogOpen}
        breedName={breedName}
        onBreedNameChange={onBreedNameChange}
        onAdd={onAddBreed}
        onClose={onBreedDialogClose}
      />
      <MorphDialog
        open={isMorphDialogOpen}
        loading={isLoadingMorphs}
        availableItems={filteredAvailableMorphs}
        selectedItemsTemp={selectedMorphsTemp}
        searchValue={searchMorphValue}
        onSearchChange={setSearchMorphValue}
        onCheckboxChange={setSelectedMorphsTemp}
        onAdd={handleAddMorphLocal}
        onClose={onMorphDialogClose}
        title='Select Morphs/Mutations'
      />
      <LocalityDialog
        open={isLocalityDialogOpen}
        loading={isLoadingLocalities}
        availableItems={filteredAvailableLocalities}
        selectedItemsTemp={selectedLocalitiesTemp}
        searchValue={searchLocalityValue}
        onSearchChange={setSearchLocalityValue}
        onCheckboxChange={setSelectedLocalitiesTemp}
        onAdd={handleAddLocalityLocal}
        onClose={onLocalityDialogClose}
        title='Select Localities'
      />
      <CreateTaxonomy open={isCreateTaxonomyDrawerOpen} handleClose={onCloseCreateTaxonomyDrawer} />{' '}
    </Box>
  )
}

export default SpeciesForm
