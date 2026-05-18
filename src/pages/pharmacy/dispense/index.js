import { Grid, Typography, debounce } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useRef } from 'react'

// ** Icon Imports
import { getDispenseList } from 'src/lib/api/pharmacy/dispenseProduct'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useTheme } from '@emotion/react'
import { AddButtonContained } from 'src/components/ButtonContained'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
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
    pageSize: parseInt(router.query.limit) || 50
  })

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      minWidth: 100,
      field: 'sl',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      minWidth: 140,
      flex: 0.2,
      field: 'dispense_id',
      headerName: 'Dispense Id',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
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
      minWidth: 160,
      flex: 0.2,
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
            fontWeight: 500
          }}
        >
          {params.row.animal_count ? params.row.animal_count : 0}
        </Typography>
      )
    },
    {
      minWidth: 200,
      flex: 0.2,
      field: 'created_at',
      headerName: 'Dispensed Date',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))} -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.created_at))}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 200,
      field: 'user_name',
      headerName: 'Dispensed to',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.profile_pic}
            user_name={
              params?.row?.user_first_name ||
              (params?.row?.user_last_name &&
                `${params?.row?.user_first_name || ''} ${params?.row?.user_last_name || ''}`.trim())
            }
          />
        </>
      )
    },
    {
      flex: 0.2,
      minWidth: 180,
      field: 'created_by',
      headerName: 'Created by ',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
      )
    },
    {
      flex: 0.2,
      minWidth: 200,
      field: 'ep_number',
      headerName: 'User Name & EP No',
      renderCell: params => (
        <>
          <UserAvatarDetails user_name={params?.row?.dispense_user_name} role={`EP No: ${params?.row?.ep_number}`} />
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
      setPaginationModel({ page: 0, pageSize: 50 })
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
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field

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
            styles={{
              mr: 0
            }}
          />
        </Grid>
      )}
    </div>
  )

  return (
    <>
      {selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.dispense_medicine ? (
        <PageCardLayout title='Dispense' action={headerAction}>
          <Grid
            container
            spacing={4}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Grid size={{ xs: 12, sm: 4, md: 3, xl: 2.5 }}>
              <MUISearch
                width={'100%'}
                placeholder='Search...'
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                fullWidth
                onClear={() => handleSearch('')}
              />
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

          <Grid>
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
        </PageCardLayout>
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default Dispense
