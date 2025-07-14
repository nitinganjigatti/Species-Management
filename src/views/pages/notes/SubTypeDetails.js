import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import TableBasic from 'src/views/table/data-grid/TableBasic'

const SubTypeDetails = ({ subArr }) => {
  console.log('SubArr', subArr)

  const columns = [
    {
      flex: 0.4,
      minWidth: 20,
      field: 'Id',
      headerName: 'Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'type_name',
      headerName: 'SubType Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.type_name}
        </Typography>
      )
    }
  ]

  return (
    <Box>
      {subArr.length > 0 ? (
        <TableBasic columns={columns} rows={subArr}></TableBasic>
      ) : (
        <Typography variant='h6' sx={{ ml: 65, mb: 10 }}>
          No SubType Records Found
        </Typography>
      )}
    </Box>
  )
}

export default SubTypeDetails
