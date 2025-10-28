import React, { useRef, useEffect } from 'react'
import { Box, Typography, IconButton, useTheme, Collapse, Button, alpha } from '@mui/material'
import { Add, Remove, EditOutlined } from '@mui/icons-material'

const CustomAccordion = ({
  id,
  title,
  children,
  expanded,
  onChange,
  docsCount = null,
  editable,
  handleEditClick,
  shouldScrollToTop = true,
  type
}) => {
  const theme = useTheme()
  const isExpanded = expanded
  const accordionRef = useRef(null)

  useEffect(() => {
    if (isExpanded && accordionRef.current && shouldScrollToTop) {
      const topOffset = 0 // Increase if your header is taller
      const elementTop = accordionRef.current.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementTop - topOffset,
        behavior: 'smooth'
      })
    }
  }, [isExpanded, shouldScrollToTop])

  return (
    <Box
      ref={accordionRef}
      sx={{
        mb: 3,
        borderRadius: 1,
        px: { xs: 4, sm: 6, md: 8 },
        boxShadow: isExpanded ? `0px 4px 24px rgba(0, 0, 0, 0.1)` : `0px 1px 3px rgba(0, 0, 0, 0.06)`,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        backgroundColor: theme.palette.common.white
      }}
    >
      <Box onClick={() => onChange(id)}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            py: 5,
            borderBottom: isExpanded ? { sm: `1px solid ${theme.palette.divider}` } : 'none'
          }}
        >
          <Box display='flex' alignItems='center' gap={1}>
            <Typography variant='h5' sx={{ fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
              {title}
            </Typography>
          </Box>

          {/* Desktop-only controls */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            {docsCount !== null && (
              <Box
                sx={{
                  mr: 2,
                  px: 3,
                  py: 1,
                  borderRadius: '4px',
                  backgroundColor: theme.palette.grey[200],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
                  {docsCount}
                </Typography>
                {type !== 'shipment' ? (
                  <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>Documents added</Typography>
                ) : (
                  ''
                )}
              </Box>
            )}
            {editable && (
              <Button
                variant='contained'
                startIcon={<EditOutlined color={theme.palette.primary.OnSurface} />}
                onClick={handleEditClick}
                sx={{
                  backgroundColor: theme => theme.palette.customColors.OnBackground,
                  color: theme.palette.primary.OnSurface,
                  boxShadow: 'none',
                  mr: 2,
                  '&:hover': {
                    backgroundColor: theme => alpha(theme.palette.customColors.OnBackground, 0.8),
                    boxShadow: 'none'
                  }
                }}
              >
                Edit
              </Button>
            )}

            <IconButton
              size='small'
              sx={{ color: theme.palette.customColors.OnPrimaryContainer }}

              // onClick={() => onChange(id)}
            >
              {isExpanded ? <Remove fontSize='small' /> : <Add fontSize='small' />}
            </IconButton>
          </Box>

          {/* Mobile-only expand button */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center' }}>
            <IconButton
              size='small'
              sx={{ color: theme.palette.customColors.OnPrimaryContainer }}

              // onClick={() => onChange(id)}
            >
              {isExpanded ? <Remove fontSize='small' /> : <Add fontSize='small' />}
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            alignItems: 'center',
            px: 4,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          {docsCount !== null && (
            <Box
              sx={{
                mr: 2,
                px: 3,
                py: 1,
                borderRadius: '4px',
                backgroundColor: theme.palette.grey[200],
                display: 'flex',
                alignItems: 'center',
                border: `1px solid ${theme.palette.divider}`,
                gap: 2,
                mb: 4
              }}
            >
              <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
                {docsCount}
              </Typography>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>Documents added</Typography>
            </Box>
          )}
          {editable && (
            <Button
              variant='contained'
              startIcon={<EditOutlined color={theme.palette.primary.OnSurface} />}
              onClick={handleEditClick}
              sx={{
                backgroundColor: theme => theme.palette.customColors.OnBackground,
                color: theme.palette.primary.OnSurface,
                boxShadow: 'none',
                mb: 4,
                '&:hover': {
                  backgroundColor: theme => alpha(theme.palette.customColors.OnBackground, 0.8),
                  boxShadow: 'none'
                }
              }}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ py: 4 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

export default CustomAccordion
