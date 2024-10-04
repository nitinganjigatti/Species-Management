import { Box } from '@mui/system'
import React, { useEffect, useState, useCallback, useContext, forwardRef } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import Router, { useRouter } from 'next/router'
import FallbackSpinner from 'src/@core/components/spinner'
import Icon from 'src/@core/components/icon'
import format from 'date-fns/format'
import addDays from 'date-fns/addDays'
import DatePicker from 'react-datepicker'
import {
  Breadcrumbs,
  Typography,
  Card,
  CardHeader,
  Avatar,
  TextField,
  Autocomplete,
  debounce,
  Grid,
  CardContent,
  CircularProgress,
  InputAdornment
} from '@mui/material'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import SpeciesfirstSection from 'src/views/pages/egg/species/speciesdetails/SpeciesfirstSection'
import { AuthContext } from 'src/context/AuthContext'
import moment from 'moment'
import { GetSpeciesList, GetEggStatusList, GetSpeciesDetails, GetSectionList } from 'src/lib/api/egg/species'
import SingleDatePicker from 'src/components/SingleDatePicker'
import ClearIcon from '@mui/icons-material/Clear'
import { styled } from '@mui/material/styles'
import { SpeciesImageCard } from 'src/components/egg/imageTextCard'

const SpeciesDetail = () => {
  const router = useRouter()
  let [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const { id, animal_id } = router.query
  const authData = useContext(AuthContext)
  const [eggDetails, setEggDetails] = useState({})
  const [eggStatusList, setEggStatusList] = useState([])
  const [eggSectionList, setEggSectionList] = useState([])
  const [siteList, setSiteList] = useState([])
  const [eggEnclosureList, setEggEnclosureList] = useState([])
  const [loading, setLoading] = useState(false)
  const [defaultSite, setDefaultSite] = useState(null)
  const [defaultEggStatus, setDefaultEggStatus] = useState(null)
  const [defaultSection, setDefaultSection] = useState(null)
  const [defaultEnclosure, setDefaultEnclosure] = useState(null)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [loader, setLoader] = useState(true)
  const [filterByEggStatusId, setFilterByEggStatusId] = useState('')
  const [filterBySiteId, setFilterBySiteId] = useState('')
  const [filterBySectionId, setFilterBySectionId] = useState('')
  const [filterByEnclosureId, setFilterByEnclosureId] = useState('')
  const [fromDate, setFromDate] = useState(null)
  const [tillDate, setTillDate] = useState(null)
  const [totaleggcount, settotalEggcount] = useState('')

  const getDetails = id => {
    try {
      GetSpeciesDetails(id).then(res => {
        if (res.success) {
          setEggDetails(res?.data)
          setLoader(false)
          settotalEggcount(res.data.total_egg)
        } else {
          setLoader(false)
        }
      })
    } catch (error) {
      setLoader(false)
      console.log('error', error)
    }
  }

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, siteId, eggstatusId, sectionId, encloureId) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sorting_by_date: 'latest_date',
          species_id: id,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          site_id: filterBySiteId ? filterBySiteId : siteId,
          status_id: filterByEggStatusId ? filterByEggStatusId : eggstatusId,
          section_id: filterBySectionId ? filterBySectionId : sectionId,
          enclosure_id: filterByEnclosureId ? filterByEnclosureId : encloureId,
          from_date: fromDate ? moment(fromDate).format('YYYY-MM-DD') : undefined,
          till_date: tillDate ? moment(tillDate).format('YYYY-MM-DD') : undefined
        }

        await GetSpeciesList({ params: params }).then(res => {
          if (res.success) {
            const formattedRows = res.data.result.map((row, index) => ({
              ...row,
              id: index + 1, // Generate a unique ID for each row
              sl_no: getSlNo(index),
              collection_date: moment(row.collection_date).format('D MMM YYYY'),
              lay_date: moment(row.lay_date).format('D MMM YYYY'),
              created_at: moment(row.created_at).format('D MMM YYYY')
            }))
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, formattedRows))
          } else {
            setRows([])
          }
        })
        setLoading(false)
      } catch (error) {
        console.log(error)
        setLoading(false)
      }
    },
    [
      paginationModel,
      id,
      filterBySiteId,
      filterByEggStatusId,
      filterBySectionId,
      filterByEnclosureId,
      fromDate,
      tillDate
    ]
  )

  useEffect(() => {
    fetchTableData(
      sort,
      searchValue,
      filterBySiteId,
      filterByEggStatusId,
      filterBySectionId,
      filterByEnclosureId,
      fromDate,
      tillDate
    )
  }, [
    fetchTableData,
    id,
    filterBySiteId,
    filterByEggStatusId,
    filterBySectionId,
    filterByEnclosureId,
    fromDate,
    tillDate
  ])

  const searchTableData = useCallback(
    debounce(async (sort, q) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    getDetails(id)
  }, [id])

  const EggStatusList = async q => {
    try {
      const params = {
        search: q,
        use_case: 'egg',
        page: 1,
        limit: 50
      }
      await GetEggStatusList({ params: params }).then(res => {
        setEggStatusList(res?.data?.egg_status)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const SectionList = async q => {
    try {
      const params = {
        search: q,
        type: 'section',
        use_case: 'egg',
        species_id: id,
        page: 1,
        limit: 50
      }
      await GetSectionList({ params: params }).then(res => {
        console.log(res, 'res')
        setEggSectionList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const EnclosureList = async q => {
    try {
      const params = {
        search: q,
        type: 'enclosure',
        use_case: 'egg',
        species_id: id,
        page: 1,
        limit: 50
      }
      await GetSectionList({ params: params }).then(res => {
        console.log(res, 'res')
        setEggEnclosureList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const SiteList = async q => {
    try {
      const params = {
        search: q,
        type: 'site',
        use_case: 'egg',
        species_id: id,
        page: 1,
        limit: 50
      }
      await GetSectionList({ params: params }).then(res => {
        console.log(res, 'res')
        setSiteList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    EggStatusList()
    SectionList()
    EnclosureList()
    SiteList()
  }, [])

  const searchEggStatus = useCallback(
    debounce(async q => {
      try {
        await EggStatusList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const searchSection = useCallback(
    debounce(async q => {
      try {
        await SectionList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const searchEnclosure = useCallback(
    debounce(async q => {
      try {
        await EnclosureList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const searchSite = useCallback(
    debounce(async q => {
      try {
        await SiteList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  function useData(rowLength, columnLength) {
    const [data, setData] = React.useState({ columns: [], rows: [] })

    React.useEffect(() => {
      const customLabels = [
        'No',
        'Egg Number',
        'Days in Incubation',
        'Stage',
        'Condition',
        'Current Weight',
        'Initial Weight',
        'Initial Size-L',
        'Initial Size-W',
        'No.Egg/Clutch',
        'Clutch id',
        'Site',
        'Nursery',
        'Enclosure',
        'Collection On',
        'Ley Date',
        'Collected by'
        // Add more labels as needed
      ]

      const customData = [
        {
          id: 1,
          sl_no: 1,
          egg_code: '',
          egg_status: '',
          days_in_incubation: '',
          Stage: '',
          egg_condition: '',
          current_weight: '',
          initial_weight: '',
          initial_length: '',
          initial_width: '',
          clutch_number: '',
          clutch_id: '',
          site_name: '',
          nursery_name: '',
          enclosure_code: '',
          collection_date: '',
          lay_date: '',
          user_full_name: '',
          created_at: '',
          user_profile_pic: ''
        }
      ]

      const fieldNames = Object.keys(customData[0]).filter(field => field !== 'egg_status')

      const columns = customLabels.map((label, index) => ({
        field: fieldNames[index + 1],
        headerName: label,
        width: index === 0 ? 2 : index === 1 ? 185 : index === customLabels.length - 1 ? 220 : 120,
        renderCell: index === 0 ? params => <div style={{ paddingLeft: '10px' }}>{params.value}</div> : undefined,
        valueGetter: params => params.row[fieldNames[index + 1]] || '-' // Add this line
      }))

      // Adding custom renderCell for "Collected by" column
      const collectedByColumn = columns.find(column => column.field === 'user_full_name')
      if (collectedByColumn) {
        collectedByColumn.renderCell = params => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              {params.row.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={params.row.user_profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' />
              )}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500 }}>
                {params.row.user_full_name}
              </Typography>
              {console.log(params, 'params')}
              <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
                Created on {moment(params.row.created_at).format('D MMM YYYY')}
              </Typography>
            </Box>
          </Box>
        )
      }

      console.log(columns, 'columns')

      // Adding custom renderCell for "Egg Number" column to display EggNumber and egg_status
      const eggnumberByColumn = columns.find(column => column.field === 'egg_code')
      if (eggnumberByColumn) {
        eggnumberByColumn.renderCell = params => (
          // <Box sx={{ display: 'flex', alignItems: 'center' }}>
          //   <Avatar
          //     variant='square'
          //     alt='Medicine Image'
          //     sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', borderRadius: '4px' }}
          //     src={params.row.image ? params.row.image : '/icons/Egg_icon.png'}
          //   >
          //     {params.row.image ? null : <Icon icon='healthicons:fruits-outline' />}
          //   </Avatar>
          //   <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          //     <Typography
          //       noWrap
          //       variant='body2'
          //       sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500', color: '#006D35' }}
          //     >
          //       {params.row.egg_code}
          //     </Typography>
          //     <Typography
          //       noWrap
          //       variant='body2'
          //       sx={{
          //         color: '#37BD69',
          //         fontSize: '13px',
          //         background: '#E1F9ED',
          //         borderRadius: '3px',
          //         fontWeight: 600,
          //         mt: 1,
          //         pb: 1,
          //         pt: 0.7,
          //         textAlign: 'center',
          //         width: '80px'
          //       }}
          //     >
          //       {params.row.egg_status}
          //     </Typography>
          //   </Box>
          // </Box>
          <SpeciesImageCard
            imgURl={params.row.default_icon}
            eggCondition={params.row.egg_condition}
            eggCode={params.row.egg_code}
            egg_status={params.row.egg_status}
            eggIcon={params.row.image ? params.row.image : '/icons/Egg_icon.png'}
          />
        )
      }

      // Adding custom renderCell for "Stage" column
      const stageColumn = columns.find(column => column.field === 'Stage')
      if (stageColumn) {
        stageColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#006D35', fontSize: 14, fontWeight: 500 }}>
            {params.row.egg_status ? params.row.egg_status : '-'}
          </Typography>
        )
      }

      // Adding custom renderCell for "Condition" column
      const conditionColumn = columns.find(column => column.field === 'egg_condition')
      if (conditionColumn) {
        conditionColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#006D35', fontSize: 14, fontWeight: 500 }}>
            {params.row.egg_condition ? params.row.egg_condition : '-'}
          </Typography>
        )
      }

      // Adding custom renderCell for "Condition" column
      const currentweightColumn = columns.find(column => column.field === 'current_weight')
      if (currentweightColumn) {
        currentweightColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#1F415B' }}>
            {params.row.current_weight ? params.row.current_weight : '-'}
            {/* |{' '}<span style={{ color: '#37BD69', fontSize: 14, fontWeight: 600 }}>-5%</span> */}
          </Typography>
        )
      }

      // Adding custom renderCell for "Condition" column
      const EnclosureColumn = columns.find(column => column.field === 'enclosure_code')
      if (EnclosureColumn) {
        EnclosureColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#006D35', fontSize: 14, fontWeight: 500 }}>
            {params.row.enclosure_code}
          </Typography>
        )
      }
      console.log(customData, 'customData')
      const rows = customData.map(data => ({
        id: data.id,
        no: data.no,
        egg_code: data.egg_code,
        days_in_incubation: data.days_in_incubation,
        Stage: data.egg_status,
        egg_condition: data.egg_condition,
        current_weight: data.current_weight,
        initial_weight: data.initial_weight,
        initial_length: data.initial_length,
        initial_width: data.initial_width,
        clutch_number: data.clutch_number,
        clutch_id: data.clutch_id,
        site_name: data.site_name,
        nursery_name: data.nursery_name,
        enclosure_code: data.enclosure_code,
        collection_date: data.collection_date,
        lay_date: data.lay_date,
        user_full_name: data.user_full_name,
        created_at: data.created_at,
        user_profile_pic: data.user_profile_pic
      }))

      setData({ columns, rows })
    }, [rowLength, columnLength])

    return data
  }

  const data = useData()

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value)
  }

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField fullWidth inputRef={ref} {...props} />
  })

  const handleFromDateChange = date => {
    console.log(date, 'date')
    setFromDate(date)
  }

  const handleTillDateChange = date => {
    setTillDate(date)
  }

  const clearClick = val => {
    if (val === 'site') {
      setFilterBySiteId('')
    } else if (val === 'section') {
      setFilterBySectionId('')
    } else if (val === 'enclosure') {
      setFilterByEnclosureId('')
    } else if (val === 'status') {
      setFilterByEggStatusId('')
    }
  }

  const testclick = () => {}

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Typography color='inherit'>Egg Module</Typography>
              <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/egg/dashboard')}>
                Dashboard
              </Typography>
              <Typography color='text.primary'>Species Egg Module</Typography>
            </Breadcrumbs>
            <SpeciesfirstSection eggDetails={eggDetails} />
          </Box>
          <Card sx={{ mt: 6 }}>
            <CardHeader title={`Eggs - ${totaleggcount}`} />
            <>
              <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', pl: 3 }}>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 250,
                      m: 2,
                      ml: 2
                    }}
                    name='site_id'
                    value={defaultSite}
                    disablePortal
                    id='site_id'
                    clearIcon={
                      <ClearIcon
                        onClick={() => {
                          clearClick('site')
                        }}
                      />
                    }
                    options={siteList?.length > 0 ? siteList : []}
                    getOptionLabel={option => option.site_name}
                    isOptionEqualToValue={(option, value) => option.site_id === value.site_id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultSite(null)
                      } else {
                        setDefaultSite(val)
                        setFilterBySiteId(val.site_id)
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        onChange={e => {
                          searchSite(e.target.value)
                        }}
                        {...params}
                        label='Site'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Autocomplete
                    sx={{
                      width: 250,
                      m: 2,
                      ml: 2
                    }}
                    name='section_id'
                    value={defaultSection}
                    disablePortal
                    id='section_id'
                    clearIcon={
                      <ClearIcon
                        onClick={() => {
                          clearClick('section')
                        }}
                      />
                    }
                    options={eggSectionList?.length > 0 ? eggSectionList : []}
                    getOptionLabel={option => option.section_name}
                    isOptionEqualToValue={(option, value) => option.section_id === value.section_id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultSection(null)
                      } else {
                        setDefaultSection(val)
                        setFilterBySectionId(val.section_id)
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        onChange={e => {
                          searchSection(e.target.value)
                        }}
                        {...params}
                        label='Section'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 250,
                      m: 2,
                      ml: 2
                    }}
                    name='enclosure_id'
                    value={defaultEnclosure}
                    disablePortal
                    id='enclosure_id'
                    clearIcon={
                      <ClearIcon
                        onClick={() => {
                          clearClick('enclosure')
                        }}
                      />
                    }
                    options={eggEnclosureList?.length > 0 ? eggEnclosureList : []}
                    getOptionLabel={option => option.user_enclosure_name}
                    isOptionEqualToValue={(option, value) => option.enclosure_id === value.enclosure_id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultEnclosure(null)
                      } else {
                        setDefaultEnclosure(val)
                        setFilterByEnclosureId(val.enclosure_id)
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        onChange={e => {
                          searchEnclosure(e.target.value)
                        }}
                        {...params}
                        label='Enclosure'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 250,
                      m: 2,
                      ml: 2
                    }}
                    name='egg_status'
                    value={defaultEggStatus}
                    disablePortal
                    id='egg_status'
                    clearIcon={
                      <ClearIcon
                        onClick={() => {
                          clearClick('status')
                        }}
                      />
                    }
                    options={eggStatusList?.length > 0 ? eggStatusList : []}
                    getOptionLabel={option => option.egg_status}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultEggStatus(null)
                      } else {
                        setDefaultEggStatus(val)
                        setFilterByEggStatusId(val.id)
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        onChange={e => {
                          searchEggStatus(e.target.value)
                        }}
                        {...params}
                        label='Egg State *'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
                <Box sx={{ mt: 2, ml: 2, width: '250px', mr: 4 }}>
                  <SingleDatePicker
                    label='From Date'
                    name='From Date'
                    date={fromDate}
                    value={fromDate}
                    onChangeHandler={handleFromDateChange}
                  />
                </Box>
                <Box sx={{ mt: 2, width: '250px', mr: 4 }}>
                  <SingleDatePicker
                    label='Till Date'
                    name='Till Date'
                    date={tillDate}
                    value={tillDate}
                    onChangeHandler={handleTillDateChange}
                    //disabled={!fromDate}
                  />
                </Box>
              </Box>
            </>
            {console.log(rows, 'rows')}
            <div style={rows.length > 1 ? { height: 900, width: '100%' } : { height: 400, width: '100%' }}>
              {console.log(data, 'data')}
              <DataGrid
                rowHeight={72}
                rows={rows}
                columns={data.columns}
                pagination
                paginationMode='server'
                rowCount={total}
                paginationModel={paginationModel}
                pageSizeOptions={[7, 10, 25, 50]}
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
              />
            </div>
          </Card>
        </>
      )}
    </>
  )
}

export default SpeciesDetail
