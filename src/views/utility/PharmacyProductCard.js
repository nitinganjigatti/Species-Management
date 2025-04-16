import React from 'react'
import { Box, Grid, Typography, Avatar, Tooltip, Hidden } from '@mui/material'
import Icon from 'src/@core/components/icon'

const StyleWithIconCardComponent = ({
  value,
  description,
  icon,
  bgColor,
  onClick,
  showIcon,
  customCss,
  rowWidth = 250,
  heoImageDimention = 60
}) => {
  console.log('customCss', customCss)

  // 1 unit is equal to 4px

  const marginLeft = 2

  return (
    <Grid item>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: bgColor ? bgColor : null,
          borderRadius: '8px',

          // p: customCss?.p ? customCss?.p : 4,
          p: 0,
          cursor: 'pointer'
        }}
        onClick={onClick ? onClick : null}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',

            // padding: customCss?.p ? customCss?.p : 2,
            padding: 0,
            borderRadius: '8px',
            backgroundColor: '#FFFFFF80',

            width: '100%',
            height: '100%',

            justifyContent: 'center'
          }}
        >
          <Avatar
            variant='square'
            alt=''
            src={icon ? icon : null}
            sx={{
              width: `${heoImageDimention}px`,
              height: `${heoImageDimention}px`,
              borderRadius: customCss?.avtBorderRadius ? customCss?.avtBorderRadius : '0px'
            }}
          />
        </Box>
        <Box
          flex='1'
          ml={marginLeft}

          // sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '190px' }}
        >
          {value && (
            <Tooltip
              title={value}
              componentsProps={{
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
                  overflow: 'hidden', // Hide overflowing text
                  whiteSpace: 'nowrap', // Prevent wrapping to the next line
                  textOverflow: 'ellipsis', // Add ellipsis when text overflows
                  // maxWidth: 250
                  width: `${rowWidth - (marginLeft * 4 + 44 + 8)}px`

                  // maxWidth: 250
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
                  // maxWidth: 250
                  width: '190px'
                }}
              >
                <span>{description ? description : null}</span>
              </Typography>
            </Tooltip>
          )}
        </Box>
        {showIcon && (
          <Typography variant='body2' color='customColors.customHeadingTextColor'>
            <Icon icon='weui:arrow-filled' />
          </Typography>
        )}
      </Box>
    </Grid>
  )
}

export default StyleWithIconCardComponent
