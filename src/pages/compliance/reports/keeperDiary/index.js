import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getAnimalListing } from 'src/lib/api/report'
import AnimalDrawer from 'src/views/pages/report/AnimalDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalParentCard from 'src/views/utility/animalParentCard'

const KeeperDiaryReport = () => {
  const theme = useTheme()
  const [animalDrawer, setAnimalDrawer] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const eventHandler = () => {
    setAnimalDrawer(true)
  }

  const handleClose = () => {
    setAnimalDrawer(false)
  }

  const handleToggleDeleteView = () => {
    setShowDelete(prev => !prev)
  }

  const AnimalCardWrapper = ({ data }) => {
    // const [showDelete, setShowDelete] = useState(false)

    // const handleToggle = () => setShowDelete(prev => !prev)

    return (
      <div>
        <AnimalParentCard
          data={data}
          style={true}
          ondelete={handleToggleDeleteView}
          onradio={''}
          backgroundColor={theme.palette.customColors.bodyBg}
        />
      </div>
    )
  }

  const animal = {
    id: 1,
    sex: 'female',
    default_icon: '/images/cat-swimming.png',
    animal_id: 'BI23000123',
    common_name: 'Peach Fronted Conure',
    scientific_name: 'Psittacus vibrans',
    user_enclosure_name: 'DT 2',
    section_name: 'Dain Tree',
    site_name: 'Gagava'
  }

  const headerAction = (
    <Typography
      onClick={''}
      sx={{
        fontSize: '20px',
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#006D35',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        mr: 4
      }}
    >
      Download report
      <img src='/images/download1.svg' alt='download icon' style={{ marginLeft: 8, width: 30, height: 30 }} />
    </Typography>
  )

  const columns = [
    {
      width: 200,
      headerName: 'SL.NO',
      renderCell: params => <></>
    },

    {
      width: 200,
      field: 'Date',
      headerName: 'Date',
      hide: true,
      renderCell: params => <></>
    },
    {
      minWidth: 200,
      field: 'from_store',
      headerName: 'Observation Type',
      renderCell: params => <></>
    },

    {
      minWidth: 200,
      field: 'pending_count',
      headerName: 'Details',
      headerAlign: 'left',
      type: 'number',
      align: 'left',
      renderCell: params => <></>
    },

    {
      minWidth: 200,
      field: 'Reported By',
      headerName: 'Reported By',
      renderCell: params => <></>
    }
  ]

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        fontFamily: 'Inter',
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Keeper's Diary Report
    </Typography>
  )

  return (
    <>
      {showDelete ? (
        <Card>
          <CardHeader title='Keepers Diary Report' action={headerAction} />
          <Box sx={{ p: 5 }}>
            <AnimalCardWrapper key={animal.id} data={animal} />
          </Box>

          {/* Search field */}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
            {/* Search Box */}
            <Box sx={{ ml: 2 }}>
              <TextField
                variant='outlined'
                size='small'
                value={''}
                onChange={''}
                placeholder='Search'
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  width: '320px',
                  backgroundColor: '#fff',
                  ml: 4,
                  mt: 1,
                  borderRadius: '4px', // Applies to the container
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px' // Applies to the input field
                  }
                }}
              />
            </Box>
            <Box sx={{ mr: 5 }}>
              <CommonDateRangePickers onChange={''} filterDates={''} />
            </Box>
          </Box>
          <Grid
            sx={{
              margin: '0px 1.375rem 0px 1.375rem'
            }}
          >
            <CommonTable
              onRowClick={''}
              indexedRows={''}
              total={''}
              columns={columns}
              paginationModel={''}
              handleSortModel={''}
              setPaginationModel={''}
              loading={''}
              searchValue={''}
            />
          </Grid>
        </Card>
      ) : (
        <Card sx={{ p: 6 }}>
          <CardHeader title={title} />
          <ReportCard
            subtitle='No Keeper selected'
            description=' Select any keeper to view report'
            buttonText='SELECT KEEPER'
            addHandler={eventHandler}
          />
        </Card>
      )}

      {animalDrawer && (
        <AnimalDrawer
          open={animalDrawer}
          onClose={handleClose}
          // animalList={animalList}
          // onLoad={loaderRef}
          // hasMore={hasMore}
        />
      )}
    </>
  )
}
export default KeeperDiaryReport
