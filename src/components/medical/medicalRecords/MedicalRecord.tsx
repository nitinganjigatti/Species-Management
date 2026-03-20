import { useTheme } from '@emotion/react'
import { Box, Chip, CircularProgress, Drawer, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import { getMedicalRecordsByFilter, getMedicalRecordReport } from 'src/lib/api/medical/records'
import { downloadPDF } from 'src/utility'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import AddPatientFiltersDrawer from 'src/components/hospital/inpatient/AddPatientFiltersDrawer'
import SortBottomSheet from 'src/components/hospital/inpatient/SortBottomSheet'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import type { AnimalData, MedicalRow, FilterOptions, SortType, FilterDate, PaginationFilters } from 'src/types/medical'
// import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

const MedicalRecords = () => {
  const theme: any = useTheme()
  const router = useRouter()

  const [animalDrawer, setAnimalDrawer] = useState<boolean>(false)
  const [selectedAnimalsDrawer, setSelectedAnimalsDrawer] = useState<boolean>(false)
  const [selectedAnimals, setSelectedAnimals] = useState<AnimalData[]>([])
  const [isAllAnimalsSelected, setIsAllAnimalsSelected] = useState<boolean>(false)
  const [animalLoader, setAnimalLoader] = useState<boolean>(false)
  const [rows, setRows] = useState<MedicalRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>((router.query.q as string) || '')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [downloadingRowId, setDownloadingRowId] = useState<string | number | null>(null)
  const [filterDate, setFilterDate] = useState<FilterDate>({})
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [isSortBottomSheetOpen, setIsSortBottomSheetOpen] = useState<boolean>(false)
  const [currentSort, setCurrentSort] = useState<SortType>({ column: 'animal_id', sort: 'asc' })

  const [selectedOptions, setSelectedOptions] = useState<FilterOptions>({
    Gender: [],
    Species: [],
    Site: [],
    Section: [],
    Enclosure: []
  })

  const [filters, setFilters] = useState<PaginationFilters>({
    page: parseInt(router.query.page as string) || 1,
    limit: parseInt(router.query.limit as string) || 50,
    q: (router.query.q as string) || ''
  })

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query as { page?: string; limit?: string; q?: string }

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q
    })

    setSearchValue(q)
  }, [router.query])
  const fetchAnimal = async () => {
    setAnimalLoader(true)
    try {
      const res = await getAnimalDetailsOverview({
        animal_id: router.query.animal_id as string
      })

      if (res?.success) {
        setSelectedAnimals([
          {
            animal_id: res?.data?.animal_details?.animal_id,
            default_common_name: res?.data?.animal_details?.common_name,
            scientific_name: res?.data?.animal_details?.scientific_name ?? res?.data?.animal_details?.complete_name,
            user_enclosure_name: res?.data?.animal_details?.user_enclosure_name,
            section_name: res?.data?.animal_details?.section_name,
            site_name: res?.data?.animal_details?.site_name,
            type: res?.data?.animal_details?.type,
            sex: res?.data?.animal_details?.sex,
            default_icon: res?.data?.animal_details?.default_icon,
            total_animal: res?.data?.animal_details?.total_animal,
            local_identifier_name: res?.data?.animal_details?.local_identifier_name,
            local_identifier_value: res?.data?.animal_details?.local_identifier_value,
            enclosure_id: res?.data?.animal_details?.enclosure_id,
            section_id: res?.data?.animal_details?.section_id,
            site_id: res?.data?.animal_details?.site_id
          }
        ])
      }
    } catch (err) {
      console.error('Error fetching animal details:', err)
    } finally {
      setAnimalLoader(false)
    }
  }

  useEffect(() => {
    if ((router.query.animal_id as string) && selectedAnimals.length === 0) {
      fetchAnimal()
    }
  }, [router.query.animal_id as string])

  const updateRouterQuery = (query: Record<string, any>, shallow = true) => {
    router.push({ pathname: router.pathname, query }, undefined, { shallow })
  }

  const handleAnimalSelect = (animals: any, options?: { isSelectAll?: boolean }) => {
    const isSelectAll = options?.isSelectAll || false

    const animalList = Array.isArray(animals) ? animals : [animals]
    const mapped: AnimalData[] = animalList.map((animal: any) => ({
      animal_id: animal?.animal_id,
      default_common_name: animal?.default_common_name,
      scientific_name: animal?.scientific_name ?? animal?.complete_name,
      user_enclosure_name: animal?.user_enclosure_name,
      section_name: animal?.section_name,
      site_name: animal?.site_name,
      type: animal?.type,
      sex: animal?.sex,
      default_icon: animal?.default_icon,
      total_animal: animal?.total_animal,
      local_identifier_name: animal?.local_identifier_name,
      local_identifier_value: animal?.local_identifier_value,
      enclosure_id: animal?.enclosure_id,
      section_id: animal?.section_id,
      site_id: animal?.site_id
    }))
    setSelectedAnimals(mapped)
    setIsAllAnimalsSelected(isSelectAll)
    const animalIds = mapped.map(a => a.animal_id).join(',')
    const updatedQuery = { ...router.query, animal_id: animalIds, page: '1' }
    router.replace({ pathname: router.pathname, query: updatedQuery }, undefined, { shallow: true })

    return true
  }

  const formatDate = (dateString: any): string | null => {
    if (!dateString) return null
    return new Date(dateString).toISOString().split('T')[0]
  }

  // Build common filter params used by listing and download APIs
  const buildFilterParams = () => {
    const animalIds =
      selectedAnimals.length > 0
        ? selectedAnimals.map(a => a.animal_id).join(',')
        : (router.query.animal_id as string) || ''

    const startDate = formatDate(filterDate?.startDate)
    const endDate = formatDate(filterDate?.endDate)

    const maxFilterCount = 80

    const toFilterValue = (arr: any[]) => {
      if (arr.length === 0) return ''
      if (arr.length > maxFilterCount) return 'all'
      return arr.join(',')
    }

    const siteValue = toFilterValue(selectedOptions.Site || [])
    const sectionValue = toFilterValue(selectedOptions.Section || [])
    const enclosureValue = toFilterValue(selectedOptions.Enclosure || [])
    const speciesValue = toFilterValue(selectedOptions.Species || [])
    const genderValue = selectedOptions.Gender?.length === 1 ? selectedOptions.Gender[0] : ''

    const isAnimalAll = isAllAnimalsSelected || selectedAnimals.length > maxFilterCount

    const params: Record<string, any> = {
      ...(genderValue && { gender: genderValue }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate })
    }

    // Animal IDs: if select all → don't send key; otherwise send comma-separated IDs
    if (!isAnimalAll && animalIds) {
      params.animal_ids = animalIds
    }

    // For site/section/enclosure/species: if value is 'all' → don't send the key
    if (siteValue && siteValue !== 'all') params.site_ids = siteValue
    if (sectionValue && sectionValue !== 'all') params.section_ids = sectionValue
    if (enclosureValue && enclosureValue !== 'all') params.enclosure_ids = enclosureValue
    if (speciesValue && speciesValue !== 'all') params.species_ids = speciesValue

    return params
  }

  const fetchMedicalRecords = async () => {
    if (selectedAnimals.length === 0) return

    try {
      setLoading(true)

      const filterParams = {
        page_no: filters?.page,
        limit: filters?.limit,
        ...buildFilterParams()
      }

      const res = await getMedicalRecordsByFilter(filterParams)

      setRows(res?.data?.result || [])
      setTotal(parseInt(res?.data?.total_count) || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAnimals.length > 0) {
      fetchMedicalRecords()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.q, selectedAnimals, selectedOptions, filterDate])

  const updateUrlParams = (updatedFilters: PaginationFilters) => {
    const query: Record<string, any> = {}
    Object.entries({
      ...updatedFilters,
      animal_id:
        selectedAnimals.length > 0
          ? selectedAnimals.map(a => a.animal_id).join(',')
          : (router.query.animal_id as string)
    }).forEach(([key, value]) => {
      if (value) query[key] = value.toString()
    })
    updateRouterQuery(query)
  }

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    const updated: PaginationFilters = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        const updated: PaginationFilters = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters, selectedAnimals]
  )

  const handleSearch = useCallback(
    (value: string) => {
      const trimmedValue = value.trim()
      setSearchValue(trimmedValue)
      debouncedSearch(trimmedValue)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: row?.id || index,
    sl_no: getSlNo(index)
  }))

  const renderListCell = (items: any[], labelKey: string | string[]) => {
    if (items.length === 0) {
      return <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>-</Typography>
    }

    const getLabel = (item: any) => {
      if (Array.isArray(labelKey)) {
        for (const key of labelKey) {
          if (item?.[key]) return item[key]
        }

        return '-'
      }

      return item?.[labelKey] || '-'
    }

    const first = getLabel(items[0])
    const remaining = items.length - 1
    const allLabels = items.map(getLabel).join(', ')

    return (
      <Tooltip title={allLabels} arrow placement='top'>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {first}
          </Typography>
          {remaining > 0 && (
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 500,
                color: theme.palette.primary.main,
                whiteSpace: 'nowrap'
              }}
            >
              +{remaining}
            </Typography>
          )}
        </Box>
      </Tooltip>
    )
  }

  const columns = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: 'SL. NO',
      renderCell: (params: any) => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 200,
      minWidth: 120,
      field: 'medical_record_code',
      sortable: false,
      headerName: 'MEDICAL RECORD ID',
      renderCell: (params: any) => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.medical_record_code || 'N/A'}
        </Typography>
      )
    },
    {
      width: 180,
      minWidth: 120,
      field: 'case_type',
      sortable: false,
      headerName: 'CASE TYPE',
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {params.row.default_icon && (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: theme.palette.customColors.secondaryBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img src={params.row.default_icon} alt='' style={{ width: 16, height: 16, objectFit: 'contain' }} />
            </Box>
          )}
          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {params.row.case_type || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      width: 250,
      minWidth: 150,
      field: 'complaint',
      sortable: false,
      headerName: 'COMPLAINTS',
      renderCell: (params: any) => renderListCell(params.row.complaint || [], 'complaint')
    },
    {
      width: 250,
      minWidth: 150,
      field: 'diagnosis',
      sortable: false,
      headerName: 'DIAGNOSIS',
      renderCell: (params: any) => renderListCell(params.row.diagnosis || [], ['diagnosis', 'name'])
    },
    {
      width: 150,
      minWidth: 100,
      field: 'prescription',
      sortable: false,
      headerName: 'PRESCRIPTIONS',
      renderCell: (params: any) => {
        const count = params.row.prescription?.length || 0

        return (
          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {count > 0 ? count : '-'}
          </Typography>
        )
      }
    },
    // {
    //   width: 220,
    //   minWidth: 150,
    //   field: 'created_by',
    //   sortable: false,
    //   headerName: 'CREATED BY',
    //   renderCell: (params: any) => (
    //     <UserAvatarDetails
    //       profile_image={params.row.created_by_profile_image}
    //       user_name={params.row.created_by_name || params.row.created_by}
    //       date={params.row.created_at}
    //     />
    //   )
    // },
    // {
    //   width: 220,
    //   minWidth: 150,
    //   field: 'updated_by',
    //   sortable: false,
    //   headerName: 'UPDATED BY',
    //   renderCell: (params: any) => (
    //     <UserAvatarDetails
    //       profile_image={params.row.updated_by_profile_image}
    //       user_name={params.row.updated_by_name || params.row.updated_by}
    //       date={params.row.updated_at}
    //     />
    //   )
    // },
    {
      width: 80,
      minWidth: 60,
      field: 'actions',
      sortable: false,
      headerName: '',
      renderCell: (params: any) => (
        <IconButton onClick={() => handleRowDownload(params.row)} disabled={downloadingRowId === params.row.id}>
          {downloadingRowId === params.row.id ? (
            <CircularProgress size={20} />
          ) : (
            <Icon icon='mdi:download' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
          )}
        </IconButton>
      )
    }
  ]

  const handleRowDownload = async (row: MedicalRow) => {
    const params = {
      ...buildFilterParams(),
      ...(row?.id && { medical_record_id: row.id })
    }
    try {
      setDownloadingRowId(row?.id)
      await downloadPDF({
        apiCall: getMedicalRecordReport,
        params,
        fileName: `Medical_record_${row?.medical_record_code || row?.id}_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading row report:', error)
    } finally {
      setDownloadingRowId(null)
    }
  }

  const applyFilters = (options: FilterOptions) => {
    setSelectedOptions(options)
    setOpenFilterDrawer(false)
    const updated: PaginationFilters = { ...filters, page: 1 }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const clearAnimalSelection = () => {
    setSelectedAnimals([])
    setRows([])
    setTotal(0)

    const { animal_id, ...rest } = router.query
    updateRouterQuery(rest, false)
  }

  const handleDownloadReport = async () => {
    const params = buildFilterParams()
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getMedicalRecordReport,
        params,
        fileName: `Medical_records_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      {selectedAnimals.length > 0 && (
        <>
          {indexedRows?.length > 0 && (
            <DownloadReport isDownloading={isDownloading} handleDownloadReport={handleDownloadReport} />
          )}
          <Box
            sx={{
              height: '32px',
              width: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50px'
            }}
          >
            <IconButton onClick={clearAnimalSelection}>
              <Icon icon='mdi:close' color='red' fontSize={24} />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  )
  return (
    <>
      <DynamicBreadcrumbs pageItems={[{ title: 'Medical' }, { title: 'Records', active: true }]} />

      <PageCardLayout title='Medical Records' action={headerAction}>
        {selectedAnimals.length > 0 ? (
          <>
            <Grid container spacing={4}>
              <Grid
                size={12}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '8px',
                  p: '16px',
                  backgroundColor: theme.palette.customColors.displaybgPrimary,
                  my: 4
                }}
              >
                {isAllAnimalsSelected ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Icon icon='mdi:check-circle-outline' fontSize={22} color={theme.palette.success.main} />
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      All Animals Selected
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <AnimalCard data={selectedAnimals[0]} sx={{ border: 'none', background: 'none' }} animal={true} />
                    {selectedAnimals.length > 1 && (
                      <Chip
                        label={`+${selectedAnimals.length - 1} more`}
                        onClick={() => setSelectedAnimalsDrawer(true)}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          color: theme.palette.primary.main,
                          backgroundColor: theme.palette.primary.light,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            color: '#fff'
                          }
                        }}
                      />
                    )}
                  </>
                )}
              </Grid>

              <Grid
                size={12}
                sx={{
                  py: 3,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 4
                }}
              >
                {/* Search */}
                <Box sx={{ width: { xs: '100%', sm: '30%' } }}>
                  <MUISearch
                    disabled={indexedRows?.length === 0}
                    placeholder='Search by medical record ID'
                    value={searchValue}
                    onClear={handleSearchClear}
                    onChange={(e: any) => handleSearch(e.target.value)}
                  />
                </Box>

                {/* Date Range Picker */}
                <Box
                  sx={{
                    width: { xs: '100%', sm: '35%' },
                    display: 'flex',
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' }
                  }}
                >
                  <CommonDateRangePickers
                    filterDates={filterDate}
                    onChange={(s: Date, e: Date) =>
                      setFilterDate({
                        startDate: s,
                        endDate: e
                      })
                    }
                  />
                </Box>
              </Grid>
              <Grid size={12}>
                <CommonTable
                  columns={columns}
                  indexedRows={indexedRows}
                  total={total}
                  loading={loading}
                  paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                  setPaginationModel={handlePaginationModelChange}
                  searchValue=''
                  getRowHeight={() => 'auto'}
                  externalTableStyle={{
                    '& .MuiDataGrid-cell': {
                      padding: 4
                    },
                    padding: 0,
                    margin: 0
                  }}
                />
              </Grid>
            </Grid>
          </>
        ) : animalLoader ? (
          <Box display='flex' justifyContent='center' alignItems='center' sx={{ mt: 10, mb: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <ReportCard
              subtitle='No Animal Selected'
              description='Select an animal to view its medical records'
              buttonText='SELECT ANIMAL'
              addHandler={() => setAnimalDrawer(true)}
            />
          </Box>
        )}

        {animalDrawer && (
          <AnimalDrawer
            open={animalDrawer}
            onClose={() => setAnimalDrawer(false)}
            handleAnimalClick={handleAnimalSelect}
            btnText='VIEW MEDICAL RECORDS'
            // --- OLD: module='medical' (used before, now upgrading to customQueryParams) ---
            showFilterAndSort
            handleFilterClick={() => setOpenFilterDrawer(true)}
            handleSortClick={() => setIsSortBottomSheetOpen(true)}
            filters={selectedOptions}
            sortType={currentSort}
            filterCount={filterCount}
            multiSelect={true}
            // defaultSelected={selectedAnimals as any[]}
            customQueryParams={
              (({ activeTab, filters: drawerFilters, sortType: drawerSort }: any) => ({
                animal_list_type: activeTab,
                gender: drawerFilters?.Gender || [],
                tsn_id: drawerFilters?.Species || [],
                site_id: drawerFilters?.Site || [],
                section_id: drawerFilters?.Section || [],
                enclosure_id: drawerFilters?.Enclosure || [],
                sort: drawerSort?.sort || 'asc',
                column: drawerSort?.column || 'animal_id',
                ignore_permission: 0,
                include_dead_animal: 0
              })) as any
            }
          />
        )}
        <AddPatientFiltersDrawer
          openFilterDrawer={openFilterDrawer}
          onCloseFilterDrawer={() => setOpenFilterDrawer(false)}
          onSubmitLoading={false}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          filterCount={filterCount}
          initialSelectedOptions={selectedOptions}
        />
        {isSortBottomSheetOpen && (
          <SortBottomSheet
            open={isSortBottomSheetOpen}
            onClose={() => setIsSortBottomSheetOpen(false)}
            currentSort={currentSort.sort === 'asc' ? 'recent' : 'oldest'}
            onSortChange={(sortObj: SortType) => setCurrentSort(sortObj)}
          />
        )}
      </PageCardLayout>

      <Drawer
        anchor='right'
        open={selectedAnimalsDrawer}
        onClose={() => setSelectedAnimalsDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '480px'],
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.customColors.bodyBg
          }
        }}
      >
        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 600,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Selected Animals ({selectedAnimals.length})
          </Typography>
          <IconButton onClick={() => setSelectedAnimalsDrawer(false)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          {selectedAnimals.map(animal => (
            <Box
              key={String(animal.animal_id)}
              sx={{
                backgroundColor: '#FFF',
                borderRadius: '8px',
                p: '16px'
              }}
            >
              <AnimalCard data={animal} sx={{ border: 'none', background: 'none' }} animal={true} />
            </Box>
          ))}
        </Box>
      </Drawer>
    </>
  )
}

export default MedicalRecords
