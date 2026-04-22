'use client'

import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { useTranslation } from 'react-i18next'

interface SelectedSymptomsProps {
  selected?: any[]
  onRemove?: (id: any) => void
  severity?: any
  alreadySelectedIds?: any[]
  footer?: any
}

export default function SelectedSymptoms({
  selected = [],
  onRemove,
  severity,
  alreadySelectedIds = [],
  footer = null
}: SelectedSymptomsProps) {
  const theme: any = useTheme()
  const { getSymptomsSeverityColor } = useHospitalColorUtils()
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        p: 6,
        textAlign: 'center',
        minHeight: '100%',
        background: theme.palette.customColors.OnBackground,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
    >
      <Typography
        sx={{
          color: theme.palette.customColors.OnSurfaceVariant,
          fontSize: '20px',
          fontWeight: 400,
          textAlign: 'left',
          mb: 5
        }}
      >
        {t('hospital_module.selected_symptoms')}
      </Typography>

      {selected.length === 0 ? (
        <Box
          sx={{
            background: theme.palette.common.white,
            height: 500,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src='/images/no_data_animal_2.png' alt='No Symptoms' style={{ maxWidth: '250px' }} />
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '16px' }}>
            {t('hospital_module.selected_symptoms_appear_here')}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            background: theme.palette.common.white,
            height: 500,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            p: 7,
            overflow: 'auto'
          }}
        >
          {selected.map((symptom: any, idx: number) => {
            const isAlreadyPrescribed = alreadySelectedIds.includes(symptom?.id)

            return (
              <Box
                key={idx}
                sx={{
                  backgroundColor: getSymptomsSeverityColor(selected[idx]?.severity).bgColor,
                  p: 4,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: isAlreadyPrescribed ? 0.7 : 1
                }}
              >
                <Box>
                  <Typography
                    fontWeight={600}
                    sx={{
                      color: getSymptomsSeverityColor(selected[idx]?.severity).color,
                      fontSize: '14px',
                      textAlign: 'left'
                    }}
                  >
                    {symptom.name}
                  </Typography>
                  <Typography
                    sx={{
                      textAlign: 'left',
                      background: theme.palette.common.white,
                      color: getSymptomsSeverityColor(selected[idx]?.severity).color,
                      borderRadius: '4px',
                      mt: 2,
                      mb: 1,
                      px: 3.5,
                      py: 0.5,
                      width: 'fit-content',
                      minWidth: 'auto',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {symptom.severity}
                  </Typography>
                </Box>
                <IconButton onClick={() => onRemove && onRemove(symptom.id)}>
                  <CloseIcon sx={{ color: '#1F515B', fontSize: '22px' }} />
                </IconButton>
              </Box>
            )
          })}
        </Box>
      )}

      {footer}
    </Box>
  )
}
