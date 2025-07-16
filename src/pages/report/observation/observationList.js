import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const ObservationList = () => {
  const theme = useTheme()
  const mockAnimals = [
    {
      id: 1,
      sex: 'female',
      default_icon: '/images/cat-swimming.png',
      // local_identifier_name: 'BI23000123',
      common_name: 'Peach Fronted Conure',
      scientific_name: 'Psittacus vibrans',
      user_enclosure_name: 'DT 2',
      section_name: 'Dain Tree',
      site_name: 'Gagava'
    }
  ]

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

  return (
    <>
      <Card>
        <CardHeader title='Observation Report' action={headerAction} />
        <Box sx={{ p: 5 }}>
          {mockAnimals.map(animal => (
            <AnimalParentCard key={animal.id} data={animal} backgroundColor={theme.palette.customColors.bodyBg} />
          ))}
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
    </>
  )
}
export default ObservationList
