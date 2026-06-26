import { Box, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import StatChip from 'src/views/utility/StatChip'
import {
  analysisValue,
  getReadiness,
  type AnalysisFilter,
  type SpeciesRow
} from 'src/views/pages/species-management/speciesListing.utils'

/**
 * Column definitions for the Species Management listing.
 * Management-first order: identity → population → conservation (IUCN/CITES) → readiness → category → taxonomy.
 * Per-sex columns are dropped here (they live on the species detail page); readiness summarises them.
 * Keeps the existing DataGrid styling (SpeciesCard + StatChip + token colors).
 */
export const buildSpeciesColumns = (theme: Theme, analysis?: AnalysisFilter): GridColDef[] => {
  const cc = theme.palette.customColors as Record<string, string>

  const textCell = (value: string, color?: string, fontWeight?: number) => (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      <Typography variant='body2' sx={{ color: color || cc.OnSurfaceVariant, fontWeight }}>
        {value}
      </Typography>
    </Box>
  )

  const READINESS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
    can_pair: { label: 'Can Pair', bg: `${theme.palette.primary.main}1A`, fg: theme.palette.primary.dark },
    needs_sexing: { label: 'Needs Sexing', bg: `${theme.palette.warning.main}1A`, fg: theme.palette.warning.main },
    single_sex: { label: 'Single Sex', bg: `${cc.Tertiary}1A`, fg: cc.Tertiary },
    no_data: { label: 'No Data', bg: cc.SurfaceVariant, fg: cc.OnSurfaceVariant }
  }

  const readinessCell = (params: GridRenderCellParams) => {
    const s = READINESS_STYLE[getReadiness(params.row as SpeciesRow)] || READINESS_STYLE.no_data

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, bgcolor: s.bg, borderRadius: '16px', px: 1.25, py: 0.25 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: s.fg }} />
          <Typography variant='caption' sx={{ color: s.fg, fontWeight: 600 }}>
            {s.label}
          </Typography>
        </Box>
      </Box>
    )
  }

  // Temporary metric column surfaced while an Analysis filter is active (inserted after Population).
  const analysisColumn = (): GridColDef | null => {
    if (!analysis?.mode) return null

    if (analysis.mode === 'lifespan') {
      return {
        width: 150,
        sortable: false,
        field: 'analysis_metric',
        headerName: 'Avg adult life',
        renderCell: (params: GridRenderCellParams) => {
          const r = params.row as SpeciesRow
          const head = r.lifespanAvgAdult ?? r.lifespanAvg

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <Typography variant='body2' sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                {head != null ? `${head}y` : '—'}
              </Typography>
              {r.lifespanMax != null && (
                <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                  max {r.lifespanMax}y · n={r.lifespanCount}
                </Typography>
              )}
            </Box>
          )
        }
      }
    }

    const isBirths = analysis.mode === 'births'

    return {
      width: 140,
      sortable: false,
      field: 'analysis_metric',
      headerName: isBirths ? 'Births in period' : 'Deaths in period',
      renderCell: (params: GridRenderCellParams) => {
        const v = analysisValue(params.row as SpeciesRow, analysis) || 0

        return textCell(v.toLocaleString(), isBirths ? theme.palette.primary.dark : cc.Tertiary, 700)
      }
    }
  }

  const cols: GridColDef[] = [
    {
      width: 60,
      sortable: false,
      field: 'sl_no',
      headerName: 'No',
      renderCell: (params: GridRenderCellParams) => textCell(String(params.row.sl_no))
    },
    {
      minWidth: 240,
      flex: 1,
      sortable: false,
      field: 'species_name',
      headerName: 'Species',
      renderCell: (params: GridRenderCellParams) => (
        <SpeciesCard
          species={{
            common_name: params.row.species_name,
            scientific_name: params.row.scientific_name,
            default_icon: params.row.image || '/images/housing/species-icon-colored.svg'
          }}
        />
      )
    },
    {
      width: 120,
      sortable: false,
      field: 'population',
      headerName: 'Population',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: cc.OnSurface }}>
            {Number(params.row.population || 0).toLocaleString()}
          </Typography>
        </Box>
      )
    },
    {
      width: 150,
      sortable: false,
      field: 'mfu',
      headerName: 'M · F · U',
      renderCell: (params: GridRenderCellParams) => {
        const r = params.row as SpeciesRow
        const seg = (n: number, color: string) => (
          <Typography variant='body2' sx={{ fontWeight: 600, color }}>
            {Number(n || 0).toLocaleString()}
          </Typography>
        )
        const dot = (
          <Typography variant='body2' sx={{ color: cc.OutlineVariant }}>
            ·
          </Typography>
        )

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, height: '100%' }}>
            {seg(r.male, cc.OnSurfaceVariant)}
            {dot}
            {seg(r.female, cc.OnSurfaceVariant)}
            {dot}
            {seg(r.undetermined, cc.OnSurfaceVariant)}
          </Box>
        )
      }
    },
    {
      width: 90,
      sortable: false,
      field: 'sexed_pct',
      headerName: 'Sexed %',
      renderCell: (params: GridRenderCellParams) => {
        const r = params.row as SpeciesRow
        const pct = r.population > 0 ? Math.round(((r.male + r.female) / r.population) * 100) : 0
        return textCell(r.population > 0 ? `${pct}%` : '—', pct >= 80 ? theme.palette.primary.dark : cc.OnSurfaceVariant, 600)
      }
    },
    {
      width: 80,
      sortable: false,
      field: 'sites_count',
      headerName: 'Sites',
      renderCell: (params: GridRenderCellParams) => textCell(String(((params.row as SpeciesRow).sites || []).length), undefined, 600)
    },
    {
      width: 110,
      sortable: false,
      field: 'enclosures',
      headerName: 'Enclosures',
      renderCell: (params: GridRenderCellParams) => textCell(Number((params.row as SpeciesRow).enclosures || 0).toLocaleString(), undefined, 600)
    },
    {
      width: 90,
      sortable: false,
      field: 'pairs',
      headerName: 'Paired',
      renderCell: (params: GridRenderCellParams) => textCell(Number((params.row as SpeciesRow).pairs || 0).toLocaleString(), undefined, 600)
    },
    {
      width: 90,
      sortable: false,
      field: 'chipped',
      headerName: 'Chip',
      renderCell: (params: GridRenderCellParams) => textCell(Number((params.row as SpeciesRow).chipped || 0).toLocaleString(), undefined, 600)
    },
    {
      width: 90,
      sortable: false,
      field: 'births',
      headerName: 'Births',
      renderCell: (params: GridRenderCellParams) => textCell(Number((params.row as SpeciesRow).births || 0).toLocaleString(), theme.palette.primary.dark, 600)
    },
    {
      width: 90,
      sortable: false,
      field: 'deaths',
      headerName: 'Deaths',
      renderCell: (params: GridRenderCellParams) => textCell(Number((params.row as SpeciesRow).deaths || 0).toLocaleString(), cc.Tertiary, 600)
    },
    {
      width: 110,
      sortable: false,
      field: 'accessions',
      headerName: 'Accessions',
      renderCell: (params: GridRenderCellParams) => {
        const n = Number((params.row as SpeciesRow).accessions || 0)

        return textCell(n ? n.toLocaleString() : '—', n ? cc.OnSurfaceVariant : cc.neutralSecondary, 600)
      }
    },
    {
      width: 110,
      sortable: false,
      field: 'iucn',
      headerName: 'IUCN',
      renderCell: (params: GridRenderCellParams) => (
        <StatChip value={params.row.iucn} bgcolor={`${cc.Tertiary}1A`} color={cc.Tertiary} />
      )
    },
    {
      width: 110,
      sortable: false,
      field: 'cites',
      headerName: 'CITES',
      renderCell: (params: GridRenderCellParams) => (
        <StatChip value={params.row.cites} bgcolor={cc.antzSecondaryBg} color={theme.palette.secondary.main} />
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'readiness',
      headerName: 'Readiness',
      renderCell: readinessCell
    },
    {
      width: 130,
      sortable: false,
      field: 'category',
      headerName: 'Category',
      renderCell: (params: GridRenderCellParams) => textCell(params.row.category)
    },
    {
      width: 120,
      sortable: false,
      field: 'class_name',
      headerName: 'Class',
      renderCell: (params: GridRenderCellParams) => textCell(params.row.class_name)
    },
    {
      width: 140,
      sortable: false,
      field: 'order_name',
      headerName: 'Order',
      renderCell: (params: GridRenderCellParams) => textCell(params.row.order_name)
    },
    {
      width: 150,
      sortable: false,
      field: 'family',
      headerName: 'Family',
      renderCell: (params: GridRenderCellParams) => textCell(params.row.family)
    },
    {
      width: 140,
      sortable: false,
      field: 'genus',
      headerName: 'Genus',
      renderCell: (params: GridRenderCellParams) => textCell(params.row.genus)
    }
  ]

  const metricCol = analysisColumn()
  if (metricCol) {
    const popIdx = cols.findIndex(c => c.field === 'population')
    cols.splice(popIdx + 1, 0, metricCol)
  }

  return cols
}
