/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import moment from 'moment'
import { Avatar, Button, Tooltip, Box, Breadcrumbs, TextField, LinearProgress } from '@mui/material'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'

import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import ErrorScreen from 'src/pages/Error'
// import data from './ojbect'
import DashboardFilter from './speciesDietFilter'
import SpeciesDetails from './speciesDetails'
import { getSpeciesList, speciesAttachmentUpload } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'

const IncubatorsList = () => {
  const theme = useTheme()
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  // const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [speciesDetailsDrawer, setSpeciesDetailsDrawer] = useState(false) // has to be modified

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  // const [selectedDropDown, setSelectedDropDown] = useState('all')
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

  const [attachmentWidth, setAttachmentWidth] = useState(0)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [speciesId, setspeciesId] = useState(null)
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

  const authData = useContext(AuthContext)

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
        console.log('applyFilters', applyFilters)
        const siteIds = applyFilters.Site?.map(option => option.id)
        setLoading(true)
        console.log('siteIds', siteIds)
        const params = {
          site_ids: siteIds.length > 0 ? JSON.stringify(siteIds) : '',
          // section_ids: ids.SectionIds.length > 0 ? JSON.stringify(ids.SectionIds) : '',
          // enclosure_ids: ids.EnclosureIds.length > 0 ? JSON.stringify(ids.EnclosureIds) : '',
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }
        // // console.log('params', params)
        await getSpeciesList(params).then(res => {
          // console.log('response', res)

          // Generate uid field based on the index
          let listWithId = res?.data?.result?.map((el, i) => {
            return { ...el, id: i + 1 }
          })

          setTotal(parseInt(res?.data?.count))
          setRows(loadServerRows(paginationModel.page, listWithId))

          // setstatusCheckval(res?.data?.result.map(all => all.active))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    // if (egg_nursery_permission || egg_collection_permission) {
    fetchTableData(searchValue)
    // }
  }, [fetchTableData, applyFilters])

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

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value)
  }

  const handleFileUpload = async (event, speciesId) => {
    const file = event?.target?.files[0]

    if (!file || file.type !== 'application/pdf') {
      Toaster({ type: 'error', message: 'Please select a valid PDF file.' })
      return
    }

    setAttachmentWidth(prev => prev - 150)
    setUploadingAttachment(true)

    try {
      const res = await speciesAttachmentUpload({ species_id: speciesId, attachment: file })
      Toaster({ type: 'success', message: res.message })
      fetchTableData()
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'File upload failed.' })
    } finally {
      event.target.value = null
      setAttachmentWidth(prev => prev + 150)
      setUploadingAttachment(false)
    }
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
            <Tooltip title={params.row.scientific_name ? params.row.scientific_name : '-'}>
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
                {params.row.scientific_name ? params.row.scientific_name : '-'}
              </Typography>
            </Tooltip>
            <Tooltip title={params.row?.common_name ? params.row?.common_name : '-'}>
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
                {params.row?.common_name ? params.row?.common_name : '-'}
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
        <Tooltip title={params.row.attachment_count ? params.row.attachment_count : '-'}>
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
            {params.row.attachment_count ? params.row.attachment_count : '-'}
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
      renderCell: ({ row }) => {
        // console.log('row', row)
        return (
          <Box sx={{ ml: 1, width: '100%', display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            {/* Attachment Section */}
            <Box
              onClick={() => setSpeciesDetailsDrawer(true)}
              sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}
            >
              {uploadingAttachment === true && speciesId == row.species_id && (
                <Box
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
                    <img style={{ width: '100%', height: '100%' }} src={'/icons/files_green.png'} alt='Profile' />
                  </Avatar>
                  <Box sx={{ width: '110px' }}>
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
                      name of pdf file
                    </Typography>
                    <LinearProgress sx={{ height: '2px' }} value={50} />
                  </Box>
                </Box>
              )}
              {row.attachments.length > 0 ? (
                attachmentWidth > 250 ? (
                  <>
                    {row.attachments.slice(0, Math.floor((attachmentWidth - 100) / 150)).map((item, index) => (
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
                        <Avatar
                          variant='rounded'
                          alt='Medicine Image'
                          sx={{ width: 20, height: 20, overflow: 'hidden' }}
                        >
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
                          {item.file_original_name}
                        </Typography>
                      </Box>
                    ))}
                    {/* Show extra count if any */}
                    {row.attachments.length > Math.floor((attachmentWidth - 100) / 150) && (
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
                          +{row.attachments.length - Math.floor((attachmentWidth - 100) / 150)}
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography
                    sx={{
                      color: theme.palette.primary.dark,
                      fontSize: '14px',
                      fontWeight: '600',
                      lineHeight: '16.94px'
                    }}
                  >
                    +{row.attachments.length}
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
                // setspeciesId(.row?.species_id)
                // e.stopPropagation()
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
                multiple
                accept='application/pdf'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={e => {
                  handleFileUpload(e, speciesId)
                }}
              />
            </Box>
          </Box>
        )
      }
    }
  ]

  const onCellClick = e => {
    // console.log('e.row.species_id', e.row.species_id)
    setspeciesId(e.row.species_id)
  }
  useEffect(() => {
    const totalColumnsWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0)
    const newAttachmentWidth = gridWidth - (totalColumnsWidth + 80)
    setAttachmentWidth(newAttachmentWidth > 0 ? newAttachmentWidth : 0)
  }, [gridWidth])

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit'>Egg</Typography>

        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Species Diet List
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
          {/* <p>DataGrid Width: {gridWidth}px</p> */}
          {/* <p>Attachment Width: {attachmentWidth}px</p> */}
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
                value={searchValue}
                // clearSearch={() => handleSearch('')}
                onChange={event => handleSearch(event.target.value)}
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
            {/* <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                py: '6px',
                px: '12px',
                height: '36px',
                border: 1,
                borderRadius: '4px',
                borderColor: '#c3cec7',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setIsFilterOpen(true)}
            >
              <Icon icon='fluent:filter-16-filled' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
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
                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 400 }}>{filterList?.length}</Typography>
              )}
            </Box> */}
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
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          onCellClick={onCellClick}
        />
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
          setSearch={setSearch}
          setIsSearchOpen={setIsSearchOpen}
          // setSelectedDropDown={setSelectedDropDown}
        />
      )}
      {speciesDetailsDrawer && (
        <SpeciesDetails
          fetchTableData={fetchTableData}
          speciesId={speciesId}
          setspeciesId={setspeciesId}
          fileInputRef={fileInputRef}
          speciesDetailsDrawer={speciesDetailsDrawer}
          setSpeciesDetailsDrawer={setSpeciesDetailsDrawer}
        />
      )}
    </>
  )
}

export default IncubatorsList
