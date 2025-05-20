import { useTheme } from '@emotion/react'
import { Avatar, Box, Card, CardHeader, Grid, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { getAllSites } from 'src/lib/api/housing/sites'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'

const Listing = ({ title }) => {
  const theme = useTheme()
  const [siteList, setSiteList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  function loadServerRows(currentPage, data) {
    return data
  }

  useEffect(() => {
    const fetchSites = async () => {
      debugger
      setLoading(true)
      try {
        const params = {
          page_no: paginationModel.page + 1
        }
        const response = await getAllSites(params)
        if (response.success) {
          setTotal(response.data.total_count)
          setSiteList(loadServerRows(paginationModel.page, response.data.result))
          setLoading(false)
        } else {
          setLoading(false)
          console.error('Failed to fetch sites:', response.message)
        }
      } catch (error) {
        console.error('Error fetching sites:', error)
      }
    }

    fetchSites()
  }, [paginationModel])

  console.log('Sites >', siteList)

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 250,
      field: 'site_name',
      headerName: 'Site Name',
      renderCell: params => {
        const imageUrl = params.row.images?.[0]?.file

        return (
          <Box display='flex' alignItems='center' width='100%' gap={2}>
            {imageUrl ? (
              <Box
                component='img'
                src={imageUrl}
                alt={params.row.site_name}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  objectFit: 'cover',
                  mr: 1
                }}
              />
            ) : (
              <Avatar
                variant='square'
                sx={{
                  width: 40,
                  height: 40,
                  mr: 1,
                  borderRadius: '8px',
                  fontSize: '14px',
                  bgcolor: theme.palette.primary.main
                }}
              >
                {params.row.site_name?.charAt(0).toUpperCase() || '?'}
              </Avatar>
            )}

            <Typography
              noWrap
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px', // adjust based on image width + column width
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}
            >
              {params.row.site_name}
            </Typography>
          </Box>
        )
      }
    },
    {
      width: 200,
      field: 'species',
      headerName: 'Species',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.OnSurface,
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'Inter'
          }}
        >
          {params.row.species_count ? params.row.species_count : 0}
        </Typography>
      )
    },

    {
      width: 100,
      field: 'animals',
      headerName: 'Animals',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.OnSurface,
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'Inter'
          }}
        >
          {params.row.animal_count ? params.row.animal_count : 0}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'enclosures',
      headerName: 'Enclosures',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.OnSurface,
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'Inter'
          }}
        >
          {params.row.enclosure_count}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'sections',
      headerName: 'Sections',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.OnSurface,
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'Inter'
          }}
        >
          {params.row.section_count}
        </Typography>
      )
    },
    // {
    //   width: 200,
    //   field: 'clusters',
    //   headerName: 'clusters',
    //   align: 'center',
    //   headerAlign: 'center',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         fontSize: '14px',
    //         fontWeight: 500,
    //         fontFamily: 'Inter'
    //       }}
    //     >
    //       {''}
    //     </Typography>
    //   )
    // },
    {
      width: 150,
      field: 'incharge',
      headerName: 'In-Charge',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.incharge_name ? params.row.incharge_name : 'NA'}
        </Typography>
      )
    },
    {
      width: 100,
      field: 'actions',
      headerName: 'Actions',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Box display='flex' justifyContent='center' alignItems='center' gap={2}>
          <Box component='img' src='/images/call.png' alt='Phone' sx={{ width: 20, height: 20, cursor: 'pointer' }} />
          <Box
            component='img'
            src='/images/message.png'
            alt='Message'
            sx={{ width: 20, height: 20, cursor: 'pointer' }}
          />
        </Box>
      )
    }
  ]

  const getSlNo = index => (paginationModel?.page + 1 - 1) * paginationModel?.pageSize + index + 1

  const indexedRows = siteList?.map((row, index) => ({
    ...row,
    id: row?.site_id,
    sl_no: getSlNo(index)
  }))

  const headerAction = (
    <Box display='flex' alignItems='center' sx={{ gap: 2, mt: 2 }}>
      <Typography color={theme.palette.primary.dark} sx={{ fontSize: '14px', fontFamily: 'Inter', fontWeight: 500 }}>
        Download
      </Typography>

      {/* <DownloadIcon /> */}
      <img
        src='/images/download.png'
        // alt='Grocery Icon'
        width='20px'
        style={{ background: theme.palette.primary.dark }}
      />
    </Box>
  )

  return (
    <>
      <Card>
        <CardHeader title={title} action={headerAction} />
        <Search sx={{ p: 2 }} />

        <Grid sx={{ mx: { xs: 3, md: 5 } }}>
          <CommonTable
            onRowClick={''}
            indexedRows={indexedRows}
            total={total}
            columns={columns || []}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            handleSortModel={''}
            setPaginationModel={setPaginationModel}
            loading={loading}
            searchValue={''}
          />
        </Grid>
      </Card>
    </>
  )
}
export default Listing
