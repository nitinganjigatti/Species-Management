import { Box, Card, CardContent, Chip, Divider, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const toBool = val => val === '1' || val === true || val === 1

const DepartmentOverviewView = ({ department }) => {
  const theme = useTheme()

  const isActive = toBool(department?.active)
  const settings = department?.settings || {}
  const vendorEnabled = toBool(settings.enable_vendor_selection)
  const attachmentUrl = department?.attachment_url || department?.attachment || ''
  const fileNameUrl = department?.file_name || ''
  const isDefaultAsset = fileNameUrl.includes('assets/app/') || fileNameUrl.includes('antz_pdf_bg')
  const hasAttachment = attachmentUrl || (fileNameUrl && !isDefaultAsset)

  const InfoRow = ({ label, children }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        py: 2.5,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary, minWidth: 130 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right', flex: 1 }}>{children}</Box>
    </Box>
  )

  const SettingRow = ({ label, settingKey, indented = false }) => {
    const rawValue = settings[settingKey]
    const isMaxCost = settingKey === 'max_cost_for_auto_approval'
    const isOn = isMaxCost ? null : toBool(rawValue)

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: indented ? 2.5 : 0,
          ml: indented ? 2 : 0,
          borderLeft: indented ? `2px solid ${theme.palette.divider}` : 'none',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
          {label}
        </Typography>

        {isMaxCost ? (
          <Typography variant='body2' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {rawValue && rawValue !== '0' && rawValue !== '' ? `$ ${Number(rawValue).toLocaleString()}` : '—'}
          </Typography>
        ) : (
          <Chip
            size='small'
            label={isOn ? 'Enabled' : 'Disabled'}
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isOn ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant,
                  ml: 1
                }}
              />
            }
            sx={{
              fontWeight: 500,
              fontSize: '12px',
              backgroundColor: isOn ? theme.palette.customColors.Surface : theme.palette.action.disabledBackground,
              color: isOn ? theme.palette.primary.dark : theme.palette.customColors.neutralSecondary,
              '& .MuiChip-icon': { mr: 0.5 }
            }}
          />
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 5,
        flexDirection: { xs: 'column', md: 'row' }
      }}
    >
      {/* Left Card — Department Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Card
          sx={{
            height: '100%',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            borderRadius: '10px'
          }}
        >
          <CardContent sx={{ p: 5, '&:last-child': { pb: 5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Icon icon='mdi:office-building-outline' fontSize={22} color={theme.palette.primary.main} />
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Department Info
              </Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />

            <InfoRow label='Name'>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                {department?.name || '—'}
              </Typography>
            </InfoRow>

            <InfoRow label='Description'>
              <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                {department?.description || '—'}
              </Typography>
            </InfoRow>

            <InfoRow label='Created By'>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                {department?.created_by_name || '—'}
              </Typography>
            </InfoRow>

            <InfoRow label='Updated By'>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                {department?.updated_by_name || '—'}
              </Typography>
            </InfoRow>

            <InfoRow label='Status'>
              <Chip
                label={isActive ? 'Active' : 'Inactive'}
                size='small'
                sx={{
                  fontWeight: 500,
                  fontSize: '12px',
                  backgroundColor: isActive
                    ? theme.palette.customColors.Surface
                    : theme.palette.action.disabledBackground,
                  color: isActive ? theme.palette.primary.dark : theme.palette.customColors.neutralSecondary
                }}
              />
            </InfoRow>

            {hasAttachment && (
              <InfoRow label='Attachment'>
                <Box
                  component='img'
                  src={attachmentUrl || fileNameUrl}
                  alt='Department attachment'
                  sx={{
                    maxWidth: 180,
                    maxHeight: 120,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    objectFit: 'cover'
                  }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              </InfoRow>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Right Card — Settings */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Card
          sx={{
            height: '100%',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            borderRadius: '10px'
          }}
        >
          <CardContent sx={{ p: 5, '&:last-child': { pb: 5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Icon icon='mdi:cog-outline' fontSize={22} color={theme.palette.primary.main} />
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Settings
              </Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />

            <SettingRow label='Enable Costing' settingKey='enable_costing' />
            <SettingRow label='Costing Mandatory' settingKey='costing_mandatory' />
            <SettingRow label='Enable Approval' settingKey='enable_approval' />
            <SettingRow label='Max Auto-Approval' settingKey='max_cost_for_auto_approval' />
            <SettingRow label='Entity Selection Required' settingKey='entity_selection_mandatory' />
            <SettingRow label='Vendor Selection' settingKey='enable_vendor_selection' />

            {vendorEnabled && (
              <Box sx={{ mt: 0.5 }}>
                <SettingRow label='In Create Request' settingKey='enable_vendor_in_create_request' indented />
                <SettingRow label='By Department' settingKey='enable_vendor_by_department' indented />
                <SettingRow label='Mandatory' settingKey='vendor_selection_mandatory' indented />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default DepartmentOverviewView
