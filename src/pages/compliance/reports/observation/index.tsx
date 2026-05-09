import { useTheme } from '@mui/material/styles'
import {
  Autocomplete,
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
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { getObservationMasterType, getObservationReport } from 'src/lib/api/compliance/reports'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import Utility, { downloadPDF } from 'src/utility'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import ObservationCard from 'src/views/utility/ObservationCard'
import Search from 'src/views/utility/Search'
import { GridColDef } from '@mui/x-data-grid'

type EmotionTheme = {
  palette: {
    customColors: Record<string, string>
    primary: { main: string }
  }
}

interface SelectedAnimal {
  animal_id: string
  default_common_name: string
  scientific_name?: string
  user_enclosure_name?: string
  section_name?: string
  site_name?: string
  type?: string
  sex?: string
  default_icon?: string
  total_animal?: number
  local_identifier_name?: string
  local_identifier_value?: string
  [key: string]: unknown
}

interface ObservationOption {
  id: string
  type_name: string
  child_observation?: unknown[]
}

const ObservationReport = () => {
  const theme = useTheme()
  const router = useRouter()

  const handleAnimalSelect = (animal: any) => {
    setSelectedAnimal({
      animal_id: animal?.animal_id as string,
      default_common_name: animal?.default_common_name as string,
      scientific_name: (animal?.scientific_name ?? animal?.complete_name) as string | undefined,
      user_enclosure_name: animal?.user_enclosure_name as string | undefined,
      section_name: animal?.section_name as string | undefined,
      site_name: animal?.site_name as string | undefined,
      type: animal?.type as string | undefined,
      sex: animal?.sex as string | undefined,
      default_icon: animal?.default_icon as string | undefined,
      total_animal: animal?.total_animal as number | undefined,
      local_identifier_name: animal?.local_identifier_name as string | undefined,
      local_identifier_value: animal?.local_identifier_value as string | undefined
    })
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, animal_id: animal?.animal_id as string }
      },
      undefined,
      { shallow: true }
    )
  }

  const [animalDrawer, setAnimalDrawer] = useState<boolean>(false)
  const [selectedAnimal, setSelectedAnimal] = useState<SelectedAnimal | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>((router.query.q as string) || '')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [animalLoader, setAnimalLoader] = useState<boolean>(false)

  const [filterDates, setFilterDates] = useState<{ startDate: string; endDate: string }>({
    startDate:
      (router.query.startDate as string) || Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: (router.query.endDate as string) || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: parseInt((router.query.page as string) || '0') || 0,
    pageSize: parseInt((router.query.limit as string) || '50') || 50
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
      setObservationList((res?.data as any) || [])
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
    if (router.query.animal_id && !selectedAnimal) {
      const fetchAnimal = async () => {
        setAnimalLoader(true)
        try {
          const res = await getAnimalDetailsOverview({
            animal_id: router.query.animal_id as any
          })

          if (res?.success) {
            const details = res?.data?.animal_details as any
            setSelectedAnimal({
              animal_id: details?.animal_id,
              default_common_name: details?.common_name,
              scientific_name: details?.scientific_name ?? details?.complete_name,
              user_enclosure_name: details?.user_enclosure_name,
              section_name: details?.section_name,
              site_name: details?.site_name,
              type: details?.type,
              sex: details?.sex,
              default_icon: details?.default_icon,
              total_animal: details?.total_animal,
              local_identifier_name: details?.local_identifier_name,
              local_identifier_value: details?.local_identifier_value
            })
            setAnimalLoader(false)
          }
        } catch (err) {
          console.error('Error fetching user by id:', err)
        }
      }

      fetchAnimal()
    }
  }, [router.query.animal_id])

  const reportCardEventHandler = () => {
    setAnimalDrawer(!animalDrawer)
  }

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Observation Report
    </Typography>
  )

  const fetchObservationReport = useCallback(
    async (q = '') => {
      const childObservationIds = selectedSubObservations
        .map(item => item?.id)
        .filter(item => item !== undefined && item !== null && item !== '')
      setLoading(true)
      try {
        setLoading(true)

        const params = {
          animal_id: selectedAnimal?.animal_id || (router.query.animal_id as string),
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          report_type: 'json',
          ...(q && { q }),
          ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id }),
          ...(childObservationIds.length && { child_observation_ids: childObservationIds })
        }

        await getObservationReport(params).then(res => {
          const resData = res?.data as any
          if (res?.success === true) {
            setTotal(parseInt(String(resData?.total || 0)))
            setRows(resData?.observationData || resData?.records || [])
          } else {
            setTotal(parseInt(String(resData?.total || 0)))
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [
      filterDates,
      selectedAnimal?.animal_id,
      paginationModel.page,
      paginationModel.pageSize,
      defaultObservationType?.id,
      selectedSubObservations
    ]
  )

  const debouncedGetObservationReport = useMemo(
    () =>
      debounce((search: string) => {
        fetchObservationReport(search)
      }, 500),
    [fetchObservationReport]
  )

  useEffect(() => {
    if (selectedAnimal) {
      fetchObservationReport(searchValue)
    }
  }, [selectedAnimal, filterDates, paginationModel.page, paginationModel.pageSize, fetchObservationReport])

  useEffect(() => {
    return () => {
      debouncedGetObservationReport.cancel()
    }
  }, [debouncedGetObservationReport])

  const getSlNo = (index: number) => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: (row.id as number | string) || index,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef[] = [
    {
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            {parseInt(params.row.sl_no as string) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'date',
      headerName: 'DATE',
      sortable: false,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatDisplayDate(Utility.convertUTCToLocalDate(params.row.date_time as string))}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 300,
      field: 'master_enrichment_type',
      headerName: 'Observation Type',
      sortable: false,
      renderCell: params => (
        <>
          <ObservationCard
            title={params.row.master_enrichment_type}
            description={params.row.child_enrichment_type}
            dateTime={undefined}
            containerStyle={{ my: 4 }}
          />
        </>
      )
    },
    {
      minWidth: 20,
      width: 350,
      field: 'details',
      headerName: 'Details',
      sortable: false,
      renderCell: params => (
        <>
          <Tooltip title={(params.row.details as string) || ''} arrow placement='bottom'>
            <Typography
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
              {params.row.details as string}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      minWidth: 250,
      field: 'reported_by',
      sortable: false,
      headerName: 'Reported By ',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              {params?.row?.reported_by as string}
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              {Utility.convertUTCToLocaltime(params?.row?.date_time as string)}
            </Typography>
          </Box>
        </>
      )
    }
  ]

  const handleDateRangeChange = (startDate: string, endDate: string) => {
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

  const downloadObservationReport = async () => {
    const childObservationIds = selectedSubObservations
      .map(item => item?.id)
      .filter(item => item !== undefined && item !== null && item !== '')

    const params = {
      animal_id: selectedAnimal?.animal_id || (router.query.animal_id as string),
      q: searchValue,
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id }),
      ...(childObservationIds.length && { child_observation_ids: childObservationIds }),
      report_type: 'pdf'
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getObservationReport,
        params,
        fileName: `Observation_report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const clearAnimalSelection = () => {
    setSelectedAnimal(null)

    const { animal_id: _animal_id, ...rest } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: rest
      },
      undefined,
      { shallow: false }
    )
  }

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadObservationReport} />
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
        <IconButton onClick={clearAnimalSelection}>
          <Icon icon='mdi:close' color='red' fontSize={24} />
        </IconButton>
      </Box>
    </Box>
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }

    debouncedGetObservationReport(value)
  }

  return (
    <>
      {selectedAnimal ? (
        <>
          <Card>
            <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
            <Box sx={{ p: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  background: '#E8F4F2',
                  p: '16px'
                }}
              >
                <AnimalCard data={selectedAnimal} sx={{ border: 'none', background: 'none' }} animal={true} />
              </Box>
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
                onChange={handleSearchChange}
                placeholder='Search by date or observation type'
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
                <Autocomplete<ObservationOption, false, false, false>
                  value={defaultObservationType}
                  disablePortal
                  id='nursery'
                  loading={observationListLoader}
                  options={observationList?.length > 0 ? observationList : []}
                  getOptionLabel={(option: ObservationOption) => option.type_name}
                  isOptionEqualToValue={(option: ObservationOption, value: ObservationOption) =>
                    option?.id === value?.id
                  }
                  onChange={(e, val) => {
                    setDefaultObservationType(val ?? null)
                    const options = Array.isArray(val?.child_observation) ? val.child_observation : []

                    const normalized: ObservationOption[] = options
                      .map((item: unknown) => {
                        const itemObj = item as Record<string, unknown>

                        return {
                          id: String(
                            itemObj?.id ?? itemObj?.value ?? itemObj?.key ?? itemObj?.type_name ?? ''
                          ),
                          type_name: String(
                            itemObj?.type_name || itemObj?.name || itemObj?.label || itemObj?.key || ''
                          )
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
                      {...params}
                      label='Observation Type'
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

                <Autocomplete<ObservationOption, true, false, false>
                  multiple
                  value={selectedSubObservations}
                  disablePortal
                  disableCloseOnSelect
                  id='sub-observation-type'
                  loading={observationListLoader}
                  options={subObservationOptions}
                  getOptionLabel={(option: ObservationOption) => option.type_name}
                  isOptionEqualToValue={(option: ObservationOption, value: ObservationOption) =>
                    option?.id === value?.id
                  }
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
                  renderTags={(value: ObservationOption[]) => {
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
                columns={columns}
                indexedRows={indexedRows}
                loading={loading}
                total={total}
                getRowHeight={() => 'auto'}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                searchValue={searchValue}
                onPaginationModelChange={(model: { page: number; pageSize: number }) => {
                  setPaginationModel(model)
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      page: model.page + 1,
                      pageSize: model.pageSize,
                      searchValue
                    }
                  })
                }}
              />
            </Grid>
          </Card>
        </>
      ) : animalLoader ? (
        <Box display='flex' justifyContent='center' alignItems='center'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card sx={{ p: 6 }}>
            <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
            <ReportCard
              subtitle='No Animal Selected'
              description='Select any animal to view its observation report'
              buttonText='SELECT ANIMAL'
              addHandler={reportCardEventHandler}
            />
          </Card>
        </>
      )}

      {animalDrawer && (
        <AnimalDrawer
          open={animalDrawer}
          onClose={() => setAnimalDrawer(false)}
          handleAnimalClick={handleAnimalSelect as any}
          type='all'
        />
      )}
    </>
  )
}

export default enforceModuleAccess(ObservationReport, 'compliance_module')
