// ** MUI Imports
import { Box } from '@mui/material'

import CommonTable from 'src/views/table/data-grid/CommonTable'

interface Props {
  rows: any[]
  columns: any[]
  loading: boolean
}

const DietReportView: React.FC<Props> = ({ rows, columns, loading }) => {
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
