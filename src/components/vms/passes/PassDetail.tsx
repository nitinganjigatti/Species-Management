'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_CONFIG, GADGET_STANDARD_FIELDS } from 'src/constants/vms'
import type { VmsPassSite, VmsPassGadget } from 'src/types/vms'
import { usePassDetail, usePassQr, useCancelPass } from 'src/hooks/vms/useVmsPasses'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${time}`
}

const formatDateShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const parseCustomFields = (raw: string | Record<string, any> | null): Record<string, string> => {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, string>
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

const labelFromKey = (key: string): string =>
  key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

// ─── SectionTitle ─────────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography
    sx={{
      fontSize: '13px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'customColors.neutralSecondary',
      pb: '12px',
      mb: '16px',
      borderBottom: '1px solid',
      borderColor: 'customColors.OutlineVariant',
    }}
  >
    {children}
  </Typography>
)

// ─── InfoPair ─────────────────────────────────────────────────────────────────

const InfoPair = ({
  label,
  value,
  italic,
}: {
  label: string
  value: React.ReactNode
  italic?: boolean
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', lineHeight: 1.4 }}>
      {label}
    </Typography>
    <Typography
      variant='body2'
      sx={{
        color: italic ? 'customColors.neutralSecondary' : 'text.primary',
        fontStyle: italic ? 'italic' : 'normal',
        lineHeight: 1.5,
      }}
    >
      {value}
    </Typography>
  </Box>
)

// ─── StatusChip ──────────────────────────────────────────────────────────────

const StatusChip = ({ status }: { status: string }) => {
  const config = VMS_STATUS_CONFIG[status] || { label: status, color: '#616161', bgColor: '#F0F0F0' }

  return (
    <Chip
      size='small'
      label={config.label}
      icon={
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: config.color,
            ml: '10px !important',
            flexShrink: 0,
          }}
        />
      }
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 500,
        fontSize: '12px',
        height: 24,
        borderRadius: '100px',
        '& .MuiChip-label': { px: 1.5 },
        '& .MuiChip-icon': { mr: 0 },
      }}
    />
  )
}

// ─── GadgetRow ────────────────────────────────────────────────────────────────

const GadgetRow = ({ gadget }: { gadget: VmsPassGadget }) => {
  const customFields = parseCustomFields(gadget.custom_fields)

  const standardEntries: { label: string; value: string }[] = (
    Object.keys(GADGET_STANDARD_FIELDS) as Array<keyof typeof GADGET_STANDARD_FIELDS>
  )
    .filter(key => gadget[key as keyof VmsPassGadget])
    .map(key => ({
      label: GADGET_STANDARD_FIELDS[key],
      value: gadget[key as keyof VmsPassGadget] as string,
    }))

  const customEntries = Object.entries(customFields).map(([key, val]) => ({
    label: labelFromKey(key),
    value: String(val),
  }))

  const allEntries = [...standardEntries, ...customEntries]

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'customColors.OutlineVariant',
        borderRadius: '6px',
        overflow: 'hidden',
        mb: '12px',
      }}
    >
      {/* Gadget header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          px: '16px',
          py: '12px',
          backgroundColor: 'customColors.Surface',
          borderBottom: '1px solid',
          borderColor: 'customColors.OutlineVariant',
        }}
      >
        <Typography
          variant='body2'
          sx={{ fontWeight: 600, color: 'text.primary' }}
        >
          {gadget.gadget_name}
        </Typography>
        <Chip
          label={`×${gadget.quantity}`}
          size='small'
          sx={{
            backgroundColor: 'customColors.OnBackground',
            color: 'customColors.neutralSecondary',
            fontWeight: 500,
            fontSize: '12px',
            height: 22,
            borderRadius: '100px',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      </Box>

      {/* Field grid */}
      {allEntries.length > 0 && (
        <Grid container spacing={2} sx={{ p: '16px' }}>
          {allEntries.map(entry => (
            <Grid item xs={6} key={entry.label}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', lineHeight: 1.4 }}>
                  {entry.label}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                  {entry.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

// ─── PassDetail ──────────────────────────────────────────────────────────────

interface PassDetailProps {
  passId: string
}

const PassDetail = ({ passId }: PassDetailProps) => {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data: passResponse, isLoading } = usePassDetail(passId)
  const { data: qrResponse } = usePassQr(passId)
  const cancelMutation = useCancelPass()
  const pass = passResponse?.data
  const qrUrl = qrResponse?.data?.qr_code

  const handleCancelConfirm = () => {
    cancelMutation.mutate(passId, {
      onSuccess: () => {
        setCancelOpen(false)
        router.push('/vms/passes')
      }
    })
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!pass) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Typography variant='body1' sx={{ color: 'customColors.neutralSecondary' }}>
          Pass not found
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* ── Action bar ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Back */}
        <Button
          variant='text'
          startIcon={<Icon icon='mdi:arrow-left' fontSize={18} />}
          onClick={() => router.push('/vms/passes')}
          sx={{
            textTransform: 'none',
            color: 'customColors.neutralSecondary',
            fontWeight: 500,
            fontSize: '14px',
            px: '10px',
            py: '8px',
            '&:hover': {
              backgroundColor: 'customColors.Surface',
              color: 'text.primary',
            },
          }}
        >
          Back to Passes
        </Button>

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant='outlined'
            startIcon={<Icon icon='mdi:pencil-outline' fontSize={18} />}
            onClick={() => router.push(`/vms/passes/${passId}/edit`)}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'text.primary',
              borderColor: 'customColors.Outline',
              backgroundColor: 'customColors.OnBackground',
              px: '16px',
              py: '8px',
              '&:hover': {
                backgroundColor: 'customColors.Surface',
                borderColor: 'customColors.Tertiary',
              },
            }}
          >
            Edit
          </Button>
          <Button
            variant='outlined'
            startIcon={<Icon icon='mdi:close' fontSize={18} />}
            onClick={() => setCancelOpen(true)}
            disabled={pass.status === 'cancelled' || pass.status === 'expired'}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'error.main',
              borderColor: 'error.main',
              backgroundColor: 'customColors.OnBackground',
              px: '16px',
              py: '8px',
              '&:hover': {
                backgroundColor: 'error.light',
                borderColor: 'error.main',
              },
            }}
          >
            Cancel Pass
          </Button>
          <Button
            variant='text'
            startIcon={<Icon icon='mdi:share-variant-outline' fontSize={18} />}
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: 'customColors.neutralSecondary',
              px: '10px',
              py: '8px',
              '&:hover': {
                backgroundColor: 'customColors.Surface',
                color: 'text.primary',
              },
            }}
          >
            Share QR
          </Button>
        </Box>
      </Box>

      {/* ── Two-column: 60% left / 40% right ─────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          gap: '20px',
          mb: '20px',
        }}
      >
        {/* LEFT: Visitor Info Card */}
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[2],
            borderRadius: '10px',
          }}
        >
          {/* Section 1: Visitor Information */}
          <Box sx={{ px: '24px', py: '20px' }}>
            <SectionTitle>Visitor Information</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <InfoPair label='Name' value={pass.visitor_name} />
              </Grid>
              <Grid item xs={6}>
                <InfoPair label='Contact' value={pass.visitor_contact} />
              </Grid>
              <Grid item xs={6}>
                <InfoPair label='Department' value={pass.department} />
              </Grid>
              <Grid item xs={6}>
                <InfoPair label='Purpose' value={pass.purpose_of_visit} />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: 'divider' }} />

          {/* Section 2: Schedule */}
          <Box sx={{ px: '24px', py: '20px' }}>
            <SectionTitle>Schedule</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <InfoPair
                  label='Valid'
                  value={`${formatDate(pass.start_date)} — ${formatDate(pass.end_date)}`}
                />
              </Grid>
              <Grid item xs={6}>
                <InfoPair
                  label='Time In'
                  value={pass.time_in ? formatDateTime(pass.time_in) : '—'}
                  italic={!pass.time_in}
                />
              </Grid>
              <Grid item xs={6}>
                <InfoPair
                  label='Time Out'
                  value={pass.time_out ? formatDateTime(pass.time_out) : '—'}
                  italic={!pass.time_out}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: 'divider' }} />

          {/* Section 3: Created By */}
          <Box sx={{ px: '24px', py: '20px' }}>
            <SectionTitle>Created By</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <InfoPair label='Created by' value={pass.created_by_name ?? '—'} />
              </Grid>
              <Grid item xs={6}>
                <InfoPair
                  label='On behalf of'
                  value={pass.on_behalf_of_name ?? '—'}
                  italic={!pass.on_behalf_of_name}
                />
              </Grid>
              <Grid item xs={12}>
                <InfoPair label='Created at' value={formatDateTime(pass.created_at)} />
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* RIGHT: QR Code Card */}
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[2],
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              px: '24px',
              py: '32px',
            }}
          >
            {/* QR image */}
            <Box
              sx={{
                width: 180,
                height: 180,
                border: '1px solid',
                borderColor: 'customColors.OutlineVariant',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl ?? ''} alt='Pass QR Code' width={180} height={180} />
            </Box>

            {/* Pass ID monospace, truncated */}
            <Typography
              title={pass.pass_id}
              sx={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '12px',
                color: 'customColors.neutralSecondary',
                textAlign: 'center',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'default',
              }}
            >
              {pass.pass_id}
            </Typography>

            {/* Status chip */}
            <StatusChip status={pass.status} />

            {/* Created date */}
            <Typography
              variant='caption'
              sx={{ color: 'customColors.neutralSecondary', textAlign: 'center' }}
            >
              {formatDateShort(pass.created_at)}
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* ── Sites card (full width) ────────────────────────────────────────── */}
      {pass.sites && pass.sites.length > 0 && (
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[2],
            borderRadius: '10px',
            mb: '20px',
          }}
        >
          <Box sx={{ px: '24px', py: '20px' }}>
            <SectionTitle>Assigned Sites</SectionTitle>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {pass.sites.map((site: VmsPassSite) => (
                <Chip
                  key={site.site_id}
                  label={site.site_name}
                  icon={<Icon icon='mdi:map-marker-outline' fontSize={15} />}
                  sx={{
                    backgroundColor: 'customColors.Surface',
                    border: '1px solid',
                    borderColor: 'customColors.Outline',
                    color: 'text.primary',
                    fontWeight: 500,
                    fontSize: '13px',
                    borderRadius: '100px',
                    height: 32,
                    '& .MuiChip-icon': { color: 'customColors.Tertiary', ml: '12px' },
                    '& .MuiChip-label': { px: '12px' },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Card>
      )}

      {/* ── Gadgets card (full width) ──────────────────────────────────────── */}
      {pass.gadgets && pass.gadgets.length > 0 && (
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[2],
            borderRadius: '10px',
            mb: '20px',
          }}
        >
          <Box sx={{ px: '24px', py: '20px' }}>
            <SectionTitle>Gadgets &amp; Equipment</SectionTitle>
            {pass.gadgets.map((gadget: VmsPassGadget) => (
              <GadgetRow key={gadget.gadget_id} gadget={gadget} />
            ))}
          </Box>
        </Card>
      )}

      {/* ── Remarks card (full width) ──────────────────────────────────────── */}
      {(pass.remarks || pass.gadgets_text) && (
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: theme => theme.shadows[2],
            borderRadius: '10px',
            mb: '20px',
          }}
        >
          <Box sx={{ px: '24px', py: '20px' }}>
            <SectionTitle>Additional Notes</SectionTitle>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pass.gadgets_text && (
                <Box sx={{ display: 'flex', gap: '10px' }}>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      color: 'text.primary',
                      minWidth: '110px',
                      flexShrink: 0,
                    }}
                  >
                    Other gadgets:
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {pass.gadgets_text}
                  </Typography>
                </Box>
              )}
              {pass.remarks && (
                <Box sx={{ display: 'flex', gap: '10px' }}>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      color: 'text.primary',
                      minWidth: '110px',
                      flexShrink: 0,
                    }}
                  >
                    Remarks:
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {pass.remarks}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>
      )}

      {/* ── Cancel confirmation dialog ─────────────────────────────────────── */}
      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
              <Icon icon='mdi:alert-circle-outline' fontSize={22} />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: '16px', color: 'text.primary' }}>
              Cancel Pass
            </Typography>
          </Box>
          <IconButton size='small' onClick={() => setCancelOpen(false)}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Are you sure you want to cancel the pass for{' '}
            <Typography component='strong' sx={{ fontWeight: 600, color: 'text.primary' }}>
              {pass.visitor_name}
            </Typography>
            ? This action cannot be undone and the visitor will lose access.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant='outlined'
            onClick={() => setCancelOpen(false)}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              flex: 1,
              color: 'text.primary',
              borderColor: 'customColors.Outline',
              '&:hover': {
                backgroundColor: 'customColors.Surface',
                borderColor: 'customColors.Tertiary',
              },
            }}
          >
            Keep Pass
          </Button>
          <Button
            variant='contained'
            onClick={handleCancelConfirm}
            disabled={cancelMutation.isPending}
            startIcon={<Icon icon='mdi:close-circle-outline' />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              flex: 1,
              backgroundColor: 'error.main',
              '&:hover': { backgroundColor: 'error.dark' },
            }}
          >
            Cancel Pass
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PassDetail
