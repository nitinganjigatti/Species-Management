import { Box, Card, Typography, Button, Stack, Breadcrumbs, Link, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CardStatsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RankRow from 'src/views/pages/compliance/dashboard/RankRow'

const EntityDetailView = ({
  breadcrumb,
  title,
  subtitle,
  stats,
  primaryPanelTitle,
  primaryPanelSubtitle,
  primaryRows,
  primaryTotal,
  primaryColumns,
  primaryPagination,
  setPrimaryPagination,
  primarySearch,
  setPrimarySearch,
  primaryLoading,
  onPrimaryRowClick,
  secondaryPanelTitle,
  secondaryPanelSubtitle,
  secondaryRows,
  onSecondaryRowClick,
  animalsCount,
  onViewAnimals,
  onExport
}) => {
  const theme = useTheme()
  const tokens = theme.palette.customColors
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

  const maxSecondaryValue = Math.max(1, ...secondaryRows.map(r => r.value))

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1, fontSize: 13 }}>
        {breadcrumb.map((crumb, i) =>
          crumb.href ? (
            <Link key={i} href={crumb.href} underline='hover' sx={{ color: 'customColors.neutralSecondary' }}>
              {crumb.label}
            </Link>
          ) : (
            <Typography key={i} variant='caption' sx={{ color: 'customColors.OnSurfaceVariant' }}>
              {crumb.label}
            </Typography>
          )
        )}
      </Breadcrumbs>

      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' mb={4} flexWrap='wrap' gap={2}>
        <Box>
          <Typography variant='h5' sx={{ color: 'primary.dark', fontWeight: 600 }}>{title}</Typography>
          {subtitle ? (
            <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>{subtitle}</Typography>
          ) : null}
        </Box>
        <Stack direction='row' spacing={1}>
          <Button variant='outlined' onClick={onExport}>Export</Button>
          <Button variant='contained' onClick={onViewAnimals}>
            View {animalsCount?.toLocaleString() ?? 0} animals
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 4,
          mb: 4
        }}
      >
        {stats.map((s, i) => (
          <CardStatsHorizontal
            key={i}
            title={s.label}
            stats={String(s.value ?? 0)}
            icon={<Icon icon={s.icon} />}
            color={s.color}
            bg={s.bg}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isTablet ? '1fr' : '1.6fr 1fr',
          gap: 4
        }}
      >
        <Card>
          <Box sx={{ p: 4, borderBottom: 1, borderColor: 'customColors.SurfaceVariant', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>{primaryPanelTitle}</Typography>
              <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>{primaryPanelSubtitle}</Typography>
            </Box>
          </Box>
          <CommonTable
            indexedRows={primaryRows}
            total={primaryTotal}
            columns={primaryColumns}
            paginationModel={primaryPagination}
            setPaginationModel={setPrimaryPagination}
            searchValue={primarySearch}
            handleSearch={setPrimarySearch}
            loading={primaryLoading}
            onRowClick={onPrimaryRowClick}
          />
        </Card>

        <Card sx={{ alignSelf: 'start' }}>
          <Box sx={{ p: 4, borderBottom: 1, borderColor: 'customColors.SurfaceVariant' }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>{secondaryPanelTitle}</Typography>
            <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>{secondaryPanelSubtitle}</Typography>
          </Box>
          <Box>
            {secondaryRows.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'customColors.neutralSecondary' }}>
                <Typography variant='caption'>No records</Typography>
              </Box>
            ) : (
              secondaryRows.map(r => (
                <RankRow
                  key={r.id}
                  name={r.name}
                  value={r.value.toLocaleString()}
                  subtext={r.subtext}
                  percent={(r.value / maxSecondaryValue) * 100}
                  onClick={() => onSecondaryRowClick(r)}
                />
              ))
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  )
}

export default EntityDetailView
