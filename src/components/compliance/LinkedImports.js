import React from 'react'
import { Box, Typography, Grid, useTheme, alpha } from '@mui/material'
import Utility from 'src/utility'

const LinkedImports = ({ imports = [] }) => {
  const theme = useTheme()

  if (!imports.length) {
    return (
      <Box
        sx={{
          height: '150px',
          width: '100%',
          mx: 'auto',
          backgroundColor: alpha(theme.palette.common.black, 0.05),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px'
        }}
      >
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 500, fontSize: '1rem' }}>
          No Linked Imports
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {imports?.map((item, index) => (
        <Box
          key={index}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            p: 4,
            mb: 4,
            backgroundColor: theme.palette.customColors.displaybgPrimary
          }}
        >
          <Grid container spacing={2} alignItems='center'>
            <Grid size={{ xs: 12, sm: 5, md: 4 }}>
              <Typography variant='subtitle2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                Certificate ID
              </Typography>
              <Typography
                variant='body1'
                fontWeight='medium'
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 500,
                  cursor: 'pointer',
                  float: 'left'
                }}
                onClick={() => {
                  window.open(
                    `/compliance/documents/imports/AddEditImport/?id=${item?.import_id}&action=details`,
                    '_blank'
                  )
                }}
              >
                {item?.import_number || '-'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant='subtitle2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                  Date Of Issue
                </Typography>
                <Typography
                  variant='body1'
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}
                >
                  {Utility.formatDisplayDate(item.import_date) || '-'}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 3, md: 4 }}>
              <Box>
                <Typography variant='subtitle2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                  Linked Exports
                </Typography>
                <Typography
                  variant='body1'
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}
                >
                  {item?.export_count || '-'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ))}
    </Box>
  )
}

export default LinkedImports
