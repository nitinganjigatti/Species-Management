import React from 'react'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Drawer,
  Divider,
  FormControlLabel
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import ActivityList from 'src/views/pages/hospital/symptoms/ActivityList'
import SideSheetActionButtons from '../SideSheetActionButtons'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import { useRouter } from 'next/router'
import Utility from 'src/utility'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import EditNotes from '../inpatient/EditNotes'

const EditClinicalAsmntDrawer = ({
  open,
  onClose,
  selectedSymptom,
  onSave,
  clinicalAsmnt,
  setClinicalAsmnt,
  setPrognosisValue,
  prognosisVal,
  setChronicVal,
  chronicVal,
  notes,
  setNotes,
  status,
  setStatus,
  isSubmitLoading,
  activityLoader,
  activityListData,
  isDeleting,
  isUpdating,
  handleUpdateNotes,
  handleDeleteNotes,
  handleEditNoteClick,
  isNotesOpen,
  setIsNotesOpen
}) => {
  const theme = useTheme()
  const { getSeverityColor } = useHospitalColorUtils()
  const activities = [1, 2, 3]
  const router = useRouter()
  const { medical_record_id } = router.query

  const isResolved = status === 'Closed' || status === 'Inactive'

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  const handleSave = () => {
    onSave({
      status,
      clinicalAsmnt,
      prognosisVal,
      chronicVal,
      notes
    })
  }

  const handleCancel = () => {
    onClose()
  }

  const processedActivities =
    activityListData?.diagnosis_notes?.map(activity => ({
      ...activity,
      isSystemGenerated: activity?.is_system_generated === 1,
      oldSeverity: activity?.notes_dump?.old_data?.severity || '',
      newSeverity: activity?.notes_dump?.new_data?.severity || '',
      oldPrognosis: activity?.notes_dump?.old_data?.prognosis || '',
      newPrognosis: activity?.notes_dump?.new_data?.prognosis || '',
      createdBy: activity?.created_by_user_name || '',
      formattedTime: `${Utility.convertUtcToLocalReadableDate(
        activity?.modified_at || activity.created_at
      )} • ${Utility.convertUTCToLocaltime(activity?.modified_at || activity?.created_at)}`,
      note: activity.note || '',
      clinicalAssessment: activity.clinical_assessment === 'diagnosis' ? 'Diagnosis' : 'Tentative',
      oldRecord: activity?.notes_dump?.old_data?.clinical_assessment,
      newRecord: activity?.notes_dump?.new_data?.clinical_assessment,
      oldIsChronical: activity?.notes_dump?.old_data?.is_cronical,
      newIsChronical: activity?.notes_dump?.new_data?.is_cronical,
      isFromAssessment: true
    })) ||
    // .sort((a, b) => {
    //   return b.isSystemGenerated - a.isSystemGenerated
    // })

    []

  const handleEditActivity = item => {
    setIsNotesOpen(true)
    handleEditNoteClick(item)
  }

  const renderStatusIcon = statusValue => {
    const isActive = statusValue === 'Active'

    return (
      <Box
        sx={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: isActive ? theme.palette.primary.main : theme.palette.customColors.neutral_50,
          marginRight: 1
        }}
      />
    )
  }

  return (
    <Drawer open={open} anchor='right'>
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

        <Box sx={{ pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <Box
            sx={{
              p: 5,
              background: isResolved ? theme.palette.customColors.neutral05 : theme.palette.common.white,
              px: 5
            }}
          >
            <MedicalIdChip
              leftImage
              medId={medical_record_id ? `MID-${medical_record_id}` : ''}
              textColor={theme.palette.customColors.OnPrimaryContainer}
            />
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 3, fontWeight: 400, fontSize: '14px' }}
            >
              {selectedSymptom?.created_by_user_name} • {Utility.formatDisplayDate(selectedSymptom?.created_at)}
            </Typography>

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
                    width: 260,
                    '& .MuiSelect-select': {
                      py: 4.0,
                      display: 'flex',
                      alignItems: 'center'
                    }
                  }}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusIcon(selected)}
                      <Typography>{selected === 'Active' ? 'Active' : 'Resolved'}</Typography>
                    </Box>
                  )}
                >
                  <MenuItem value='Active'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusIcon('Active')}
                      <Typography>Active</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value='Inactive'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusIcon('Inactive')}
                      <Typography>Resolved</Typography>
                    </Box>
                  </MenuItem>
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
                  Clinical Assessment
                </Typography>

                <Select
                  value={clinicalAsmnt}
                  onChange={e => setClinicalAsmnt(e.target.value)}
                  fullWidth
                  disabled={isResolved}
                  sx={{
                    background: theme.palette.common.white,
                    color: theme.palette.common.black,
                    mb: 0,
                    borderRadius: '4px',
                    width: 260,
                    '& .MuiSelect-select': { py: 4.0 }
                  }}
                >
                  <MenuItem value='diagnosis'>Diagnosis</MenuItem>
                  <MenuItem value='tentative'>Tentative</MenuItem>
                </Select>
              </Box>
            </Box>

            {clinicalAsmnt === 'diagnosis' && (
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
                    Is it Chronic?
                  </Typography>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='flex-start'
                    sx={{
                      border: '1px solid #C3CEC7',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      backgroundColor: '#fff',
                      width: 260,
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography sx={{ marginRight: 2 }}>{chronicVal}</Typography>
                    <FormControlLabel
                      control={
                        <MUISwitch
                          checked={chronicVal === 'Yes'}
                          onChange={e => setChronicVal(e.target.checked ? 'Yes' : 'No')}
                          size='medium'
                          disabled={isResolved}
                        />
                      }
                      label=''
                      sx={{ ml: 0.25 }}
                    />
                  </Box>
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
                    Prognosis
                  </Typography>

                  <Select
                    value={prognosisVal}
                    onChange={e => setPrognosisValue(e.target.value)}
                    disabled={isResolved}
                    sx={{
                      backgroundColor: getSeverityColor(prognosisVal).bgColor,

                      fontWeight: 500,
                      height: 56,
                      borderRadius: '4px',
                      width: '260px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: isResolved ? theme.palette.grey[400] : getSeverityColor(prognosisVal).color
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: isResolved ? theme.palette.grey[400] : getSeverityColor(prognosisVal).color
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: isResolved ? theme.palette.grey[400] : getSeverityColor(prognosisVal).color
                      }
                    }}
                  >
                    <MenuItem value='Favourable'>Favourable</MenuItem>
                    <MenuItem value='Guarded'>Guarded</MenuItem>
                    <MenuItem value='Doubtful'>Doubtful</MenuItem>
                    <MenuItem value='Poor'>Poor</MenuItem>
                    <MenuItem value='Grave'>Grave</MenuItem>
                  </Select>
                </Box>
              </Box>
            )}

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
              disabled={isResolved}
              sx={{
                ...commonFieldStyles,
                background: theme.palette.common.white,
                mb: 3
              }}
            />
          </Box>
          <Divider color={theme.palette.customColors.OutlineVariant} />
          <Box sx={{ mb: '80px' }}>
            <ActivityList
              activities={processedActivities}
              onEdit={handleEditActivity}
              activityLoader={activityLoader}
              isFromAssessment
            />
          </Box>
        </Box>

        <Box sx={{ position: 'fixed', bottom: 0 }}>
          <SideSheetActionButtons
            isSubmitLoading={isSubmitLoading}
            addLabel='UPDATE'
            cancelLabel='CANCEL'
            onAdd={handleSave}
            onCancel={handleCancel}
            width={260}
            height={50}
          />
        </Box>
      </Box>
      <EditNotes
        open={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        setNotes={setNotes}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        handleUpdate={handleUpdateNotes}
        handleDelete={handleDeleteNotes}
      />
    </Drawer>
  )
}

export default React.memo(EditClinicalAsmntDrawer)
