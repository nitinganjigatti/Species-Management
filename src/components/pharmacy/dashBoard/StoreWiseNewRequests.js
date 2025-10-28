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
import { Box, Tooltip } from '@mui/material'
import RenderUtility from 'src/utility/render'
import { bgcolor, maxWidth, width } from '@mui/system'
import { WidthFull } from '@mui/icons-material'

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

      minWidth: 150,
      maxWidth: 200,

      field: 'to_store',
      headerName: 'Pharmacy name',
      Width: '300px',
      renderCell: params => (
        <Tooltip title={params.row?.to_store ? params.row?.to_store : 'NA'}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {' '}
            {params.row?.to_store || 'NA'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,

      minWidth: 150,
      maxWidth: 200,
      field: 'request_number',
      headerName: 'Request ID',
      renderCell: params => (
        <Tooltip title={params.row.request_number}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params.row.request_number}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.25,
      minWidth: 150,
      maxWidth: 200,
      field: 'request_date',
      headerName: 'Requested on',
      renderCell: params => (
        <Tooltip title={params?.row?.request_date ? Utility.formatDisplayDate(params.row.request_date) : 'NA'}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params?.row?.request_date ? Utility.formatDisplayDate(params.row.request_date) : 'NA'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,

      minWidth: 150,
      maxWidth: 200,

      field: 'priority',
      headerName: 'Priority',
      headerAlign: 'center',
      align: 'center',
      renderCell: params => (
        <Tooltip title={RenderUtility.getPriorityIcons(params?.row?.priority)}>
          <Box>{RenderUtility.getPriorityIcons(params?.row?.priority)}</Box>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 150,
      maxWidth: 200,
      field: 'total_qty',
      headerName: 'Total items',
      align: 'center',

      renderCell: params => (
        <Tooltip title={params?.row?.total_qty ? params?.row?.total_qty : 'NA'}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params?.row?.total_qty ? params?.row?.total_qty : 'NA'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 150,
      maxWidth: 200,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Tooltip title={params?.row?.status === 'request' ? 'Pending' : params?.row?.status}>
          <Typography
            variant='body2'
            sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params?.row?.status === 'request' ? 'Pending' : params?.row?.status}
          </Typography>
        </Tooltip>
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
        action={
          <OptionsMenu options={['Refresh']} iconButtonProps={{ size: 'small', className: 'card-more-options' }} />
        }
        slotProps={{
          title: { sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }
        }}
      />
      <Tooltip>
        <CardContent>
          {requestList?.length > 0 ? (
            <DataGrid
              autoWidth
              autoHeight
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
      </Tooltip>
    </Card>
  )
}

export default StoreWiseNewRequests
