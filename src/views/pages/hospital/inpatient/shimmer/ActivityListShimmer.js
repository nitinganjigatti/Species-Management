import React from 'react'
import { Box, Skeleton, Paper, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const ActivityListShimmer = ({ count = 5 }) => {
  const theme = useTheme()

  return (
    <Box sx={{ px: 5, py: 5 }}>
      <Skeleton 
        variant='text' 
        width={80} 
        height={24} 
        sx={{ 
          mb: 2,
        }} 
      />
      
      {Array.from({ length: count }).map((_, index) => {
        const isSystemGenerated = index === 0; // First item is system generated
        
        return (
          <Paper
            key={index}
            sx={{
              p: 3,
              mb: 3,
              background: isSystemGenerated
                ? theme.palette.customColors.bodyBg
                : alpha(theme.palette.customColors.antzNotes, 0.4),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              boxShadow: 'none',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            <Box sx={{ flex: 1 }}>
              {isSystemGenerated ? (
                <>
                  {/* System Generated Activity Shimmer */}
                  <Skeleton 
                    variant='text' 
                    width={120} 
                    height={20} 
                    sx={{ 
                      mb: 1,
                    }} 
                  />
                  <Skeleton 
                    variant='text' 
                    width={180} 
                    height={16} 
                    sx={{ 
                      mb: 2,
                    }} 
                  />
                  <Skeleton 
                    variant='text' 
                    width='70%' 
                    height={16} 
                    sx={{ 
                      mb: 1,
                    }} 
                  />
                  <Skeleton 
                    variant='text' 
                    width={100} 
                    height={16} 
                    sx={{ 
                      mb: 2,
                    }} 
                  />
                  <Skeleton 
                    variant='text' 
                    width={60} 
                    height={16} 
                    sx={{ 
                      mb: 0.5,
                    }} 
                  />
                  <Skeleton 
                    variant='text' 
                    width='90%' 
                    height={20} 
                    sx={{ 
                    }} 
                  />
                </>
              ) : (
                <>
                  {/* User Note Activity Shimmer */}
                  <Skeleton 
                    variant='text' 
                    width='90%' 
                    height={20} 
                    sx={{ 
                      mb: 1,
                    }} 
                  />
                  <Skeleton 
                    variant='text' 
                    width={180} 
                    height={16} 
                    sx={{ 
                    }} 
                  />
                </>
              )}
            </Box>
            
            {/* Edit button shimmer only for user notes (non-system generated) */}
            {!isSystemGenerated && (
              <Skeleton 
                variant='circular' 
                width={32} 
                height={32} 
                sx={{ 
                  ml: 1,
                  backgroundColor: theme.palette.customColors.OnPrimaryContainer
                }} 
              />
            )}
          </Paper>
        )
      })}
    </Box>
  )
}

export default ActivityListShimmer