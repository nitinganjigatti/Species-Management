import { Avatar, Badge, Button, Card, CardHeader, Typography, debounce } from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"
import { useCallback, useEffect, useState } from "react"
import FallbackSpinner from "src/@core/components/spinner"
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import { GetBannerImages, getSearchTaxonomyList, getSpeciesList, getVernacularSpeciesById } from "src/lib/api/species"
import AddSpeciesSlideBar from "src/views/pages/species/SpeciesSlider"
import { Try } from "@mui/icons-material"
import toast from "react-hot-toast"

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
  const [open, setOpen] = useState(false);
  const [editVernacularNames, setEditVernacularNames] = useState([])
  const [editName, setEditName] = useState("")
  const [speciesImage, setSpeciesImage] = useState("")
  const [BannerImages , setBannerImages] = useState([])

  const [taxonomy, setTaxonomy] = useState([])

   console.log("Banner iMAGES >>" , BannerImages);

  const fetchTaxonomy = async (searchValue) => {
    try {
      const response = await getSearchTaxonomyList(searchValue);
      setTaxonomy(response?.data || []);
      setOpen(true);
    } catch (error) {
      console.error("Error fetching taxonomy list:", error);
    }
  }




  const addEventSidebarOpen = () => {
    setOpenDrawer(true)
    setEditName("")
    setEditVernacularNames([])
    setSpeciesImage("")
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
    },


  ]

  function loadServerRows(currentPage, data) {
    return data
  }



  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          zoo_id: 11
        }

        await getSpeciesList(params).then(res => {
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
    debounce(async ({ sort, q, column }) => {
      debugger
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <>
      <div>
        <Button
          size='big'
          variant='outlined'
          onClick={() => addEventSidebarOpen()}
        >
          Add Species
        </Button>
      </div>

    </>
  )


  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
  }, [fetchTableData])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleSearch = async (value) => {
    setSearchValue(value);

    try {

      await fetchTableData({ sort, searchValue: value, column: sortColumn });
    } catch (error) {
      console.error(error);
    }
  };

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.tsn,
    sl_no: getSlNo(index)
  }))


  const handleRowClick = async (params) => {
    console.log("params >>", params);
    setOpenDrawer(true);
    const tsnId = params.row.id;
    setEditName(params?.row?.complete_name);
    setSpeciesImage(params?.row?.default_icon);

    try {
      const vernacularResponse = await getVernacularSpeciesById(tsnId);
      if (vernacularResponse?.success) {
        setEditVernacularNames(vernacularResponse?.data);
        toast.success("Vernacular Names fetched successfully");
      } else {
        toast.error("Unable to fetch Vernacular Names");
      }
       debugger
      // Fetch banner images
      const bannerResponse = await GetBannerImages(tsnId);
      if (bannerResponse?.success) {
        setBannerImages(bannerResponse?.data); 
        toast.success("Banner Images fetched successfully");
      } else {
        toast.error("Unable to fetch Banner Images");
      }
    } catch (error) {
      console.log("Error:", error);
      toast.error("Error fetching data");
    }
  };

  console.log("Vernacular >>", editVernacularNames);




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
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              onPaginationModelChange={setPaginationModel}
              onRowClick={handleRowClick}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),

                  onChange: event => {
                    setSearchValue(event.target.value)

                    return handleSearch(event.target.value)
                  }
                }
              }}
            />
          </Card>
          {openDrawer &&
            <AddSpeciesSlideBar
              drawerWidth={400}
              addEventSidebarOpen={openDrawer}
              setOpenDrawer={setOpenDrawer}
              handleSidebarClose={handleSidebarClose}
              editVernacularNames={editVernacularNames}
              taxonomy={taxonomy}
              fetchTaxonomy={fetchTaxonomy}
              editName={editName}
              speciesImage={speciesImage}

            />
          }
        </>
      )}
    </>
  )
}

export default AddSpecies;