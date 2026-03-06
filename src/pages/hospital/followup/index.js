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
  CircularProgress,
  IconButton,
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
import { useHospital } from 'src/context/HospitalContext'
import { getFollowUpPatientsListings, getPatientDischargeSummary } from 'src/lib/api/hospital/inpatient'
import Utility, { downloadPDF } from 'src/utility'
import RenderUtility from 'src/utility/render'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'

const HospitalFollowUp = () => {
  const theme = useTheme()
  const router = useRouter()

  const { selectedHospital } = useHospital()

  const [searchValue, setSearchValue] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [filterDate, setFilterDate] = useState({})
  const [downloadingRowId, setDownloadingRowId] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: ''
  })

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q
    })

    setSearchValue(q)
  }, [router.query])

  const prepareFilterParams = key => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = dateString => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const fetchFollowUpPatients = async () => {
    if (!selectedHospital?.id) return

    try {
      setLoading(true)

      const res = await getFollowUpPatientsListings({
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        hospital_id: selectedHospital?.id,
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        users: prepareFilterParams('Chief Veterinarian'),
        origin_site: prepareFilterParams('Origin Site'),
        due_days_crossed: activeTab
      })

      setRows(res?.data?.records || [])
      setTotal(res?.data?.total_records || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowUpPatients()
  }, [filters?.page, filters?.limit, filters?.q, selectedHospital?.id, filterDate, selectedOptions, activeTab])

  // const { data, isFetching, refetch } = useQuery({
  //   queryKey: [
  //     'patients-discharge-follow-up-listings',
  //     filters,
  //     selectedHospital?.id,
  //     filterDate,
  //     selectedOptions,
  //     activeTab
  //   ],
  //   queryFn: () =>
  //     getFollowUpPatientsListings({
  //       page_no: filters?.page,
  //       limit: filters?.limit,
  //       q: filters?.q,
  //       hospital_id: 1,
  //       hospital_id: selectedHospital?.id,
  //       from_date: formatDate(filterDate.startDate),
  //       to_date: formatDate(filterDate.endDate),
  //       users: prepareFilterParams('Chief Veterinarian'),
  //       origin_site: prepareFilterParams('Origin Site'),
  //       due_days_crossed: activeTab
  //     }),
  //   enabled: !!selectedHospital?.id
  // })

  // const total = data?.data?.total_records || 0
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

      const response = await downloadPDF({
        apiCall: getPatientDischargeSummary,
        params,
        fileName: `Discharge_Summary${Date.now()}.pdf`
      })

      console.log('Download response:', response)
    } catch (error) {
      console.error('Error downloading discharge summary:', error)
    } finally {
      setDownloadingRowId(null)
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
      field: 'reason',
      sortable: false,
      headerName: 'Discharge Summary',
      renderCell: params => (
        <>
          <Tooltip
            title={
              <span
                dangerouslySetInnerHTML={{
                  __html: params?.row?.reason || 'NA'
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
                __html: params?.row?.reason || 'NA'
              }}
            />
          </Tooltip>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'follow_up_date',
      sortable: false,
      headerName: 'Follow Up',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Box>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUtcToLocalReadableDate(params?.row?.follow_up_date)}
            </Typography>
          </Box>
        </>
      )
    },
    {
      width: 180,
      minWidth: 20,
      field: 'due_in_days',
      sortable: false,
      headerName: activeTab === 0 ? 'Due in' : 'Due For',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => {
        return (
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.due_in_days}
          </Typography>
        )
      }
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
        pathname: `/hospital/followup/${params.row?.hospital_case_id}`,
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

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue)
    setSearchValue('')
    debouncedSearch('')
  }

  const getTabLabel = (key, label) => {
    return key === activeTab ? `${label} - ${total}` : label
  }

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Follow Up</Typography>
        </Breadcrumbs>
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle('Follow Up')} />
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
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 4, ml: 2 }}>
                <CommonDateRangePickers
                  showFutureDates
                  filterDates={filterDate}
                  onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
                />
                <FilterButtonWithNotification
                  onClick={() => setOpenFilterDrawer(true)}
                  appliedFiltersCount={filterCount}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: 'inline-flex',
                ml: 6,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                TabIndicatorProps={{
                  style: {
                    backgroundColor: theme.palette.primary.main,
                    height: '2px',
                    borderRadius: '2px 2px 0 0'
                  }
                }}
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    minHeight: 40
                  }
                }}
              >
                <Tab value={0} label={getTabLabel(0, 'Active')} />
                <Tab value={1} label={getTabLabel(1, 'Overdue')} />
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

export default enforceModuleAccess(HospitalFollowUp, 'add_hospital')
