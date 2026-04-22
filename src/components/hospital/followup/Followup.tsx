'use client'

import { useTheme } from '@emotion/react'
import {
  Box,
  Typography,
  Card,
  CardHeader,
  Grid,
  Tooltip,
  CircularProgress,
  IconButton,
  Tabs,
  Tab
} from '@mui/material'
import { debounce } from 'lodash'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import InpatientFilterDrawer from 'src/components/hospital/drawer/InpatientFilterDrawer'
import { useHospital } from 'src/context/HospitalContext'
import { getFollowUpPatientsListings, getPatientDischargeSummary, downloadFollowUpListings } from 'src/lib/api/hospital/inpatient'
import Utility, { downloadPDF } from 'src/utility'
import RenderUtility from 'src/utility/render'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import toast from 'react-hot-toast'
import { ExportButton } from 'src/views/utility/render-snippets'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const HospitalFollowUp = () => {
  const theme: any = useTheme()
  const { t } = useTranslation()
  const router = useSafeRouter()

  const { selectedHospital } = useHospital()

  const [searchValue, setSearchValue] = useState<string>('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [filterDate, setFilterDate] = useState<any>({})
  const [downloadingRowId, setDownloadingRowId] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [excelDownload, setExcelDownload] = useState<boolean>(false)

  const [selectedOptions, setSelectedOptions] = useState<any>({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 50,
    q: ''
  })

  const applyFilters = (selectedOptions: any) => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query as any

    setFilters({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      q: q
    })

    // setSearchValue(q)
  }, [router.query])

  const prepareFilterParams = (key: string) => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = (dateString: any) => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const fetchFollowUpPatients = async () => {
    if (!selectedHospital?.id) return

    try {
      setLoading(true)

      const res: any = await (getFollowUpPatientsListings as any)({
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

  const updateUrlParams = (updatedFilters: any) => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, (value as any).toString())
      }
    })
    const queryString = params.toString()
    router.push(`${router.pathname}?${queryString}`)
  }

  const handlePaginationModelChange = (model: any) => {
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
      debounce((value: string) => {
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
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handleDownloadDischargeSummary = async (row: any) => {
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

  const getSlNo = (index: number) => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row: any, index: number) => ({
    ...row,
    id: +row?.discharge_id,
    sl_no: getSlNo(index)
  }))

    const exportFollowUpListings = async () => {
    try {
      setExcelDownload(true)

      const params = {
        page_no: 1,
        limit: 50,
        q: searchValue,
        hospital_id: selectedHospital?.id,
        due_days_crossed: activeTab,
        export: true
      }

      const response: any = await downloadFollowUpListings(params)
      if (response?.success === true && response) {
        ;(Utility as any).downloadFileFromURL(response?.data?.download_url, Utility.extractHoursAndMinutes)
        setExcelDownload(false)
      }
    } catch (error: any) {
      toast.error(error?.message)
    } finally {
      setExcelDownload(false)
    }
  }


  const columns: any[] = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: t('hospital_module.sl_no'),
      renderCell: (params: any) => (
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
      headerName: t('hospital_module.animal_name_and_id'),
      renderCell: (params: any) => (
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
      headerName: t('hospital_module.medical_record_id'),
      renderCell: (params: any) => (
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
      headerName: t('hospital_module.discharge_summary'),
      renderCell: (params: any) => (
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
      headerName: t('hospital_module.follow_up'),
      align: 'left',
      headerAlign: 'left',

      renderCell: (params: any) => (
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
      headerName: activeTab === 0 ? t('hospital_module.due_in') : t('hospital_module.due_for'),
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: any) => {
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
      headerName: t('hospital_module.chief_doctor'),
      renderCell: (params: any) => (
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
      headerName: t('action'),
      renderCell: (params: any) => {
        const isRowLoading = downloadingRowId === params.row.id

        return (
          <Tooltip title={(t('hospital_module.download_discharge_summary') as string)}>
            <IconButton onClick={() => handleDownloadDischargeSummary(params.row)} disabled={isRowLoading}>
              {isRowLoading ? <CircularProgress size={22} /> : <Icon icon='hugeicons:download-square-02' />}
            </IconButton>
          </Tooltip>
        )
      }
    }
  ]

  const handleRowClick = async (params: any) => {
    if (params?.field !== 'action') {
      const queryParams = new URLSearchParams({
        animal_id: params.row?.animal_detail?.animal_id,
        medical_record_id: params.row.medical_record_id
      }).toString()
      router.push(`/hospital/followup/${params.row?.hospital_case_id}?${queryParams}`)
    }
  }

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue)
    setSearchValue('')
    debouncedSearch('')
  }

  const getTabLabel = (key: number, label: string) => {
    return key === activeTab ? `${label} - ${total}` : label
  }

  return (
    <>
      <Box>
         <DynamicBreadcrumbs
            sx={{ mb: 5 }}
            pageItems={[{ title: t('navigation.hospital') }, { title: t('hospital_module.patients') }, { title: t('navigation.follow_up') }]}
          />
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle(t('navigation.follow_up'))} />
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
                  placeholder={(t('hospital_module.search_by_medical_id') as string)}
                  value={searchValue}
                  onClear={handleSearchClear}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  textFielsSX={{
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '13px'
                    }
                  }}
                />
              </Box>
              <Box sx={{ mr: 2, display: 'flex', alignItems: {xs: 'flex-start',sm: 'center'},flexDirection: {xs: 'column', sm: 'row'} , gap: 4, ml: 2 }}>
                <CommonDateRangePickers
                  showFutureDates
                  filterDates={filterDate}
                  onChange={(s: any, e: any) => setFilterDate({ startDate: s, endDate: e })}
                />
                <Box sx = {{display: 'flex', gap: 4}}>
                <FilterButtonWithNotification
                  onClick={() => setOpenFilterDrawer(true)}
                  appliedFiltersCount={filterCount}
                />
                  <Box sx={{ width: 40, height: 40 }}>
                  <ExportButton
                    loading={excelDownload}
                    onClick={exportFollowUpListings}
                    disabled={total === 0 ? true : false}
                    bgcolor={undefined}
                  />
                </Box>
                </Box>
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
                <Tab value={0} label={getTabLabel(0, t('hospital_module.active'))} />
                <Tab value={1} label={getTabLabel(1, t('hospital_module.overdue'))} />
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

export default HospitalFollowUp
