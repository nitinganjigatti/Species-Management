import React from 'react';
import { Box, Typography, Divider, useTheme, Grid } from '@mui/material';

const LinkedImportsItem = ({ certificateId, dateOfIssue, linkedImportsCount }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        p: 4,
        mb: 4,
        backgroundColor: theme.palette.customColors.displaybgPrimary,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={5} md={4}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.customColors.neutralSecondary}}>
            Certificate ID
          </Typography>
          <Typography variant="body1" fontWeight="medium" sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500}}>
            {certificateId}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4} md={4}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: theme.palette.customColors.neutralSecondary}}>
              Date Of Issue
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500}}>
              {dateOfIssue}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={3} md={4}>
          <Box >
            <Typography variant="subtitle2" sx={{ color: theme.palette.customColors.neutralSecondary}}>
              Linked Imports
            </Typography>
            <Typography variant="body1"  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500}}>
              {linkedImportsCount}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const LinkedImports = ({ imports = [] }) => {
  return (
    <Box>
      {imports.length > 0 ? (
        imports.map((item, index) => (
          <LinkedImportsItem
            key={index}
            certificateId={item.certificateId}
            dateOfIssue={item.dateOfIssue}
            linkedImportsCount={item.linkedImportsCount}
          />
        ))
      ) : (
        <Box sx={{ 
          p: 3, 
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: '8px'
        }}>
          <Typography color="text.secondary">
            No linked imports found
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LinkedImports;