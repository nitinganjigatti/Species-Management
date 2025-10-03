import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, Typography } from '@mui/material'
import { useMemo } from 'react'
import ReactTable from 'src/views/table/ReactTable'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const SPECIES_IMAGE = '/images/avatars/1.png'

const withTotal = stock => ({
  ...stock,
  t: (stock.m || 0) + (stock.f || 0) + (stock.o || 0)
})

const createClosingStock = ({ opening, births, acquisitions, disposals, deaths }) => {
  const compute = key =>
    (opening[key] || 0) + (births[key] || 0) + (acquisitions[key] || 0) - (disposals[key] || 0) - (deaths[key] || 0)

  return withTotal({
    m: compute('m'),
    f: compute('f'),
    o: compute('o')
  })
}

const buildRow = ({
  id,
  primary,
  secondary,
  image = SPECIES_IMAGE,
  opening,
  births,
  acquisitions,
  disposals,
  deaths
}) => {
  const openingStock = withTotal(opening)
  const birthStock = withTotal(births)
  const acquisitionStock = withTotal(acquisitions)
  const disposalStock = withTotal(disposals)
  const deathStock = withTotal(deaths)

  const closingStock = createClosingStock({
    opening: openingStock,
    births: birthStock,
    acquisitions: acquisitionStock,
    disposals: disposalStock,
    deaths: deathStock
  })

  return {
    id,
    species: {
      primary,
      secondary,
      image
    },
    speciesCard: {
      default_icon: image,
      common_name: primary,
      scientific_name: secondary,
      primary_identifier_type: 'Species ID',
      primary_identifier_value: id.toUpperCase()
    },
    openingStock,
    births: birthStock,
    acquisitions: acquisitionStock,
    disposals: disposalStock,
    deaths: deathStock,
    closingStock
  }
}

const STOCK_DATA = [
  buildRow({
    id: 'row-1',
    primary: 'African Grey Parrot',
    secondary: 'Budgerigar',
    opening: { m: 150, f: 150, o: 150 },
    births: { m: 150, f: 150, o: 150 },
    acquisitions: { m: 150, f: 150, o: 150 },
    disposals: { m: 150, f: 150, o: 150 },
    deaths: { m: 150, f: 150, o: 150 }
  }),
  buildRow({
    id: 'row-2',
    primary: 'Hyacinth Macaw',
    secondary: 'Lovebird',
    opening: { m: 220, f: 220, o: 220 },
    births: { m: 220, f: 220, o: 220 },
    acquisitions: { m: 220, f: 220, o: 220 },
    disposals: { m: 220, f: 220, o: 220 },
    deaths: { m: 220, f: 220, o: 220 }
  }),
  buildRow({
    id: 'row-3',
    primary: 'Amazon Parrot',
    secondary: 'Eclectus Parrot',
    opening: { m: 190, f: 190, o: 190 },
    births: { m: 190, f: 190, o: 190 },
    acquisitions: { m: 190, f: 190, o: 190 },
    disposals: { m: 190, f: 190, o: 190 },
    deaths: { m: 190, f: 190, o: 190 }
  }),
  buildRow({
    id: 'row-4',
    primary: 'Nanday Parakeet',
    secondary: 'Canary Winged Parakeet',
    opening: { m: 165, f: 165, o: 165 },
    births: { m: 165, f: 165, o: 165 },
    acquisitions: { m: 165, f: 165, o: 165 },
    disposals: { m: 165, f: 165, o: 165 },
    deaths: { m: 165, f: 165, o: 165 }
  }),
  buildRow({
    id: 'row-5',
    primary: 'Senegal Parrot',
    secondary: 'Pionus Parrot',
    opening: { m: 140, f: 140, o: 140 },
    births: { m: 140, f: 140, o: 140 },
    acquisitions: { m: 140, f: 140, o: 140 },
    disposals: { m: 140, f: 140, o: 140 },
    deaths: { m: 140, f: 140, o: 140 }
  }),
  buildRow({
    id: 'row-6',
    primary: 'Green Cheek Conure',
    secondary: 'Crimson Rosella',
    opening: { m: 210, f: 210, o: 210 },
    births: { m: 210, f: 210, o: 210 },
    acquisitions: { m: 210, f: 210, o: 210 },
    disposals: { m: 210, f: 210, o: 210 },
    deaths: { m: 210, f: 210, o: 210 }
  }),
  buildRow({
    id: 'row-7',
    primary: 'Sun Conure',
    secondary: 'Parrotlet',
    opening: { m: 175, f: 175, o: 175 },
    births: { m: 175, f: 175, o: 175 },
    acquisitions: { m: 175, f: 175, o: 175 },
    disposals: { m: 175, f: 175, o: 175 },
    deaths: { m: 175, f: 175, o: 175 }
  }),
  buildRow({
    id: 'row-8',
    primary: 'Saddle-Backed Tern',
    secondary: "Bourke's Parakeet",
    opening: { m: 160, f: 160, o: 160 },
    births: { m: 160, f: 160, o: 160 },
    acquisitions: { m: 160, f: 160, o: 160 },
    disposals: { m: 160, f: 160, o: 160 },
    deaths: { m: 160, f: 160, o: 160 }
  }),
  buildRow({
    id: 'row-9',
    primary: 'Lories',
    secondary: 'Macaw',
    opening: { m: 250, f: 250, o: 250 },
    births: { m: 250, f: 250, o: 250 },
    acquisitions: { m: 250, f: 250, o: 250 },
    disposals: { m: 250, f: 250, o: 250 },
    deaths: { m: 250, f: 250, o: 250 }
  }),
  buildRow({
    id: 'row-10',
    primary: 'Cockatiel',
    secondary: 'Indian Ring Neck',
    opening: { m: 145, f: 145, o: 145 },
    births: { m: 145, f: 145, o: 145 },
    acquisitions: { m: 145, f: 145, o: 145 },
    disposals: { m: 145, f: 145, o: 145 },
    deaths: { m: 145, f: 145, o: 145 }
  }),
  buildRow({
    id: 'row-11',
    primary: 'Scarlet Macaw',
    secondary: 'Tamarin Parakeet',
    opening: { m: 230, f: 230, o: 230 },
    births: { m: 230, f: 230, o: 230 },
    acquisitions: { m: 230, f: 230, o: 230 },
    disposals: { m: 230, f: 230, o: 230 },
    deaths: { m: 230, f: 230, o: 230 }
  }),
  buildRow({
    id: 'row-12',
    primary: 'Yellow-Naped Amazon',
    secondary: 'Rainbow Lorikeet',
    opening: { m: 240, f: 240, o: 240 },
    births: { m: 240, f: 240, o: 240 },
    acquisitions: { m: 240, f: 240, o: 240 },
    disposals: { m: 240, f: 240, o: 240 },
    deaths: { m: 240, f: 240, o: 240 }
  }),
  buildRow({
    id: 'row-13',
    primary: 'Cockatoo',
    secondary: 'Quaker Parrot',
    opening: { m: 180, f: 180, o: 180 },
    births: { m: 180, f: 180, o: 180 },
    acquisitions: { m: 180, f: 180, o: 180 },
    disposals: { m: 180, f: 180, o: 180 },
    deaths: { m: 180, f: 180, o: 180 }
  })
]

const metricKeys = [
  { key: 'm', label: 'M' },
  { key: 'f', label: 'F' },
  { key: 'o', label: 'O' },
  { key: 't', label: 'T' }
]

const createNumberCell =
  theme =>
  ({ value }) =>
    (
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: 0,
          color: theme.palette.customColors.OnSurfaceVariant,
          textAlign: 'center'
        }}
      >
        {value ?? '-'}
      </Typography>
    )

const createMetricGroup = (field, headerName, renderNumber) => ({
  id: field,
  headerName,
  pinned: 'left',
  headerAlign: 'center',
  textAlign: 'center',
  columns: metricKeys.map(metric => ({
    id: `${field}_${metric.key}`,
    field: `${field}.${metric.key}`,
    headerName: metric.label,
    width: 96,
    minWidth: 80,
    textAlign: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: renderNumber
  }))
})

const createColumns = theme => {
  const numberCell = createNumberCell(theme)

  return [
    {
      id: 'species',
      field: 'species.primary',
      headerName: 'Species Name',
      // pinned: 'left',
      pinned: 'left',
      sortable: false,
      headerAlign: 'left',
      textAlign: 'left',
      renderCell: ({ row }) => (
        <SpeciesCard
          species={{
            default_icon: row?.speciesCard?.default_icon || row?.species?.image || SPECIES_IMAGE,
            common_name: row?.speciesCard?.common_name || row?.species?.primary,
            scientific_name: row?.speciesCard?.scientific_name || row?.species?.secondary,
            primary_identifier_type: row?.speciesCard?.primary_identifier_type || 'Species ID',
            primary_identifier_value:
              row?.speciesCard?.primary_identifier_value ||
              (typeof row?.id === 'string' ? row.id.toUpperCase() : row?.id ?? 'STOCK-ID')
          }}
        />
      )
    },
    createMetricGroup('openingStock', 'Opening Stock', numberCell),
    createMetricGroup('births', 'Births', numberCell),
    createMetricGroup('acquisitions', 'Acquisitions', numberCell),
    createMetricGroup('disposals', 'Disposals', numberCell),
    createMetricGroup('deaths', 'Deaths', numberCell),
    createMetricGroup('closingStock', 'Closing Stock', numberCell)
  ]
}

const AnimalStockReport = () => {
  const theme = useTheme()

  const rows = useMemo(() => STOCK_DATA, [])
  const columns = useMemo(() => createColumns(theme), [theme])

  return (
    <Card>
      <CardHeader
        title={
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Animal Stock Report
          </Typography>
        }
      />
      <Box sx={{ p: 5 }}>
        <ReactTable
          rows={rows}
          columns={columns}
          rowCount={rows.length}
          pagination={false}
          rowHeight={82}
          headerHeight={48}
          subHeaderHeight={32}
          cellStyle={{ padding: '12px 16px' }}
          rowsInView={rows.length}
          paginationModel={{ page: 0, pageSize: rows.length }}
          tableContainerSx={{ maxHeight: 'unset' }}
          modifyColumnPinning
        />
      </Box>
    </Card>
  )
}

export default AnimalStockReport
