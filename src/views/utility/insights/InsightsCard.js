import React, { useState } from 'react'
import HeaderCard from './InsightsHeaderCard'
import InfoStatCard from './InfoStatCard'
import { alpha, Box, Button, Card, Grid, IconButton, Tooltip, Typography, Modal, Paper } from '@mui/material'
import UserInfoCard from './UserInfoCard'
import { useTheme } from '@mui/material/styles'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import InsertCommentOutlinedIcon from '@mui/icons-material/InsertCommentOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import InsightsCardSkeleton from './InsightsCardSkeleton'
import Icon from 'src/@core/components/icon'
import { AddBoxOutlined, Close, Download } from '@mui/icons-material'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { useTranslation } from 'react-i18next'

const InsightsCard = ({
  data,
  loading,
  error,
  isListingPage = false,
  pageTitle,
  actions = {},
  onCallClick,
  onMessageClick,
  zooName,
  subtitle,
  userName,
  description,
  userImage,
  image,
  haveInsightsViewAccess,
  statsData = [],
  qrCodeImage = '',
  entityName = '',
  entityId = '',
  addNewTooltip = 'Add new',
  addNewLabel = 'Add new',
  editTooltip = 'Edit',
  summaryStats = [],
  insightsTitle = '',
  insightsDate = '',
  onInsightsDateChange = undefined,
  insightsFilterDates = undefined,
  titleLabel = '',
  populationText = ''
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const handleDownloadQR = () => {
    if (!qrCodeImage) return
    const link = document.createElement('a')
    link.href = qrCodeImage
    link.download = `${entityName || 'qr-code'}_${entityId || 'image'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <InsightsCardSkeleton />

  if (error) {
    return (
      <Card sx={{ p: 3, bgcolor: '#ffe6e6' }}>
        <Typography color='error' variant='body1'>
          {error}
        </Typography>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant='body1'>{t('no_data_available')}</Typography>
      </Card>
    )
  }

  const showHeader = Boolean(zooName)
  const showUserInfo = Boolean(userName)

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        backgroundImage: image && `url(${image})`,
        background: !image && 'linear-gradient(180deg, #37BD69 0%, #1F415B 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        color: theme.palette.common.white
      }}
    >
      {/* Black overlay */}
      {image && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: theme.palette.common.black,
            opacity: 0.4,
            zIndex: 1
          }}
        />
      )}

      {/* Foreground content */}
      <Box sx={{ position: 'relative', zIndex: 2, p: 6 }}>
        <HeaderCard
          title={isListingPage ? pageTitle : zooName}
          isListingPage={isListingPage}
          subtitle={subtitle || ''}
          {...actions}
          hasQrCode={!!qrCodeImage}
          onQrClick={() => setQrModalOpen(true)}
          addNewTooltip={addNewTooltip}
          addNewLabel={addNewLabel}
          editTooltip={editTooltip}
          titleLabel={titleLabel}
        />
        {showUserInfo && (
          <Box sx={{ mt: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <UserInfoCard avatarUrl={userImage || ''} name={userName || ''} description={description || ''} />
            <Box display='flex' gap={2}>
              {onCallClick && (
                <IconButton
                  onClick={onCallClick}
                  sx={{
                    backgroundColor: alpha(theme.palette.common.white, 0.21),
                    border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                    borderRadius: '50%',
                    padding: 2
                  }}
                >
                  <CallOutlinedIcon sx={{ color: theme.palette.common.white }} />
                </IconButton>
              )}
              {onMessageClick && (
                <IconButton
                  onClick={onMessageClick}
                  sx={{
                    backgroundColor: alpha(theme.palette.common.white, 0.21),
                    border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
                    borderRadius: '50%',
                    padding: 2
                  }}
                >
                  <InsertCommentOutlinedIcon sx={{ color: theme.palette.common.white }} />
                </IconButton>
              )}
            </Box>
          </Box>
        )}
        {/* Summary Stats Row */}
        {Array.isArray(summaryStats) && summaryStats.length > 0 && (
          <Box sx={{ mt: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {summaryStats.map((stat, index) => {
              const formatNum = val => {
                if (val == null) return '0'
                if (typeof val === 'string') return val
                if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
                if (val >= 1_000_000) return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
                if (val >= 1_000) return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'

                return String(val)
              }

              return (
                <Box
                  key={index}
                  sx={{
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 2.5, sm: 3.5 },
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    backdropFilter: 'blur(0.5rem)',
                    WebkitBackdropFilter: 'blur(0.5rem)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    cursor: stat.onClick ? 'pointer' : 'default'
                  }}
                  onClick={stat.onClick}
                >
                  <Tooltip title={stat.value?.toLocaleString?.() ?? stat.value ?? ''} arrow placement='top'>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1.25rem', sm: '1.75rem' },
                        color: theme.palette.common.white,
                        lineHeight: 1
                      }}
                    >
                      {formatNum(stat.value)}
                    </Typography>
                  </Tooltip>
                  <Typography
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      color: alpha(theme.palette.common.white, 0.85),
                      lineHeight: 1.2
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        )}

        {haveInsightsViewAccess && Array.isArray(statsData) && statsData.length > 0 && (
          <Box
            sx={{
              mt: 10,
              p: { xs: 1.5, sm: 2 },
              border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.common.black, 0.3),
              backdropFilter: 'blur(0.5rem)',
              WebkitBackdropFilter: 'blur(0.5rem)'
            }}
          >
            {/* Insights Header: populationText or insightsTitle + Date */}
            {(populationText || insightsTitle || insightsDate || onInsightsDateChange) && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  mb: 3,
                  gap: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 2 }
                }}
              >
                {/* Left side: populationText or insightsTitle */}
                {populationText ? (
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.common.white }}>
                    {populationText}
                  </Typography>
                ) : insightsTitle ? (
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: theme.palette.common.white,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {insightsTitle}
                  </Typography>
                ) : null}

                {/* Right side: Date picker or static date */}
                {onInsightsDateChange && (
                  <Box sx={{ width: { xs: '100%', sm: 'auto' }, maxWidth: { xs: '100%', sm: 420 }, flexShrink: 0 }}>
                    <CommonDateRangePickers filterDates={insightsFilterDates} onChange={onInsightsDateChange} />
                  </Box>
                )}
                {!onInsightsDateChange && insightsDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon
                      icon='mdi:calendar-outline'
                      fontSize={16}
                      style={{ color: alpha(theme.palette.common.white, 0.8).toString() }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', color: alpha(theme.palette.common.white, 0.8) }}>
                      {insightsDate}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Grid container spacing={3} justifyContent='flex-start'>
              {statsData.map((item, index) => {
                const length = statsData.length

                let xs = 6
                let sm = 6
                let md = 12 / length

                // Special handling when there are exactly 2 items
                if (length === 2) {
                  xs = 6 // still stack on extra small screens
                  sm = 3 // 25% width
                  md = 3
                } else if (length === 1) {
                  sm = 6
                  md = 6
                } else if (length === 4) {
                  md = 3
                }

                return (
                  <Grid item size={{ xs: xs, sm: sm, md: md }} key={index} display='flex' justifyContent='flex-start'>
                    <InfoStatCard
                      imagePath={item.imagePath}
                      value={item.value}
                      label={item.label}
                      onClick={item.onClick}
                      dotColor={item.dotColor}
                      iconName={item.iconName}
                      iconColor={item.iconColor}
                    />
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )}
      </Box>

      {/* QR Code Modal */}
      {qrCodeImage && (
        <Modal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Paper
            sx={{
              position: 'relative',
              p: 4,
              borderRadius: 1,
              maxWidth: 400,
              width: '90%',
              textAlign: 'center',
              outline: 'none'
            }}
          >
            <IconButton
              onClick={() => setQrModalOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8
              }}
            >
              <Close />
            </IconButton>

            {/* Entity Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {entityName || zooName || 'QR Code'}
              </Typography>
              {entityId && (
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                  ID: {entityId}
                </Typography>
              )}
            </Box>

            {/* QR Code Image */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3
              }}
            >
              <Box
                component='img'
                src={qrCodeImage}
                alt='QR Code'
                sx={{
                  width: 260,
                  height: 260,
                  objectFit: 'contain'
                }}
              />
            </Box>

            <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mb: 3 }}>
              {t('housing_module.scan_with_antz_app')}
            </Typography>

            {/* Download Button */}
            <Button
              variant='contained'
              startIcon={<Download />}
              onClick={handleDownloadQR}
              sx={{
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              {t('housing_module.download_qr_code')}
            </Button>
          </Paper>
        </Modal>
      )}
    </Box>
  )
}

export default React.memo(InsightsCard)
