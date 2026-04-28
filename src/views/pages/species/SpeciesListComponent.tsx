import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  IconButton,
  Checkbox,
  CircularProgress,
  useTheme,
  Drawer,
  alpha
} from '@mui/material'
import { AddCircleOutlineRounded } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import { useForm } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

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

// BreedList Component
interface BreedListProps {
  breedList: BreedItem[]
  onRemoveBreed: (id: string) => void
  onAddClick: () => void
}

export const BreedList: React.FC<BreedListProps> = ({ breedList, onRemoveBreed, onAddClick }) => {
  const theme = useTheme()

  return (
    <Card sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2
        }}
      >
        <CardHeader
          title={breedList.length > 0 ? `${breedList.length} Breed${breedList.length > 1 ? 's' : ''}` : 'Select Breed'}
          sx={{ px: 2, py: 0 }}
        />
        <Button size='small' startIcon={<AddCircleOutlineRounded />} onClick={onAddClick}>
          Add
        </Button>
      </Box>
      {breedList.length > 0 && (
        <>
          <Divider />
          <CardContent>
            {breedList?.map((item, index) => (
              <React.Fragment key={item.sub_taxon_id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{item.sub_taxon_name}</Typography>
                  <IconButton size='small' onClick={() => onRemoveBreed(item.sub_taxon_id)}>
                    <Icon icon='mdi:close' fontSize={18} style={{ color: theme?.palette?.customColors.errorText }} />
                  </IconButton>
                </Box>
                {index < breedList.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </CardContent>
        </>
      )}
    </Card>
  )
}

//  MorphList Component
interface MorphListProps {
  morphList: MorphItem[]
  onRemoveMorph: (id: string) => void
  onAddClick: () => void
}

export const MorphList: React.FC<MorphListProps> = ({ morphList, onRemoveMorph, onAddClick }) => {
  const theme = useTheme()

  return (
    <Card sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <CardHeader
          title={
            morphList.length > 0
              ? `${morphList.length} Morph${morphList.length > 1 ? 's' : ''}`
              : 'Select Morph/Mutation'
          }
          sx={{ px: 2, py: 0 }}
        />
        <Button size='small' startIcon={<AddCircleOutlineRounded />} onClick={onAddClick}>
          Add
        </Button>
      </Box>
      {morphList.length > 0 && (
        <>
          <Divider />
          <CardContent>
            {morphList?.map((item, index) => (
              <React.Fragment key={item.sub_taxon_id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{item.sub_taxon_name}</Typography>
                  <IconButton size='small' onClick={() => onRemoveMorph(item.sub_taxon_id)}>
                    <Icon icon='mdi:close' fontSize={18} style={{ color: theme?.palette?.customColors.errorText }} />
                  </IconButton>
                </Box>
                {index < morphList.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </CardContent>
        </>
      )}
    </Card>
  )
}

//  LocalityList Component
interface LocalityListProps {
  localityList: LocalityItem[]
  onRemoveLocality: (id: string) => void
  onAddClick: () => void
}

export const LocalityList: React.FC<LocalityListProps> = ({ localityList, onRemoveLocality, onAddClick }) => {
  const theme = useTheme()
  return (
    <Card sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <CardHeader
          title={
            localityList.length > 0
              ? `${localityList.length} ${localityList.length === 1 ? 'Locality' : 'Localities'}`
              : 'Select Locality'
          }
          sx={{ px: 2, py: 0 }}
        />
        <Button size='small' startIcon={<AddCircleOutlineRounded />} onClick={onAddClick}>
          Add
        </Button>
      </Box>
      {localityList.length > 0 && (
        <>
          <Divider />
          <CardContent>
            {localityList?.map((item, index) => (
              <React.Fragment key={item.sub_taxon_id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{item.sub_taxon_name}</Typography>
                  <IconButton size='small' onClick={() => onRemoveLocality(item.sub_taxon_id)}>
                    <Icon icon='mdi:close' fontSize={18} style={{ color: theme?.palette?.customColors.errorText }} />
                  </IconButton>
                </Box>
                {index < localityList.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </CardContent>
        </>
      )}
    </Card>
  )
}

//  BreedDialog Component
interface BreedDialogProps {
  open: boolean
  breedName: string
  onBreedNameChange: (value: string) => void
  onAdd: () => void
  onClose: () => void
}

export const BreedDialog: React.FC<BreedDialogProps> = ({ open, breedName, onBreedNameChange, onAdd, onClose }) => {
  const theme = useTheme()
  const { control, setValue } = useForm({ defaultValues: { breed_name: '' } })

  useEffect(() => {
    setValue('breed_name', breedName)
  }, [breedName, setValue])

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
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          Add New Breed
        </Typography>
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
          pb: 16
        }}
      >
        <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
          <ControlledTextField
            name='breed_name'
            control={control}
            label='Breed Name'
            placeholder='Enter breed name'
            fullWidth
            onChangeOverride={(e: any) => onBreedNameChange(e?.target ? e.target.value : e)}
          />
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
        <Button fullWidth variant='outlined' size='large' onClick={onClose} sx={{ py: 4 }}>
          Cancel
        </Button>
        <Button fullWidth variant='contained' size='large' onClick={onAdd} sx={{ py: 4 }}>
          Add Breed
        </Button>
      </Box>
    </Drawer>
  )
}

//  MorphDialog Component
interface MorphDialogProps {
  open: boolean
  loading: boolean
  availableItems: MorphItem[]
  selectedItemsTemp: MorphItem[]
  searchValue: string
  onSearchChange: (value: string) => void
  onCheckboxChange: (items: MorphItem[]) => void
  onAdd: () => void
  onClose: () => void
  title?: string
}

export const MorphDialog: React.FC<MorphDialogProps> = ({
  open,
  loading,
  availableItems,
  selectedItemsTemp,
  searchValue,
  onSearchChange,
  onCheckboxChange,
  onAdd,
  onClose,
  title = 'Select Morphs/Mutations'
}) => {
  const theme = useTheme()
  const { control: morphSearchControl, setValue: setMorphSearchValue } = useForm({
    defaultValues: { morph_search: '' }
  })

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>, item: MorphItem) => {
    if (event.target.checked) {
      onCheckboxChange([...selectedItemsTemp, item])
    } else {
      onCheckboxChange(selectedItemsTemp.filter(i => i.sub_taxon_id !== item.sub_taxon_id))
    }
  }

  const filteredAvailableItems = availableItems.filter(item =>
    item.sub_taxon_name.toLowerCase().includes(searchValue.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      onCheckboxChange([])
      onSearchChange('')
      setMorphSearchValue('morph_search', '')
    }
  }, [open])

  useEffect(() => {
    setMorphSearchValue('morph_search', searchValue)
  }, [searchValue, setMorphSearchValue])

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
          flexDirection: 'column',
          p: 4,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {title}
          </Typography>
          <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        <Card
          sx={{
            mt: 4,
            padding: 4,
            boxShadow: 0,
            border: `2px solid ${theme.palette.customColors.SurfaceVariant}`
          }}
        >
          <ControlledTextField
            name='morph_search'
            control={morphSearchControl}
            label='Search'
            placeholder='Search...'
            fullWidth
            onChangeOverride={(e: any) => onSearchChange(e?.target ? e.target.value : e)}
          />
        </Card>
      </Box>

      {/* Body */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: theme.palette.background.default
        }}
      >
        <Box sx={{ p: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredAvailableItems.length > 0 ? (
            filteredAvailableItems?.map(item => (
              <Box
                key={item.sub_taxon_id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 2,
                  pl: 2,
                  borderRadius: '6px',
                  padding: 3,
                  boxShadow: 0,
                  border: `2px solid ${theme.palette.customColors.SurfaceVariant}`,
                  backgroundColor: 'white'
                  // backgroundColor: theme.palette.customColors.displaybgPrimary
                }}
              >
                <Typography>{item.sub_taxon_name}</Typography>
                <Checkbox
                  checked={selectedItemsTemp.some(selected => selected.sub_taxon_id === item.sub_taxon_id)}
                  onChange={e => handleCheckboxChange(e, item)}
                />
              </Box>
            ))
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No items available</Typography>
          )}
        </Box>
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
        <Button fullWidth variant='outlined' size='large' onClick={onClose} sx={{ py: 4 }}>
          Cancel
        </Button>
        <Button
          fullWidth
          variant='contained'
          size='large'
          onClick={onAdd}
          disabled={selectedItemsTemp.length === 0}
          sx={{ py: 4 }}
        >
          Add Selected ({selectedItemsTemp.length})
        </Button>
      </Box>
    </Drawer>
  )
}

// LocalityDialog Component
interface LocalityDialogProps {
  open: boolean
  loading: boolean
  availableItems: LocalityItem[]
  selectedItemsTemp: LocalityItem[]
  searchValue: string
  onSearchChange: (value: string) => void
  onCheckboxChange: (items: LocalityItem[]) => void
  onAdd: () => void
  onClose: () => void
  title?: string
}

export const LocalityDialog: React.FC<LocalityDialogProps> = ({
  open,
  loading,
  availableItems,
  selectedItemsTemp,
  searchValue,
  onSearchChange,
  onCheckboxChange,
  onAdd,
  onClose,
  title = 'Select Localities'
}) => {
  const theme = useTheme()
  const { control: localitySearchControl, setValue: setLocalitySearchValue } = useForm({
    defaultValues: { locality_search: '' }
  })

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>, item: LocalityItem) => {
    if (event.target.checked) {
      onCheckboxChange([...selectedItemsTemp, item])
    } else {
      onCheckboxChange(selectedItemsTemp.filter(i => i.sub_taxon_id !== item.sub_taxon_id))
    }
  }

  useEffect(() => {
    if (open) {
      onCheckboxChange([])
      onSearchChange('')
      setLocalitySearchValue('locality_search', '')
    }
  }, [open])

  useEffect(() => {
    setLocalitySearchValue('locality_search', searchValue)
  }, [searchValue, setLocalitySearchValue])

  const filteredAvailableItems = availableItems.filter(item =>
    item.sub_taxon_name.toLowerCase().includes(searchValue.toLowerCase())
  )

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
          flexDirection: 'column',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {title}
          </Typography>
          <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        <Card
          sx={{ mt: 4, padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}
        >
          <ControlledTextField
            name='locality_search'
            control={localitySearchControl}
            label='Search'
            placeholder='Search...'
            fullWidth
            onChangeOverride={(e: any) => onSearchChange(e?.target ? e.target.value : e)}
          />
        </Card>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: theme.palette.background.default }}>
        <Box sx={{ p: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredAvailableItems.length > 0 ? (
            filteredAvailableItems?.map(item => (
              <Box
                key={item.sub_taxon_id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 2,
                  pl: 2,
                  borderRadius: '6px',
                  padding: 3,
                  boxShadow: 0,
                  border: `2px solid ${theme.palette.customColors.SurfaceVariant}`,
                  backgroundColor: 'white'
                }}
              >
                <Typography>{item.sub_taxon_name}</Typography>
                <Checkbox
                  checked={selectedItemsTemp.some(selected => selected.sub_taxon_id === item.sub_taxon_id)}
                  onChange={e => handleCheckboxChange(e, item)}
                />
              </Box>
            ))
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No items available</Typography>
          )}
        </Box>
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
        <Button fullWidth variant='outlined' size='large' onClick={onClose} sx={{ py: 4 }}>
          Cancel
        </Button>
        <Button
          fullWidth
          variant='contained'
          size='large'
          onClick={onAdd}
          disabled={selectedItemsTemp.length === 0}
          sx={{ py: 4 }}
        >
          Add Selected ({selectedItemsTemp.length})
        </Button>
      </Box>
    </Drawer>
  )
}
