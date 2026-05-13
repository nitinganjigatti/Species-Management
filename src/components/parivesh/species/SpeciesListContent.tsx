import React, { useCallback, useMemo, useState } from 'react'
import { Avatar, Box, Button, Card, CardHeader, Typography } from '@mui/material'
import { GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Icon from 'src/@core/components/icon'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import AddSpecies from 'src/views/pages/parivesh/addSpecies/addSpecies'
import Toaster from 'src/components/Toaster'
import { usePariveshContext } from 'src/context/PariveshContext'
import { addSpecies, getSpeciesListByOrg } from 'src/lib/api/parivesh/addSpecies'

const SpeciesListContent: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedParivesh } = usePariveshContext()

  const [sortBy, setSortBy] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('scientific_name')
  const [filters, setFilters] = useState({ page: 1, limit: 50 })

  // Add-species drawer state — restored from pre-migration behavior.
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState<{ id: number | null; name: string | null; active: string | null }>({
    id: null,
    name: null,
    active: null
  })

  const { data, isLoading } = useQuery({
    queryKey: ['parivesh-species-list', selectedParivesh?.id, filters, sortBy, sortColumn],
    queryFn: () =>
      getSpeciesListByOrg({
        params: { page: filters.page, sortBy, sortColumn, limit: filters.limit }
      }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const rows = useMemo(() => {
    return (data?.data?.species_data || []).map((el: any, i: number) => ({ ...el, id: i + 1 }))
  }, [data])

  const total = Number(data?.data?.total_count) || 0

  // ===== Drawer handlers (restored from pre-migration species page) =====

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, active: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleSubmitData = async (payload: any) => {
    try {
      setSubmitLoader(true)
      const response = await addSpecies(payload)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setResetForm(true)
        setOpenDrawer(false)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }

      // Refetch the species list regardless of `response.success`. Some backends save the row
      // but don't include a `success` flag in the response, so the table would otherwise miss
      // the update. Using `refetchQueries` (instead of `invalidateQueries`) forces an immediate
      // network round-trip rather than relying on a passive stale-revalidate.
      await queryClient.refetchQueries({ queryKey: ['parivesh-species-list'] })
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSortBy(newModel[0].sort === 'asc' ? 'ASC' : 'DESC')
      setSortColumn(newModel[0].field)
    }
  }

  const getColumns = () => [
    {
      width: 50,
      minWidth: 60,

      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.id}</Typography>
    },
    {
      minWidth: 220,
      field: 'species_name',
      headerName: t('parivesh_module.species'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => {
        // SpeciesCard expects `default_icon` as a string URL. The API returns `species_image`
        // either as a string or an array of {attachment, ...}. Normalise both shapes, and fall back
        // to the Antz logo so SpeciesCard always renders the avatar (its internal `&&` guard
        // hides the avatar entirely when `default_icon` is falsy).
        const img = Array.isArray(p.row.species_image) ? p.row.species_image[0]?.attachment : p.row.species_image
        return <SpeciesCard species={{ ...p.row, default_icon: img || '/branding/antz/Antz_logomark_h_color.svg' }} />
      }
    },
    ...Object.keys(
      rows.reduce((acc: any, row: any) => {
        ;(row.organizations || []).forEach((org: any) => {
          acc[org.organization_name] = true
        })
        return acc
      }, {})
    ).map((orgName, index) => ({
      minWidth: 180,
      field: `org_${index}`,
      headerName: orgName,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => {
        const org = (p.row.organizations || []).find((o: any) => o.organization_name === orgName)
        return (
          <Box
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              if (org) {
                router.push(
                  `/parivesh/species/${p.row.tsn_id}?tsn_relation=${p.row.tsn_relation}&tsn_id=${p.row.tsn_id}&org_id=${org.org_id}`
                )
              }
            }}
          >
            <Typography variant='h6' sx={{ color: '#44544A' }}>
              {org ? org.animal_count : '-'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <Box sx={{ bgcolor: '#AFEFEB', px: 1.4, mx: 0.5, borderRadius: 0.4 }}>
                <Typography sx={{ color: '#1F515B' }} variant='caption'>
                  M-{org ? org.male_count : '0'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#FFD3D3', px: 1.4, mx: 0.5, borderRadius: 0.4 }}>
                <Typography sx={{ color: '#1F515B' }} variant='caption'>
                  F-{org ? org.female_count : '0'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#8479F91A', px: 1.4, mx: 0.5, borderRadius: 0.4 }}>
                <Typography sx={{ color: '#E93353' }} variant='caption'>
                  O-{org ? org.other_count : '0'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )
      }
    }))
  ]

  return (
    <>
      <Card sx={{ mt: 4, p: 4 }}>
        <CardHeader
          sx={{ p: 0 }}
          title={t('parivesh_module.species_overview')}
          action={
            <Button variant='contained' startIcon={<Icon icon='mdi:add' />} onClick={addEventSidebarOpen}>
              Add new Species
            </Button>
          }
        />
        <CommonTable
          columns={getColumns()}
          indexedRows={rows}
          total={total}
          loading={isLoading}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
          setPaginationModel={(m: any) => setFilters({ page: m.page + 1, limit: m.pageSize })}
          handleSortModel={handleSortModel}
          searchValue=''
          getRowHeight={() => 'auto'}
          onRowClick={() => {}}
          rowHeight={80}
          externalTableStyle={{
            '& .MuiDataGrid-cell': { py: 2.5, px: 3, display: 'flex', alignItems: 'center' },
            // Suppress MUI's default row-hover tint — we only want per-cell hover highlight,
            // not the whole row turning a different colour.
            '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: 'transparent' },
            '& .MuiDataGrid-columnHeader': { px: 3 },

            // Per-cell green hover highlight (org count cells)
            '& .MuiDataGrid-cell:hover': {
              backgroundColor: '#F2FFF8',
              border: '0.5px solid rgba(55, 189, 105, 0.5)',
              borderRadius: '8px'
            },

            // Sticky S.NO column (left edge)
            '& .MuiDataGrid-cell[data-field="sl_no"]': {
              position: 'sticky',
              left: 0,
              zIndex: 3,
              backgroundColor: theme.palette.background.paper
            },
            '& .MuiDataGrid-columnHeader[data-field="sl_no"]': {
              position: 'sticky',
              left: 0,
              zIndex: 5,
              backgroundColor: theme.palette.customColors.customTableHeaderBg
            },

            // Sticky SPECIES column — offset by 60px (sl_no width)
            '& .MuiDataGrid-cell[data-field="species_name"]': {
              position: 'sticky',
              left: 60,
              zIndex: 3,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
            },
            '& .MuiDataGrid-columnHeader[data-field="species_name"]': {
              position: 'sticky',
              left: 60,
              zIndex: 5,
              backgroundColor: theme.palette.customColors.customTableHeaderBg,
              borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
            },

            // Suppress the green hover border on sticky cells — they keep their solid Surface bg
            // instead of the green org-cell highlight, otherwise the pinned columns flash green
            // and lose their separator border on direct hover.
            '& .MuiDataGrid-cell[data-field="sl_no"]:hover': {
              backgroundColor: theme.palette.customColors.Surface,
              border: 'none',
              borderRadius: 0
            },
            '& .MuiDataGrid-cell[data-field="species_name"]:hover': {
              backgroundColor: theme.palette.customColors.Surface,
              border: 'none',
              borderRadius: 0,
              borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
            }
          }}
        />
      </Card>

      <AddSpecies
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
      />
    </>
  )
}

export default SpeciesListContent
