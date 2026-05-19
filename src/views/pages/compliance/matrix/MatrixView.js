import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import ClassChipBar from './ClassChipBar'
import SpeciesCell, { ComplianceSpeciesCell } from './SpeciesCell'

const SPECIES_WIDTH = 280
const C_SPECIES_WIDTH = 240
const GENUS_WIDTH = 140
const ORG_COL_WIDTH = 110
const TOTAL_WIDTH = 110

const shortCode = org => org?.short_code || org?.organization_name?.slice(0, 5).toUpperCase() || ''

const headerCellSx = {
  bgcolor: 'grey.50',
  color: 'customColors.neutralSecondary',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: 1,
  borderRight: 1,
  borderColor: 'customColors.SurfaceVariant',
  lineHeight: 1.3,
  px: '20px',
  py: '14px',
  whiteSpace: 'nowrap',
  textAlign: 'right'
}

const bodyCellSx = {
  borderBottom: 1,
  borderRight: 1,
  borderColor: 'customColors.SurfaceVariant',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
  fontSize: 15,
  color: 'customColors.OnSurfaceVariant',
  px: '20px',
  py: '14px',
  whiteSpace: 'nowrap',
  textAlign: 'right'
}

const footerCellSx = {
  ...{
    borderBottom: 0,
    borderRight: 1,
    borderColor: 'customColors.SurfaceVariant',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 700,
    fontSize: 14,
    px: '20px',
    py: '12px',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    position: 'sticky',
    bottom: 0,
    zIndex: 3
  }
}

const SkeletonRows = ({ orgCount }) =>
  Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={`sk-${i}`}>
      <TableCell sx={{ ...bodyCellSx, minWidth: SPECIES_WIDTH, textAlign: 'left' }}>
        <Stack direction='row' spacing={1.25} alignItems='center'>
          <Skeleton variant='rounded' width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width='70%' height={14} />
            <Skeleton width='50%' height={11} />
          </Box>
        </Stack>
      </TableCell>
      <TableCell sx={{ ...bodyCellSx, minWidth: C_SPECIES_WIDTH, textAlign: 'left' }}>
        <Skeleton width='60%' height={14} />
        <Skeleton width='40%' height={11} />
      </TableCell>
      <TableCell sx={{ ...bodyCellSx, width: GENUS_WIDTH, textAlign: 'left' }}>
        <Skeleton width={80} />
      </TableCell>
      {Array.from({ length: Math.max(orgCount, 5) }).map((_, j) => (
        <TableCell key={j} sx={bodyCellSx}>
          <Skeleton width={30} sx={{ ml: 'auto' }} />
        </TableCell>
      ))}
      <TableCell sx={{ ...bodyCellSx, borderRight: 0 }}>
        <Skeleton width={30} sx={{ ml: 'auto' }} />
      </TableCell>
    </TableRow>
  ))

const EmptyRow = ({ colSpan, onClearFilters }) => (
  <TableRow>
    <TableCell colSpan={colSpan} sx={{ py: 8, textAlign: 'center', borderBottom: 0 }}>
      <Stack alignItems='center' spacing={1.5}>
        <Icon icon='mdi:database-search-outline' fontSize={48} color='var(--mui-palette-customColors-Outline)' />
        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
          No species match these filters.
        </Typography>
        <Button size='small' variant='text' onClick={onClearFilters}>
          Clear filters
        </Button>
      </Stack>
    </TableCell>
  </TableRow>
)

const Zero = () => (
  <Box component='span' sx={{ color: 'customColors.Outline', fontWeight: 400 }}>·</Box>
)

const DarkHeader = ({
  total,
  searchInput,
  onSearchInputChange,
  sites,
  siteValue,
  onSiteChange,
  onlyFlagged,
  onOnlyFlaggedChange,
  onlyFlaggedDisabled
}) => (
  <Box
    sx={{
      bgcolor: 'primary.dark',
      color: 'common.white',
      px: 3,
      py: 1.5,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 2.25,
      borderBottom: 1,
      borderColor: 'primary.dark'
    }}
  >
    <Typography sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.1px', color: 'common.white' }}>
      Compliance Matrix
    </Typography>
    <Typography sx={{ fontSize: 12.5, color: theme => alpha(theme.palette.common.white, 0.7) }}>
      {total} species
    </Typography>

    <Box sx={{ flex: 1, minWidth: 12 }} />

    <Stack direction='row' alignItems='center' spacing={1.5}>
      <TextField
        size='small'
        placeholder='Search species…'
        value={searchInput}
        onChange={e => onSearchInputChange(e.target.value)}
        sx={{
          width: 260,
          '& .MuiOutlinedInput-root': {
            color: 'common.white',
            bgcolor: theme => alpha(theme.palette.common.white, 0.08),
            '& fieldset': { borderColor: theme => alpha(theme.palette.common.white, 0.18) },
            '&:hover fieldset': { borderColor: theme => alpha(theme.palette.common.white, 0.32) },
            '&.Mui-focused fieldset': { borderColor: theme => alpha(theme.palette.common.white, 0.5) }
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: theme => alpha(theme.palette.common.white, 0.55),
            opacity: 1
          }
        }}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: 'flex', color: theme => alpha(theme.palette.common.white, 0.55) }}>
              <Icon icon='mdi:magnify' fontSize={18} />
            </Box>
          )
        }}
      />

      <Typography
        sx={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: theme => alpha(theme.palette.common.white, 0.65),
          fontWeight: 500
        }}
      >
        Site
      </Typography>
      <Autocomplete
        size='small'
        options={sites}
        value={siteValue}
        onChange={(_, v) => onSiteChange(v)}
        getOptionLabel={opt => opt?.site_name || ''}
        isOptionEqualToValue={(o, v) => o?.site_id === v?.site_id}
        sx={{
          width: 200,
          '& .MuiOutlinedInput-root': {
            color: 'common.white',
            bgcolor: theme => alpha(theme.palette.common.white, 0.08),
            '& fieldset': { borderColor: theme => alpha(theme.palette.common.white, 0.18) },
            '&:hover fieldset': { borderColor: theme => alpha(theme.palette.common.white, 0.32) },
            '&.Mui-focused fieldset': { borderColor: theme => alpha(theme.palette.common.white, 0.5) }
          },
          '& .MuiSvgIcon-root': { color: theme => alpha(theme.palette.common.white, 0.7) },
          '& .MuiAutocomplete-clearIndicator': { color: theme => alpha(theme.palette.common.white, 0.7) }
        }}
        renderInput={params => <TextField {...params} placeholder='All sites' />}
      />

      <Box
        component='label'
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          color: theme => alpha(theme.palette.common.white, onlyFlaggedDisabled ? 0.35 : 0.85),
          fontSize: 12.5,
          cursor: onlyFlaggedDisabled ? 'not-allowed' : 'pointer'
        }}
      >
        <Switch
          size='small'
          checked={onlyFlagged}
          disabled={onlyFlaggedDisabled}
          onChange={e => onOnlyFlaggedChange(e.target.checked)}
          sx={{
            '& .MuiSwitch-track': {
              bgcolor: theme => alpha(theme.palette.common.white, 0.3)
            }
          }}
        />
        Only flagged
      </Box>
    </Stack>
  </Box>
)

const MatrixView = ({
  searchInput,
  onSearchInputChange,
  sites = [],
  siteValue,
  onSiteChange,
  onlyFlagged,
  onOnlyFlaggedChange,
  onlyFlaggedDisabled,
  classOptions = [],
  taxonomicClass,
  onClassChange,
  orgs = [],
  rows = [],
  total = 0,
  page = 0,
  pageSize = 20,
  onPageChange,
  isLoading = false,
  isError = false,
  errorMessage = '',
  onRetry,
  onClearFilters,
  editingEnabled,
  onEdit
}) => {
  const totalCols = 3 + orgs.length + 1
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const colSums = orgs.map(org =>
    rows.reduce((acc, r) => acc + (r.by_org?.[String(org.organization_id)] || 0), 0)
  )
  const grandSum = rows.reduce((acc, r) => acc + (r.total || 0), 0)
  const animalsInView = grandSum

  return (
    <Box>
      <DarkHeader
        total={total}
        searchInput={searchInput}
        onSearchInputChange={onSearchInputChange}
        sites={sites}
        siteValue={siteValue}
        onSiteChange={onSiteChange}
        onlyFlagged={onlyFlagged}
        onOnlyFlaggedChange={onOnlyFlaggedChange}
        onlyFlaggedDisabled={onlyFlaggedDisabled}
      />

      {isError && (
        <Alert
          severity='error'
          action={
            <Button size='small' onClick={onRetry}>
              Retry
            </Button>
          }
          sx={{ mt: 2 }}
        >
          {errorMessage || 'Failed to load matrix.'}
        </Alert>
      )}

      <Paper
        variant='outlined'
        sx={{
          borderColor: 'customColors.SurfaceVariant',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          borderTop: 0,
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >
        {/* Title row */}
        <Stack
          direction='row'
          alignItems='baseline'
          spacing={2}
          sx={{ px: 3, pt: 2.5, pb: 1.5, flexWrap: 'wrap' }}
        >
          <Typography
            variant='h6'
            sx={{ color: 'customColors.OnSurfaceVariant', fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            Species × Organizations
          </Typography>
          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
            {total} species ·{' '}
            <Box component='b' sx={{ color: 'primary.dark', fontWeight: 700, fontSize: 13 }}>
              {animalsInView}
            </Box>{' '}
            animals in current filter
          </Typography>
        </Stack>

        {/* Class chips */}
        <Box sx={{ px: 3, pb: 2, borderBottom: 1, borderColor: 'customColors.SurfaceVariant' }}>
          <ClassChipBar options={classOptions} value={taxonomicClass} onChange={onClassChange} />
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Table stickyHeader size='small' sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, minWidth: SPECIES_WIDTH, textAlign: 'left' }}>
                  Species
                </TableCell>
                <TableCell
                  sx={{
                    ...headerCellSx,
                    minWidth: C_SPECIES_WIDTH,
                    textAlign: 'left',
                    borderLeft: '1px dashed',
                    borderLeftColor: 'customColors.SurfaceVariant'
                  }}
                >
                  C. Species
                </TableCell>
                <TableCell
                  sx={{
                    ...headerCellSx,
                    minWidth: GENUS_WIDTH,
                    textAlign: 'left',
                    borderLeft: '1px dashed',
                    borderLeftColor: 'customColors.SurfaceVariant'
                  }}
                >
                  Genus
                </TableCell>
                {orgs.map(org => (
                  <TableCell key={org.organization_id} sx={{ ...headerCellSx, width: ORG_COL_WIDTH }}>
                    <Tooltip title={org.organization_name || ''} placement='top'>
                      <span>{shortCode(org)}</span>
                    </Tooltip>
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    ...headerCellSx,
                    width: TOTAL_WIDTH,
                    color: 'customColors.TertiaryDark',
                    borderLeft: 1,
                    borderLeftColor: 'customColors.SurfaceVariant',
                    borderRight: 0
                  }}
                >
                  TOTAL
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && rows.length === 0 ? (
                <SkeletonRows orgCount={orgs.length} />
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={totalCols} onClearFilters={onClearFilters} />
              ) : (
                rows.map(row => (
                  <TableRow
                    key={`${row.taxonomy_id || row.compliance_taxonomy_id}-${row.site_id || 'all'}`}
                    sx={{
                      '&:hover .MuiTableCell-root': { bgcolor: 'grey.50' },
                      ...(row.needs_review && {
                        '& .MuiTableCell-root:first-of-type': {
                          borderLeft: '3px solid',
                          borderLeftColor: 'customColors.Tertiary'
                        }
                      })
                    }}
                  >
                    <TableCell sx={{ ...bodyCellSx, minWidth: SPECIES_WIDTH, textAlign: 'left' }}>
                      <SpeciesCell row={row} editingEnabled={editingEnabled} onEdit={onEdit} />
                    </TableCell>
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        minWidth: C_SPECIES_WIDTH,
                        textAlign: 'left',
                        borderLeft: '1px dashed',
                        borderLeftColor: 'customColors.SurfaceVariant'
                      }}
                    >
                      <ComplianceSpeciesCell row={row} />
                    </TableCell>
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        width: GENUS_WIDTH,
                        fontSize: 12.5,
                        fontStyle: 'italic',
                        fontWeight: 400,
                        textAlign: 'left',
                        color: 'customColors.OnSurfaceVariant',
                        borderLeft: '1px dashed',
                        borderLeftColor: 'customColors.SurfaceVariant'
                      }}
                    >
                      {row.genus || '—'}
                    </TableCell>
                    {orgs.map(org => {
                      const v = row.by_org?.[String(org.organization_id)] ?? 0
                      return (
                        <TableCell
                          key={org.organization_id}
                          sx={{
                            ...bodyCellSx,
                            color: v === 0 ? 'customColors.Outline' : 'customColors.OnSurfaceVariant'
                          }}
                        >
                          {v ? v : <Zero />}
                        </TableCell>
                      )
                    })}
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        color: 'customColors.TertiaryDark',
                        fontWeight: 700,
                        borderLeft: 1,
                        borderLeftColor: 'customColors.SurfaceVariant',
                        borderRight: 0
                      }}
                    >
                      {row.total ?? 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {rows.length > 0 && (
                <TableRow>
                  <TableCell
                    sx={{
                      ...footerCellSx,
                      bgcolor: 'grey.50',
                      color: 'primary.dark',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontSize: 11,
                      textAlign: 'left',
                      borderTop: 1,
                      borderTopColor: 'customColors.SurfaceVariant'
                    }}
                  >
                    TOTAL
                  </TableCell>
                  <TableCell
                    sx={{
                      ...footerCellSx,
                      bgcolor: 'grey.50',
                      borderLeft: '1px dashed',
                      borderLeftColor: 'customColors.SurfaceVariant',
                      borderTop: 1,
                      borderTopColor: 'customColors.SurfaceVariant'
                    }}
                  />
                  <TableCell
                    sx={{
                      ...footerCellSx,
                      bgcolor: 'grey.50',
                      borderLeft: '1px dashed',
                      borderLeftColor: 'customColors.SurfaceVariant',
                      borderTop: 1,
                      borderTopColor: 'customColors.SurfaceVariant'
                    }}
                  />
                  {orgs.map((org, i) => (
                    <TableCell
                      key={org.organization_id}
                      sx={{
                        ...footerCellSx,
                        bgcolor: 'grey.50',
                        color: colSums[i] === 0 ? 'customColors.Outline' : 'customColors.OnSurfaceVariant',
                        borderTop: 1,
                        borderTopColor: 'customColors.SurfaceVariant'
                      }}
                    >
                      {colSums[i] ? colSums[i] : <Zero />}
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{
                      ...footerCellSx,
                      bgcolor: 'customColors.BgTeritary',
                      color: 'customColors.TertiaryDark',
                      borderLeft: 1,
                      borderLeftColor: 'customColors.SurfaceVariant',
                      borderRight: 0,
                      borderTop: 1,
                      borderTopColor: 'customColors.SurfaceVariant'
                    }}
                  >
                    {grandSum}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='flex-end'
            spacing={1.5}
            sx={{
              px: 3,
              py: 1.25,
              borderTop: 1,
              borderColor: 'customColors.SurfaceVariant'
            }}
          >
            <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
              Page {page + 1} of {totalPages}
            </Typography>
            <IconButton size='small' disabled={page === 0} onClick={() => onPageChange(page - 1)}>
              <Icon icon='mdi:chevron-left' fontSize={18} />
            </IconButton>
            <IconButton
              size='small'
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <Icon icon='mdi:chevron-right' fontSize={18} />
            </IconButton>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}

export default MatrixView
