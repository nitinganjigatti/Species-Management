// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { height } from '@mui/system'

const TableBasic = ({ TableTitle, columns, rows, headerActions, inpFields, onRowClick, rowHeight, rowSpacing }) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  return (
    <Box>
      {rows.length > 0 ? (
        <DataGrid
          sx={{
            '.MuiDataGrid-cell:focus': {
              outline: 'none'
            },

            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer'
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
          columns={columns}
          rows={rows}
          onRowClick={onRowClick}
        />
      ) : null}
    </Box>
  )
}

export default TableBasic
