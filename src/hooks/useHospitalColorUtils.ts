import { alpha, useTheme } from '@mui/material'

interface SeverityColor {
  bgColor: string
  color: string
}

const useHospitalColorUtils = () => {
  const theme: any = useTheme()

  const getSeverityColor = (severity?: string): SeverityColor => {
    switch (severity) {
      case 'Favourable':
        return { bgColor: theme.palette.customColors.displaybgPrimary, color: theme.palette.customColors.addPrimary }
      case 'Guarded':
        return {
          bgColor: alpha(theme.palette.customColors.Notes, 0.7),
          color: theme.palette.customColors.moderateSecondary
        }
      case 'Doubtful':
        return {
          bgColor: alpha(theme.palette.customColors.TertiaryContainer, 0.16),
          color: theme.palette.customColors.Tertiary
        }
      case 'Poor':
        return { bgColor: alpha(theme.palette.customColors.Error, 0.06), color: theme.palette.customColors.Error }
      case 'Grave':
        return {
          bgColor: alpha(theme.palette.customColors.rusticRed, 0.1),
          color: theme.palette.customColors.rusticRed
        }
      default:
        return { bgColor: theme.palette.customColors.displaybgPrimary, color: theme.palette.customColors.addPrimary }
    }
  }

  const getTypeChipColor = (type?: string): string => {
    switch (type) {
      case 'Diagnosis':
        return theme.palette.customColors.displaybgPrimary
      case 'Tentative':
        return theme.palette.customColors.antzNotes
      default:
        return 'default'
    }
  }

  const getSymptomsSeverityColor = (severity?: string): SeverityColor => {
    switch (severity) {
      case 'Mild':
        return { bgColor: theme.palette.customColors.displaybgPrimary, color: theme.palette.customColors.addPrimary }
      case 'Moderate':
        return {
          bgColor: alpha(theme.palette.customColors.moderateSecondary, 0.2),
          color: theme.palette.customColors.moderateSecondary
        }
      case 'High':
        return {
          bgColor: alpha(theme.palette.customColors.TertiaryContainer, 0.16),
          color: theme.palette.customColors.Tertiary
        }
      case 'Extreme':
        return {
          bgColor: alpha(theme.palette.customColors.ErrorContainer, 0.4),
          color: theme.palette.customColors.Error
        }
      default:
        return { bgColor: theme.palette.customColors.displaybgPrimary, color: theme.palette.customColors.addPrimary }
    }
  }

  return {
    getSeverityColor,
    getTypeChipColor,
    getSymptomsSeverityColor
  }
}

export default useHospitalColorUtils
