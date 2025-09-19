import React from 'react'

// ** MUI Imports
import { Typography, Box, Button, IconButton, Skeleton } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { alpha, useTheme } from '@mui/material/styles'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Utility Components
import { MedicalIdChip } from '../utility/hospitalSnippets'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

// ** Custom Form Components
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'

const defaultValues = {
  clinical_note_name: ''
}

const schema = yup.object().shape({
  clinical_note_name: yup.string().trim()
})

const InpatientClinicalNotes = props => {
  const { clinicalNotesData, handleSubmitData, onDeleteNote, loading } = props
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const clinical_note_name = watch('clinical_note_name')

  const onSubmit = async params => {
    await handleSubmitData(params.clinical_note_name)

    reset(defaultValues)
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
        <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.deepDark, mb: 4 }}>
          Enter clinical notes
        </Typography>

        {/* Clinical Note Form */}
        <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <ControlledTextArea
            name='clinical_note_name'
            control={control}
            placeholder='Add notes'

            // minRows={1}
          />

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
                sx={{ padding: '10px 70px', borderRadius: '4px' }}
                disabled={loading}
                variant='contained'
                loading={loading}
                type='submit'
                size='small'
              >
                Add
              </LoadingButton>
            </Box>
          )}
        </form>
      </Box>
      {/*  Clinical Notes List */}
      {loading ? (
        Array.from({ length: 2 }).map((_, index) => (
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
        ))
      ) : (
        <>
          {clinicalNotesData.length > 0 ? (
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
                    <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVariant }}>
                      {data?.note || 'NA'}
                    </Typography>

                    <Box sx={{ ml: 2, cursor: 'pointer' }}>
                      <IconButton
                        size='small'
                        onClick={() => onDeleteNote(data.id)}
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
