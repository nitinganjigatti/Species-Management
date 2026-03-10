import { useTheme } from '@emotion/react'
import { Box, CircularProgress, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
// import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import { getMedicalRecordsByAnimal, getMedicalRecordReport } from 'src/lib/api/medical/records'
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
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalData | null>(null)
  const [animalLoader, setAnimalLoader] = useState<boolean>(false)
  const [rows, setRows] = useState<MedicalRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>((router.query.q as string) || '')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [downloadingRowId, setDownloadingRowId] = useState<string | number | null>(null)
  // const [filterDate, setFilterDate] = useState<FilterDate>({})
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
        setSelectedAnimal({
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
        })
      }
    } catch (err) {
      console.error('Error fetching animal details:', err)
    } finally {
      setAnimalLoader(false)
    }
  }

  useEffect(() => {
    if ((router.query.animal_id as string) && !selectedAnimal) {
      fetchAnimal()
    }
  }, [router.query.animal_id as string])

  const updateRouterQuery = (query: Record<string, any>, shallow = true) => {
    router.push({ pathname: router.pathname, query }, undefined, { shallow })
  }

  const handleAnimalSelect = (animal: any) => {
    setSelectedAnimal({
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
    })
    updateRouterQuery({ ...router.query, animal_id: animal?.animal_id, page: 1 })
  }

  // const formatDate = (dateString: any): string | null => {
  //   if (!dateString) return null
  //   return new Date(dateString).toISOString().split('T')[0]
  // }

  const fetchMedicalRecords = async () => {
    const animalId = selectedAnimal?.animal_id || (router.query.animal_id as string as string)
    if (!animalId) return

    try {
      setLoading(true)

      const res = await getMedicalRecordsByAnimal(animalId, {
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q
        // from_date: formatDate(.startDate),
        // to_date: formatDate(.endDate)
      })

      setRows(res?.data?.result || [])
      setTotal(parseInt(res?.data?.total_count) || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAnimal?.animal_id || (router.query.animal_id as string)) {
      fetchMedicalRecords()
    }
  }, [filters.page, filters.limit, filters.q, router.query.animal_id])

  const updateUrlParams = (updatedFilters: PaginationFilters) => {
    const query: Record<string, any> = {}
    Object.entries({
      ...updatedFilters,
      animal_id: selectedAnimal?.animal_id || (router.query.animal_id as string)
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
    [filters, selectedAnimal?.animal_id]
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
    const animalId = selectedAnimal?.animal_id || (router.query.animal_id as string)
    if (!animalId) return

    const params = {
      animal_ids: animalId,
      ...(selectedAnimal?.enclosure_id && { enclosure_ids: selectedAnimal.enclosure_id }),
      ...(selectedAnimal?.section_id && { section_ids: selectedAnimal.section_id }),
      ...(selectedAnimal?.site_id && { site_ids: selectedAnimal.site_id }),
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
  }

  const clearAnimalSelection = () => {
    setSelectedAnimal(null)
    setRows([])
    setTotal(0)

    const { animal_id, ...rest } = router.query
    updateRouterQuery(rest, false)
  }

  const handleDownloadReport = async () => {
    const animalId = selectedAnimal?.animal_id || (router.query.animal_id as string)
    if (!animalId) return

    const params = {
      animal_ids: animalId,
      ...(selectedAnimal?.enclosure_id && { enclosure_ids: selectedAnimal.enclosure_id }),
      ...(selectedAnimal?.section_id && { section_ids: selectedAnimal.section_id }),
      ...(selectedAnimal?.site_id && { site_ids: selectedAnimal.site_id })
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getMedicalRecordReport,
        params,
        fileName: `Medical_records_${animalId}_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      {selectedAnimal && (
        <>
          <DownloadReport isDownloading={isDownloading} handleDownloadReport={handleDownloadReport} />
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
        {selectedAnimal ? (
          <>
            <Grid container spacing={4}>
              <Grid
                size={12}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  p: '16px',
                  backgroundColor: theme.palette.customColors.displaybgPrimary
                }}
              >
                <AnimalCard data={selectedAnimal} sx={{ border: 'none', background: 'none' }} animal={true} />
              </Grid>

              <Grid
                size={{ xs: 12, sm: 4, lg: 4, md: 4, xl: 4 }}
                sx={{
                  py: 3,
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', lg: 'row' }
                  // gap: 4
                }}
              >
                {/* <Box> */}
                <MUISearch
                  placeholder='Search by medical record ID'
                  value={searchValue}
                  onClear={handleSearchClear}
                  onChange={(e: any) => handleSearch(e.target.value)}
                />

                {/* <CommonDateRangePickers
                  filterDates={filterDate}
                  onChange={(s: Date, e: Date) => setFilterDate({ startDate: s, endDate: e })}
                /> */}
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
            module='medical'
            showFilterAndSort
            handleFilterClick={() => setOpenFilterDrawer(true)}
            handleSortClick={() => setIsSortBottomSheetOpen(true)}
            filters={selectedOptions}
            sortType={currentSort}
            filterCount={filterCount}
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
    </>
  )
}

export default MedicalRecords
