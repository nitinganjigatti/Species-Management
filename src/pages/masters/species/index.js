import { Avatar, Badge, Button, Card, CardHeader, Grid, Typography, debounce } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useContext, useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import { AuthContext } from 'src/context/AuthContext'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import {
  AddBannerImages,
  GetBannerImages,
  getSearchTaxonomyList,
  getSpeciesList,
  getVernacularSpeciesById
} from 'src/lib/api/species'
import AddSpeciesSlideBar from 'src/views/pages/species/SpeciesSlider'
import toast from 'react-hot-toast'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Chip from '@mui/material/Chip'

const AddSpecies = () => {
  const authData = useContext(AuthContext)
  const [loader, setLoader] = useState(false)

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('complete_name')
  const [status, setStatus] = useState('species')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [open, setOpen] = useState(false)
  const [breedList, setBreedList] = useState([])
  const [editVernacularNames, setEditVernacularNames] = useState([])
  const [editName, setEditName] = useState('')
  const [commonName, setCommonName] = useState('')
  const [speciesImage, setSpeciesImage] = useState('')
  const [tsnId, setTsnId] = useState('')
  const [editCommonId, setEditCommonId] = useState('')
  const [taxonomy, setTaxonomy] = useState([])
  const [bannerImages, setBannerImages] = useState([])

  console.log('Status >>', status)

  // const fetchTaxonomy = async searchValue => {
  //   try {
  //     const response = await getSearchTaxonomyList(searchValue)
  //     setTaxonomy(response?.data || [])
  //     setOpen(true)
  //   } catch (error) {
  //     console.error('Error fetching taxonomy list:', error)
  //   }
  // }

  const addEventSidebarOpen = () => {
    setOpenDrawer(true)
    setEditName('')
    setEditVernacularNames([])
    setSpeciesImage('')
    setCommonName('')
    setBannerImages([])
    setTaxonomy([])
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleChange = (event, newValue) => {
    setStatus(newValue)
  }

  const columns = [
    {
      flex: 0.2,
      minWidth: 20,
      field: 'default_icon',
      headerName: 'Species Image',
      renderCell: params => (
        <Badge
          sx={{ ml: 2, cursor: 'pointer' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <Avatar
            variant='square'
            alt='Species Image'
            sx={{ width: 40, height: 40 }}
            src={params.row.default_icon ? `${params.row.default_icon}` : '/images/tablet.png'}
          />
        </Badge>
      )
    },

    {
      flex: status === 'hybrid' ? 0.4 : 0.2,
      minWidth: 20,
      field: 'default_common_name',
      headerName: 'Common Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.default_common_name}
        </Typography>
      )
    },

    {
      flex: status === 'hybrid' ? 0.4 : 0.2,
      minWidth: 20,
      field: 'complete_name',
      headerName: 'Scientific Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.complete_name}
        </Typography>
      )
    }
  ]

  function loadServerRows(currentPage, data) {
    return data
  }

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
        console.log(status, 'status1')
        if (status === 'hybrid') {
          params.is_hybrid = true
        } else {
          params.is_hybrid = false
        }

        await getSpeciesList(params)
          .then(res => {
            console.log('Response >>>', res)
            setTotal(parseInt(res?.data?.taxonomy_total))
            setRows(loadServerRows(paginationModel.page, res?.data?.taxonomy_list))
          })
          .catch(error => {
            console.error('Error fetching data:', error)
          })
          .finally(() => {
            setLoading(false)
          })
      } catch (e) {
        console.error('Error:', e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <>
      {authData?.userData?.permission?.user_settings?.add_taxonomy && (
        <div>
          {status === 'species' ? (
            <Button size='big' variant='outlined' onClick={() => addEventSidebarOpen()}>
              Add Species
            </Button>
          ) : (
            <Button size='big' variant='outlined' onClick={() => addEventSidebarOpen()}>
              Add Hybrid
            </Button>
          )}
        </div>
      )}
    </>
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
  }, [fetchTableData, status])

  const handleSortModel = async newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status)
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.tsn,
    sl_no: getSlNo(index)
  }))

  const handleRowClick = async params => {
    console.log('params >>', params)
    setOpenDrawer(true)
    const tsnId = params.row.id
    setTsnId(params.row.id)
    setEditName(params?.row?.complete_name)
    setCommonName(params?.row?.default_common_name)
    setEditCommonId(params?.row?.default_common_name_id)
    setSpeciesImage(params?.row?.default_icon)

    try {
      const vernacularResponse = await getVernacularSpeciesById(tsnId)
      if (vernacularResponse?.success) {
        console.log('Vernacular Names:', vernacularResponse.data)
        setEditVernacularNames(vernacularResponse.data)
      } else {
        toast.error('Unable to fetch Vernacular Names')
      }

      const addBannerResponse = await GetBannerImages(tsnId)

      if (addBannerResponse?.success) {
        console.log('Banner images added successfully:', addBannerResponse.data)

        // Use a Set to filter out duplicate image URLs
        const seenUrls = new Set()

        const uniqueBannerImages = addBannerResponse.data.filter(item => {
          if (!seenUrls.has(item.image_url)) {
            seenUrls.add(item.image_url)
            
return true
          }
          
return false
        })

        console.log('Unique Banner images:', uniqueBannerImages)
        console.log('Status >>', status)

        setBannerImages(uniqueBannerImages)
      } else {
        // Handle error response
        console.log('Failed to add banner images:', addBannerResponse?.error)
        toast.error('Failed to add banner images')
      }
    } catch (error) {
      console.log('Error:', error)
      toast.error('Error fetching data')
    }
  }

  console.log('Vernacular >>', editVernacularNames)

  const handleHybridRowClick = async params => {
    console.log('Params >>', params)
    setOpenDrawer(true)
    setTsnId(params.row.tsn)
    setEditName(params.row?.complete_name)
    setCommonName(params.row.default_common_name)
    setSpeciesImage(params?.row?.default_icon)

    try {
      const addBannerResponse = await GetBannerImages(params.row.tsn)
      if (addBannerResponse?.success) {
        console.log('Banner images added successfully:', addBannerResponse.data)

        // Use a Set to filter out duplicate image URLs
        const seenUrls = new Set()

        const uniqueBannerImages = addBannerResponse.data.filter(item => {
          if (!seenUrls.has(item.image_url)) {
            seenUrls.add(item.image_url)
            
return true
          }
          
return false
        })

        console.log('Unique Banner images:', uniqueBannerImages)
        console.log('Status >>', status)

        setBannerImages(uniqueBannerImages)
      } else {
        // Handle error response
        console.log('Failed to add banner images:', addBannerResponse?.error)
        toast.error('Failed to add banner images')
      }
    } catch (error) {
      console.log('Error:', error)
      toast.error('Error fetching data')
    }
  }

  console.log('TSN iD>>', tsnId)

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Grid>
            <TabContext sx={{ cursor: 'pointer' }} value={status}>
              <TabList onChange={handleChange}>
                <Tab value='species' label={<TabBadge label='Species' />} />
                <Tab value='hybrid' label={<TabBadge label='Hybrid' />} />
              </TabList>
              <TabPanel sx={{ cursor: 'pointer' }} value='1'></TabPanel>
              <TabPanel sx={{ cursor: 'pointer' }} value='0'></TabPanel>
              <TabPanel sx={{ cursor: 'pointer' }} value=''></TabPanel>
              {/* <TabPanel value='disputed'>{tableData()}</TabPanel> */}
            </TabContext>
          </Grid>
          {status === 'species' ? (
            <Card>
              <CardHeader title='Species' action={headerAction} />

              <DataGrid
                autoHeight
                pagination
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                columns={columns}
                sortingMode='server'
                pageSizeOptions={[7, 10, 25, 50]}
                paginationModel={paginationModel}
                onSortModelChange={handleSortModel}
                slots={{ toolbar: ServerSideToolbar }}
                onPaginationModelChange={setPaginationModel}
                onCellClick={handleRowClick}
                loading={loading}
                slotProps={{
                  toolbar: {
                    value: searchValue,
                    clearSearch: () => handleSearch(''),
                    onChange: event => handleSearch(event.target.value)
                  }
                }}
              />
            </Card>
          ) : (
            <Card>
              <CardHeader title='Hybrid' action={headerAction} />

              <DataGrid
                autoHeight
                pagination
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                columns={columns}
                sortingMode='server'
                pageSizeOptions={[7, 10, 25, 50]}
                paginationModel={paginationModel}
                onSortModelChange={handleSortModel}
                slots={{ toolbar: ServerSideToolbar }}
                onPaginationModelChange={setPaginationModel}
                onCellClick={handleHybridRowClick}
                loading={loading}
                slotProps={{
                  toolbar: {
                    value: searchValue,
                    clearSearch: () => handleSearch(''),
                    onChange: event => handleSearch(event.target.value)
                  }
                }}
              />
            </Card>
          )}

          {openDrawer && (
            <AddSpeciesSlideBar
              drawerWidth={400}

              // addEventSidebarOpen={openDrawer}
              openDrawer={openDrawer}
              status={status}

              // setStatus={setStatus}
              // open={open}
              setOpenDrawer={setOpenDrawer}
              handleSidebarClose={handleSidebarClose}
              editVernacularNames={editVernacularNames}
              fetchTableData={fetchTableData}

              // fetchTaxonomy={fetchTaxonomy}
              // taxonomy={taxonomy}
              editName={editName}
              tsnId={tsnId}
              commonName={commonName}
              editCommonId={editCommonId}
              speciesImage={speciesImage}
              rows={rows}
              BannerImages={bannerImages}
              setBannerImages={setBannerImages}
            />
          )}
        </>
      )}
    </>
  )
}

export default AddSpecies
