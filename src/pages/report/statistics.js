import React from 'react'
import { Box, CardHeader, Grid, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import data from './dummyData'
import { useTheme } from '@mui/material/styles'

const StatisticsReport = () => {
  const theme = useTheme()

  // Dynamically generate fieldConfig based on the first item in the data array
  const fieldConfig = Object.keys(data[0])
    .filter(key => key !== 'imageUrl' && key !== 'speciesName' && key !== 'commonName')
    .map(key => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      cellClassName: 'custom-cell'
    }))

  // Add the combined "Species & Common Name" field as the first item in fieldConfig
  fieldConfig.unshift({
    field: 'speciesAndCommonName',
    headerName: 'Species & Common Name',
    isAvatar: true,
    flex: 3
  })

  const columns = fieldConfig.map(config => {
    if (config.field === 'speciesAndCommonName') {
      return {
        ...config,
        renderCell: params => (
          <CardHeader
            avatar={
              <img
                src={params.row.imageUrl}
                alt={params.row.commonName}
                style={{ width: 40, height: 40, borderRadius: '50%' }}
              />
            }
            title={
              <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: '#006D35' }}>
                {params.row.commonName}
              </Typography>
            }
            subheader={
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter', color: '#006D35' }}
                variant='body2'
              >
                {params.row.class}
              </Typography>
            }
          />
        )
      }
    }
    return {
      ...config,
      flex: 2
    }
  })

  const reportRows = data.map((item, index) => ({
    id: index + 1,
    speciesAndCommonName: `${item.speciesName} - ${item.commonName}`,
    ...item
  }))

  return (
    <Box sx={{ width: '97.77%', margin: 4 }}>
      <Box sx={{ overflowX: 'auto', borderRadius: '8px' }}>
        <DataGrid
          sx={{
            mt: 3,
            width: '130%',
            borderRadius: '8px',
            '.MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#DDEBE9',
              color: '#1F415B',
              fontWeight: 600,
              fontFamily: 'Inter'
              // border: "1px solid #C3CEC7"
            },

            '.MuiDataGrid-main': {
              borderLeft: '1px solid #C3CEC7',
              borderRight: '1px solid #C3CEC7',
              borderTop: '1px solid #C3CEC7',
              borderBottom: '1px solid #C3CEC7',
              borderRadius: '8px',
              overflow: 'hidden', // Hide overflow
              '& .MuiDataGrid-virtualScroller': {
                overflow: 'hidden' // Hide scrollbar
              }
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none' // Remove the border-top from footer container
            },

            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer'
            },
            '& .custom-cell': {
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16.94px',
              textAlign: 'left',
              color: '#44544A'
            }
          }}
          rows={reportRows}
          columns={columns}
          autoHeight
          hideFooterPagination
          hideFooterSelectedRowCount={true}
          rowHeight={70}
          scrollbarSize={10}
        />
      </Box>
    </Box>

   
  )
}

export default StatisticsReport
