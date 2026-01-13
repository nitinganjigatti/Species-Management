import React, { useState } from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { MedicalIdChip } from '../utility/hospitalSnippets'
import { useRouter } from 'next/router'
import Utility from 'src/utility'
import AddEditSymptomDrawer from 'src/components/hospital/drawer/AddEditSymptomDrawer'
import { updateSymptoms, getNotesListForSymptom } from 'src/lib/api/hospital/symptoms'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'

const SymptomsCard = ({ record, isResolved, fetchSymptoms, setPage, patientData, isDischared }) => {
  const theme = useTheme()
  const router = useRouter()
  const { id, animal_id } = router.query
  const [symptomDrawerNewOpen, setSymptomDrawerNewOpen] = useState(false)
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [severity, setSeverity] = useState('Mild')
  const [durationValue, setDurationValue] = useState(0)
  const [durationUnit, setDurationUnit] = useState('Days')
  const [notes, setNotes] = useState('')
  const [noteId, setNoteId] = useState('')
  const [status, setStatus] = useState('')
  const [temporarilySelected, setTemporarilySelected] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activityLoader, setactivityLoader] = useState(false)
  const [activityListData, setActivityListData] = useState()
  const [symptomNoteModal, setSymptomNoteModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingDetails, setPendingDetails] = useState(null)
  const [previousDetails, setPreviousDetails] = useState(null)
  const { getSymptomsSeverityColor } = useHospitalColorUtils()

  const handleClickDetail = async recordData => {
    try {
      setactivityLoader(true)
      setSymptomDrawerNewOpen(true)

      const mappedSeverity =
        recordData?.additional_info?.severity === 'Mild'
          ? 'Mild'
          : recordData?.additional_info?.severity === 'Moderate'
          ? 'Moderate'
          : recordData?.additional_info?.severity

      setPreviousDetails({
        severity: mappedSeverity,
        durationValue: recordData?.additional_info?.duration,
        durationUnit: recordData?.additional_info?.duration_unit,
        status: recordData?.status
      })
      setSeverity(mappedSeverity)
      setDurationValue(
        recordData?.additional_info?.duration === 'null' ||
          recordData?.additional_info?.duration == null ||
          recordData?.additional_info?.duration === ''
          ? 0
          : recordData?.additional_info?.duration
      )
      setDurationUnit(recordData?.additional_info?.duration_unit)
      setStatus(recordData?.status)
      setTemporarilySelected(recordData)

      const response = await fetchNotesForSymptom(recordData)
      if (response?.success) {
        setActivityListData(response?.data || [])
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to fetch notes.' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'An error occurred while fetching notes.' })
    } finally {
      setactivityLoader(false)
    }
  }

  const fetchNotesForSymptom = async recordData => {
    const params = {
      entity: 'complaint',
      medical_id: recordData?.medical_record_id,
      record_id: recordData?.complaint_id
    }

    try {
      const response = await getNotesListForSymptom(params)

      return response
    } catch (error) {
      console.error('Error fetching notes for symptom:', error)
      throw error
    }
  }

  const cancelSymptomSelection = () => {
    setSymptomDrawerNewOpen(false)
  }

  const addSymptomDetails = details => {
    setPendingDetails(details)
    setIsDeleteDialogOpen(true)
  }

  const isChanged =
    previousDetails?.severity !== severity ||
    previousDetails?.durationValue !== durationValue ||
    previousDetails?.durationUnit !== durationUnit ||
    previousDetails?.status !== status

  const canEnableButton = isChanged || notes?.trim()?.length > 0

  const handleConfirmAddSymptom = async () => {
    if (!pendingDetails) return

    try {
      setDeleteLoading(true)

      const isSystemGenerated = isChanged ? true : false

      const payload = {
        main_id: temporarilySelected?.complaint_id,
        med_id: temporarilySelected?.medical_record_id,
        animal_id: patientData?.animal_detail?.animal_id,
        type: 'COMPLAINT',
        is_system_generated: isSystemGenerated ? 1 : 0,
        severity: pendingDetails?.severity,
        duration: pendingDetails?.durationValue || 0,
        duration_unit: pendingDetails?.durationUnit,
        status: pendingDetails?.status,
        note: pendingDetails?.notes
      }

      const response = await updateSymptoms(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Symptom updated successfully!' })

        setSelectedSymptoms(pendingDetails)
        setSymptomDrawerNewOpen(false)
        fetchSymptoms('', 1, false)
        setPage(1)
        setDeleteLoading(false)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to update symptom.' })
        setDeleteLoading(false)
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'An error occurred while updating symptom.' })
    } finally {
      setIsDeleteDialogOpen(false)
      setPendingDetails(null)
      setDeleteLoading(false)
    }
  }

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
    setPendingDetails(null)
  }

  const hasData = data =>
    (Array.isArray(data) && data?.length > 0) || (data && typeof data === 'object' && Object.keys(data)?.length > 0)

  const formatDurationUnit = (value, unit) => {
    if (!unit) return ''

    return Number(value) === 1 || Number(value) === 0 ? unit.replace(/s$/i, '') : unit
  }

  return (
    <Box
      sx={{
        borderRadius: '8px',
        padding: { xs: '16px', sm: '20px', md: '24px' },
        backgroundColor: isResolved
          ? alpha(theme.palette.customColors.neutralSecondary, 0.05)
          : getSymptomsSeverityColor(
              record?.additional_info?.severity === 'Mild'
                ? 'Mild'
                : record?.additional_info?.severity === 'Moderate'
                ? 'Moderate'
                : record?.additional_info?.severity
            ).bgColor
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 2fr',
            md: '1fr 2fr 1fr'
          },
          gap: { xs: 1.5, sm: 2 },
          alignItems: { xs: 'flex-start', sm: 'center' }
        }}
        onClick={() => (isDischared ? null : handleClickDetail(record))}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <MedicalIdChip
            leftImage
            medId={record?.medical_record_code || 'N/A'}
            rightDot={patientData?.medical_record_code === record?.medical_record_code}
            dotColor={theme.palette.primary.main}
            textColor={theme.palette.customColors.OnSurface}
          />
          <Typography
            sx={{
              textDecoration: isResolved ? 'line-through' : 'none',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: isResolved
                ? theme.palette.customColors.OnSurfaceVariant
                : getSymptomsSeverityColor(
                    record?.additional_info?.severity === 'Mild'
                      ? 'Mild'
                      : record?.additional_info?.severity === 'Moderate'
                      ? 'Moderate'
                      : record?.additional_info?.severity
                  ).color,
              fontWeight: 500
            }}
          >
            {record.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={record?.additional_info?.severity}
              size='small'
              sx={{
                backgroundColor: theme.palette.customColors.OnPrimary,
                border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                color: isResolved
                  ? theme.palette.customColors.neutralSecondary
                  : getSymptomsSeverityColor(
                      record?.additional_info?.severity === 'Mild'
                        ? 'Mild'
                        : record?.additional_info?.severity === 'Moderate'
                        ? 'Moderate'
                        : record?.additional_info?.severity
                    ).color,
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            />

            {record?.additional_info?.duration &&
              record?.additional_info?.duration !== '0' &&
              record?.additional_info?.duration !== 'null' && (
                <Box
                  component='span'
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {record?.additional_info?.duration}{' '}
                  {formatDurationUnit(record?.additional_info?.duration, record?.additional_info?.duration_unit)}
                </Box>
              )}
          </Box>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', sm: '2', md: '2' } }}>
          {record?.comment_count > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                Activity:
              </Typography>

              <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.OnSurface, fontWeight: 600 }}>
                {record?.comment_count === '1' ? '1' : '+' + (record?.comment_count - 1)}
              </Typography>
            </Box>
          )}

          {record?.additional_info &&
          (hasData(record?.latest_note?.notes_dump?.new_data) || hasData(record?.latest_note?.notes_dump?.old_data)) ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
                flexWrap: 'wrap'
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Severity :{' '}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 400 }}>
                <span style={{ color: theme.palette.customColors.secondaryBg }}>
                  {record?.latest_note?.notes_dump?.old_data?.severity}
                </span>
                {record?.latest_note?.notes_dump?.old_data?.severity && (
                  <span style={{ color: theme.palette.customColors.OnSurfaceVariant }}> → </span>
                )}
                <strong style={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                  {record?.latest_note?.notes_dump?.new_data?.severity || record?.additional_info?.severity}
                </strong>
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Severity :{' '}
              <strong style={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                {record?.additional_info?.severity}
              </strong>
            </Typography>
          )}

          {record?.latest_note?.note && (
            <Tooltip title={record?.latest_note?.note} arrow placement='top'>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.4'
                }}
              >
                Notes : {record?.latest_note?.note}
              </Typography>
            </Tooltip>
          )}

          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.neutralSecondary }}>
            Last Updated:{' '}
            {Utility?.formatDisplayDate(
              record?.latest_note?.modified_at || record?.created_at || record?.latest_note?.created_at
            )}
            <span style={{ margin: '0 8px', color: theme.palette.customColors.neutralSecondary }}>•</span>
            {Utility.convertUTCToLocaltime(
              record?.latest_note?.modified_at || record?.created_at || record?.latest_note?.created_at
            )}
          </Typography>
        </Box>

        {record.created_by_user_name && (
          <Box
            sx={{
              gridColumn: { xs: '1', sm: '1 / span 2', md: '3' },
              mt: { xs: 1, md: 0 },
              borderTop: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' },
              pt: { xs: 1.5, md: 0 }
            }}
          >
            <Typography
              sx={{
                mb: { xs: 1, md: 2 },
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '0.75rem',
                ml: { xs: 0, md: 1 }
              }}
            >
              {record?.status === 'active'
                ? record?.latest_note?.modified_at?.slice(0, 19) === record?.created_at
                  ? 'Created by'
                  : 'Updated by'
                : 'Resolved by'}
            </Typography>
            <UserAvatarDetails
              profile_image={
                record?.status === 'active'
                  ? record?.created_user_profile_pic
                  : record?.additional_info?.resolved_user_profile_pic
              }
              user_name={record?.additional_info?.resolved_user_name || record?.created_by_user_name}
              date={
                record?.status === 'active'
                  ? record?.created_at
                  : record?.latest_note?.modified_at || record?.additional_info?.closed_comment_date
              }
              show_time
              compact={true}
            />
          </Box>
        )}
      </Box>

      {symptomDrawerNewOpen && (
        <AddEditSymptomDrawer
          open={symptomDrawerNewOpen}
          onClose={cancelSymptomSelection}
          selectedSymptom={temporarilySelected}
          severity={severity}
          setSeverity={setSeverity}
          durationValue={durationValue}
          setDurationValue={setDurationValue}
          durationUnit={durationUnit}
          setDurationUnit={setDurationUnit}
          notes={notes}
          status={status}
          setStatus={setStatus}
          setNotes={setNotes}
          setNoteId={setNoteId}
          noteId={noteId}
          onSave={addSymptomDetails}
          activityListData={activityListData}
          activityLoader={activityLoader}
          temporarilySelected={temporarilySelected}
          setSymptomNoteModal={setSymptomNoteModal}
          symptomNoteModal={symptomNoteModal}
          fetchNotesForSymptom={fetchNotesForSymptom}
          setIsUpdating={setIsUpdating}
          isUpdating={isUpdating}
          setIsDeleting={setIsDeleting}
          isDeleting={isDeleting}
          setActivityListData={setActivityListData}
          isChanged={canEnableButton}
        />
      )}
      {isDeleteDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isDeleteDialogOpen}
          onClose={handleDeleteDialogClose}
          title={'Are you sure you want to save the changes?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.mdAntzNeutral, p: 4 }}
          confirmAction={handleConfirmAddSymptom}
          loading={deleteLoading}
          ConfirmationText={'YES'}
          description={''}
        />
      )}
    </Box>
  )
}

export default SymptomsCard
