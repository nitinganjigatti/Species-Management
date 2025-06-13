import {
  Avatar,
  Box,
  Card,
  CardHeader,
  Grid,
  TextField,
  Typography,
  debounce,
  FormControlLabel,
  Switch
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useRef } from 'react'

// ** Icon Imports
import { AddButton } from 'src/components/Buttons'
import { getDispenseList } from 'src/lib/api/pharmacy/dispenseProduct'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import moment from 'moment'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import CustomAvatar from 'src/@core/components/mui/avatar'

function Dispense() {
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const isInitialLoad = useRef(true)
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [filterSwitch, setFilterSwitch] = useState(false)

  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'dispense_id')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      // flex: 0.1,
      Width: 100,
      field: 'sl',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      width: 180,
      minWidth: 20,
      field: 'dispense_id',
      headerName: 'Dispense Id',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.dispense_id}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'user_name',
    //   headerName: 'User Name',
    //   renderCell: params => (
    //     <>
    //       {/* {RenderUtility?.renderUserAvatarDetails(
    //         params?.row?.profile_pic,
    //         params?.row?.user_name,

    //       )} */}
    //       <Avatar
    //         sx={{
    //           '& > img': {
    //             objectFit: 'contain'
    //           },
    //           width: 30,
    //           height: 30,
    //           mr: 4
    //         }}
    //         variant='circular'
    //         alt={params?.row?.profile_pic}
    //         src={params?.row?.profile_pic}
    //       />
    //       <Typography
    //         variant='body2'
    //         sx={{
    //           color: theme.palette.customColors.customHeadingTextColor,
    //           fontSize: '14px',
    //           fontWeight: 500,
    //           fontFamily: 'Inter'
    //         }}
    //       >
    //         {params.row.user_name}
    //       </Typography>
    //     </>
    //   )
    // },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'created_at',
    //   headerName: 'created At',
    //   renderCell: params => (
    //     <Typography
    //       variant='body2'
    //       sx={{
    //         color: theme.palette.customColors.customHeadingTextColor,
    //         fontSize: '14px',
    //         fontWeight: 500,
    //         fontFamily: 'Inter'
    //       }}
    //     >
    //       {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))} -{' '}
    //       {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.created_at))}
    //     </Typography>
    //   )
    // },
    {
      width: 180,
      minWidth: 20,
      field: 'animal_count',
      type: 'number',
      align: 'left',
      headerAlign: 'left',
      headerName: 'Animal Count',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.animal_count ? params.row.animal_count : 0}
        </Typography>
      )
    },
    {
      width: 270,
      minWidth: 30,
      field: 'created_at',
      headerName: 'Dispensed Date',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))} -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.created_at))}
        </Typography>
      )
    },
    {
      width: 220,
      minWidth: 220,
      field: 'user_name',
      headerName: 'Dispensed to',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {params?.row?.profile_pic ? (
              <CustomAvatar src={params?.row?.profile_pic} sx={{ mr: '16px', width: '40px', height: '40px' }} />
            ) : (
              <CustomAvatar sx={{ mr: '16px', width: '40px', height: '40px', fontSize: '.8rem' }}></CustomAvatar>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
                {`${params?.row?.user_first_name} ${params?.row?.user_last_name}` || 'NA'}
              </Typography>
            </Box>
          </Box>
        </>
      )
    },
    {
      width: 220,
      minWidth: 100,
      field: 'created_by',
      headerName: 'Created by ',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_created_profile_pic,
            params?.row?.created_by_user_name,
            params?.row?.created_at
          )}
        </>
      )
    }
  ]

  const getDipsense = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        // Call the API to fetch data with the sorting and other params
        await getDispenseList({ params }).then(res => {
          if (res?.success) {
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))
          } else {
            setRows([])
            setTotal(0)
          }
        })

        setLoading(false)
      } catch (e) {
        setLoading(false)
        console.log(e)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    getDipsense({ sort, q: searchValue, column: sortColumn })

    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page,
      limit: paginationModel.pageSize
    })
  }, [selectedPharmacy.id, paginationModel.page, paginationModel.pageSize])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.id}`,
    sl_no: getSlNo(index)
  }))

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 10 })
      setSearchValue(q)
      try {
        await getDipsense({ sort, q, column })
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          page: paginationModel.page,
          limit: paginationModel.pageSize
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort // This will give 'asc' or 'desc'
      const newColumn = newModel[0].field // This is the field by which you're sorting

      setSort(newSort)
      setSortColumn(newColumn)

      getDipsense({ sort: newSort, q: searchValue, column: newColumn })
      updateUrlParams({
        sort: newSort,
        q: searchValue,
        column: newColumn,
        page: paginationModel.page,
        limit: paginationModel.pageSize
      })
    }
  }

  const onRowClick = params => {
    var data = params.row

    if (searchValue) {
      router.push({
        pathname: `/pharmacy/dispense/${data?.id}`
      })
    } else {
      router.push({
        pathname: `/pharmacy/dispense/${data?.id}`
      })
    }
  }

  const headerAction = (
    <div>
      {(selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
        selectedPharmacy.permission.key === 'ADD' ||
        selectedPharmacy.permission.dispense_medicine) && (
        <Grid item>
          <AddButtonContained
            title='Add Dispense'
            action={() => router.push('/pharmacy/dispense/add-dispense')}
            fullWidth={'fullWidth'}
          />
        </Grid>
      )}
    </div>
  )

  return (
    <>
      {selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.dispense_medicine ? (
        <Card>
          {/* Title and Button */}

          <CardHeader
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: { xs: 3, sm: 0 },
              '& .MuiCardHeader-action': {
                width: { xs: '100% ', sm: 'auto' }
              },
              mx: { xs: -1, sm: 0 },
              mt: 1,
              mb: 2
            }}
            title={RenderUtility.pageTitle('Dispense')}
            action={headerAction}
          />

          {/* Search and Switch Section */}
          <Grid
            container
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Search Field */}
            <Grid item size={{ xs: 12, sm: 8, md: 8 }} sx={{ mx: { xs: 3, md: 5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  padding: '0 8px',
                  height: '40px',
                  width: { xs: '100%', sm: '240px' }
                }}
              >
                <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                <TextField
                  variant='outlined'
                  value={searchValue}
                  placeholder='Search...'
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: 'none',
                      padding: '0',
                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>
            </Grid>

            {/* Switch */}
            {/* {status === 'all' || status === 'completed' ? (
              <Grid
                item
                size={{ xs: 12, sm: 'auto' }}
                sx={{ textAlign: { xs: 'center', sm: 'right' }, mt: { xs: 2, sm: 0 } }}
              >
                <FormControlLabel
                  control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                  label='Completed'
                  labelPlacement='end'
                />
              </Grid>
            ) : null} */}
          </Grid>

          {/* Table */}
          <Grid
            sx={{
              mx: { xs: 3, md: 5 }
            }}
          >
            <CommonTable
              onRowClick={onRowClick}
              indexedRows={indexedRows}
              total={total}
              handleSortModel={handleSortModel}
              columns={columns}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={searchValue}
            />
          </Grid>
        </Card>
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default Dispense
