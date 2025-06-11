import React from 'react'
import { Box, Grid, Typography, Avatar, Tooltip } from '@mui/material'

const AnimalLabelCard = ({
  title,
  subTitle,
  secondSubTitle,
  icon,
  bgColor,
  onClick,
  rowWidth = 250,
  imageDimension = 44
}) => {
  // 1 unit is equal to 4px

  const marginLeft = 2

  const ToolTip = ({ title, children }) => {
    return (
      <Tooltip
        title={title}
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: '#ededed',
              color: '#000',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '4px',
              boxShadow: 2
            }
          }
        }}
      >
        {children}
      </Tooltip>
    )
  }

  return (
    <Grid
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: bgColor ? bgColor : null,
        borderRadius: '8px',
        p: 0,
        m: 0,
        cursor: 'pointer'
      }}
      onClick={onClick ? onClick : null}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: 1,
          borderRadius: '100%',

          // width: '100%',
          // height: '100%',
          justifyContent: 'center',

          backgroundColor: 'customColors.displaybgPrimary'
        }}
      >
        <img
          style={{
            width: `${imageDimension}px`,
            height: `${imageDimension}px`,
            borderRadius: '100%'
          }}
          src={icon ? icon : '/images/Medicine_Icon.png'}
          alt='Animal'
        />
      </Box>
      <Box flex='1' ml={marginLeft}>
        {title && (
          <ToolTip title={title}>
            <Typography
              sx={{
                color: 'customColors.OnSurfaceVariant',
                fontWeight: 500,
                fontSize: '14px',
                overflow: 'hidden', // Hide overflowing text
                whiteSpace: 'nowrap', // Prevent wrapping to the next line
                textOverflow: 'ellipsis', // Add ellipsis when text overflows
                width: `${rowWidth - (marginLeft * 4 + 44 + 8)}px`
              }}
            >
              {title ? title : ''}
            </Typography>
          </ToolTip>
        )}

        {subTitle && (
          <ToolTip title={subTitle}>
            <Typography
              sx={{
                color: 'customColors.neutralSecondary',
                fontWeight: 400,
                fontSize: '14px',
                overflow: 'hidden', // Hide overflowing text
                whiteSpace: 'nowrap', // Prevent wrapping to the next line
                textOverflow: 'ellipsis', // Add ellipsis when text overflows
                // maxWidth: 250
                width: `${rowWidth - (marginLeft * 4 + 44 + 8)}px`
              }}
            >
              <span>{subTitle ? subTitle : null}</span>
            </Typography>
          </ToolTip>
        )}
        {secondSubTitle && (
          <ToolTip title={secondSubTitle}>
            <Typography
              sx={{
                color: 'customColors.neutralSecondary',
                fontWeight: 400,
                fontSize: '14px',
                overflow: 'hidden', // Hide overflowing text
                whiteSpace: 'nowrap', // Prevent wrapping to the next line
                textOverflow: 'ellipsis', // Add ellipsis when text overflows
                // maxWidth: 250
                width: `${rowWidth - (marginLeft * 4 + 44 + 8)}px`
              }}
            >
              <span>{secondSubTitle ? secondSubTitle : null}</span>
            </Typography>
          </ToolTip>
        )}
      </Box>
    </Grid>
  )
}

export default AnimalLabelCard
