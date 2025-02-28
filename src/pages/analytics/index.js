import React, { useEffect, useRef, useState } from 'react'
import { Box, Grid, Typography } from '@mui/material'

const videoData = [
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/time_and_count_angel_low_bitrate_1740738461.mp4',
    name: 'Bear Angel Health'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Angel_TrailPath_1740733859.mp4',
    name: 'Bear Angel Trail'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Angel_Heatmap_1740732959.mp4',
    name: 'Bear Angel Heatmap'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/time_and_count_lola_low_bitrate_1740739439.mp4',
    name: 'Bear Lola Health'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Lola_TrailPath_1740733192.mp4',
    name: 'Bear Lola Trail'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Lola_Heatmap_1740733440.mp4',
    name: 'Bear Lola Heatmap'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_HealthActivityStatus_NoRegions_1740732764.mp4',
    name: 'Leopard Health'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_Heatmap_1740734744.mp4',
    name: 'Leopard Heatmap'
  },
  {
    url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_TrailPath_1740735632.mp4',
    name: 'Leopard Trail'
  }
]

const Analytics = () => {
  const [fullscreenVideo, setFullscreenVideo] = useState(null)

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'black',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 1
      }}
    >
      <Grid container spacing={1} sx={{ width: '100%', height: '100%' }}>
        {videoData.map((video, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <VideoTile video={video} onExpand={() => setFullscreenVideo(video)} />
          </Grid>
        ))}
      </Grid>

      {fullscreenVideo && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
          onClick={() => setFullscreenVideo(null)}
        >
          <video
            src={fullscreenVideo.url}
            autoPlay
            loop
            controls
            style={{
              width: '60%',
              height: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </Box>
      )}
    </Box>
  )
}

const VideoTile = ({ video, onExpand }) => {
  const videoRef = useRef(null)
  const [showOverlay, setShowOverlay] = useState(false)
  let timeout

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const showControls = () => {
      vid.controls = true
      setShowOverlay(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        vid.controls = false
        setShowOverlay(false)
      }, 2000)
    }

    vid.addEventListener('mousemove', showControls)
    vid.addEventListener('touchstart', showControls)

    return () => {
      vid.removeEventListener('mousemove', showControls)
      vid.removeEventListener('touchstart', showControls)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: 'black',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer'
      }}
      onClick={onExpand}
    >
      <video
        ref={videoRef}
        src={video.url}
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
      {showOverlay && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px'
          }}
        >
          <Typography variant='caption'>{video.name}</Typography>
        </Box>
      )}
    </Box>
  )
}

export default Analytics

// import React, { useEffect, useRef } from 'react'
// import { Box, Grid } from '@mui/material'

// const videoUrls = [
//   '/Users/antzml/Downloads/Leopard_Heatmap.mp4',
//   '/Users/antzml/Downloads/Leopard_TrailPath.mp4',
//   '/Volumes/Eizen/demo_videos/Bear_Lola_HealthActivityStatus.mp4',
//   '/Volumes/Eizen/demo_videos/time_and_count_combined_video.mp4',
//   '/Users/antzml/Downloads/Leopard_Heatmap.mp4',
//   '/Users/antzml/Downloads/Leopard_TrailPath.mp4',
//   '/Users/antzml/Downloads/Leopard_Heatmap.mp4',
//   '/Users/antzml/Downloads/Leopard_TrailPath.mp4',
//   '/Users/antzml/Downloads/Leopard_Heatmap.mp4'
// ]

// // { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/time_and_count_angel_low_bitrate_1740738461.mp4', name: 'Bear Angel Health' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Angel_TrailPath_1740733859.mp4', name: 'Bear Angel Trail' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Angel_Heatmap_1740732959.mp4', name: 'Bear Angel Heatmap' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/time_and_count_lola_low_bitrate_1740739439.mp4', name: 'Bear Lola Health' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Lola_TrailPath_1740733192.mp4', name: 'Bear Lola Trail' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Lola_Heatmap_1740733440.mp4', name: 'Bear Lola Heatmap' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_HealthActivityStatus_NoRegions_1740732764.mp4', name: 'Leopard Health' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_Heatmap_1740734744.mp4', name: 'Leopard Heatmap' },
// //       { url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_TrailPath_1740735632.mp4', name: 'Leopard Trail' }

// const Analytics = () => {
//   return (
//     <Box
//       sx={{
//         height: '100vh',
//         width: '100vw',
//         overflow: 'hidden',
//         backgroundColor: 'black',
//         p: 1
//       }}
//     >
//       <Grid container spacing={1} sx={{ height: '100%' }}>
//         {videoUrls.map((url, index) => (
//           <Grid item xs={4} key={index} sx={{ height: '33.33%' }}>
//             <Box
//               sx={{
//                 position: 'relative',
//                 overflow: 'hidden',
//                 width: '100%',
//                 height: '100%',
//                 backgroundColor: 'black',
//                 display: 'flex',
//                 justifyContent: 'center',
//                 alignItems: 'center',
//                 borderRadius: '2px'
//               }}
//             >
//               <VideoPlayer src={url} />
//             </Box>
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   )
// }

// const VideoPlayer = ({ src }) => {
//   const videoRef = useRef(null)
//   let timeout

//   useEffect(() => {
//     const video = videoRef.current

//     if (!video) return

//     const showControls = () => {
//       video.controls = true
//       clearTimeout(timeout)
//       timeout = setTimeout(() => {
//         video.controls = false
//       }, 2000)
//     }

//     video.addEventListener('mousemove', showControls)
//     video.addEventListener('touchstart', showControls)

//     return () => {
//       video.removeEventListener('mousemove', showControls)
//       video.removeEventListener('touchstart', showControls)
//       clearTimeout(timeout)
//     }
//   }, [])

//   return (
//     <video
//       ref={videoRef}
//       src={src}
//       autoPlay
//       loop
//       muted
//       playsInline
//       style={{
//         width: '100%',
//         height: '100%',
//         objectFit: 'contain',
//         backgroundColor: 'black'
//       }}
//     />
//   )
// }

// export default Analytics
