import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import ConfirmDialog from 'src/components/ConfirmationDialog'
import {
  reallocate,
  createReviewFlag,
  clearReviewFlag
} from 'src/lib/api/compliance/matrix'
import AsyncSpeciesAutocomplete from './AsyncSpeciesAutocomplete'

const NOTE_MAX = 500

const shortCode = org => org?.short_code || org?.organization_name?.slice(0, 5).toUpperCase() || ''

const isMeaningful = v => {
  if (!v) return false
  const s = String(v).trim().toLowerCase()
  return s !== '' && s !== 'undetermined' && s !== 'unknown'
}

const SECTION_LABEL_SX = {
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'customColors.neutralSecondary',
  fontWeight: 600,
  mt: '14px',
  mb: '8px'
}

const FIELD_LABEL_SX = {
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'customColors.neutralSecondary',
  fontWeight: 600,
  mb: '6px'
}

const ReallocateForm = ({ editing, onClose, onSaved }) => {
  const { row, orgs: orgsProp = [], taxonomyId, siteId, site_name } = editing
  const queryClient = useQueryClient()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [flagNote, setFlagNote] = useState('')
  const [saveError, setSaveError] = useState('')
  const [genderMode, setGenderMode] = useState(false)

  // Snapshot endpoint disabled — drawer uses matrix row data directly so
  // the displayed allocation always matches the table. Re-enable once the
  // /compliance/snapshot endpoint is confirmed to return values consistent
  // with the matrix endpoint.
  const snapshotLoading = false
  const snapshotError = null

  const snapshot = useMemo(() => {
    return {
      compliance_species_id: row.compliance_species_id ?? null,
      compliance_common_name: row.compliance_common_name || '',
      compliance_scientific_name: row.compliance_scientific_name || '',
      common_name: row.common_name || '',
      scientific_name: row.scientific_name || '',
      total: row.total ?? 0,
      orgs: orgsProp,
      by_org: row.by_org || {},
      by_org_gender: row.by_org_gender || {},
      needs_review: Boolean(row.needs_review),
      review_flag_id: row.review_flag_id ?? null,
      has_groups: false,
      review_flag: null
    }
  }, [row, orgsProp])

  const orgs = snapshot.orgs || []
  const lockedTotal = snapshot.total ?? 0

  const form = useForm({
    defaultValues: {
      compliance_common_name: '',
      compliance_scientific_name: '',
      by_org: {},
      by_org_male: {},
      by_org_female: {},
      by_org_unknown: {},
      repoint: null,
      note: ''
    },
    mode: 'onChange'
  })
  const { control, handleSubmit, watch, reset, formState, setValue } = form

  useEffect(() => {
    const by_org = {}
    const by_org_male = {}
    const by_org_female = {}
    const by_org_unknown = {}
    orgs.forEach(org => {
      const key = String(org.organization_id)
      by_org[key] = Number(snapshot.by_org?.[key] ?? 0)
      const g = snapshot.by_org_gender?.[key]
      by_org_male[key] = Number(g?.male ?? 0)
      by_org_female[key] = Number(g?.female ?? 0)
      by_org_unknown[key] = Number(g?.unknown ?? 0)
    })

    // Pre-fill repoint only when the row is actually linked AND the linked
    // species has its own identity (different taxonomy_id from this row).
    // Otherwise show an empty search dropdown.
    const linkedTaxonomyId = snapshot.compliance_taxonomy_id
    const linkedSpeciesId = snapshot.compliance_species_id
    const showAsRepoint =
      linkedSpeciesId != null &&
      linkedTaxonomyId != null &&
      linkedTaxonomyId !== taxonomyId

    const linkedRepoint = showAsRepoint
      ? {
          type: 'existing',
          id: linkedTaxonomyId,
          compliance_species_id: linkedSpeciesId,
          common_name:
            (isMeaningful(snapshot.compliance_common_name) && snapshot.compliance_common_name) ||
            '',
          scientific_name:
            (isMeaningful(snapshot.compliance_scientific_name) &&
              snapshot.compliance_scientific_name) ||
            ''
        }
      : null

    reset({
      compliance_common_name: isMeaningful(snapshot.compliance_common_name)
        ? snapshot.compliance_common_name
        : snapshot.common_name || '',
      compliance_scientific_name: isMeaningful(snapshot.compliance_scientific_name)
        ? snapshot.compliance_scientific_name
        : snapshot.scientific_name || '',
      by_org,
      by_org_male,
      by_org_female,
      by_org_unknown,
      repoint: linkedRepoint,
      note: ''
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.compliance_species_id, snapshot.total, orgs.length])

  // Subscribe to every by_org field individually so live sum updates on every
  // keystroke. useMemo over the watched object misses changes because RHF
  // mutates the object in place (same reference), so the dep never triggers.
  const byOrgValues = orgs.map(org => watch(`by_org.${org.organization_id}`))
  const byOrgMaleValues = orgs.map(org => watch(`by_org_male.${org.organization_id}`))
  const byOrgFemaleValues = orgs.map(org => watch(`by_org_female.${org.organization_id}`))
  const byOrgUnknownValues = orgs.map(org => watch(`by_org_unknown.${org.organization_id}`))
  const repoint = watch('repoint')
  const commonName = watch('compliance_common_name')
  const scientificName = watch('compliance_scientific_name')

  const byOrg = orgs.reduce((acc, org, i) => {
    acc[String(org.organization_id)] = Number(byOrgValues[i] || 0)
    return acc
  }, {})
  const liveSum = byOrgValues.reduce((acc, v) => acc + Number(v || 0), 0)
  const totalsValid = liveSum === lockedTotal

  // Per-org gender sum validation (only relevant in gender mode)
  const genderSumErrors = orgs.reduce((acc, org, i) => {
    const count = Number(byOrgValues[i] || 0)
    const m = Number(byOrgMaleValues[i] || 0)
    const f = Number(byOrgFemaleValues[i] || 0)
    const u = Number(byOrgUnknownValues[i] || 0)
    if (m + f + u !== count) acc[String(org.organization_id)] = true
    return acc
  }, {})
  const genderValid = Object.keys(genderSumErrors).length === 0

  // Original values for diff display
  const originalCommon = isMeaningful(snapshot.compliance_common_name)
    ? snapshot.compliance_common_name
    : snapshot.common_name || ''
  const originalSci = isMeaningful(snapshot.compliance_scientific_name)
    ? snapshot.compliance_scientific_name
    : snapshot.scientific_name || ''
  const commonChanged = commonName && commonName !== originalCommon
  const sciChanged = scientificName && scientificName !== originalSci

  const reallocateMutation = useMutation({ mutationFn: reallocate, throwOnError: false })

  const flagCreateMutation = useMutation({
    mutationFn: createReviewFlag,
    throwOnError: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-matrix'] })
      toast.success('Marked for review')
      onSaved?.()
      onClose()
    }
  })

  const flagClearMutation = useMutation({
    mutationFn: clearReviewFlag,
    throwOnError: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-matrix'] })
      toast.success('Review flag cleared')
      onSaved?.()
      onClose()
    }
  })

  const dirtyFields = formState.dirtyFields
  const countsDirty = Boolean(dirtyFields.by_org)
  const repointDirty = Boolean(dirtyFields.repoint)
  const noteDirty = Boolean(dirtyFields.note)
  const isDirty = Boolean(dirtyFields.compliance_common_name || dirtyFields.compliance_scientific_name) || countsDirty || repointDirty || noteDirty

  const isSubmitting = reallocateMutation.isPending

  const handleCloseRequest = () => {
    if (isDirty) {
      setConfirmDiscard(true)
    } else {
      onClose()
    }
  }

  const onSubmit = async values => {
    setSaveError('')
    try {
      const body = { taxonomy_id: taxonomyId, site_id: siteId }

      body.compliance_common_name = values.compliance_common_name
      body.compliance_scientific_name = values.compliance_scientific_name

      if (countsDirty) {
        body.target = Object.fromEntries(
          orgs.map(org => {
            const key = String(org.organization_id)
            const count = parseInt(values.by_org[key], 10) || 0
            if (genderMode) {
              return [org.organization_id, {
                count,
                male: parseInt(values.by_org_male[key], 10) || 0,
                female: parseInt(values.by_org_female[key], 10) || 0,
                unknown: parseInt(values.by_org_unknown[key], 10) || 0
              }]
            }
            return [org.organization_id, { count }]
          })
        )
      }

      if (repointDirty && repoint) {
        if (repoint.type === 'existing') body.repoint_to_taxonomy_id = repoint.id
        else if (repoint.type === 'create') {
          body.repoint_to_create = {
            common_name: repoint.common_name,
            scientific_name: repoint.scientific_name
          }
        }
      }

      if (noteDirty && values.note) body.note = values.note

      await reallocateMutation.mutateAsync(body)

      queryClient.invalidateQueries({ queryKey: ['compliance-matrix'] })
      queryClient.invalidateQueries({ queryKey: ['compliance-snapshot', taxonomyId, siteId] })
      toast.success('Saved')
      onSaved?.()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Save failed.'
      setSaveError(msg)
    }
  }

  const canonicalCommon = snapshot.common_name || '—'
  const canonicalSci = snapshot.scientific_name || ''

  return (
    <Box
      component='form'
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Header */}
      <Box
        sx={{
          px: '20px',
          pt: '16px',
          pb: '16px',
          borderBottom: 1,
          borderColor: 'customColors.SurfaceVariant',
          bgcolor: 'grey.50',
          flexShrink: 0
        }}
      >
        <Stack direction='row' alignItems='flex-start' justifyContent='space-between' sx={{ mb: '12px' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: 'customColors.OnSurfaceVariant',
                lineHeight: 1.3
              }}
              noWrap
            >
              Edit · {canonicalCommon}
            </Typography>
            <Typography
              sx={{
                display: 'block',
                mt: '2px',
                fontSize: 12.5,
                fontStyle: 'italic',
                color: 'customColors.neutralSecondary'
              }}
            >
              {canonicalSci ? `(${canonicalSci})` : ''}
              {canonicalSci && site_name ? ' · ' : ''}
              {site_name || ''}
            </Typography>
          </Box>
          <IconButton size='small' onClick={handleCloseRequest} sx={{ ml: 1 }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Stack>

        {/* Repoint — moved to top-right per spec; prefilled when row already linked */}
        <Stack direction='row' alignItems='center' spacing={1.5}>
          <Typography
            sx={{
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'customColors.neutralSecondary',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            Repoint
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {repoint ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'customColors.OnBackground',
                  color: 'primary.dark',
                  borderRadius: 999,
                  fontWeight: 500,
                  fontSize: 13,
                  maxWidth: '100%'
                }}
              >
                <Box
                  component='span'
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {repoint.common_name}
                  {repoint.type === 'create' && ' (new)'}
                </Box>
                <IconButton
                  size='small'
                  onClick={() => setValue('repoint', null, { shouldDirty: true })}
                  sx={{ p: 0.25, color: 'primary.dark', flexShrink: 0 }}
                >
                  <Icon icon='mdi:close' fontSize={14} />
                </IconButton>
              </Box>
            ) : (
              <AsyncSpeciesAutocomplete
                value={repoint}
                onChange={v => {
                  setValue('repoint', v, { shouldDirty: true })
                  if (v) {
                    if (v.common_name) setValue('compliance_common_name', v.common_name, { shouldDirty: true })
                    if (v.scientific_name) setValue('compliance_scientific_name', v.scientific_name, { shouldDirty: true })
                  }
                }}
                excludeTaxonomyId={taxonomyId}
              />
            )}
          </Box>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ px: '20px', py: '18px', overflowY: 'auto', flex: 1 }}>
        {snapshotLoading && (
          <Stack alignItems='center' sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {snapshotError && (
          <Alert severity='info' sx={{ mb: 2 }}>
            Using row data — snapshot endpoint unavailable.
          </Alert>
        )}

        {/* Scope context banner */}
        {site_name && (
          <Box
            sx={{
              px: '12px',
              py: '10px',
              mb: '18px',
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'customColors.SurfaceVariant',
              borderRadius: 1,
              fontSize: 12,
              color: 'customColors.neutralSecondary',
              lineHeight: 1.6
            }}
          >
            Site: <Box component='b' sx={{ color: 'customColors.OnSurfaceVariant', fontWeight: 600 }}>{site_name}</Box>
          </Box>
        )}

        {/* Total (locked) banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            px: '14px',
            py: '10px',
            mb: '14px',
            bgcolor: 'customColors.OnBackground',
            border: 1,
            borderColor: 'customColors.Jade100',
            borderRadius: 1,
            color: 'primary.dark',
            fontSize: 13
          }}
        >
          <Icon icon='mdi:lock-outline' fontSize={16} />
          <Typography component='span' sx={{ fontSize: 13, fontWeight: 500 }}>
            Total (locked):
          </Typography>
          <Typography component='b' sx={{ fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 700 }}>
            {lockedTotal}
          </Typography>
        </Box>

        {/* Review banner */}
        {snapshot.needs_review && (
          <Alert
            severity='warning'
            icon={<Icon icon='mdi:flag' />}
            action={
              snapshot.review_flag_id ? (
                <Button
                  size='small'
                  onClick={() => flagClearMutation.mutate({ flag_id: snapshot.review_flag_id })}
                  disabled={flagClearMutation.isPending}
                >
                  Mark as cleared
                </Button>
              ) : null
            }
            sx={{ mb: 2 }}
          >
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              Marked for review
            </Typography>
          </Alert>
        )}

        {/* Save error */}
        {saveError && (
          <Alert severity='error' onClose={() => setSaveError('')} sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        {/* Compliance names section */}
        <Typography sx={SECTION_LABEL_SX}>Compliance names (per site)</Typography>

        <Box
          sx={{
            px: '12px',
            py: '10px',
            mb: '8px',
            border: 1,
            borderColor: commonChanged ? 'customColors.Jade100' : 'customColors.SurfaceVariant',
            borderRadius: 1,
            bgcolor: commonChanged ? 'customColors.OnBackground' : 'background.paper'
          }}
        >
          <Typography sx={FIELD_LABEL_SX} component='div'>Common</Typography>
          <Typography
            sx={{
              display: 'block',
              fontSize: 12.5,
              fontStyle: 'italic',
              color: 'customColors.neutralSecondary',
              textDecoration: commonChanged ? 'line-through' : 'none',
              mb: '6px'
            }}
          >
            {originalCommon || '—'}
          </Typography>
          <Controller
            name='compliance_common_name'
            control={control}
            rules={{ required: 'Required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                size='small'
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                inputProps={{ style: { fontSize: 13 } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontWeight: commonChanged ? 600 : 400,
                    color: commonChanged ? 'primary.dark' : 'customColors.OnSurfaceVariant',
                    '& fieldset': {
                      borderColor: commonChanged
                        ? 'primary.main'
                        : 'customColors.SurfaceVariant'
                    }
                  }
                }}
              />
            )}
          />
        </Box>

        <Box
          sx={{
            px: '12px',
            py: '10px',
            mb: '14px',
            border: 1,
            borderColor: sciChanged ? 'customColors.Jade100' : 'customColors.SurfaceVariant',
            borderRadius: 1,
            bgcolor: sciChanged ? 'customColors.OnBackground' : 'background.paper'
          }}
        >
          <Typography sx={FIELD_LABEL_SX} component='div'>Scientific</Typography>
          <Typography
            sx={{
              display: 'block',
              fontSize: 12.5,
              fontStyle: 'italic',
              color: 'customColors.neutralSecondary',
              textDecoration: sciChanged ? 'line-through' : 'none',
              mb: '6px'
            }}
          >
            {originalSci || '—'}
          </Typography>
          <Controller
            name='compliance_scientific_name'
            control={control}
            rules={{ required: 'Required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                size='small'
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                inputProps={{ style: { fontSize: 13 } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontWeight: sciChanged ? 600 : 400,
                    color: sciChanged ? 'primary.dark' : 'customColors.OnSurfaceVariant',
                    '& fieldset': {
                      borderColor: sciChanged
                        ? 'primary.main'
                        : 'customColors.SurfaceVariant'
                    }
                  }
                }}
              />
            )}
          />
        </Box>

        {/* Organization allocation */}
        <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mt: '14px', mb: '8px' }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mt: 0, mb: 0 }}>Organization allocation</Typography>
          <FormControlLabel
            control={
              <Switch
                size='small'
                checked={genderMode}
                onChange={e => setGenderMode(e.target.checked)}
              />
            }
            label={<Typography sx={{ fontSize: 11, fontWeight: 600, color: 'customColors.neutralSecondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gender breakdown</Typography>}
            labelPlacement='start'
            sx={{ m: 0, gap: 1 }}
          />
        </Stack>

        {/* Header row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 70px 24px 90px',
            alignItems: 'center',
            px: '12px',
            py: '6px',
            mb: '4px',
            fontSize: 10.5,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'customColors.neutralSecondary',
            fontWeight: 600
          }}
        >
          <span>Org</span>
          <Box sx={{ textAlign: 'right' }}>Original</Box>
          <Box sx={{ textAlign: 'center' }}>→</Box>
          <Box sx={{ textAlign: 'right' }}>New</Box>
        </Box>

        {/* Org rows */}
        <Stack spacing='6px' sx={{ mb: 0 }}>
          {orgs.map((org, i) => {
            const key = String(org.organization_id)
            const original = Number(snapshot.by_org?.[key] ?? 0)
            const current = Number(byOrg[key] ?? 0)
            const changed = current !== original
            const genderError = genderMode && genderSumErrors[key]
            return (
              <Box
                key={org.organization_id}
                sx={{
                  px: '12px',
                  py: '8px',
                  border: 1,
                  borderColor: genderError ? 'customColors.Tertiary' : changed ? 'customColors.Jade100' : 'customColors.SurfaceVariant',
                  borderRadius: 1,
                  bgcolor: changed ? 'customColors.OnBackground' : 'background.paper',
                  transition: 'background-color 150ms, border-color 150ms'
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 70px 24px 90px', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant', fontSize: 13 }}>
                    {shortCode(org)}
                  </Typography>
                  <Typography
                    sx={{
                      textAlign: 'right',
                      pr: '6px',
                      color: 'customColors.neutralSecondary',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 13,
                      textDecoration: changed ? 'line-through' : 'none'
                    }}
                  >
                    {original}
                  </Typography>
                  <Box sx={{ textAlign: 'center', color: changed ? 'primary.main' : 'customColors.neutralSecondary', fontSize: 13 }}>→</Box>
                  <Controller
                    name={`by_org.${org.organization_id}`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type='number'
                        inputProps={{ min: 0, step: 1, style: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, padding: '6px 10px', MozAppearance: 'textfield' } }}
                        onWheel={e => e.target.blur()}
                        onChange={e => field.onChange(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        value={field.value ?? 0}
                        sx={{
                          width: 90,
                          '& .MuiOutlinedInput-root': {
                            fontWeight: changed ? 700 : 400,
                            color: changed ? 'primary.dark' : 'customColors.OnSurfaceVariant',
                            '& fieldset': { borderColor: changed ? 'primary.main' : 'customColors.SurfaceVariant' }
                          },
                          '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 }
                        }}
                      />
                    )}
                  />
                </Box>

                {/* Gender inputs — shown only when gender mode is on */}
                {genderMode && (
                  <Box sx={{ mt: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {[
                      { name: `by_org_male.${org.organization_id}`, genderKey: 'male', bg: 'customColors.SecondaryContainer', color: 'customColors.OnSecondaryContainer' },
                      { name: `by_org_female.${org.organization_id}`, genderKey: 'female', bg: 'customColors.AntzTertiary', color: 'customColors.rusticRed' },
                      { name: `by_org_unknown.${org.organization_id}`, genderKey: 'unknown', bg: 'customColors.displaybgSecondary', color: 'customColors.neutralSecondary' }
                    ].map(({ name, genderKey, bg, color }) => (
                      <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type='number'
                            size='small'
                            inputProps={{ min: 0, step: 1, style: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, MozAppearance: 'textfield' } }}
                            onWheel={e => e.target.blur()}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                              field.onChange(val)
                              const m = genderKey === 'male' ? val : Number(byOrgMaleValues[i] || 0)
                              const f = genderKey === 'female' ? val : Number(byOrgFemaleValues[i] || 0)
                              const u = genderKey === 'unknown' ? val : Number(byOrgUnknownValues[i] || 0)
                              setValue(`by_org.${org.organization_id}`, m + f + u, { shouldDirty: true })
                            }}
                            value={field.value ?? 0}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: bg,
                                '& fieldset': { borderColor: genderError ? 'customColors.Tertiary' : 'transparent' },
                                '& input': { color }
                              },
                              '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 }
                            }}
                          />
                        )}
                      />
                    ))}
                  </Box>
                )}
                {genderError && (
                  <Typography sx={{ fontSize: 10.5, color: 'customColors.Tertiary', mt: '4px', textAlign: 'right' }}>
                    M + F + U must equal {current}
                  </Typography>
                )}
              </Box>
            )
          })}
        </Stack>

        {/* TOTAL row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 70px 24px 90px',
            alignItems: 'center',
            px: '12px',
            py: '10px',
            mt: '8px',
            mb: '14px',
            bgcolor: 'customColors.OnBackground',
            border: 1,
            borderColor: 'customColors.Jade100',
            borderRadius: 1,
            fontWeight: 700
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'primary.dark',
              fontWeight: 700
            }}
          >
            TOTAL
          </Typography>
          <Typography
            sx={{
              textAlign: 'right',
              pr: '6px',
              color: 'primary.dark',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 14,
              fontWeight: 700
            }}
          >
            {lockedTotal}
          </Typography>
          <Box sx={{ textAlign: 'center', color: 'primary.main' }}>→</Box>
          <Typography
            sx={{
              textAlign: 'right',
              pr: '14px',
              color: totalsValid ? 'primary.dark' : 'customColors.TertiaryDark',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 14,
              fontWeight: 700
            }}
          >
            {liveSum}
          </Typography>
        </Box>

        {/* Sum summary — matches prototype: 'Sum: X / Y' left, '✓ matches' or '+N off' right */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: '12px',
            py: '10px',
            mb: '14px',
            bgcolor: 'grey.50',
            border: 1,
            borderColor: 'customColors.SurfaceVariant',
            borderRadius: 1,
            fontSize: 13,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          <Typography variant='body2' sx={{ color: 'customColors.OnSurfaceVariant', fontSize: 13 }}>
            Sum: {liveSum} / {lockedTotal}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              fontWeight: 600,
              fontSize: 13,
              color: totalsValid ? 'primary.dark' : 'customColors.TertiaryDark'
            }}
          >
            {totalsValid
              ? '✓ matches'
              : `${liveSum > lockedTotal ? '+' : ''}${liveSum - lockedTotal} off`}
          </Typography>
        </Box>

        {/* Note */}
        <Controller
          name='note'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label='Note (optional)'
              placeholder='Why this change?'
              size='small'
              multiline
              minRows={3}
              maxRows={6}
              fullWidth
              inputProps={{ maxLength: NOTE_MAX }}
              helperText={`${(field.value || '').length}/${NOTE_MAX}`}
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Mark for review */}
        {!snapshot.needs_review && (
          <Box>
            {showFlagInput ? (
              <Stack direction='row' spacing={1} alignItems='flex-start'>
                <TextField
                  size='small'
                  placeholder='Why flag this?'
                  value={flagNote}
                  onChange={e => setFlagNote(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <Button
                  size='small'
                  variant='contained'
                  disabled={!flagNote.trim() || flagCreateMutation.isPending}
                  onClick={() =>
                    flagCreateMutation.mutate({
                      taxonomy_id: taxonomyId,
                      site_id: siteId,
                      note: flagNote
                    })
                  }
                >
                  Flag
                </Button>
                <Button size='small' variant='text' onClick={() => setShowFlagInput(false)}>
                  Cancel
                </Button>
              </Stack>
            ) : (
              <Button
                size='small'
                variant='text'
                startIcon={<Icon icon='mdi:flag-outline' />}
                onClick={() => setShowFlagInput(true)}
              >
                Mark for review
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Sticky footer */}
      <Stack
        direction='row'
        spacing={1.25}
        justifyContent='flex-end'
        sx={{
          px: '20px',
          py: '14px',
          borderTop: 1,
          borderColor: 'customColors.SurfaceVariant',
          bgcolor: 'background.paper',
          flexShrink: 0
        }}
      >
        <Button
          variant='outlined'
          onClick={handleCloseRequest}
          disabled={isSubmitting}
          sx={{ fontSize: 13, px: '16px', py: '8px' }}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          variant='contained'
          disabled={isSubmitting || !totalsValid || (genderMode && !genderValid)}
          startIcon={isSubmitting ? <CircularProgress size={14} color='inherit' /> : null}
          sx={{ fontSize: 13, fontWeight: 600, px: '16px', py: '8px' }}
        >
          Save changes
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirmDiscard}
        title='Discard unsaved changes?'
        content='You have unsaved changes. Discard them and close?'
        closeDialog={() => setConfirmDiscard(false)}
        action={() => {
          setConfirmDiscard(false)
          onClose()
        }}
      />
    </Box>
  )
}

export default ReallocateForm
