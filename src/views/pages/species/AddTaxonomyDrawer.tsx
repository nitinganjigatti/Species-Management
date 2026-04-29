import { Drawer, Box, Typography, IconButton, Button, Card, Grid, alpha, useTheme, Theme } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import React from 'react'
import Icon from 'src/@core/components/icon'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import CommonMastersDrawer from 'src/views/utility/Layout/CommonMastersDrawer'

const MUIAutoComplete = MUIAutocomplete as React.FC<any>

export interface TaxonomyItem {
  id?: string
  taxonomy_id?: string
  common_name?: string | null
  scientific_name?: string
  rank_id?: string
  type?: string
  [key: string]: any
}

export interface FormValues {
  new_common_name: string
  new_scientific_name: string
  subspecies_common_name: string
  subspecies_scientific_name: string
  selected_class_display: string
  selected_order_display: string
  selected_family_display: string
  selected_genus_display: string
  selected_species_display: string
}

interface AddTaxonomyDrawerProps {
  open: boolean
  onClose: () => void
  control: any
  selectedClass: TaxonomyItem | null
  selectedOrder: TaxonomyItem | null
  selectedFamily: TaxonomyItem | null
  selectedGenus: TaxonomyItem | null
  selectedSpecies: TaxonomyItem | null
  currentType: string
  options: TaxonomyItem[]
  loading: boolean
  createModalOpen: boolean
  showSubSpecies: boolean
  isSubmitEnabled: boolean
  onSearchChange: (value: string) => void
  onSelect: (item: TaxonomyItem) => void
  onRemove: (type: string) => void
  onCreateNew: () => void
  onOpenCreateModal: () => void
  onCloseCreateModal: () => void
  onOpenSubSpecies: () => void
  onCloseSubSpecies: () => void
  onSubmit: () => void
  getOptionLabel: (option: TaxonomyItem) => string
}

const renderSelectedItem = (
  label: string,
  fieldName: keyof FormValues,
  item: TaxonomyItem | null,
  control: any,
  onRemove: () => void
) => {
  if (!item) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ mb: 1, fontWeight: 500 }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ControlledTextField name={fieldName} control={control} disabled fullWidth size='small' />
        <IconButton size='small' onClick={onRemove} sx={{ color: 'error.main' }}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>
    </Box>
  )
}

const AddTaxonomyDrawer: React.FC<AddTaxonomyDrawerProps> = ({
  open,
  onClose,
  control,
  selectedClass,
  selectedOrder,
  selectedFamily,
  selectedGenus,
  selectedSpecies,
  currentType,
  options,
  loading,
  createModalOpen,
  showSubSpecies,
  isSubmitEnabled,
  onSearchChange,
  onSelect,
  onRemove,
  onCreateNew,
  onOpenCreateModal,
  onCloseCreateModal,
  onOpenSubSpecies,
  onCloseSubSpecies,
  onSubmit,
  getOptionLabel
}) => {
  const theme: Theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 562] } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Taxonomy Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Create New Taxonomy
          </Typography>
        </Box>

        <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 16,
          overflowY: 'auto'
        }}
      >
        <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
          {/* Class Selection */}
          {!selectedClass && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>Class *</Typography>
              </Box>
              <MUIAutoComplete
                name='class_select'
                label='Class'
                size='large'
                required
                value={null}
                options={options as any}
                loading={loading}
                getOptionLabel={getOptionLabel}
                onInputChange={(value: string) => onSearchChange(value)}
                onChange={(value: any) => value && onSelect(value)}
                textFieldProps={{ placeholder: 'Search and select class' }}
              />
            </Box>
          )}

          {/* Display selected items */}
          {selectedClass &&
            renderSelectedItem('Class', 'selected_class_display', selectedClass, control, () => onRemove('class'))}
          {selectedOrder &&
            renderSelectedItem('Order', 'selected_order_display', selectedOrder, control, () => onRemove('order'))}
          {selectedFamily &&
            renderSelectedItem('Family', 'selected_family_display', selectedFamily, control, () => onRemove('family'))}
          {selectedGenus &&
            renderSelectedItem('Genus', 'selected_genus_display', selectedGenus, control, () => onRemove('genus'))}
          {selectedSpecies &&
            renderSelectedItem('Species', 'selected_species_display', selectedSpecies, control, () =>
              onRemove('species')
            )}

          {/* Next level selection */}
          {selectedClass && !selectedOrder && currentType === 'order' && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>Order *</Typography>
                <Button size='small' onClick={onOpenCreateModal}>
                  + Create New
                </Button>
              </Box>
              <MUIAutoComplete
                name='order_select'
                label='Order'
                size='large'
                required
                value={null}
                options={options as any}
                loading={loading}
                getOptionLabel={getOptionLabel}
                onInputChange={(value: string) => onSearchChange(value)}
                onChange={(value: any) => value && onSelect(value)}
                textFieldProps={{ placeholder: 'Search and select order' }}
              />
            </Box>
          )}

          {selectedOrder && !selectedFamily && currentType === 'family' && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>Family *</Typography>
                <Button size='small' onClick={onOpenCreateModal}>
                  + Create New
                </Button>
              </Box>
              <MUIAutoComplete
                name='family_select'
                label='Family'
                size='large'
                required
                value={null}
                options={options as any}
                loading={loading}
                getOptionLabel={getOptionLabel}
                onInputChange={(value: string) => onSearchChange(value)}
                onChange={(value: any) => value && onSelect(value)}
                textFieldProps={{ placeholder: 'Search and select family' }}
              />
            </Box>
          )}

          {selectedFamily && !selectedGenus && currentType === 'genus' && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>Genus *</Typography>
                <Button size='small' onClick={onOpenCreateModal}>
                  + Create New
                </Button>
              </Box>
              <MUIAutoComplete
                name='genus_select'
                label='Genus'
                size='large'
                required
                value={null}
                options={options as any}
                loading={loading}
                getOptionLabel={getOptionLabel}
                onInputChange={(value: string) => onSearchChange(value)}
                onChange={(value: any) => value && onSelect(value)}
                textFieldProps={{ placeholder: 'Search and select genus' }}
              />
            </Box>
          )}

          {selectedGenus && !selectedSpecies && currentType === 'species' && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>Species *</Typography>
                <Button size='small' onClick={onOpenCreateModal}>
                  + Create New
                </Button>
              </Box>
              <MUIAutoComplete
                name='species_select'
                label='Species'
                size='large'
                required
                value={null}
                options={options as any}
                loading={loading}
                getOptionLabel={getOptionLabel}
                onInputChange={(value: string) => onSearchChange(value)}
                onChange={(value: any) => value && onSelect(value)}
                textFieldProps={{ placeholder: 'Search and select species' }}
              />
            </Box>
          )}

          {/* Subspecies option */}
          {selectedSpecies && !showSubSpecies && (
            <Box sx={{ mt: 2 }}>
              <Button fullWidth variant='outlined' startIcon={<Icon icon='mdi:plus' />} onClick={onOpenSubSpecies}>
                Add Subspecies
              </Button>
            </Box>
          )}

          {/* Subspecies form */}
          {showSubSpecies && (
            <Box sx={{ mt: 3, p: 4, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 500 }}>Subspecies</Typography>
                <IconButton size='small' onClick={onCloseSubSpecies}>
                  <Icon icon='mdi:close' />
                </IconButton>
              </Box>
              <ControlledTextField
                name='subspecies_common_name'
                control={control}
                label='Common Name'
                fullWidth
                sx={{ mb: 4 }}
              />
              <ControlledTextField
                name='subspecies_scientific_name'
                control={control}
                label='Scientific Name'
                fullWidth
              />
            </Box>
          )}
        </Card>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark as string, 0.1)}`,
          bottom: 0,
          position: 'sticky',
          zIndex: 1
        }}
      >
        <LoadingButton variant='contained' onClick={onSubmit} sx={{ flex: 1, py: 4 }} disabled={!isSubmitEnabled}>
          Create Taxonomy
        </LoadingButton>
      </Box>

      {/* Create New Modal */}
      <CommonMastersDrawer
        title={`Create New ${currentType.charAt(0).toUpperCase() + currentType.slice(1)}`}
        open={createModalOpen}
        onClose={onCloseCreateModal}
        onSubmit={onCreateNew}
        submitLabel={`Add ${currentType.charAt(0).toUpperCase() + currentType.slice(1)}`}
      >
        <Box>
          {/* Parent hierarchy as read-only ControlledTextFields */}
          {currentType === 'order' && selectedClass && (
            <Grid container spacing={6} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12 }}>
                <ControlledTextField name='selected_class_display' control={control} label='Class' fullWidth disabled />
              </Grid>
            </Grid>
          )}
          {currentType === 'family' && (
            <Grid container spacing={6} sx={{ mb: 4 }}>
              {selectedClass && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_class_display'
                    control={control}
                    label='Class'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
              {selectedOrder && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_order_display'
                    control={control}
                    label='Order'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
            </Grid>
          )}
          {currentType === 'genus' && (
            <Grid container spacing={6} sx={{ mb: 4 }}>
              {selectedClass && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_class_display'
                    control={control}
                    label='Class'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
              {selectedOrder && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_order_display'
                    control={control}
                    label='Order'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
              {selectedFamily && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_family_display'
                    control={control}
                    label='Family'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
            </Grid>
          )}
          {currentType === 'species' && (
            <Grid container spacing={6} sx={{ mb: 4 }}>
              {selectedClass && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_class_display'
                    control={control}
                    label='Class'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
              {selectedOrder && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_order_display'
                    control={control}
                    label='Order'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
              {selectedFamily && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_family_display'
                    control={control}
                    label='Family'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
              {selectedGenus && (
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    name='selected_genus_display'
                    control={control}
                    label='Genus'
                    fullWidth
                    disabled
                  />
                </Grid>
              )}
            </Grid>
          )}

          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <ControlledTextField
                name='new_common_name'
                control={control}
                label='Common Name*'
                placeholder='Enter Common Name'
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ControlledTextField
                name='new_scientific_name'
                control={control}
                label='Scientific Name*'
                placeholder='Enter Scientific Name'
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      </CommonMastersDrawer>
    </Drawer>
  )
}

export default AddTaxonomyDrawer
