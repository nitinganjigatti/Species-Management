import {
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Tab,
  Divider,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
// import { DataGrid } from '@mui/x-data-grid'
import { useContext, useEffect, useState } from 'react'
import { ExcelExportButton } from 'src/components/Buttons'
import { getHousingReport, getSpeciesReport, getUsersReportList } from 'src/lib/api/parivesh/housing'
import { DataGrid } from '@mui/x-data-grid'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import StatisticsReport from './statistics'
import { useTheme } from '@emotion/react'
import { AuthContext } from 'src/context/AuthContext'
import { Popover, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
// import { getReportFilterList } from 'src/lib/api/report'
import toast from 'react-hot-toast'
import { getReportFilterList } from 'src/lib/api/report'

const ReportList = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const [userList, setUserList] = useState([])
  const [housingList, setHousingList] = useState([])
  const [speciesList, setSpeciesList] = useState([])
  const [statisticsList, setStatisticsList] = useState([])
  const [status, setStatus] = useState('statistics')
  const [rows, setRows] = useState([])
  const [selectedSite, setSelectedSite] = useState([])
  const [dataList, setDataList] = useState([])
  const [filterPop, setFilterPop] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [popoverData, setPopoverData] = useState({
    Taxonomy: [
      { label: 'Class', key: 'include_class', checked: true },
      { label: 'Order', key: 'include_order', checked: true },
      { label: 'Family', key: 'include_family', checked: true },
      { label: 'Genus', key: 'include_genus', checked: true }
    ],
    Housing: [
      { label: 'Site', key: 'include_site', checked: true },
      { label: 'Section', key: 'include_section', checked: true },
      { label: 'Enclosure', key: 'include_enclosure', checked: true },
      { label: 'Cluster', key: 'include_cluster', checked: true },
      { label: 'Organisation', key: 'include_organization', checked: true }
    ]
  })

  const [apiFilterParams, setApiFilterParams] = useState({
    include_housing: 1,
    include_enclosure: 1,
    include_section: 1,
    include_cluster: 1,
    include_class: 1,
    include_organization: 1,
    include_order: 1,
    include_family: 1,
    include_genus: 1,
    include_site: 1,
    include_genus: 1
  })

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'filter-popover' : undefined

  const getStatisticsDataToExport = async () => {
    const filename = 'statistic_data.csv'
    const params = {
      response_type: 'csv',
      ...Object.keys(apiFilterParams).reduce((acc, key) => {
        if (apiFilterParams[key] === 1) {
          acc[key] = 1
        }
        return acc
      }, {})
    }

    try {
      const response = await getReportFilterList(params)

      if (response && response.data) {
        const csvUrl = response.data

        const csvResponse = await fetch(csvUrl)
        const csvText = await csvResponse.text()

        const blob = new Blob([csvText], { type: 'text/csv' })
        const blobUrl = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      } else {
        console.error('Error: CSV URL not found in the response.')
      }
    } catch (error) {
      console.error('Error fetching statistics data:', error)
    }
  }

  const handleChange = (event, newValue) => {
    setStatus(newValue)
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

  const handleOptions = async (category, item, itemIndex) => {
    setPopoverData(prevData => {
      const updatedData = {
        ...prevData,
        [category]: prevData[category].map((el, index) => (index === itemIndex ? { ...el, checked: !el.checked } : el))
      }

      const updatedApiParams = { ...apiFilterParams }

      Object.keys(updatedData).forEach(cat => {
        updatedData[cat].forEach(el => {
          if (el.checked) {
            if (el.key in updatedApiParams) {
              updatedApiParams[el.key] = 1
            }
          } else {
            if (el.key in updatedApiParams) {
              updatedApiParams[el.key] = 0
            }
          }
        })
      })

      setApiFilterParams(updatedApiParams)

      getReportFilterList(updatedApiParams)
        .then(response => {
          if (response.success) {
            setAnchorEl(null)
          } else {
            toast.error('Something went wrong')
          }
        })
        .catch(() => {
          toast.error('Error connecting to the server')
        })

      return updatedData
    })
  }

  const handleSelectedSite = async e => {
    // console.log('e.target>', e.target.value)
    const value = e.target.value
    let params = {}

    if (value.includes('All Sites') && !selectedSite.includes('All Sites')) {
      params = {
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1
          return acc
        }, {})
      }
      setSelectedSite(['All Sites'])
    } else if (value.includes('All Sites')) {
      const filteredSiteIDs = value.filter(id => id !== 'All Sites')
      params = {
        site_ids: filteredSiteIDs.toString(),
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1
          return acc
        }, {})
      }
      setSelectedSite(filteredSiteIDs)
    } else if (value.length === 0) {
      params = {
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1
          return acc
        }, {})
      }
      setSelectedSite(['All Sites'])
    } else {
      params = {
        site_ids: value.toString(),
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1
          return acc
        }, {})
      }
      setSelectedSite(value)
    }

    try {
      const responseData = await getReportFilterList(params)

      setDataList(responseData?.data?.datalist || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  return (
    <>
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
          <CardHeader title={title} />
          <Button
            onClick={() => getStatisticsDataToExport()}
            variant='contained'
            sx={{
              width: '250px',
              height: '38px',
              fontSize: '14px',
              fontFamily: 'Inter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              mt: 2
            }}
          >
            Download Report
            <img src='/images/download.png' alt='download icon' style={{ marginLeft: 8 }} />
          </Button>
        </Box>

        <TabContext value={status}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            {/* Tabs on the left */}
            <TabList onChange={handleChange}>
              {/* <Tab sx={{ ml: 2 }} value='statistics' label='Statistics' /> */}
            </TabList>

            {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: 4,
                  mr: 2
                }}
              >
                <FormControl fullWidth sx={{ maxWidth: '200px' }}>
                  <InputLabel
                    sx={{
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      color: '#44544A',
                      width: '152px',
                      height: '17px',
                      mt: 0.5
                    }}
                  >
                    All Sites
                  </InputLabel>
                  <Select
                    multiple
                    value={selectedSite}
                    onChange={handleSelectedSite}
                    label='Site'
                    sx={{
                      height: '40px',
                      mt: 2,
                      width: '200px',
                      borderRadius: '4px',
                      mr: { sm: 1, xs: 0 }
                    }}
                  >
                    <MenuItem value='All Sites'>All Sites</MenuItem>
                    {authData?.userData?.user?.zoos[0].sites?.map((item, index) => (
                      <MenuItem key={index} value={item?.site_id}>
                        {item?.site_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Filter Button */}
                <Button
                  onClick={handleClick}
                  variant='outlined'
                  sx={{
                    width: '120px',
                    height: '40px',
                    mt: 2,
                    display: 'flex',
                    color: '#44544A',
                    fontWeight: 400,
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3, // Adjusted gap between icon and text
                    minWidth: '100px'
                  }}
                >
                  <img src='/images/filterIcon.png' style={{ width: '24px', height: '24px' }} alt='Filter Icon' />
                  Filter {/* First character capitalized, rest lowercase */}
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
                      <div key={category}>
                        <Typography
                          variant='subtitle1'
                          sx={{
                            fontWeight: 500,
                            mt: 3,
                            ml: 3,
                            fontFamily: 'Inter',
                            fontSize: '16px',
                            color: 'yourTheme.palette.customColors.OnSurfaceVariant'
                          }}
                        >
                          {category}
                        </Typography>
                        <List>
                          {popoverData[category].map((item, index) => (
                            <ListItem key={item.key} onClick={() => handleOptions(category, item, index)}>
                              <ListItemIcon>{item.checked && <CheckIcon sx={{ color: 'green' }} />}</ListItemIcon>
                              <ListItemText primary={item.label} />
                            </ListItem>
                          ))}
                        </List>
                      </div>
                    ))}
                  </Box>
                </Popover>
              </Box>
            )}

            {/* Dropdowns on the right */}
          </Box>

          <TabPanel value='statistics' sx={{ p: 0 }}>
            <StatisticsReport
              apiFilterParams={apiFilterParams}
              popoverData={popoverData}
              setDataList={setDataList}
              dataList={dataList}
            />
            <Divider />
          </TabPanel>
        </TabContext>
      </Card>
    </>
  )
}

export default ReportList
