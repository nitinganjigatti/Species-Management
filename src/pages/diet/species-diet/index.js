import React, { useState, useEffect, useCallback, useContext, useRef } from 'react'

import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import {
  Avatar,
  Tooltip,
  Box,
  Breadcrumbs,
  Tabs,
  Tab,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Card
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import Error404 from 'src/pages/404'

import SpeciesDetails from '../../../components/diet/species-diet/speciesDetails'
import UploadDiet from '../../../components/diet/species-diet/uploadDiet'
import SpeciesDietFilterDrawer from 'src/views/pages/diet/species/SpeciesDietFilterDrawer'
import { FilterButton } from '../../../views/utility/render-snippets'

import { getSpeciesList, getAnimalList } from 'src/lib/api/diet/speciesDiet'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const TAB_VALUES = {
  SPECIES: 'species',
  ANIMAL: 'animal'
}

const SpeciesDietList = () => {
  const colWidths = [65, 300, 200, 100]
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState(TAB_VALUES.SPECIES)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortModel, setSortModel] = useState([{ field: 'scientific_name', sort: 'asc' }])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)

  const [speciesDetailsDrawer, setSpeciesDetailsDrawer] = useState(false) // has to be modified
  const [uploadDietDrawer, setUploadDietDrawer] = useState(false) // has to be modified
  // const [attachmentUploadConfirmDialog, setAttachmentUploadConfirmDialog] = useState(false) // has to be modified
  const [filterByDiet, setFilterByDiet] = useState('-1')
  const [exportLoading, setExportLoading] = useState(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiltersOptions, setSelectedFiltersOptions] = useState({})
  const [filterCount, setFilterCount] = useState(0)

  const [selectedOptions, setSelectedOptions] = useState({
    Class: []
  })
  const [attachmentWidth, setAttachmentWidth] = useState(0)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [speciesId, setspeciesId] = useState(null)
  const [speciesData, setSpeciesData] = useState({})

  const [animalTotal, setAnimalTotal] = useState(0)
  const [animalRows, setAnimalRows] = useState([])
  const [animalSearchValue, setAnimalSearchValue] = useState('')
  const [animalSortModel, setAnimalSortModel] = useState([{ field: 'scientific_name', sort: 'asc' }])
  const [animalPaginationModel, setAnimalPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [animalLoading, setAnimalLoading] = useState(false)

  const [animalUploadDietDrawer, setAnimalUploadDietDrawer] = useState(false)
  const [animalFilterByDiet, setAnimalFilterByDiet] = useState('-1')
  const [animalExportLoading, setAnimalExportLoading] = useState(false)

  const [animalOpenFilterDrawer, setAnimalOpenFilterDrawer] = useState(false)
  const [animalSearchQuery, setAnimalSearchQuery] = useState('')
  const [animalSelectedFiltersOptions, setAnimalSelectedFiltersOptions] = useState({})
  const [animalFilterCount, setAnimalFilterCount] = useState(0)

  const [animalSelectedOptions, setAnimalSelectedOptions] = useState({
    Class: []
  })
  const [animalId, setAnimalId] = useState(null)
  const [animalData, setAnimalData] = useState({})

  ///////////////////////////////////////////////////

  const gridRef = useRef()
  const [gridWidth, setGridWidth] = useState(0)

  // const [siteList, setSiteList] = useState([])

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

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access
  const isAnimalTab = activeTab === TAB_VALUES.ANIMAL

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setSpeciesDetailsDrawer(false)
    setUploadDietDrawer(false)
    setOpenFilterDrawer(false)
    setAnimalUploadDietDrawer(false)
    setAnimalOpenFilterDrawer(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (q, newModel) => {
      try {
        const classIds = selectedFiltersOptions?.Class?.map(option => option.id) || []
        setLoading(true)

        const params = {
          q: q?.q ? q?.q : searchValue,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          with_diet: filterByDiet,
          sort_order: newModel?.sort?.toUpperCase(),
          // sort_by: newModel?.field,
          class_ids: classIds?.length > 0 ? classIds.toString() : ''
        }
        await getSpeciesList(params).then(res => {
          // Generate uid field based on the index
          let listWithId = res?.data?.result?.map((el, i) => {
            return { ...el, id: i + 1 }
          })

          setTotal(parseInt(res?.data?.count))
          setRows(loadServerRows(paginationModel.page, listWithId))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel, filterByDiet, selectedFiltersOptions]
  )

  useEffect(() => {
    if (activeTab === TAB_VALUES.SPECIES) {
      fetchTableData(searchValue)
    }
  }, [fetchTableData, selectedFiltersOptions, activeTab])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    setSortModel(newModel)
    fetchTableData(searchValue, newModel[0])
  }

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchTableData({ q })
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

  const mapAnimalRow = (el, fallbackId) => {
    const scientificName = el?.scientific_name || el?.complete_name || ''
    const genusName = el?.genus_name || scientificName.split(' ')[0] || ''

    return {
      ...el,
      id: el?.animal_id ?? fallbackId,
      common_name: el?.default_common_name || el?.common_name || el?.complete_name || el?.scientific_name,
      scientific_name: scientificName,
      complete_name: el?.complete_name || scientificName,
      genus_name: genusName,
      attachment_count:
        typeof el?.attachment_count === 'number' ? el.attachment_count : el?.mapped_to_diet ? 1 : 0,
      primary_identifier_type: el?.primary_identifier_type || el?.local_id_type || el?.local_identifier_name || null,
      primary_identifier_value:
        el?.primary_identifier_value || el?.local_identifier_value || el?.local_id || el?.identifier || null
    }
  }

  const downloadCsvFile = (fileName, csvRows) => {
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const fetchAnimalTableData = useCallback(
    async (q, newModel) => {
      try {
        const classIds = animalSelectedFiltersOptions?.Class?.map(option => option.id) || []
        setAnimalLoading(true)

        const params = {
          q: q?.q ? q?.q : animalSearchValue,
          page_no: animalPaginationModel.page + 1,
          limit: animalPaginationModel.pageSize,
          with_diet: animalFilterByDiet,
          sort_order: newModel?.sort?.toUpperCase(),
          class_ids: classIds?.length > 0 ? classIds.toString() : ''
        }

        const res = await getAnimalList(params)
        const listWithId = res?.data?.result?.map((el, i) => mapAnimalRow(el, i + 1))

        setAnimalTotal(parseInt(res?.data?.count || 0))
        setAnimalRows(loadServerRows(animalPaginationModel.page, listWithId || []))
        setAnimalLoading(false)
      } catch (error) {
        console.log(error)
        setAnimalLoading(false)
      }
    },
    [animalPaginationModel, animalFilterByDiet, animalSelectedFiltersOptions]
  )

  useEffect(() => {
    if (activeTab === TAB_VALUES.ANIMAL) {
      fetchAnimalTableData(animalSearchValue)
    }
  }, [fetchAnimalTableData, activeTab])

  const getAnimalSlNo = index => (animalPaginationModel.page + 1 - 1) * animalPaginationModel.pageSize + index + 1

  const indexedAnimalRows = animalRows?.map((row, index) => ({
    ...row,
    sl_no: getAnimalSlNo(index)
  }))

  const handleAnimalSortModel = newModel => {
    setAnimalSortModel(newModel)
    fetchAnimalTableData(animalSearchValue, newModel[0])
  }

  const searchAnimalTableData = useCallback(
    debounce(async q => {
      setAnimalSearchValue(q)
      try {
        await fetchAnimalTableData({ q })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [fetchAnimalTableData]
  )

  const handleAnimalSearch = value => {
    setAnimalSearchValue(value)
    searchAnimalTableData(value)
  }

  const handleAnimalExport = async () => {
    try {
      setAnimalExportLoading(true)
      const classIds = animalSelectedFiltersOptions?.Class?.map(option => option.id) || []
      const params = {
        q: animalSearchValue,
        page_no: animalPaginationModel.page + 1,
        limit: animalPaginationModel.pageSize,
        with_diet: animalFilterByDiet,
        sort_order: animalSortModel?.[0]?.sort?.toUpperCase(),
        class_ids: classIds?.length > 0 ? classIds.toString() : ''
      }
      const response = await getAnimalList(params)
      if (response?.success && response?.data) {
        if (Array.isArray(response?.data?.result)) {
          const headers = ['Common Name', 'Scientific Name', 'Genus', 'Active Diets']
          const rowsData = response.data.result.map((item, index) => {
            const row = mapAnimalRow(item, index + 1)

            return [row.common_name || '', row.scientific_name || '', row.genus_name || '', row.attachment_count || 0]
          })
          const csvRows = [headers, ...rowsData].map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          )
          downloadCsvFile('animal-diet-list.csv', csvRows)

          return
        }
        if (typeof response.data === 'string') {
          const csvFile = response.data.split('/')
          const fileName = csvFile[csvFile.length - 1]
          Utility.downloadFileFromURL(response.data, `${fileName}`)

          return
        }
        const downloadUrl = response?.data?.download_url || response?.data?.file_url || response?.data?.url
        if (downloadUrl) {
          const csvFile = downloadUrl.split('/')
          const fileName = csvFile[csvFile.length - 1]
          Utility.downloadFileFromURL(downloadUrl, `${fileName}`)
        }
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setAnimalExportLoading(false)
    }
  }

  const handleSpeciesUploadClick = params => {
    const scientific_name = params.row.scientific_name
    const common_name = params.row.common_name
    const default_icon = params.row.default_icon
    setSpeciesData({ default_icon, scientific_name, common_name })
    setspeciesId(params.row.species_id)
    setUploadDietDrawer(true)
  }

  const handleAnimalUploadClick = params => {
    const scientific_name = params.row.scientific_name
    const common_name = params.row.common_name
    const default_icon = params.row.default_icon
    setAnimalData({ default_icon, scientific_name, common_name })
    setAnimalId(params.row.animal_id)
    setAnimalUploadDietDrawer(true)
  }

  const buildColumns = ({ nameHeader, onRowClick, onUploadClick }) => [
    {
      width: colWidths[0],
      field: 'id',
      headerName: 'SL',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          onClick={onRowClick ? () => onRowClick(params) : undefined}
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: '400',
            lineHeight: '14.52px',
            fontSize: '12px',
            cursor: onRowClick ? 'pointer' : 'default'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: colWidths[1],
      sortable: false,
      field: 'scientific_name',
      headerName: nameHeader,
      renderCell: params => (
        <Box
          onClick={onRowClick ? () => onRowClick(params) : undefined}
          sx={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: onRowClick ? 'pointer' : 'default' }}
        >
          <SpeciesCard species={params?.row} />
        </Box>
      )
    },
    {
      width: colWidths[2],
      sortable: false,
      field: 'attachment_count',
      headerName: 'ACTIVE DIETS',
      renderCell: params => (
        <Tooltip title={params.row.attachment_count ? params.row.attachment_count : 0}>
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
            {params.row.attachment_count ? params.row.attachment_count : 0}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: colWidths[2],
      sortable: false,
      field: 'genus_name',
      headerName: 'Genus',
      renderCell: params => (
        <Tooltip title={params.row.genus_name ? params.row.genus_name : ''}>
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
            {params.row.genus_name ? params.row.genus_name : ''}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 1,
      minWidth: 100,
      sortable: false,
      field: 'diet_attachment_upload',
      headerName: 'Action',
      headerAlign: 'right',
      renderCell: params => (
        <>
          {(dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'end' }}>
              <Box
                onClick={() => onUploadClick(params)}
                sx={{
                  width: '80px',
                  display: 'flex',
                  justifyContent: 'end',
                  alignItems: 'center',
                  gap: '8px'
                }}
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
                  alt='Specie Image'
                  sx={{ width: 20, height: 20, background: 'transparent', overflow: 'hidden' }}
                >
                  <img style={{ width: '100%', height: '100%' }} src={'/icons/little_upload_icon.svg'} alt='Profile' />
                </Avatar>
              </Box>
            </Box>
          )}
        </>
      )
    }
  ]

  const speciesColumns = buildColumns({
    nameHeader: 'SPECIES',
    onRowClick: () => setSpeciesDetailsDrawer(true),
    onUploadClick: handleSpeciesUploadClick
  })

  const animalColumns = buildColumns({
    nameHeader: 'ANIMAL',
    onUploadClick: handleAnimalUploadClick
  })

  const handleExport = async () => {
    try {
      setExportLoading(true)

      const params = {
        // sort: sort,
        q: searchValue,
        // column: sortColumn,
        response_type: 'csv',
        with_diet: filterByDiet
      }
      const response = await getSpeciesList(params)
      if (response?.success && response?.data) {
        const csvFile = response?.data.split('/')
        const fileName = csvFile[csvFile.length - 1]
        Utility.downloadFileFromURL(response.data, `${fileName}`)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const onCellClick = e => {
    const scientific_name = e.row.scientific_name
    const common_name = e.row.common_name
    const default_icon = e.row.default_icon
    if (isAnimalTab) {
      setAnimalData({ default_icon, scientific_name, common_name })
      setAnimalId(e.row.animal_id)
    } else {
      setSpeciesData({ default_icon, scientific_name, common_name })
      setspeciesId(e.row.species_id)
    }
  }

  useEffect(() => {
    const totalColumnsWidth = colWidths.reduce((sum, col) => sum + (col || 0), 0)
    const newAttachmentWidth = gridWidth - (totalColumnsWidth + 30)
    setAttachmentWidth(newAttachmentWidth > 300 ? newAttachmentWidth : 300)
  }, [gridWidth])

  const activeRows = isAnimalTab ? indexedAnimalRows : indexedRows
  const activeTotal = isAnimalTab ? animalTotal : total
  const activePaginationModel = isAnimalTab ? animalPaginationModel : paginationModel
  const activeSortModel = isAnimalTab ? animalSortModel : sortModel
  const activeColumns = isAnimalTab ? animalColumns : speciesColumns
  const activeLoading = isAnimalTab ? animalLoading : loading
  const activeExportLoading = isAnimalTab ? animalExportLoading : exportLoading
  const activeSearchValue = isAnimalTab ? animalSearchValue : searchValue
  const activeFilterByDiet = isAnimalTab ? animalFilterByDiet : filterByDiet
  const activeFilterCount = isAnimalTab ? animalFilterCount : filterCount

  return (
    <>
      {dietModule ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography color='inherit'>Diet</Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              Diet List
            </Typography>
          </Breadcrumbs>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 4, pt: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
                <Tab label='Species Diet' value={TAB_VALUES.SPECIES} />
                <Tab label='Animal Diet' value={TAB_VALUES.ANIMAL} />
              </Tabs>
            </Box>
            <Grid
              container
              sx={{
                marginY: 6,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                rowGap: 4
              }}
            >
              <Grid item size={{ xs: 12, sm: 3.5 }}>
                <Typography
                  sx={{
                    marginLeft: 4,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: '500',
                    fontSize: '24px',
                    lineHeight: '29.05px'
                  }}
                >
                  {isAnimalTab ? 'Animal Diet' : 'Species Diet'}
                </Typography>
              </Grid>
              <Grid item size={{ xs: 12, sm: 8 }}>
                <Grid container sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                  <Grid item size={{ xs: 12, sm: 12, md: 'auto', xl: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginRight: { xs: 4, md: 0 } }}>
                      <FormControl sx={{ minWidth: 250 }}>
                        <InputLabel id='controlled-select-label'>
                          {isAnimalTab ? 'Filter Animal' : 'Filter Species'}
                        </InputLabel>
                        <Select
                          onChange={e => {
                            if (isAnimalTab) {
                              setAnimalFilterByDiet(e.target.value)
                            } else {
                              setFilterByDiet(e.target.value)
                            }
                          }}
                          label={isAnimalTab ? 'Filter Animal' : 'Filter Species'}
                          value={activeFilterByDiet}
                          id='controlled-select'
                          labelId='controlled-select-label'
                          sx={{ width: '100%' }}
                          size='small'
                        >
                          <MenuItem value='-1'>All</MenuItem>
                          <MenuItem value='1'>{isAnimalTab ? 'Animals With Diet' : 'Species With Diet'}</MenuItem>
                          <MenuItem value='0'>{isAnimalTab ? 'Animals Without Diet' : 'Species Without Diet'}</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>

                  <Grid
                    item
                    size={{ xs: 12, sm: 12, md: 'auto', xl: 'auto' }}
                    sx={{ display: 'flex', justifyContent: 'flex-end', marginLeft: { xs: 4, md: 0 }, marginRight: 4 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        height: '40px'
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 250,
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
                          value={activeSearchValue}
                          // clearSearch={() => handleSearch('')}
                          onChange={event =>
                            isAnimalTab ? handleAnimalSearch(event.target.value) : handleSearch(event.target.value)
                          }
                          variant='outlined'
                          placeholder='Search...'
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
                            input: {
                              // disableUnderline: true
                            }
                          }}
                        />
                      </Box>
                      <Box>
                        <Tooltip title='Export'>
                          <>
                            {activeLoading || activeExportLoading ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '4px',
                                  bgcolor: theme?.palette.customColors?.lightBg,
                                  alignItems: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <CircularProgress color='success' size={30} />
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '4px',
                                  bgcolor: theme?.palette.customColors?.lightBg,
                                  alignItems: 'center',
                                  cursor: 'pointer'
                                }}
                                onClick={isAnimalTab ? handleAnimalExport : handleExport}
                              >
                                <Icon icon='ic:round-download' fontSize={20} />
                              </Box>
                            )}
                          </>
                        </Tooltip>
                      </Box>

                      <FilterButton
                        onClick={() => (isAnimalTab ? setAnimalOpenFilterDrawer(true) : setOpenFilterDrawer(true))}
                        appliedFiltersCount={activeFilterCount}
                        icon='mage:filter'
                        iconSize={24}
                      />
                    </Box>
                  </Grid>

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
                <Box
                  sx={{
                    p: '4px',
                    minWidth: '30px',
                    minHeight: '26px',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.light,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Typography sx={{ textAlign: 'center', color: '#fff', fontSize: '14px', fontWeight: 400 }}>
                    {filterList?.length}
                  </Typography>
                </Box>
              )}
            </Box> */}
                </Grid>
              </Grid>
            </Grid>

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
              rows={activeRows === undefined ? [] : activeRows}
              rowCount={activeTotal}
              rowHeight={64}
              disableRowSelectionOnClick
              disableColumnMenu
              columns={activeColumns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50, 100]}
              paginationModel={activePaginationModel}
              onSortModelChange={isAnimalTab ? handleAnimalSortModel : handleSortModel}
              sortModel={activeSortModel}
              onPaginationModelChange={isAnimalTab ? setAnimalPaginationModel : setPaginationModel}
              loading={activeLoading}
              // onRowClick={() => setSpeciesDetailsDrawer(true)}
              onCellClick={onCellClick}
            />
          </Card>
          {/* ///////////////////////Filter-Code//////////////////////////// */}
          {/* {isFilterOpen && (
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
          siteList={siteList}
          setSiteList={setSiteList}
        />
      )} */}
          {!isAnimalTab && speciesDetailsDrawer && (
            <SpeciesDetails
              fetchTableData={fetchTableData}
              speciesId={speciesId}
              setspeciesId={setspeciesId}
              speciesDetailsDrawer={speciesDetailsDrawer}
              setSpeciesDetailsDrawer={setSpeciesDetailsDrawer}
            />
          )}
          {!isAnimalTab && uploadDietDrawer && (
            <UploadDiet
              fetchTableData={fetchTableData}
              speciesId={speciesId}
              speciesData={speciesData}
              setspeciesId={setspeciesId}
              uploadDietDrawer={uploadDietDrawer}
              handleSearch={handleSearch}
              setUploadDietDrawer={setUploadDietDrawer}
            />
          )}
          {isAnimalTab && animalUploadDietDrawer && (
            <UploadDiet
              fetchTableData={fetchAnimalTableData}
              uploadDietDrawer={animalUploadDietDrawer}
              setUploadDietDrawer={setAnimalUploadDietDrawer}
              handleSearch={handleAnimalSearch}
              entityType='animal'
              entityId={animalId}
              setEntityId={setAnimalId}
              entityData={animalData}
            />
          )}
          {(isAnimalTab ? animalOpenFilterDrawer : openFilterDrawer) && (
            <SpeciesDietFilterDrawer
              setOpenFilterDrawer={isAnimalTab ? setAnimalOpenFilterDrawer : setOpenFilterDrawer}
              searchQuery={isAnimalTab ? animalSearchQuery : searchQuery}
              setSearchQuery={isAnimalTab ? setAnimalSearchQuery : setSearchQuery}
              openFilterDrawer={isAnimalTab ? animalOpenFilterDrawer : openFilterDrawer}
              setSelectedFiltersOptions={isAnimalTab ? setAnimalSelectedFiltersOptions : setSelectedFiltersOptions}
              selectedOptions={isAnimalTab ? animalSelectedOptions : selectedOptions}
              setSelectedOptions={isAnimalTab ? setAnimalSelectedOptions : setSelectedOptions}
              setFilterCount={isAnimalTab ? setAnimalFilterCount : setFilterCount}
            />
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default SpeciesDietList
