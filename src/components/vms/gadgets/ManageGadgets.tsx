'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CustomDrawer from 'src/views/pages/housing/utils/CustomDrawer'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import { GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import { useTheme } from '@mui/material/styles'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { GADGET_STANDARD_FIELDS } from 'src/constants/vms'
import { useGadgetsList, useCreateGadget, useUpdateGadget, useDeleteGadget } from 'src/hooks/vms/useVmsGadgets'
import type { GadgetFieldConfig, CreateGadgetPayload, VmsMasterGadget } from 'src/types/vms'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

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

// ─── Helper ──────────────────────────────────────────────────────────────────

const getFieldLabel = (field: GadgetFieldConfig): string => {
  if (field.label) return field.label

  return GADGET_STANDARD_FIELDS[field.key] ?? field.key
}

// ─── FieldChips ──────────────────────────────────────────────────────────────

const MAX_CHIPS = 3

const FieldChips = ({
  fields,
  variant,
  theme
}: {
  fields: GadgetFieldConfig[]
  variant: 'required' | 'optional'
  theme: any
}) => {
  if (fields.length === 0)
    return (
      <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary, fontStyle: 'italic' }}>
        —
      </Typography>
    )

  const visible = fields.slice(0, MAX_CHIPS)
  const extra = fields.length - MAX_CHIPS

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
      {visible.map(field => (
        <Chip
          key={field.key}
          label={getFieldLabel(field)}
          size='small'
          sx={
            variant === 'required'
              ? {
                  bgcolor: theme.palette.customColors.Surface,
                  color: theme.palette.primary.dark,
                  fontWeight: 500,
                  fontSize: 11,
                  height: 22
                }
              : {
                  bgcolor: theme.palette.customColors.SurfaceVariant,
                  color: theme.palette.customColors.neutralSecondary,
                  fontWeight: 500,
                  fontSize: 11,
                  height: 22
                }
          }
        />
      ))}
      {extra > 0 && (
        <Chip
          label={`+${extra}`}
          size='small'
          sx={{
            bgcolor: theme.palette.customColors.SurfaceVariant,
            color: theme.palette.customColors.neutralSecondary,
            fontWeight: 600,
            fontSize: 11,
            height: 22
          }}
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
  const theme = useTheme()
  const isEdit = Boolean(editGadget)
  const [gadgetName, setGadgetName] = useState('')

  const [standardFields, setStandardFields] = useState<StandardFieldState[]>(
    STANDARD_FIELD_KEYS.map(key => ({ key, checked: false, required: false }))
  )

  const [customFields, setCustomFields] = useState<CustomFieldState[]>([])

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
            required: f.required
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
      prev.map(f => (f.key === key ? { ...f, checked, required: checked ? f.required : false } : f))
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
      ...standardFields.filter(f => f.checked).map(f => ({ key: f.key, required: f.required })),
      ...customFields
        .filter(f => f.label.trim())
        .map(f => ({
          key: f.label.toLowerCase().replace(/\s+/g, '_'),
          label: f.label,
          type: f.type,
          required: f.required
        }))
    ]

    const payload: CreateGadgetPayload = {
      gadget_name: gadgetName.trim(),
      fields
    }

    onSubmit(payload)
    handleClose()
  }

  return (
    <CustomDrawer
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Gadget Type' : 'Add Gadget Type'}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Gadget name */}
        <TextField
          fullWidth
          label='Gadget Name'
          required
          placeholder='e.g. Smartwatch'
          value={gadgetName}
          onChange={e => setGadgetName(e.target.value)}
        />

        <Divider sx={{ borderColor: theme.palette.customColors.OutlineVariant }} />

        {/* Standard fields section */}
        <Box>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
            Standard Fields
          </Typography>
          <Typography
            variant='caption'
            sx={{ color: theme.palette.customColors.neutralSecondary, display: 'block', mb: 3 }}
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
                  borderColor: theme.palette.customColors.OutlineVariant,
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <Checkbox
                  size='small'
                  checked={field.checked}
                  onChange={e => handleStandardChecked(field.key, e.target.checked)}
                  sx={{ p: 0, flexShrink: 0 }}
                />
                <Typography variant='body2' sx={{ flex: 1, color: theme.palette.customColors.OnSurfaceVariant }}>
                  {GADGET_STANDARD_FIELDS[field.key]}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexShrink: 0,
                    opacity: field.checked ? 1 : 0.4
                  }}
                >
                  <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                    Required
                  </Typography>
                  <Switch
                    size='small'
                    checked={field.required}
                    disabled={!field.checked}
                    onChange={e => handleStandardRequired(field.key, e.target.checked)}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: theme.palette.customColors.OutlineVariant }} />

        {/* Custom fields section */}
        <Box>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
            Custom Fields
          </Typography>
          <Typography
            variant='caption'
            sx={{ color: theme.palette.customColors.neutralSecondary, display: 'block', mb: 3 }}
          >
            Add additional fields specific to this gadget type
          </Typography>

          {customFields.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
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
                    <Typography
                      variant='caption'
                      sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}
                    >
                      Req.
                    </Typography>
                    <Switch
                      size='small'
                      checked={field.required}
                      onChange={e => updateCustomField(index, { required: e.target.checked })}
                    />
                  </Box>
                  <IconButton
                    size='small'
                    onClick={() => removeCustomField(index)}
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      flexShrink: 0,
                      '&:hover': { color: theme.palette.error.main }
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
              textTransform: 'none',
              '&:hover': {
                borderStyle: 'dashed',
                bgcolor: theme.palette.customColors.Surface
              }
            }}
          >
            Add Custom Field
          </Button>
        </Box>

        {/* Footer buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant='outlined' fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button variant='contained' fullWidth onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Create Gadget Type'}
          </Button>
        </Box>
      </Box>
    </CustomDrawer>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const ManageGadgets = () => {
  const theme = useTheme()
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
        {
          onSuccess: () => {
            setEditingGadget(null)
            setDrawerOpen(false)
          }
        }
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
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setDeletingGadget(null)
        }
      })
    }
  }

  const handleOpenCreate = () => {
    setEditingGadget(null)
    setDrawerOpen(true)
  }

  const gadgetColumns: GridColDef[] = [
    {
      field: 'gadget_name',
      headerName: 'Gadget Name',
      flex: 1.5,
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='mdi:devices' fontSize={18} />
          <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {row.gadget_name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'zoo_id',
      headerName: 'Scope',
      width: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <Chip
          label={row.zoo_id === 0 ? 'Global' : 'Zoo'}
          size='small'
          sx={
            row.zoo_id === 0
              ? { bgcolor: theme.palette.customColors.SurfaceVariant, color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: 11, height: 22 }
              : { bgcolor: theme.palette.customColors.Surface, color: theme.palette.primary.dark, fontWeight: 500, fontSize: 11, height: 22 }
          }
        />
      ),
    },
    {
      field: 'required_fields',
      headerName: 'Required Fields',
      flex: 2,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => <FieldChips fields={row.fields.filter((f: GadgetFieldConfig) => f.required)} variant='required' theme={theme} />,
    },
    {
      field: 'optional_fields',
      headerName: 'Optional Fields',
      flex: 2,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => <FieldChips fields={row.fields.filter((f: GadgetFieldConfig) => !f.required)} variant='optional' theme={theme} />,
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: ({ row }) =>
        row.zoo_id !== 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size='small'
              onClick={e => { e.stopPropagation(); handleEdit(row) }}
              sx={{ color: theme.palette.customColors.neutralSecondary, '&:hover': { color: theme.palette.primary.main } }}
            >
              <Icon icon='mdi:pencil-outline' fontSize={18} />
            </IconButton>
            <IconButton
              size='small'
              onClick={e => { e.stopPropagation(); setDeletingGadget(row); setDeleteDialogOpen(true) }}
              sx={{ color: theme.palette.customColors.neutralSecondary, '&:hover': { color: theme.palette.error.main } }}
            >
              <Icon icon='mdi:trash-can-outline' fontSize={18} />
            </IconButton>
          </Box>
        ) : null,
    },
  ]

  return (
    <Box>
      <PageCardLayout
        title='Gadget Types'
        action={
          <Button variant='contained' startIcon={<Icon icon='mdi:plus' />} onClick={handleOpenCreate}>
            Add Gadget Type
          </Button>
        }
      >
        <CommonTable
          columns={gadgetColumns}
          indexedRows={gadgets.map(g => ({ ...g, id: g.gadget_id }))}
          total={gadgets.length}
          loading={isLoading}
          disablePagination
          rowHeight={60}
          getRowId={(row: any) => row.gadget_id}
        />
      </PageCardLayout>

      {/* Create gadget drawer */}
      <CreateGadgetDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingGadget(null)
        }}
        onSubmit={handleSubmit}
        editGadget={editingGadget}
      />

      {/* Delete confirmation dialog */}
      <DialogConfirmationDialog
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        message={`Are you sure you want to delete ${deletingGadget?.gadget_name}?`}
        action={handleDeleteConfirm}
        loading={deleteGadgetMutation.isPending}
      />
    </Box>
  )
}

export default ManageGadgets
