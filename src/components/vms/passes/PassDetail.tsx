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
import IconButton from '@mui/material/IconButton'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import { useTheme } from '@mui/material/styles'
import { Grid } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_CONFIG, GADGET_STANDARD_FIELDS } from 'src/constants/vms'
import type { VmsPassSite, VmsPassGadget } from 'src/types/vms'
import { usePassDetail, usePassQr, useCancelPass } from 'src/hooks/vms/useVmsPasses'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Utility from 'src/utility'

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

// ─── InfoPair ─────────────────────────────────────────────────────────────────

const InfoPair = ({
  label,
  value,
  italic,
  theme,
}: {
  label: string
  value: React.ReactNode
  italic?: boolean
  theme: any
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary, lineHeight: 1.4 }}>
      {label}
    </Typography>
    <Typography
      variant='body2'
      sx={{
        color: italic ? theme.palette.customColors.neutralSecondary : theme.palette.customColors.OnSurfaceVariant,
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
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 500,
        fontSize: '12px',
      }}
    />
  )
}

// ─── GadgetRow ────────────────────────────────────────────────────────────────

const GadgetRow = ({ gadget, theme }: { gadget: VmsPassGadget; theme: any }) => {
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
        borderColor: theme.palette.customColors.SurfaceVariant,
        borderRadius: '10px',
        overflow: 'hidden',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          bgcolor: theme.palette.customColors.tableHeaderBg,
        }}
      >
        <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
          {gadget.gadget_name}
        </Typography>
        <Chip
          label={`×${gadget.quantity}`}
          size='small'
          sx={{
            bgcolor: theme.palette.customColors.OnBackground,
            color: theme.palette.customColors.neutralSecondary,
            fontWeight: 500,
            fontSize: '12px',
            height: 22,
          }}
        />
      </Box>

      {allEntries.length > 0 && (
        <Grid container spacing={3} sx={{ p: 3 }}>
          {allEntries.map(entry => (
            <Grid size={{ xs: 12, sm: 6 }} key={entry.label}>
              <InfoPair label={entry.label} value={entry.value} theme={theme} />
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
  const theme = useTheme()
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
      },
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
        <Typography variant='body1' sx={{ color: theme.palette.customColors.neutralSecondary }}>
          Pass not found
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={4}>
        {/* LEFT: Main details card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <PageCardLayout
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {pass.visitor_name}
                <StatusChip status={pass.status} />
              </Box>
            }
            showIcon
            onIconClick={() => router.push('/vms/passes')}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant='outlined'
                  startIcon={<Icon icon='mdi:pencil-outline' fontSize={18} />}
                  onClick={() => router.push(`/vms/passes/${passId}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant='outlined'
                  color='error'
                  startIcon={<Icon icon='mdi:close' fontSize={18} />}
                  onClick={() => setCancelOpen(true)}
                  disabled={pass.status === 'cancelled' || pass.status === 'expired'}
                >
                  Cancel Pass
                </Button>
              </Box>
            }
          >
            {/* Visitor Information */}
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3 }}>
              Visitor Information
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Name' value={pass.visitor_name} theme={theme} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Contact' value={pass.visitor_contact} theme={theme} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Department' value={pass.department} theme={theme} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Purpose' value={pass.purpose_of_visit} theme={theme} />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 4, borderColor: theme.palette.customColors.OutlineVariant }} />

            {/* Schedule */}
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3 }}>
              Schedule
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12 }}>
                <InfoPair label='Valid' value={`${formatDate(pass.start_date)} — ${formatDate(pass.end_date)}`} theme={theme} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Time In' value={pass.time_in ? formatDateTime(pass.time_in) : '—'} italic={!pass.time_in} theme={theme} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Time Out' value={pass.time_out ? formatDateTime(pass.time_out) : '—'} italic={!pass.time_out} theme={theme} />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 4, borderColor: theme.palette.customColors.OutlineVariant }} />

            {/* Created By */}
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3 }}>
              Created By
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Created by' value={pass.created_by_name ?? '—'} theme={theme} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='On behalf of' value={pass.on_behalf_of_name ?? '—'} italic={!pass.on_behalf_of_name} theme={theme} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <InfoPair label='Created at' value={formatDateTime(pass.created_at)} theme={theme} />
              </Grid>
            </Grid>
          </PageCardLayout>
        </Grid>

        {/* RIGHT: QR Code card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: '10px', overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2.5,
                px: 4,
                py: 5,
              }}
            >
              {/* Pass ID */}
              <Typography
                variant='body2'
                sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, textAlign: 'center' }}
              >
                {pass.pass_id}
              </Typography>

              {/* QR Code */}
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  border: '1px solid',
                  borderColor: theme.palette.customColors.OutlineVariant,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  p: 2,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {qrUrl && <img src={qrUrl} alt='Pass QR Code' width='100%' height='100%' style={{ display: 'block' }} />}
              </Box>

              {/* Status */}
              <StatusChip status={pass.status} />

              {/* Date */}
              <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                {Utility.formatDisplayDate(pass.created_at)}
              </Typography>

              {/* Share button */}
              <Button
                variant='outlined'
                startIcon={<Icon icon='mdi:share-variant-outline' fontSize={18} />}
                sx={{ textTransform: 'none', mt: 1 }}
              >
                Share
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Sites ──────────────────────────────────────────────────────── */}
      {pass.sites && pass.sites.length > 0 && (
        <PageCardLayout title='Assigned Sites' cardStyles={{ mt: 4 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {pass.sites.map((site: VmsPassSite) => (
              <Chip
                key={site.site_id}
                label={site.site_name}
                icon={<Icon icon='mdi:map-marker-outline' fontSize={15} />}
                sx={{
                  bgcolor: theme.palette.customColors.Surface,
                  border: '1px solid',
                  borderColor: theme.palette.customColors.OutlineVariant,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              />
            ))}
          </Box>
        </PageCardLayout>
      )}

      {/* ── Gadgets ────────────────────────────────────────────────────── */}
      {pass.gadgets && pass.gadgets.length > 0 && (
        <PageCardLayout title='Gadgets &amp; Equipment' cardStyles={{ mt: 4 }}>
          {pass.gadgets.map((gadget: VmsPassGadget) => (
            <GadgetRow key={gadget.gadget_id} gadget={gadget} theme={theme} />
          ))}
        </PageCardLayout>
      )}

      {/* ── Additional Notes ────────────────────────────────────────────── */}
      {(pass.remarks || pass.gadgets_text) && (
        <PageCardLayout title='Additional Notes' cardStyles={{ mt: 4 }}>
          <Grid container spacing={3}>
            {pass.gadgets_text && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Other Gadgets' value={pass.gadgets_text} theme={theme} />
              </Grid>
            )}
            {pass.remarks && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoPair label='Remarks' value={pass.remarks} theme={theme} />
              </Grid>
            )}
          </Grid>
        </PageCardLayout>
      )}

      {/* ── Cancel confirmation dialog ─────────────────────────────────────── */}
      <DialogConfirmationDialog
        open={cancelOpen}
        handleClose={() => setCancelOpen(false)}
        message={`Are you sure you want to cancel the pass for ${pass.visitor_name}?`}
        action={handleCancelConfirm}
        loading={cancelMutation.isPending}
      />
    </Box>
  )
}

export default PassDetail
