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
import { useTheme } from '@emotion/react'
import { format, subMonths } from 'date-fns'
import debounce from 'lodash/debounce'

import Search from 'src/views/utility/Search'
import { downloadPDF } from 'src/utility'
import Utility from 'src/utility'

import Icon from 'src/@core/components/icon'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import UserDrawer from 'src/views/pages/compliance/reports/keepers/UserDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ObservationView from 'src/views/pages/compliance/reports/biologists/Observation'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import AnimalView from 'src/views/pages/compliance/reports/biologists/ReportAnimalView'

import { getDiaryReportList, getObservationMasterType, getUserListing } from 'src/lib/api/compliance/reports'
import { useRouter } from 'next/router'

const BiologistDiaryReport = () => {
  const theme = useTheme()
  const router = useRouter()

  const handleUserSelect = user => {
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

  const [userDrawer, setUserDrawer] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [biologistList, setBiologistList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [userLoader, setUserLoader] = useState(false)

  const [filterDates, setFilterDates] = useState({
    startDate: Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50
  })
  const [searchValue, setSearchValue] = useState('')
  const [defaultObservationType, setDefaultObservationType] = useState(null)
  const [observationListLoader, setObservationListLoader] = useState(false)
  const [observationList, setObservationList] = useState([])
  const [subObservationOptions, setSubObservationOptions] = useState([])
  const [selectedSubObservations, setSelectedSubObservations] = useState([])

  const fetchObservationMasterType = useCallback(async () => {
    if (observationList.length) return
    try {
      setObservationListLoader(true)
      const res = await getObservationMasterType({ params: {} })
      setObservationList(res?.data || [])
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

          if (res?.data?.result?.length) {
            setUserDetail(res?.data?.result[0])
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

  // Main API call function
  const getBiologistReport = async (search = '') => {
    const childObservationIds = selectedSubObservations
      .map(item => item?.id)
      .filter(item => item !== undefined && item !== null && item !== '')
    setLoading(true)

    const params = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      user_id: userDetail?.user_id || router.query.user_id,
      page_no: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      report_type: 'json',
      type: 'biologist',
      ...(search && { q: search }),
      ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id }),
      ...(childObservationIds.length && { child_observation_ids: childObservationIds })
    }

    try {
      const response = await getDiaryReportList(params)
      if (response?.success) {
        setBiologistList(response?.data?.observationData)
        setTotal(response?.data?.total)
      } else {
        console.log('error >>')
      }
    } catch (error) {
      console.error('Error fetching biologist report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (startDate, endDate) => {
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
    debounce(q => {
      setPaginationModel({ page: 0, pageSize: 10 }) // reset page on search
    }, 800),
    []
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value) // Update input immediately for UI responsiveness

    // Call debounced API function
    debouncedGetBiologistReport(value)
  }

  // // Effect for initial load and when dependencies change (except search)
  useEffect(() => {
    if (userDetail?.user_id) {
      getBiologistReport(searchValue)
    }
  }, [userDetail, filterDates, paginationModel])

  const clearUserSelection = () => {
    setUserDetail(null)

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

  const UserSelectionCard = ({ user }) => {
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
          <Avatar src={user?.user_profile_pic} sx={{ width: 56, height: 56 }} />
          <Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {user?.user_name || '-'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                {user?.role_name || '-'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* <Box
          sx={{
            backgroundColor: '#e6f0ee',
            height: '98px',
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

  const handleDownloadReport = async () => {
    const params = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      user_id: userDetail?.user_id || router.query.user_id,
      report_type: 'pdf',
      type: 'biologist',
      ...(searchValue && { q: searchValue })
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

  const columns = [
    {
      minWidth: 80,
      field: 'id',
      headerName: 'SL.NO',
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
      minWidth: 180,
      field: 'animal_name',
      headerName: 'Entity',
      minWidth: 400,
      sortable: false,
      renderCell: params => <AnimalView data={params.row} />
    },
    {
      minWidth: 250,
      field: 'observation',
      headerName: 'OBSERVATION',
      sortable: false,
      renderCell: params => <ObservationView data={params.row} />
    },
    {
      minWidth: 350,
      field: 'details',
      headerName: 'DETAILS',
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
                WebkitLineClamp: 3, // Max 4 lines
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                lineHeight: '2rem',
                maxHeight: 'rem' // 4 lines * 1.5rem line-height
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
      Biologist's Diary Report
    </Typography>
  )

  const getSlNo = index => {
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
                // disabled={isEdit || incubatorDetail}
                id='nursery'
                loading={observationListLoader}
                options={observationList?.length > 0 ? observationList : []}
                getOptionLabel={option => option.type_name}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={(e, val) => {
                  setDefaultObservationType(val ?? null)
                  const options = Array.isArray(val?.child_observation) ? val.child_observation : []

                  const normalized = options
                    .map(item => ({
                      id: String(item?.id ?? item?.value ?? item?.key ?? item?.type_name ?? ''),
                      type_name: item?.type_name || item?.name || item?.label || item?.key || ''
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
              onRowClick={''}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={''}
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
            subtitle='No Biologist selected'
            description='Select any biologist to view report'
            buttonText='SELECT BIOLOGIST'
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
          footerText='generate biologist Diary REPORT'
        />
      )}
    </>
  )
}

export default enforceModuleAccess(BiologistDiaryReport, 'compliance_module')
