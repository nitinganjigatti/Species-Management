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
import Utility from 'src/utility'

const StoreWiseNewRequests = () => {
  const [requestList, setRequestList] = useState([])

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
  }, [])

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
      flex: 0.2,
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
      flex: 0.1,
      minWidth: 20,
      field: 'priority',
      headerName: 'Priority',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {priorityBadge(params?.row?.priority)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 10,
      field: 'total_qty',
      headerName: 'Total items',
      align: 'right',

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
          {params?.row?.status ? params?.row?.status : 'NA'}
        </Typography>
      )
    }
  ]

  const priorityBadge = priority => {
    if (priority === '') {
      return (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          NA
        </Typography>
      )
    } else if (priority === 'high') {
      return (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' variant='outlined' label={priority} color='error' />
      )
    } else if (priority === 'low') {
      return (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' variant='outlined' label={priority} color='success' />
      )
    } else {
      return (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          NA
        </Typography>
      )
    }
  }

  return (
    <Card>
      <CardHeader
        title='Store wise new requests'
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
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

export default StoreWiseNewRequests
