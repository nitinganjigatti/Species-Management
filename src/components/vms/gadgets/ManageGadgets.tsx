'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Divider from '@mui/material/Divider'
// Grid removed — using CSS grid for table layout
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { GADGET_STANDARD_FIELDS } from 'src/constants/vms'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { useGadgetsList, useCreateGadget, useUpdateGadget, useDeleteGadget } from 'src/hooks/vms/useVmsGadgets'
import type { GadgetFieldConfig, CreateGadgetPayload, VmsMasterGadget } from 'src/types/vms'

// ─── Standard fields config ───────────────────────────────────────────────────

const STANDARD_FIELD_KEYS = Object.keys(GADGET_STANDARD_FIELDS) as Array<keyof typeof GADGET_STANDARD_FIELDS>

// ─── Types for form state ─────────────────────────────────────────────────────

interface StandardFieldState {
  key: string
  checked: boolean
  required: boolean
}

interface CustomFieldState {
  label: string
  key: string
  type: 'text' | 'number' | 'date'
  required: boolean
}

// ─── Helper: get display label for a field ────────────────────────────────────

const getFieldLabel = (field: GadgetFieldConfig): string => {
  if (field.label) return field.label

  return GADGET_STANDARD_FIELDS[field.key] ?? field.key
}

// ─── Gadget Card ──────────────────────────────────────────────────────────────

const MAX_CHIPS = 3

const FieldChips = ({ fields, variant }: { fields: GadgetFieldConfig[]; variant: 'required' | 'optional' }) => {
  if (fields.length === 0) return <Typography sx={{ fontSize: 12, color: 'customColors.neutralSecondary', fontStyle: 'italic' }}>—</Typography>

  const visible = fields.slice(0, MAX_CHIPS)
  const extra = fields.length - MAX_CHIPS

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
      {visible.map(field => (
        <Chip
          key={field.key}
          label={getFieldLabel(field)}
          size='small'
          sx={variant === 'required'
            ? { bgcolor: 'customColors.Surface', color: 'primary.dark', fontWeight: 500, fontSize: 11, borderRadius: '4px', height: 22 }
            : { bgcolor: 'action.hover', color: 'customColors.neutralSecondary', fontWeight: 500, fontSize: 11, borderRadius: '4px', height: 22 }
          }
        />
      ))}
      {extra > 0 && (
        <Chip
          label={`+${extra}`}
          size='small'
          sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 600, fontSize: 11, borderRadius: '4px', height: 22 }}
        />
      )}
    </Box>
  )
}

// ─── Create Gadget Drawer ─────────────────────────────────────────────────────

interface CreateGadgetDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateGadgetPayload) => void
  editGadget?: VmsMasterGadget | null
}

const CreateGadgetDrawer = ({ open, onClose, onSubmit, editGadget }: CreateGadgetDrawerProps) => {
  const isEdit = Boolean(editGadget)
  const [gadgetName, setGadgetName] = useState('')

  const [standardFields, setStandardFields] = useState<StandardFieldState[]>(
    STANDARD_FIELD_KEYS.map(key => ({ key, checked: false, required: false })),
  )

  const [customFields, setCustomFields] = useState<CustomFieldState[]>([])

  // Pre-fill when editing
  useEffect(() => {
    if (editGadget && open) {
      setGadgetName(editGadget.gadget_name)
      setStandardFields(
        STANDARD_FIELD_KEYS.map(key => {
          const field = editGadget.fields.find(f => f.key === key)

          return { key, checked: Boolean(field), required: field?.required ?? false }
        })
      )
      setCustomFields(
        editGadget.fields
          .filter(f => !STANDARD_FIELD_KEYS.includes(f.key as any))
          .map(f => ({
            label: f.label ?? f.key,
            key: f.key,
            type: (f.type ?? 'text') as 'text' | 'number' | 'date',
            required: f.required,
          }))
      )
    } else if (!editGadget && open) {
      setGadgetName('')
      setStandardFields(STANDARD_FIELD_KEYS.map(key => ({ key, checked: false, required: false })))
      setCustomFields([])
    }
  }, [editGadget, open])

  const handleStandardChecked = (key: string, checked: boolean) => {
    setStandardFields(prev =>
      prev.map(f => (f.key === key ? { ...f, checked, required: checked ? f.required : false } : f)),
    )
  }

  const handleStandardRequired = (key: string, required: boolean) => {
    setStandardFields(prev => prev.map(f => (f.key === key ? { ...f, required } : f)))
  }

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { label: '', key: `custom_${Date.now()}`, type: 'text', required: false }])
  }

  const updateCustomField = (index: number, patch: Partial<CustomFieldState>) => {
    setCustomFields(prev => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    setGadgetName('')
    setStandardFields(STANDARD_FIELD_KEYS.map(key => ({ key, checked: false, required: false })))
    setCustomFields([])
    onClose()
  }

  const handleSubmit = () => {
    if (!gadgetName.trim()) {
      toast.error('Gadget name is required')

      return
    }

    const fields: GadgetFieldConfig[] = [
      ...standardFields
        .filter(f => f.checked)
        .map(f => ({ key: f.key, required: f.required })),
      ...customFields
        .filter(f => f.label.trim())
        .map(f => ({
          key: f.label.toLowerCase().replace(/\s+/g, '_'),
          label: f.label,
          type: f.type,
          required: f.required,
        })),
    ]

    const payload: CreateGadgetPayload = {
      gadget_name: gadgetName.trim(),
      fields,
    }

    onSubmit(payload)
    handleClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: 420,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Drawer header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
          {isEdit ? 'Edit Gadget Type' : 'Add Gadget Type'}
        </Typography>
        <IconButton size='small' onClick={handleClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      {/* Drawer body */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        {/* Gadget name */}
        <Box>
          <Typography
            component='label'
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: 'customColors.OnSurface',
              mb: 0.75,
              display: 'block',
            }}
          >
            Gadget Name{' '}
            <Box component='span' sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <TextField
            fullWidth
            size='small'
            placeholder='e.g. Smartwatch'
            value={gadgetName}
            onChange={e => setGadgetName(e.target.value)}
          />
        </Box>

        <Divider />

        {/* Standard fields section */}
        <Box>
          <Typography
            component='span'
            sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', display: 'block', mb: 0.5 }}
          >
            Standard Fields
          </Typography>
          <Typography
            component='span'
            sx={{ fontSize: 12, color: 'text.secondary', display: 'block', mb: 1.5 }}
          >
            Select which standard fields apply to this gadget type
          </Typography>

          <Box>
            {standardFields.map(field => (
              <Box
                key={field.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Checkbox
                  size='small'
                  checked={field.checked}
                  onChange={e => handleStandardChecked(field.key, e.target.checked)}
                  sx={{
                    p: 0,
                    color: 'action.disabled',
                    '&.Mui-checked': { color: 'primary.main' },
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ flex: 1, fontSize: 14, color: 'customColors.OnSurface' }}>
                  {GADGET_STANDARD_FIELDS[field.key]}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexShrink: 0,
                    opacity: field.checked ? 1 : 0.4,
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Required</Typography>
                  <Switch
                    size='small'
                    checked={field.required}
                    disabled={!field.checked}
                    onChange={e => handleStandardRequired(field.key, e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider />

        {/* Custom fields section */}
        <Box>
          <Typography
            component='span'
            sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', display: 'block', mb: 0.5 }}
          >
            Custom Fields
          </Typography>
          <Typography
            component='span'
            sx={{ fontSize: 12, color: 'text.secondary', display: 'block', mb: 1.5 }}
          >
            Add additional fields specific to this gadget type
          </Typography>

          {customFields.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 1.5 }}>
              {customFields.map((field, index) => (
                <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size='small'
                    placeholder='Field label'
                    value={field.label}
                    onChange={e => updateCustomField(index, { label: e.target.value })}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <FormControl size='small' sx={{ width: 100, flexShrink: 0 }}>
                    <Select
                      value={field.type}
                      onChange={e => updateCustomField(index, { type: e.target.value as CustomFieldState['type'] })}
                    >
                      <MenuItem value='text'>Text</MenuItem>
                      <MenuItem value='number'>Number</MenuItem>
                      <MenuItem value='date'>Date</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>Req.</Typography>
                    <Switch
                      size='small'
                      checked={field.required}
                      onChange={e => updateCustomField(index, { required: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' },
                      }}
                    />
                  </Box>
                  <IconButton
                    size='small'
                    onClick={() => removeCustomField(index)}
                    sx={{
                      color: 'action.disabled',
                      flexShrink: 0,
                      '&:hover': { color: 'error.main', bgcolor: 'error.light' },
                    }}
                  >
                    <Icon icon='mdi:close' fontSize={16} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Button
            fullWidth
            variant='outlined'
            startIcon={<Icon icon='mdi:plus' fontSize={16} />}
            onClick={addCustomField}
            sx={{
              borderStyle: 'dashed',
              borderColor: 'primary.main',
              color: 'primary.main',
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                bgcolor: 'customColors.Surface',
                borderStyle: 'dashed',
              },
            }}
          >
            Add Custom Field
          </Button>
        </Box>
      </Box>

      {/* Drawer footer */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Button
          variant='outlined'
          fullWidth
          onClick={handleClose}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            borderColor: 'customColors.Outline',
            color: 'customColors.OnSurface',
            '&:hover': {
              borderColor: 'customColors.OnSurfaceVariant',
              bgcolor: 'customColors.Surface',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          fullWidth
          onClick={handleSubmit}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            bgcolor: 'primary.main',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: 'none',
            },
          }}
        >
          {isEdit ? 'Save Changes' : 'Create Gadget Type'}
        </Button>
      </Box>
    </Drawer>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const ManageGadgets = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingGadget, setEditingGadget] = useState<VmsMasterGadget | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingGadget, setDeletingGadget] = useState<VmsMasterGadget | null>(null)

  const { data: gadgetsResponse, isLoading } = useGadgetsList()
  const createGadgetMutation = useCreateGadget()
  const updateGadgetMutation = useUpdateGadget()
  const deleteGadgetMutation = useDeleteGadget()
  const gadgets: VmsMasterGadget[] = gadgetsResponse?.data ?? []

  const handleSubmit = (payload: CreateGadgetPayload) => {
    if (editingGadget) {
      updateGadgetMutation.mutate(
        { id: editingGadget.gadget_id, payload },
        { onSuccess: () => { setEditingGadget(null); setDrawerOpen(false) } }
      )
    } else {
      createGadgetMutation.mutate(payload)
    }
  }

  const handleEdit = (gadget: VmsMasterGadget) => {
    setEditingGadget(gadget)
    setDrawerOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deletingGadget) {
      deleteGadgetMutation.mutate(deletingGadget.gadget_id, {
        onSuccess: () => { setDeleteDialogOpen(false); setDeletingGadget(null) }
      })
    }
  }

  const handleOpenCreate = () => {
    setEditingGadget(null)
    setDrawerOpen(true)
  }

  return (
    <Box>
      <Card sx={{ overflow: 'hidden', borderRadius: '10px' }}>
        {/* Card header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary' }}>
              Gadget Types
            </Typography>
            <Chip
              label={gadgets.length}
              size='small'
              sx={{
                bgcolor: 'customColors.Surface',
                color: 'primary.dark',
                fontWeight: 600,
                fontSize: 12,
                height: 24,
                minWidth: 28,
                borderRadius: '12px',
              }}
            />
          </Box>
          <Button
            variant='contained'
            startIcon={<Icon icon='mdi:plus' />}
            onClick={handleOpenCreate}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              bgcolor: 'primary.main',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
            }}
          >
            Add Gadget Type
          </Button>
        </Box>

        {/* Gadget table header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 0.7fr 2fr 2fr 80px',
            gap: 2,
            px: 3,
            py: 1.5,
            bgcolor: 'customColors.Surface',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {['Gadget Name', 'Scope', 'Required Fields', 'Optional Fields', ''].map(h => (
            <Typography key={h} sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'customColors.neutralSecondary' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* Gadget rows */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          gadgets.map(gadget => {
            const requiredFields = gadget.fields.filter(f => f.required)
            const optionalFields = gadget.fields.filter(f => !f.required)

            return (
              <Box
                key={gadget.gadget_id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 0.7fr 2fr 2fr 80px',
                  gap: 2,
                  px: 3,
                  py: 2.5,
                  alignItems: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': { bgcolor: 'customColors.Surface' },
                  transition: 'background 150ms ease',
                }}
              >
                {/* Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon='mdi:devices' fontSize={18} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
                    {gadget.gadget_name}
                  </Typography>
                </Box>

                {/* Scope */}
                <Chip
                  label={gadget.zoo_id === 0 ? 'Global' : 'Zoo'}
                  size='small'
                  sx={gadget.zoo_id === 0
                    ? { bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 500, fontSize: 11, height: 22, borderRadius: '100px', width: 'fit-content' }
                    : { bgcolor: 'customColors.Surface', color: 'primary.dark', fontWeight: 500, fontSize: 11, height: 22, borderRadius: '100px', width: 'fit-content' }
                  }
                />

                {/* Required */}
                <FieldChips fields={requiredFields} variant='required' />

                {/* Optional */}
                <FieldChips fields={optionalFields} variant='optional' />

                {/* Actions — only for zoo-scoped gadgets */}
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {gadget.zoo_id !== 0 && (
                    <>
                      <IconButton
                        size='small'
                        onClick={() => handleEdit(gadget)}
                        sx={{ color: 'customColors.neutralSecondary', '&:hover': { color: 'primary.main' } }}
                      >
                        <Icon icon='mdi:pencil-outline' fontSize={18} />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => { setDeletingGadget(gadget); setDeleteDialogOpen(true) }}
                        sx={{ color: 'customColors.neutralSecondary', '&:hover': { color: 'error.main' } }}
                      >
                        <Icon icon='mdi:trash-can-outline' fontSize={18} />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
            )
          })
        )}
      </Card>

      {/* Create gadget drawer */}
      <CreateGadgetDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingGadget(null) }}
        onSubmit={handleSubmit}
        editGadget={editingGadget}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Gadget Type</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingGadget?.gadget_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDeleteConfirm}
            disabled={deleteGadgetMutation.isPending}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {deleteGadgetMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageGadgets
