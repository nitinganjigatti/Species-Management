import React, { useState } from 'react'

// ** MUI Imports
import { Typography, Box, Button, IconButton } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { alpha, useTheme } from '@mui/material/styles'

const dummyClinicalNotesData = [
  {
    id: 'MED - 12345/25',
    note: 'Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities.',
    author: 'Jordan Stevenson',
    date: '02 Jan 2025 • 12 : 35 PM'
  },
  {
    id: 'MED - 67890/26',
    note: 'Patient shows signs of recovery. Monitoring to continue for the next 48 hours.',
    author: 'Emily Clark',
    date: '03 Jan 2025 • 10 : 20 AM'
  },
  {
    id: 'MED - 12345/27',
    note: 'Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities. Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities.Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities.',
    author: 'Jordan Stevenson',
    date: '02 Jan 2025 • 12 : 35 PM'
  }
]
function ClinicalNotes() {
  const [submitLoader, setSubmitLoader] = useState(false)
  const theme = useTheme()

  console.log('outside')

  const onSubmit = async params => {
    console.log('params', params)
  }

  const defaultValues = {
    clinical_note_name: ''
  }

  const schema = yup.object().shape({
    clinical_note_name: yup.string().trim()
  })

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

  return (
    <Box>
      <Box
        sx={{
          p: 6,
          backgroundColor: 'customColors.displaybgPrimary',
          borderRadius: '12px',
          mb: 6,
          mt: 8
        }}
      >
        <Typography sx={{ fontSize: '1rem', color: 'customColors.deepDark', mb: 4 }}>Enter clinical notes</Typography>

        <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <ControlledTextField
            name='clinical_note_name'
            control={control}
            fullWidth
            multiline
            placeholder='Add notes'
          />

          {clinical_note_name?.trim() && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
              <Button
                startIcon={<Icon icon='mdi:close' />}
                variant='text'
                sx={{ color: 'customColors.OnPrimaryContainer' }}
                onClick={() => reset(defaultValues)}
                size='small'
              >
                Clear Text
              </Button>

              <LoadingButton
                sx={{ padding: '10px 70px', borderRadius: '4px' }}
                disabled={submitLoader}
                variant='contained'
                loading={submitLoader}
                type='submit'
                size='small'
              >
                Add
              </LoadingButton>
            </Box>
          )}
        </form>
      </Box>

      {dummyClinicalNotesData?.map(data => {
        return (
          <Box
            key={data.id}
            sx={{ p: 6, mb: 4, background: alpha(theme.palette.customColors.antzNotes80, 0.2), borderRadius: '8px' }}
          >
            <Typography sx={{ mb: 2, color: 'primary.OnSurface', fontSize: '0.875rem', fontWeight: 500 }}>
              {data.id}
            </Typography>{' '}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
              <Typography sx={{ fontSize: '1rem', color: 'customColors.OnSurfaceVariant' }}>{data.note}</Typography>

              <Box onClick={() => {}} sx={{ color: 'customColors.Tertiary', ml: 2, cursor: 'pointer' }}>
                <IconButton size='small' onClick={() => {}} sx={{ color: 'customColors.Tertiary' }}>
                  <CancelOutlinedIcon fontSize='small' />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: 'customColors.neutralSecondary', fontSize: '0.875rem' }}>
                {data.author}
              </Typography>
              <Typography sx={{ color: 'customColors.neutralSecondary', fontSize: '0.875rem' }}>{data.date}</Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default React.memo(ClinicalNotes)
