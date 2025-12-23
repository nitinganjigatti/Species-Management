import { Typography, Box, Avatar, Tooltip, Skeleton } from '@mui/material'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import { format, formatDistanceToNow } from 'date-fns'
import { useTheme } from '@emotion/react'
import moment from 'moment'
import { useState } from 'react'

export const getEllipsisStyleForText = width => {
  return {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: width ? `${width}px` : '250px',
    display: 'inline-block',
    lineHeight: 'normal',
    textAlign: 'center',
    verticalAlign: 'middle'
  }
}

export const renderControlLabel = (condition, label) =>
  condition ? (
    <Typography
      component='span'
      sx={{
        height: '16px',
        width: '18px',
        backgroundColor: 'error.main',
        fontWeight: 'bold',
        fontSize: '10px',
        color: 'white',
        padding: '2px',
        borderRadius: '2px',
        lineHeight: '12px',
        textAlign: 'center',
        mr: 1,
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    >
      {label}
    </Typography>
  ) : null

export const pageTitle = title => (
  <Box
    sx={{
      fontSize: { xs: '20px', md: '24px' },
      fontFamily: 'Inter',
      fontWeight: 500,
      ml: 1
    }}
  >
    {title}
  </Box>
)

export function renderUserAvatarDetails({
  profile_image,
  user_name,
  date,
  text_color,
  description,
  crby_width,
  size = 'large',
  show_time = false
}) {
  const avatarSizes = {
    small: {
      profile_picture: { width: '24px', height: '24px' },
      gap: '8px',
      user_name: { fontSize: '12px', fontWeight: 500 },
      date: { fontSize: '10px', fontWeight: 500 }
    },
    medium: {
      profile_picture: { width: '32px', height: '32px' },
      gap: '8px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '12px', fontWeight: 400, lineHeight: '14px' }
    },
    large: {
      profile_picture: { width: '40px', height: '40px' },
      gap: '12px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '12px', fontWeight: 400, lineHeight: '21px' }
    }
  }
  const selectedAvatarSize = avatarSizes[size] || avatarSizes[size]

  return (
    <>
      {user_name ? (
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'default' }}>
          {profile_image ? (
            <CustomAvatar
              src={profile_image}
              sx={{
                mr: avatarSizes[size].gap,
                ...(selectedAvatarSize?.profile_picture || {})
              }}
            />
          ) : (
            <CustomAvatar
              sx={{
                mr: avatarSizes[size].gap,
                ...(selectedAvatarSize?.profile_picture || {})
              }}
            ></CustomAvatar>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {user_name && (
              <>
                <Tooltip title={user_name}>
                  <Typography
                    variant='subtitle2'
                    sx={{
                      color: text_color ?? 'text.primary',

                      // fontSize: fontSize,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: crby_width ? crby_width : 100,
                      ...(selectedAvatarSize?.user_name || {})
                    }}

                    // component={'span'}
                  >
                    {user_name ? user_name : 'NA'}
                  </Typography>
                </Tooltip>

                {description && (
                  <>
                    <Tooltip title={description}>
                      <Typography sx={{ color: theme => text_color ?? theme.palette.common.white }} variant='body2'>
                        {description}
                      </Typography>
                    </Tooltip>
                  </>
                )}
              </>
            )}

            {date && (
              <Typography variant='caption' sx={{ lineHeight: 1.6667, ...(selectedAvatarSize?.date || {}) }}>
                <span>
                  {date ? (
                    <>
                      {Utility.convertUtcToLocalReadableDate(date)}
                      <span> &bull; </span>
                    </>
                  ) : (
                    ''
                  )}
                </span>
                <span>{show_time ? Utility.convertUTCToLocaltime(date) : ''}</span>
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Typography variant='subtitle2' sx={{ color: 'text.primary', ml: 3, cursor: 'default' }}>
          -
        </Typography>
      )}
    </>
  )
}

export function getPriorityIcons(priority) {
  if (priority === 'high') {
    return (
      <Box>
        <Avatar src={'/images/High_Priority.png'} style={{ width: '24px', height: '24px' }} />
      </Box>
    )
  } else if (priority === 'emergency') {
    return (
      <Box>
        <Avatar src={'/images/Emergency.png'} style={{ width: '24px', height: '24px' }} />
      </Box>
    )
  } else return null
}

export const attachedFiles = args => {
  const {
    control_substance = '0',
    icon = 'material-symbols:attachment',
    iconStyle = {},
    fontStyle = {},
    prescriptionFile = ''
  } = args

  const hasControlSubstance = control_substance == '1'

  return (
    <>
      {hasControlSubstance ? (
        <Box
          onClick={() => {
            window.open(prescriptionFile, '_blank')
          }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '2px',
            textAlign: 'center'
          }}
        >
          <Icon style={{ fontSize: '20px', color: 'customColors.neutral_50', ...iconStyle }} icon={icon} />
          <Typography
            sx={{
              color: 'text.primary',
              ...fontStyle
            }}
          >
            prescription
          </Typography>
        </Box>
      ) : null}
    </>
  )
}

export const getToolTipForText = text => {
  return (
    <>
      {text && (
        <Tooltip title={text} arrow>
          <span>{text}</span>
        </Tooltip>
      )}
    </>
  )
}

// export const CellInfo = ({ value, subtitle, imgUrl, avatarUrl, inchagename }) => {
//   const theme = useTheme()

//   return (
//     <Box display='flex' alignItems='center' gap={2} width='100%'>
//       {/* Image or fallback avatar */}
//       {imgUrl ? (
//         <Box
//           component='img'
//           src={imgUrl}
//           alt={value}
//           sx={{
//             width: 40,
//             height: 40,
//             borderRadius: 1,
//             // objectFit: 'cover',
//             mr: 1
//           }}
//         />
//       ) : (
//         <Avatar
//           variant='square'
//           sx={{
//             width: 40,
//             height: 40,
//             borderRadius: 1,
//             fontSize: 14,
//             bgcolor: theme.palette.primary.main
//           }}
//         >
//           {value?.charAt(0).toUpperCase() || '?'}
//         </Avatar>
//       )}

//       <Box display='flex' flexDirection='column' overflow='hidden'>
//         {/* Title */}
//         <Typography
//           noWrap
//           sx={{
//             fontSize: '16px',
//             fontWeight: 500,
//             color: theme.palette.customColors.OnSurfaceVariant
//           }}
//         >
//           {value}
//         </Typography>

//         {/* Subtitle */}
//         {subtitle && (
//           <Typography
//             noWrap
//             sx={{
//               fontSize: '14px',
//               fontWeight: 400,
//               color: theme.palette.customColors.OnSurfaceVariant
//             }}
//           >
//             {subtitle}
//           </Typography>
//         )}

//         {/* Incharge section */}
//         {inchagename && (
//           <Box display='flex' alignItems='center' gap={1} mt={0.5}>
//             {avatarUrl ? (
//               <Avatar src={avatarUrl} sx={{ width: 20, height: 20, fontSize: 12 }} />
//             ) : (
//               <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>{inchagename.charAt(0).toUpperCase()}</Avatar>
//             )}
//             <Typography
//               noWrap
//               sx={{
//                 fontSize: '14px',
//                 fontWeight: 400,
//                 color: theme.palette.customColors.OnSurfaceVariant
//               }}
//             >
//               {inchagename}
//             </Typography>
//           </Box>
//         )}
//       </Box>
//     </Box>
//   )
// }

export const CellInfo = ({
  value,
  subtitle,
  color,
  subtitleColor,
  imgUrl,
  avatarUrl,
  inchagename,
  defaultImage,
  defaultImageAlt,
  objectFit = 'cover'
}) => {
  const theme = useTheme()

  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const showSkeleton = imgUrl && !imgLoaded && !imgError
  const hasExtraInfo = subtitle || inchagename

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        width: '100%'
      }}
    >
      {/* Thumbnail Image */}
      {imgUrl && !imgError ? (
        <>
          {showSkeleton && <Skeleton variant='rectangular' width={40} height={40} sx={{ borderRadius: '4px' }} />}
          {/* <Box sx={{ padding: 2, backgroundColor: theme.palette.customColors.displaybgSecondary, borderRadius: '4px' }}> */}
          <Box
            component='img'
            src={imgUrl}
            alt={value}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '4px',
              display: imgLoaded ? 'block' : 'none'
            }}
          />
          {/* </Box> */}
        </>
      ) : (
        <Avatar
          variant='square'
          src={defaultImage}
          alt={defaultImageAlt}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '4px',
            fontSize: 18,
            bgcolor: theme.palette.customColors.displaybgSecondary,
            p: '6px'

            // color: theme.palette.customColors.OnPrimaryContainer
          }}
          slotProps={{
            img: {
              style: {
                objectFit: objectFit // e.g. 'cover', 'contain', etc.
              }
            }
          }}
        />
      )}
      {/* Text Info */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          alignSelf: hasExtraInfo ? 'flex-start' : 'center',
          mt: hasExtraInfo ? 0.25 : 0
        }}
      >
        {value && (
          <Tooltip title={value}>
            <Typography
              sx={{
                fontSize: '16px',
                ml: 1,

                // fontWeight: 600,
                color: color ?? theme.palette.text.primary,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: subtitle ? 1 : 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                maxWidth: '100%'
              }}
            >
              {value}
            </Typography>
          </Tooltip>
        )}

        {subtitle && (
          <>
            <Tooltip title={subtitle}>
              <Typography
                noWrap
                sx={{
                  fontSize: '14px',
                  ml: 1,
                  fontWeight: 400,
                  color: subtitleColor ?? theme.palette.text.secondary
                }}
              >
                {subtitle}
              </Typography>
            </Tooltip>
          </>
        )}

        {inchagename && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5
            }}
          >
            <Avatar
              src={avatarUrl}
              sx={{
                width: 18,
                height: 18,
                fontSize: 11,
                ml: 1,
                bgcolor: theme.palette.grey[200],
                color: theme.palette.text.primary
              }}
            >
              {!avatarUrl && inchagename.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              noWrap
              sx={{
                fontSize: '13px',
                ml: 1,
                fontWeight: 400,
                color: theme.palette.text.secondary
              }}
            >
              {inchagename}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export const DateInfoDisplay = ({ date }) => {
  const theme = useTheme()

  if (!date) return null

  const parsedDate = moment(date)
  const now = moment()

  // Calculate difference in months (integer)
  const monthsDiff = now.diff(parsedDate, 'months')

  // Move parsedDate forward by monthsDiff months to calculate remaining diff
  const datePlusMonths = parsedDate.clone().add(monthsDiff, 'months')

  // Calculate remaining difference in milliseconds
  const remainingMs = now.diff(datePlusMonths)

  // Convert remainingMs to duration for days, hours, minutes
  const duration = moment.duration(remainingMs)

  const days = duration.days()
  const hours = duration.hours()
  const minutes = duration.minutes()

  // Format the discovered date as per your requirement
  const formattedDateRaw = parsedDate.format('DD MMM YYYY • hh:mm A')

  const formattedDate = formattedDateRaw.replace(
    /([A-Za-z]{3})/,
    match => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default'
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          color: theme.palette.customColors.OnSurfaceVariant,
          fontWeight: 400
        }}
      >
        {/* Display difference like "about 1 month, 12 days, 6 hours, 30 minutes ago" */}
        {`About ${monthsDiff} month${monthsDiff !== 1 ? 's' : ''} ago`}
      </Typography>
      <Typography
        sx={{
          fontSize: '14px',
          color: theme.palette.customColors.OnSurfaceVariant,
          fontWeight: 400
        }}
      >
        {formattedDate}
      </Typography>
    </Box>
  )
}

// export const DateInfoDisplay = ({ title, date, showRelativeTime = false }) => {
//   const theme = useTheme()

//   if (!date) return null

//   const parsedDate = new Date(date)
//   const formattedDate = format(parsedDate, 'dd MMM yyyy • hh:mm a').toUpperCase()
//   const relativeTime = showRelativeTime ? formatDistanceToNow(parsedDate, { addSuffix: true }) : null

//   return (
//     <Box display='flex' flexDirection='column'>
//       {title && (
//         <Typography
//           sx={{
//             fontSize: '14px',
//             color: theme.palette.customColors.OnSurfaceVariant,
//             fontWeight: 500
//           }}
//         >
//           {title}
//         </Typography>
//       )}
//       <Typography
//         sx={{
//           fontSize: showRelativeTime ? '14px' : '12px',
//           color: theme.palette.customColors.OnSurfaceVariant,
//           fontWeight: 400
//         }}
//       >
//         {showRelativeTime ? relativeTime : formattedDate}
//       </Typography>
//       {showRelativeTime && (
//         <Typography
//           sx={{
//             fontSize: '14px',
//             color: theme.palette.customColors.OnSurfaceVariant,
//             fontWeight: 400
//           }}
//         >
//           {formattedDate}
//         </Typography>
//       )}
//     </Box>
//   )
// }

export const IdentifierInfoCard = ({ animalId, total, localIdentifierName, localIdentifierValue }) => {
  const theme = useTheme()

  return (
    <Box sx={{ cursor: 'default' }}>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '16px',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        AAID : {`${animalId}/${total}`}
      </Typography>

      {/* {localIdentifierName && (
        <Typography
          sx={{
            fontSize: '12px',
            color: theme.palette.customColors.secondaryBg
          }}
        >
          {localIdentifierName} : {localIdentifierValue}
        </Typography>
      )} */}
    </Box>
  )
}

export const GenderInfoCard = ({ value, bgcolor, color }) => {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.5,
        width: '48px',
        height: '25px',
        cursor: 'default',
        borderRadius: '4px',
        bgcolor: bgcolor, // light gray-green
        color: color, // maroonish-red
        fontSize: '14px',
        fontWeight: 600,
        display: 'inline-block',
        textAlign: 'center',
        minWidth: 40
      }}
    >
      {value}
    </Box>
  )
}

export const renderPrescriptionLabel = (condition, label) =>
  condition ? (
    <Typography
      component='span'
      sx={{
        height: '16px',
        width: '18px',

        // backgroundColor: 'success.main',
        background: 'linear-gradient(116.5deg, #00D6C9 8.77%, #37BD69 101.99%)',
        fontWeight: 'bold',
        fontSize: '10px',
        color: 'white',
        padding: '2px',
        borderRadius: '2px',
        lineHeight: '12px',
        textAlign: 'center',
        mr: 1,
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    >
      {label}
    </Typography>
  ) : null

const RenderUtility = {
  getEllipsisStyleForText,
  renderControlLabel,
  pageTitle,
  renderUserAvatarDetails,
  getPriorityIcons,
  attachedFiles,
  getToolTipForText,
  GenderInfoCard,
  CellInfo,
  DateInfoDisplay,
  IdentifierInfoCard,
  renderPrescriptionLabel
}

export default RenderUtility
