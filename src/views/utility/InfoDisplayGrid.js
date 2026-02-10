import { Box, Grid, Skeleton, Tooltip, Typography } from '@mui/material'
import React from 'react'

// Skeleton Loading Component
const InfoDisplayGridSkeleton = ({ userCard }) => {
  return (
    <Grid
      container
      columnSpacing={1}
      rowSpacing={2}
      sx={{
        padding: 4,
        backgroundColor: '#EFF5F2',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <Grid
        item
        size={{
          xs: 12,
          sm: userCard ? 8 : 12,
          md: userCard ? 9 : 12
        }}
      >
        <Grid container columnSpacing={15} rowSpacing={3}>
          {Array.from({ length: userCard ? 3 : 4 }).map((_, index) => (
            <Grid
              key={index}
              item
              size={{ xs: 12, sm: userCard ? 12 : 6, md: userCard ? 4 : 3 }}
              sx={{ display: 'flex', flexDirection: 'column' }}
            >
              <Skeleton width={'100%'} height={24} />
              <Skeleton width={'100%'} height={24} />
            </Grid>
          ))}
        </Grid>
      </Grid>
      {userCard && (
        <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
          <Grid
            container
            sx={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: { xs: 0, sm: '40px' } }}
          >
            <Skeleton variant='rectangular' sx={{ height: '40px', width: '40px', borderRadius: '50px' }}></Skeleton>
            <Grid sx={{ flex: 1 }}>
              <Skeleton width={'100%'} />
              <Skeleton width={'100%'} />
            </Grid>
          </Grid>
        </Grid>
      )}
    </Grid>
  )
}

// Main InfoDisplayGrid Component
function InfoDisplayGrid({
  // Data Props
  cardsData = [],

  //  Layout / Structure Props
  contentBoxSx = {},
  containerSx = {},
  textContainer = {},
  userCardSx = {},

  // Styling Props
  commonLabelStyle = {},
  commonValueStyle = {},
  labelValueSeparator = ':',

  // Functional / Conditional Props
  showSeparator = true,
  userCard = null,
  displayVertically = false,
  displayLastItemFullWidth = true,

  // Grid / Spacing Props
  GridSizes = {},
  columnSpacing = 5,
  rowSpacing = 2,
  loading = false
}) {
  if (loading) {
    return <InfoDisplayGridSkeleton userCard={userCard} />
  }
  {
    const ConstantStyle = {
      textEllipsis: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: 'auto',
        wrap: 'nowrap'
      },
      textLabelStyle: {
        fontSize: '14px',
        color: '#7A8684',
        ...commonLabelStyle
      },
      textValueStyle: {
        fontSize: '16px',
        fontWeight: 500,
        color: '#1F515B',
        ...commonValueStyle
      },
      GridSizes: {
        xs: 12,
        sm: userCard ? 6 : 4,
        md: userCard ? 4 : 3,
        ...GridSizes
      }
    }

    return (
      <Grid
        container
        columnSpacing={1}
        rowSpacing={2}
        sx={{
          padding: 4,
          backgroundColor: '#EFF5F2',
          borderRadius: '8px',
          ...containerSx
        }}
      >
        <Grid
          item
          size={{
            xs: 12,
            sm: userCard ? 9 : 12,
            md: userCard ? 9.5 : 12,
            lg: userCard ? 10.2 : 12
          }}
          sx={{
            overflow: 'hidden',

            width: '100%',

            textOverflow: 'ellipsis'
          }}
        >
          <Grid
            container
            columnSpacing={columnSpacing}
            rowSpacing={rowSpacing}
            sx={{ display: 'flex', ...contentBoxSx }}
          >
            {cardsData
              ?.filter(item => item?.label && item?.value)
              .map((item, index) => {
                const isLast = index === cardsData?.length - 1
                const onClick = item?.onClick || null
                const cardsDataLength = userCard ? cardsData?.length % 3 !== 0 : cardsData?.length % 4 !== 0
                const isLastItem = isLast && displayLastItemFullWidth && cardsDataLength

                const lastItemStyle = isLastItem
                  ? {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: isLastItem ? { xs: 'auto', md: 'auto' } : 'auto'
                    }
                  : ConstantStyle.textEllipsis

                return (
                  <Grid
                    item
                    key={index}
                    size={{
                      xs: ConstantStyle.GridSizes.xs,
                      sm: ConstantStyle.GridSizes.sm,
                      md: isLastItem ? 'auto' : ConstantStyle.GridSizes.md,
                      lg: isLastItem ? 'auto' : ConstantStyle.GridSizes.lg
                    }}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      cursor: item?.onClick ? 'pointer' : 'default',
                      flexDirection: displayVertically ? 'column' : 'row',
                      ...textContainer
                    }}
                    onClick={() => onClick && onClick()}
                  >
                    <Tooltip title={item?.label}>
                      <Typography
                        sx={{
                          ...lastItemStyle,
                          ...ConstantStyle?.textLabelStyle,
                          ...item?.labelStyle
                        }}
                      >
                        {item?.label} {showSeparator && !displayVertically && labelValueSeparator}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={item?.value}>
                      <Typography
                        sx={{
                          ...lastItemStyle,
                          ...ConstantStyle?.textValueStyle,
                          ...item?.valueStyle
                        }}
                      >
                        {item?.value}
                      </Typography>
                    </Tooltip>
                  </Grid>
                )
              })}
          </Grid>
        </Grid>

        {userCard && (
          <Grid
            item
            size={{ xs: 12, sm: 3, md: 2.5, lg: 1.8 }}
            sx={{
              display: 'flex',
              alignItems: { xs: 'center', sm: 'flex-start' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              ...userCardSx
            }}
          >
            <Box sx={{ width: 'fit-content' }}>{userCard}</Box>
          </Grid>
        )}
      </Grid>
    )
  }
}

export default InfoDisplayGrid
