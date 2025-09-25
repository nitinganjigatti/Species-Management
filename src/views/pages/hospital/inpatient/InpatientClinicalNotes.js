import React from 'react'
import { Typography, Box, Button, IconButton, Skeleton, Grid } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useForm } from 'react-hook-form'
import { MedicalIdChip } from '../utility/hospitalSnippets'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'

// initial values
const defaultValues = {
  note: ''
}

const InpatientClinicalNotes = props => {
  const { clinicalNotesData, onSubmitNote, onDeleteNote, isLoading, isSubmitting, patientData } = props
  const theme = useTheme()

  const { control, handleSubmit, reset, watch } = useForm({ defaultValues })

  const clinical_note_name = watch('note')

  const onSubmit = async formValues => {
    const payload = {
      medical_record_id: patientData?.medical_record_id,
      note: formValues.note
    }

    try {
      await onSubmitNote(payload)
      reset(defaultValues)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <>
      <Box
        sx={{
          p: 6,
          backgroundColor: theme.palette.customColors.displaybgPrimary,
          borderRadius: '12px',
          mb: 6,
          mt: 8
        }}
      >
        <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.customColors.deepDark, mb: 4 }}>
          Enter clinical notes
        </Typography>

        {/* Clinical Note Form */}
        <form noValidate autoComplete='off' onSubmit={!isSubmitting ? handleSubmit(onSubmit) : undefined}>
          <Grid container>
            <Grid size={{ xs: 12 }}>
              <ControlledTextArea name='note' control={control} placeholder='Add notes' fullWidth={true} minRows={3} />
            </Grid>
          </Grid>

          {clinical_note_name?.trim() && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
              <Button
                startIcon={<Icon icon='mdi:close' />}
                variant='text'
                sx={{ color: theme.palette.customColors.OnPrimaryContainer }}
                onClick={() => reset(defaultValues)}
                size='small'
              >
                Clear Text
              </Button>
              <LoadingButton
                variant='contained'
                loading={isSubmitting}
                type='submit'
                sx={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '4px',
                  minWidth: { sm: '12.5rem' }
                }}
              >
                Add
              </LoadingButton>
            </Box>
          )}
        </form>
      </Box>

      {/* Clinical Notes List or Skeletons */}
      {isLoading ? (
        <ClinicalNotesSkeleton />
      ) : (
        <>
          {clinicalNotesData?.length > 0 ? (
            clinicalNotesData?.map(data => {
              return (
                <Box
                  key={data?.note_id}
                  sx={{
                    p: 6,
                    mb: 4,
                    background: alpha(theme.palette.customColors.antzNotes80, 0.2),
                    borderRadius: '8px'
                  }}
                >
                  <MedicalIdChip
                    leftImage
                    medId={data?.medical_record_code}
                    rightDot
                    dotColor={theme.palette.primary.main}
                    textColor={theme.palette.customColors.OnSurface}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        textAlign: 'justify'
                      }}
                    >
                      {data?.note || 'NA'}
                    </Typography>

                    <Box sx={{ ml: 2, cursor: 'pointer' }}>
                      <IconButton
                        size='small'
                        onClick={() => onDeleteNote(data?.note_id)}
                        sx={{ color: theme.palette.customColors.Tertiary }}
                      >
                        <CancelOutlinedIcon fontSize='small' />
                      </IconButton>
                    </Box>
                  </Box>

                  <UserAvatarDetails
                    user_name={data?.created_by_user_name}
                    date={Utility.convertUtcToLocalReadableDate(data?.created_at)}
                    show_time
                    size='medium'
                    profile_image={data?.user_created_profile_pic}
                  />
                </Box>
              )
            })
          ) : (
            <NoDataFound variant='Seal' height={300} width={300} />
          )}
        </>
      )}
    </>
  )
}

export default InpatientClinicalNotes

function ClinicalNotesSkeleton() {
  const theme = useTheme()

  return (
    <>
      {Array.from({ length: 2 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 6,
            mb: 4,
            background: alpha(theme.palette.customColors.antzNotes80, 0.2),
            borderRadius: '8px'
          }}
        >
          <Skeleton variant='text' animation='wave' width='20%' height={24} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' width='100%' animation='wave' height={60} sx={{ mb: 4 }} />
          <Skeleton variant='text' animation='wave' width='20%' height={20} />
        </Box>
      ))}
    </>
  )
}
