import { Box, Button, Card, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import DownloadIcon from '@mui/icons-material/Download'
import { useTranslation } from 'react-i18next'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { DailyReportViewProps, CategoryCardProps } from 'src/types/report'
import { ReportItem } from 'src/types/report/models'

const CategoryCard = ({ category, categoryIcon, reports, downloadingRowId, onDownload }: CategoryCardProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const groupedBySubCategory: Record<string, ReportItem[]> = reports.reduce(
    (acc: Record<string, ReportItem[]>, report) => {
      const sub = report.sub_category || null
      const key = String(sub)
      if (!acc[key]) acc[key] = []
      acc[key].push(report)

      return acc
    },
    {}
  )

  return (
    <Card
      sx={{
        mb: 4,
        border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`,
        boxShadow: 'none',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease',
        '&:hover': {
          boxShadow: theme => `0 2px 8px ${theme.palette.customColors.SurfaceVariant}`
        }
      }}
    >
      {/* Category Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 5,
          py: 2.5,
          backgroundColor: 'customColors.Surface',
          borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`
        }}
      >
        {categoryIcon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'customColors.OnBackground'
            }}
          >
            <Box component='img' src={categoryIcon} alt={category} sx={{ width: 22, height: 22 }} />
          </Box>
        )}
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: 'primary.dark',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {category}
        </Typography>
      </Box>

      {/* Report Rows */}
      {Object.entries(groupedBySubCategory).map(([subCategory, subReports]) => (
        <Box key={subCategory}>
          {subCategory !== 'null' && (
            <Box
              sx={{
                px: 5,
                py: 2,
                borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'customColors.Outline',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {subCategory}
              </Typography>
            </Box>
          )}
          {subReports.map(report => {
            const isDownloading = downloadingRowId === report.id || downloadingRowId === report.key

            return (
              <Box
                key={report.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 5,
                  py: 3.5,
                  borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                  transition: 'background-color 0.15s ease',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': { backgroundColor: 'customColors.Surface' }
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'customColors.OnSurfaceVariant'
                    }}
                  >
                    {report.title}
                  </Typography>
                  {report.description && (
                    <Typography
                      variant='caption'
                      sx={{
                        color: 'customColors.neutralSecondary',
                        mt: 0.5,
                        display: 'block'
                      }}
                    >
                      {report.description}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant='contained'
                  disabled={isDownloading}
                  onClick={() => onDownload(report)}
                  startIcon={
                    isDownloading ? (
                      <CircularProgress size={18} sx={{ color: 'white' }} />
                    ) : (
                      <DownloadIcon sx={{ fontSize: 18 }} />
                    )
                  }
                  sx={{
                    textTransform: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    px: 3,
                    py: 1.2,
                    borderRadius: '10px',
                    minWidth: 140,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      transform: 'scale(1.03)'
                    },
                    '&:active': {
                      transform: 'scale(0.96)'
                    }
                  }}
                >
                  {isDownloading ? t('report_module.downloading') : t('download')}
                </Button>
              </Box>
            )
          })}
        </Box>
      ))}
    </Card>
  )
}

const DailyReportView = ({
  activeTab,
  onTabChange,
  pastReports,
  upcomingReports,
  pastDateFilter,
  upcomingDateFilter,
  onPastDateChange,
  onUpcomingDateChange,
  downloadingRowId,
  onDownload,
  loading
}: DailyReportViewProps) => {
  const { t } = useTranslation()

  const groupByCategory = (reports: ReportItem[]): Record<string, ReportItem[]> => {
    const grouped: Record<string, ReportItem[]> = {}
    reports.forEach(report => {
      const cat = report.category || 'Other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(report)
    })

    return grouped
  }

  const currentReports = activeTab === 0 ? pastReports : upcomingReports
  const groupedReports: Record<string, ReportItem[]> = groupByCategory(currentReports)

  return (
    <Card sx={{ p: 5 }}>
      {/* Page Title */}
      <Typography
        variant='h5'
        sx={{
          fontWeight: 600,
          color: 'customColors.OnSurfaceVariant',
          mb: 3
        }}
      >
        {t('report_module.daily_report')}
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'customColors.SurfaceVariant', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={onTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: 'customColors.neutralSecondary',
              '&.Mui-selected': {
                color: 'primary.dark',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 2.5,
              borderRadius: '2px 2px 0 0'
            }
          }}
        >
          <Tab label={t('report_module.past_reports')} />
          <Tab label={t('report_module.upcoming_reports')} />
        </Tabs>
      </Box>

      {/* Date Picker */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Box sx={{ minWidth: 0 }}>
          {activeTab === 0 ? (
            <CommonDateRangePickers
              onChange={onPastDateChange}
              filterDates={pastDateFilter}
              showFutureDates={false}
              showAllTime={true}
            />
          ) : (
            <CommonDateRangePickers
              onChange={onUpcomingDateChange}
              filterDates={upcomingDateFilter}
              showFutureDates={true}
              showAllTime={true}
            />
          )}
        </Box>
      </Box>

      {/* Report Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : Object.keys(groupedReports).length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography sx={{ color: 'customColors.neutralSecondary' }}>
            {t('report_module.no_reports_available')}
          </Typography>
        </Box>
      ) : (
        Object.entries(groupedReports).map(([category, reports]) => (
          <CategoryCard
            key={category}
            category={category}
            categoryIcon={reports[0]?.category_icon || null}
            reports={reports}
            downloadingRowId={downloadingRowId}
            onDownload={onDownload}
          />
        ))
      )}
    </Card>
  )
}

export default DailyReportView
