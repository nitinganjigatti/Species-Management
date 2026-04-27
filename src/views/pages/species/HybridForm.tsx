import React, { useEffect, useState } from 'react'
import { Box, Button, Card, Typography, IconButton, useTheme, TextField } from '@mui/material'
import {
  AddCircleOutlineRounded,
  AddBoxOutlined,
  Close as CloseIcon,
  FilterListRounded,
  BiotechRounded
} from '@mui/icons-material'
import { BannerImagesUpload, CommonNamesSection, ProfileImageUpload } from './SpeciesFields'
import { BreedDialog, BreedList, LocalityDialog, LocalityList, MorphDialog, MorphList } from './SpeciesListComponent'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import CreateTaxonomy from 'src/components/maters/species/CreateTaxonomy'

const MUIAutoComplete = MUIAutocomplete as React.FC<any>

interface TaxonomyOption {
  taxonomy_id: string
  scientific_name: string
  common_name: string
}

interface TaxonomyField {
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

  showAdditionalFields: boolean
}

interface HybridFormProps {
  control: any
  setValue: (name: string, value: any) => void
  formErrors: any
  isEditMode: boolean
  loading: boolean
  formData: HybridFormData
  vernacularOptions: any[]
  breedList: BreedItem[]
  morphList: MorphItem[]
  localityList: LocalityItem[]
  availableMorphs?: MorphItem[]
  availableLocalities?: LocalityItem[]
  isLoadingMorphs?: boolean
  isLoadingLocalities?: boolean
  getFieldOptions: (fieldIndex: number) => TaxonomyOption[]
  searchLoading: Record<number, boolean>
  onTaxonomySearch: (searchText: string, fieldIndex: number) => void
  onTaxonomyFieldChange: (index: number, taxonomy: TaxonomyOption | null) => void
  onAddTaxonomyField: () => void
  onRemoveTaxonomyField: (index: number) => void
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
  hasMinimumTaxonomies: boolean
  isCreateTaxonomyDrawerOpen: boolean
  onOpenCreateTaxonomyDrawer: () => void
  onCloseCreateTaxonomyDrawer: () => void
}

const HybridForm: React.FC<HybridFormProps> = ({
  control,
  setValue,
  formErrors,
  isEditMode,
  loading,
  formData,
  vernacularOptions,
  breedList,
  morphList,
  localityList,
  availableMorphs = [],
  availableLocalities = [],
  isLoadingMorphs = false,
  isLoadingLocalities = false,
  getFieldOptions,
  searchLoading,
  onTaxonomySearch,
  onTaxonomyFieldChange,
  onAddTaxonomyField,
  onRemoveTaxonomyField,
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
  onCancel,
  hasMinimumTaxonomies,
  isCreateTaxonomyDrawerOpen,
  onOpenCreateTaxonomyDrawer,
  onCloseCreateTaxonomyDrawer
}) => {
  const theme = useTheme()

  const [selectedMorphsTemp, setSelectedMorphsTemp] = useState<MorphItem[]>([])
  const [selectedLocalitiesTemp, setSelectedLocalitiesTemp] = useState<LocalityItem[]>([])
  const [searchMorphValue, setSearchMorphValue] = useState('')
  const [searchLocalityValue, setSearchLocalityValue] = useState('')

  useEffect(() => {
    formData.taxonomyFields?.forEach((field, index) => {
      setValue(`taxonomy_scientific_${index}`, field.scientific_name || '')
    })
  }, [formData.taxonomyFields, setValue])

  const filteredAvailableMorphs = availableMorphs.filter(
    item =>
      item.sub_taxon_name.toLowerCase().includes(searchMorphValue.toLowerCase()) &&
      !morphList.some(selected => selected.sub_taxon_id === item.sub_taxon_id)
  )

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
        {/* Taxonomy Selection for Hybrid - Multiple Fields */}
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

          {formData.taxonomyFields?.map((field, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' sx={{ mb: 2 }}>
                    Choose Taxonomy {index + 1} {index === 0 && '*'}
                  </Typography>

                  {isEditMode ? (
                    <>
                      <TextField
                        fullWidth
                        value={field.scientific_name || ''}
                        disabled
                        placeholder='Taxonomy name'
                        label={`Taxonomy name ${index + 1}`}
                      />
                    </>
                  ) : (
                    <MUIAutoComplete
                      name={`taxonomy_field_${index}`}
                      label={`Choose Taxonomy ${index + 1}`}
                      options={getFieldOptions(index)}
                      size='medium'
                      value={
                        field.taxonomy_id
                          ? getFieldOptions(index).find((opt: any) => opt.taxonomy_id === field.taxonomy_id) || null
                          : null
                      }
                      getOptionLabel={(option: any) => {
                        if (!option) return ''
                        return `${option.common_name || ''} (${option.scientific_name})`
                      }}
                      isOptionEqualToValue={(option: any, value: any) => {
                        if (!option || !value) return false
                        return option.taxonomy_id === value.taxonomy_id
                      }}
                      onInputChange={(value: string) => {
                        if (value.length >= 3) {
                          onTaxonomySearch(value, index)
                        }
                      }}
                      onChange={(value: any) => onTaxonomyFieldChange(index, value)}
                      loading={searchLoading[index] || false}
                      textFieldProps={{
                        placeholder: 'Enter at least 3 characters to search',
                        error: index === 0 && !field.taxonomy_id && formData.showAdditionalFields,
                        helperText:
                          index === 0 && !field.taxonomy_id && formData.showAdditionalFields
                            ? 'Please select a taxonomy'
                            : ''
                      }}
                    />
                  )}
                </Box>

                {!isEditMode && index > 1 && (
                  <IconButton onClick={() => onRemoveTaxonomyField(index)} size='small' sx={{ mt: 3 }}>
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>

              {index < formData.taxonomyFields.length - 1 && (
                <Typography variant='h6' sx={{ textAlign: 'center', mt: 4 }}>
                  X
                </Typography>
              )}
            </Box>
          ))}

          {!isEditMode && (
            <Button size='small' startIcon={<AddCircleOutlineRounded />} onClick={onAddTaxonomyField} sx={{ mt: 1 }}>
              Add Another Taxonomy
            </Button>
          )}
        </Card>

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
            <ControlledTextField name='scientific_name' control={control} label='Scientific Name' fullWidth disabled />
          </Card>
        )}

        {/* Create New Taxonomy Card */}
        {!hasMinimumTaxonomies && (
          <Card sx={{ mb: 3, p: 2, bgcolor: theme?.palette?.customColors.SecondaryContainer, cursor: 'pointer' }}>
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

        {/* Additional Fields - Show only when minimum taxonomies are selected */}
        {hasMinimumTaxonomies && (
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
              isHybrid={true}
            />

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
              theme={null}
            />
          </>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button fullWidth variant='outlined' size='large' onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button fullWidth variant='contained' type='submit' size='large' disabled={loading || !hasMinimumTaxonomies}>
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

      <CreateTaxonomy open={isCreateTaxonomyDrawerOpen} handleClose={onCloseCreateTaxonomyDrawer} />
    </Box>
  )
}

export default HybridForm
