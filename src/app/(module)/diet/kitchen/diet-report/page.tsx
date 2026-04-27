'use client';
// ** React Imports
import { useState, useContext, useMemo } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import RenderUtility from 'src/utility/render'
import { FilterButton } from 'src/views/utility/render-snippets'
import { Box, Button, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import { addDays, addMonths, format, subDays, subMonths } from 'date-fns'
import { CircularProgress, debounce } from '@mui/material'

// ** Custom Components Imports

// ** View Imports
import DietReportView from 'src/views/pages/diet/kitchen/diet-report'
import DietReportDrawer from 'src/components/diet/drawers/DietReportDrawer'
import {
  getGeneralSpeciesWiseReport,
  getSpeciesWiseReport,
  getAnimalWiseInventoryPlanning,
  getGeneralSpeciesWiseComboReport
} from 'src/lib/api/diet/kitchen'
import { getTaxonomyList } from 'src/lib/api/diet/dietList'
import Utility from 'src/utility'
import CustomOptionDateRangePickers from 'src/components/custom-date-picker/CustomOptionDateRangePickers'
import { alignItems, minWidth, width } from '@mui/system'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'

const DietReportPage = () => {
  const initialRows = [
    {
      id: 1,
      reportName: 'Species wise Diet & Quantity Report',
      reportTitle: 'Current diet plan for each species',
      reportAlias: 'species_diet_report',
      downloadStatus: false
    },
    {
      id: 2,
      reportName: 'Site & Species wise Diet & Quantity Report',
      reportTitle: 'Estimated inventory needs per species',
      reportAlias: 'species_inventory_planning',
      downloadStatus: false
    },
    {
      id: 3,
      reportName: 'Inventory Estimate by Animal',
      reportTitle: 'Inventory quantities needed per animal',
      reportAlias: 'animal_wise_inventory_planning',
      downloadStatus: false
    },
    {
      id: 4,
      reportName: 'Species Diet Report',
      reportTitle: '',
      reportAlias: 'species_diet',
      downloadStatus: false
    },
    {
      id: 5,
      reportName: 'Species Site Diet Report',
      reportTitle: '',
      reportAlias: 'species_site_diet_report',
      downloadStatus: false
    }

    // {
    //   id: 4,
    //   reportName: 'Ingredient-Wise Inventory Estimate',
    //   reportTitle: 'Total quantity needed for each ingredient',
    //   reportAlias: 'ingredient_wise_inventory_planning',
    //   downloadStatus: false
    // },
    // {
    //   id: 5,
    //   reportName: 'Combo Mix Inventory Estimate',
    //   reportTitle: 'Inventory needed for combo mixes',
    //   reportAlias: 'ingredient_wise_inventory_planning',
    //   downloadStatus: false
    // },
    // {
    //   id: 6,
    //   reportName: 'Recipe Mix Inventory Estimate',
    //   reportTitle: 'Inventory needed for recipe mixes',
    //   reportAlias: 'ingredient_wise_inventory_planning',
    //   downloadStatus: false
    // }
  ]
  const authData = useContext(AuthContext)
  const sites = authData.userData.user.zoos[0]?.sites || []
  const { t } = useTranslation()
  // ** States
  const [loading, setLoading] = useState(false)
  const [taxonomyLoading, setTaxonomyLoading] = useState(false)
  const [rows, setRows] = useState(initialRows)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [sitesList, setSitesList] = useState(sites)
  const [taxonomyList, setTaxonomyList] = useState([])
  const [totalTaxonomyCount, setTaxonomyCount] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState({})
  const [searchTaxonomyQuery, setSearchTaxonomyQuery] = useState('')

  const [filteredData, setFilteredData] = useState({
    Sites: [],
    Taxonomy: []
  })

  const [filterDates, setFilterDates] = useState({
    from_date: Utility.formatDate(format(addDays(new Date(), 1), 'dd MMM, yyyy')),
    to_date: Utility.formatDate(format(addDays(new Date(), 1), 'dd MMM, yyyy'))
  })

  const [selectedOptions, setSelectedOptions] = useState({
    Sites: [],
    Species: []
  })
  const [selectAllSites, setSelectAllSites] = useState(false)
  const [selectAllSpecies, setSelectAllSpecies] = useState(false)
  const [appliedFiltersCount, setAppliedFilterCount] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page_no: 1,
    limit: 50
  })

  const productTypes = []

  // const handleUpdateStatus = (reportId, status) => {
  //   setDownloadStatus(prev => ({
  //     ...prev,
  //     [reportId]: status
  //   }))
  // }

  const handleFilter = async filterList => {
    setFilteredData(filterList)
    calculateAppliedFiltersCount(filterList)
  }

  const calculateAppliedFiltersCount = filteredData => {
    let count = 0

    if (filteredData && filteredData['Sites'] && filteredData['Sites'].length > 0) {
      count++
    }

    if (filteredData && filteredData['Species'] && filteredData['Species'].length > 0) {
      count++
    }

    if (filteredData && (filteredData.controlled || filteredData.prescription)) {
      count++
    }

    setAppliedFilterCount(count)
  }

  const handleSelectedAllSites = () => {
    setSelectAllSites(!selectAllSites)
    if (!selectAllSites) {
      setSelectedOptions({
        ...selectedOptions,
        Sites: sitesList.map(p => p.site_id)
      })
    } else {
      setSelectedOptions({
        ...selectedOptions,
        Sites: []
      })
    }
  }

  const handleSelectedSpecies = () => {
    setSelectAllSpecies(!selectAllSpecies)
    if (!selectAllSpecies) {
      setSelectedOptions({
        ...selectedOptions,
        Species: taxonomyList.map(pr => pr.tsn)
      })
    } else {
      setSelectedOptions({
        ...selectedOptions,
        Species: []
      })
    }
  }

  // const dietReportData = DietReport({
  //   filterList: filteredData,
  //   onUpdateStatus: handleUpdateStatus
  // })

  const handleUpdateStatus = (reportId, status) => {
    setRows(currentRows => currentRows.map(row => (row.id === reportId ? { ...row, downloadStatus: status } : row)))
  }

  const handleDownload = async (reportId, reportAlias, filteredData) => {
    try {
      const params = {
        site_ids: JSON.stringify(filteredData['Sites']) || [],
        taxonomy_ids: JSON.stringify(filteredData['Species']) || [],
        file_type: 'excel',
        from_date: filterDates.from_date || '',
        to_date: filterDates.to_date || ''
      }
      handleUpdateStatus(reportId, true)

      let data

      if (reportAlias === 'species_diet_report') {
        data = await getGeneralSpeciesWiseReport({ params })
      } else if (reportAlias === 'species_inventory_planning') {
        const newParams = params
        newParams.group_by_site = true
        data = await getSpeciesWiseReport({ params: newParams })
      } else if (reportAlias === 'animal_wise_inventory_planning') {
        data = await getAnimalWiseInventoryPlanning({ params })
      } else if (reportAlias === 'species_diet') {
        data = await getGeneralSpeciesWiseComboReport({ params })
      } else if (reportAlias === 'species_site_diet_report') {
        const newParams = params
        newParams.group_by_site = true
        data = await getGeneralSpeciesWiseComboReport({ params })
      } else {
      }

      if (data?.success) {
        Utility.downloadFileFromURL(data.data)
      } else {
        Toaster({
          type: 'error',
          message: data?.message
        })
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      handleUpdateStatus(reportId, false)
    }
  }

  // ** Column Definitions
  const columns = [
    {
      width: 80,
      field: 'id',
      headerName: t('s_no'),
      headerAlign: 'center',
      alignItems: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => params.value
    },
    {
      flex: 1,
      minWidth: 300,
      field: 'reportName',
      headerName: t('diet_module.report_name'),
      sortable: false,
      renderCell: params => (
        <Box sx={{ minWidth: 40 }}>
          <Typography sx={{ color: 'customColors.OnSecondaryContainer', fontSize: '14px', fontWeight: '400px' }}>
            {params.row.reportName}
          </Typography>
          <Typography
            sx={{
              color: 'customColors.OnSecondaryContainer',
              fontSize: '14px',
              fontWeight: '400px',
              fontStyle: 'italic'
            }}
          >
            {params.row.reportTitle}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      field: 'download',
      headerName: t('download'),
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => (
        <>
          {!params?.row.downloadStatus ? (
            <Button
              variant='contained'
              size='small'
              startIcon={<Icon icon='mdi:download' />}
              onClick={() => handleDownload(params.row.id, params.row.reportAlias, filteredData)}
              disabled={params.row.downloadStatus}
            >
              {t('download')}
            </Button>
          ) : (
            <>
              <CircularProgress size={30} />
            </>
          )}
        </>
      )
    }
  ]

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const formattedStartDate = Utility.formatDate(startDate)
      const formattedEndDate = Utility.formatDate(endDate)

      setFilterDates({ from_date: formattedStartDate, to_date: formattedEndDate })
    } else {
      setFilterDates({ from_date: '', to_date: '' })
    }
  }

  const getTaxonomyListFunc = async (q, page_no) => {
    try {
      setTaxonomyLoading(true)

      const params = {
        search: q ? q : '',
        page_no: page_no ? page_no : paginationModel.page_no,
        limit: paginationModel.limit
      }
      await getTaxonomyList(params).then(res => {
        if (res?.data?.result?.length > 0) {
          // setTaxonomyList(res?.data?.result)
          setTaxonomyList(prev => [...prev, ...res.data.result])
          setTaxonomyCount(res?.data?.total_count)
          setTaxonomyLoading(false)
        }
      })
    } catch (error) {
      setTaxonomyLoading(false)
      console.log('error', error)
    }
  }

  const debouncedSearch = useMemo(
    search =>
      debounce(async (search, page_no) => {
        await getTaxonomyListFunc(search, page_no)
      }, 1000),
    []
  )

  const handleScrollforTaxonomy = debounce(scrollEvent => {
    const { target } = scrollEvent
    const threshold = 10
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= threshold

    if (isBottom && !loading && taxonomyList.length < totalTaxonomyCount) {
      setPaginationModel(prev => ({ ...prev, page_no: prev.page_no + 1 }))
      debouncedSearch(searchTaxonomyQuery, paginationModel.page_no + 1)
    }
  }, 200)

  const handleTaxonomySearch = search => {
    setPaginationModel(prev => ({ ...prev, page_no: 1 }))
    setTaxonomyList([])
    setSearchTaxonomyQuery(search)
    debouncedSearch(search, 1)
  }

  return (
    <Grid container spacing={6}>
      <Grid item size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title={RenderUtility.pageTitle('Diet Reports')}

            // sx={{
            //   '& .MuiCardHeader-title': {
            //     color: theme => theme.palette.primary.main
            //   }
            // }}
            // slotProps={{
            //   title: { variant: 'h5' }
            // }}
          />
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 0 },
                width: '100%'
              }}
            >
              <Grid
                container
                spacing={4}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Grid item size={{ xs: 8, sm: 5, md: 5 }}>
                  <CustomOptionDateRangePickers
                    onChange={handleDateRangeChange}
                    filterDates={{ startDate: filterDates.from_date, endDate: filterDates.to_date }}
                    showFutureDates={true}
                  />
                </Grid>

                <Grid item size={{ xs: 4, sm: 4 }}>
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      justifyContent: { xs: 'flex-end' }
                    }}
                  >
                    <Grid
                      item
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        justifyContent: { sm: 'flex-end', xs: 'flex-end' }
                      }}
                    >
                      <FilterButton
                        onClick={() => {
                          setOpenFilterDrawer(true)
                          getTaxonomyListFunc()
                        }}
                        appliedFiltersCount={appliedFiltersCount}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
            <DietReportView
              rows={rows}
              columns={columns}
              loading={loading}
              downloadStatus={downloadStatus}
              filterList={filteredData}
            />
          </CardContent>
        </Card>
        <DietReportDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          onApplyFilter={handleFilter}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          sites={sitesList}
          speciesList={taxonomyList}
          handleSelectedAllSites={handleSelectedAllSites}
          handleSelectedSpecies={handleSelectedSpecies}
          taxonomyListCallback={getTaxonomyListFunc}
          handleScrollforTaxonomy={handleScrollforTaxonomy}
          taxonomyLoading={taxonomyLoading}
          handleTaxonomySearch={handleTaxonomySearch}
          searchTaxonomyQuery={searchTaxonomyQuery}
        />
      </Grid>
    </Grid>
  )
}

export default DietReportPage
