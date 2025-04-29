// ** MUI Imports
import { Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

// ** Custom Components Imports
import DietReport from 'src/components/diet/DietReport'

const DietReportView = () => {
  const { rows, columns, loading } = DietReport()

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
        disableColumnMenu
        loading={loading}
        sx={{
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme => theme.palette.customColors.tableHeaderBg
          },
          '& .MuiDataGrid-columnHeader': {
            color: theme => theme.palette.text.primary
          },
          '& .MuiDataGrid-cell': {
            color: theme => theme.palette.text.primary,
            borderBottom: theme => `1px solid ${theme.palette.divider}`
          },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(odd)': {
              backgroundColor: theme => theme.palette.action.hover
            }
          }
        }}
      />
    </Box>
  )
}

export default DietReportView
