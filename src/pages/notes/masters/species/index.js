import { Avatar, Badge, Button, Card, CardHeader, Typography, debounce } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import {
  AddBannerImages,
  GetBannerImages,
  getSearchTaxonomyList,
  getSpeciesList,
  getVernacularSpeciesById
} from 'src/lib/api/species'
import AddSpeciesSlideBar from 'src/views/pages/species/SpeciesSlider'
import { Try } from '@mui/icons-material'
import toast from 'react-hot-toast'

const AddSpecies = () => {
  const [loader, setLoader] = useState(false)
  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('complete_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [open, setOpen] = useState(false)
  const [editVernacularNames, setEditVernacularNames] = useState([])
  const [editName, setEditName] = useState('')
  const [commonName, setCommonName] = useState('')
  const [speciesImage, setSpeciesImage] = useState('')
  const [tsnId, setTsnId] = useState('')
  const [editCommonId, setEditCommonId] = useState('')
  const [taxonomy, setTaxonomy] = useState([])
  const [bannerImages, setBannerImages] = useState([])

  const fetchTaxonomy = async searchValue => {
    try {
      const response = await getSearchTaxonomyList(searchValue)
      setTaxonomy(response?.data || [])
      setOpen(true)
    } catch (error) {
      console.error('Error fetching taxonomy list:', error)
    }
  }

  const addEventSidebarOpen = () => {
    setOpenDrawer(true)
    setEditName('')
    setEditVernacularNames([])
    setSpeciesImage('')
    setBannerImages([])
    setTaxonomy([])
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const columns = [
    {
      flex: 0.4,
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
      flex: 0.4,
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
      flex: 0.4,
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
    async (sort, q, sortColumn) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          zoo_id: 11
        }

        await getSpeciesList(params).then(res => {
          console.log('Response >>>', res)
          setTotal(parseInt(res?.data?.taxonomy_total))

          setRows(loadServerRows(paginationModel.page, res?.data?.taxonomy_list))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <>
      <div>
        <Button size='big' variant='outlined' onClick={() => addEventSidebarOpen()}>
          Add Species
        </Button>
      </div>
    </>
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const handleSortModel = async newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
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

  console.log('TSN iD>>', tsnId)

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
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
          {openDrawer && (
            <AddSpeciesSlideBar
              drawerWidth={400}
              addEventSidebarOpen={openDrawer}
              setOpenDrawer={setOpenDrawer}
              handleSidebarClose={handleSidebarClose}
              editVernacularNames={editVernacularNames}
              fetchTableData={fetchTableData}
              fetchTaxonomy={fetchTaxonomy}
              taxonomy={taxonomy}
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
