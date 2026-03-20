// import React from 'react'
// import { Box, Typography, Stack, Tooltip } from '@mui/material'
// import { useTheme } from '@mui/material/styles'
// import FallbackAvatar from 'src/views/utility/FallbackAvatar'
// import Icon from 'src/@core/components/icon'
// import Utility from 'src/utility'
// import { alpha } from '@mui/material/styles'

// const EggCard = ({
//   imgURl,
//   eggIcon = '/icons/Egg_icon.png',
//   defaultName,
//   completeName,
//   eggCode,
//   eggCondition,
//   egg_status,
//   egg_state,
//   batch,
//   date,
//   status,
//   handleEggClick
// }) => {
//   const theme = useTheme() as any

// // Function to get the background color based on the egg condition
//     const getChipBackgroundColor = (status:string) => {
//       const constThemeColor = theme.palette.customColors
//       switch (status) {
//         case "Broken":
//         case "Rotten":
//           return constThemeColor.errorContainer;
//         case "Cracked":
//           return constThemeColor.notes;
//         case "Thin-Shelled":
//           return constThemeColor.secondaryContainer;
//         case "Discard":
//           return constThemeColor.onTertiaryContainer;
//         case "Intact":
//         default:
//           return theme.palette.customColors.onBackground;
//       }
//     };
    
//     // Function to get the text color based on the egg condition
//     const getChipTextColor = (status:string) => {
//       const constThemeColor = theme.palette.customColors
//       switch (status) {
//         case "Broken":
//           return constThemeColor.error;
//         case "Cracked":
//           return constThemeColor.moderateSecondary;
//         case "Rotten":
//           return constThemeColor.tertiary;
//         case "Thin-Shelled":
//           return constThemeColor.onPrimaryContainer;
//         case "Discard":
//           return constThemeColor.onTertiaryContainer;
//         case "Intact":
//         default:
//           return constThemeColor.primary;
//       }
//     };

//   return (
//     <Box
//       sx={{
//         p: 3,
//         borderRadius: 1,
//         border: `1px solid ${theme.palette.divider}`,
//         backgroundColor: theme.palette.background.paper,
//         '&:hover': {
//           backgroundColor: alpha(theme.palette.action.hover, 0.04)
//         },
//         mb: 3,
//         display: 'flex',
//         gap: 5,
//         cursor: 'pointer'
//       }}
//       onClick={handleEggClick}
//     >
//       {/* LEFT COLUMN */}
//       <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
//         {/* ICON */}
//         <Box
//           sx={{
//             display: 'flex',
//             width: 66,
//             height: 40,
//             p: '4px',
//             borderRadius: '50px',
//             alignItems: 'center',
//             backgroundColor:getChipBackgroundColor(egg_status),
//             // bgcolor:
//             //   eggCondition === 'Broken'
//             //     ? theme.palette.customColors.Error 
//             //     : eggCondition === 'Cracked'
//             //     ? theme.palette.customColors.moderateSecondary
//             //     : eggCondition === 'Thin-Shelled'
//             //     ? theme.palette.customColors.rusticRed
//             //     : theme.palette.primary.dark,
//             gap: 1
//           }}
//         >
//           <Box
//             sx={{
//               width: 35,
//               height: 35,
//               borderRadius: '50%',
//               backgroundColor: '#fff',
//               border: `1px solid ${theme.palette.customColors.OutlineVariant}`
//             }}
//           >
//             {imgURl ? (
//               <FallbackAvatar src={imgURl} variant='circular' sx={{ width: '100%', height: '100%' }} />
//             ) : (
//               <Icon icon='mdi:user' />
//             )}
//           </Box>

//           <Box sx={{ width: 19, height: 24 }}>
//             <img src={eggIcon} style={{ width: '100%' }} />
//           </Box>
//         </Box>

//         {/* CONDITION CHIP */}
//         {eggCondition && (
//           <Box
//             sx={{
//               px: 2,
//               py: '4px',
//               borderRadius: '4px',
//               // border: `1px solid ${eggCondition === 'Broken'
//               //   ? theme.palette.customColors.Error :eggCondition === 'Rotten'? theme.palette.customColors.Error: eggCondition === 'Cracked'
//               //   ? theme.palette.customColors.moderateSecondary
//               //   : eggCondition === 'Thin-Shelled'
//               //   ?  theme.palette.customColors.OnPrimaryContainer : eggCondition === 'Discard' ? theme.palette.customColors.OnTertiaryContainer
//               //   : theme.palette.primary.main}`,
//               border: `1px solid ${getChipBackgroundColor(eggCondition)}`,
//               // backgroundColor:
//               // eggCondition === 'Broken'
//               //   ? theme.palette.customColors.ErrorContainer :eggCondition === 'Rotten'? theme.palette.customColors.ErrorContainer: eggCondition === 'Cracked'
//               //   ? theme.palette.customColors.Notes
//               //   : eggCondition === 'Thin-Shelled'
//               //   ? theme.palette.customColors.SecondaryContainer : eggCondition === 'Discard' ? theme.palette.customColors.OnTertiaryContainer 
//               //   : theme.palette.customColors.OnBackground,
//               backgroundColor:getChipBackgroundColor(eggCondition),
//             }}
//           >
//             <Typography
//               sx={{
//                 fontSize: 13,
//                 fontWeight: 500,
//                 color: eggCondition === 'Broken'
//                 ? theme.palette.customColors.Error :eggCondition === 'Rotten'? theme.palette.customColors.Error: eggCondition === 'Cracked'
//                 ? theme.palette.customColors.moderateSecondary
//                 : eggCondition === 'Thin-Shelled'
//                 ?  theme.palette.customColors.OnPrimaryContainer : eggCondition === 'Discard' ? theme.palette.customColors.OnTertiaryContainer
//                 : theme.palette.primary.main,
//               }}
//             >
//               {eggCondition}
//             </Typography>
//           </Box>
//         )}
//       </Box>

//       {/* RIGHT COLUMN */}
//       <Box sx={{ flex: 1 }}>
//         {/* NAME + STATUS */}
//         <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//           <Box>
//             {defaultName && (
//               <Typography fontSize={16} fontWeight={600}>
//                 {defaultName}
//               </Typography>
//             )}

//             {/* {completeName && (
//           <Typography
//             sx={{
//               fontSize: 14,
//               fontStyle: 'italic',
//               color: theme.palette.text.secondary
//             }}
//           >
//             {completeName}
//           </Typography>
//         )} */}
//           </Box>

//           {status && (
//             <Typography fontSize={14} color={theme.palette.text.secondary}>
//               {status}
//             </Typography>
//           )}
//         </Box>

//         {/* DETAILS */}

//         {eggCode && (
//           <Typography fontSize={14} fontWeight={500} color={theme.palette.customColors.secondaryBg}>
//             {eggCode}
//           </Typography>
//         )}

//         {date && (
//           <Typography fontSize={14} color={theme.palette.customColors.OnSurfaceVariant}>
//             {Utility.convertUtcToLocalReadableDate(date)}
//           </Typography>
//         )}

//         {egg_state && (
//           <Typography fontSize={14} fontWeight={500} color={theme.palette.customColors.secondaryBg}>
//             {egg_state}
//           </Typography>
//         )}

//         {batch && (
//           <Typography fontSize={14} fontWeight={600}>
//             Batch: {batch}
//           </Typography>
//         )}
//       </Box>
//     </Box>
//   )
// }

// export default EggCard
import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'

interface EggCardProps {
  imgURl?: string
  eggIcon?: string
  defaultName?: string
  completeName?: string
  eggCode?: string
  eggCondition?: string
  egg_status?: string
  egg_state?: string
  batch?: string
  date?: string
  status?: string
  handleEggClick?: () => void
}

const EggCard: React.FC<EggCardProps> = ({
  imgURl,
  eggIcon = '/icons/Egg_icon.png',
  defaultName,
  completeName,
  eggCode,
  eggCondition,
  egg_status,
  egg_state,
  batch,
  date,
  status,
  handleEggClick
}) => {
  const theme = useTheme() as any
  const colors = theme.palette.customColors

  // ✅ Normalize ANY incoming value
  const normalizeStatus = (status?: string) => {
    if (!status) return ''

    return status
      .toLowerCase()
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-')
  }

  // Background color
  const getChipBackgroundColor = (status?: string) => {
    const s = normalizeStatus(status)

    switch (s) {
      case 'Broken':
      case 'Rotten':
        return colors.ErrorContainer
      case 'Cracked':
        return colors.Notes
      case 'Thin-Shelled':
        return colors.SecondaryContainer
      case 'Discard':
        return colors.OnTertiaryContainer
      case 'Intact':
      default:
        return colors.OnBackground
    }
  }

  // Text color
  const getChipTextColor = (status?: string) => {
    const s = normalizeStatus(status)
    switch (s) {
      case 'Broken':
        return colors.Error
      case 'Cracked':
        return colors.moderateSecondary
      case 'Rotten':
        return colors.Tertiary
      case 'Thin-Shelled':
        return colors.OnPrimaryContainer
      case 'Discard':
        return colors.OnTertiaryContainer
      case 'Intact':
      default:
        return theme.palette.primary.main
    }
  }

  // ✅ Icon background (same as mobile logic)
  const getIconBgColor = () => {
    const condition = normalizeStatus(eggCondition)

    if (egg_status === 'Hatched') return colors.primary
    if (condition === 'Intact') return colors.onSurface
    if (condition === 'Discard') return colors.onTertiaryContainer

    return getChipTextColor(condition)
  }

  return (
    <Box
      onClick={handleEggClick}
      sx={{
        p: 3,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.04)
        },
        mb: 3,
        display: 'flex',
        gap: 5,
        cursor: 'pointer'
      }}
    >
      {/* LEFT SIDE */}
      <Box display='flex' flexDirection='column' alignItems='center' gap={3}>
        {/* ICON */}
        <Box
          sx={{
            display: 'flex',
            width: 66,
            height: 40,
            p: '4px',
            borderRadius: '50px',
            alignItems: 'center',
            backgroundColor: getIconBgColor(),
            gap: 1
          }}
        >
          {/* AVATAR */}
          <Box
            sx={{
              width: 35,
              height: 35,
              borderRadius: '50%',
              backgroundColor: '#fff',
              border: `1px solid ${colors.OutlineVariant}`
            }}
          >
            {imgURl ? (
              <FallbackAvatar
                src={imgURl}
                variant='circular'
                sx={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Icon icon='mdi:egg' />
            )}
          </Box>

          {/* EGG ICON */}
          <Box sx={{ width: 19, height: 24 }}>
            <img src={eggIcon} style={{ width: '100%' }} />
          </Box>
        </Box>

        {/* CONDITION CHIP */}
        {eggCondition && (
          <Box
            sx={{
              px: 2,
              py: '4px',
              borderRadius: '4px',
              border: `1px solid ${getChipTextColor(eggCondition)}`, 
              backgroundColor: getChipBackgroundColor(eggCondition)
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: getChipTextColor(eggCondition)
              }}
            >
              {normalizeStatus(eggCondition).replace('-', ' ')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* RIGHT SIDE */}
      <Box flex={1}>
        {/* HEADER */}
        <Box display='flex' justifyContent='space-between'>
          <Box>
            {defaultName && (
              <Typography fontSize={16} fontWeight={600}>
                {defaultName}
              </Typography>
            )}

            {completeName && (
              <Typography
                sx={{
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: theme.palette.text.secondary
                }}
              >
                {completeName}
              </Typography>
            )}
          </Box>

          {status && (
            <Typography fontSize={14} color={theme.palette.text.secondary}>
              {status}
            </Typography>
          )}
        </Box>

        {/* DETAILS */}
        {eggCode && (
          <Typography fontSize={14} fontWeight={500} color={colors.secondaryBg}>
            {eggCode}
          </Typography>
        )}

        {date && (
          <Typography fontSize={14} color={colors.OnSurfaceVariant}>
            {Utility.convertUtcToLocalReadableDate(date)}
          </Typography>
        )}

        {egg_state && (
          <Typography fontSize={14} fontWeight={500} color={colors.secondaryBg}>
            {egg_state}
          </Typography>
        )}

        {batch && (
          <Typography fontSize={14} fontWeight={600}>
            Batch: {batch}
          </Typography>
        )}

        {/* ✅ HATCHED STATUS */}
        {egg_status === 'Hatched' && (
          <Typography fontSize={13} color={theme.palette.success.main}>
            Hatched
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(EggCard)