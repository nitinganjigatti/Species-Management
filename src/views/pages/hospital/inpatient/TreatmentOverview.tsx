'use client'

import React from 'react'
import { Box, Typography, Grid, Avatar, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useParams } from 'next/navigation'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useTranslation } from 'react-i18next'

interface StatsCardProps {
  icon?: string
  count?: any
  label?: string
  color?: any
  backgroundColor?: any
  navigateTo?: any
  onClick?: () => void
}

const StatsCard = ({ icon, count, label, color = 'primary', backgroundColor, navigateTo, onClick }: StatsCardProps) => {
  const theme: any = useTheme()
  const router: any = useSafeRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (navigateTo) {
      router.push(navigateTo)
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 1rem 1rem 2rem',
        minHeight: '80px',
        borderRadius: '8px',
        backgroundColor,
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      <Box
        sx={{
          height: '56px',
          width: '56px',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: theme.palette.primary.contrastText,
          zIndex: 1,
          boxShadow: `0px 0px 6px 0px ${theme.palette.customColors.shadowColor}`
        }}
      >
        <Avatar
          variant='square'
          src={icon}
          sx={{
            height: '32px',
            width: icon === '/icons/hospital/TreatmentMonitoring.svg' ? '37px' : '32px',
            objectFit: 'contain'
          }}
        />
      </Box>
      <Box sx={{ pl: 2, flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color,
            fontSize: '20px',
            fontWeight: 500
          }}
        >
          {count}
        </Typography>
        <Tooltip title={label} arrow>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  )
}

interface HealthcareOverviewProps {
  data?: any
  onPrescriptionClick?: () => void
}

const HealthcareOverview = ({ data, onPrescriptionClick }: HealthcareOverviewProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const params = useParams()
  const { id }: any = params

  const statsData = [
    {
      icon: '/icons/hospital/TreatmentMonitoring.svg',
      count: data?.treatment_monitoring,
      navigateTo: `/hospital/inpatient/${id}?tab=treatmentMonitoring`,
      label: t('hospital_module.treatment_monitoring_label'),
      color: theme.palette.customColors.Error,
      backgroundColor: '#FFD3D333'
    },
    {
      icon: '/icons/hospital/ActiveSymptoms.svg',
      count: data?.active_diagnosis_count,
      navigateTo: `/hospital/inpatient/${id}?tab=clinicalAssessment`,
      label: t('hospital_module.active_clinical_assessment_label'),
      color: theme.palette.primary.dark,
      backgroundColor: '#FCF4AE99'
    },
    {
      icon: '/icons/hospital/ActiveClinicalAassesment.svg',
      count: data?.active_complaints_count,
      navigateTo: `/hospital/inpatient/${id}?tab=symptoms`,
      label: t('hospital_module.active_symptoms_label'),
      color: theme.palette.primary.main,
      backgroundColor: '#E1F9EDCC'
    },
    {
      icon: '/icons/hospital/Prescription.svg',
      count: data?.active_prescriptions_count,
      onClick: onPrescriptionClick,
      label: t('hospital_module.prescription_label'),
      color: theme.palette.customColors.addPrimary,
      backgroundColor: theme.palette.customColors.bodyBg
    }
  ]

  return (
    <Box sx={{ py: 3, pl: 8 }}>
      <Grid container spacing={'40px'}>
        {statsData.map((stat: any, index: number) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <StatsCard {...stat} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default HealthcareOverview
