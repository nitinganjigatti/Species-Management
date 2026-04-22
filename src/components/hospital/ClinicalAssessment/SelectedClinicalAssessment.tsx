'use client'

import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { useTranslation } from 'react-i18next'

interface SelectedClinicalAssessmentProps {
  selected?: any[]
  onRemove?: (s: any) => void
  clinicalAsmnt?: any
  onEdit?: (s: any) => void
  alreadySelectedIds?: any[]
  footer?: any
}

export default function SelectedClinicalAssessment({
  selected = [],
  onRemove,
  clinicalAsmnt,
  onEdit,
  alreadySelectedIds = [],
  footer = null
}: SelectedClinicalAssessmentProps) {
  const theme: any = useTheme()
  const { getSeverityColor } = useHospitalColorUtils()
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
        {t('hospital_module.selected_clinical_assessment')}
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
            {t('hospital_module.selected_clinical_assessment_appear_here')}
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
                onClick={() => {
                  if (!isAlreadyPrescribed) onEdit && onEdit(symptom)
                }}
                sx={{
                  backgroundColor: getSeverityColor(selected[idx]?.prognosisVal).bgColor,
                  p: 4,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                  cursor: isAlreadyPrescribed ? 'not-allowed' : 'pointer',
                  opacity: isAlreadyPrescribed ? 0.7 : 1
                }}
              >
                <Box>
                  <Typography
                    fontWeight={400}
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '20px',
                      textAlign: 'left',
                      fontWeight: 500,
                      mb: 1
                    }}
                  >
                    {symptom.name}
                  </Typography>
                  <Typography
                    sx={{
                      textAlign: 'left',
                      background:
                        symptom.clinicalAsmnt === 'Tentative'
                          ? theme.palette.customColors.antzNotes
                          : theme.palette.customColors.tableHeaderBg,
                      color: theme.palette.customColors.OnSecondaryContainer,
                      borderRadius: '4px',
                      border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                      px: 3.5,
                      py: 1,
                      fontSize: '16px',
                      fontWeight: 500,
                      width: 'fit-content',
                      minWidth: 'auto',
                      display: 'inline'
                    }}
                  >
                    {symptom.clinicalAsmnt}
                  </Typography>

                  {symptom.prognosisVal && (
                    <Typography
                      variant='body2'
                      sx={{
                        textAlign: 'left',
                        color: getSeverityColor(selected[idx]?.prognosisVal).color,
                        display: 'inline',
                        ml: 2,
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      • {symptom.prognosisVal}
                    </Typography>
                  )}

                  {selected[idx]?.chronicVal === 'Yes' ? (
                    <Typography
                      variant='body2'
                      sx={{
                        textAlign: 'left',
                        color: theme.palette.customColors.secondaryBg,
                        display: 'inline',
                        ml: 2,
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      • {t('hospital_module.chronic')}
                    </Typography>
                  ) : (
                    ''
                  )}
                </Box>
                <IconButton
                  onClick={(e: any) => {
                    e.stopPropagation()
                    onRemove && onRemove(symptom)
                  }}
                >
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
