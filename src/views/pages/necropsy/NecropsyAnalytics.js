import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  useTheme,
  Button,
  Badge,
  Typography,
  Avatar,
  IconButton
} from '@mui/material'
import NecropsyDropdown from 'src/components/necropsy/NecropsyDropdown'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { AirportShuttle, ArrowBack } from '@mui/icons-material'
import RenderUtility from 'src/utility/render'
import Icon from 'src/@core/components/icon'

const NecropsyAnalytics = ({
  disabled = false,
  filterDate,
  setFilterDate,
  badgeCount = 1,
  onCarcassTransfer,
  allowCarcassCollection,
  showCarcassTransferButton = true,
  showBackButton = false,
  onBack,
  title = 'Necropsy'
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ margin: '0 auto' }}>
      <Card
        sx={{
          borderRadius: '10px',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container alignItems='center' rowSpacing={1}>
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {showBackButton && (
                  <IconButton onClick={onBack}>
                    <ArrowBack sx={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                  </IconButton>
                )}
                {RenderUtility.pageTitle(title)}
              </Box>
              {allowCarcassCollection && showCarcassTransferButton && (
                <Box
                  onClick={onCarcassTransfer}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 3,
                    backgroundColor: theme.palette.customColors.Tertiary20,
                    py: 1,
                    px: 4,
                    borderRadius: 1,
                    minHeight: '44px',
                    cursor: 'pointer'
                  }}
                >
                  <Badge
                    badgeContent={badgeCount}
                    color='error'
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '10px',
                        height: '20px',
                        width: '20px',
                        fontWeight: 500,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.customColors.Tertiary,
                        color: theme.palette.customColors.OnPrimary
                      }
                    }}
                  >
                    <img src={'/images/necropsy/carcass_transfer_dark.svg'} alt='Carcass Transfer icon' height={20} />
                  </Badge>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnTertiaryContainer
                    }}
                  >
                    CARCASS TRANSFER
                  </Typography>
                  <Icon icon={'mingcute:right-fill'} fontSize={20} />
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid size={{ xs: 12 }} container spacing={4} alignItems='center' justifyContent='space-between'>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box>
                    {/* <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      Necropsy Center
                    </Typography> */}
                    <NecropsyDropdown disabled={disabled} />
                  </Box>
                </Box>
              </Grid>
              {!disabled && (
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Box>
                    {/* <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      Date Range
                    </Typography> */}
                    <Box
                      sx={{
                        width: '100%',
                        minWidth: { xs: 0, sm: '300px' },
                        py: '6px'
                      }}
                    >
                      <CommonDateRangePickers
                        filterDates={filterDate}
                        onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default NecropsyAnalytics
