'use client'

import { useTheme } from '@mui/material/styles'
import { Box, Card, CardHeader, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalParentCard from 'src/views/utility/animalParentCard'

interface AnimalData {
  id: number
  sex: string
  default_icon: string
  common_name: string
  scientific_name: string
  user_enclosure_name: string
  section_name: string
  site_name: string
}

const ObservationList = () => {
  const theme = useTheme()

  const mockAnimals: AnimalData[] = [
    {
      id: 1,
      sex: 'female',
      default_icon: '/images/cat-swimming.png',
      common_name: 'Peach Fronted Conure',
      scientific_name: 'Psittacus vibrans',
      user_enclosure_name: 'DT 2',
      section_name: 'Dain Tree',
      site_name: 'Gagava'
    }
  ]

  const headerAction = (
    <Typography
      sx={{
        fontSize: '20px',
        fontWeight: '400',
        fontFamily: 'Inter',
        color: theme.palette.primary.dark,
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

  const columns: GridColDef[] = [
    { field: 'sl_no', width: 200, headerName: 'SL.NO', renderCell: () => <></> },
    { field: 'date', width: 200, headerName: 'Date', renderCell: () => <></> },
    { field: 'from_store', minWidth: 200, headerName: 'Observation Type', renderCell: () => <></> },
    { field: 'pending_count', minWidth: 200, headerName: 'Details', renderCell: () => <></> },
    { field: 'reported_by', minWidth: 200, headerName: 'Reported By', renderCell: () => <></> }
  ]

  return (
    <Card>
      <CardHeader title='Observation Report' action={headerAction} />
      <Box sx={{ p: 5 }}>
        {mockAnimals.map(animal => (
          <AnimalParentCard key={animal.id} data={animal} backgroundColor={theme.palette.customColors.bodyBg} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
        <Box sx={{ ml: 2 }}>
          <TextField
            variant='outlined'
            size='small'
            value={''}
            onChange={() => {}}
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
              ml: 4,
              mt: 1,
              borderRadius: '4px',
              '& .MuiOutlinedInput-root': { borderRadius: '4px' }
            }}
          />
        </Box>
        <Box sx={{ mr: 5 }}>
          <CommonDateRangePickers onChange={() => {}} filterDates={null} />
        </Box>
      </Box>
      <Grid sx={{ margin: '0px 1.375rem 0px 1.375rem' }}>
        <CommonTable
          onRowClick={() => {}}
          indexedRows={[]}
          total={0}
          columns={columns}
          paginationModel={{ page: 0, pageSize: 10 }}
          handleSortModel={() => {}}
          setPaginationModel={() => {}}
          loading={false}
          searchValue={''}
        />
      </Grid>
    </Card>
  )
}

export default ObservationList
