import React from 'react'
import { Box, Card, CardContent, Typography, Grid, useTheme, CircularProgress } from '@mui/material'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const RoomAnalytics = ({ isRoomStatsLoading, roomDetails }) => {
  const theme = useTheme()

  const StatBox = ({ label, value }) => (
    <Box>
      <Typography
        sx={{
          color: theme.palette.customColors.neutralSecondary,
          fontSize: '0.875rem'
        }}
      >
        {label}
      </Typography>
      {isRoomStatsLoading ? (
        <CircularProgress size={20} />
      ) : (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 500,
            fontSize: '1rem'
          }}
        >
          {value ?? '-'}
        </Typography>
      )}
    </Box>
  )

  return (
    <Card
      sx={{
        borderRadius: '8px',
        boxShadow: 'none',
        backgroundColor: theme.palette.customColors.Surface
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Grid container spacing={6} alignItems='center'>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Typography
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '0.875rem'
              }}
            >
              Room Name
            </Typography>
            {isRoomStatsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <TextEllipsisWithModal
                enableDialog={false}
                text={roomDetails?.room_name ?? '-'}
                style={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '1rem',
                  fontWeight: 500,
                  maxWidth: '100%'
                }}
              />
            )}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3.5 }}>
            <Typography
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '0.875rem'
              }}
            >
              Hospital Name
            </Typography>
            {isRoomStatsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <TextEllipsisWithModal
                enableDialog={false}
                text={roomDetails?.hospital_name ?? '-'}
                style={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '1rem',
                  fontWeight: 500,
                  maxWidth: '100%'
                }}
              />
            )}
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
            <StatBox label='Total beds' value={roomDetails?.no_of_bed ?? '-'} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 1.2 }}>
            <StatBox label='Occupied' value={roomDetails?.no_of_occupied ?? '-'} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 1.1 }}>
            <StatBox label='Floor' value={roomDetails?.floor_name ?? '-'} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.7 }}>
            {isRoomStatsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <UserAvatarDetails
                user_name={roomDetails?.updated_by ? roomDetails?.updated_by_name : roomDetails?.created_by_name ?? '-'}
                date={roomDetails?.updated_by ? roomDetails?.updated_at : roomDetails?.created_at ?? '-'}
                show_time={false}
                size='medium'
                profile_image={
                  roomDetails?.updated_by ? roomDetails?.updated_user_profile_pic : roomDetails?.profile_pic ?? '-'
                }
                dateType={roomDetails?.updated_by ? 'updated' : 'created'}
              />
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default RoomAnalytics
