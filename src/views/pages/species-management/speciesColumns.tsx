import { Box, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import StatChip from 'src/views/utility/StatChip'
import { getReadiness, type SpeciesRow } from 'src/views/pages/species-management/speciesListing.utils'

/**
 * Column definitions for the Species Management listing.
 * Management-first order: identity → population → conservation (IUCN/CITES) → readiness → category → taxonomy.
 * Per-sex columns are dropped here (they live on the species detail page); readiness summarises them.
 * Keeps the existing DataGrid styling (SpeciesCard + StatChip + token colors).
 */
export const buildSpeciesColumns = (theme: Theme): GridColDef[] => {
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

  return [
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
}
