import React, { memo } from 'react'
import { Box, Drawer, IconButton, Typography, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import NoDataFound from 'src/views/utility/NoDataFound'

const TestDetailsDrawer = ({ open, onClose, selectedTest, subTests, loading }) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '80%', md: 560 },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper
          }
        }
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper
        }}
      >
        <IconButton onClick={onClose} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          {selectedTest?.testStatus && (
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                color:
                  selectedTest.testStatus === 'Completed'
                    ? theme.palette.success.main
                    : selectedTest.testStatus === 'In Progress'
                    ? theme.palette.warning.dark
                    : theme.palette.error.main
              }}
            >
              {selectedTest.testStatus}
            </Typography>
          )}
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            {selectedTest?.testName}
          </Typography>
          {selectedTest?.sampleName && (
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
              }}
            >
              {selectedTest.sampleName}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', backgroundColor: theme.palette.background.default }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant='rounded' height={48} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : subTests.length > 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                mb: 2
              }}
            >
              Tests - {subTests.length}
            </Typography>
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {subTests.map((subTest, index) => (
                <Box
                  key={subTest.slNo || index}
                  sx={{
                    p: 2,
                    borderBottom: index < subTests.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                    }}
                  >
                    {subTest.subTestName || subTest.testName || `Sub Test ${index + 1}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ py: 6 }}>
            <NoDataFound message='No sub-tests found' />
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default memo(TestDetailsDrawer)
