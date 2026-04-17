'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormHelperText from '@mui/material/FormHelperText'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import { Grid } from '@mui/system'

import Icon from 'src/@core/components/icon'
import SelectSites from 'src/components/report/SelectSite'
import FallbackAvatarRaw from 'src/views/utility/FallbackAvatar'
const FallbackAvatar = FallbackAvatarRaw as any
import { GADGET_STANDARD_FIELDS } from 'src/constants/vms'
import * as vmsApi from 'src/lib/api/vms'
import { useCreatePass, useUpdatePass } from 'src/hooks/vms/useVmsPasses'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getAllUsers } from 'src/lib/api/housing/common'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
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
  remarks: yup.string().trim().default('')
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayIso = () => new Date().toISOString().slice(0, 10)

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

const GadgetFieldsBlock = ({ index, entry, typeDef, onChange, onRemove }: GadgetFieldsBlockProps) => {
  const theme = useTheme()
  const fields = typeDef?.fields ?? []

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: theme.palette.customColors.SurfaceVariant,
        borderRadius: '10px',
        mb: 3,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          bgcolor: theme.palette.customColors.tableHeaderBg,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='mdi:devices' fontSize={18} />
          <Typography variant='subtitle2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
            {entry.gadget_name}
          </Typography>
        </Box>
        <Button
          type='button'
          size='small'
          color='error'
          onClick={() => onRemove(index)}
          sx={{ textTransform: 'none', fontSize: '13px', fontWeight: 500 }}
        >
          Remove
        </Button>
      </Box>

      {/* Body */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {fields
            .filter(f => ['serial_key', 'imei', 'make', 'model', 'color'].includes(f.key))
            .map(field => {
              const label = GADGET_STANDARD_FIELDS[field.key] ?? field.key
              const fieldKey = field.key as keyof GadgetEntry

              return (
                <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={label}
                    required={field.required}
                    value={(entry[fieldKey] as string) ?? ''}
                    onChange={e => onChange(index, fieldKey, e.target.value)}
                  />
                </Grid>
              )
            })}
        </Grid>
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
  const theme = useTheme()
  const isEdit = Boolean(passId)

  // ── API hooks ──────────────────────────────────────────────────────────────
  const createPassMutation = useCreatePass()
  const updatePassMutation = useUpdatePass()

  // ── Gadgets (lazy — fetched only when "Add Gadget" is clicked) ────────────
  const [gadgetTypes, setGadgetTypes] = useState<GadgetTypeDef[]>([])
  const [gadgetsLoaded, setGadgetsLoaded] = useState(false)

  const loadGadgets = useCallback(async () => {
    if (gadgetsLoaded) return
    try {
      const res = await vmsApi.getGadgetsList()
      const types = (res?.data ?? []).map((g: VmsMasterGadget) => ({
        gadget_id: g.gadget_id,
        gadget_name: g.gadget_name,
        fields: g.fields,
      }))
      setGadgetTypes(types)
    } catch {
      setGadgetTypes([])
    }
    setGadgetsLoaded(true)
  }, [gadgetsLoaded])

  // ── Sites (lazy — fetched only when "Add Sites" is clicked) ───────────────
  const [allSites, setAllSites] = useState<VmsPassSite[]>([])
  const [sitesLoaded, setSitesLoaded] = useState(false)

  const loadSites = useCallback(async () => {
    if (sitesLoaded) return
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
    setSitesLoaded(true)
  }, [sitesLoaded])

  // User search for "On Behalf Of"
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userOptions, setUserOptions] = useState<{ user_id: number; user_name: string; user_profile_pic: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<{
    user_id: number
    user_name: string
    user_profile_pic: string
  } | null>(null)
  const [userSearchLoading, setUserSearchLoading] = useState(false)

  useEffect(() => {
    if (!userSearchQuery || userSearchQuery.length < 2) {
      setUserOptions([])

      return
    }
    const timer = setTimeout(async () => {
      setUserSearchLoading(true)
      try {
        const res: any = await getAllUsers({
          page_no: 1,
          limit: 10,
          q: userSearchQuery,
          ref_type: 'total_user',
          role_key: 'all_users'
        } as any)
        const users = (res?.data?.result ?? []).map((u: any) => ({
          user_id: Number(u.user_id),
          user_name: u.user_name,
          user_profile_pic: u.user_profile_pic ?? ''
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

  // Gadget state
  const [gadgetEntries, setGadgetEntries] = useState<GadgetEntry[]>([])
  const [gadgetMenuAnchor, setGadgetMenuAnchor] = useState<null | HTMLElement>(null)
  const gadgetMenuOpen = Boolean(gadgetMenuAnchor)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
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
      remarks: ''
    }
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
      color: ''
    }
    setGadgetEntries(prev => [...prev, newEntry])
  }

  const updateGadgetField = (index: number, field: keyof GadgetEntry, value: string | number) => {
    setGadgetEntries(prev => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)))
  }

  const changeGadgetType = (index: number, gadgetId: number) => {
    const typeDef = gadgetTypes.find(t => t.gadget_id === gadgetId)
    if (!typeDef) return
    setGadgetEntries(prev =>
      prev.map((entry, i) =>
        i === index ? { ...entry, gadget_id: typeDef.gadget_id, gadget_name: typeDef.gadget_name } : entry
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
        custom_fields: null
      }))
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
      <PageCardLayout
        title={isEdit ? 'Edit Visitor Pass' : 'Create Visitor Pass'}
        showIcon
        onIconClick={() => router.push('/vms/passes')}
      >
        {/* ── SECTION: Visitor Information ─────────────────────────── */}
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3 }}>
          Visitor Information
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='visitor_name'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Visitor Name'
                  required
                  placeholder="Enter visitor's full name"
                  error={Boolean(errors.visitor_name)}
                  helperText={errors.visitor_name?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='visitor_contact'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Contact Number'
                  required
                  type='tel'
                  placeholder='e.g. +91 98765 43210'
                  error={Boolean(errors.visitor_contact)}
                  helperText={errors.visitor_contact?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='department'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Department'
                  required
                  placeholder='Enter department name'
                  error={Boolean(errors.department)}
                  helperText={errors.department?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            {selectedUser ? (
              <Box>
                <Typography
                  variant='caption'
                  sx={{ color: theme.palette.customColors.neutralSecondary, mb: 0.5, display: 'block' }}
                >
                  On Behalf Of
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    height: '40px',
                    bgcolor: theme.palette.customColors.Surface,
                    border: '1px solid',
                    borderColor: theme.palette.customColors.OutlineVariant,
                    borderRadius: '10px'
                  }}
                >
                  <FallbackAvatar
                    src={selectedUser.user_profile_pic}
                    alt={selectedUser.user_name}
                    size='small'
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>
                    {selectedUser.user_name}
                  </Typography>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setSelectedUser(null)
                      setUserOptions([])
                      setUserSearchQuery('')
                    }}
                    sx={{
                      p: 0,
                      ml: 0.5,
                      color: theme.palette.customColors.neutralSecondary,
                      '&:hover': { color: 'error.main' }
                    }}
                  >
                    <Icon icon='mdi:close' fontSize={16} />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Autocomplete
                options={userOptions}
                getOptionLabel={opt => opt.user_name}
                value={selectedUser}
                onChange={(_, newVal) => setSelectedUser(newVal)}
                onInputChange={(_, value) => setUserSearchQuery(value)}
                loading={userSearchLoading}
                noOptionsText={userSearchQuery.length < 2 ? 'Type to search...' : 'No users found'}
                isOptionEqualToValue={(opt, val) => opt.user_id === val.user_id}
                renderInput={params => (
                  <TextField {...params} fullWidth label='On Behalf Of' placeholder='Search staff member...' />
                )}
                renderOption={({ key: _key, ...props }, option) => (
                  <Box
                    component='li'
                    key={option.user_id}
                    {...props}
                    sx={{ gap: 1, display: 'flex', alignItems: 'center' }}
                  >
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
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name='purpose_of_visit'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Purpose of Visit'
                  required
                  multiline
                  rows={3}
                  placeholder='Describe the purpose of this visit...'
                  error={Boolean(errors.purpose_of_visit)}
                  helperText={errors.purpose_of_visit?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* ── SECTION: Schedule ────────────────────────────────────── */}
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mt: 5, mb: 3 }}>
          Schedule
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='start_date'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Start Date'
                  required
                  type='date'
                  error={Boolean(errors.start_date)}
                  helperText={errors.start_date?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='end_date'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='End Date'
                  required
                  type='date'
                  inputProps={{ min: watch('start_date') }}
                  error={Boolean(errors.end_date)}
                  helperText={errors.end_date?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* ── SECTION: Sites ───────────────────────────────────────── */}
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mt: 5, mb: 3 }}>
          Sites
          <Typography component='span' sx={{ color: theme.palette.customColors.Tertiary, ml: 0.5 }}>
            *
          </Typography>
        </Typography>

        {selectedSiteObjects.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
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
                  bgcolor: theme.palette.customColors.Surface,
                  border: '1px solid',
                  borderColor: theme.palette.customColors.OutlineVariant,
                  borderRadius: '10px'
                }}
              >
                <FallbackAvatar
                  src={site.site_image || ''}
                  alt={site.site_name}
                  variant='rounded'
                  size='small'
                  sx={{ width: 32, height: 32, borderRadius: '6px' }}
                />
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {site.site_name}
                </Typography>
                <IconButton
                  size='small'
                  onClick={() => removeSite(site.site_id)}
                  sx={{
                    ml: '4px',
                    p: 0,
                    color: theme.palette.customColors.neutralSecondary,
                    '&:hover': { color: 'error.main', bgcolor: 'transparent' }
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
              bgcolor: theme.palette.customColors.Surface,
              borderRadius: '10px',
              mb: 2
            }}
          >
            <Icon icon='mdi:map-marker-off-outline' fontSize={28} />
            <Typography
              variant='caption'
              sx={{ mt: 1, display: 'block', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              No sites selected yet
            </Typography>
          </Box>
        )}

        {siteError && (
          <FormHelperText error sx={{ mb: 1 }}>
            {siteError}
          </FormHelperText>
        )}

        <Button
          type='button'
          variant='outlined'
          size='small'
          onClick={() => {
            loadSites()
            setTempSelectedSites({ Site: selectedSiteIds })
            setSiteDrawerOpen(true)
          }}
          startIcon={<Icon icon='mdi:plus' fontSize={16} />}
          sx={{ textTransform: 'none' }}
        >
          Add Sites
        </Button>

        {/* ── SECTION: Gadgets & Equipment ─────────────────────────── */}
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mt: 5, mb: 3 }}>
          Gadgets &amp; Equipment
        </Typography>

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

        <Box sx={{ mt: gadgetEntries.length > 0 ? 1 : 0 }}>
          <Button
            type='button'
            variant='outlined'
            size='small'
            onClick={e => {
              loadGadgets()
              setGadgetMenuAnchor(e.currentTarget)
            }}
            startIcon={<Icon icon='mdi:plus' fontSize={16} />}
            sx={{ textTransform: 'none' }}
          >
            Add Gadget
          </Button>
          <Menu
            anchorEl={gadgetMenuAnchor}
            open={gadgetMenuOpen}
            onClose={() => setGadgetMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.5, minWidth: 180, borderRadius: '10px' } } }}
          >
            {gadgetTypes.map(typeDef => (
              <MenuItem
                key={typeDef.gadget_id}
                onClick={() => {
                  addGadget(typeDef)
                  setGadgetMenuAnchor(null)
                }}
                sx={{ gap: 1.5 }}
              >
                <Icon icon='mdi:devices' fontSize={16} />
                {typeDef.gadget_name}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* ── SECTION: Additional Notes ────────────────────────────── */}
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mt: 5, mb: 3 }}>
          Additional Notes
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='gadgets_text'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Other Gadgets' placeholder='List any other gadgets...' />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='remarks'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Remarks' placeholder='Add any remarks or notes...' />
              )}
            />
          </Grid>
        </Grid>

        {/* ── Footer ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 2,
            pt: 5,
            mt: 5,
            borderTop: '1px solid',
            borderColor: theme.palette.customColors.OutlineVariant
          }}
        >
          <Button variant='outlined' onClick={() => router.push('/vms/passes')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={16} color='inherit' /> : <Icon icon='mdi:check' fontSize={18} />
            }
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Pass'}
          </Button>
        </Box>
      </PageCardLayout>

      {/* ── Site selection drawer ── */}
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
