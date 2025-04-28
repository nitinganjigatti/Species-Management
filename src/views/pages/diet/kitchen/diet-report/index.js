// ** MUI Imports
import { Box } from '@mui/material'

// ** Custom Components Imports
import CommonTable from 'src/views/table/data-grid/CommonTable'

const DietReportView = ({ rows, columns, loading }) => {
  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <CommonTable
        indexedRows={rows}
        columns={columns}
        loading={loading}
        disablePagination={true}
        checkBoxOption={false}
      />
    </Box>
  )
}

export default DietReportView
