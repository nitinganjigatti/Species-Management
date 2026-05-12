'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardHeader, Grid, Box, Breadcrumbs, Typography, Tooltip, Button, Badge } from '@mui/material'
import { useTranslation } from 'react-i18next'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import { AddButtonContained } from 'src/components/ButtonContained'
import { useRouter } from 'next/navigation'
import { getExportList } from 'src/lib/api/compliance/exports'
import Utility from 'src/utility'
import countryList from 'react-select-country-list'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import RenderUtility from 'src/utility/render'
import { useTheme } from '@mui/material/styles'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import FiltersDrawer from 'src/components/compliance/drawer/FiltersDrawer'
import { ExportButton } from 'src/views/utility/render-snippets'
import { format, subMonths } from 'date-fns'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { GridColDef, GridSortModel } from '@mui/x-data-grid'
import { FilterSelectedOptions } from 'src/types/compliance'

interface FilterDate {
  startDate?: string
  endDate?: string
}

const CitesExportPermitIndex = () => {
  const { t } = useTranslation()
  const router = useRouter()

  // Table and main data states
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({ page: 0, pageSize: 50 })
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  const [exportLoading, setExportLoading] = useState<boolean>(false)

  const [filterDate, setFilterDate] = useState<FilterDate>({})

  // Filter states
  const [filterCount, setFilterCount] = useState<number>(0)
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)

  const [selectedOptions, setSelectedOptions] = useState<FilterSelectedOptions>({
    Species: [],
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })

  const theme = useTheme()
  const countryListOptions = useMemo(() => countryList().getData(), [])

  const fetchExportPermits = useCallback(async () => {
    setLoading(true)
    try {
      const formatDate = (dateString: string | undefined): string | null => {
        if (!dateString) return null

        return new Date(dateString).toISOString().split('T')[0]
      }

      const prepareFilterParams = (key: string): string | undefined => {
        return (selectedOptions as Record<string, string[]>)[key]?.length > 0
          ? (selectedOptions as Record<string, string[]>)[key].join(',')
          : undefined
      }

      const params = {
        q: searchValue,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sort: sortModel?.[0]?.sort,
        sortBy: sortModel?.[0]?.field,
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        species: prepareFilterParams('Species'),
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents')
      }

      const res = await getExportList(params as any)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(
        (res.data?.records || []).map((r: Record<string, unknown>, i: number) => ({
          ...r,
          uid: start + i + 1,
          export_number: r.export_number || '-',
          exporter_name: r.exporter_name || '-',
          exporting_country: r.exporting_country || '-',
          country_of_origin: r.country_of_origin || '-',
          species_count: r.species_count || '-',
          animal_count: r.animal_count || '-',
          documents_count: r.documents_count || '-',
          shipments_count: r.shipments_count || '-',
          expiry_date: r.expiry_date || '-'
        }))
      )
      setTotal((res.data as any)?.total || res.data?.total_count || 0)
    } catch (error) {
      console.error('Error fetching export permits:', error)
      Toaster({ type: 'error', message: t('compliance_module.failed_to_fetch_export_permits') })
    }
    setLoading(false)
  }, [searchValue, paginationModel, sortModel, filterDate, selectedOptions])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const formatDate = (dateString: string | undefined): string | null => {
        if (!dateString) return null

        return new Date(dateString).toISOString().split('T')[0]
      }

      const prepareFilterParams = (key: string): string | undefined => {
        return (selectedOptions as Record<string, string[]>)[key]?.length > 0
          ? (selectedOptions as Record<string, string[]>)[key].join(',')
          : undefined
      }

      const params = {
        q: searchValue,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sort: sortModel?.[0]?.sort,
        sortBy: sortModel?.[0]?.field,
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        species: prepareFilterParams('Species'),
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents'),
        response_type: 'csv'
      }

      const res = await getExportList(params as any)

      const fileUrl = res?.data
      if (fileUrl) {
        Utility.downloadFileFromURL(fileUrl, `Exports Report`)
        Toaster({ type: 'success', message: res?.message || t('compliance_module.failed_to_download_the_report') })
      } else {
        Toaster({ type: 'error', message: t('compliance_module.file_url_not_found_in_response') })
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      Toaster({ type: 'error', message: t('compliance_module.failed_to_download_the_report') })
    } finally {
      setExportLoading(false)
    }
  }

  useEffect(() => {
    fetchExportPermits()
  }, [fetchExportPermits])

  // Apply filters
  const applyFilters = (opts: FilterSelectedOptions) => {
    setSelectedOptions(opts)
    setOpenFilterDrawer(false)
  }

  // Main search handler
  const debouncedMainSearch = useCallback(
    debounce((val: string) => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleMainSearch = (val: string) => {
    debouncedMainSearch(val)
  }

  const handleFilterDrawerOpen = async () => {
    setOpenFilterDrawer(true)
  }

  // Columns definition (same as before)
  const columns: GridColDef[] = [
    {
      flex: 0.01,
      minWidth: 100,
      field: 'uid',
      headerName: t('compliance_module.sl_no'),
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </Typography>
      )
    },
    {
      flex: 0.12,
      minWidth: 150,
      field: 'export_number',
      headerName: t('compliance_module.export_id'),
      renderCell: params => (
        <Tooltip title={params.value || ''}>
          <Typography
            sx={{
              px: 2,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default'
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.15,
      minWidth: 180,
      field: 'exporter_name',
      headerName: t('compliance_module.exporter'),
      renderCell: params => (
        <Tooltip title={params.value || ''}>
          <Typography
            sx={{
              px: 2,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default'
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.15,
      minWidth: 180,
      field: 'exporting_country',
      headerName: t('compliance_module.exporting_country'),
      renderCell: params => (
        <Tooltip
          title={countryListOptions.find((country: { value: string }) => country.value === params.value)?.label || ''}
        >
          <Typography
            sx={{
              px: 2,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default'
            }}
          >
            {countryListOptions.find((country: { value: string }) => country.value === params.value)?.label || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.15,
      minWidth: 180,
      field: 'origin_country',
      headerName: t('compliance_module.country_of_origin'),
      renderCell: params => (
        <Tooltip
          title={countryListOptions.find((country: { value: string }) => country.value === params.value)?.label || ''}
        >
          <Typography
            sx={{
              px: 2,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default'
            }}
          >
            {countryListOptions.find((country: { value: string }) => country.value === params.value)?.label || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'species_count',
      headerName: t('compliance_module.species'),
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'animal_count',
      headerName: t('animals'),
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'documents_count',
      headerName: t('documents'),
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'shipment_count',
      headerName: t('compliance_module.shipments'),
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'valid_until',
      headerName: t('compliance_module.expiry'),
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%' }}>{Utility.formatDisplayDate(params.value)}</Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 180,
      field: 'created_by_user_name',
      headerName: t('created_by'),
      renderCell: params => (
        <Box sx={{ px: 2 }}>
          {params.row.created_by_user_name ? (
            <UserAvatarDetails
              profile_image={params?.row?.created_user_profile_pic}
              user_name={params?.row?.created_by_user_name}
              date={params?.row?.created_at}
            />
          ) : (
            '-'
          )}
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 180,
      field: 'updated_by_user_name',
      headerName: t('updated_by'),
      renderCell: params => (
        <Box sx={{ px: 2 }}>
          {params.row.updated_by_user_name ? (
            <UserAvatarDetails
              profile_image={params?.row?.updated_user_profile_pic}
              user_name={params?.row?.updated_by_user_name}
              date={params?.row?.updated_at}
            />
          ) : (
            '-'
          )}
        </Box>
      )
    }
  ]

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ color: 'inherit' }}>{t('compliance_module.compliance')}</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>
          {t('compliance_module.cites_export_permit')}
        </Typography>
      </Breadcrumbs>

      <Card>
        <CardHeader
          title={
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>
              {t('compliance_module.export_documents')}
            </Typography>
          }
          action={
            <AddButtonContained
              title={t('add_new')}
              action={() => router.push('/compliance/documents/exports/AddEditExportPermit')}
              disabled={false}
              styles={{}}
              fullWidth={false}
            />
          }
        />

        <Grid container columnSpacing={4} rowSpacing={1} sx={{ px: 5, pt: 2 }} alignItems='center'>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 4,
              flexWrap: 'wrap'
            }}
          >
            <Search
              placeholder='Search exports...'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMainSearch(e.target.value)}
              onClear={() => handleMainSearch('')}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <CommonDateRangePickers
                  filterDates={filterDate}
                  onChange={(s: string, e: string) => setFilterDate({ startDate: s, endDate: e })}
                />
              </Box>
              <ExportButton
                loading={exportLoading}
                tooltip='Download Report'
                onClick={handleExport}
                bgcolor={undefined}
              />
              <Button
                variant='outlined'
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  borderColor: theme.palette.customColors.OutlineVariant,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                startIcon={
                  <TuneRoundedIcon
                    sx={{ height: '24px', width: '24px', color: theme.palette.customColors.OnSurfaceVariant }}
                  />
                }
                endIcon={
                  <Badge
                    badgeContent={filterCount}
                    color='primary'
                    invisible={filterCount === 0}
                    sx={{ ml: 2, mr: 2 }}
                  />
                }
                onClick={handleFilterDrawerOpen}
              >
                {t('filter')}
              </Button>
            </Box>
          </Box>

          <Grid size={{ xs: 12 }}>
            <CommonTable
              onRowClick={(row: { id: unknown }) => router.push(`/compliance/documents/exports/${row.id}?id=${row.id}`)}
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={(newModel: GridSortModel) => setSortModel(newModel)}
              loading={loading}
            />
          </Grid>
        </Grid>
      </Card>
      <FiltersDrawer
        openFilterDrawer={openFilterDrawer}
        onCloseFilterDrawer={() => setOpenFilterDrawer(false)}
        onSubmitLoading={loading}
        onApplyFilters={applyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={selectedOptions}
        contextId={'1'}
      />
    </>
  )
}

export default CitesExportPermitIndex
