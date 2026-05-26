'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Button, Grid, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from 'src/hooks/useAuth'

interface VideoItem {
  url: string
  name: string
}

const AnalyticsPage = () => {
  const { t } = useTranslation()
  const auth = useAuth() as unknown as { userData?: { roles?: { role_name?: string } } } | null
  const [fullscreenVideo, setFullscreenVideo] = useState<VideoItem | null>(null)

  const userRole = auth?.userData?.roles?.role_name

  const videoData: VideoItem[] = [
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/time_and_count_angel_low_bitrate_1740738461.mp4',
      name: t('analytics.bear_angel_health')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Angel_TrailPath_1740733859.mp4',
      name: t('analytics.bear_angel_trail')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Angel_Heatmap_1740732959.mp4',
      name: t('analytics.bear_angel_heatmap')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/time_and_count_lola_low_bitrate_1740739439.mp4',
      name: t('analytics.bear_lola_health')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Lola_TrailPath_1740733192.mp4',
      name: t('analytics.bear_lola_trail')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Bear_Lola_Heatmap_1740733440.mp4',
      name: t('analytics.bear_lola_heatmap')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_HealthActivityStatus_NoRegions_1740732764.mp4',
      name: t('analytics.leopard_health')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_Heatmap_1740734744.mp4',
      name: t('analytics.leopard_heatmap')
    },
    {
      url: 'https://uatapi.antz.ril.com/uploads/extra/ml/2025-02-28/Leopard_TrailPath_1740735632.mp4',
      name: t('analytics.leopard_trail')
    }
  ]

  return (
    <>
      {userRole === 'Super Admin' ? (
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
                size={{ xs: 12, sm: 6, md: 4 }}
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
      ) : (
        <PermissionDenied />
      )}
    </>
  )
}

interface VideoTileProps {
  video: VideoItem
  onExpand: () => void
}

const VideoTile = ({ video, onExpand }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const showControls = () => {
      vid.controls = true
      setShowOverlay(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        vid.controls = false
        setShowOverlay(false)
      }, 2000)
    }

    vid.addEventListener('mousemove', showControls)
    vid.addEventListener('touchstart', showControls)

    return () => {
      vid.removeEventListener('mousemove', showControls)
      vid.removeEventListener('touchstart', showControls)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
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

const PermissionDenied = () => {
  const router = useRouter()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <img alt='error-illustration' src='/images/pages/warning.png' style={{ marginTop: 60, marginBottom: 60 }} />
      <Typography
        variant='h5'
        sx={{ mb: 2.5, fontSize: '24px', fontFamily: 'Inter', fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}
      >
        Permission Denied!
      </Typography>
      <Typography variant='body2' sx={{ fontSize: '16px', fontFamily: 'Inter', fontWeight: 400, mb: 2 }}>
        You don't have access to view this request.
      </Typography>
      <Button onClick={() => router.back()} variant='contained' sx={{ px: 5.5, mt: 2 }}>
        Go Back
      </Button>
    </Box>
  )
}

export default AnalyticsPage
