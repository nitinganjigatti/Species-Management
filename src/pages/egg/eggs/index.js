import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Tab,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import Router from 'next/router'
import AllocationSlider from 'src/views/pages/egg/eggs/allocationSlider'

const tableDatas = [
  {
    id: 1,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 2,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 3,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 4,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 5,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 6,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 7,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 8,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 9,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  },
  {
    id: 10,
    species: {
      species_pic: '',
      species_name: 'Rainbow Lorikeet',
      species_desc: 'Trichoglossus Moluccanus'
    },
    egg_number: {
      egg_no: '0273 / 24',
      egg_status: 'intact'
    },
    site: 'Site Name XYZ',
    collected_on: '10/10/2023',
    batch_no: '2024/0001234/3A',
    eggs: 7,
    collected_by: {
      profile_pic: '',
      user_name: 'Jordan Stevenson',
      designantion: '10/10/2023'
    }
  }
]
const EggList = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState(tableDatas || [])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('1')
  const [hoveredRowIndex, setHoveredRowIndex] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      sortable: false,
      renderCell: params => (
        <Box onMouseEnter={() => setHoveredRowIndex(params.row.id)} onMouseLeave={() => setHoveredRowIndex(null)}>
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
        </Box>
      )
    },
    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Box
          sx={{ display: 'flex', alignItems: 'center' }}
          onMouseEnter={() => setHoveredRowIndex(params.row.id)}
          onMouseLeave={() => setHoveredRowIndex(null)}
        >
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.species?.species_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.species?.species_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.primary.light,
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '19.36px'
              }}
            >
              {params.row.species?.species_name ? params.row.species?.species_name : '-'}
            </Typography>
            <Tooltip title={params.row?.species?.species_desc ? params.row?.species?.species_desc : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '50%'
                }}
              >
                {params.row?.species?.species_desc ? params.row?.species?.species_desc : '-'}ghjkl bj bj bj bjbhj
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'egg_number',
      sortable: false,
      headerName: 'EGG NUMBER',
      renderCell: params => (
        <Box onMouseEnter={() => setHoveredRowIndex(params.row.id)} onMouseLeave={() => setHoveredRowIndex(null)}>
          <Typography
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '19.36px'
            }}
          >
            {params.row.egg_number?.egg_no ? params.row.egg_number?.egg_no : '-'}
          </Typography>{' '}
          <Typography
            sx={{
              color:
                params.row.egg_number?.egg_status === 'intact'
                  ? theme.palette.primary.main
                  : theme.palette.formContent.tertiary,
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '16.94px',
              backgroundColor: '#E1F9ED',
              p: '3px',
              textAlign: 'center',
              borderRadius: '4px'
            }}
          >
            {params.row.egg_number?.egg_status ? params.row.egg_number?.egg_status : '-'}
          </Typography>
        </Box>
      )
    },

    {
      flex: 0.35,
      minWidth: 20,
      sortable: false,
      field: 'site',
      headerName: 'SITE NAME',
      renderCell: params => (
        <Box onMouseEnter={() => setHoveredRowIndex(params.row.id)} onMouseLeave={() => setHoveredRowIndex(null)}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            {params.row.site ? params.row.site : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.24,
      minWidth: 20,
      sortable: false,
      field: 'collected_on',
      headerName: 'COLLECTED ON',
      renderCell: params => (
        <Box onMouseEnter={() => setHoveredRowIndex(params.row.id)} onMouseLeave={() => setHoveredRowIndex(null)}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            {params.row.collected_on ? moment(params.row.collected_on).format('DD/MM/YYYY') : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      sortable: false,
      field: 'batch_no',
      headerName: 'BATCH NO',
      renderCell: params => (
        <Box onMouseEnter={() => setHoveredRowIndex(params.row.id)} onMouseLeave={() => setHoveredRowIndex(null)}>
          {' '}
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            {params.row.batch_no ? params.row.batch_no : '-'}
          </Typography>
        </Box>
      )
    },

    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'collected_by',
      headerName: 'Collected By',
      renderCell: params => (
        <Box
          onMouseEnter={() => setHoveredRowIndex(params.row.id)}
          onMouseLeave={() => setHoveredRowIndex(null)}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {hoveredRowIndex === params.row.id ? (
            <Button variant='contained' onClick={event => handleAction(event)}>
              Allocate
            </Button>
          ) : (
            <>
              <Avatar
                variant='square'
                alt='Medicine Image'
                sx={{
                  width: 30,
                  height: 30,
                  mr: 4,
                  borderRadius: '50%',
                  background: '#E8F4F2',
                  overflow: 'hidden'
                }}
              >
                {params.row.collected_by?.profile_pic ? (
                  <img
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    src={params.row.collected_by?.profile_pic}
                    alt='Profile'
                  />
                ) : (
                  <Icon icon='mdi:user' />
                )}
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  noWrap
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px',
                    fontWeight: '500',
                    lineHeight: '16.94px'
                  }}
                >
                  {params.row.collected_by?.user_name ? params.row.collected_by?.user_name : '-'}
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontSize: '12px',
                    fontWeight: '400',
                    lineHeight: '14.52px'
                  }}
                >
                  {params.row?.collected_by?.designantion ? params.row?.collected_by?.designantion : '-'}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      )
    }
    // {
    //   flex: 0.24,
    //   minWidth: 20,
    //   sortable: false,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <Button
    //       variant='contained'
    //       onClick={e => {
    //         handleAction(e)
    //       }}
    //     >
    //       Allocate
    //     </Button>
    //   )
    // }
  ]

  const handleAction = event => {
    event.stopPropagation()
    setOpenDrawer(true)
  }

  const onCellClick = params => {
    if (hoveredRowIndex === params.row.id) {
      // Handle cell click only if the row is not being hovered
      console.log(params, 'params')
      // Here, you can add the logic to handle the row hover action
      // For example, you can navigate to a different page when a row is hovered
      Router.push({
        pathname: `/egg/eggs/${params.row.id}`
      })
    }
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  //   const fetchTableData = useCallback(
  //     async (sort, q, sortColumn, status) => {
  //       try {
  //         setLoading(true)

  //         const params = {
  //           sort,
  //           q,
  //           sortColumn,
  //           page: paginationModel.page + 1,
  //           limit: paginationModel.pageSize,
  //           status
  //         }

  //         await getIngredientList({ params: params }).then(res => {
  //           console.log('response', res)

  //           // Generate uid field based on the index
  //           let listWithId = res.data.result.map((el, i) => {
  //             return { ...el, uid: i + 1 }
  //           })
  //           setTotal(parseInt(res?.data?.total_count))
  //           setRows(loadServerRows(paginationModel.page, listWithId))

  //           // setstatusCheckval(res?.data?.result.map(all => all.active))
  //         })
  //         setLoading(false)
  //       } catch (e) {
  //         console.log(e)
  //         setLoading(false)
  //       }
  //     },
  //     [paginationModel]
  //   )

  //   useEffect(() => {
  //     if (dietModule) {
  //       fetchTableData(sort, searchValue, sortColumning, status)
  //     }
  //   }, [fetchTableData, status])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setsortColumning(newModel[0].field)
      //   fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        // await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <>
      {/* {dietModule && (dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && ( */}
      <div>
        <Button size='small' variant='contained' onClick={() => Router.push('/diet/ingredient/add-ingredient')}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; Add New
        </Button>
      </div>
      {/* )} */}
    </>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumning, status)
  }

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <DataGrid
            sx={{
              '.MuiDataGrid-cell:focus': {
                outline: 'none'
              },

              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer'
              }
            }}
            columnVisibilityModel={{
              sl_no: false
            }}
            hideFooterSelectedRowCount
            disableColumnSelector={true}
            autoHeight
            pagination
            rows={indexedRows === undefined ? [] : indexedRows}
            rowCount={total}
            columns={columns}
            sortingMode='server'
            paginationMode='server'
            pageSizeOptions={[7, 10, 25, 50]}
            paginationModel={paginationModel}
            onSortModelChange={handleSortModel}
            slots={{ toolbar: ServerSideToolbarWithFilter }}
            onPaginationModelChange={setPaginationModel}
            loading={loading}
            slotProps={{
              baseButton: {
                variant: 'outlined'
              },
              toolbar: {
                value: searchValue,
                clearSearch: () => handleSearch(''),
                onChange: event => handleSearch(event.target.value)
              }
            }}
            onCellClick={onCellClick}
          />
        )}
        {openDrawer && <AllocationSlider setOpenDrawer={setOpenDrawer} />}
      </>
    )
  }
  return (
    <>
      <Card>
        <CardHeader title='Egg List' action={headerAction} />
        <CardContent>
          <TabContext value={status}>
            <TabList onChange={handleChange}>
              <Tab value='1' label={<TabBadge label='Recived' totalCount={status === '' ? total : null} />} />
              <Tab value='2' label={<TabBadge label='Incubation' totalCount={status === '1' ? total : null} />} />
              <Tab value='3' label={<TabBadge label='Hatched' totalCount={status === '0' ? total : null} />} />
              <Tab value='4' label={<TabBadge label='Discarded' totalCount={status === '0' ? total : null} />} />
            </TabList>
            <TabPanel value='1'>{tableData()}</TabPanel>
            <TabPanel value='2'>{tableData()}</TabPanel>
            <TabPanel value='3'>{tableData()}</TabPanel>
            <TabPanel value='4'>{tableData()}</TabPanel>
          </TabContext>
        </CardContent>
      </Card>
    </>
  )
}

export default EggList
