import { useState } from 'react'
import {
  Avatar, Box, Card, CardContent, Chip, Collapse, Switch, Typography
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import MultiUserDrawer from 'src/components/zoo-configuration/MultiUserDrawer'
import { getFieldRenderer } from './fieldRenderers'

const WarningBanner = ({ message }) => (
  <Box
    sx={{
      display: 'flex', alignItems: 'center', gap: 1,
      px: 2, py: 1.5,
      bgcolor: 'customColors.BgTeritary', border: '1px solid', borderColor: 'customColors.Tertiary',
      borderRadius: '8px'
    }}
  >
    <Icon icon='mdi:alert-outline' fontSize={16} style={{ flexShrink: 0 }} />
    <Typography variant='caption' sx={{ color: 'customColors.OnSurfaceVariant', fontWeight: 500 }}>
      {message}
    </Typography>
  </Box>
)

const RecipientField = ({ label, users, onEdit, onRemove }) => (
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
          boxShadow: theme => `0 0 0 3px ${theme.palette.primary.main}1A`
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
            onDelete={e => { e.stopPropagation(); onRemove(u.user_id) }}
            avatar={
              <Avatar
                alt={u.user_name}
                src={u.user_profile_pic || '/default-avatar.png'}
                sx={{ width: 20, height: 20 }}
              />
            }
            sx={{
              bgcolor: 'customColors.Surface', color: 'customColors.OnSurfaceVariant',
              border: '1px solid', borderColor: 'customColors.SurfaceVariant', fontWeight: 500, fontSize: '12px',
              '& .MuiChip-avatar': { width: 20, height: 20 },
              '& .MuiChip-deleteIcon': { color: 'customColors.Outline', fontSize: 16, '&:hover': { color: 'customColors.Tertiary' } }
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

const ReportEmailCard = ({ report, data, fields, timezone, onChange }) => {
  const [expanded, setExpanded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeField, setActiveField] = useState(null) // 'to' | 'cc'

  const enabled = data.enabled || false
  const toUsers = Array.isArray(data.to) ? data.to : []
  const ccUsers = Array.isArray(data.cc) ? data.cc : []
  const hasRecipients = toUsers.length > 0

  const handleFieldChange = (fieldKey, value) => {
    const updated = { ...data, [fieldKey]: value }

    // Clear days when switching to daily
    if (fieldKey === 'frequency' && value === 'daily') {
      updated.days = []
    }

    onChange(report.key, updated)
  }

  const handleToggle = () => {
    handleFieldChange('enabled', !enabled)
  }

  const openDrawer = field => {
    setActiveField(field)
    setDrawerOpen(true)
  }

  const handleConfirmUsers = users => {
    handleFieldChange(activeField, users)
  }

  const handleRemoveUser = (field, userId) => {
    const current = Array.isArray(data[field]) ? data[field] : []
    handleFieldChange(field, current.filter(u => String(u.user_id) !== String(userId)))
  }

  const currentSelected = activeField ? (Array.isArray(data[activeField]) ? data[activeField] : []) : []

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
            '&:hover': { bgcolor: 'customColors.Surface' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: report.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
              {report.label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Switch
              checked={enabled}
              onChange={e => { e.stopPropagation(); handleToggle() }}
              onClick={e => e.stopPropagation()}
              size='small'
            />
            <Icon
              icon='mdi:chevron-down'
              style={{ transition: 'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </Box>
        </Box>

        {/* Body */}
        <Collapse in={expanded}>
        <CardContent
          sx={{
            px: 5, pt: 3, pb: '16px !important',
            display: 'flex', flexDirection: 'column', gap: 2.5,
            opacity: enabled ? 1 : 0.45,
            pointerEvents: enabled ? 'auto' : 'none',
            transition: 'opacity 0.25s'
          }}
        >
          {/* Warnings */}
          {enabled && !hasRecipients && (
            <WarningBanner message='No recipients configured for this report. Add users in the To field below.' />
          )}
          {enabled && !timezone && (
            <WarningBanner message='No timezone configured. Reports will use UTC.' />
          )}

          {/* Recipients: To & CC */}
          <RecipientField
            label='To'
            users={toUsers}
            onEdit={() => openDrawer('to')}
            onRemove={userId => handleRemoveUser('to', userId)}
          />
          <RecipientField
            label='CC'
            users={ccUsers}
            onEdit={() => openDrawer('cc')}
            onRemove={userId => handleRemoveUser('cc', userId)}
          />

          {/* Dynamic schedule fields from schema */}
          {fields.map(field => {
            // Skip toggle (header), to, cc (above)
            if (field.key === 'enabled' || field.key === 'to' || field.key === 'cc') return null

            // Handle visible_when conditional
            if (field.visible_when) {
              const conditionMet = Object.entries(field.visible_when).every(
                ([depKey, depVal]) => data[depKey] === depVal
              )
              if (!conditionMet) return null
            }

            const Renderer = getFieldRenderer(field.type)
            const value = data[field.key] ?? field.default ?? null

            return (
              <Box key={field.key}>
                <Renderer
                  field={field}
                  value={value}
                  onChange={val => handleFieldChange(field.key, val)}
                />
              </Box>
            )
          })}

        </CardContent>
        </Collapse>
      </Card>

      <MultiUserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onConfirm={handleConfirmUsers}
        selectedUsers={currentSelected}
        headerText={`Select ${activeField === 'to' ? 'To' : 'CC'} — ${report.label}`}
        placeholder='Search by name'
        queryKey={`zoo-report-email-${report.key}-${activeField}`}
        confirmText='Confirm'
      />
    </>
  )
}

const ZooSettingsReportEmailSection = ({
  section,
  reportTypes = [],
  reportEmailValues,
  timezone,
  onChange,
  onSave
}) => {
  const [saving, setSaving] = useState(false)
  const fields = section.fields || []

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
          {section.icon && (
            <Box sx={{
              width: 34, height: 34, borderRadius: '8px',
              bgcolor: 'customColors.OnBackground',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'primary.main'
            }}>
              <Icon icon={section.icon} fontSize={18} />
            </Box>
          )}
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
              {section.label}
            </Typography>
            {section.description && (
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                {section.description}
              </Typography>
            )}
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
        {reportTypes.map(report => {
          const reportData = reportEmailValues[report.key] || {
            enabled: false,
            to: [],
            cc: [],
            frequency: 'daily',
            days: [],
            send_times: [report.default_send_time || '08:00']
          }

          return (
            <ReportEmailCard
              key={report.key}
              report={report}
              data={reportData}
              fields={fields}
              timezone={timezone}
              onChange={onChange}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

export default ZooSettingsReportEmailSection
