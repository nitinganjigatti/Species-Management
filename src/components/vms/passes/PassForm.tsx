'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'

import Icon from 'src/@core/components/icon'
import SelectSites from 'src/components/report/SelectSite'
import FallbackAvatarRaw from 'src/views/utility/FallbackAvatar'
const FallbackAvatar = FallbackAvatarRaw as any
import { GADGET_STANDARD_FIELDS } from 'src/constants/vms'
import { useGadgetsList } from 'src/hooks/vms/useVmsGadgets'
import { useCreatePass, useUpdatePass } from 'src/hooks/vms/useVmsPasses'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getAllUsers } from 'src/lib/api/housing'
import Autocomplete from '@mui/material/Autocomplete'
import type { VmsPassSite, GadgetFieldConfig, VmsMasterGadget } from 'src/types/vms'

// ─── Gadget type alias ──────────────────────────────────────────────────────

interface GadgetTypeDef {
  gadget_id: number
  gadget_name: string
  fields: GadgetFieldConfig[]
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface GadgetEntry {
  gadget_id: number
  gadget_name: string
  quantity: number
  serial_key: string
  imei: string
  make: string
  model: string
  color: string
}

interface PassFormValues {
  visitor_name: string
  visitor_contact: string
  department: string
  on_behalf_of: string
  purpose_of_visit: string
  start_date: string
  end_date: string
  gadgets_text: string
  remarks: string
}

// ─── Yup schema ───────────────────────────────────────────────────────────────

const schema = yup.object({
  visitor_name: yup.string().trim().required('Visitor name is required'),
  visitor_contact: yup
    .string()
    .trim()
    .required('Contact number is required')
    .matches(/^[0-9+\-\s()]{7,15}$/, 'Enter a valid contact number'),
  department: yup.string().trim().required('Department is required'),
  on_behalf_of: yup.string().trim().default(''),
  purpose_of_visit: yup.string().trim().required('Purpose of visit is required'),
  start_date: yup.string().required('Start date is required'),
  end_date: yup
    .string()
    .required('End date is required')
    .test('end-gte-start', 'End date must be on or after start date', function (value) {
      const { start_date } = this.parent
      if (!start_date || !value) return true

      return value >= start_date
    }),
  gadgets_text: yup.string().trim().default(''),
  remarks: yup.string().trim().default(''),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayIso = () => new Date().toISOString().slice(0, 10)

// ─── FormField: label-above pattern ──────────────────────────────────────────

const FormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <Box>
    <Typography
      component='label'
      sx={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: 'customColors.OnSurfaceVariant',
        mb: '6px',
        lineHeight: '18px',
        minHeight: '18px',
      }}
    >
      {label}
      {required && <Box component='span' sx={{ color: 'customColors.Tertiary', ml: '2px' }}>*</Box>}
    </Typography>
    {children}
  </Box>
)

// ─── Section title ────────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography
      sx={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        color: 'customColors.neutralSecondary',
      }}
    >
      {children}
    </Typography>
  </Box>
)

// ─── Using existing SelectSites component from src/components/report/SelectSite.js ───

// ─── Gadget fields block ──────────────────────────────────────────────────────

interface GadgetFieldsBlockProps {
  index: number
  entry: GadgetEntry
  typeDef: GadgetTypeDef | undefined
  gadgetTypes: GadgetTypeDef[]
  onChange: (index: number, field: keyof GadgetEntry, value: string | number) => void
  onChangeType: (index: number, gadgetId: number) => void
  onRemove: (index: number) => void
}

const GadgetFieldsBlock = ({ index, entry, typeDef, gadgetTypes, onChange, onChangeType, onRemove }: GadgetFieldsBlockProps) => {
  const fields = typeDef?.fields ?? []

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'customColors.OutlineVariant',
        borderRadius: '8px',
        mb: 1.5,
        overflow: 'hidden',
      }}
    >
      {/* Header: type + qty + remove */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          px: 2,
          py: 1.5,
          bgcolor: 'customColors.Surface',
          borderBottom: '1px solid',
          borderColor: 'customColors.OutlineVariant',
        }}
      >
        {/* Gadget type name (fixed once added) */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='mdi:devices' fontSize={18} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'text.primary' }}>
            {entry.gadget_name}
          </Typography>
        </Box>

        {/* Remove */}
        <Box sx={{ alignSelf: 'flex-end', pb: '1px' }}>
          <Button
            type='button'
            size='small'
            onClick={() => onRemove(index)}
            sx={{
              textTransform: 'none',
              color: 'error.main',
              bgcolor: 'transparent',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              borderRadius: '6px',
              px: '10px',
              py: '6px',
              minWidth: 'auto',
              '&:hover': { bgcolor: 'customColors.ErrorContainer' },
            }}
          >
            Remove
          </Button>
        </Box>
      </Box>

      {/* Body: paired rows of fields */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(() => {
          const visibleFields = fields.filter(f => ['serial_key', 'imei', 'make', 'model', 'color'].includes(f.key))
          const rows: typeof visibleFields[] = []
          for (let i = 0; i < visibleFields.length; i += 2) {
            rows.push(visibleFields.slice(i, i + 2))
          }

          return rows.map((row, rowIdx) => (
            <Box key={rowIdx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {row.map(field => {
                const label = GADGET_STANDARD_FIELDS[field.key] ?? field.key
                const fieldKey = field.key as keyof GadgetEntry

                return (
                  <Box key={field.key}>
                    <Typography
                      component='label'
                      sx={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'customColors.neutralSecondary',
                        mb: '4px',
                      }}
                    >
                      {label}
                      {field.required && (
                        <Typography component='span' sx={{ color: 'customColors.Tertiary', ml: '2px' }}>
                          *
                        </Typography>
                      )}
                    </Typography>
                    <TextField
                      fullWidth
                      size='small'
                      value={(entry[fieldKey] as string) ?? ''}
                      onChange={e => onChange(index, fieldKey, e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '13px' } }}
                    />
                  </Box>
                )
              })}
            </Box>
          ))
        })()}
      </Box>
    </Box>
  )
}

// ─── PassForm ─────────────────────────────────────────────────────────────────

interface PassFormProps {
  passId?: string
}

const PassForm = ({ passId }: PassFormProps) => {
  const router = useRouter()
  const isEdit = Boolean(passId)

  // ── API hooks ──────────────────────────────────────────────────────────────
  const { data: gadgetsResponse } = useGadgetsList()
  const createPassMutation = useCreatePass()
  const updatePassMutation = useUpdatePass()

  // Gadget types from API (fallback to empty)
  const gadgetTypes: GadgetTypeDef[] = (gadgetsResponse?.data ?? []).map((g: VmsMasterGadget) => ({
    gadget_id: g.gadget_id,
    gadget_name: g.gadget_name,
    fields: g.fields,
  }))

  // ── Site list from Antz API ────────────────────────────────────────────────
  const [allSites, setAllSites] = useState<VmsPassSite[]>([])

  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await getZooWiseSiteLists({ page_no: 1, limit: 100, q: '' })
        const sites = (res?.data?.result ?? res?.data ?? []).map((s: any) => ({
          site_id: Number(s.site_id),
          site_name: s.site_name,
          site_image: s.site_image ?? '',
        }))
        setAllSites(sites)
      } catch {
        setAllSites([])
      }
    }
    loadSites()
  }, [])

  // Site selection state
  // User search for "On Behalf Of"
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userOptions, setUserOptions] = useState<{ user_id: number; user_name: string; user_profile_pic: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<{ user_id: number; user_name: string; user_profile_pic: string } | null>(null)
  const [userSearchLoading, setUserSearchLoading] = useState(false)

  useEffect(() => {
    if (!userSearchQuery || userSearchQuery.length < 2) {
      setUserOptions([])

      return
    }
    const timer = setTimeout(async () => {
      setUserSearchLoading(true)
      try {
        const res: any = await getAllUsers({ page_no: 1, limit: 10, q: userSearchQuery, ref_type: 'total_user', role_key: 'all_users' } as any)
        const users = (res?.data?.result ?? []).map((u: any) => ({
          user_id: Number(u.user_id),
          user_name: u.user_name,
          user_profile_pic: u.user_profile_pic ?? '',
        }))
        setUserOptions(users)
      } catch {
        setUserOptions([])
      }
      setUserSearchLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [userSearchQuery])

  const [siteDrawerOpen, setSiteDrawerOpen] = useState(false)
  const [siteSearchTerm, setSiteSearchTerm] = useState('')
  const [tempSelectedSites, setTempSelectedSites] = useState<{ Site: number[] }>({ Site: [] })
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([])
  const [siteError, setSiteError] = useState<string | null>(null)

  // Gadget state — starts empty
  const [gadgetEntries, setGadgetEntries] = useState<GadgetEntry[]>([])

  // Add Gadget menu anchor
  const [gadgetMenuAnchor, setGadgetMenuAnchor] = useState<null | HTMLElement>(null)
  const gadgetMenuOpen = Boolean(gadgetMenuAnchor)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PassFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      visitor_name: '',
      visitor_contact: '',
      department: '',
      on_behalf_of: '',
      purpose_of_visit: '',
      start_date: todayIso(),
      end_date: todayIso(),
      gadgets_text: '',
      remarks: '',
    },
  })

  // ── Site helpers ────────────────────────────────────────────────────────────

  const handleSitesDone = (ids: number[]) => {
    setSelectedSiteIds(ids)
    if (ids.length > 0) setSiteError(null)
  }

  const removeSite = (siteId: number) => {
    setSelectedSiteIds(prev => prev.filter(id => id !== siteId))
  }

  const selectedSiteObjects = allSites.filter(s => selectedSiteIds.includes(s.site_id))

  // ── Gadget helpers ──────────────────────────────────────────────────────────

  const addGadget = (typeDef: GadgetTypeDef) => {
    const newEntry: GadgetEntry = {
      gadget_id: typeDef.gadget_id,
      gadget_name: typeDef.gadget_name,
      quantity: 1,
      serial_key: '',
      imei: '',
      make: '',
      model: '',
      color: '',
    }
    setGadgetEntries(prev => [...prev, newEntry])
  }

  const updateGadgetField = (index: number, field: keyof GadgetEntry, value: string | number) => {
    setGadgetEntries(prev =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    )
  }

  const changeGadgetType = (index: number, gadgetId: number) => {
    const typeDef = gadgetTypes.find(t => t.gadget_id === gadgetId)
    if (!typeDef) return
    setGadgetEntries(prev =>
      prev.map((entry, i) =>
        i === index
          ? { ...entry, gadget_id: typeDef.gadget_id, gadget_name: typeDef.gadget_name }
          : entry
      )
    )
  }

  const removeGadget = (index: number) => {
    setGadgetEntries(prev => prev.filter((_, i) => i !== index))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(async data => {
    if (selectedSiteIds.length === 0) {
      setSiteError('Please select at least one site')

      return
    }

    setIsSubmitting(true)

    const { on_behalf_of, ...formData } = data

    const payload = {
      ...formData,
      created_on_behalf_of: selectedUser?.user_id ?? null,
      site_ids: selectedSiteIds,
      gadgets: gadgetEntries.map(entry => ({
        gadget_id: entry.gadget_id,
        quantity: entry.quantity,
        serial_key: entry.serial_key || null,
        imei: entry.imei || null,
        make: entry.make || null,
        model: entry.model || null,
        color: entry.color || null,
        custom_fields: null,
      })),
    }

    try {
      if (isEdit && passId) {
        await updatePassMutation.mutateAsync({ id: passId, payload })
      } else {
        const result = await createPassMutation.mutateAsync(payload)
        if (result?.data?.pass_id) {
          router.push(`/vms/passes/${result.data.pass_id}`)

          return
        }
      }
      router.push('/vms/passes')
    } catch {
      // Error toast handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box component='form' onSubmit={onSubmit} noValidate>
      {/* ONE single Card wrapping everything */}
      <Card
        sx={{
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 1,
        }}
      >
        {/* ── Card Header ──────────────────────────────────────────────── */}
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
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: 'text.primary' }}>
            {isEdit ? 'Edit Visitor Pass' : 'Create Visitor Pass'}
          </Typography>
          <Button
            type='button'
            onClick={() => router.push('/vms/passes')}
            sx={{
              textTransform: 'none',
              bgcolor: 'transparent',
              color: 'customColors.neutralSecondary',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              px: '12px',
              py: '8px',
              minWidth: 'auto',
              '&:hover': {
                bgcolor: 'customColors.Surface',
                color: 'customColors.OnSurfaceVariant',
              },
            }}
          >
            Cancel
          </Button>
        </Box>

        {/* ── Form Body ────────────────────────────────────────────────── */}
        <Box sx={{ p: 3 }}>

          {/* ── SECTION: Visitor Information ─────────────────────────── */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>Visitor Information</SectionTitle>

            {/* Row 1: Name + Contact */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormField label='Visitor Name' required>
                <Controller
                  name='visitor_name'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      placeholder="Enter visitor's full name"
                      error={Boolean(errors.visitor_name)}
                      helperText={errors.visitor_name?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>

              <FormField label='Contact Number' required>
                <Controller
                  name='visitor_contact'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      type='tel'
                      placeholder='e.g. +91 98765 43210'
                      error={Boolean(errors.visitor_contact)}
                      helperText={errors.visitor_contact?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>
            </Box>

            {/* Row 2: Department + On Behalf Of */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <FormField label='Department' required>
                <Controller
                  name='department'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      placeholder='Enter department name'
                      error={Boolean(errors.department)}
                      helperText={errors.department?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>

              <FormField label='On Behalf Of'>
                {selectedUser ? (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      height: '40px',
                      bgcolor: 'customColors.Surface',
                      border: '1px solid',
                      borderColor: 'customColors.OutlineVariant',
                      borderRadius: '8px',
                    }}
                  >
                    <FallbackAvatar
                      src={selectedUser.user_profile_pic}
                      alt={selectedUser.user_name}
                      size='small'
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: 'text.primary' }}>
                      {selectedUser.user_name}
                    </Typography>
                    <IconButton
                      size='small'
                      onClick={() => {
                        setSelectedUser(null)
                        setUserOptions([])
                        setUserSearchQuery('')
                      }}
                      sx={{ p: 0, ml: 0.5, color: 'customColors.neutralSecondary', '&:hover': { color: 'error.main' } }}
                    >
                      <Icon icon='mdi:close' fontSize={16} />
                    </IconButton>
                  </Box>
                ) : (
                <Autocomplete
                  options={userOptions}
                  getOptionLabel={opt => opt.user_name}
                  value={selectedUser}
                  onChange={(_, newVal) => {
                    setSelectedUser(newVal)
                  }}
                  onInputChange={(_, value) => setUserSearchQuery(value)}
                  loading={userSearchLoading}
                  noOptionsText={userSearchQuery.length < 2 ? 'Type to search...' : 'No users found'}
                  isOptionEqualToValue={(opt, val) => opt.user_id === val.user_id}
                  renderInput={params => (
                    <TextField
                      {...params}
                      fullWidth
                      size='small'
                      placeholder='Search staff member...'
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component='li' {...props} key={option.user_id} sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                      <FallbackAvatar
                        src={option.user_profile_pic}
                        alt={option.user_name}
                        size='small'
                        sx={{ width: 28, height: 28 }}
                      />
                      <Typography variant='body2'>{option.user_name}</Typography>
                    </Box>
                  )}
                />
                )}
              </FormField>
            </Box>

            {/* Purpose of Visit - full width below the grid */}
            <Box sx={{ mt: 2 }}>
              <FormField label='Purpose of Visit' required>
                <Controller
                  name='purpose_of_visit'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      multiline
                      rows={3}
                      placeholder='Describe the purpose of this visit...'
                      error={Boolean(errors.purpose_of_visit)}
                      helperText={errors.purpose_of_visit?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>
            </Box>
          </Box>

          {/* ── SECTION: Schedule ────────────────────────────────────── */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>Schedule</SectionTitle>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'start' }}>
              <FormField label='Start Date' required>
                <Controller
                  name='start_date'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      type='date'
                      error={Boolean(errors.start_date)}
                      helperText={errors.start_date?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>

              <FormField label='End Date' required>
                <Controller
                  name='end_date'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      type='date'
                      inputProps={{ min: watch('start_date') }}
                      error={Boolean(errors.end_date)}
                      helperText={errors.end_date?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>
            </Box>
          </Box>

          {/* ── SECTION: Sites ───────────────────────────────────────── */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>Sites</SectionTitle>

            <Typography
              component='label'
              sx={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'customColors.OnSurfaceVariant', mb: '10px' }}
            >
              Assigned Sites{' '}
              <Typography component='span' sx={{ color: 'customColors.Tertiary' }}>*</Typography>
            </Typography>

            {/* Selected site chips */}
            {selectedSiteObjects.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                {selectedSiteObjects.map(site => (
                  <Box
                    key={site.site_id}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      pl: '6px',
                      pr: '12px',
                      py: '6px',
                      bgcolor: 'customColors.Surface',
                      border: '1px solid',
                      borderColor: 'customColors.OutlineVariant',
                      borderRadius: '8px',
                    }}
                  >
                    {/* Site image with fallback */}
                    <FallbackAvatar
                      src={site.site_image || ''}
                      alt={site.site_name}
                      variant='rounded'
                      size='small'
                      sx={{ width: 32, height: 32, borderRadius: '6px' }}
                    />
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: 'text.primary' }}>
                      {site.site_name}
                    </Typography>
                    <IconButton
                      size='small'
                      onClick={() => removeSite(site.site_id)}
                      sx={{
                        ml: '4px',
                        p: 0,
                        color: 'customColors.neutralSecondary',
                        '&:hover': { color: 'error.main', bgcolor: 'transparent' },
                      }}
                    >
                      <Icon icon='mdi:close' fontSize={16} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {selectedSiteObjects.length === 0 && (
              <Box
                sx={{
                  py: 3,
                  textAlign: 'center',
                  bgcolor: 'customColors.Surface',
                  borderRadius: '8px',
                  mb: 1.5,
                }}
              >
                <Icon icon='mdi:map-marker-off-outline' fontSize={28} />
                <Typography sx={{ mt: 1, fontSize: '12px', color: 'customColors.OnSurfaceVariant' }}>
                  No sites selected yet
                </Typography>
              </Box>
            )}

            {siteError && (
              <FormHelperText error sx={{ mb: 1, fontSize: '12px' }}>
                {siteError}
              </FormHelperText>
            )}

            <Button
              type='button'
              onClick={() => {
                setTempSelectedSites({ Site: selectedSiteIds })
                setSiteDrawerOpen(true)
              }}
              sx={{
                textTransform: 'none',
                bgcolor: 'transparent',
                color: 'primary.main',
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                px: '14px',
                py: '7px',
                minWidth: 'auto',
                lineHeight: 1.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                '&:hover': { bgcolor: 'text.primary' },
              }}
            >
              <Icon icon='mdi:plus' fontSize={16} />
              Add Sites
            </Button>
          </Box>

          {/* ── SECTION: Gadgets & Equipment ─────────────────────────── */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>Gadgets &amp; Equipment</SectionTitle>

            {/* Gadget entry blocks */}
            {gadgetEntries.map((entry, index) => {
              const typeDef = gadgetTypes.find(t => t.gadget_id === entry.gadget_id)

              return (
                <GadgetFieldsBlock
                  key={`${entry.gadget_id}-${index}`}
                  index={index}
                  entry={entry}
                  typeDef={typeDef}
                  gadgetTypes={gadgetTypes}
                  onChange={updateGadgetField}
                  onChangeType={changeGadgetType}
                  onRemove={removeGadget}
                />
              )
            })}

            {/* Add Gadget button with popover menu */}
            <Box sx={{ mt: gadgetEntries.length > 0 ? 1.5 : 0 }}>
              <Button
                type='button'
                onClick={e => setGadgetMenuAnchor(e.currentTarget)}
                sx={{
                  textTransform: 'none',
                  bgcolor: 'transparent',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  px: '14px',
                  py: '7px',
                  minWidth: 'auto',
                  lineHeight: 1.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  '&:hover': { bgcolor: 'text.primary' },
                }}
              >
                <Icon icon='mdi:plus' fontSize={16} />
                Add Gadget
              </Button>
              <Menu
                anchorEl={gadgetMenuAnchor}
                open={gadgetMenuOpen}
                onClose={() => setGadgetMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { sx: { mt: 0.5, minWidth: 180, borderRadius: '8px' } } }}
              >
                {gadgetTypes.map(typeDef => (
                  <MenuItem
                    key={typeDef.gadget_id}
                    onClick={() => {
                      addGadget(typeDef)
                      setGadgetMenuAnchor(null)
                    }}
                    sx={{ gap: 1.5, fontSize: '13px', py: 1 }}
                  >
                    <Icon icon='mdi:devices' fontSize={16} />
                    {typeDef.gadget_name}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>

          {/* ── SECTION: Additional Notes ────────────────────────────── */}
          <Box>
            <SectionTitle>Additional Notes</SectionTitle>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'start' }}>
              <FormField label='Other Gadgets'>
                <Controller
                  name='gadgets_text'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      placeholder='List any other gadgets...'
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>

              <FormField label='Remarks'>
                <Controller
                  name='remarks'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size='small'
                      placeholder='Add any remarks or notes...'
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                />
              </FormField>
            </Box>
          </Box>

        </Box>
        {/* End form-body */}

        {/* ── Card Footer ──────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            type='button'
            onClick={() => router.push('/vms/passes')}
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              bgcolor: 'background.paper',
              color: 'customColors.OnSurfaceVariant',
              border: '1px solid',
              borderColor: 'customColors.OutlineVariant',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              px: 2,
              py: '8px',
              lineHeight: 1.5,
              '&:hover': {
                bgcolor: 'customColors.Surface',
                borderColor: 'customColors.Outline',
              },
            }}
          >
            Cancel
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              type='submit'
              disabled={isSubmitting}
              sx={{
                textTransform: 'none',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                px: 2,
                py: '8px',
                lineHeight: 1.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: '0 2px 8px rgba(55,189,105,0.3)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'customColors.OutlineVariant',
                  color: 'background.paper',
                },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={16} color='inherit' />
              ) : (
                <Icon icon='mdi:check' fontSize={18} />
              )}
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Pass'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── Site selection drawer (reusing existing SelectSites component) ── */}
      <SelectSites
        openSiteListDrawer={siteDrawerOpen}
        setSiteListDrawer={setSiteDrawerOpen}
        siteData={allSites}
        searchTerm={siteSearchTerm}
        setSearchTerm={setSiteSearchTerm}
        tempSelectedItems={tempSelectedSites}
        setTempSelectedItems={(selections: { Site: number[] }) => {
          setTempSelectedSites(selections)
          const ids = selections?.Site ?? []
          setSelectedSiteIds(ids)
          if (ids.length > 0) setSiteError(null)
        }}
      />
    </Box>
  )
}

export default PassForm
