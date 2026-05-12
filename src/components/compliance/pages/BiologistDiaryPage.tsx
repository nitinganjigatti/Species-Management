'use client'

import { useEffect, useState, useCallback } from 'react'

import {
  Autocomplete,
  Avatar,
  Box,
  Card,
  CardHeader,
  Checkbox,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { format, subMonths } from 'date-fns'
import debounce from 'lodash/debounce'

import Search from 'src/views/utility/Search'
import { downloadPDF } from 'src/utility'
import Utility from 'src/utility'

import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import UserDrawer from 'src/views/pages/compliance/reports/keepers/UserDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ObservationView from 'src/views/pages/compliance/reports/biologists/Observation'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import AnimalView from 'src/views/pages/compliance/reports/biologists/ReportAnimalView'

import { getDiaryReportList, getObservationMasterType, getUserListing } from 'src/lib/api/compliance/reports'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { GridColDef } from '@mui/x-data-grid'
import { UserListing } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

interface ObservationOption {
  id: string
  type_name: string
  child_observation?: unknown[]
}

interface FilterDates {
  startDate: string
  endDate: string
}

const BiologistDiaryReport = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const userIdParam = searchParams?.get('user_id')

  const handleUserSelect = (user: UserListing | undefined) => {
    if (!user) return
    setUserDetail(user)
    const params = new URLSearchParams(searchParams?.toString())
    params.set('user_id', String(user.user_id))
    router.push(`${pathname}?${params.toString()}`)
  }

  const [userDrawer, setUserDrawer] = useState<boolean>(false)
  const [userDetail, setUserDetail] = useState<UserListing | null>(null)
  const [biologistList, setBiologistList] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [userLoader, setUserLoader] = useState<boolean>(false)

  const [filterDates, setFilterDates] = useState<FilterDates>({
    startDate: Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: 0,
    pageSize: 50
  })
  const [searchValue, setSearchValue] = useState<string>('')
  const [defaultObservationType, setDefaultObservationType] = useState<ObservationOption | null>(null)
  const [observationListLoader, setObservationListLoader] = useState<boolean>(false)
  const [observationList, setObservationList] = useState<ObservationOption[]>([])
  const [subObservationOptions, setSubObservationOptions] = useState<ObservationOption[]>([])
  const [selectedSubObservations, setSelectedSubObservations] = useState<ObservationOption[]>([])

  const fetchObservationMasterType = useCallback(async () => {
    if (observationList.length) return
    try {
      setObservationListLoader(true)
      const res = await getObservationMasterType({})
      setObservationList((res?.data as ObservationOption[]) || [])
    } catch (e) {
      console.error(e)
    } finally {
      setObservationListLoader(false)
    }
  }, [observationList.length])

  useEffect(() => {
    fetchObservationMasterType()
  }, [fetchObservationMasterType])

  useEffect(() => {
    if (userIdParam && !userDetail) {
      const fetchUser = async () => {
        setUserLoader(true)
        try {
          const res = await getUserListing({
            page_no: 1,
            ref_type: 'total_user',
            role_key: 'all_users',
            user_id: userIdParam
          })

          if (res?.data?.records?.length) {
            setUserDetail(res?.data?.records[0])
            setUserLoader(false)
          }
        } catch (err) {
          console.error('Error fetching user by id:', err)
        }
      }

      fetchUser()
    }
  }, [userIdParam])

  const eventHandler = () => {
    setUserDrawer(true)
  }

  // Main API call function
  const getBiologistReport = async (search = '') => {
    const childObservationIds = selectedSubObservations
      .map(item => item?.id)
      .filter(item => item !== undefined && item !== null && item !== '')
    setLoading(true)

    const params = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      user_id: userDetail?.user_id || userIdParam,
      page_no: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      report_type: 'json',
      type: 'biologist',
      ...(search && { q: search }),
      ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id }),
      ...(childObservationIds.length && { child_observation_ids: childObservationIds })
    }

    try {
      const response = await getDiaryReportList(params as any)
      const responseData = response?.data as any
      if (response?.success) {
        setBiologistList(responseData?.observationData || responseData?.records || [])
        setTotal(responseData?.total || 0)
      } else {
        console.log('error >>')
      }
    } catch (error) {
      console.error('Error fetching biologist report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }
    if (startDate && endDate) {
      const formattedStartDate = Utility.formatDate(startDate)
      const formattedEndDate = Utility.formatDate(endDate)
      setFilterDates({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
    }
  }

  const debouncedGetBiologistReport = useCallback(
    debounce((q: string) => {
      setPaginationModel({ page: 0, pageSize: 10 }) // reset page on search
    }, 800),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value) // Update input immediately for UI responsiveness

    // Call debounced API function
    debouncedGetBiologistReport(value)
  }

  // Effect for initial load and when dependencies change (except search)
  useEffect(() => {
    if (userDetail?.user_id) {
      getBiologistReport(searchValue)
    }
  }, [userDetail, filterDates, paginationModel])

  const clearUserSelection = () => {
    setUserDetail(null)

    const params = new URLSearchParams(searchParams?.toString())
    params.delete('user_id')
    router.push(`${pathname}?${params.toString()}`)
  }

  const UserSelectionCard = ({ user }: { user: UserListing }) => {
    return (
      <Box
        sx={{
          backgroundColor: '#eef6f4',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '100%',
          maxHeight: '500px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, p: 5 }}>
          <Avatar src={user?.user_profile_pic as string} sx={{ width: 56, height: 56 }} />
          <Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 500,
                color: (theme.palette as any).customColors?.OnSurfaceVariant
              }}
            >
              {String(user?.user_name || '-')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '16px', color: (theme.palette as any).customColors?.OnSurfaceVariant }}>
                {String(user?.role_name || '-')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  const handleClose = () => {
    setUserDrawer(false)
  }

  const handleDownloadReport = async () => {
    const childObservationIds = selectedSubObservations
      .map(item => item?.id)
      .filter(item => item !== undefined && item !== null && item !== '')
    const params = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      user_id: userDetail?.user_id || userIdParam,
      report_type: 'pdf',
      type: 'biologist',
      ...(searchValue && { q: searchValue }),
      ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id }),
      ...(childObservationIds.length && { child_observation_ids: childObservationIds })
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getDiaryReportList,
        params,
        fileName: `biologist_report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={handleDownloadReport} />
      <Box
        sx={{
          backgroundColor: '#0000000D',
          height: '32px',
          width: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50px'
        }}
      >
        <IconButton onClick={clearUserSelection}>
          <Icon icon='mdi:close' color='red' fontSize={24} />
        </IconButton>
      </Box>
    </Box>
  )

  const columns: GridColDef[] = [
    {
      minWidth: 80,
      field: 'id',
      headerName: t('compliance_module.sl_no'),
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            p: '0.5rem'
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.neutralSecondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 400,
      field: 'animal_name',
      headerName: t('compliance_module.entity'),
      sortable: false,
      renderCell: params => <AnimalView data={params.row} />
    },
    {
      minWidth: 250,
      field: 'observation',
      headerName: t('compliance_module.observation'),
      sortable: false,
      renderCell: params => <ObservationView data={params.row} />
    },
    {
      minWidth: 350,
      field: 'details',
      headerName: t('details'),
      sortable: false,
      renderCell: params => {
        const text = params.row.details ? params.row.details : '-'

        return (
          <Tooltip title={text} enterDelay={500} arrow>
            <Typography
              variant='body2'
              sx={{
                fontSize: '16px',
                p: '0.5rem',
                color: theme.palette.customColors.OnSurfaceVariant,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                lineHeight: '2rem',
                maxHeight: 'rem'
              }}
            >
              {text}
            </Typography>
          </Tooltip>
        )
      }
    }
  ]

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      {t('compliance_module.biologist_diary_report')}
    </Typography>
  )

  const getSlNo = (index: number) => {
    const slNo = paginationModel.page * paginationModel.pageSize + index + 1

    return slNo < 10 ? `0${slNo}` : slNo
  }

  const indexedRows = biologistList?.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {userDetail ? (
        <Card>
          <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
          <Box sx={{ py: '16px', px: '22px' }}>
            <UserSelectionCard user={userDetail} />
          </Box>

          <Box
            sx={{
              px: 5,
              display: 'grid',
              gap: '16px',
              alignItems: 'center',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))'
              }
            }}
          >
            <Search
              onClear={() => {
                setSearchValue('')
                debouncedGetBiologistReport('')
              }}
              onChange={handleSearchChange}
              placeholder='Search by Entity or observation type'
              value={searchValue}
              width='100%'
              textFielsSX={{
                height: '40px',
                '& fieldset': { borderColor: theme.palette.customColors.OutlineVariant },
                '&:hover fieldset': { borderColor: theme.palette.customColors.OutlineVariant },
                '&.Mui-focused fieldset': { borderColor: theme.palette.customColors.OutlineVariant }
              }}
              sx={{
                gap: '4px',
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: theme.palette.customColors.OutlineVariant
                }
              }}
            />
            <Box sx={{ display: 'contents' }}>
              <Autocomplete
                value={defaultObservationType}
                disablePortal
                id='nursery'
                loading={observationListLoader}
                options={observationList?.length > 0 ? observationList : []}
                getOptionLabel={option => option.type_name}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={(e, val) => {
                  setDefaultObservationType(val ?? null)
                  const options = Array.isArray(val?.child_observation) ? val.child_observation : []

                  const normalized = (options as Record<string, unknown>[])
                    .map(item => ({
                      id: String(item?.id ?? item?.value ?? item?.key ?? item?.type_name ?? ''),
                      type_name: String(item?.type_name || item?.name || item?.label || item?.key || '')
                    }))
                    .filter(item => item.type_name)
                  setSubObservationOptions(normalized)
                  setSelectedSubObservations([])
                  setPaginationModel(prev => ({ ...prev, page: 0 }))
                }}
                clearOnEscape
                disableClearable={false}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('compliance_module.observation_type')}
                    placeholder='Search & Select'
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        padding: 0,
                        borderRadius: '4px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.customColors.OutlineVariant
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.customColors.OutlineVariant
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        },
                        '& .MuiAutocomplete-input': {
                          padding: '8px 12px',
                          fontSize: 14
                        }
                      },
                      '& .MuiInputLabel-root': {
                        top: '50%',
                        transform: 'translate(14px, -50%) scale(1)'
                      },
                      '& .MuiInputLabel-shrink': {
                        top: 0,
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }}
                  />
                )}
              />

              <Autocomplete
                multiple
                value={selectedSubObservations}
                disablePortal
                disableCloseOnSelect
                id='sub-observation-type'
                loading={observationListLoader}
                options={subObservationOptions}
                getOptionLabel={option => option.type_name}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      checked={selected}
                      sx={{
                        mr: 1,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
                        }
                      }}
                    />
                    <Typography sx={{ fontSize: 14, color: theme.palette.customColors.OnSurfaceVariant }}>
                      {option?.type_name}
                    </Typography>
                  </li>
                )}
                onChange={(e, val) => {
                  setSelectedSubObservations(val || [])
                  setPaginationModel(prev => ({ ...prev, page: 0 }))
                }}
                renderTags={(value, getTagProps) => {
                  if (!value.length) return null
                  const names = value.map(item => item?.type_name).filter(Boolean)
                  const label = names.join(', ')

                  return (
                    <Typography
                      component='span'
                      sx={{
                        fontSize: 14,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        pointerEvents: 'none'
                      }}
                    >
                      {label}
                    </Typography>
                  )
                }}
                clearOnEscape
                disableClearable={false}
                disabled={!defaultObservationType || subObservationOptions.length === 0}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('compliance_module.sub_observation_types')}
                    placeholder={selectedSubObservations.length ? '' : 'Search & Select'}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        padding: '0 8px',
                        borderRadius: '4px',
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                        overflow: 'hidden',
                        cursor: 'text',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.customColors.OutlineVariant
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.customColors.OutlineVariant
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        },
                        '& .MuiAutocomplete-input': {
                          padding: '8px 4px',
                          fontSize: 14,
                          minWidth: 0,
                          width: selectedSubObservations.length ? 0 : 'auto'
                        },
                        '& .MuiAutocomplete-input::placeholder': {
                          opacity: selectedSubObservations.length ? 0 : 1
                        },
                        '& .MuiAutocomplete-endAdornment': {
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        top: '50%',
                        transform: 'translate(14px, -50%) scale(1)'
                      },
                      '& .MuiInputLabel-shrink': {
                        top: 0,
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }}
                  />
                )}
              />
              <Box sx={{ minWidth: 0 }}>
                <CommonDateRangePickers
                  filterDates={filterDates}
                  onChange={handleDateRangeChange}
                  useCustomText={true}
                  customText='Select a Date Range'
                />
              </Box>
            </Box>
          </Box>

          <Grid
            sx={{
              margin: '0px 1.375rem 0px 1.375rem'
            }}
          >
            <CommonTable
              onRowClick={() => {}}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={() => {}}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={''}
              getRowHeight={() => 'auto'}
            />
          </Grid>
        </Card>
      ) : userLoader ? (
        <Box display='flex' justifyContent='center' alignItems='center'>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ p: 6 }}>
          <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
          <ReportCard
            subtitle={t('compliance_module.no_biologist_selected')}
            description={t('compliance_module.select_any_biologist_to_view_report')}
            buttonText={t('compliance_module.select_biologist')}
            addHandler={eventHandler}
          />
        </Card>
      )}

      {userDrawer && (
        <UserDrawer
          open={userDrawer}
          onClose={handleClose}
          setUserDetail={handleUserSelect}
          placeholder='Search by Biologist name'
          queryKey='user-biologist-Report'
          headerText='Select the Biologist'
          footerText={t('compliance_module.generate_biologist_diary_report')}
        />
      )}
    </>
  )
}

export default BiologistDiaryReport
