import { useState, useEffect, useContext } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardHeader,
  CircularProgress,
  FormControl,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@emotion/react'
import moment from 'moment'
import StickyTable from 'src/views/table/sticky-table'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import { getAnimalAssessmentReport } from 'src/lib/api/report'
import AssessmentReportFilterDrawer from 'src/views/pages/report/AssessmentReportFilterDrawer'

const AnimalAssessment = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const [assessmentData, setAssessmentData] = useState([])
  const [maxAssessmentCount, setMaxAssessmentCount] = useState(0)
  const [headerList, setHeaderList] = useState([])
  const [dataList, setDataList] = useState([])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiltersOptions, setSelectedFiltersOptions] = useState({})
  const [filterCount, setFilterCount] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({
    site_ids: [],
    section_ids: [],
    enclosure_ids: [],
    assessment_type_ids: [],
    taxonomy_ids: [],
    start_date: null,
    end_date: null
  })

  const [defaultSite, setDefaultSite] = useState(null)

  // Transform raw animal data
  const transformAnimalData = () => {
    const animals = assessmentData || []
    const transformed = animals?.map(animal => {
      const age =
        animal.birth_date && moment(animal.birth_date).isValid()
          ? `${moment().diff(moment(animal.birth_date), 'years')}y ${
              moment().diff(moment(animal.birth_date), 'months') % 12
            }m`
          : '-'

      const recordMap = {}
      animal.assessment_data.assessments.forEach((assessment, index) => {
        recordMap[`record_${index}`] = {
          value: `${assessment.assessment_value} ${assessment.uom_abbr}`,
          date: moment(assessment.Assessment_Recorded_Date).format('DD MMM YYYY')
        }
      })

      return {
        ...recordMap,
        default_icon: '/images/elephant.png',
        primary_identifier_type: animal.identifier_type,
        primary_identifier_value: animal.identifier_value,
        primary_animal_id: animal.animal_id,
        primary_taxonomy_id: animal.taxonomy_id,
        common_name: animal.common_name,
        scientific_name: animal.scientific_name,
        age,
        site: animal.site
      }
    })

    setDataList(transformed)
    // setTotal(transformed.length)

    const headers = [
      { key: 'default_icon', label: 'ANIMAL DETAILS' },
      ...Array.from({ length: maxAssessmentCount }, (_, i) => ({
        key: `record_${i}`,
        label: i === 0 ? <span style={{ display: 'inline-block', marginLeft: '14px' }}>RECORDS</span> : ''
      }))
    ]
    setHeaderList(headers)
  }

  const animalAssessmentReport = async () => {
    setIsLoading(true)
    const params = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize
    }
    try {
      const res = await getAnimalAssessmentReport(params)

      setAssessmentData(res?.data?.animals || [])
      setMaxAssessmentCount(res?.data?.max_assessment_count || 0)
      setTotal(res?.data?.total_records)
    } catch (error) {
      console.log('error', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    animalAssessmentReport()
  }, [paginationModel])

  useEffect(() => {
    if (assessmentData?.length) {
      transformAnimalData()
    }
  }, [assessmentData])

  const columns = headerList.map((header, i) => {
    if (header.key === 'default_icon') {
      return {
        field: 'Animals',
        headerName: header.label,
        pinned: 'left',
        width: 300,
        height: 131,
        sortable: false,
        columnStyle: {
          border: `1px solid ${theme.palette.customColors.customTableBorderBg}`,
          borderRight: 'none',
          p: 0,
          m: 0
        },
        disableColumnMenu: true,
        renderCell: params => (
          <CardHeader
            avatar={<img src={params.row.default_icon} alt='' style={{ width: 40, height: 40, borderRadius: '50%' }} />}
            title={
              <Typography fontWeight={600} fontSize={14} color={theme.palette.primary.OnSurface}>
                AID: {params.row.primary_animal_id}
              </Typography>
            }
            subheader={
              <>
                <Typography fontSize={13} fontWeight={500}>
                  {params.row.common_name}
                </Typography>
                <Typography fontSize={13} fontStyle='italic'>
                  {params.row.scientific_name}
                </Typography>
                <Typography fontSize={13}>Age: {params.row.age}</Typography>
                <Typography fontSize={13}>Site: {params.row.site}</Typography>
              </>
            }
          />
        )
      }
    }
    return {
      field: header.key,
      headerName: header.label,
      width: 240,
      sortable: false,
      disableColumnMenu: true,
      headerStyle: i === 1 && { position: 'sticky', left: 300, zIndex: 1000, p: 0, m: 0 },
      columnStyle: {
        height: '100px',
        border: `1px solid ${theme.palette.customColors.customTableBorderBg}`,
        borderLeft: i === 1 && 'none',
        p: 0,
        m: 0
      },
      renderCell: params => {
        const record = params?.row[header.key]
        return record ? (
          <Box sx={{ p: 4 }}>
            <Typography fontSize={14} fontWeight={600}>
              {record.value}
            </Typography>
            <Typography fontSize={12} color='textSecondary'>
              {record.date}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, backgroundColor: '#f2f2f2', height: '100%' }}></Box>
        )
      }
    }
  })

  return (
    <Card>
      <Box sx={{ display: 'flex', flexDirection: 'column', px: 4, gap: 4, my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }} variant='h5'>
            Animal Assessment Report
          </Typography>

          {/* <Typography
            onClick={() => (animalId ? getSpecificAnimalDataToExport() : getAnimalDataToExport())}
            sx={{
              fontSize: '20px',
              fontWeight: '400',
              fontFamily: 'Inter',
              color: theme.palette.primary.OnSurface,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            Download report
            <img src='/images/download1.png' alt='download icon' style={{ marginLeft: 8, width: 30, height: 30 }} />
          </Typography> */}
        </Box>
        <Box sx={{ display: 'flex', gap: '16px' }}>
          <Box
            sx={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: theme.palette.customColors.displaybgPrimary,
              borderRadius: '100px'
            }}
          >
            <Typography sx={{ fontSize: '16px', fontWeight: 500, lineHeight: '100%', letterSpacing: 0, color: '#000' }}>
              Species:
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '100%',
                letterSpacing: '0.1px',
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              African Lion (Panthera leo)
            </Typography>
            <Icon icon='fa:angle-right' fontSize={20} color={theme.palette.customColors.OnPrimaryContainer} />
          </Box>
          <Box
            sx={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: theme.palette.customColors.displaybgPrimary,
              borderRadius: '100px'
            }}
          >
            <Typography sx={{ fontSize: '16px', fontWeight: 500, lineHeight: '100%', letterSpacing: 0, color: '#000' }}>
              Assessment:
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '100%',
                letterSpacing: '0.1px',
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              Weight
            </Typography>
            <Icon icon='fa:angle-right' fontSize={20} color={theme.palette.customColors.OnPrimaryContainer} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'end', alignItems: 'center', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <TextField
              variant='outlined'
              size='small'
              placeholder='Search'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                  </InputAdornment>
                )
              }}
              sx={{
                width: '240px',
                backgroundColor: '#fff',
                ml: 4,
                borderRadius: '4px', // Applies to the container
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px' // Applies to the input field
                }
              }}
            />
          </Box>
          <Box>
            <FormControl fullWidth>
              <Autocomplete
                name='site'
                value={defaultSite}
                disablePortal
                id='site'
                options={authData?.userData?.user?.zoos[0].sites}
                getOptionLabel={option => option.site_name}
                isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                onChange={(e, val) => {
                  if (val === null) {
                    setDefaultSite(null)
                    // fetchTableData(searchValue, '')
                  } else {
                    setDefaultSite(val)
                    // fetchTableData(searchValue, val?.site_id)
                  }
                }}
                renderInput={params => (
                  <TextField
                    sx={{
                      backgroundColor: '#fff',
                      borderColor: '1px solid #C3CEC7',
                      width: '240px',
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        borderRadius: '4px'
                      },
                      '& .MuiInputLabel-root': {
                        top: -7
                      },
                      '& input': {
                        position: 'relative',
                        top: -7
                      }
                    }}
                    onChange={e => {
                      // searchSite(e.target.value)
                    }}
                    {...params}
                    label='Last 5 Records'
                    placeholder='Search & Select'
                  />
                )}
              />
            </FormControl>
          </Box>

          <>
            {isLoading ? (
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
                //  onClick={() => (animalId ? getSpecificAnimalDataToExport() : getAnimalDataToExport())}
              >
                <Icon icon='ic:round-download' fontSize={20} />
              </Box>
            )}
          </>

          {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                borderRadius: '8px',
                mr: 1
              }}
            >
              <Button
                onClick={() => setOpenFilterDrawer(true)}
                variant='outlined'
                sx={{
                  width: '129px',
                  height: '40px',
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
                  sx={{ color: '#1F515B', textTransform: 'capitalize', mr: 8, fontSize: '16px', fontWeight: 400 }}
                >
                  Filter
                </Typography>

                <Box
                  sx={{
                    position: 'absolute',
                    top: '5px',
                    right: '6px',
                    width: '29px',
                    height: '27px',
                    borderRadius: '69%',
                    backgroundColor: '#1F515B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {filterCount}
                </Box>
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ width: '100%', px: 5, mt: 2 }}>
        {columns?.length > 0 ? (
          <StickyTable
            rows={dataList}
            rowCount={total}
            rowHeight={100}
            headerHeight={50}
            pagination={true}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50]}
            rowsInView={10}
            rowsInViewOptions={[5, 10, 25]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            loading={isLoading}
            downloadExcel
            searchMode='server'
            disableColumnSorting={true}
          />
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        )}
      </Box>

      {openFilterDrawer && (
        <AssessmentReportFilterDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          openFilterDrawer={openFilterDrawer}
          setSelectedFiltersOptions={setSelectedFiltersOptions}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          setFilterCount={setFilterCount}
        />
      )}
    </Card>
  )
}

export default AnimalAssessment
