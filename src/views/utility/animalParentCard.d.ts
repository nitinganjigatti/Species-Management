import { SxProps, Theme } from '@mui/material'

interface CheckboxProps {
  checked: boolean
  onChange?: () => void
}

interface RadioProps {
  checked: boolean
  onChange?: () => void
}

interface AnimalParentCardProps {
  data: any
  backgroundColor?: string
  size?: string | number
  animal?: boolean
  ondelete?: () => void
  radio?: boolean | RadioProps
  checkbox?: boolean | CheckboxProps
  onClick?: () => void
  sx?: SxProps<Theme>
}

declare const AnimalParentCard: React.FC<AnimalParentCardProps>

export default AnimalParentCard
