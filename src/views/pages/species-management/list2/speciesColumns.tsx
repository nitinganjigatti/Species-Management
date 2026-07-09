import { Avatar, Box, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import {
  analysisValue,
  type AnalysisFilter,
  type SpeciesRow
} from 'src/views/pages/species-management/list2/speciesListing.utils'

/**
 * Column definitions for the Species Management listing.
 * Identity column carries conservation status inline (IUCN short code after the common name +
 * a CITES tag after the scientific name) — mirroring the wildventure prototype's species cell.
 * Sexed % and Chip % are the trailing columns; both are percentages, never raw counts.
 * Taxonomy / category / readiness / accessions columns live in the filters + detail page, not the table.
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

  // ── Conservation status, prototype-faithful, on-system ──────────────────────
  const IUCN_ABBR: Record<string, string> = {
    'Critically Endangered': 'CR',
    Endangered: 'EN',
    Vulnerable: 'VU',
    'Near Threatened': 'NT',
    'Least Concern': 'LC',
    'Data Deficient': 'DD',
    'Not Evaluated': 'NE',
    'Extinct in the Wild': 'EW',
    Extinct: 'EX',
    'Not Listed': 'NL'
  }

  const iucnKey = (s?: string) => (s || '').split('(')[0].trim()
  const iucnShort = (s?: string) => IUCN_ABBR[iucnKey(s)] || iucnKey(s)

  const iucnColor = (s?: string) => {
    const k = iucnKey(s)
    if (k === 'Critically Endangered' || k === 'Endangered' || k === 'Vulnerable') return cc.Tertiary
    if (k === 'Near Threatened') return theme.palette.warning.main
    if (k === 'Least Concern') return theme.palette.primary.dark

    return cc.neutralSecondary
  }

  // Roman appendix(es) only; nothing for "No Data" / "Not Listed".
  const citesShort = (c?: string) => {
    const p = (c || '').split('(')[0].trim()
    if (!/Appendix/i.test(p)) return null

    return p.replace(/Appendix\s*/i, '').trim()
  }

  const citesTag = (c?: string) => {
    const short = citesShort(c)
    if (!short) return null

    return (
      <Box
        component='span'
        sx={{
          ml: 0.5,
          px: 0.5,
          flexShrink: 0,
          borderRadius: '3px',
          border: `1px solid ${theme.palette.secondary.main}30`,
          color: theme.palette.secondary.main,
          fontSize: 10,
          fontWeight: 600,
          lineHeight: 1.6,
          whiteSpace: 'nowrap'
        }}
      >
        CITES {short}
      </Box>
    )
  }

  const speciesNameCell = (params: GridRenderCellParams) => {
    const r = params.row as SpeciesRow & { image?: string }
    const img = r.image || '/images/housing/species-icon-colored.svg'
    const code = iucnShort(r.iucn)

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%', minWidth: 0 }}>
        <Avatar
          variant='rounded'
          src={img}
          alt={r.scientific_name}
          sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: cc.Surface, '& img': { objectFit: 'cover' } }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography
              variant='subtitle2'
              sx={{
                fontWeight: 600,
                color: cc.OnSurfaceVariant,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {r.species_name || '—'}
            </Typography>
            {code && (
              <Typography component='span' variant='caption' sx={{ fontWeight: 700, flexShrink: 0, color: iucnColor(r.iucn) }}>
                ({code})
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Typography
              variant='caption'
              sx={{
                fontStyle: 'italic',
                color: cc.neutralSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {r.scientific_name || ''}
            </Typography>
            {citesTag(r.cites)}
          </Box>
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
      minWidth: 260,
      flex: 1,
      sortable: false,
      field: 'species_name',
      headerName: 'Species',
      renderCell: speciesNameCell
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
      width: 90,
      sortable: false,
      field: 'chipped',
      headerName: 'Chip %',
      renderCell: (params: GridRenderCellParams) => {
        const r = params.row as SpeciesRow
        const pct = r.population > 0 ? Math.round((Number(r.chipped || 0) / r.population) * 100) : 0

        return textCell(r.population > 0 ? `${pct}%` : '—', pct >= 80 ? theme.palette.primary.dark : cc.OnSurfaceVariant, 600)
      }
    }
  ]

  const metricCol = analysisColumn()
  if (metricCol) {
    const popIdx = cols.findIndex(c => c.field === 'population')
    cols.splice(popIdx + 1, 0, metricCol)
  }

  return cols
}
