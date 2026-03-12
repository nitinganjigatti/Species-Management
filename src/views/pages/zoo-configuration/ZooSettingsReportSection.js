import { useState } from 'react'
import {
  Box, Card, CardContent, Chip, Collapse, Avatar,
  Typography
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import MultiUserDrawer from './MultiUserDrawer'

// Report types are fetched from GET /zoo/report-types API and passed as props

const RecipientField = ({ label, users, onEdit }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
      <Typography
        variant='caption'
        sx={{
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
          color: 'text.disabled', minWidth: 26, pt: '10px'
        }}
      >
        {label}
      </Typography>
      <Box
        onClick={onEdit}
        sx={{
          flex: 1, minHeight: 40,
          border: '1px solid', borderColor: 'customColors.OutlineVariant',
          borderRadius: '8px', px: 2, py: '6px',
          display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center',
          cursor: 'pointer', bgcolor: 'background.paper',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(55,189,105,0.10)'
          }
        }}
      >
        {users.length === 0 ? (
          <Typography variant='caption' sx={{ color: 'text.disabled' }}>
            Click to add users...
          </Typography>
        ) : (
          users.map(u => (
            <Chip
              key={u.user_id}
              size='small'
              label={u.user_name}
              avatar={
                <Avatar
                  alt={u.user_name}
                  src={u.user_profile_pic || '/default-avatar.png'}
                  sx={{ width: 20, height: 20 }}
                />
              }
              sx={{
                bgcolor: '#F2FFF8', color: 'customColors.OnSurfaceVariant',
                border: '1px solid #DAE7DF', fontWeight: 500, fontSize: '12px',
                '& .MuiChip-avatar': { width: 20, height: 20 }
              }}
            />
          ))
        )}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
          <Icon icon='mdi:pencil-outline' fontSize={14} />
        </Box>
      </Box>
    </Box>
  )
}

const ReportCard = ({ report, recipients, onUpdateRecipients }) => {
  const [expanded, setExpanded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeField, setActiveField] = useState(null) // 'to' | 'cc'

  const openDrawer = field => {
    setActiveField(field)
    setDrawerOpen(true)
  }

  const handleConfirm = users => {
    onUpdateRecipients(report.key, activeField, users)
  }

  const currentSelected = activeField ? recipients[activeField] : []

  return (
    <>
      <Card
        sx={{
          border: '1px solid', borderColor: 'customColors.SurfaceVariant',
          borderRadius: '10px', boxShadow: 'none',
          transition: 'box-shadow 0.2s, transform 0.2s',
          '&:hover': { boxShadow: theme => theme.shadows[3], transform: 'translateY(-1px)' }
        }}
      >
        {/* Header */}
        <Box
          onClick={() => setExpanded(p => !p)}
          sx={{
            px: 5, py: 3.5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', bgcolor: 'customColors.SurfaceVariant',
            borderBottom: expanded ? '1px solid' : 'none',
            borderColor: 'customColors.OutlineVariant',
            transition: 'background 0.15s',
            '&:hover': { bgcolor: '#F2FFF8' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: report.color, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
                {report.label}
              </Typography>
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                {report.description}
              </Typography>
            </Box>
          </Box>
          <Icon
            icon='mdi:chevron-down'
            style={{ transition: 'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#839D8D' }}
          />
        </Box>

        {/* Body */}
        <Collapse in={expanded}>
          <CardContent sx={{ px: 5, pt: 4, pb: '16px !important' }}>
            <RecipientField
              label='To'
              users={recipients.to}
              onEdit={() => openDrawer('to')}
            />
            <RecipientField
              label='CC'
              users={recipients.cc}
              onEdit={() => openDrawer('cc')}
            />
          </CardContent>
        </Collapse>
      </Card>

      <MultiUserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onConfirm={handleConfirm}
        selectedUsers={currentSelected}
        headerText={`Select ${activeField === 'to' ? 'To' : 'CC'} — ${report.label}`}
        placeholder='Search by name'
        queryKey={`zoo-settings-${report.key}-${activeField}`}
        confirmText='Confirm'
      />
    </>
  )
}

const ZooSettingsReportSection = ({ reportTypes = [], reportRecipients, onUpdateRecipients, onSave }) => {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try { await onSave() } finally { setSaving(false) }
  }

  return (
    <Card sx={{ boxShadow: theme => theme.shadows[2], borderRadius: '10px' }}>
      <Box
        sx={{
          px: 6, py: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'customColors.SurfaceVariant'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '8px',
            bgcolor: '#E0F7F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#00AEA4'
          }}>
            <Icon icon='mdi:email-outline' fontSize={18} />
          </Box>
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
              Report Distribution
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Configure To &amp; CC recipients for each scheduled email report
            </Typography>
          </Box>
        </Box>
        <LoadingButton
          loading={saving}
          onClick={handleSave}
          variant='contained'
          size='small'
          startIcon={<Icon icon='mdi:content-save-outline' />}
          sx={{ height: 36, borderRadius: '8px', px: 4 }}
        >
          Save
        </LoadingButton>
      </Box>

      <CardContent sx={{ px: 6, py: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {reportTypes.map(report => (
          <ReportCard
            key={report.key}
            report={report}
            recipients={reportRecipients[report.key] || { to: [], cc: [] }}
            onUpdateRecipients={onUpdateRecipients}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export default ZooSettingsReportSection
