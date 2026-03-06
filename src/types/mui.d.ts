import '@mui/material/styles'

declare module '@mui/material/styles' {
  interface CustomColors {
    dark: string
    main: string
    light: string
    darkBg: string
    lightBg: string
    bodyBg: string
    trackBg: string
    avatarBg: string
    tooltipBg: string
    tableHeaderBg: string
    // Additional custom colors used in the necropsy module
    OnSurface?: string
    Surface?: string
    OnPrimary?: string
    OnSurfaceVariant?: string
    OnBackground?: string
    TertiaryContainer?: string
    Background?: string
    neutralSecondary?: string
    successContainer?: string
    errorContainer?: string
    warningContainer?: string
    infoContainer?: string
    primaryContainer?: string
    secondaryContainer?: string
    Outline?: string
    OutlineVariant?: string
    onSuccessContainer?: string
    onErrorContainer?: string
    onWarningContainer?: string
    onInfoContainer?: string
    onPrimaryContainer?: string
    onSecondaryContainer?: string
    onTertiaryContainer?: string
    surfaceVariant?: string
    inverseSurface?: string
    inverseOnSurface?: string
    inversePrimary?: string
    scrim?: string
    shadow?: string
    [key: string]: string | undefined
  }

  interface Palette {
    customColors: CustomColors
  }

  interface PaletteOptions {
    customColors?: Partial<CustomColors>
  }

  interface TypeBackground {
    default: string
    paper: string
  }
}
