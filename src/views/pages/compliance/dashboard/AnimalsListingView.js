import { Box, Card, Typography, Button, Stack, Chip, TextField } from '@mui/material'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const AnimalsListingView = ({
  total,
  rows,
  columns,
  paginationModel,
  setPaginationModel,
  searchValue,
  handleSearch,
  activeChips,
  onRemoveChip,
  onClearAll,
  loading,
  onRowClick,
  onExportClick,
  rowHeight
}) => (
  <Box>
    <Stack direction='row' justifyContent='space-between' alignItems='flex-start' mb={4} flexWrap='wrap' gap={2}>
      <Box>
        <Typography variant='h5' sx={{ color: 'primary.dark', fontWeight: 600 }}>Animals</Typography>
        <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
          {total.toLocaleString()} results{activeChips.length ? ` · ${activeChips.length} filter${activeChips.length === 1 ? '' : 's'} applied` : ''}
        </Typography>
      </Box>
      <Button variant='outlined' onClick={onExportClick}>Export CSV</Button>
    </Stack>

    <Card sx={{ p: 3, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size='small'
        placeholder='Search by ID, local ID…'
        value={searchValue}
        onChange={e => handleSearch(e.target.value)}
        sx={{ minWidth: 260 }}
      />
      <Stack direction='row' spacing={1} flexWrap='wrap'>
        {activeChips.map(c => (
          <Chip
            key={c.key}
            label={c.label}
            onDelete={() => onRemoveChip(c.key)}
            sx={{ bgcolor: 'customColors.OnBackground', color: 'primary.dark' }}
          />
        ))}
      </Stack>
      {activeChips.length > 0 ? (
        <Button size='small' variant='text' onClick={onClearAll} sx={{ ml: 'auto' }}>Clear all</Button>
      ) : null}
    </Card>

    <Card>
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
        rowHeight={rowHeight}
      />
    </Card>
  </Box>
)

export default AnimalsListingView
