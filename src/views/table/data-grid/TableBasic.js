// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'

const TableBasic = ({ TableTitle, columns, rows, headerActions, inpFields, onRowClick }) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 })

  return (
    <Box>{rows.length > 0 ? <DataGrid autoHeight columns={columns} rows={rows} onRowClick={onRowClick} /> : null}</Box>
  )
}

export default TableBasic
