import React, { useMemo, useState } from 'react'
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Tooltip,
  Typography
} from '@mui/material'
import { GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Icon from 'src/@core/components/icon'
import CustomAccordion from 'src/components/parivesh/CustomAccordion'
import ImageLightbox from 'src/components/parivesh/ImageLightbox'
import AddSpeciesNewEntry from 'src/views/pages/parivesh/addSpeciesEntry/addSpeciesEntry'
import Toaster from 'src/components/Toaster'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getEntryList } from 'src/lib/api/parivesh/entryList'
import { getOrgCountList } from 'src/lib/api/parivesh/organizationCount'
import { addSpeciesToOrganization, updateSpeciesToOrganization } from 'src/lib/api/parivesh/addSpecies'
import Utility from 'src/utility'
import { buildStats, buildCards } from 'src/components/parivesh/home/OverviewTab'

// ==================== Types ====================

interface SpeciesDetailContentProps {
  tsnId: string
  orgId: string
  tsnRelation: string
}

// ==================== Component ====================

const SpeciesDetailContent: React.FC<SpeciesDetailContentProps> = ({ tsnId, orgId, tsnRelation }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedParivesh } = usePariveshContext()

  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('scientific_name')
  const [filters, setFilters] = useState({ page: 1, limit: 10 })

  // Add-entry drawer state — restored from pre-migration species details page
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState<{ id: number | null; name: string | null; active: string | null }>({
    id: null,
    name: null,
    active: null
  })

  // ==================== Entries ====================

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['parivesh-species-entries', tsnId, orgId, tsnRelation, filters, sort, sortColumn],
    queryFn: () =>
      getEntryList({
        params: {
          tsn_id: tsnId,
          tsn_relation: tsnRelation,
          page: filters.page,
          sortBy: sort,
          sortColumn,
          org_id: orgId,
          limit: filters.limit
        }
      }),
    enabled: Boolean(tsnId)
  })

  const rows = useMemo(() => {
    return (entriesData?.data?.data || []).map((el: any, i: number) => ({ ...el, id: i + 1 }))
  }, [entriesData])

  const total = Number(entriesData?.data?.total_count) || 0
  const speciesDetails = {
    scientific_name: entriesData?.data?.scientific_name,
    common_name: entriesData?.data?.common_name
  }

  // ==================== Org Count ====================

  const { data: orgCountData } = useQuery({
    queryKey: ['parivesh-species-org-count', orgId, tsnId, tsnRelation],
    queryFn: () => getOrgCountList({ params: { org_id: orgId, tsn_relation: tsnRelation, tsn_id: tsnId } }),
    enabled: Boolean(orgId)
  })

  const organizationCountList = useMemo(() => {
    if (!orgCountData?.data) return []
    return (orgCountData.data as any[])
      .filter(org => org.org_id === orgId)
      .map(org => ({
        organization_name: org.organization_name,
        org_id: org.org_id,
        cover_image: org.cover_image,
        approved_count_data: org.approved_count_data,
        yet_to_submitted_count: org.yet_to_submitted_count,
        submitted_count_data: org.submitted_count_data
      }))
  }, [orgCountData, t])

  // ===== Drawer handlers (restored from pre-migration species details page) =====

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, active: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setEditParams({ id: null, name: null, active: null })
    setResetForm(true)
    setOpenDrawer(false)
  }

  const handleSubmitData = async (data: any) => {
    const payload = { ...data, org_id: orgId, tsn_id: tsnId, tsn_relation: tsnRelation }
    try {
      setSubmitLoader(true)
      const response = editParams?.id !== null
        ? await updateSpeciesToOrganization(payload, editParams.id)
        : await addSpeciesToOrganization(payload)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setResetForm(true)
        setOpenDrawer(false)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }

      // Always refetch — handles backends that save the row but don't include `success: true`.
      await queryClient.refetchQueries({ queryKey: ['parivesh-species-entries'] })
      await queryClient.refetchQueries({ queryKey: ['parivesh-species-org-count'] })
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort === 'asc' ? 'asc' : 'desc')
      setSortColumn(newModel[0].field)
    }
  }

  // ==================== Columns ====================

  const columns = [
    {
      flex: 0.2,
      width: 60,
      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.id}</Typography>
    },
    {
      flex: 0.3,
      minWidth: 80,
      field: 'image_type',
      headerName: t('image'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <div onClick={e => e.stopPropagation()}>
          <ImageLightbox images={p.row.species_image} />
        </div>
      )
    },
    {
      flex: 0.4,
      minWidth: 140,
      field: 'common_name',
      headerName: t('parivesh_module.common_name'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title={p.row.common_name || '-'}>
          <Typography noWrap variant='body2' sx={{ fontWeight: 500 }}>
            {p.row.common_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.4,
      minWidth: 140,
      field: 'scientific_name',
      headerName: t('parivesh_module.scientific_name'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title={p.row.scientific_name || '-'}>
          <Typography noWrap variant='body2'>
            {p.row.scientific_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.4,
      minWidth: 120,
      field: 'gender_count',
      headerName: t('parivesh_module.gender_count'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2'>
          {p.row.gender
            ? `${p.row.gender.charAt(0).toUpperCase() + p.row.gender.slice(1)} : ${p.row.animal_count}`
            : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'transaction_date',
      headerName: t('date'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2'>
            {p.row.transaction_date
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(p.row.transaction_date))
              : '-'}
          </Typography>
          <Typography variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {p.row.transaction_date
              ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(p.row.transaction_date))
              : ''}
          </Typography>
        </Box>
      )
    }
  ]

  // ==================== Render ====================

  return (
    <>
      {/* Breadcrumb */}
      <Box sx={{ mb: 6 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.push('/parivesh/species')}>
            {t('parivesh_module.species')}
          </Typography>
          <Typography color='text.primary'>{speciesDetails?.common_name || tsnId}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Accordions */}
      {organizationCountList.length > 0 && (
        <Box>
          <Card>
            {organizationCountList.map((org: any, idx: number) => (
              <CardContent key={idx} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    mb: 3,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#00ABAB1A',
                    padding: '0.8rem',
                    borderRadius: '0.5rem',
                    color: '#00AFD6'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#AFEFEB',
                      padding: '8px',
                      borderRadius: '6px'
                    }}
                  >
                    <Icon icon='material-symbols:corporate-fare' />
                  </Box>
                  <Typography sx={{ color: '#00AFD6', marginLeft: '0.5rem', fontWeight: 'bold' }} variant='subtitle2'>
                    {org.organization_name}
                  </Typography>
                </Box>
                {org.approved_count_data && (
                  <CustomAccordion
                    title={t('parivesh_module.approved_by_parivesh')}
                    summaryIcon='ion:checkmark'
                    data={buildStats(org.approved_count_data, t)}
                    cards={buildCards(org.approved_count_data, t)}
                    backgroundImage={org.cover_image}
                  />
                )}
                {org.yet_to_submitted_count && (
                  <Box sx={{ mt: 3 }}>
                    <CustomAccordion
                      title={t('parivesh_module.to_be_submitted')}
                      summaryIcon='mdi:arrow-top-right'
                      data={buildStats(org.yet_to_submitted_count, t)}
                      cards={buildCards(org.yet_to_submitted_count, t)}
                      backgroundImage={org.cover_image}
                    />
                  </Box>
                )}
                {org.submitted_count_data && (
                  <Box sx={{ mt: 3 }}>
                    <CustomAccordion
                      title={t('parivesh_module.submitted_data')}
                      summaryIcon='mdi:checkbox-marked'
                      data={buildStats(org.submitted_count_data, t)}
                      cards={buildCards(org.submitted_count_data, t)}
                      backgroundImage={org.cover_image}
                    />
                  </Box>
                )}
              </CardContent>
            ))}
          </Card>
        </Box>
      )}

      {/* Entries Table */}
      <Card sx={{ mt: 4, p: 4 }}>
        <CardHeader
          sx={{ p: 0 }}
          title={t('parivesh_module.entries')}
          action={
            <Button
              variant='contained'
              startIcon={<Icon icon='mdi:add' />}
              sx={{ background: '#1F415B', '&:hover': { backgroundColor: '#0D2B3E' } }}
              onClick={addEventSidebarOpen}
            >
              {t('parivesh_module.new_entries')}
            </Button>
          }
        />
        <CommonTable
          columns={columns}
          indexedRows={rows}
          total={total}
          loading={entriesLoading}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
          setPaginationModel={(m: any) => setFilters({ page: m.page + 1, limit: m.pageSize })}
          handleSortModel={handleSortModel}
          searchValue=''
          getRowHeight={() => 'auto'}
          onRowClick={() => {}}
          columnVisibilityModel={{ sl_no: false }}
          externalTableStyle={{
            '& .MuiDataGrid-cell': { padding: '12px 8px' },
            '& .MuiDataGrid-row:hover': { cursor: 'default' }
          }}
        />
      </Card>

      <AddSpeciesNewEntry
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
        speciesDetails={speciesDetails}
      />
    </>
  )
}

export default SpeciesDetailContent
