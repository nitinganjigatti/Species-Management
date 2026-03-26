import { useTheme } from '@emotion/react'
import {
  Breadcrumbs,
  Box,
  Typography,
  Card,
  CardHeader,
  Grid,
  Button,
  Select,
  Tooltip,
  MenuItem,
  IconButton,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import InpatientFilterDrawer from 'src/components/hospital/drawer/InpatientFilterDrawer'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { visitTypeOptions } from 'src/constants/Constants'
import { useHospital } from 'src/context/HospitalContext'
import { getPatientDischargeSummary, getPatientsMortalityListings, downloadMortalityListings } from 'src/lib/api/hospital/inpatient'
import Utility, { downloadPDF } from 'src/utility'
import RenderUtility from 'src/utility/render'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import { ExportButton } from 'src/views/utility/render-snippets'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const HospitalMortality = () => {
  const theme = useTheme()
  const router = useRouter()

  const { selectedHospital } = useHospital()

  const [searchValue, setSearchValue] = useState('')
  const [selectedVisitType, setSelectedVisitType] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [filterDate, setFilterDate] = useState({})
  const [downloadingRowId, setDownloadingRowId] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [excelDownload, setExcelDownload] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: ''
  })

  const [selectedMortalityType, setSelectedMortalityType] = useState('')

  const mortalityTabs = [
    { label: 'All', value: '' },
    { label: 'Inpatient', value: 'inpatient' },
    { label: 'Outpatient', value: 'opd' }
  ]

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q: q
    })

    // setSearchValue(q)
  }, [router.query])

  const prepareFilterParams = key => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = dateString => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const fetchPatientsMortality = async () => {
    if (!selectedHospital?.id) return

    try {
      setLoading(true)

      const res = await getPatientsMortalityListings({
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        hospital_id: selectedHospital?.id,
        visit_type: selectedVisitType,
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        users: prepareFilterParams('Chief Veterinarian'),
        origin_site: prepareFilterParams('Origin Site'),
        discharge_treatment_type: selectedMortalityType || undefined
      })

      setRows(res?.data?.records || [])
      setTotal(res?.data?.total || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatientsMortality()
  }, [
    filters?.page,
    filters?.limit,
    filters?.q,
    selectedVisitType,
    selectedHospital?.id,
    filterDate,
    selectedOptions,
    selectedMortalityType
  ])

  // const { data, isFetching, refetch } = useQuery({
  //   queryKey: [
  //     'patients-mortality-listings',
  //     filters,
  //     selectedVisitType,
  //     selectedHospital?.id,
  //     filterDate,
  //     selectedOptions
  //   ],
  //   queryFn: () =>
  //     getPatientsMortalityListings({
  //       page_no: filters?.page,
  //       limit: filters?.limit,
  //       q: filters?.q,
  //       hospital_id: 1,
  //       visit_type: selectedVisitType,
  //       hospital_id: selectedHospital?.id,
  //       from_date: formatDate(filterDate.startDate),
  //       to_date: formatDate(filterDate.endDate),
  //       users: prepareFilterParams('Chief Veterinarian'),
  //       origin_site: prepareFilterParams('Origin Site')
  //     }),
  //   enabled: !!selectedHospital?.id
  // })

  // const total = data?.data?.total || 0
  // const rows = data?.data?.records || []

  // useEffect(() => {
  //   refetch()
  // }, [refetch])

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  const handlePaginationModelChange = model => {
    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        const updated = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters]
  )

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handleDownloadDischargeSummary = async row => {
    const rowId = row?.id
    if (!rowId) return

    setDownloadingRowId(rowId)

    try {
      const params = {
        hospital_case_id: row?.hospital_case_id
      }

      await downloadPDF({
        apiCall: getPatientDischargeSummary,
        params,
        fileName: `Discharge_Summary${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading discharge summary:', error)
    } finally {
      setDownloadingRowId(null)
    }
  }

    const exportMortalityListings = async () => {
    try {
      setExcelDownload(true)

      const params = {
        page_no: 1,
        limit: 50,
        q: searchValue,
        hospital_id: selectedHospital?.id,
        visit_type: selectedVisitType,
        export: true
      }

      const response = await downloadMortalityListings(params)
      if (response?.success === true && response) {
        console.log(response?.data?.download_url)
        Utility.downloadFileFromURL(response?.data?.download_url, Utility.extractHoursAndMinutes)
        setExcelDownload(false)
      }
    } catch (error) {
      toast.error(error?.message)
    } finally {
      setExcelDownload(false)
    }
  }

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: +row?.discharge_id,
    sl_no: getSlNo(index)
  }))

  const columns = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: 'NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 350,
      minWidth: 20,
      sortable: false,
      field: 'animal_name',
      headerName: 'Animal Name & ID',
      renderCell: params => (
        <>
          <AnimalCard
            data={{
              default_icon: params.row?.animal_detail?.default_icon,
              sex: params.row?.animal_detail?.sex,
              type: params.row?.animal_detail?.type,
              local_identifier_name: params.row?.animal_detail?.local_identifier_name,
              local_identifier_value: params.row?.animal_detail?.local_identifier_value,
              animal_id: params.row?.animal_detail?.animal_id,
              common_name: params.row?.animal_detail?.common_name,
              scientific_name: params.row?.animal_detail?.scientific_name,
              age: params.row?.animal_detail?.age,
              site_name: params.row?.animal_detail?.site_name
            }}
          />
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'medical_record_code',
      headerName: 'Medical Record ID',
      renderCell: params => (
        <MedicalIdChip
          medId={params?.row?.medical_record_code}
          backgroundColor={theme.palette.customColors.mdAntzNeutral}
        />
      )
    },
    {
      width: 250,
      minWidth: 20,
      field: 'manner_of_death',
      sortable: false,
      headerName: 'Reason',
      renderCell: params => (
        <>
          <Tooltip title={params.row.manner_of_death}>
            <Typography
              variant='body2'
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                fontFamily: 'Inter',
                color: theme.palette.customColors.OnSurfaceVariant,
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal'
              }}
            >
              {params.row.manner_of_death || ''}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'notes',
      sortable: false,
      headerName: 'Mortality Summary',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <>
          <Tooltip
            title={
              <span
                dangerouslySetInnerHTML={{
                  __html: params?.row?.notes || 'NA'
                }}
              />
            }
          >
            <Box
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                fontFamily: 'Inter',
                color: theme.palette.customColors.OnSurfaceVariant,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                py: 4
              }}
              dangerouslySetInnerHTML={{
                __html: params?.row?.notes || 'NA'
              }}
            />
          </Tooltip>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'date_of_death',
      sortable: false,
      headerName: 'Mortality Date And Time',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          {params?.row?.date_of_death ? (
            <Box>
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
              >
                {Utility.convertUtcToLocalReadableDate(params?.row?.date_of_death)}
              </Typography>
              <Typography
                sx={{ fontSize: '12px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
              >
                {Utility.convertUTCToLocaltime(params?.row?.date_of_death)}
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              -
            </Typography>
          )}
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'admitted_at',
      sortable: false,
      headerName: 'Admission',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Box>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUtcToLocalReadableDate(params?.row?.admitted_at)}
            </Typography>
            <Typography
              sx={{ fontSize: '12px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUTCToLocaltime(params?.row?.admitted_at)}
            </Typography>
          </Box>
        </>
      )
    },
    {
      width: 180,
      minWidth: 20,
      field: 'duration',
      sortable: false,
      headerName: 'duration',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => {
        const totalDuration = Number(params?.row?.duration_days || 0) + 1

        return (
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {totalDuration} {totalDuration > 1 ? 'Days' : 'Day'}
          </Typography>
        )
      }
    },
    {
      width: 200,
      minWidth: 20,
      field: 'visit_type',
      sortable: false,
      headerName: 'Visit Type',
      renderCell: params => (
        <>
          <VisitType title={params.row.visit_type} />
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'attend_by_full_name',
      sortable: false,
      headerName: 'Chief Doctor',
      renderCell: params => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.attend_by_full_name}
          </Typography>
        </>
      )
    },
    {
      width: 100,
      miWidth: 20,
      field: 'action',
      sortable: false,
      headerName: 'Action',
      renderCell: params => {
        const isRowLoading = downloadingRowId === params.row.id

        return (
          <Tooltip title='Download Discharge Summary'>
            <IconButton onClick={() => handleDownloadDischargeSummary(params.row)} disabled={isRowLoading}>
              {isRowLoading ? <CircularProgress size={22} /> : <Icon icon='hugeicons:download-square-02' />}
            </IconButton>
          </Tooltip>
        )
      }
    }
  ]

  const handleRowClick = async params => {
    if (params?.field !== 'action') {
      router.push({
        pathname: `/hospital/mortality/${params.row?.hospital_case_id}`,
        query: { animal_id: params.row?.animal_detail?.animal_id, medical_record_id: params.row.medical_record_id }
      })

      // try {
      //   const payload = {
      //     hospital_case_id: params?.row?.hospital_case_id
      //   }

      //   const response = await getPatientDischargeSummary(payload)
      //   if (response?.success) {
      //     const pdfLink = response?.data?.download_url

      //     if (pdfLink) {
      //       window.open(pdfLink, '_blank', 'noopener,noreferrer')
      //     }
      //   }
      // } catch (error) {
      //   console.error('Error downloading discharge summary:', error)
      // } finally {
      //   setDownloadingRowId(null)
      // }
    }
  }

  return (
    <>
      <Box>
        <DynamicBreadcrumbs
          sx={{ mb: 5 }}
          pageItems={[{ title: 'Hospital' }, { title: 'Patients' }, { title: 'Mortality' }]}
        />
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle('Mortality')} />
            <Box
              sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 4
              }}
            >
              <Box sx={{ ml: 2 }}>
                <Search
                  borderRadius='4px'
                  width='343px'
                  placeholder='Search by medical Id / AID / animal identifier'
                  value={searchValue}
                  onClear={handleSearchClear}
                  onChange={e => handleSearch(e.target.value)}
                  textFielsSX={{
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '13px'
                    }
                  }}
                />
              </Box>
              <Box sx={{ mr: 2, display: 'flex', alignItems: {xs: 'flex-start',sm: 'center'},flexDirection: {xs: 'column', sm: 'row'} , gap: 4, ml: 2 }}>
                <CommonDateRangePickers
                  filterDates={filterDate}
                  onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
                />
               <Box sx = {{display: 'flex', gap: 4}}>
                <Select
                  size='small'
                  value={selectedVisitType}
                  displayEmpty
                  onChange={e => setSelectedVisitType(e.target.value)}
                >
                  {visitTypeOptions?.map((item, index) => (
                    <MenuItem key={index} value={item?.value}>
                      {item?.label}
                    </MenuItem>
                  ))}
                </Select>
                <FilterButtonWithNotification
                  onClick={() => setOpenFilterDrawer(true)}
                  appliedFiltersCount={filterCount}
                />
                <Box sx={{ width: 40, height: 40 }}>
                  <ExportButton
                    loading={excelDownload}
                    onClick={exportMortalityListings}
                    disabled={total === 0 ? true : false}
                  />
                </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ px: 5, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={selectedMortalityType}
                onChange={(e, newValue) => {
                  setSelectedMortalityType(newValue)
                  setFilters(prev => ({ ...prev, page: 1 }))
                }}
                aria-label='mortality treatment type tabs'
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '14px',
                    minWidth: 'auto',
                    px: 4
                  }
                }}
              >
                {mortalityTabs.map(tab => (
                  <Tab key={tab.value} label={tab.label} value={tab.value} />
                ))}
              </Tabs>
            </Box>
            <Grid
              sx={{
                mx: { xs: 5 }
              }}
            >
              <CommonTable
                columns={columns}
                indexedRows={indexedRows}
                total={total}
                loading={loading}
                paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                setPaginationModel={handlePaginationModelChange}
                searchValue=''
                getRowHeight={() => 'auto'}
                onCellClick={handleRowClick}
                externalTableStyle={{
                  '& .MuiDataGrid-cell': {
                    padding: 4
                  },
                  '& .MuiDataGrid-row:hover': {
                    // backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }
                }}
              />
            </Grid>
          </Card>
        </Box>
      </Box>
      {openFilterDrawer && (
        <InpatientFilterDrawer
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
          hospitalId={selectedHospital?.id}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(HospitalMortality, 'add_hospital')
