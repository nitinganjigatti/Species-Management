import { ComponentType, ReactNode } from 'react'
import { SxProps, Theme } from '@mui/material/styles'

export interface SidebarProps {
  sx?: SxProps<Theme>
  show: boolean
  direction?: 'left' | 'right'
  children?: ReactNode
  hideBackdrop?: boolean
  onOpen?: () => void
  onClose?: () => void
  backDropClick?: () => void
}

declare const Sidebar: ComponentType<SidebarProps>

export default Sidebar
