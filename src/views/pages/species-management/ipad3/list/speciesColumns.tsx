import { Avatar, Box, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import {
  analysisValue,
  type AnalysisFilter,
  type SpeciesRow
} from 'src/views/pages/species-management/ipad3/list/speciesListing.utils'

/**
 * Column definitions for the Species Management listing — the CC table language.
 * Identity column carries the Red List dot + code inline after the common name; CITES is its
 * own plain-text column after Deaths (stakeholder call 2026-08-27). Population is the
 * single-row M·F·U·T lane column — total bold list-green in the last lane (user kept
 * this over a two-line Total experiment, 2026-08-28).
 * Column widths are sized so no header or figure ever clips — the table scrolls sooner
 * than it cuts a column. Only two figures on a row wear colour: population/births in the
 * list green, deaths in coral — colouring every number would rank none of them. Zeros
 * print as an em dash in the pale ink: a nil is a silence, not a finding.
 */
// Lanes of the Total column's M F U line — shared by the header letters and every
// row's numbers so each figure aligns under its own letter; a slot fits a 4-digit
// count ("1,234") without shifting its neighbours. No dot separators — alignment separates.
const SEX_SLOT_W = 48

// renderHeader bypasses .MuiDataGrid-columnHeaderTitle, so both header lines carry the
// table's native header spec verbatim (see the listing view's columnHeaderTitle rule).
const SEX_HEAD_TYPE = {
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: skin.TABLE_HEAD_INK,
  lineHeight: 1.2
} as const

export const buildSpeciesColumns = (theme: Theme, analysis?: AnalysisFilter, showClass?: boolean): GridColDef[] => {
  const cc = theme.palette.customColors as Record<string, string>

  const textCell = (value: string, color?: string, fontWeight?: number) => (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      <Typography
        sx={{ fontSize: '1rem', color: color || skin.INK2, fontWeight, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Box>
  )

  // A count that is genuinely zero prints as the dash in the pale ink.
  const figureCell = (n: number, color: string) =>
    n > 0 ? textCell(n.toLocaleString(), color, 600) : textCell('—', skin.DASH_INK)

  // ── Conservation status — the published Red List fills, dot + code ─────────
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

  // The dot + two letters, never a filled badge: the standard's own yellow is 1.9:1 on
  // white, so the FILL carries the encoding and the type beside it is readable ink.
  const iucnMark = (s?: string) => {
    const code = iucnShort(s)
    if (!code) return null
    const rl = skin.RED_LIST.find(r => r.code === code)

    return (
      <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexShrink: 0 }} title={rl?.name || code}>
        {rl && (
          <Box
            component='span'
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              bgcolor: rl.fill,
              // Not Evaluated's published fill is WHITE — the outline is what keeps it a mark.
              boxShadow: rl.outline ? `inset 0 0 0 1px ${rl.outline}` : undefined
            }}
          />
        )}
        <Typography component='span' sx={{ fontSize: '13px', fontWeight: 600, color: skin.MUTED }}>
          {code}
        </Typography>
      </Box>
    )
  }

  // The appendix's own name — "Appendix I", "Appendix II", "Appendix I/II" — with the
  // trailing descriptor ("Regulated Trade" etc.) dropped; nothing for "No Data" / "Not Listed".
  const citesShort = (c?: string) => {
    const p = (c || '').split('(')[0].trim()
    if (!/Appendix/i.test(p)) return null

    return p
  }

  // Its own column (between Species and M·F·U·T) — plain text, no tag or chip.
  // Unlisted / no data prints the pale dash, not an empty cell.
  const citesCell = (c?: string) => {
    const short = citesShort(c)

    return short ? textCell(short, skin.INK2, 500) : textCell('—', skin.DASH_INK)
  }

  const speciesNameCell = (params: GridRenderCellParams) => {
    const r = params.row as SpeciesRow & { image?: string }
    // Fallback = antz logomark (module-wide avatar standard, matches AnimalCell); real
    // species photos fill the tile, the logomark sits contained with breathing room.
    // The dataset stamps the Housing module's stock icon as default_icon on every row —
    // treat that as "no photo" too, otherwise the fallback never fires.
    const photo = r.image && r.image !== '/images/housing/species-icon-colored.svg' ? r.image : ''
    const img = photo || '/images/branding/Antz_logomark_h_color.svg'

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%', minWidth: 0 }}>
        <Avatar
          variant='rounded'
          src={img}
          alt={r.scientific_name}
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '9px',
            bgcolor: skin.mixOverWhite(skin.LIST_GREEN, 0.09),
            '& img': photo ? { objectFit: 'cover' } : { objectFit: 'contain', padding: '5px' }
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              variant='subtitle2'
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: skin.INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {r.species_name || '—'}
            </Typography>
            {iucnMark(r.iucn)}
          </Box>
          <Typography
            sx={{
              fontSize: '14px',
              fontStyle: 'italic',
              color: skin.FAINT,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mt: '2px'
            }}
          >
            {r.scientific_name || ''}
          </Typography>
        </Box>
      </Box>
    )
  }

  // Temporary metric column surfaced while an Analysis filter is active (inserted after M·F·U·T).
  const analysisColumn = (): GridColDef | null => {
    if (!analysis?.mode) return null

    if (analysis.mode === 'lifespan') {
      return {
        width: 170,
        sortable: false,
        field: 'analysis_metric',
        headerName: 'Avg adult life',
        renderCell: (params: GridRenderCellParams) => {
          const r = params.row as SpeciesRow
          const head = r.lifespanAvgAdult ?? r.lifespanAvg

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: skin.strokeOf('#00abab'), fontVariantNumeric: 'tabular-nums' }}>
                {head != null ? `${head}y` : '—'}
              </Typography>
              {r.lifespanMax != null && (
                <Typography sx={{ fontSize: '13px', color: skin.FAINT, fontVariantNumeric: 'tabular-nums' }}>
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
      width: 190,
      sortable: false,
      field: 'analysis_metric',
      headerName: isBirths ? 'Births in period' : 'Deaths in period',
      renderCell: (params: GridRenderCellParams) => {
        const v = analysisValue(params.row as SpeciesRow, analysis) || 0

        return figureCell(v, isBirths ? skin.LIST_GREEN : skin.CORAL)
      }
    }
  }

  const cols: GridColDef[] = [
    {
      minWidth: 260,
      flex: 1,
      sortable: false,
      field: 'species_name',
      headerName: 'Species',
      renderCell: speciesNameCell
    },
    {
      // Single sex/population column as FOUR aligned slots — M / F / U / T each get a
      // fixed-width, left-aligned lane sized for a 4-digit count ("1,234"), so every
      // row's M values line up under the M header letter (same for F/U/T). T = total,
      // BOLD list-green so it anchors the scan (the one always-worth-finding figure).
      // Unsexed is the number an operator acts on — it keeps the darker ink while M/F
      // sit muted. No dot separators — alignment separates.
      width: 232,
      sortable: false,
      field: 'population',
      headerName: 'M · F · U · T',
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {(['M', 'F', 'U', 'T'] as const).map(l => (
            <Typography key={l} component='span' sx={{ ...SEX_HEAD_TYPE, width: SEX_SLOT_W, flexShrink: 0 }}>
              {l}
            </Typography>
          ))}
        </Box>
      ),
      renderCell: (params: GridRenderCellParams) => {
        const r = params.row as SpeciesRow
        const seg = (n: number, color: string) => (
          <Typography
            component='span'
            sx={{ width: SEX_SLOT_W, flexShrink: 0, fontSize: '15px', fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}
          >
            {Number(n || 0).toLocaleString()}
          </Typography>
        )

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {seg(r.male, skin.MUTED)}
            {seg(r.female, skin.MUTED)}
            {seg(r.undetermined, r.undetermined > 0 ? skin.INK2 : skin.DASH_INK)}
            <Typography
              component='span'
              sx={{ width: SEX_SLOT_W, flexShrink: 0, fontSize: '1rem', fontWeight: 700, color: skin.LIST_GREEN, fontVariantNumeric: 'tabular-nums' }}
            >
              {Number(r.population || 0).toLocaleString()}
            </Typography>
          </Box>
        )
      }
    },
    {
      width: 90,
      sortable: false,
      field: 'sites_count',
      headerName: 'Sites',
      renderCell: (params: GridRenderCellParams) => textCell(String(((params.row as SpeciesRow).sites || []).length), skin.INK2, 500)
    },
    {
      width: 90,
      sortable: false,
      field: 'enclosures',
      headerName: 'Encl',
      renderCell: (params: GridRenderCellParams) =>
        textCell(Number((params.row as SpeciesRow).enclosures || 0).toLocaleString(), skin.INK2, 500)
    },
    {
      width: 100,
      sortable: false,
      field: 'pairs',
      headerName: 'Paired',
      renderCell: (params: GridRenderCellParams) => figureCell(Number((params.row as SpeciesRow).pairs || 0), skin.INK2)
    },
    {
      width: 100,
      sortable: false,
      field: 'births',
      headerName: 'Births',
      renderCell: (params: GridRenderCellParams) => figureCell(Number((params.row as SpeciesRow).births || 0), skin.LIST_GREEN)
    },
    {
      width: 100,
      sortable: false,
      field: 'deaths',
      headerName: 'Deaths',
      renderCell: (params: GridRenderCellParams) => figureCell(Number((params.row as SpeciesRow).deaths || 0), skin.CORAL)
    },
    {
      // Sized for the longest value the data carries ("Appendix I/II/III") — never clips.
      width: 180,
      sortable: false,
      field: 'cites',
      headerName: 'CITES',
      renderCell: (params: GridRenderCellParams) => citesCell((params.row as SpeciesRow).cites)
    },
    // Beside CITES, only while the class tabs sit on All / Others — under a single
    // featured class (Birds/Mammals/Reptiles) the column would repeat the tab.
    ...(showClass
      ? [
          {
            width: 150,
            sortable: false,
            field: 'class_name',
            headerName: 'Class',
            renderCell: (params: GridRenderCellParams) => {
              const name = (params.row as SpeciesRow).class_name

              return name ? textCell(name, skin.INK2, 500) : textCell('—', skin.DASH_INK)
            }
          } as GridColDef
        ]
      : []),
    {
      width: 90,
      sortable: false,
      field: 'sexed_pct',
      headerName: 'Sexed',
      renderCell: (params: GridRenderCellParams) => {
        const r = params.row as SpeciesRow
        const pct = r.population > 0 ? Math.round(((r.male + r.female) / r.population) * 100) : 0

        return r.population > 0 ? textCell(`${pct}%`, skin.INK2, 500) : textCell('—', skin.DASH_INK)
      }
    },
    {
      width: 90,
      sortable: false,
      field: 'chipped',
      headerName: 'Chip',
      renderCell: (params: GridRenderCellParams) => {
        const r = params.row as SpeciesRow
        const pct = r.population > 0 ? Math.round((Number(r.chipped || 0) / r.population) * 100) : 0

        return r.population > 0 ? textCell(`${pct}%`, skin.INK2, 500) : textCell('—', skin.DASH_INK)
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
