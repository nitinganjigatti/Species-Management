import { useCallback, useEffect, useState } from 'react'

import { useTheme } from '@mui/material/styles'
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
import { debounce } from 'lodash'
import { format, subMonths } from 'date-fns'

import Utility, { downloadPDF } from 'src/utility'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Icon from 'src/@core/components/icon'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import Search from 'src/views/utility/Search'
import ObservationCard from 'src/views/utility/ObservationCard'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import UserDrawer from 'src/views/pages/compliance/reports/keepers/UserDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalView from 'src/views/pages/compliance/reports/biologists/ReportAnimalView'

import { getDiaryReportList, getObservationMasterType, getUserListing } from 'src/lib/api/compliance/reports'
import { useRouter } from 'next/router'
import { GridColDef } from '@mui/x-data-grid'
import { UserListing } from 'src/types/compliance'

interface ObservationOption {
  id: string
  type_name: string
  child_observation?: unknown[]
}

interface FilterDates {
  startDate: string
  endDate: string
}

type EmotionTheme = {
  palette: {
    customColors: Record<string, string>
    primary: { main: string }
  }
}

const KeeperDiaryReport = () => {
  const theme = useTheme()
  const router = useRouter()

  const handleUserSelect = (user: UserListing | undefined) => {
    if (!user) return
    setUserDetail(user)
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, user_id: user.user_id }
      },
      undefined,
      { shallow: true }
    )
  }

  const [userDrawer, setUserDrawer] = useState<boolean>(false)
  const [userDetail, setUserDetail] = useState<UserListing | null>(null)
  const [keeperList, setKeeperList] = useState<Record<string, unknown>[] | null>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [userLoader, setUserLoader] = useState<boolean>(false)

  const [filterDates, setFilterDates] = useState<FilterDates>({
    startDate: Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })
  const [searchValue, setSearchValue] = useState<string>('')

  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: 0,
    pageSize: 50
  })

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
    if (router.query.user_id && !userDetail) {
      const fetchUser = async () => {
        setUserLoader(true)
        try {
          const res = await getUserListing({
            page_no: 1,
            ref_type: 'total_user',
            role_key: 'all_users',
            user_id: router.query.user_id
          })

          console.log('User fetch res:', res)

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
  }, [router.query.user_id])

  const eventHandler = () => {
    setUserDrawer(true)
  }

  const getUserKeeperReport = async (q: string) => {
    const childObservationIds = selectedSubObservations
      .map(item => item?.id)
      .filter(item => item !== undefined && item !== null && item !== '')
    setLoading(true)

    const params: Record<string, unknown> = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      ...(q?.trim() !== '' && { q: q.trim() }),
      user_id: userDetail?.user_id || router.query.user_id,
      page_no: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      report_type: 'json',
      ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id }),
      ...(childObservationIds.length && { child_observation_ids: childObservationIds })
    }

    const response = await getDiaryReportList(params as any)
    const responseData = response?.data as any
    if (response?.success) {
      setKeeperList(responseData?.observationData || responseData?.records || [])
      setTotal(responseData?.total || 0)
      setLoading(false)
    } else {
      console.error('error >>')
      setLoading(true)
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

  useEffect(() => {
    if (userDetail?.user_id) {
      getUserKeeperReport(searchValue)
    }
  }, [userDetail, paginationModel, filterDates])

  const clearUserSelection = () => {
    setUserDetail(null)
    setKeeperList(null)
    setTotal(0)

    const { user_id, ...rest } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: rest
      },
      undefined,
      { shallow: false }
    )
  }

  const debouncedSearch = useCallback(
    debounce((_q: string) => {
      setPaginationModel({ page: 0, pageSize: 10 }) // reset page on search
    }, 800),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value) // Update input immediately for UI responsiveness

    // Call debounced API function
    debouncedSearch(value)
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 5 }}>
          <Avatar src={user?.user_profile_pic as string} sx={{ width: 56, height: 56 }} />
          <Box>
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontSize: '20px',
                fontWeight: 500,
                color: (theme.palette as any).customColors?.OnSurfaceVariant
              }}
            >
              {String(user?.user_name || '')}
            </Typography>
            <Typography sx={{ fontSize: '16px', color: (theme.palette as any).customColors?.OnSurfaceVariant }}>
              {String(user?.role_name || 'N/A')}
            </Typography>
          </Box>
        </Box>

        {/* Right box with light background and red close icon */}
        {/* <Box
          sx={{
            backgroundColor: '#0000000D',
            height: { sm: '98px', xs: '120px' },
            width: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px'
          }}
        >
          <IconButton onClick={clearUserSelection}>
            <Icon icon='mdi:close' color='red' fontSize={30} />
          </IconButton>
        </Box> */}
      </Box>
    )
  }

  const handleClose = () => {
    setUserDrawer(false)
  }

  const downloadKeeperDiaryReport = async () => {
    const params: Record<string, unknown> = {
      user_id: userDetail?.user_id || router.query.user_id,
      q: searchValue,
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      report_type: 'pdf'
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getDiaryReportList,
        params,
        fileName: `Keeper_Diary_Report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadKeeperDiaryReport} />
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
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            fontSize: '14px',
            fontWeight: 500,
            p: '16px'
          }}
        >
          {parseInt(params.row.sl_no)}.
        </Typography>
      )
    },
    {
      field: 'animal_name',
      headerName: 'Entity',
      flex: 2,
      minWidth: 400,
      sortable: false,
      renderCell: params => (
        <Box sx={{ p: '0.5rem', mt: 2 }}>
          <AnimalView data={params.row} />
        </Box>
      )
    },
    {
      field: 'ObservationType',
      headerName: 'Observation Type',
      flex: 1,
      sortable: false,
      minWidth: 250,
      renderCell: params => (
        <Box sx={{ p: 2 }}>
          <ObservationCard
            title={params.row.master_enrichment_type}
            description={params.row.child_enrichment_type}
            dateTime={params.row.date_time}
            containerStyle={{}}
          />
        </Box>
      )
    },
    {
      field: 'details',
      headerName: 'Details',
      sortable: false,
      flex: 2,
      minWidth: 350,
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Tooltip title={params.row.details || ''} arrow placement='bottom'>
          <Typography
            sx={{
              fontSize: '16px',
              p: '0.5rem',
              color: theme.palette.customColors.OnSurfaceVariant,
              display: '-webkit-box',
              WebkitLineClamp: 3, // Max 4 lines
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              lineHeight: '2rem',
              maxHeight: 'rem' // 4 lines * 1.5rem line-height
            }}
          >
            {params.row.details}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'sex',
      headerName: 'Sex',
      sortable: false,
      flex: 0.5,
      minWidth: 160,
      renderCell: params => {
        const sex = params.row.sex as string | undefined
        const capitalizedSex = sex ? sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase() : '-'

        return (
          <Typography
            sx={{ fontSize: '16px', fontWeight: 400, pl: 2, color: theme.palette.customColors.OnSurfaceVariant }}
          >
            {capitalizedSex}
          </Typography>
        )
      }
    },
    {
      field: 'taxonomy',
      headerName: 'Taxonomy',
      sortable: false,
      flex: 1,
      minWidth: 160,
      renderCell: params => (
        <Typography
          sx={{ fontSize: '16px', fontWeight: 400, pl: 2, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          {params.row.taxonomy || '-'}
        </Typography>
      )
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
      Keeper's Diary Report
    </Typography>
  )

  const getSlNo = (index: number) => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = keeperList?.map((row, index) => ({
    ...row,
    id: (row.id as number | undefined) || index, // ensure there's always a fallback ID
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

          {/* <Box
            sx={{
              display: 'flex',
              flexDirection: { sm: 'row', xs: 'column' },
              justifyContent: { sm: 'space-between', xs: 'flex-start' },
              alignItems: 'center',
              gap: 4
            }}
          >
            <Box sx={{ width: '100%', px: 6 }}>
              <Search
                onClear={() => {
                  setSearchValue('')
                  debouncedSearch('')
                }}
                onChange={handleSearchChange}
                placeholder='Search by Entity or observation type'
                value={searchValue}
                inputStyle={{ py: '10px', px: '12px' }}
                width={{ xs: '100%', sm: '70%' }}
              />
            </Box>

            <Box sx={{ px: 6, width: { xs: '100%', sm: '70%' } }}>
              <CommonDateRangePickers
                filterDates={filterDates}
                onChange={handleDateRangeChange}
                useCustomText={true}
                customText='Select a Date Range'
              />
            </Box>
          </Box> */}

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
                debouncedSearch('')
              }}
              onChange={handleSearchChange}
              placeholder='Search by Entity or observation type'
              value={searchValue}
              inputStyle={{ py: '10px', px: '12px' }}
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
                // disabled={isEdit || incubatorDetail}
                id='nursery'
                loading={observationListLoader}
                options={observationList?.length > 0 ? observationList : []}
                getOptionLabel={(option: ObservationOption) => option.type_name}
                isOptionEqualToValue={(option: ObservationOption, value: ObservationOption) => option?.id === value?.id}
                onChange={(e, val) => {
                  setDefaultObservationType(val ?? null)
                  const options = Array.isArray(val?.child_observation) ? val.child_observation : []

                  const normalized: ObservationOption[] = options
                    .map((item: unknown) => {
                      const itemObj = item as Record<string, unknown>
                      return {
                        id: String(itemObj?.id ?? itemObj?.value ?? itemObj?.key ?? itemObj?.type_name ?? ''),
                        type_name: String(itemObj?.type_name || itemObj?.name || itemObj?.label || itemObj?.key || '')
                      }
                    })
                    .filter((item: ObservationOption) => item.type_name)
                  setSubObservationOptions(normalized)
                  setSelectedSubObservations([])
                  setPaginationModel(prev => ({ ...prev, page: 0 }))
                }}
                clearOnEscape
                disableClearable={false}
                renderInput={params => (
                  <TextField
                    // onChange={e => {
                    //   searchNursery(e.target.value)
                    // }}
                    {...params}
                    label='Observation Type'
                    placeholder='Search & Select'
                    sx={{
                      width: '100%',

                      /* ---- OUTER INPUT WRAPPER (outlined root) ---- */
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        padding: 0, // wrapper padding zero, inner input pe actual padding
                        borderRadius: '4px',

                        /* real border is the notchedOutline fieldset */
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.customColors.OutlineVariant
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.customColors.OutlineVariant
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        },

                        /* ---- INNER INPUT (text area) ---- */
                        '& .MuiAutocomplete-input': {
                          padding: '8px 12px', // top/bottom = 8, left/right = 12
                          fontSize: 14
                        }
                      },

                      '& .MuiInputLabel-root': {
                        top: '50%', // vertical align
                        transform: 'translate(14px, -50%) scale(1)' // center label
                      },
                      '& .MuiInputLabel-shrink': {
                        top: 0,
                        transform: 'translate(14px, -9px) scale(0.75)' // focus/value hone par default float
                      }
                    }}

                    // error={Boolean(errors.nursery)}
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
                getOptionLabel={(option: ObservationOption) => option.type_name}
                isOptionEqualToValue={(option: ObservationOption, value: ObservationOption) => option?.id === value?.id}
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
                renderTags={(value: ObservationOption[], getTagProps) => {
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
                    label='Sub-Observation Types'
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
              getRowHeight={() => 'auto'}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={() => {}}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={''}
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
            subtitle='No Keeper selected'
            description=' Select any keeper to view report'
            buttonText='SELECT KEEPER'
            addHandler={eventHandler}
          />
        </Card>
      )}

      {userDrawer && (
        <UserDrawer
          open={userDrawer}
          onClose={handleClose}
          setUserDetail={handleUserSelect}
          placeholder='Search by Keeper name'
          title='Keepers'
        />
      )}
    </>
  )
}

export default enforceModuleAccess(KeeperDiaryReport, 'compliance_module')
