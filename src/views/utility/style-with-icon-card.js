import React from 'react'
import { Box, Typography, Avatar, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'

const StyleWithIconCardComponent = ({ value, description, icon, bgColor, onClick, showIcon, customCss }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: bgColor ? bgColor : null,
        borderRadius: '8px',

        p: customCss?.p ? customCss?.p : 4,
        ':hover': { cursor: 'pointer' }
      }}
      onClick={onClick ? onClick : null}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',

          padding: customCss?.p ? customCss?.p : 2,
          borderRadius: '8px',
          backgroundColor: '#FFFFFF80',

          width: customCss?.width ? customCss?.width : '60px',
          height: customCss?.height ? customCss?.height : '60px',
          justifyContent: 'center'
        }}
      >
        <Avatar
          variant='square'
          alt=''
          src={icon ? icon : null}
          sx={{
            width: customCss?.iconWidth ? customCss?.iconWidth : '34px',
            height: customCss?.iconHeight ? customCss?.iconHeight : '34px',
            borderRadius: customCss?.avtBorderRadius ? customCss?.avtBorderRadius : '0px'
          }}
        />
      </Box>
      <Box
        sx={{
          flex: '1',
          ml: 2
        }}
      >
        {value && (
          <Tooltip
            title={value}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: '#ededed', // Background color
                  color: '#000', // Text color
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '4px', // Optional: Rounded corners
                  boxShadow: 2 // Optional: Adds a subtle shadow
                }
              }
            }}
          >
            <Typography
              variant='body1'
              sx={{
                color: 'customColors.customHeadingTextColor',
                fontWeight: 500,
                fontSize: customCss?.fontSize ? customCss?.fontSize : '20px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                maxWidth: 250
              }}
            >
              {value ? value : 0}
            </Typography>
          </Tooltip>
        )}

        {description && (
          <Tooltip title={description}>
            <Typography
              variant='body2'
              sx={{
                color: 'customColors.neutralSecondary',
                fontWeight: 400,
                fontSize: '14px',
                overflow: 'hidden', // Hide overflowing text
                whiteSpace: 'nowrap', // Prevent wrapping to the next line
                textOverflow: 'ellipsis', // Add ellipsis when text overflows
                maxWidth: 250
              }}
            >
              {description ? description : null}
            </Typography>
          </Tooltip>
        )}
      </Box>
      {showIcon && (
        <Typography
          variant='body2'
          sx={{
            color: 'customColors.customHeadingTextColor'
          }}
        >
          <Icon icon='weui:arrow-filled' />
        </Typography>
      )}
    </Box>
  )
}

export default StyleWithIconCardComponent
