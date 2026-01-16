import { useState, useEffect, useCallback, useContext } from 'react'

// ** MUI Imports
import { Grid, Card, CardContent, Box, CardHeader, Divider } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
// import PharmacySettingsDrawer from '../../../views/pages/pharmacy/store/pharmacy-settings/PharmacySettingsDrawer'
import { AddButtonContained } from 'src/components/ButtonContained'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { AuthContext } from 'src/context/AuthContext'
import PharmacySettingsDrawer from 'src/views/pages/pharmacy/store/pharmacy-settings/PharmacySettingsDrawer'

// ** API
import { getPharmacySettingsList, submitPharmacySettings } from 'src/lib/api/pharmacy/pharmacySettings'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import toast from 'react-hot-toast'
import { LoadingButton } from '@mui/lab'

const PharmacySettingsList = () => {
  const { userData } = useContext(AuthContext)
  const pharmacyRole = userData?.roles?.settings?.add_pharmacy

  const [tableData, setTableData] = useState([])
  const [usersList, setUsersList] = useState([])

  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const response = await getPharmacySettingsList()

    if (response?.data?.success) {
      const rawUsers = response?.data?.data[0]?.weekly_low_stock_qty_notification || []
      setTableData(rawUsers)
    } else {
      toast.error(response?.message || 'Failed to fetch data')
    }
    setLoading(false)
  }, [])

  // Fetch available users for the drawer dropdown
  const fetchAvailableUsers = useCallback(async () => {
    if (!userData?.user?.zoos.length > 0) return

    const response = await getUserList({ zoo_id: userData?.user?.zoos[0].zoo_id })
    if (response?.success) {
      setUsersList(
        response?.data?.map(user => {
          // debugger

          return {
            label: user.user_name || user.name,
            value: String(user.user_id || user.id)
          }
        })
      )
    }
  }, [userData])

  useEffect(() => {
    fetchData()
    fetchAvailableUsers()
  }, [fetchData, fetchAvailableUsers])

  const openDrawer = () => {
    setDrawerOpen(true)
  }

  const handleSubmit = async userIds => {
    setSubmitLoading(true)
    const key = 'weekly_low_stock_qty_notification'

    const payload = {
      key: key,
      value: Array.isArray(userIds) ? userIds.join(',') : userIds,
      action: 'add'
    }
    const response = await submitPharmacySettings(payload)

    if (response?.success) {
      toast.success(response?.message)
      setDrawerOpen(false)
      fetchData() // Refresh list
    } else {
      toast.error(response?.message || 'Submission failed')
    }
    setSubmitLoading(false)
  }

  const deleteHandler = async userId => {
    setDeleteLoading(userId)
    const key = 'weekly_low_stock_qty_notification'

    const payload = {
      key: key,
      value: userId,
      action: 'delete'
    }
    const response = await submitPharmacySettings(payload)

    if (response?.success) {
      toast.success(response?.message)
      fetchData() // Refresh list
    } else {
      toast.error(response?.message || 'Submission failed')
    }
    setDeleteLoading(null)
  }

  const columns = [
    {
      minWidth: 400,
      field: 'username',
      headerName: 'User Details',
      sortable: false,
      renderCell: params => {
        return (
          <UserAvatarDetails
            user_name={params?.row?.username}
            profile_image={params?.row?.user_profile_pic}
            role={params?.row?.designation}
          />
        )
      }
    },

    // {
    //   minWidth: 200,
    //   field: 'designation',
    //   headerName: 'Role',
    //   sortable: false,
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.designation || 'N/A'}
    //     </Typography>
    //   )
    // },
    {
      ...(pharmacyRole && {
        minWidth: 400,
        field: 'action',
        sortable: false,
        headerName: 'Action',
        renderCell: params => (
          <LoadingButton
            variant='contained'
            size='small'
            onClick={() => deleteHandler(params?.row?.id)} // Clicking this opens the drawer to edit the whole list
            startIcon={<Icon icon='mdi:delete-outline' />}
            loading={params?.row?.id === deleteLoading}
          />
        )
      })
    }
  ]

  return (
    <Grid container spacing={6}>
      <Grid size={12} sx={{ width: '100%' }}>
        <Card sx={{ width: '100%' }}>
          <CardHeader
            title='Pharmacy Settings'
            action={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {pharmacyRole && <AddButtonContained title='Add Setting' action={openDrawer} />}
              </Box>
            }
          />
          {/* <Divider /> */}
          <CardContent sx={{ px: 2 }}>
            <CommonTable hideFooter disablePagination indexedRows={tableData} columns={columns} loading={loading} />
          </CardContent>
        </Card>
      </Grid>

      {drawerOpen && (
        <PharmacySettingsDrawer
          open={drawerOpen}
          toggle={() => setDrawerOpen(false)}
          onSubmit={handleSubmit}
          isLoading={submitLoading}
          availableUsers={usersList}
        />
      )}
    </Grid>
  )
}

export default PharmacySettingsList
