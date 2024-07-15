import { Box } from '@mui/system'
import React, { useEffect, useState, useCallback } from 'react'
import { GetEggDetails } from 'src/lib/api/egg/egg'
import { DataGrid } from '@mui/x-data-grid'
import Router, { useRouter } from 'next/router'
import FallbackSpinner from 'src/@core/components/spinner'
import Icon from 'src/@core/components/icon'
import { Breadcrumbs, Typography, Card, CardHeader, Avatar, TextField, Autocomplete, debounce } from '@mui/material'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import SpeciesfirstSection from 'src/views/pages/egg/species/speciesdetails/SpeciesfirstSection'
import { GetEggList } from 'src/lib/api/egg/egg'
import { GetNurseryList } from 'src/lib/api/egg/nursery'

const SpeciesDetail = () => {
  const router = useRouter()
  let [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 })
  const { id, animal_id } = router.query
  const [eggDetails, setEggDetails] = useState({})
  const [nurseryList, setNurseryList] = useState([])
  const [loading, setLoading] = useState(false)
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [loader, setLoader] = useState(true)
  const [filterByNurseryId, setFilterByNurseryId] = useState('')

  const getDetails = id => {
    // setLoader(true)
    try {
      GetEggDetails(id).then(res => {
        if (res.success) {
          setEggDetails(res?.data)
          setLoader(false)
        } else {
          setLoader(false)
        }
      })
    } catch (error) {
      setLoader(false)
      console.log('error', error)
    }
  }

  const fetchTableData = useCallback(
    async (sort, q, nurseryId) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sorting_by_date: 'latest_date',

          // sortColumn,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,

          nursery_id: filterByNurseryId ? filterByNurseryId : nurseryId
        }

        await GetEggList({ params: params }).then(res => {
          // console.log('res :>> ', res)

          // let listWithId = res.data.result.map((el, i) => {
          //   return { ...el, uid: i + 1 }
          // })
          if (res.success) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res.data.result))
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
    [paginationModel]
  )

  useEffect(() => {
    // debugger
    fetchTableData(sort, searchValue, filterByNurseryId)
  }, [fetchTableData, filterByNurseryId])

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
  }, [])

  const NurseryList = async q => {
    try {
      const params = {
        // type: ['length', 'weight'],
        search: q,
        page: 1,
        limit: 50
      }
      await GetNurseryList({ params: params }).then(res => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    NurseryList()
  }, [])

  const searchNursery = useCallback(
    debounce(async q => {
      try {
        await NurseryList(q)
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
          no: 1,
          EggNumber: '0273 / 24',
          EggNumberValue: 'Infertile',
          DaysinIncubation: 2,
          Stage: 'Infertile',
          Condition: 'Warm',
          CurrentWeight: '330g',
          InitialWeight: '315g',
          InitialSizeL: '33.44 mm',
          InitialSizeW: '222.34 mm',
          NoEggClutch: 3,
          Clutchid: 1234,
          Site: 'site name',
          Nursery: 'nursery name',
          Enclosure: '24 D',
          CollectionOn: '1 Mar 2024',
          LeyDate: '1 Apr 2024',
          CollectedBy: 'Jordan Steve',
          CreatedOn: '24 Mar 2024'
        },
        {
          id: 2,
          no: 2,
          EggNumber: '0273 / 24',
          EggNumberValue: 'Infertile',
          DaysinIncubation: 3,
          Stage: 'Infertile',
          Condition: 'Warm',
          CurrentWeight: '330g',
          InitialWeight: '315g',
          InitialSizeL: '313.44 mm',
          InitialSizeW: '22.34 mm',
          NoEggClutch: 3,
          Clutchid: 1234,
          Site: 'site name',
          Nursery: 'nursery name',
          Enclosure: '24 D',
          CollectionOn: '1 Mar 2024',
          LeyDate: '1 Apr 2024',
          CollectedBy: 'Jordan Steve',
          CreatedOn: '24 Mar 2024'
        },
        {
          id: 3,
          no: 3,
          EggNumber: '0273 / 24',
          EggNumberValue: 'Infertile',
          DaysinIncubation: 4,
          Stage: 'Infertile',
          Condition: 'Warm',
          CurrentWeight: '330g',
          InitialWeight: '325g',
          InitialSizeL: '33.44 mm',
          InitialSizeW: '222.34 mm',
          NoEggClutch: 3,
          Clutchid: 1234,
          Site: 'site name',
          no: 3,
          Nursery: 'nursery name',
          Enclosure: '24 D',
          CollectionOn: '1 Mar 2024',
          LeyDate: '1 Apr 2024',
          CollectedBy: 'Jordan Steve',
          CreatedOn: '24 Mar 2024'
        },
        {
          id: 4,
          no: 4,
          EggNumber: '0273 / 24',
          EggNumberValue: 'Infertile',
          DaysinIncubation: 5,
          Stage: 'Infertile',
          Condition: 'Warm',
          CurrentWeight: '310g',
          InitialWeight: '315g',
          InitialSizeL: '32.44 mm',
          InitialSizeW: '52.34 mm',
          NoEggClutch: 3,
          Clutchid: 1234,
          Site: 'site name',
          Nursery: 'nursery name',
          Enclosure: '24 D',
          CollectionOn: '1 Mar 2024',
          LeyDate: '1 Apr 2024',
          CollectedBy: 'Jordan Steve',
          CreatedOn: '24 Mar 2024'
        }
      ]

      const fieldNames = Object.keys(customData[0]).filter(field => field !== 'EggNumberValue')

      const columns = customLabels.map((label, index) => ({
        field: fieldNames[index + 1],
        headerName: label,
        width: index === 0 ? 2 : index === 1 ? 155 : index === customLabels.length - 1 ? 220 : 100,
        renderCell: index === 0 ? params => <div style={{ paddingLeft: '10px' }}>{params.value}</div> : undefined
      }))

      // Adding custom renderCell for "Collected by" column
      const collectedByColumn = columns.find(column => column.field === 'CollectedBy')
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
              {params.row.created_by_user?.profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={params.row.created_by_user?.profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' />
              )}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500 }}>
                {params.value}
              </Typography>
              <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
                Created on {params.row.CreatedOn}
              </Typography>
            </Box>
          </Box>
        )
      }

      // Adding custom renderCell for "Egg Number" column to display EggNumber and EggNumberValue
      const eggnumberByColumn = columns.find(column => column.field === 'EggNumber')
      if (eggnumberByColumn) {
        eggnumberByColumn.renderCell = params => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', borderRadius: '4px' }}
              src={params.row.image ? params.row.image : '/icons/icon_ingredient_fill.png'}
            >
              {params.row.image ? null : <Icon icon='healthicons:fruits-outline' />}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                noWrap
                variant='body2'
                sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500', color: '#006D35' }}
              >
                {params.value}
              </Typography>
              <Typography
                noWrap
                variant='body2'
                sx={{
                  color: '#37BD69',
                  fontSize: '13px',
                  background: '#E1F9ED',
                  pl: 2,
                  borderRadius: '3px',
                  fontWeight: 600,
                  mt: 1
                }}
              >
                {params.row.EggNumberValue}
              </Typography>
            </Box>
          </Box>
        )
      }

      // Adding custom renderCell for "Stage" column
      const stageColumn = columns.find(column => column.field === 'Stage')
      if (stageColumn) {
        stageColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#006D35', fontSize: 14, fontWeight: 500 }}>
            {params.value}
          </Typography>
        )
      }

      // Adding custom renderCell for "Condition" column
      const conditionColumn = columns.find(column => column.field === 'Condition')
      if (conditionColumn) {
        conditionColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#006D35', fontSize: 14, fontWeight: 500 }}>
            {params.value}
          </Typography>
        )
      }

      // Adding custom renderCell for "Condition" column
      const currentweightColumn = columns.find(column => column.field === 'CurrentWeight')
      if (currentweightColumn) {
        currentweightColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#1F415B' }}>
            {params.value} | <span style={{ color: '#37BD69', fontSize: 14, fontWeight: 600 }}>-5%</span>
          </Typography>
        )
      }

      // Adding custom renderCell for "Condition" column
      const EnclosureColumn = columns.find(column => column.field === 'Enclosure')
      if (EnclosureColumn) {
        EnclosureColumn.renderCell = params => (
          <Typography noWrap variant='body2' sx={{ color: '#006D35', fontSize: 14, fontWeight: 500 }}>
            {params.value}
          </Typography>
        )
      }

      setData({
        rows: customData,
        columns
      })
    }, [])

    return data
  }

  const data = useData()

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, status)
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Typography color='inherit'>Egg Module</Typography>
              <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/egg/eggs')}>
                Dashboard
              </Typography>
              <Typography color='text.primary'>Species Egg Module</Typography>
            </Breadcrumbs>
            <SpeciesfirstSection />
          </Box>
          <Card sx={{ mt: 6 }}>
            <CardHeader title='Eggs' />
            <>
              {/* <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', pl: 3 }}>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 200,
                      m: 2,
                      ml: 2
                    }}
                    name='nursery'
                    value={defaultNursery}
                    disablePortal
                    id='nursery'
                    options={nurseryList?.length > 0 ? nurseryList : []}
                    getOptionLabel={option => option.nursery_name}
                    isOptionEqualToValue={(option, value) => option.nursery_id === value.nursery_id}
                    onChange={(e, val) => {
                      if (val === null) {
                        setDefaultNursery(null)

                        // return onChange('')
                      } else {
                        setDefaultNursery(val)

                        // setValue('room', '')
                        setFilterByNurseryId(val.nursery_id)

                        // return onChange(val.nursery_id)
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        onChange={e => {
                          searchNursery(e.target.value)
                        }}
                        {...params}
                        label='Site *'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 200,
                      m: 2,
                      ml: 2
                    }}
                    name='nursery'
                    //value={defaultNursery}
                    disablePortal
                    id='nursery'
                    // options={nurseryList?.length > 0 ? nurseryList : []}
                    // getOptionLabel={option => option.nursery_name}
                    // isOptionEqualToValue={(option, value) => option.nursery_id === value.nursery_id}
                    // onChange={(e, val) => {
                    //   if (val === null) {
                    //     setDefaultNursery(null)

                    //     // return onChange('')
                    //   } else {
                    //     setDefaultNursery(val)

                    //     // setValue('room', '')
                    //     setFilterByNurseryId(val.nursery_id)

                    //     // return onChange(val.nursery_id)
                    //   }
                    // }}
                    renderInput={params => (
                      <TextField
                        // onChange={e => {
                        //   searchNursery(e.target.value)
                        // }}
                        {...params}
                        label='Section *'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 200,
                      m: 2,
                      ml: 2
                    }}
                    name='nursery'
                    //value={defaultNursery}
                    disablePortal
                    id='nursery'
                    // options={nurseryList?.length > 0 ? nurseryList : []}
                    // getOptionLabel={option => option.nursery_name}
                    // isOptionEqualToValue={(option, value) => option.nursery_id === value.nursery_id}
                    // onChange={(e, val) => {
                    //   if (val === null) {
                    //     setDefaultNursery(null)

                    //     // return onChange('')
                    //   } else {
                    //     setDefaultNursery(val)

                    //     // setValue('room', '')
                    //     setFilterByNurseryId(val.nursery_id)

                    //     // return onChange(val.nursery_id)
                    //   }
                    // }}
                    renderInput={params => (
                      <TextField
                        // onChange={e => {
                        //   searchNursery(e.target.value)
                        // }}
                        {...params}
                        label='Enclosure *'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 200,
                      m: 2,
                      ml: 2
                    }}
                    name='nursery'
                    //value={defaultNursery}
                    disablePortal
                    id='nursery'
                    // options={nurseryList?.length > 0 ? nurseryList : []}
                    // getOptionLabel={option => option.nursery_name}
                    // isOptionEqualToValue={(option, value) => option.nursery_id === value.nursery_id}
                    // onChange={(e, val) => {
                    //   if (val === null) {
                    //     setDefaultNursery(null)

                    //     // return onChange('')
                    //   } else {
                    //     setDefaultNursery(val)

                    //     // setValue('room', '')
                    //     setFilterByNurseryId(val.nursery_id)

                    //     // return onChange(val.nursery_id)
                    //   }
                    // }}
                    renderInput={params => (
                      <TextField
                        // onChange={e => {
                        //   searchNursery(e.target.value)
                        // }}
                        {...params}
                        label='Date *'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Autocomplete
                    sx={{
                      width: 200,
                      m: 2,
                      ml: 2
                    }}
                    name='nursery'
                    //value={defaultNursery}
                    disablePortal
                    id='nursery'
                    // options={nurseryList?.length > 0 ? nurseryList : []}
                    // getOptionLabel={option => option.nursery_name}
                    // isOptionEqualToValue={(option, value) => option.nursery_id === value.nursery_id}
                    // onChange={(e, val) => {
                    //   if (val === null) {
                    //     setDefaultNursery(null)

                    //     // return onChange('')
                    //   } else {
                    //     setDefaultNursery(val)

                    //     // setValue('room', '')
                    //     setFilterByNurseryId(val.nursery_id)

                    //     // return onChange(val.nursery_id)
                    //   }
                    // }}
                    renderInput={params => (
                      <TextField
                        // onChange={e => {
                        //   searchNursery(e.target.value)
                        // }}
                        {...params}
                        label='Egg State *'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </Box>
              </Box> */}
            </>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                {...data}
                columnBufferPx={100}
                rowCount={total}
                pagination
                rowHeight={72}
                sortingMode='server'
                paginationMode='server'
                pageSizeOptions={[5, 10, 25, 50]}
                slots={{ toolbar: ServerSideToolbarWithFilter }}
                loading={loading}
                onPaginationModelChange={setPaginationModel}
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
