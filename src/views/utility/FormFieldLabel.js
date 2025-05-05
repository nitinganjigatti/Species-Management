import React from 'react';
import Typography from '@mui/material/Typography';

const FormFieldSubtitle = ({ text, variant = 'subtitle1', sx = {}, ...props }) => {
  const defaultStyles = {
    color: 'customColors.customTextColorGray2',
    fontWeight: 500,
    fontSize: variant === 'subtitle1' ? '0.875rem' : '0.8125rem',
    ...sx,
  };

  return (
    <Typography variant={variant} sx={defaultStyles} {...props}>
      {text}
    </Typography>
  );
};

export default React.memo(FormFieldSubtitle);
