'use client'

import { FC, useCallback, useContext, useEffect, useState } from 'react'
import { Autocomplete, Avatar, debounce, FormControl, Grid, TextField, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'

import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { AuthContext } from 'src/context/AuthContext'
import { getSiteList, getTransferList } from 'src/lib/api/egg/dashboard'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import Utility from 'src/utility'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { SpeciesImageCard } from 'src/components/egg/imageTextCard'
import { useTranslation } from 'react-i18next'

const TransferDetails: FC = () => {
  const authData = useContext(AuthContext)
  const theme = useTheme()
  const { t } = useTranslation()
  const [transferList, setTransferList] = useState<any[]>([])

  const [loading, setLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)
  const [searchValue, setSearchValue] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState<any>({ page: 0, pageSize: 10 })

  const [fromDate, setFromDate] = useState<any>(null)
  const [tillDate, setTilDate] = useState<any>(null)

  const [fromSiteList, setFromSiteList] = useState<any[]>([])
  const [toSiteList, setToSiteList] = useState<any[]>([])
  const [defaultFromSite, setDefaultFromSite] = useState<any>(null)
  const [defaultToSite, setDefaultToSite] = useState<any>(null)
  const [nurseryList, setNurseryList] = useState<any[]>([])
  const [defaultNursery, setDefaultNursery] = useState<any>(null)

  const NurseryList = async (q?: string): Promise<void> => {
    try {
      const params = {
        search: q,
        page: 1,
        limit: 50
      }
      await GetNurseryList({ params: params }).then((res: any) => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.error(e)
    }
  }

  const FromSiteList = async (q?: string): Promise<void> => {
    try {
      const params = {
        type: 'site',
        page_no: 1,
        q
      }
      await getSiteList(params).then((res: any) => {
        setFromSiteList(res?.data?.data?.result)
      })
    } catch (e) {
      console.error(e)
    }
  }

  const ToSiteList = async (q?: string): Promise<void> => {
    try {
      const params = {
        type: 'site',
        page_no: 1,
        q
      }
      await getSiteList(params).then((res: any) => {
        setToSiteList(res?.data?.data?.result)
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    NurseryList()
    FromSiteList()
    ToSiteList()
  }, [])

  const searchFromSite = useCallback(
    debounce(async (q: string) => {
      try {
        await FromSiteList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const searchToSite = useCallback(
    debounce(async (q: string) => {
      try {
        await ToSiteList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const searchNursery = useCallback(
    debounce(async (q: string) => {
      try {
        await NurseryList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const columns = [
    {
      width: 80,
      field: 'uid',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      renderCell: (params: any) => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 240,
      field: 'egg_number',
      sortable: false,
      headerName: t('egg_module.egg_number'),
      renderCell: (params: any) => (
        <SpeciesImageCard
          imgURl={params.row.default_icon}
          eggCondition={params.row.egg_condition}
          eggCode={params.row.egg_code}
          egg_status={params.row.egg_status}
          eggIcon={'/icons/Egg_icon.png'}
        />
      )
    },
    {
      width: 200,
      field: 'assigned_status',
      headerName: t('status'),
      sortable: false,
      renderCell: (params: any) => (
        <Tooltip title={params.row.assigned_status ? Utility?.toPascalSentenceCase(params.row.assigned_status) : '-'}>
          <Typography
            sx={{
              lineHeight: '16.94px',
              letterSpacing: '0.1px',
              color:
                params.row.assigned_status === 'COMPLETED'
                  ? theme.palette.primary.main
                  : params.row.assigned_status === 'CANCELLED'
                    ? '#fa6140'
                    : '#00AFD6',
              fontSize: '14px',
              fontWeight: '500',
              p: '4px 8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',

              backgroundColor:
                params.row.assigned_status === 'COMPLETED'
                  ? '#E1F9ED'
                  : params.row.assigned_status === 'CANCELLED'
                    ? '#FA61401A'
                    : '#AFEFEB80',
              textAlign: 'center',
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            {params.row.assigned_status ? Utility?.toPascalSentenceCase(params.row.assigned_status) : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 250,
      sortable: false,
      field: 'species',
      headerName: t('navigation.species'),
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.default_icon ? (
              <img style={{ width: '100%', height: '100%' }} src={params.row.default_icon} alt='Profile' />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Tooltip title={params.row.complete_name ? Utility?.toPascalSentenceCase(params.row.complete_name) : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '160px'
                }}
              >
                {params.row.complete_name ? Utility?.toPascalSentenceCase(params.row.complete_name) : '-'}
              </Typography>
            </Tooltip>
            <Tooltip
              title={
                params.row?.default_common_name ? Utility?.toPascalSentenceCase(params.row.default_common_name) : '-'
              }
            >
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '160px'
                }}
              >
                {params.row?.default_common_name ? Utility?.toPascalSentenceCase(params.row.default_common_name) : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      width: 170,
      field: 'from_site_name',
      sortable: false,
      headerName: t('egg_module.transformed_from'),
      renderCell: (params: any) => (
        <Tooltip title={params.row.from_site_name ? params.row.from_site_name : '-'}>
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '80%'
            }}
          >
            {params.row.from_site_name ? params.row.from_site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },

    {
      width: 140,
      sortable: false,
      field: 'transfered_on',
      headerName: t('date'),
      renderCell: (params: any) => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.transfered_on
            ? moment(moment.utc(params.row.transfered_on).toDate().toLocaleString()).format('DD MMM YYYY')
            : '-'}
        </Typography>
      )
    },

    {
      width: 140,
      sortable: false,
      field: 'to_site_name',
      headerName: t('egg_module.receiving_at'),
      renderCell: (params: any) => (
        <Tooltip title={params.row.to_site_name ? params.row.to_site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '80%'
            }}
          >
            {params.row.to_site_name ? params.row.to_site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },

    {
      width: 140,
      sortable: false,
      field: 'created_at',
      headerName: t('date'),
      renderCell: (params: any) => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.created_at
            ? moment(moment.utc(params.row.created_at).toDate().toLocaleString()).format('DD MMM YYYY')
            : '-'}
        </Typography>
      )
    },

    {
      width: 160,
      sortable: false,
      field: 'nursery_name',
      headerName: t('navigation.nursery'),
      renderCell: (params: any) => (
        <Tooltip title={params.row?.nursery_name ? Utility?.toPascalSentenceCase(params.row.nursery_name) : '-'}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '16.94px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '110px'
            }}
          >
            {params.row.nursery_name ? Utility?.toPascalSentenceCase(params.row.nursery_name) : '-'}
          </Typography>
        </Tooltip>
      )
    }
  ]

  function loadServerRows(currentPage: number, data: any[]): any[] {
    return data
  }

  const handleChange = (event: any, newValue: any): void => {
    setTotal(0)
  }

  const getTransferListFunc = useCallback(
    async (q?: string, fDate?: any, tDate?: any, fromSiteId?: string, toSiteId?: string, nurseryId?: string): Promise<void> => {
      try {
        setLoading(true)

        const params = {
          egg_code: q,
          from_date: fDate,
          til_date: tDate,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          from_site_id: fromSiteId || defaultFromSite?.site_id,
          to_site_id: toSiteId || defaultToSite?.site_id,
          nursery_id: nurseryId || defaultNursery?.nursery_id
        }

        await getTransferList(params).then((res: any) => {
          if (res?.data?.success) {
            let listWithId = res?.data?.data?.result?.map((el: any, i: number) => {
              return { ...el, id: i + 1 }
            })
            setTotal(parseInt(res?.data?.data?.total_count))
            setTransferList(loadServerRows(paginationModel.page, listWithId))
            setLoading(false)
          } else {
            setLoading(false)
            setTransferList([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.error(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const searchTableData = useCallback(
    debounce(async (q: string, fDate: any, tDate: any, fromSiteId?: string, toSiteId?: string, nurseryId?: string): Promise<void> => {
      setSearchValue(q)
      try {
        await getTransferListFunc(q, fDate, tDate, fromSiteId, toSiteId, nurseryId)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    getTransferListFunc(
      searchValue,
      fromDate,
      tillDate,
      defaultFromSite?.site_id,
      defaultToSite?.site_id,
      defaultNursery?.nursery_id
    )
  }, [getTransferListFunc])

  const getSlNo = (index: number): number => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = transferList?.map((row: any, index: any) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = (newModel: any): void => { }

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        padding: '24px',
        paddingBottom: '0px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0px 2px 10px 0px #4C4E6438',
        borderRadius: '10px'
      }}
    >
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '24px',
          lineHeight: '29.05px',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        {t('egg_module.transfer_details')}
      </Typography>
      <Grid container columns={15} spacing={6}>
        <Grid size={{ xs: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #C3CEC7',
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px'
            }}
          >
            <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
            <TextField
              variant='outlined'
              placeholder='Search'
              onChange={(e: any) =>
                searchTableData(
                  e.target.value,
                  fromDate,
                  tillDate,
                  defaultFromSite?.site_id,
                  defaultToSite?.site_id,
                  defaultNursery?.nursery_id
                )
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
              slotProps={{
                input: {}
              }}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 5 }}>
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  width: '100%',
                  '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: '4px'
                  },
                  '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                value={fromDate}
                onChange={(newDate: any) => {
                  if (newDate) {
                    const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
                    setFromDate(moment(newDate.toISOString()).format('YYYY-MM-DD'))
                    getTransferListFunc(
                      searchValue,
                      formattedDate,
                      tillDate,
                      defaultFromSite?.site_id,
                      defaultToSite?.site_id,
                      defaultNursery?.nursery_id
                    )
                  }
                }}
                label={'From Date'}
                maxDate={dayjs()}
              />
            </LocalizationProvider>
            <Typography
              sx={{
                color: '#839D8D',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '16.94px'
              }}
            >
              To
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  width: '100%',
                  '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': { height: '40px', borderRadius: '4px' },
                  '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                value={tillDate}
                onChange={(newDate: any) => {
                  if (newDate) {
                    const formattedDate = moment(newDate.toISOString()).format('YYYY-MM-DD')
                    setTilDate(moment(newDate.toISOString()).format('YYYY-MM-DD'))
                    getTransferListFunc(
                      searchValue,
                      fromDate,
                      formattedDate,
                      defaultFromSite?.site_id,
                      defaultToSite?.site_id,
                      defaultNursery?.nursery_id
                    )
                  }
                }}
                label={'Till Date'}
                maxDate={dayjs()}
              />
            </LocalizationProvider>
          </Box>
        </Grid>
        <Grid size={{ xs: 3 }}>
          <FormControl fullWidth>
            <Autocomplete
              value={defaultFromSite}
              disablePortal
              id='fromSite'
              sx={{
                '& .css-jthw9v-MuiAutocomplete-root .MuiOutlinedInput-root': {
                  height: '40px',
                  borderRadius: '4px'
                },
                '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
              }}
              options={fromSiteList}
              getOptionLabel={(option: any) => option.site_name}
              isOptionEqualToValue={(option: any, value: any) => option?.site_id === value?.site_id}
              onChange={(e: any, val: any) => {
                if (val === null) {
                  setDefaultFromSite(null)
                  getTransferListFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    '',
                    defaultToSite?.site_id,
                    defaultNursery?.nursery_id
                  )
                } else {
                  setDefaultFromSite(val)
                  getTransferListFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    val?.site_id,
                    defaultToSite?.site_id,
                    defaultNursery?.nursery_id
                  )
                }
              }}
              renderInput={(params: any) => (
                <TextField
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
                    '& .css-vh4m6j-MuiInputBase-root-MuiOutlinedInput-root': {
                      height: '40px',
                      borderRadius: '4px'
                    },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                    '& input': {
                      position: 'relative',
                      top: -7
                    }
                  }}
                  onChange={(e: any) => {
                    searchFromSite(e.target.value)
                  }}
                  {...params}
                  label='From Site'
                  placeholder='Search'
                />
              )}
            />
          </FormControl>
        </Grid>
        <Grid size={{ xs: 3 }}>
          <FormControl fullWidth>
            <Autocomplete
              value={defaultToSite}
              disablePortal
              id='toSite'
              options={toSiteList?.length > 0 ? toSiteList : []}
              getOptionLabel={(option: any) => option.site_name}
              isOptionEqualToValue={(option: any, value: any) => option?.site_id === value?.site_id}
              onChange={(e: any, val: any) => {
                if (val === null) {
                  setDefaultToSite(null)
                  getTransferListFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    defaultFromSite?.site_id,
                    '',
                    defaultNursery?.nursery_id
                  )
                } else {
                  setDefaultToSite(val)
                  getTransferListFunc(
                    searchValue,
                    fromDate,
                    tillDate,
                    defaultFromSite?.site_id,
                    val?.site_id,
                    defaultNursery?.nursery_id
                  )
                }
              }}
              renderInput={(params: any) => (
                <TextField
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    width: '100%',
                    '& .css-vh4m6j-MuiInputBase-root-MuiOutlinedInput-root': {
                      height: '40px',
                      borderRadius: '4px'
                    },
                    '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                    '& input': {
                      position: 'relative',
                      top: -7
                    }
                  }}
                  onChange={(e: any) => {
                    searchToSite(e.target.value)
                  }}
                  {...params}
                  label='Receiving Site'
                  placeholder='Search & Select'
                />
              )}
            />
          </FormControl>
        </Grid>
      </Grid>
      <CommonTable
        externalTableStyle={{
          '.MuiDataGrid-cell:focus': {
            outline: 'none'
          },
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer'
          },
          '& .MuiDataGrid-row:hover .customButton': {
            display: 'block'
          },
          '& .MuiDataGrid-row:hover .hideField': {
            display: 'none'
          },
          '& .MuiDataGrid-row .customButton': {
            display: 'none'
          },
          '& .MuiDataGrid-row .hideField': {
            display: 'block'
          },
          '& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeaderCheckbox)': {
            paddingLeft: 2.5
          },
          '& .css-1fdlktf-MuiDataGrid-columnHeaders': {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0
          }
        }}
        columnVisibilityModel={{
          sl_no: false
        }}
        indexedRows={indexedRows === undefined ? [] : indexedRows}
        total={total}
        rowHeight={72}
        columns={columns as any}
        paginationModel={paginationModel}
        handleSortModel={handleSortModel}
        setPaginationModel={setPaginationModel}
        loading={loading}
      />
    </Box>
  )
}

export default TransferDetails
