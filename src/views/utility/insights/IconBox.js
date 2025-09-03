import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

const IconBox = ({
  icon: Icon,
  imagePath,
  size = 'large',
  color = 'white',
  bgOpacity = 0.16,
  padding = 3,
  imageSize = 32,         // fallback size
  imageWidth,             // optional override for width
  imageHeight,            // optional override for height
}) => {
  return (
    <Box
      sx={theme => ({
        p: padding,
        borderRadius: 1,
        backgroundColor: alpha(theme.palette.common.white, bgOpacity),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        height: 'fit-content',
      })}
    >
      {imagePath ? (
        <Box
          component="img"
          src={imagePath}
          alt="icon"
          sx={{
            width: imageWidth || imageSize,
            height: imageHeight || imageSize,
            objectFit: 'contain',
          }}
        />
      ) : Icon ? (
        <Icon fontSize={size} sx={{ color }} />
      ) : null}
    </Box>
  );
};

export default React.memo(IconBox);
