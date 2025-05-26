import React from 'react';
import { Box, Typography } from '@mui/material';
import RenderUtility from 'src/utility/render';

const ProductOption = ({ option, ...props }) => (
  <li {...props}>
    <Box>
      <Typography
        sx={{
          color: 'customColors.OnSecondaryContainer',
          display: 'flex',
          alignItems: 'center',
          fontSize: '1rem',
          fontWeight: 400,
        }}
      >
        {RenderUtility?.renderControlLabel(option?.control_substance === true, 'CS')}
        {RenderUtility?.renderControlLabel(option?.prescription_required === true, 'PR')}
        {option?.label}
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 400 }}>{option?.packageDetails}</Typography>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 400 }}>{option?.manufacture}</Typography>
    </Box>
  </li>
);

export default React.memo(ProductOption);
