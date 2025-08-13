// import React, { useMemo } from 'react'
// import { Card, CardMedia, CardContent, Tooltip, Typography, Box } from '@mui/material'
// import Image from 'next/image'
// import { useAuth } from 'src/hooks/useAuth'

// const MediaCard = ({ media, isBorderedCard = false }) => {
//   const fileExt = media?.file?.split('.').pop()?.toLowerCase()
//   const auth = useAuth()

//   const imgPath = useMemo(() => auth?.userData?.settings?.DEFAULT_IMAGE_MASTER, [auth])

//   const getIconByFileType = fileName => {
//     const ext = fileName.split('.').pop().toLowerCase()
//     if (['pdf'].includes(ext)) return imgPath.pdf
//     if (['xls', 'xlsx'].includes(ext)) return imgPath.xls
//     if (['doc', 'docx'].includes(ext)) return imgPath.document
//     if (['mp3', 'wav', 'ogg'].includes(ext)) return imgPath.audio

//     return imgPath.default
//   }

//   const formattedDate = media?.created_at
//     ? new Date(media.created_at).toLocaleString(undefined, {
//       dateStyle: 'medium',
//       timeStyle: 'short'
//     })
//     : ''

//   return (
//     <Card
//       sx={theme => ({
//         height: '100%',
//         bgcolor: theme.palette.common.white,
//         position: 'relative',
//         border: isBorderedCard && `1px solid ${theme.palette.grey[300]}`, // For bordered card
//         boxShadow: isBorderedCard && 'none' // default shadow
//       })}
//     >
//       <Box sx={{ display: 'flex', alignItems: 'center', px: '1rem', pt: '1.5rem' }}>
//         <Tooltip title={media?.file_original_name} arrow>
//           <Typography
//             variant='subtitle2'
//             sx={{
//               ml: 2,
//               mb: 0,
//               whiteSpace: 'nowrap',
//               overflow: 'hidden',
//               textOverflow: 'ellipsis',
//               maxWidth: 180
//             }}
//           >
//             {media?.file_original_name}
//           </Typography>
//         </Tooltip>
//       </Box>

//       {['jpeg', 'jpg', 'gif', 'png', 'svg'].includes(fileExt) ? (
//         <CardMedia
//           component='img'
//           height='160'
//           image={media?.file}
//           sx={{ objectFit: 'cover', borderRadius: 2.6, p: 5 }}
//         />
//       ) : ['mp4', 'mov'].includes(fileExt) ? (
//         <CardMedia
//           component='video'
//           controls
//           height='160'
//           src={media?.file}
//           sx={{ objectFit: 'cover', borderRadius: 2.6, p: 5 }}
//         />
//       ) : (
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             height: 120,
//             borderRadius: 1,
//             bgcolor: getIconByFileType(media?.file_original_name)?.bg_color,
//             m: 5
//           }}
//         >
//           <Image src={getIconByFileType(media?.file_original_name)?.image_path} alt='' width={80} height={160} />
//         </Box>
//       )}

//       {/* Timestamp at bottom right */}
//       <Typography
//         variant='caption'
//         sx={{
//           color: 'text.secondary',
//           fontSize: '0.75rem',
//           px: 5,
//         }}
//       >
//         {formattedDate}
//       </Typography>
//     </Card>
//   )
// }

// export default React.memo(MediaCard)

import React, { useMemo } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import {
  Description,
  AudioFile,
  VideoFile,
  Image as ImageIcon,
  PictureAsPdf,
  InsertDriveFile
} from '@mui/icons-material';

const MediaCard = ({ media, isBorderedCard = false }) => {
  const fileExt = media?.file_original_name?.split('.').pop()?.toLowerCase() || '';

  // Use the type or file_type from your API response
  const apiMediaType = media?.type || media?.file_type;

  const mediaType = useMemo(() => {
    // First check if API provides the type directly
    if (apiMediaType) {
      if (apiMediaType === 'image') return 'image';
      if (apiMediaType === 'video') return 'video';
      if (apiMediaType === 'document') return 'document';
      if (apiMediaType === 'audio') return 'audio';
    }

    // Fallback to file extension detection
    if (['jpeg', 'jpg', 'gif', 'png', 'svg', 'webp'].includes(fileExt)) {
      return 'image';
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExt)) {
      return 'video';
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileExt)) {
      return 'document';
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(fileExt)) {
      return 'audio';
    }

    return 'unknown';
  }, [fileExt, apiMediaType]);

  const getDocumentIcon = () => {
    const iconProps = { sx: { fontSize: 48 } };

    if (['pdf'].includes(fileExt)) {
      return <PictureAsPdf {...iconProps} sx={{ ...iconProps.sx, color: '#d32f2f' }} />;
    }
    if (['doc', 'docx'].includes(fileExt)) {
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#1976d2' }} />;
    }
    if (['xls', 'xlsx'].includes(fileExt)) {
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#388e3c' }} />;
    }
    if (['ppt', 'pptx'].includes(fileExt)) {
      return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#f57c00' }} />;
    }

    return <InsertDriveFile {...iconProps} sx={{ ...iconProps.sx, color: '#757575' }} />;
  };

  const getDocumentBgColor = () => {
    if (['pdf'].includes(fileExt)) return '#ffebee';
    if (['doc', 'docx'].includes(fileExt)) return '#e3f2fd';
    if (['xls', 'xlsx'].includes(fileExt)) return '#e8f5e8';
    if (['ppt', 'pptx'].includes(fileExt)) return '#fff3e0';

    return '#f5f5f5';
  };

  const formattedDate = media?.created_at
    ? new Date(media.created_at).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
    : '';

  const renderMediaContent = () => {
    switch (mediaType) {
      case 'image':
        return (
          <CardMedia
            component="img"
            height="160"
            image={media.file}
            alt={media.file_original_name}
            sx={{
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.fallback-icon');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        );

      case 'video':
        return (
          <Box sx={{ height: 160, bgcolor: '#000' }}>
            <video
              src={media.file}
              controls
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        );

      case 'document':
        return (
          <Box
            sx={{
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: getDocumentBgColor(),
              borderRadius: 1
            }}
          >
            {getDocumentIcon()}
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'text.secondary'
              }}
            >
              {fileExt}
            </Typography>
          </Box>
        );

      case 'audio':
        return (
          <Box
            sx={{
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f3e5f5',
              borderRadius: 1
            }}
          >
            <AudioFile sx={{ fontSize: 48, color: '#7b1fa2' }} />
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#7b1fa2'
              }}
            >
              Audio
            </Typography>
            <Box sx={{ mt: 2, width: '80%' }}>
              <audio
                src={media.file}
                controls
                style={{ width: '100%' }}
                preload="metadata"
              >
                Your browser does not support the audio tag.
              </audio>
            </Box>
          </Box>
        );

      default:
        return (
          <Box
            sx={{
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              borderRadius: 1
            }}
          >
            <InsertDriveFile sx={{ fontSize: 48, color: '#757575' }} />
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'text.secondary'
              }}
            >
              Unknown
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with filename and icon */}
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mediaType === 'image' && <ImageIcon sx={{ fontSize: 16, color: '#1976d2' }} />}
          {mediaType === 'video' && <VideoFile sx={{ fontSize: 16, color: '#d32f2f' }} />}
          {mediaType === 'document' && <Description sx={{ fontSize: 16, color: '#388e3c' }} />}
          {mediaType === 'audio' && <AudioFile sx={{ fontSize: 16, color: '#7b1fa2' }} />}

          <Tooltip title={media.file_original_name} arrow>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}
            >
              {media.file_original_name}
            </Typography>
          </Tooltip>
        </Box>
      </CardContent>

      {/* Media content */}
      <Box sx={{ flex: 1, px: 4, py: 4 }}>
        {renderMediaContent()}

        {/* Fallback icon for failed images */}
        {mediaType === 'image' && (
          <Box
            className="fallback-icon"
            sx={{
              height: 160,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5'
            }}
          >
            <ImageIcon sx={{ fontSize: 80, color: '#bdbdbd' }} />
          </Box>
        )}
      </Box>

      {/* Footer with timestamp */}
      <CardContent sx={{ pt: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem'
          }}
        >
          {formattedDate}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default React.memo(MediaCard);
