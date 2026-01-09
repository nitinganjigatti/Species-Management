import { useState, useMemo, useCallback } from 'react'
import { Box, Typography, Avatar, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCaretakersDrawer from './AnimalCaretakersDrawer'

const FALLBACK_IMAGE = '/images/branding/Antz_logomark_h_color.svg'

const AnimalWiseList = ({ data, pagination, loading, onPaginationChange }) => {
  const theme = useTheme()
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const paginationModel = useMemo(
    () => ({
      page: pagination?.page || 0,
      pageSize: pagination?.pageSize || 20
    }),
    [pagination?.page, pagination?.pageSize]
  )

  const handleAnimalClick = useCallback(animal => {
    setSelectedAnimal(animal)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedAnimal(null)
  }, [])

  const handlePaginationChange = useCallback(
    model => {
      onPaginationChange?.(model)
    },
    [onPaginationChange]
  )

  const columns = useMemo(
    () => [
      {
        field: 'animal',
        headerName: 'Animal',
        flex: 1.5,
        minWidth: 350,
        renderCell: ({ row }) => {
          const sex = (row?.sex || row?.gender)?.toLowerCase()
          const isGroup = row?.type === 'group'

          let genderLabel = '-'
          let genderBg = theme.palette.grey[200]
          let genderColor = theme.palette.text.secondary

          if (isGroup) {
            genderLabel = 'G'
            genderBg = theme.palette.customColors.addPrimary
            genderColor = theme.palette.primary.contrastText
          } else if (sex === 'male') {
            genderLabel = 'M'
            genderBg = theme.palette.customColors.SecondaryContainer
            genderColor = theme.palette.customColors.OnSecondaryContainer
          } else if (sex === 'female') {
            genderLabel = 'F'
            genderBg = theme.palette.customColors.AntzTertiary
            genderColor = '#4A0415'
          } else if (sex === 'undetermined') {
            genderLabel = 'UD'
            genderBg = theme.palette.customColors.displaybgSecondary
            genderColor = theme.palette.customColors.Error
          } else if (sex === 'indeterminate') {
            genderLabel = 'ID'
            genderBg = theme.palette.customColors.displaybgSecondary
            genderColor = theme.palette.customColors.OnSurfaceVariant
          }

          const identifier =
            row.local_identifier_name && row.local_identifier_value
              ? `${row.local_identifier_name}: ${row.local_identifier_value}`
              : row.animal_id
                ? `AID: ${row.animal_id}`
                : '-'

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Avatar
                  src={row.default_icon || FALLBACK_IMAGE}
                  sx={{
                    width: 44,
                    height: 44,
                    '& img': {
                      objectFit: row.default_icon?.includes('.svg') ? 'contain' : 'cover',
                      padding: !row.default_icon ? '4px' : 0
                    }
                  }}
                  imgProps={{
                    onError: e => {
                      e.target.src = FALLBACK_IMAGE
                    }
                  }}
                />
                <Box
                  sx={{
                    width: genderLabel.length > 1 ? 32 : 24,
                    height: 24,
                    bgcolor: genderBg,
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: genderColor }}>{genderLabel}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {identifier}
                </Typography>
                {(row.common_name || row.default_common_name) && (
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {row.common_name || row.default_common_name}
                  </Typography>
                )}
                {(row.scientific_name || row.complete_name) && (
                  <Typography
                    sx={{
                      fontSize: '13px',
                      fontWeight: 500,
                      fontStyle: 'italic',
                      color: theme.palette.text.secondary
                    }}
                  >
                    {row.scientific_name || row.complete_name}
                  </Typography>
                )}
              </Box>
            </Box>
          )
        }
      },
      {
        field: 'location',
        headerName: 'Location',
        flex: 0.8,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {row.user_enclosure_name && (
              <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                Encl: {row.user_enclosure_name}
              </Typography>
            )}
            {row.section_name && (
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                Sec: {row.section_name}
              </Typography>
            )}
            {row.site_name && (
              <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                Site: {row.site_name}
              </Typography>
            )}
          </Box>
        )
      },
      {
        field: 'total_keepers',
        headerName: 'Caretakers',
        flex: 0.5,
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Chip
            label={row.total_keepers || 0}
            size='small'
            sx={{
              backgroundColor: theme.palette.customColors?.primaryLight || '#E8F5E9',
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '14px',
              minWidth: 50
            }}
          />
        )
      },
      {
        field: 'has_primary',
        headerName: 'Primary',
        flex: 0.4,
        minWidth: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) =>
          row.has_primary ? (
            <Icon icon='mdi:crown' fontSize={20} color={theme.palette.warning.main} />
          ) : (
            <Typography sx={{ color: theme.palette.text.disabled }}>-</Typography>
          )
      },
      {
        field: 'actions',
        headerName: '',
        flex: 0.2,
        minWidth: 50,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: () => <Icon icon='mdi:chevron-right' fontSize={24} color={theme.palette.text.secondary} />
      }
    ],
    [theme]
  )

  const tableData = useMemo(
    () =>
      (data || []).map(animal => ({
        ...animal,
        id: animal.animal_id || animal.id
      })),
    [data]
  )

  // Show empty state only when not loading and no data
  if (!loading && (!data || data.length === 0)) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography sx={{ color: theme.palette.text.secondary }}>No animals found</Typography>
      </Box>
    )
  }

  return (
    <>
      <CommonTable
        columns={columns}
        indexedRows={tableData}
        total={pagination?.total || 0}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={handlePaginationChange}
        pageSizeOptions={[10, 20, 50]}
        rowHeight={90}
        onRowClick={params => handleAnimalClick(params.row)}
      />

      {selectedAnimal && <AnimalCaretakersDrawer open={drawerOpen} onClose={handleCloseDrawer} animal={selectedAnimal} />}
    </>
  )
}

export default AnimalWiseList
