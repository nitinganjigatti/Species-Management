import React from 'react'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Drawer,
  Divider,
  InputAdornment,
  alpha
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import ActivityList from 'src/views/pages/hospital/symptoms/ActivityList'
import SideSheetActionButtons from '../SideSheetActionButtons'
import Utility from 'src/utility'
import dayjs from 'dayjs'

const AddEditSymptomDrawer = ({
  open,
  onClose,
  selectedSymptom,
  onSave,
  severity,
  setSeverity,
  durationValue,
  setDurationValue,
  durationUnit,
  setDurationUnit,
  notes,
  setNotes,
  status,
  setStatus,
  activityListData
}) => {
  const theme = useTheme()
  const { getSymptomsSeverityColor } = useHospitalColorUtils()
  const activities = [1, 2, 3]
  const handleSave = () => {
    onSave({
      status,
      severity,
      durationValue,
      durationUnit,
      notes
    })
  }

  const handleCancel = () => {
    onClose()
  }

  const formatDateTime = dateTime => {
    if (!dateTime) return ''
    return dayjs(dateTime).format('hh:mm A • DD MMM YYYY')
  }

  const processedActivities =
    activityListData?.complaint_notes
      ?.map(activity => ({
        ...activity,
        isSystemGenerated: activity?.is_system_generated === 1,
        oldSeverity: activity?.notes_dump?.old_data?.severity || '',
        newSeverity: activity?.notes_dump?.new_data?.severity || '',
        createdBy: activity?.created_by_user_name || 'Unknown',
        formattedTime: formatDateTime(activity?.created_at),
        note: activity.note || 'N/A'
      }))

      .sort((a, b) => {
        return b.isSystemGenerated - a.isSystemGenerated
      }) || []

  const handleEditActivity = value => {
    console.log(value, 'value')
    // alert('kkk')
  }

  return (
    <Drawer
      open={open}
      //onClose={onClose}
      anchor='right'
    >
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.common.white
        }}
      >
        <Box sx={{ px: 5, pt: 4, pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{selectedSymptom?.name}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ pt: 4, pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <Box sx={{ p: 5, background: theme.palette.common.white, px: 5 }}>
            <Typography
              sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontWeight: 500, fontSize: '16px' }}
            >
              {selectedSymptom?.medical_record_code || 'N/A'}
            </Typography>
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 3, fontWeight: 400, fontSize: '14px' }}
            >
              {selectedSymptom?.created_by_user_name || selectedSymptom?.additional_info?.resolved_user_name}{' '}
              <span style={{ margin: '0 8px', color: theme.palette.customColors.neutralSecondary }}>•</span>
              {Utility.convertUTCToLocaltime(selectedSymptom?.created_at)}
              <span style={{ margin: '0 8px', color: theme.palette.customColors.neutralSecondary }}>•</span>
              {Utility?.formatDisplayDate(selectedSymptom?.created_at)}
            </Typography>

            <Typography
              sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
            >
              Status
            </Typography>
            <Select
              value={status}
              onChange={e => setStatus(e.target.value)}
              fullWidth
              sx={{
                background: theme.palette.common.white,
                color: theme.palette.common.black,
                mb: 0,
                borderRadius: '4px',
                '& .MuiSelect-select': { py: 4.0 }
              }}
            >
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='closed'>Inactive</MenuItem>
            </Select>

            <Box sx={{ display: 'flex', gap: 2, mt: 6 }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors.deepDark,
                    mb: 1.7
                  }}
                >
                  Severity
                </Typography>

                <Select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  sx={{
                    backgroundColor: getSymptomsSeverityColor(severity).bgColor,

                    fontWeight: 500,
                    height: 56,
                    borderRadius: '4px',
                    width: '260px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: getSymptomsSeverityColor(severity).color
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: getSymptomsSeverityColor(severity).color
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: getSymptomsSeverityColor(severity).color
                    }
                  }}
                >
                  <MenuItem value='Low'>Low</MenuItem>
                  <MenuItem value='Medium'>Medium</MenuItem>
                  <MenuItem value='High'>High</MenuItem>
                  <MenuItem value='Extreme'>Extreme</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors.deepDark,
                    mb: 1.7
                  }}
                >
                  Duration
                </Typography>
                <TextField
                  type='number'
                  value={durationValue}
                  onChange={e => {
                    const val = e.target.value
                    if (val === '' || Number(val) >= 1) {
                      setDurationValue(val)
                    }
                  }}
                  sx={{ width: 260 }}
                  slotProps={{
                    input: {
                      sx: { height: 56, borderRadius: '4px' },
                      endAdornment: (
                        <InputAdornment position='end' sx={{ p: 0, m: 0 }}>
                          <Select
                            value={durationUnit}
                            onChange={e => setDurationUnit(e.target.value)}
                            variant='standard'
                            disableUnderline
                            sx={{
                              fontSize: 14,
                              ml: 1,
                              textAlign: 'right',

                              '& .MuiSelect-select': {
                                paddingRight: '24px'
                              }
                            }}
                          >
                            <MenuItem value='Days'>Days</MenuItem>
                            <MenuItem value='Weeks'>Weeks</MenuItem>
                            <MenuItem value='Months'>Months</MenuItem>
                          </Select>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Box>
            </Box>

            <Typography
              sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
            >
              Notes
            </Typography>
            <TextField
              placeholder='Add notes'
              fullWidth
              multiline
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              sx={{
                background: theme.palette.common.white,
                mb: 3
              }}
            />
          </Box>
          <Divider color={theme.palette.customColors.OutlineVariant} />

          <ActivityList activities={processedActivities} onEdit={handleEditActivity} />
        </Box>

        <SideSheetActionButtons
          addLabel='UPDATE'
          cancelLabel='CANCEL'
          onAdd={handleSave}
          onCancel={handleCancel}
          width={260}
          height={50}
        />
      </Box>
    </Drawer>
  )
}

export default React.memo(AddEditSymptomDrawer)
