// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { useEffect, useState } from 'react'
import Chip from '@mui/material/Chip'
import { DataGrid } from '@mui/x-data-grid'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import { getNewRequestsList } from 'src/lib/api/pharmacy/dashboard'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { Box } from '@mui/material'
import RenderUtility from 'src/utility/render'

const StoreWiseNewRequests = () => {
  const [requestList, setRequestList] = useState([])
  const { selectedPharmacy } = usePharmacyContext()

  const getNewRequestsLists = async () => {
    try {
      const result = await getNewRequestsList()

      if (result?.success === true && result?.data?.list_items.length > 0) {
        setRequestList(result?.data?.list_items)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getNewRequestsLists()
  }, [selectedPharmacy.type, selectedPharmacy.id])

  const columns = [
    {
      flex: 0.3,
      minWidth: 20,
      field: 'to_store',
      headerName: 'Pharmacy name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row?.to_store ? params.row?.to_store : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_number',
      headerName: 'Request ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_number}
        </Typography>
      )
    },
    {
      flex: 0.25,
      minWidth: 20,
      field: 'request_date',
      headerName: 'Requested on',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.request_date ? Utility.formatDisplayDate(params.row.request_date) : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'priority',
      headerName: 'Priority',
      headerAlign: 'center',
      align: 'center',
      renderCell: params => <Box>{RenderUtility.getPriorityIcons(params?.row?.priority)}</Box>
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_qty',
      headerName: 'Total items',
      align: 'center',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.total_qty ? params?.row?.total_qty : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.status === 'request' ? 'Pending' : params?.row?.status}
        </Typography>
      )
    }
  ]

  const priorityBadge = priority => {
    if (priority === 'High') {
      return (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' variant='outlined' label={priority} color='error' />
      )
    } else {
      return (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' variant='outlined' label={priority} color='success' />
      )
    }
  }

  return (
    <Card>
      <CardHeader
        title='Recent requests'
        titleTypographyProps={{ sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }}
        action={
          <OptionsMenu options={['Refresh']} iconButtonProps={{ size: 'small', className: 'card-more-options' }} />
        }
      />
      <CardContent>
        {requestList?.length > 0 ? (
          <DataGrid
            autoHeight
            autoWidth
            rows={requestList === undefined ? [] : requestList}
            columns={columns}
            disableColumnMenu
            paginationModel={false}
            pagination={false}
            hideFooter
            sx={{
              '& .MuiDataGrid-row:last-of-type': {
                borderBottom: '1px solid rgba(224, 224, 224, 1)'
              }
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

export default StoreWiseNewRequests
