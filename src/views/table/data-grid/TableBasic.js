// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { height } from '@mui/system'
import { useTheme } from '@mui/material/styles'

const TableBasic = ({
  TableTitle,
  columns,
  rows,
  headerActions,
  inpFields,
  onRowClick,
  rowHeight,
  rowSpacing,
  backgroundColor,
  loading
}) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const theme = useTheme()

  return (
    <Box>
      {/* {rows?.length > 0 ? ( */}
      <DataGrid
        sx={{
          '.MuiDataGrid-cell:focus': {
            outline: 'none'
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center'
          },
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
            backgroundColor: 'transparent'
          },
          '& .MuiDataGrid-main': {
            // margin: '16px', // Apply margin to the main container
            borderRadius: '8px', // Apply border-radius to the main container
            border: '1px solid rgba(233, 233, 236, 1)' // Apply border to the main container
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: 'none' // Remove the border-top from footer container
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: backgroundColor || theme.palette.customColors.customTableHeaderBg,
            minHeight: '56px !important'
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: backgroundColor || theme.palette.customColors.customTableHeaderBg
          },
          '& .MuiDataGrid-filler': {
            backgroundColor: `${backgroundColor || theme.palette.customColors.customTableHeaderBg} !important`
          },
          '& .MuiDataGrid-scrollbarFiller': {
            backgroundColor: `${backgroundColor || theme.palette.customColors.customTableHeaderBg} !important`
          },
          '& .MuiDataGrid-filler--pinnedColumns': {
            backgroundColor: `${backgroundColor || theme.palette.customColors.customTableHeaderBg} !important`
          },
          '& .MuiDataGrid-scrollbarFiller--header': {
            backgroundColor: `${backgroundColor || theme.palette.customColors.customTableHeaderBg} !important`
          }
        }}
        columnVisibilityModel={{
          sl_no: false,
          id: false
        }}
        getRowHeight={() => (rowHeight ? rowHeight : null)}
        hideFooterSelectedRowCount
        disableColumnMenu
        disableColumnSelector={true}
        autoHeight
        columns={columns || []}
        rows={rows || []}
        onRowClick={onRowClick}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50, 100]}
        loading={loading ? loading : null}
      />
      {/* ) : null} */}
    </Box>
  )
}

export default TableBasic
