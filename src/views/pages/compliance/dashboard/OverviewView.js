import { Box, Card, Tabs, Tab, Typography, Button, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CardStatsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const OverviewView = ({
  stats,
  activeTab,
  onTabChange,
  rows,
  total,
  columns,
  paginationModel,
  setPaginationModel,
  searchValue,
  handleSearch,
  loading,
  onRowClick,
  onExportClick,
  onViewAllAnimals
}) => {
  const theme = useTheme()
  const tokens = theme.palette.customColors

  return (
    <Box>
      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' mb={4} flexWrap='wrap' gap={2}>
        <Box>
          <Typography variant='h5' sx={{ color: 'primary.dark', fontWeight: 600 }}>
            Compliance Dashboard
          </Typography>
          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
            Trade-party-mapped animals across all organizations and sites
          </Typography>
        </Box>
        <Stack direction='row' spacing={1}>
          <Button variant='outlined' onClick={onExportClick}>Export</Button>
          <Button variant='contained' onClick={onViewAllAnimals}>View all animals</Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 4,
          mb: 4
        }}
      >
        <CardStatsHorizontal
          title='Organizations'
          stats={String(stats?.org_count ?? 0)}
          icon={<Icon icon='mdi:office-building-outline' />}
          color='primary.dark'
          bg={tokens.OnBackground}
        />
        <CardStatsHorizontal
          title='Sites'
          stats={String(stats?.site_count ?? 0)}
          icon={<Icon icon='mdi:map-marker-outline' />}
          color='secondary.main'
          bg={tokens.antzSecondaryBg}
        />
        <CardStatsHorizontal
          title='Compliance species'
          stats={String(stats?.compliance_species_count ?? 0)}
          icon={<Icon icon='mdi:leaf' />}
          color='primary.dark'
          bg={tokens.OnBackground}
        />
        <CardStatsHorizontal
          title='Animals tracked'
          stats={String(stats?.animal_count ?? 0)}
          icon={<Icon icon='mdi:paw' />}
          color='customColors.Tertiary'
          bg={tokens.BgTeritary}
        />
      </Box>

      <Card>
        <Tabs value={activeTab} onChange={(_, v) => onTabChange(v)} sx={{ px: 4, borderBottom: 1, borderColor: 'customColors.SurfaceVariant' }}>
          <Tab value='orgs' label={`Organizations (${stats?.org_count ?? 0})`} />
          <Tab value='sites' label={`Sites (${stats?.site_count ?? 0})`} />
          <Tab value='species' label={`Species (${stats?.compliance_species_count ?? 0})`} />
        </Tabs>
        <CommonTable
          indexedRows={rows}
          total={total}
          columns={columns}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          searchValue={searchValue}
          handleSearch={handleSearch}
          loading={loading}
          onRowClick={onRowClick}
        />
      </Card>
    </Box>
  )
}

export default OverviewView
