import { Avatar, Button, Grid, Tooltip, Typography, debounce } from '@mui/material'
import { useCallback, useContext, useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import { AuthContext } from 'src/context/AuthContext'

import { getSpeciesList } from 'src/lib/api/species'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Chip from '@mui/material/Chip'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import { useRouter } from 'next/router'
import Utility from 'src/utility'

const AddSpecies = () => {
  const authData = useContext(AuthContext)
  const [loader, setLoader] = useState(false)
  const router = useRouter()
  const { status: urlStatus } = router.query

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('complete_name')
  const [status, setStatus] = useState(urlStatus === 'hybrid' ? 'hybrid' : 'species')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const handleChange = (event, newValue) => {
    setStatus(newValue)
    router.push(
      {
        pathname: router.pathname,
        query: { status: newValue }
      },
      undefined,
      { shallow: true }
    )
  }

  useEffect(() => {
    if (urlStatus === 'hybrid') {
      setStatus('hybrid')
    } else if (urlStatus === 'species' || !urlStatus) {
      setStatus('species')
    }
  }, [urlStatus])

  const columns = [
    {
      minWidth: 80,
      field: 'sl_no',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      minWidth: 160,
      field: 'default_icon',
      headerName: 'Species Image',
      renderCell: params => (
        <Avatar
          variant='circular'
          alt='Species Image'
          sx={{ width: 40, height: 40 }}
          src={params.row.default_icon ? `${params.row.default_icon}` : '/images/tablet.png'}
        />
      )
    },
    {
      flex: status === 'hybrid' ? 0.4 : 0.2,
      minWidth: 200,
      field: 'default_common_name',
      headerName: 'Common Name',
      renderCell: params => (
        <Tooltip title={params.row.default_common_name}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params.row.default_common_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: status === 'hybrid' ? 0.4 : 0.2,
      minWidth: 200,
      field: 'complete_name',
      headerName: 'Scientific Name',
      renderCell: params => (
        <Tooltip title={params.row.complete_name}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params.row.complete_name}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status) => {
      try {
        setLoading(true)

        let params = {
          sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          zoo_id: 11
        }

        if (status === 'hybrid') {
          params.is_hybrid = true
        } else {
          params.is_hybrid = false
        }

        const res = await getSpeciesList(params)

        if (res?.success) {
          setTotal(parseInt(res?.data?.taxonomy_total))
          setRows(res?.data?.taxonomy_list || [])
        } else {
          setTotal(0)
          setRows([])
        }
      } catch (error) {
        setTotal(0)
        setRows([])
      } finally {
        setLoading(false)
      }
    },
    [paginationModel.page, paginationModel.pageSize]
  )

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      await fetchTableData(sort, q, column, status)
    }, 1000),
    [fetchTableData, status]
  )

  const handleExport = async () => {
    const params = {
      sort,
      q: searchValue,
      sortColumn,
      zoo_id: 11,
      response_type: 'csv'
    }

    if (status === 'hybrid') {
      params.is_hybrid = true
    } else {
      params.is_hybrid = false
    }

    try {
      setExportLoading(true)
      const response = await getSpeciesList(params)
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response?.data)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const headerAction = (
    <>
      {authData?.userData?.permission?.user_settings?.add_taxonomy && (
        <Button size='large' variant='outlined' onClick={() => handleAddSpecies()}>
          {status === 'species' ? 'Add Species' : 'Add Hybrid'}
        </Button>
      )}
    </>
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
  }, [fetchTableData, status, paginationModel.page, paginationModel.pageSize])

  const handleSortModel = async newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      await fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    }
  }

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index),
    sl_no: getSlNo(index)
  }))

  const handleRowClick = async params => {
    router.push({
      pathname: 'species/addSpecies/',
      query: {
        id: params.row.tsn,
        status: status,
        name: params.row.default_common_name
      }
    })
  }

  const handleAddSpecies = async () => {
    router.push({
      pathname: 'species/addSpecies/',
      query: {
        status: status
      }
    })
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Grid sx={{ mb: 3 }}>
            <TabContext sx={{ cursor: 'pointer' }} value={status}>
              <TabList onChange={handleChange}>
                <Tab value='species' label='Species' />
                <Tab value='hybrid' label='Hybrid' />
              </TabList>
            </TabContext>
          </Grid>

          <PageCardLayout title={status === 'species' ? 'Species' : 'Hybrid'} action={headerAction}>
            <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
                <MUISearch
                  sx={{
                    width: {
                      xs: '100%',
                      sm: '250px'
                    }
                  }}
                  placeholder='Search...'
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                  value={searchValue}
                />
              </Grid>
              <Grid item>
                <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} />
              </Grid>
            </Grid>

            <CommonTable
              autoHeight
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              onCellClick={handleRowClick}
              loading={loading}
            />
          </PageCardLayout>
        </>
      )}
    </>
  )
}

export default AddSpecies
