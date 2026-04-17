import React, { useState, useEffect, useCallback } from 'react'

import { getDietListonIngredientDtl } from 'src/lib/api/diet/getIngredients'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { Avatar, Box } from '@mui/material'

// ** MUI Imports
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router, { useRouter } from 'next/router'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

const IngredientDetialDietListTabview = ({ IngredientName, onTotalChange }) => {
  const [loader, setLoader] = useState(false)
  const router = useRouter()
  const { id } = router.query
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [sort, setSort] = useState('desc')
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])
  const [status, setStatus] = useState('1')
  const [showSwapBtn, setshowSwapBtn] = useState([])

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sortBy, q, status) => {
      try {
        setLoading(true)

        const params = {
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          sortBy,
          q,
          status
        }
        await getDietListonIngredientDtl(id, params).then(res => {
          console.log('response', res)

          // Generate uid field based on the index
          const startingIndex = paginationModel.page * paginationModel.pageSize

          let listWithId = res.data.data.result.map((el, i) => {
            return { ...el, uid: startingIndex + i + 1 }
          })
          setTotal(parseInt(res?.data?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
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
    fetchTableData(sort, searchValue, status)
  }, [fetchTableData, status])

  useEffect(() => {
    onTotalChange(total)
  }, [total, onTotalChange])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)

      fetchTableData(newModel[0].sort, searchValue, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sortBy, q, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSelectionChange = newSelection => {
    console.log('Selection changed:', newSelection)
    const selectedRowsData = newSelection.map(id => rows.find(row => row.id === id))
    console.log('Selected rows:', selectedRowsData)
    if (selectedRowsData.length > 0) {
      setshowSwapBtn(selectedRowsData)
    } else {
      setshowSwapBtn([])

      //selectedRowsData = []
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, status)
  }

  const handlechangecheck = (data, val) => {
    Router.push({
      pathname: `/diet/diet/${data?.id}`,
      query: { source: val, ingId: id }
    })
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 40,
      field: 'diet_name',
      headerName: 'DIET NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='square'
            alt='Recipe Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '4px' }}
            src={params.row.image ? params.row.image : '/icons/icon_diet_fill.png'}
          ></Avatar>

          <Box
            sx={{ display: 'flex', flexDirection: 'column' }}
            onClick={() => handlechangecheck(params.row, 'ingdetail')}
          >
            <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.diet_name ? params.row.diet_name : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 40,
      field: 'diet_no',
      headerName: 'DIET NO',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.diet_no ? params.row.diet_no : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <div>
              {/* {showSwapBtn.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Button size='small' variant='contained' sx={{ px: 4, py: 2, cursor: 'pointer' }}>
                    <Icon icon='mdi:add' fontSize={20} />
                    &nbsp; SWAP {IngredientName}
                  </Button>
                </div>
              )  */}
              <Grid container sx={{ mt: 2, justifyContent: 'flex-start' }}>
                <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                  <MUISearch
                    value={searchValue}
                    onChange={e => handleSearch(e.target.value)}
                    onClear={() => handleSearch('')}
                    placeholder='Search…'
                  />
                </Grid>
              </Grid>

              <CommonTable
                indexedRows={indexedRows === undefined ? [] : indexedRows}
                total={total}
                columns={columns}
                paginationModel={paginationModel}
                handleSortModel={handleSortModel}
                setPaginationModel={setPaginationModel}
                loading={loading}
                columnVisibilityModel={{
                  sl_no: false
                }}
                searchValue={searchValue}
                handleSearchOverride={handleSearch}
              />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <Grid container spacing={6}>
        <Grid item size={{ xs: 12 }}>
          <TabContext value={status}>
            <TabList onChange={handleChange}>
              {/* <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} /> */}
              <Tab value='1' label={<TabBadge label='Active' totalCount={status === '1' ? total : null} />} />
              <Tab value='0' label={<TabBadge label='Inactive' totalCount={status === '0' ? total : null} />} />
              {/* <Tab
              value='disputed'
              label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
            /> */}
            </TabList>
            {/* <TabPanel value='all'>{tableData()}</TabPanel> */}
            <TabPanel value='1'>{tableData()}</TabPanel>
            <TabPanel value='0'>{tableData()}</TabPanel>
            {/* <TabPanel value='disputed'>{tableData()}</TabPanel> */}
          </TabContext>
        </Grid>
      </Grid>
    </>
  )
}

export default IngredientDetialDietListTabview
