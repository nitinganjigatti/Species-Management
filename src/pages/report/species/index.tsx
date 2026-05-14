import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { MouseEvent } from 'react'

import {
  Card,
  CardHeader,
  Typography,
  Button,
  Box,
  Checkbox,
  FormControl,
  CircularProgress,
  Tooltip
} from '@mui/material'
import { Popover } from '@mui/material'
import { TabContext } from '@mui/lab'
import { useTheme } from '@mui/material/styles'

import { AuthContext } from 'src/context/AuthContext'
import { useAnimalContext } from 'src/context/AnimalContext'

import toast from 'react-hot-toast'
import Error404 from 'src/pages/404'
import SiteSheet from 'src/views/pages/pharmacy/report/siteSheet'

import { getReportFilterList } from 'src/lib/api/report'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import ReactTable from 'src/views/table/ReactTable'
import { Zoo, UserSettings, HeaderItem, PopoverData, FilterParams } from 'src/types/report'

interface AuthContextType {
  userData: {
    user: { zoos: Zoo[] }
    roles: { settings: { enable_reports_module: boolean } }
    permission: { user_settings: UserSettings }
  } | null
}

interface AnimalContextType {
  selectedAnimal: Record<string, string | undefined> | null
  setSelectedAnimal: React.Dispatch<React.SetStateAction<Record<string, string | undefined> | null>>
  apiFilterParams: FilterParams
  setApiFilterParams: React.Dispatch<React.SetStateAction<FilterParams>>
  selectedSites: string[]
  setSelectedSites: React.Dispatch<React.SetStateAction<string[]>>
  selectedOptions: Record<string, string[] | string>
  setSelectedOptions: React.Dispatch<React.SetStateAction<Record<string, string[] | string>>>
}

const SpeciesReport = () => {
  const router = useRouter()
  const theme = useTheme()
  const authData = useContext(AuthContext) as AuthContextType
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module
  const enable_specie_report = authData?.userData?.permission?.user_settings?.enable_specie_report

  const {
    selectedAnimal,
    setSelectedAnimal,
    apiFilterParams,
    setApiFilterParams,
    selectedSites,
    setSelectedSites,
    selectedOptions,
    setSelectedOptions
  } = useAnimalContext() as AnimalContextType
  const [status, setStatus] = useState('statistics')

  const [dataList, setDataList] = useState<Record<string, string | number | null | undefined>[]>([])
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [openSiteDrawer, setOpenSiteDrawer] = useState(false)

  const [searchValue, setSearchValue] = useState('')

  const [sites, setSites] = useState(
    authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) || []
  )
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [total, setTotal] = useState(0)

  const [isDownloading, setIsDownloading] = useState(false)

  const [popoverData, setPopoverData] = useState<PopoverData>({
    Taxonomy: [
      { label: 'Class', key: 'include_class', checked: true },
      { label: 'Order', key: 'include_order', checked: true },
      { label: 'Family', key: 'include_family', checked: true },
      { label: 'Genus', key: 'include_genus', checked: true }
    ],
    Housing: [
      { label: 'Site', key: 'include_site', checked: false },
      { label: 'Section', key: 'include_section', checked: false },
      { label: 'Enclosure', key: 'include_enclosure', checked: false },
      { label: 'Cluster', key: 'include_cluster', checked: false },
      { label: 'Organisation', key: 'include_organization', checked: false }
    ]
  })

  const initialFilterParams: FilterParams = {
    include_housing: 0,
    include_enclosure: 0,
    include_section: 0,
    include_cluster: 0,
    include_class: 1,
    include_organization: 0,
    include_order: 1,
    include_family: 1,
    include_genus: 1,
    include_site: 0
  }

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'filter-popover' : undefined

  const getStatisticsDataToExport = async () => {
    await fetchDownList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })
  }

  const title = (
    <>
      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 500,
          fontFamily: 'Inter',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        Species General Report
      </Typography>
    </>
  )

  const fetchAndSetDataList = async (params: FilterParams, options: { setHeaders?: boolean; setTotalCount?: boolean; responseType?: string } = {}) => {
    const { setHeaders = false, setTotalCount = false, responseType = 'json' } = options
    try {
      setIsLoading(true)
      const response = await getReportFilterList(params)
      const parsedParams = apiFilterParams || {}
      if (selectedSites.includes('All Sites')) {
        const updatedParams = { ...parsedParams }
        delete updatedParams.site_ids

        setApiFilterParams(updatedParams)
        setSelectedSites([])
      }

      if (responseType === 'csv' && response && response.data) {
        const csvUrl = response.data as unknown as string
        const link = document.createElement('a')
        link.href = csvUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(csvUrl)
      } else if (response.success) {
        const { header, datalist, total_count } = (response.data as { header: HeaderItem[]; datalist: Record<string, string | number | null | undefined>[]; total_count: number }) || {}

        setTotal(total_count)
        setIsLoading(false)
        setHeaderList(header)
        setAnchorEl(null)
        setDataList(loadServerRows(paginationModel.page, datalist))
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDownList = async (params: FilterParams, options: { responseType?: string } = {}) => {
    const { responseType = 'json' } = options
    try {
      setIsDownloading(true)
      const response = await getReportFilterList(params)
      if (responseType === 'csv' && response && response.data) {
        handleCsvResponse(response.data as unknown as string)
      } else if (response.success) {
        const { header, animal_list, total_animal } = (response.data as unknown as { header: HeaderItem[]; animal_list: Record<string, string | number | null | undefined>[]; total_animal: number }) || {}

        setTotal(total_animal)
        setIsDownloading(false)
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCsvResponse = (csvUrl: string) => {
    const link = document.createElement('a')
    link.href = csvUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(csvUrl)
  }

  const handleOptionChange = (category: string, itemIndex: number) => {
    setPopoverData(prevData => {
      const updatedData = {
        ...prevData,
        [category]: prevData[category].map((el, index) => (index === itemIndex ? { ...el, checked: !el.checked } : el))
      }

      return updatedData
    })
  }

  function loadServerRows(_currentPage: number, data: Record<string, string | number | null | undefined>[]) {
    return data
  }

  const [headerList, setHeaderList] = useState<HeaderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const initialLoad = useRef(true)

  const fetchData = useCallback(async (param: FilterParams, q: string, paginationModel: { page: number; pageSize: number }) => {
    const params: FilterParams = {
      page: paginationModel?.page + 1,
      limit: paginationModel?.pageSize,
      q,
      ...param
    }

    setIsLoading(true)
    await fetchAndSetDataList(params, { setHeaders: true, setTotalCount: true })
    initialLoad.current = false
  }, [])

  useEffect(() => {
    if (router.pathname === '/report/species' && reports_module && enable_specie_report && initialLoad.current) {
      setSelectedSites([])
      setSelectedOptions({})
      setApiFilterParams(initialFilterParams)
      fetchData(initialFilterParams, searchValue, paginationModel)
    }
  }, [router.pathname, reports_module, enable_specie_report])

  useEffect(() => {
    if (!initialLoad.current && reports_module && enable_specie_report) {
      fetchData(apiFilterParams, searchValue, paginationModel)
    }
  }, [apiFilterParams, paginationModel])

  const columns = headerList.map((header, index) => {
    if (Array.isArray(header.key) ? header.key.includes('default_icon') : header.key.includes('default_icon')) {
      return {
        field: 'speciesAndCommonName',
        headerName: header.label,
        isAvatar: true,
        pinned: 'left',
        sortable: false,
        disableColumnMenu: true,
        width: 320,
        headerStyle: { zIndex: 1099 },
        renderCell: (params: { row: Record<string, string | number | null | undefined> }) => <SpeciesCard species={params.row} />
      }
    }

    const fieldKey = Array.isArray(header.key) ? header.key[0] : header.key

    return {
      field: fieldKey,
      headerName: header.label,
      minWidth: 200,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: (params: { row: Record<string, string | number | null | undefined> }) => (
        <>
          {params?.row && params?.row[header.key as string] !== undefined && params?.row[header.key as string] !== null ? (
            <Box
              sx={{
                width: '100px',
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                cursor: 'pointer',
                '&:hover::after': {
                  content: `"${
                    params?.row && params?.row[header.key as string] !== undefined && params?.row[header.key as string] !== null
                      ? params?.row[header.key as string]
                      : ''
                  }"`,
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  zIndex: 9999,
                  pointerEvents: 'none'
                }
              }}
            >
              <Typography
                sx={{
                  color: getCellTextColor(header.label as string),
                  backgroundColor: getCellBackgroundColor(header.label as string),
                  borderRadius: '4px',
                  padding: getCellBackgroundColor(header.label as string) !== 'transparent' ? '4px 16px' : '0',
                  fontWeight: 400,
                  textAlign: 'left',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
                }}
              >
                {params?.row && params?.row[header.key as string] !== undefined && params?.row[header.key as string] !== null
                  ? params?.row[header.key as string]
                  : ''}
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                color: getCellTextColor(header.label as string)
              }}
            >
              -
            </Typography>
          )}
        </>
      )
    }
  })

  const getCellBackgroundColor = (label: string) => {
    switch (label) {
      case 'Male':
        return theme.palette.customColors.SecondaryContainer
      case 'Female':
        return theme.palette.customColors.AntzTertiary
      case 'Undetermined':
        return theme.palette.customColors.displaybgSecondary
      case 'Indeterminate':
        return theme.palette.customColors.displaybgSecondary
      default:
        return 'transparent'
    }
  }

  const getCellTextColor = (label: string) => {
    switch (label) {
      case 'Male':
      case 'Female':
        return theme.palette.customColors.OnSecondaryContainer
      case 'Undetermined':
        return theme.palette.customColors.Error
      case 'Indeterminate':
        return theme.palette.customColors.OnSurfaceVariant
      default:
        return theme.palette.customColors.OnSurfaceVariant
    }
  }

  const getSlNo = (index: number) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const reportRows = dataList?.map((item, index) => ({
    id: index + 1,
    ...item,
    sl_no: getSlNo(index)
  })) as (Record<string, string | number | null | undefined> & { id: number; sl_no: number })[]

  const handleConfirm = async () => {
    const updatedApiParams: FilterParams = { ...apiFilterParams }

    Object.keys(popoverData).forEach(category => {
      popoverData[category].forEach(option => {
        updatedApiParams[option.key] = option.checked ? 1 : 0
      })
    })

    setApiFilterParams(updatedApiParams)
    setPaginationModel({ ...paginationModel, page: 0 })
  }

  const handleRowClick = (params: Record<string, unknown>) => {
    const hasFilterChanged = JSON.stringify(apiFilterParams) !== JSON.stringify(initialFilterParams)
    const hasSitesChanged = JSON.stringify(selectedSites) !== JSON.stringify(sites)

    setSelectedAnimal({
      default_icon: params?.default_icon as string | undefined,
      scientific_name: params?.scientific_name as string | undefined,
      common_name: params?.common_name as string | undefined
    })

    if (hasFilterChanged) setApiFilterParams(apiFilterParams)
    if (hasSitesChanged) setSelectedSites(selectedSites)

    setSelectedOptions(prev => ({
      ...prev,
      Site: selectedSites ? selectedSites : ''
    }))

    router.push(`/report/animalList?animalId=${params?.tsn_id}`)
  }

  const handleSelectedSite = async (selectedSiteIDs: string[]) => {
    let params: FilterParams = {}

    if (selectedSiteIDs.includes('All Sites') && !selectedSites.includes('All Sites')) {
      params = {
        ...Object.keys(apiFilterParams).reduce<FilterParams>((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSites(['All Sites'])
    } else if (selectedSiteIDs.includes('All Sites')) {
      const filteredSiteIDs = selectedSiteIDs.filter(id => id !== 'All Sites')
      params = {
        site_ids: filteredSiteIDs.toString(),
        ...Object.keys(apiFilterParams).reduce<FilterParams>((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSites(filteredSiteIDs)
    } else if (selectedSiteIDs.length === 0) {
      params = {
        ...Object.keys(apiFilterParams).reduce<FilterParams>((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }

      setSelectedSites([])
    } else {
      params = {
        site_ids: selectedSiteIDs.toString(),
        ...Object.keys(apiFilterParams).reduce<FilterParams>((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSites(selectedSiteIDs)
    }

    setPaginationModel({ page: 0, pageSize: 10 })
    setApiFilterParams(params)
  }

  return (
    <>
      {reports_module && enable_specie_report ? (
        <>
          <Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
              <CardHeader title={title} />
              <Typography
                onClick={isDownloading ? undefined : () => getStatisticsDataToExport()}
                sx={{
                  fontSize: '20px',
                  fontWeight: '400',
                  fontFamily: 'Inter',
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  mr: 4
                }}
                aria-disabled={isDownloading}
              >
                Download report
                {isDownloading ? (
                  <CircularProgress size={22} sx={{ ml: 2 }} />
                ) : (
                  <img
                    src='/images/download1.svg'
                    alt='download icon'
                    style={{ marginLeft: 8, width: 30, height: 30 }}
                  />
                )}
              </Typography>
            </Box>

            <TabContext value={status}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', px: 2, pt: 2 }}>
                {(authData?.userData?.user?.zoos[0]?.sites?.length ?? 0) > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      borderRadius: '8px',
                      gap: 4,
                      mr: 2
                    }}
                  >
                    <FormControl fullWidth sx={{ maxWidth: '200px', mt: 2 }}>
                      <Button
                        variant='outlined'
                        disabled={isLoading}
                        onClick={() => setOpenSiteDrawer(true)}
                        sx={{
                          height: '40px',
                          width: '200px',
                          borderRadius: '8px',
                          textTransform: 'none',
                          overflow: 'hidden',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0 12px'
                        }}
                      >
                        <Box
                          sx={{
                            overflow: 'hidden',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            textAlign: 'left',
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          <Box
                            sx={{
                              overflow: 'hidden',
                              borderRadius: '8px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              flex: 1,
                              textAlign: 'left',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {selectedSites.length > 0 && selectedSites[0] !== 'All Sites' ? (
                              <>
                                {
                                  authData?.userData?.user?.zoos[0].sites?.find(
                                    site => site.site_id === selectedSites[0]
                                  )?.site_name
                                }
                                {selectedSites.length > 1 && ` ...+${selectedSites.length - 1}`}
                              </>
                            ) : (
                              `Select Site (${sites.length})`
                            )}
                          </Box>
                        </Box>
                        <Box component='span' sx={{ ml: 1, color: 'black' }}>
                          <img
                            src='/images/All.png'
                            style={{ width: '20px', height: '20px', marginTop: 7 }}
                            alt='Filter Icon'
                          />
                        </Box>
                      </Button>
                    </FormControl>

                    <SiteSheet
                      openSiteDrawer={openSiteDrawer}
                      setOpenSiteDrawer={setOpenSiteDrawer}
                      sites={sites}
                      setSites={setSites}
                      selectedSites={selectedSites}
                      setSelectedSites={setSelectedSites}
                      apiFilterParams={apiFilterParams}
                      handleSelectedSite={handleSelectedSite}
                    />

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
                            <Typography variant='h6'>{category}</Typography>
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
                          gap: 2,
                          mb: 5,
                          mr: 14
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
                          onClick={handleConfirm}
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

              <Box sx={{ padding: 5 }}>
                <ReactTable
                  rows={reportRows}
                  rowCount={total}
                  rowHeight={70}
                  headerHeight={47}
                  pagination={true}
                  columns={columns?.length ? columns : []}
                  pageSizeOptions={[7, 10, 25, 50]}
                  rowsInView={10}
                  rowsInViewOptions={[5, 7, 10, 25, 50]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  loading={isLoading}
                  onRowClick={handleRowClick}
                  serverSide
                  modifyColumnPinning
                  headerName='Species General Report'
                  searchMode='server'
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

export default SpeciesReport
