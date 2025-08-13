import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

import { Box, Button, Card, CardHeader, Checkbox, Popover, Typography, Tooltip } from '@mui/material'
import { TabContext } from '@mui/lab'
import { useTheme } from '@emotion/react'
import toast from 'react-hot-toast'
import moment from 'moment'

import { AuthContext } from 'src/context/AuthContext'
import { useAnimalContext } from 'src/context/AnimalContext'
import { usePariveshContext } from 'src/context/PariveshContext'

import Error404 from 'src/pages/404'
import FilterSheet from 'src/views/pages/pharmacy/report/FilterSheet'
import StickyTable from 'src/views/table/sticky-table'

import { getAllAnimalReport, getAnimalReportById } from 'src/lib/api/report'
import AnimalCard from 'src/views/utility/AnimalCard'

const AnimalList = () => {
  const router = useRouter()
  const theme = useTheme()
  const { animalId } = router.query
  const { organizationList } = usePariveshContext()
  const authData = useContext(AuthContext)
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module

  const categories = ['Site', 'Organization']
  const enable_animal_report = authData?.userData?.permission?.user_settings?.enable_animal_report

  const [status, setStatus] = useState('statistics')
  const [animalList, setAnimalList] = useState([])

  const [dataList, setDataList] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const {
    selectedAnimal,
    apiFilterParams,
    setApiFilterParams,
    selectedSites,
    setSelectedSites,
    selectedOptions,
    setSelectedOptions
  } = useAnimalContext()

  const [sites, setSites] = useState(
    authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) || [] || []
  )
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [total, setTotal] = useState(0)

  const [headerList, setHeaderList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  // const [speciesList, setSpeciesList] = useState([])
  const [isLoader, setIsLoader] = useState(false)

  const [popoverData, setPopoverData] = useState({
    Taxonomy: [
      { label: 'Class', key: 'include_class', checked: false },
      { label: 'Order', key: 'include_order', checked: false },
      { label: 'Family', key: 'include_family', checked: false },
      { label: 'Genus', key: 'include_genus', checked: false }
    ],
    Housing: [
      { label: 'Site', key: 'include_site', checked: false },
      { label: 'Section', key: 'include_section', checked: false },
      { label: 'Enclosure', key: 'include_enclosure', checked: false },
      { label: 'Cluster', key: 'include_cluster', checked: false },
      { label: 'Organisation', key: 'include_organization', checked: false }
    ]
  })

  const [filterParams, setFilterParams] = useState({
    include_housing: 0,
    include_enclosure: 0,
    include_section: 0,
    include_cluster: 0,
    include_class: 0,
    include_organization: 0,
    include_order: 0,
    include_family: 0,
    include_genus: 0,
    include_site: 0,
    include_genus: 0
  })

  const handleClick = event => {
    if (animalId) {
      setAnchorEl(event.currentTarget)

      setPopoverData(prevData => {
        const updatedData = { ...prevData }

        Object.keys(updatedData).forEach(category => {
          updatedData[category] = updatedData[category].map(item => ({
            ...item,
            checked: item.checked || apiFilterParams?.[item.key] === 1
          }))
        })

        return updatedData
      })
    } else {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const initialLoad = useRef(true)

  const open = Boolean(anchorEl)
  const id = open ? 'filter-popover' : undefined

  useEffect(() => {
    if (router.pathname === '/report/animalList' && !animalId) {
      setSelectedSites([])
      setSelectedOptions([])

      setApiFilterParams(prevParams => {
        const updatedParams = { ...prevParams }
        delete updatedParams.site_ids
        delete updatedParams.sids

        return updatedParams
      })
    }
  }, [router.pathname])

  // useEffect(() => {
  //   const fetchSpeciesList = async () => {
  //     setIsLoader(true)
  //     try {
  //       const response = await getSpeciesListing()
  //       if (response.success) {
  //         setIsLoader(false)
  //         setSpeciesList(response.data.result)
  //       } else {
  //         console.error('Error: Something went wrong')
  //       }
  //     } catch (error) {
  //       console.error('Error fetching species:', error)
  //     } finally {
  //       setIsLoader(false)
  //     }
  //   }
  //   fetchSpeciesList()
  // }, [])

  const handleSelection = async (selectedIDs, category) => {
    let params = {}
    setIsLoading(true)
    const isAllSelected = category === 'Site' ? 'All Sites' : 'All Organizations'
    const key = category === 'Site' ? 'sids' : 'oids'
    const stateSetter = category === 'Site' ? setSelectedSites : setSelectedOptions

    if (selectedIDs.includes(isAllSelected)) {
      if (category === 'Site') {
        stateSetter(allSites) // Store actual site IDs
        params[key] = ''
      } else {
        stateSetter(prev => ({ ...prev, Organization: allOrganizations }))
        params[key] = ''
      }
    } else {
      params[key] = selectedIDs.length ? selectedIDs.toString() : ''
      if (category === 'Site') {
        stateSetter(selectedIDs)
      } else {
        stateSetter(prev => ({ ...prev, Organization: selectedIDs }))
      }
    }
    setIsLoading(false)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
    setApiFilterParams(prev => ({
      ...prev,
      [key]: params[key]
    }))
  }

  const fetchAndSetDataList = async (params, options = {}) => {
    const { setHeaders = false, setTotalCount = false, responseType = 'json' } = options
    try {
      setIsLoading(true)
      const response = await getAllAnimalReport(params)
      if (responseType === 'csv' && response && response.data) {
        handleCsvResponse(response.data)
      } else if (response.success) {
        const { header, animal_list, total_animal } = response.data || {}

        setTotal(total_animal)
        setIsLoading(false)

        if (setHeaders) setHeaderList(header)
        setAnchorEl(null)

        setDataList(loadServerRows(paginationModel.page, animal_list))
      } else {
        setDataList([])
        setTotal(0)
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDownList = async (params, options = {}) => {
    const { responseType = 'json' } = options
    try {
      setIsDownloading(true)
      const response = await getAllAnimalReport(params)
      if (responseType === 'csv' && response && response.data) {
        handleCsvResponse(response.data)
      } else if (response.success) {
        const { header, animal_list, total_animal } = response.data || {}

        setTotal(total_animal)
        setIsDownloading(false)
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCsvResponse = csvUrl => {
    const link = document.createElement('a')
    link.href = csvUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(csvUrl)
  }

  const getAnimalDataToExport = async () => {
    await fetchDownList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })
  }

  const getSpecificAnimalDataToExport = async () => {
    await getSpecificAnimal(animalId, { response_type: 'csv' }, { responseType: 'csv' })
  }

  const fetchData = useCallback(
    async (param, paginationModel) => {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...param
      }
      setIsLoading(true)
      await fetchAndSetDataList(params, { setHeaders: true, setTotalCount: true })
      initialLoad.current = false
    },
    [paginationModel]
  )

  useEffect(() => {
    if (!animalId && reports_module && enable_animal_report) {
      fetchData(apiFilterParams, paginationModel)
    }
  }, [fetchData, apiFilterParams])

  const getSpecificAnimal = async (id, options = {}) => {
    try {
      const parsedParams = apiFilterParams || {}

      let siteParam = selectedSites.includes('All Sites') ? '' : parsedParams.site_ids

      if (selectedSites.includes('All Sites')) {
        let updatedParams = { ...parsedParams }
        delete updatedParams.site_ids

        setApiFilterParams(updatedParams)
        setSelectedSites([])
      }

      // Remove site_ids from the API payload
      const { site_ids, ...filteredParams } = parsedParams

      const params = {
        tids: id,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sids: siteParam,
        ...filteredParams
      }

      if (options.response_type === 'csv') {
        setIsDownloading(true)
        try {
          const csvResponse = await getAnimalReportById({ ...params, response_type: 'csv' })
          if (csvResponse && csvResponse.data) {
            const fileName = 'specific_animal_data.csv' // Default filename
            handleCsvResponse(csvResponse.data, fileName)
          }
        } finally {
          setIsDownloading(false)
        }

        return
      }

      setIsLoading(true)
      const response = await getAnimalReportById(params)
      if (response.success) {
        const { header, animal_list, total_animal } = response.data

        setTotal(total_animal)
        setHeaderList(header)
        setAnimalList(loadServerRows(paginationModel.page, animal_list))
      } else {
        setTotal(0)
        setAnimalList([])
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (animalId) {
      getSpecificAnimal(animalId)
    }
  }, [animalId, filterParams, selectedSites, paginationModel])

  const handleOptionChange = (category, itemIndex) => {
    setPopoverData(prevData => {
      const updatedData = {
        ...prevData,
        [category]: prevData[category].map((el, index) => (index === itemIndex ? { ...el, checked: !el.checked } : el))
      }
      return updatedData
    })
  }

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return <>{`${text.substring(0, maxLength)}...`}</>
    }
    return text
  }

  const getSpecificTotalSelectedFilters = selectedOptions => {
    return Object.values(selectedOptions).filter(items => {
      const filtered = items.filter(item => item !== 'All Sites' && item !== 'All Organizations')
      return filtered.length > 0
    }).length
  }

  // const getTotalSelectedFilters = selectedOptions => {
  //   return Object.values(selectedOptions).filter(selected => selected.length > 0).length
  // }

  const getTotalSelectedFilters = selectedOptions => {
    return Object.values(selectedOptions)
      .filter(selected => selected.length > 0)
      .flat().length
  }

  const columns = headerList.map(header => {
    const fieldKey = Array.isArray(header.key) ? header.key[0] : header.key

    if (header.key.includes('default_icon')) {
      return {
        field: 'Animals',
        headerName: header.label,
        isAvatar: true,
        pinned: 'left',
        sortable: false,
        disableColumnMenu: true,
        width: 300,
        renderCell: params => (
          <Box sx={{ paddingY: '20px' }}>
            <AnimalCard data={params.row} />
          </Box>
        )
      }
    }

    return {
      field: fieldKey,
      headerName: header.label,
      width: 210,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: params => {
        let truncatedValue
        truncatedValue = params?.row[header?.key]
          ? String(header?.key) === 'accession_date'
            ? // ? moment(params?.row[header?.key]).format('DD-MMM-YYYY').toLocaleLowerCase()
              moment(params?.row[header?.key]).format('DD-MMM-YYYY')
            : truncateText(params?.row[header?.key], 20)
          : ''

        const showTooltip = params?.value?.length > 20

        return (
          <Tooltip title={showTooltip ? cellValue : null} placement='bottom'>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter',
                color: theme.palette.customColors.customHeadingTextColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {truncatedValue}
            </Typography>
          </Tooltip>
        )
      }
    }
  })

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const reportRows = (animalId ? animalList : dataList)?.map((item, index) => ({
    id: index + 1,
    sex: item.gender || item.sex,
    ...item,
    sl_no: getSlNo(index)
  }))

  const handleConfirm = async () => {
    let updatedApiParams = { ...apiFilterParams }

    Object.keys(popoverData).forEach(category => {
      popoverData[category].forEach(option => {
        updatedApiParams[option.key] = option.checked ? 1 : 0
      })
    })

    setApiFilterParams(updatedApiParams)
    setPaginationModel({ ...paginationModel, page: 0 })
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const options = {
    Site:
      authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) || [],
    Organization: organizationList?.sort((a, b) => a.organization_name.localeCompare(b.organization_name)) || []
  }

  const handleFilterSection = () => {
    setOpenFilterDrawer(true)
  }

  const handleFilterConfirm = async () => {
    let updatedApiParams = {}

    Object.keys(popoverData).forEach(category => {
      popoverData[category].forEach(option => {
        if (option.checked) {
          updatedApiParams[option.key] = 1
        }
      })
    })
    const selectedSiteIds = selectedSites.length > 0 ? selectedSites : ''

    updatedApiParams.sids =
      Array.isArray(selectedSiteIds) && selectedSiteIds.length > 0 ? selectedSiteIds.join(',') : ''

    setSelectedSites(selectedSiteIds.includes('All Sites') ? sites : selectedSiteIds)

    setApiFilterParams(updatedApiParams)
    setAnchorEl(null)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  return (
    <>
      {reports_module && enable_animal_report ? (
        <>
          <Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
              <CardHeader
                title={
                  animalId ? (
                    <CardHeader
                      avatar={
                        <img
                          src={selectedAnimal?.default_icon}
                          alt={selectedAnimal?.common_name}
                          style={{ width: 60, height: 60, borderRadius: '118px', mr: 2 }}
                        />
                      }
                      subheader={
                        <>
                          <Typography
                            sx={{
                              fontSize: '24px',
                              fontWeight: 600,
                              fontFamily: 'Inter',
                              color: theme.palette.customColors.OnSurfaceVariant,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden'
                            }}
                            variant='body2'
                          >
                            {selectedAnimal?.scientific_name}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: '16px',
                              fontWeight: 400,
                              ml: 1,
                              fontFamily: 'Inter',
                              color: theme.palette.customColors.OnSurfaceVariant,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden'
                            }}
                            variant='body2'
                          >
                            {selectedAnimal?.common_name}
                          </Typography>
                        </>
                      }
                    />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: '24px',
                        fontWeight: 500,
                        fontFamily: 'Inter',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Animal Report List
                    </Typography>
                  )
                }
              />

              <Typography
                onClick={() => (animalId ? getSpecificAnimalDataToExport() : getAnimalDataToExport())}
                sx={{
                  fontSize: '20px',
                  fontWeight: '400',
                  fontFamily: 'Inter',
                  color: theme.palette.primary.OnSurface,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  mr: 4
                }}
              >
                Download report
                <img src='/images/download1.png' alt='download icon' style={{ marginLeft: 8, width: 30, height: 30 }} />
              </Typography>
            </Box>

            <TabContext value={status}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', px: 2, mt: 3 }}>
                {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      borderRadius: '8px',
                      mr: 2
                    }}
                  >
                    <Button
                      onClick={() => handleFilterSection()}
                      variant='outlined'
                      sx={{
                        width: '129px',
                        height: '40px',
                        mt: 2,
                        mr: 2,
                        display: 'flex',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        borderRadius: '4px',
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        minWidth: '100px'
                      }}
                    >
                      <img
                        src='/images/filterIcon.png'
                        style={{ width: '30px', height: '30px', marginBottom: '3px', marginTop: '7px' }}
                        alt='Filter Icon'
                      />

                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnPrimaryContainer,
                          textTransform: 'capitalize',
                          mr: 8,
                          fontSize: '16px',
                          fontWeight: 400
                        }}
                      >
                        Filter
                      </Typography>

                      {animalId && getSpecificTotalSelectedFilters(selectedOptions) > 0 ? (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '5px',
                            right: '6px',
                            width: '29px',
                            height: '27px',
                            borderRadius: '69%',
                            backgroundColor: theme.palette.customColors.OnPrimaryContainer,
                            color: theme.palette.customColors.OnPrimary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          {getSpecificTotalSelectedFilters(selectedOptions)}
                        </Box>
                      ) : (
                        getTotalSelectedFilters(selectedOptions) > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '5px',
                              right: '6px',
                              width: '29px',
                              height: '27px',
                              borderRadius: '69%',
                              backgroundColor: theme.palette.customColors.OnPrimaryContainer,
                              color: theme.palette.customColors.OnPrimary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 500
                            }}
                          >
                            {getTotalSelectedFilters(selectedOptions)}
                          </Box>
                        )
                      )}
                    </Button>
                    {
                      <FilterSheet
                        open={openFilterDrawer}
                        setOpenFilterDrawer={setOpenFilterDrawer}
                        categories={categories}
                        sites={sites}
                        setSites={setSites}
                        selectedSites={selectedSites}
                        setSelectedSites={setSelectedSites}
                        animalId={animalId}
                        options={options}
                        selectedOptions={selectedOptions}
                        isLoader={isLoader}
                        setSelectedOptions={setSelectedOptions}
                        handleSelection={handleSelection}
                        getTotalSelectedFilters={animalId ? getSpecificTotalSelectedFilters : getTotalSelectedFilters}
                      />
                    }

                    <Button
                      onClick={handleClick}
                      variant='outlined'
                      sx={{
                        width: '150px',
                        height: '40px',
                        mt: 2,
                        display: 'flex',
                        borderRadius: '4px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        gap: 1,
                        minWidth: '100px'
                      }}
                    >
                      <img
                        src='/images/show_popup.png'
                        style={{
                          width: '24px',
                          height: '24px',
                          marginBottom: '2px',
                          marginRight: '3px',
                          marginTop: '2px'
                        }}
                        alt='Filter Icon'
                      />
                      <Typography
                        sx={{ color: theme.palette.customColors.OnPrimaryContainer, textTransform: 'capitalize' }}
                      >
                        Show/Hide
                      </Typography>
                    </Button>
                    <Popover
                      id={id}
                      open={open}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                      }}
                    >
                      <Box sx={{ p: 2, width: 300 }}>
                        {Object.keys(popoverData).map(category => (
                          <Box key={category}>
                            <Typography
                              sx={{
                                ml: 2,
                                mt: 2
                              }}
                              variant='h6'
                            >
                              {category}
                            </Typography>
                            {popoverData[category].map((item, index) => (
                              <Box key={item.key} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Checkbox checked={item.checked} onChange={() => handleOptionChange(category, index)} />
                                <Typography>{item.label}</Typography>
                              </Box>
                            ))}
                          </Box>
                        ))}
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: 3,
                          mb: 5,
                          mr: 10
                        }}
                      >
                        <Button
                          variant='outlined'
                          onClick={() => {
                            setAnchorEl(null)
                          }}
                          sx={{
                            minWidth: '100px',
                            padding: '6px 16px'
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant='contained'
                          onClick={animalId ? handleFilterConfirm : handleConfirm}
                          sx={{
                            minWidth: '100px',
                            padding: '6px 16px'
                          }}
                        >
                          Confirm
                        </Button>
                      </Box>
                    </Popover>
                  </Box>
                )}
              </Box>
              <Box sx={{ width: '100%', p: 5 }}>
                <StickyTable
                  rows={reportRows.length && reportRows}
                  rowCount={total}
                  rowHeight={86}
                  headerHeight={47}
                  pagination={true}
                  columns={columns.length && columns}
                  pageSizeOptions={[7, 10, 25, 50]}
                  rowsInView={10}
                  rowsInViewOptions={[5, 7, 10, 25, 50]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  loading={isLoading}
                  downloadExcel
                  headerName='Species'
                  searchMode='server'
                  disableColumnSorting={true}
                />
              </Box>
            </TabContext>
          </Card>
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AnimalList
