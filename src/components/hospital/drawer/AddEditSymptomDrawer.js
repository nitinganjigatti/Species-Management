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
  InputAdornment,
  alpha
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import ActivityList from 'src/views/pages/hospital/symptoms/ActivityList'
import SideSheetActionButtons from '../SideSheetActionButtons'
import { updateNotes } from 'src/lib/api/hospital/clinicalAssessment'
import { deleteNoteSymptoms } from 'src/lib/api/hospital/symptoms'
import Utility from 'src/utility'
import Toaster from 'src/components/Toaster'
import EditNotes from '../inpatient/EditNotes'

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
  setNoteId,
  noteId,
  status,
  setStatus,
  activityListData,
  activityLoader,
  temporarilySelected,
  setSymptomNoteModal,
  symptomNoteModal,
  fetchNotesForSymptom,
  setIsUpdating,
  isUpdating,
  setIsDeleting,
  isDeleting,
  setActivityListData,
  isChanged
}) => {
  const theme = useTheme()
  const { getSymptomsSeverityColor } = useHospitalColorUtils()

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

  const processedActivities =
    activityListData?.complaint_notes
      ?.map(activity => ({
        ...activity,
        isSystemGenerated: activity?.is_system_generated === 1,
        oldSeverity: activity?.notes_dump?.old_data?.severity || '',
        newSeverity: activity?.notes_dump?.new_data?.severity || '',
        createdBy: activity?.created_by_user_name || '',
        formattedTime: `${Utility.convertUTCToLocaltime(activity?.created_at)} • ${Utility.formatDisplayDate(
          activity?.created_at
        )}`,
        note: activity.note || 'N/A'
      }))

      .sort((a, b) => {
        return b.isSystemGenerated - a.isSystemGenerated
      }) || []

  const handleEditActivity = value => {
    setSymptomNoteModal(true)
    setNotes(value?.note)
    setNoteId(value?.note_id)
  }

  const handleCloseModal = () => {
    setSymptomNoteModal(false)
  }

  const handleUpdateNotes = async newNotes => {
    if (!notes?.trim()) {
      Toaster({ type: 'error', message: 'Please enter notes before updating.' })

      return
    }
    setIsUpdating(true)

    try {
      const payload = {
        main_id: temporarilySelected?.complaint_id,
        med_id: temporarilySelected?.medical_record_id,
        type: 'COMPLAINT',
        note: notes || '',
        note_id: noteId || ''
      }
      const response = await updateNotes(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Notes updated successfully.' })
        setNotes('')
        setSymptomNoteModal(false)

        const responseNotes = await fetchNotesForSymptom(temporarilySelected)
        if (responseNotes?.success === true) {
          setActivityListData(responseNotes?.data || [])
        }

        // onClose()
        //fetchNotesForSymptom()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to update notes.' })
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteNotes = async () => {
    if (!notes?.trim()) {
      Toaster({ type: 'error', message: 'Please enter notes to delete.' })

      return
    }
    setIsDeleting(true)

    try {
      const response = await deleteNoteSymptoms(noteId)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Notes deleted successfully.' })
        setNotes('')
        setSymptomNoteModal(false)
        const responseNotes = await fetchNotesForSymptom(temporarilySelected)
        if (responseNotes?.success === true) {
          setActivityListData(responseNotes?.data || [])
        }

        //onClose()
        //fetchNotesForSymptom()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete notes.' })
      }
    } catch (error) {
      console.error('Error deleting notes:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  {
    console.log(status, 'status')
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
        <Box
          sx={{
            px: 5,
            pt: 4,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{selectedSymptom?.name}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            pb: 2,
            borderBottom:
              processedActivities?.length > 0 ? `1px solid ${theme.palette.customColors.OutlineVariant}` : 'none',
            height: processedActivities?.length > 0 ? '-webkit-fill-available' : '80%'
          }}
        >
          <Box
            sx={{
              p: 5,
              background: status === 'closed' ? theme.palette.customColors.mdAntzNeutral : theme.palette.common.white,
              px: 5
            }}
          >
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
              <MenuItem value='closed'>Resolved</MenuItem>
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
              //value={notes}
              onChange={e => setNotes(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.common.white
                }
              }}
            />
          </Box>
          {processedActivities?.length > 0 ? (
            <>
              <Divider color={theme.palette.customColors.OutlineVariant} />
              <ActivityList
                activities={processedActivities}
                onEdit={handleEditActivity}
                activityLoader={activityLoader}
              />
            </>
          ) : (
            ''
          )}
        </Box>
        <SideSheetActionButtons
          addLabel='UPDATE'
          cancelLabel='CANCEL'
          onAdd={handleSave}
          onCancel={handleCancel}
          width={260}
          height={50}
          isDisabled={!isChanged}
        />
      </Box>

      <EditNotes
        open={symptomNoteModal}
        onClose={handleCloseModal}
        setNotes={setNotes}
        notes={notes}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        handleUpdate={handleUpdateNotes}
        handleDelete={handleDeleteNotes}
      />
    </Drawer>
  )
}

export default React.memo(AddEditSymptomDrawer)
