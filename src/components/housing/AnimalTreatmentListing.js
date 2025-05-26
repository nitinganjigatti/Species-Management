import { useTheme } from '@emotion/react'
import { Avatar, Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import { format, formatDistanceToNow } from 'date-fns'

// import { fetchMortality, setParams } from 'src/store/slices/housing/speciesSlice'
import { ExportButton } from 'src/views/utility/render-snippets'
import { debounce } from 'lodash'
import ListingHeader from '../../views/pages/housing/utils/ListingHeader'
import { fetchAnimals, setParams } from 'src/store/slices/housing/animalTreatmentSlice'

const AnimalTreatmentListing = () => {
  const [downloading, setDownloading] = useState(false)

  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()
  const dispatch = useDispatch()

  const {
    list: animalTreatmentList,
    loading,
    total,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search
  } = useSelector(state => state.animalTreatment)

  useEffect(() => {
    console.log('animalTreatmentList', animalTreatmentList)
  }, [animalTreatmentList])

  // Debounced fetchSpecies call whenever parameters change
  const debouncedFetch = useCallback(
    debounce(() => {
      debugger
      dispatch(
        fetchAnimals({
          site_id: id

          //  type: 'animals'
        })
      )
    }, 500),
    [dispatch, page, pageSize, sortBy, sortOrder, search, id]
  )

  useEffect(() => {
    if (id) debouncedFetch()

    return () => debouncedFetch.cancel()
  }, [debouncedFetch, id, page])

  const handlePaginationModelChange = model => {
    const newPage = model.page + 1
    const newPageSize = model.pageSize

    if (newPage !== page || newPageSize !== pageSize) {
      dispatch(setParams({ page: newPage, pageSize: newPageSize }))
    }
  }

  const handleSearch = useCallback(
    value => {
      dispatch(setParams({ search: value, page: 1 }))
    },
    [dispatch]
  )

  const handleSortModelChange = sortModel => {
    console.log('sortModel', sortModel)
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      dispatch(setParams({ sortBy: field, sortOrder: sort, page: 1 }))
    } else {
      dispatch(setParams({ sortBy: '', sortOrder: '' }))
    }
  }

  const handleDownload = () => {
    console.log('Downloading...')
  }

  const getSlNo = index => (page - 1) * pageSize + index + 1

  const indexedRows = animalTreatmentList?.map((row, index) => ({
    ...row,
    id: row?.animal_id,
    sl_no: getSlNo(index)
  }))

  const handleRowClick = params => {
    // router.push({
    //   pathname: `/housing/sites/${params.row.site_id}`
    // })
  }

  const columns = [
    {
      width: 100,
      field: 'sl_no',
      headerName: 'NO',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 300,
      field: 'common_name',
      headerName: 'SPECIES',
      renderCell: params => {
        const imageUrl = params.row.default_icon

        return (
          <Box display='flex' alignItems='center' width='100%' gap={2}>
            {imageUrl ? (
              <Box
                component='img'
                src={imageUrl}
                alt='icon'
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Avatar sx={{ width: 40, height: 40, fontSize: '14px', bgcolor: theme.palette.primary.main }}>
                {params.row.common_name?.charAt(0).toUpperCase() || '?'}
              </Avatar>
            )}
            <Box display='flex' flexDirection='column' overflow='hidden'>
              <Typography
                noWrap
                sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {params.row.scientific_name}
              </Typography>
              <Typography
                noWrap
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  fontFamily: 'Inter',
                  color: '#1F515B',
                  maxWidth: '180px',
                  textOverflow: 'ellipsis'
                }}
              >
                {params.row.common_name}
              </Typography>
            </Box>
          </Box>
        )
      }
    },
    {
      width: 250,
      field: 'identifier',
      headerName: 'IDENTIFIER',
      renderCell: params => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#44544A' }}>
            AAID : {`${params.row.animal_id}/${total}`}
          </Typography>
          {params.row.local_identifier_name && (
            <Typography sx={{ fontSize: '13px', color: '#7A8684' }}>
              {params.row.local_identifier_name} : {params.row.local_identifier_value}
            </Typography>
          )}
        </Box>
      )
    },

    {
      width: 160,
      field: 'sex',
      headerName: 'Gender',
      renderCell: params => {
        const gender = params.row.sex?.toLowerCase()

        // Color styles for each gender value
        const genderStyles = {
          male: { bgcolor: '#AFEFEB80', color: '#00AFD6' },
          female: { bgcolor: '#FA61404D', color: '#FA6140' },
          undetermined: { bgcolor: '#DAE7DF', color: '#E93353' },
          indeterminate: { bgcolor: '#DDEBE9', color: '#1F515B' }
        }

        // Display text mapping
        const genderLabels = {
          male: 'M',
          female: 'F',
          undetermined: 'UD',
          indeterminate: 'ID'
        }

        const style = genderStyles[gender] || genderStyles['indeterminate']
        const label = genderLabels[gender] || 'ID'

        return (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: style.bgcolor,
              color: style.color,
              fontSize: '14px',
              fontWeight: 600,
              display: 'inline-block',
              textAlign: 'center',
              minWidth: 40
            }}
          >
            {label}
          </Box>
        )
      }
    },

    {
      width: 250,
      field: 'animal_name',
      headerName: 'ANIMAL NAME',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: '#44544A' }}>{params.row.common_name}</Typography>
      )
    },

    {
      width: 250,
      field: 'section_name',
      headerName: 'Section Name',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: '#44544A' }}>{params.row.section_name}</Typography>
      )
    },
    {
      width: 250,
      field: 'site_name',
      headerName: 'Site Name',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: '#44544A' }}>{params.row.site_name}</Typography>
      )
    },

    {
      width: 250,
      field: 'user_enclosure_name',
      headerName: 'Enclosure Name',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: '#44544A' }}>
          {params.row.user_enclosure_name}
        </Typography>
      )
    }

    // {
    //   width: 250,
    //   field: 'reported_on',
    //   headerName: 'REPORTED ON',
    //   renderCell: params => {
    //     const date = new Date(params.row.discovered_date)
    //     return (
    //       <Box display='flex' flexDirection='column'>
    //         <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
    //           {params.row.user_enclosure_name}
    //         </Typography>
    //         <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400 }}>
    //           {format(date, 'dd MMM yyyy • hh:mm a').toUpperCase()}
    //         </Typography>
    //       </Box>
    //     )
    //   }
    // },

    // {
    //   field: 'died_on',
    //   headerName: 'DIED ON',
    //   width: 250,
    //   renderCell: params => {
    //     const diedDate = params.row.discovered_date ? new Date(params.row.discovered_date) : null

    //     return (
    //       <Box display='flex' flexDirection='column'>
    //         {diedDate && (
    //           <>
    //             <Typography
    //               sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}
    //             >
    //               {formatDistanceToNow(diedDate, { addSuffix: true })}
    //             </Typography>
    //             <Typography
    //               sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400 }}
    //             >
    //               {format(diedDate, 'dd MMM yyyy • hh:mm a').toUpperCase()}
    //             </Typography>
    //           </>
    //         )}
    //       </Box>
    //     )
    //   }
    // },

    // {
    //   width: 300,
    //   field: 'reason',
    //   headerName: 'REASON',
    //   renderCell: params => (
    //     <Typography
    //       sx={{
    //         fontSize: '16px',
    //         fontWeight: 400,
    //         color: theme.palette.customColors.OnSurfaceVariant,
    //         textOverflow: 'ellipsis',
    //         overflow: 'hidden',
    //         whiteSpace: 'nowrap',
    //         maxWidth: '100%'
    //       }}
    //     >
    //       {params.row.reason_name}
    //     </Typography>
    //   )
    // }
  ]

  return (
    <>
      <ListingHeader title='All Species' totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <Search
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ justifyContent: 'flex-end' }}
          />
          <ExportButton loading={downloading} onClick={handleDownload} />
        </Box>
        <Grid>
          <CommonTable
            onRowClick={handleRowClick}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: page - 1,
              pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            handleSortModel={handleSortModelChange}
            loading={loading}
            searchValue={search}
            maxHeight='60vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default AnimalTreatmentListing
