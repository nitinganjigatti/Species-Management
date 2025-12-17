import { alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material'

const useHospitalColorUtils = () => {
  const theme = useTheme()

  const getSeverityColor = severity => {
    switch (severity) {
      case 'Guarded':
        return { bgColor: theme.palette.customColors.displaybgPrimary, color: theme.palette.customColors.addPrimary }
      case 'Favourable':
        return {
          bgColor: alpha(theme.palette.customColors.moderateSecondary, 0.2),
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

  const getTypeChipColor = type => {
    switch (type) {
      case 'Diagnosis':
        return theme.palette.customColors.displaybgPrimary
      case 'Tentative':
        return theme.palette.customColors.antzNotes
      default:
        return 'default'
    }
  }

  const getSymptomsSeverityColor = severity => {
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
        return { bgColor: alpha(theme.palette.customColors.Error, 0.06), color: theme.palette.customColors.Error }
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
