/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import moment from 'moment'
import { Avatar, Button, Tooltip, Box, Breadcrumbs, TextField } from '@mui/material'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import { useTheme } from '@mui/material/styles'

import { AuthContext } from 'src/context/AuthContext'
// import Styles from './dot.module.css'
import Utility from 'src/utility'
import ErrorScreen from 'src/pages/Error'
import data from './ojbect'
import DashboardFilter from './speciesDietFilter'
import SpeciesDetails from './speciesDetails'

const IncubatorsList = () => {
  const cuurent_date = moment().format('YYYY-MM-DD')

  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)

  const [speciesDetailsDrawer, setSpeciesDetailsDrawer] = useState(false) // has to be modified

  const [discardList, setDiscardList] = useState([]) // has to be modified
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDropDown, setSelectedDropDown] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [applyFilters, setApplyFilters] = useState({
    Site: [],
    Section: [],
    Enclosure: []
  })

  const [selectedOptions, setSelectedOptions] = useState({
    Site: [],
    Section: [],
    Enclosure: []
  })

  const [attachmentWidth, setttachmentWidth] = useState(0)
  const [filterList, setFilterList] = useState([])

  ///////////////////////////////////////////////////

  const gridRef = useRef()
  const [gridWidth, setGridWidth] = useState(0)

  // Function to update grid height
  const updateGridWidth = () => {
    if (gridRef.current) {
      setGridWidth(gridRef.current.clientWidth)
    }
  }

  useEffect(() => {
    setTimeout(() => {
      updateGridWidth() // Initial call
    }, 0)

    window.addEventListener('resize', updateGridWidth)

    return () => {
      window.removeEventListener('resize', updateGridWidth)
    }
  }, [])
  ///////////////////////////////////////////////////
  const fileInputRef = useRef(null)

  const handleFileUpload = event => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      console.log('Selected PDF:', file)
      // Handle the uploaded PDF file here
    } else {
      alert('Please select a valid PDF file.')
    }
  }
  ///////////////////////////////////////////////////
  ///////////////////////////////////////////////////

  const authData = useContext(AuthContext)

  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    // setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        // const params = {
        //   q,
        //   sort,
        //   from_date: '2024-05-29',
        //   til_date: cuurent_date,
        //   page: paginationModel.page + 1,
        //   limit: paginationModel.pageSize,
        //   room_id: '',
        //   nursery_id: '',
        //   site_id: ''
        // }
        // // console.log('params', params)
        // await getIncubatorList({ params }).then(res => {
        //   // console.log('response', res)

        //   // Generate uid field based on the index
        //   let listWithId = res?.data?.data?.result?.map((el, i) => {
        //     return { ...el, id: i + 1 }
        //   })
        let listWithId = data?.map((el, i) => {
          return { ...el, id: i + 1 }
        })
        //   setTotal(parseInt(res?.data?.data?.total_count))
        setTotal(9)
        setRows(loadServerRows(paginationModel.page, listWithId))

        //   // setstatusCheckval(res?.data?.result.map(all => all.active))
        // })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(searchValue)
    }
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {}

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchTableData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // const handleSidebarOpen = () => {
  //   setDialog(true)
  // }

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const headerAction = (
    <>
      {egg_nursery_permission && (
        <Button
          sx={{ height: '40px', width: '126px' }}
          size='small'
          variant='contained'
          //   onClick={() => setDialog(true)}
        >
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; Add New
        </Button>
      )}
      {/* )} */}
    </>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value)
  }

  const columns = [
    {
      width: 40,
      field: 'id',
      headerName: '#',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: '400',
            lineHeight: '14.52px',
            fontSize: '12px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      width: 300,
      sortable: false,
      field: 'species',
      headerName: 'SPECIES',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 35,
              height: 35,
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
            <Tooltip title={params.row.complete_name ? params.row.complete_name : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: 240
                }}
              >
                {params.row.complete_name ? params.row.complete_name : '-'}
              </Typography>
            </Tooltip>
            <Tooltip title={params.row?.default_common_name ? params.row?.default_common_name : '-'}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: 240
                }}
              >
                {params.row?.default_common_name ? params.row?.default_common_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      width: 170,
      sortable: false,
      field: 'diet_assigned',
      headerName: 'DIETS ASSIGNED',
      renderCell: params => (
        <Tooltip title={params.row.diet_assigned ? params.row.diet_assigned : '-'}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              ml: 2
            }}
          >
            {params.row.diet_assigned ? params.row.diet_assigned : '-'}
          </Typography>
        </Tooltip>
      )
    },

    {
      // width: ,
      flex: '1',
      sortable: false,
      field: 'diet_attached',
      headerName: 'DIETS ATTACHED',
      renderCell: params => (
        <Box
          onClick={() => setSpeciesDetailsDrawer(true)}
          sx={{ ml: 1, width: '100%', display: 'flex', gap: 2, justifyContent: 'space-between' }}
        >
          {/* Attachment Section */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            {params.row.diet_attached.length > 0 ? (
              attachmentWidth > 250 ? (
                <>
                  {params.row.diet_attached.slice(0, Math.floor((attachmentWidth - 100) / 150)).map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: '144px',
                        height: '32px',
                        padding: '6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: theme.components.MuiDialog.styleOverrides.paper.backgroundColor
                      }}
                    >
                      <Avatar variant='rounded' alt='Medicine Image' sx={{ width: 20, height: 20, overflow: 'hidden' }}>
                        <img
                          style={{ width: '100%', height: '100%' }}
                          src={'/icons/little_pdf_icon.png'}
                          alt='Profile'
                        />
                      </Avatar>
                      <Typography
                        noWrap
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '16px',
                          fontWeight: '400',
                          lineHeight: '19.36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                  {/* Show extra count if any */}
                  {params.row.diet_attached.length > Math.floor((attachmentWidth - 100) / 150) && (
                    <Box
                      sx={{
                        height: '32px',
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: theme.components.MuiDialog.styleOverrides.paper.backgroundColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          color: theme.palette.primary.dark,
                          fontSize: '14px',
                          fontWeight: '600',
                          lineHeight: '16.94px'
                        }}
                      >
                        +{params.row.diet_attached.length - Math.floor((attachmentWidth - 100) / 150)}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Typography
                  sx={{ color: theme.palette.primary.dark, fontSize: '14px', fontWeight: '600', lineHeight: '16.94px' }}
                >
                  +{params.row.diet_attached.length}
                </Typography>
              )
            ) : (
              <Typography
                sx={{
                  color: '#E93353',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '16.96px',
                  letterSpacing: '0.1px'
                }}
              >
                -
              </Typography>
            )}
          </Box>

          {/* Upload Section */}
          <Box
            onClick={e => {
              e.stopPropagation()
              fileInputRef.current.click()
            }}
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}
          >
            <Typography
              sx={{
                color: theme.palette.primary.dark,
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '16.96px',
                letterSpacing: '0.1px'
              }}
            >
              Upload
            </Typography>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{ width: 20, height: 20, background: 'transparent', overflow: 'hidden' }}
            >
              <img style={{ width: '100%', height: '100%' }} src={'/icons/little_upload_icon.png'} alt='Profile' />
            </Avatar>
            <input
              type='file'
              accept='application/pdf'
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </Box>
        </Box>
      )
    }
  ]

  const onCellClick = params => {
    // console.log(params, 'params')
    // Router.push({
    //   pathname: `/egg/incubators/${params.row?.incubator_id}`
    // })
  }
  useEffect(() => {
    const totalColumnsWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0)
    const newAttachmentWidth = gridWidth - (totalColumnsWidth + 80)
    setttachmentWidth(newAttachmentWidth > 0 ? newAttachmentWidth : 0)
  }, [gridWidth])

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
              <Typography color='inherit'>Egg</Typography>

              <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
                Incubator List
              </Typography>
            </Breadcrumbs>
            <Card>
              <Box
                sx={{
                  m: 4,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: '500',
                    fontSize: '24px',
                    lineHeight: '29.05px'
                  }}
                >
                  Species Diet
                </Typography>
                <p>DataGrid Width: {gridWidth}px</p>
                <p>Attachment Width: {attachmentWidth}px</p>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                    <TextField
                      variant='outlined'
                      placeholder='Search...'
                      InputProps={
                        {
                          // disableUnderline: true
                        }
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
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px',
                      py: '6px',
                      px: '12px',
                      //   width: '50px',
                      //   width: filterList?.length > 0 ? '50px' : '34px',
                      height: '36px',
                      border: 1,
                      borderRadius: '4px',
                      borderColor: '#c3cec7',
                      //   bgcolor: filterList?.length > 0 ? theme?.palette.primary.dark : null,
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <Icon
                      icon='fluent:filter-16-filled'
                      fontSize={20}
                      color={theme.palette.customColors.OnSurfaceVariant}
                      //   color={filterList?.length > 0 ? '#fff' : 'Black'}
                    />
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '14px',
                        fontWeight: 400,
                        lineHeight: '19.36px'
                      }}
                    >
                      Filter
                    </Typography>

                    {filterList?.length > 0 && (
                      <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 400 }}>
                        {filterList?.length}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              <DataGrid
                ref={gridRef}
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
                // sortModel={}
                hideFooterSelectedRowCount
                disableColumnSelector={true}
                autoHeight
                pagination
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                rowHeight={64}
                disableRowSelectionOnClick
                columns={columns}
                sortingMode='server'
                paginationMode='server'
                pageSizeOptions={[7, 10, 25, 50]}
                paginationModel={paginationModel}
                onSortModelChange={handleSortModel}
                // slots={{ toolbar: ServerSideToolbarWithFilter }}
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
              {/* <AddIncubators actionApi={fetchTableData} sidebarOpen={dialog} handleSidebarClose={handleSidebarClose} /> */}
            </Card>

            {isFilterOpen && (
              <DashboardFilter
                setShowFilters={setShowFilters}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
                setFilterList={setFilterList}
                setApplyFilters={setApplyFilters}
                filterList={filterList}
                setDiscardList={setDiscardList}
                setSearch={setSearch}
                setIsSearchOpen={setIsSearchOpen}
                setSelectedDropDown={setSelectedDropDown}
              />
            )}
            {speciesDetailsDrawer && (
              <SpeciesDetails
                fileInputRef={fileInputRef}
                speciesDetailsDrawer={speciesDetailsDrawer}
                setSpeciesDetailsDrawer={setSpeciesDetailsDrawer}
              />
            )}
          </>
        )
      ) : (
        <>
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default IncubatorsList
