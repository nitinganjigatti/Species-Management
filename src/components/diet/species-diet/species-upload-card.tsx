import React from 'react'
import { Avatar, LinearProgress, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'

export const SpeciesDietUploadingCard = ({ uploadingFileName = '' }: { uploadingFileName?: string }) => {
  const theme = useTheme()

  return (
  <Box sx={{}}>
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #C3CEC7',
        display: 'flex',
        gap: 1,
        padding: '20px 16px'
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 48,
              height: 48,
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            <img style={{ width: '100%', height: '100%' }} src={'/icons/files_green.png'} alt='Profile' />
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography
              sx={{
                color: theme.palette.primary.light,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: 240
              }}
            >
              Uploading
            </Typography>
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: '400',
                lineHeight: '16.94px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: 240
              }}
            >
              {uploadingFileName}
            </Typography>
            <LinearProgress value={50} />
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
  )
}

/* <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
                    <Typography
                      sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}
                    >
                      {Number(item?.file_size) >= 1048576
                        ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
                        : (item?.file_size / 1024).toFixed(2) + ' KB'}
                    </Typography>
                  </Box> */

// attach:-
// backgroundColor:'#fff'
// deattach:-
// backgroundColor:'#DAE7DF'

// const DietDetachedCard = ({ item }) => (
//   <Box
//     sx={{
//       boxShadow: '0px 2px 2px 0px #0000001A',
//       backgroundColor: '#DAE7DF',
//       borderRadius: '8px',
//       display: 'flex',
//       justifyContent: 'space-between',
//       gap: 1,
//       cursor: 'pointer',
//       padding: '20px 16px'
//     }}
//     onClick={() => {
//       window.open(item.file, '_blank')
//     }}
//   >
//     <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
//       <Box sx={{ width: '100%', display: 'flex', alignItems: 'start', gap: '8px' }}>
//         <Avatar
//           variant='rounded'
//           alt='Medicine Image'
//           sx={{
//             pt: '6px',
//             width: 48,
//             height: 48,
//             background: '#FFD3D34D',
//             overflow: 'hidden'
//           }}
//         >
//           <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_icon2.svg'} alt='Profile' />
//         </Avatar>

//         <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//           <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
//             <Tooltip title={item?.file_original_name ? item?.file_original_name : '-'}>
//               <Typography
//                 sx={{
//                   color: theme.palette.customColors.OnSurfaceVariant,
//                   fontSize: '16px',
//                   fontWeight: '500',
//                   lineHeight: '19.36px',
//                   overflow: 'hidden',
//                   textOverflow: 'ellipsis',
//                   whiteSpace: 'nowrap',
//                   width: 240
//                 }}
//               >
//                 {item?.file_original_name}
//               </Typography>
//             </Tooltip>
//           </Box>
//           <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <Avatar
//               variant='rounded'
//               alt='dietitian_by_profile'
//               sx={{
//                 width: 24,
//                 height: 24,
//                 borderRadius: '50%',
//                 background: '#E8F4F2',
//                 overflow: 'hidden'
//               }}
//             >
//               {item?.dietitian_by_profile ? (
//                 <img style={{ width: '100%', height: '100%' }} src={item?.dietitian_by_profile} alt='Profile' />
//               ) : (
//                 <Icon icon='mdi:user' />
//               )}
//             </Avatar>

//             <Tooltip title={item?.dietitian_name ? item?.dietitian_name : '-'}>
//               <Typography
//                 sx={{
//                   color: theme.palette.customColors.OnSurfaceVariant,
//                   fontSize: '14px',
//                   fontWeight: '500',
//                   lineHeight: '100%',
//                   letterSpacing: '0.1px',
//                   overflow: 'hidden',
//                   textOverflow: 'ellipsis',
//                   whiteSpace: 'nowrap',
//                   maxWidth: 100
//                 }}
//               >
//                 {item?.dietitian_name ? item?.dietitian_name : '-'}
//               </Typography>
//             </Tooltip>

//             <Typography
//               sx={{
//                 color: theme.palette.customColors.Outline,
//                 fontSize: '14px',
//                 fontWeight: '500',
//                 lineHeight: '100%',
//                 letterSpacing: '0.1px'
//               }}
//             >
//               &#8226; Dietitian
//             </Typography>
//           </Box>
//           {item?.notes && (
//             <Typography
//               sx={{
//                 color: theme.palette.customColors.OnSurfaceVariant,
//                 fontSize: '14px',
//                 fontWeight: '400',
//                 lineHeight: '20px',
//                 letterSpacing: '0%'
//               }}
//             >
//               {item?.notes}
//             </Typography>
//           )}
//           <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//             <Typography
//               sx={{
//                 color: theme.palette.customColors.Outline,
//                 fontSize: '10px',
//                 fontWeight: '500',
//                 lineHeight: '100%',
//                 letterSpacing: '0%'
//               }}
//             >
//               Updated by&nbsp; •
//             </Typography>
//             <Tooltip title={item?.detached_by ? item?.detached_by : '-'}>
//               <Typography
//                 sx={{
//                   color: theme.palette.primary.light,
//                   fontSize: '12px',
//                   fontWeight: '400',
//                   lineHeight: '100%',
//                   letterSpacing: '0%',
//                   overflow: 'hidden',
//                   textOverflow: 'ellipsis',
//                   whiteSpace: 'nowrap',
//                   maxWidth: 100
//                 }}
//               >
//                 {item?.detached_by}
//               </Typography>
//             </Tooltip>
//             <Typography
//               sx={{
//                 color: theme.palette.customColors.neutralSecondary,
//                 fontSize: '12px',
//                 fontWeight: '400',
//                 lineHeight: '14.52px',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 whiteSpace: 'nowrap'
//               }}
//             >
//               •&nbsp; {moment(Utility.convertUTCToLocalDate(item.modified_at)).format('DD MMM YYYY')}
//             </Typography>
//             <Typography
//               sx={{
//                 color: theme.palette.customColors.neutralSecondary,
//                 fontSize: '12px',
//                 fontWeight: '400',
//                 lineHeight: '14.52px',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 whiteSpace: 'nowrap'
//               }}
//             >
//               •&nbsp; {Utility.convertUTCToLocaltime(item.modified_at)}
//             </Typography>
//           </Box>
//         </Box>
//       </Box>
//       <Box>
//         <Switch
//           onClick={e => {
//             e.stopPropagation()
//             setDietAttachmentId(item.attachment_id)
//             speciesAttachmentActiveFunc(speciesId, dietAttachmentId)
//           }}
//         />
//       </Box>
//     </Box>
//   </Box>
// )

// const DietAttachedCard = ({ item }) => {
//   return (
//     <Box>
//       <Box
//         sx={{
//           boxShadow: '0px 2px 2px 0px #0000001A',
//           backgroundColor: '#fff',
//           borderRadius: '8px',
//           display: 'flex',
//           gap: 1,
//           cursor: 'pointer',
//           padding: '20px 16px'
//         }}
//         onClick={() => {
//           window.open(item.file, '_blank')
//         }}
//       >
//         <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
//           <Box sx={{ width: '100%', display: 'flex', alignItems: 'start', gap: '8px' }}>
//             <Avatar
//               variant='rounded'
//               alt='Medicine Image'
//               sx={{
//                 pt: '6px',
//                 width: 48,
//                 height: 48,
//                 background: '#FFD3D34D',
//                 overflow: 'hidden'
//               }}
//             >
//               <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_icon2.svg'} alt='Profile' />
//             </Avatar>

//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//               <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
//                 <Tooltip title={item?.file_original_name ? item?.file_original_name : '-'}>
//                   <Typography
//                     sx={{
//                       color: theme.palette.customColors.OnSurfaceVariant,
//                       fontSize: '16px',
//                       fontWeight: '500',
//                       lineHeight: '19.36px',
//                       overflow: 'hidden',
//                       textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap',
//                       width: 240
//                     }}
//                   >
//                     {item?.file_original_name}
//                   </Typography>
//                 </Tooltip>

//                 {/* <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
//                       <Typography
//                         sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}
//                       >
//                         {Number(item?.file_size) >= 1048576
//                           ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
//                           : (item?.file_size / 1024).toFixed(2) + ' KB'}
//                       </Typography>
//                     </Box> */}
//               </Box>
//               <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <Avatar
//                   variant='rounded'
//                   alt='dietitian_by_profile'
//                   sx={{
//                     width: 24,
//                     height: 24,
//                     borderRadius: '50%',
//                     background: '#E8F4F2',
//                     overflow: 'hidden'
//                   }}
//                 >
//                   {item?.dietitian_by_profile ? (
//                     <img style={{ width: '100%', height: '100%' }} src={item?.dietitian_by_profile} alt='Profile' />
//                   ) : (
//                     <Icon icon='mdi:user' />
//                   )}
//                 </Avatar>

//                 <Tooltip title={item?.dietitian_name ? item?.dietitian_name : '-'}>
//                   <Typography
//                     sx={{
//                       color: theme.palette.customColors.OnSurfaceVariant,
//                       fontSize: '14px',
//                       fontWeight: '500',
//                       lineHeight: '100%',
//                       letterSpacing: '0.1px',
//                       overflow: 'hidden',
//                       textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap',
//                       maxWidth: 100
//                     }}
//                   >
//                     {item?.dietitian_name ? item?.dietitian_name : '-'}
//                   </Typography>
//                 </Tooltip>

//                 {/* <Tooltip title={item?.attached_by ? item?.attached_by : '-'}> */}
//                 <Typography
//                   sx={{
//                     color: theme.palette.customColors.Outline,
//                     fontSize: '14px',
//                     fontWeight: '500',
//                     lineHeight: '100%',
//                     letterSpacing: '0.1px'
//                     // overflow: 'hidden',
//                     // textOverflow: 'ellipsis',
//                     // whiteSpace: 'nowrap',
//                     // maxWidth: 100
//                   }}
//                 >
//                   &#8226; Dietitian
//                 </Typography>
//                 {/* </Tooltip> */}
//               </Box>
//               {item?.notes && (
//                 <Typography
//                   sx={{
//                     color: theme.palette.customColors.OnSurfaceVariant,
//                     fontSize: '14px',
//                     fontWeight: '400',
//                     lineHeight: '20px',
//                     letterSpacing: '0%'
//                   }}
//                 >
//                   {item?.notes}
//                 </Typography>
//               )}
//               <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                 <Typography
//                   sx={{
//                     color: theme.palette.customColors.Outline,
//                     fontSize: '10px',
//                     fontWeight: '500',
//                     lineHeight: '100%',
//                     letterSpacing: '0%'
//                   }}
//                 >
//                   Uploaded by&nbsp; •
//                 </Typography>
//                 <Tooltip title={item?.attached_by ? item?.attached_by : '-'}>
//                   <Typography
//                     sx={{
//                       color: theme.palette.primary.light,
//                       fontSize: '12px',
//                       fontWeight: '400',
//                       lineHeight: '100%',
//                       letterSpacing: '0%',
//                       overflow: 'hidden',
//                       textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap',
//                       maxWidth: 100
//                     }}
//                   >
//                     {item?.attached_by}
//                   </Typography>
//                 </Tooltip>
//                 <Typography
//                   sx={{
//                     color: theme.palette.customColors.neutralSecondary,
//                     fontSize: '12px',
//                     fontWeight: '400',
//                     lineHeight: '14.52px',
//                     overflow: 'hidden',
//                     textOverflow: 'ellipsis',
//                     whiteSpace: 'nowrap'
//                   }}
//                 >
//                   •&nbsp; {moment(Utility.convertUTCToLocalDate(item.modified_at)).format('DD MMM YYYY')}
//                 </Typography>
//                 <Typography
//                   sx={{
//                     color: theme.palette.customColors.neutralSecondary,
//                     fontSize: '12px',
//                     fontWeight: '400',
//                     lineHeight: '14.52px',
//                     overflow: 'hidden',
//                     textOverflow: 'ellipsis',
//                     whiteSpace: 'nowrap'
//                   }}
//                 >
//                   •&nbsp; {Utility.convertUTCToLocaltime(item.modified_at)}
//                 </Typography>
//               </Box>
//             </Box>
//           </Box>
//           <Box>
//             <Switch
//               onClick={e => {
//                 e.stopPropagation()
//                 removeAttachment(speciesId, item?.attachment_id)
//               }}
//               defaultChecked
//             />
//           </Box>
//         </Box>
//       </Box>
//       {/* <Typography sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}>
//             {Number(item?.file_size) >= 1048576
//               ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
//               : (item?.file_size / 1024).toFixed(2) + ' KB'}
//           </Typography> */}
//     </Box>
//   )
// }
