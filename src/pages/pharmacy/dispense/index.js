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

function Dispense() {
  const router = useRouter()

  const isInitialLoad = useRef(true)
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  // const [searchValue, setSearchValue] = useState('')
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'dispense_id')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: parseInt(router.query.pageSize, 10) || 10
  })

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'sl',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      flex: 0.2,
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
    {
      flex: 0.2,
      minWidth: 20,
      field: 'user_name',
      headerName: 'User Name',
      renderCell: params => (
        <>
          <Avatar
            sx={{
              '& > img': {
                objectFit: 'contain'
              },
              width: 30,
              height: 30,
              mr: 4
            }}
            variant='circular'
            alt={params?.row?.profile_pic}
            src={params?.row?.profile_pic}
          />
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params.row.user_name}
          </Typography>
        </>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'created_at',
      headerName: 'created At',
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
      flex: 0.2,
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
    }
  ]

  const getDipsense = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort, // Ensure 'sort' is either 'asc' or 'desc'
          q, // Search query
          column, // Column to sort by
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

  // useEffect(() => {
  //   getDipsense({ sort, q: searchValue, column: sortColumn })
  // }, [getDipsense, selectedPharmacy.id])

  // useEffect(() => {
  //   if (searchTerm) {
  //     debugger
  //     setSearchValue(searchTerm)
  //     getDipsense({ sort, q: searchTerm, column: sortColumn })
  //   }
  // }, [searchTerm, getDipsense])

  // useEffect(() => {
  //   if (isInitialLoad.current && searchTerm) {
  //     setSearchValue(searchTerm)
  //     getDipsense({ sort, q: searchTerm, column: sortColumn })
  //     isInitialLoad.current = false
  //   }
  // }, [searchTerm, getDipsense])

  useEffect(() => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query, // Preserve existing query parameters
        searchValue,
        page: paginationModel.page + 1, // Convert back to 1-indexed
        pageSize: paginationModel.pageSize
      }
    })
  }, [paginationModel.page, paginationModel.pageSize])

  // Fetch data when the selected pharmacy changes
  useEffect(() => {
    getDipsense({ sort, q: searchValue, column: sortColumn })
  }, [getDipsense, selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.id}`,
    sl_no: getSlNo(index)
  }))

  // const handleSearch = useCallback(
  //   debounce(async value => {
  //     setSearchValue(value)
  //     try {
  //       await getDipsense({ sort, q: value, column: sortColumn })
  //     } catch (error) {
  //       console.error(error)
  //     }
  //   }, 500),
  //   []
  // )

  const handleSearch = useCallback(
    debounce(value => {
      setSearchValue(value)

      // Reset the page to the first page (page 0 in your `paginationModel`)
      setPaginationModel(prevModel => ({
        ...prevModel,
        page: 0
      }))

      // Update the URL query parameters
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          searchValue: value
          // page: 1, // Update to 1-indexed for the URL
        }
      })
    }, 500),
    [router]
  )

  const handleSortModel = newModel => {

    if (newModel.length) {
      const newSort = newModel[0].sort // This will give 'asc' or 'desc'
      const newColumn = newModel[0].field // This is the field by which you're sorting

      setSort(newSort)
      setSortColumn(newColumn)

      // Update the router query with the current sort and column
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            sort: newSort, // Ensure 'sort' is either 'asc' or 'desc'
            column: newColumn // Ensure the column being sorted is also passed
          }
        },
        undefined,
        { shallow: true } // Avoid full page reload
      )

      // Pass the updated sort, search value, and column to the getDipsense function
      getDipsense({ sort: newSort, q: searchValue, column: newColumn })
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

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>Dispense</Typography>
    </>
  )

  return (
    <>
      {selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.dispense_medicine ? (
        <Card>
          <Grid
            container
            sm={12}
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Grid sx={{ mx: 1.4 }} item>
              <CardHeader title={title} />
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                {/* Left Box (Search Field) */}
                <Grid item xs={8}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #C3CEC7',
                      borderRadius: '8px',
                      padding: '0 8px',
                      ml: 5,
                      height: '40px',
                      width: '250px' // Set a fixed width for all status
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

                <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
                  {status === 'all' || status === 'completed' ? (
                    <Box sx={{ float: 'right', mt: 1 }}>
                      <FormControlLabel
                        control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                        label='Completed'
                        labelPlacement='end'
                      />
                    </Box>
                  ) : null}
                </Grid>
              </Box>
            </Grid>
            <Grid sx={{ mx: 5 }} item>
              {(selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
                selectedPharmacy.permission.dispense_medicine) && (
                <AddButtonContained
                  title='Add Dispense'
                  action={() => {
                    router.push('/pharmacy/dispense/add-dispense')
                  }}
                  sx={{
                    mr: 6
                  }}
                />
              )}
            </Grid>
          </Grid>
          <Grid
            sx={{
              mx: 4
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
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default Dispense
