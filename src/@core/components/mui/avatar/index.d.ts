import { ComponentType } from 'react'
import { AvatarProps } from '@mui/material/Avatar'

export type CustomAvatarSkin = 'light' | 'light-static' | 'filled'
export type CustomAvatarColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'

export interface CustomAvatarProps extends AvatarProps {
  skin?: CustomAvatarSkin
  color?: CustomAvatarColor
}

declare const Avatar: ComponentType<CustomAvatarProps>

export default Avatar
