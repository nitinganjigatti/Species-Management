import { useState, useEffect, useCallback, useContext } from 'react'

// ** MUI Imports
import { Grid, Box, CircularProgress } from '@mui/material'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import { AddButtonContained } from 'src/components/ButtonContained'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { AuthContext } from 'src/context/AuthContext'
import PharmacySettingsDrawer from 'src/views/pages/pharmacy/store/pharmacy-settings/PharmacySettingsDrawer'
import { usePharmacyContext } from 'src/context/PharmacyContext'
// ** API
import { getLowStockNotificationUserList, submitPharmacySettings } from 'src/lib/api/pharmacy/pharmacySettings'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import toast from 'react-hot-toast'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

const notificationTabs = [
  { label: 'Low Stock Notification', value: '1', key: 'weekly_low_stock_qty_notification' },
  { label: 'Expired Stock Notification', value: '2', key: 'weekly_expired_stock_qty_notification' },
  { label: 'About To Expire Notification', value: '3', key: 'weekly_about_to_expire_stock_qty_notification' }
]

const PharmacySettingsList = () => {
  const { userData } = useContext(AuthContext)
  const { selectedPharmacy } = usePharmacyContext()

  const pharmacyRole = userData?.roles?.settings?.add_pharmacy && selectedPharmacy?.type === 'central'

  const [activeTab, setActiveTab] = useState('1')
  const [settingsData, setSettingsData] = useState({})
  const [usersList, setUsersList] = useState([])

  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const activeSettingKey = notificationTabs.find(t => t.value === activeTab)?.key
  const tableData = settingsData[activeSettingKey] || []

  const fetchData = useCallback(async () => {
    setLoading(true)
    const response = await getLowStockNotificationUserList()

    if (response?.data?.success) {
      const dataArray = response?.data?.data || []
      const parsed = {}
      dataArray.forEach(item => {
        if (item?.key) {
          parsed[item.key] = item[item.key] || []
        }
      })
      setSettingsData({
        weekly_low_stock_qty_notification: parsed?.weekly_low_stock_qty_notification || [],
        weekly_expired_stock_qty_notification: parsed?.weekly_expired_stock_qty_notification || [],
        weekly_about_to_expire_stock_qty_notification: parsed?.weekly_about_to_expire_stock_qty_notification || []
      })
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

    const payload = {
      key: activeSettingKey,
      value: Array.isArray(userIds) ? userIds.join(',') : userIds,
      action: 'add'
    }
    const response = await submitPharmacySettings(payload)

    if (response?.success) {
      toast.success(response?.message)
      setDrawerOpen(false)
      fetchData()
    } else {
      toast.error(response?.message || 'Submission failed')
    }
    setSubmitLoading(false)
  }

  const deleteHandler = async userId => {
    setDeleteLoading(userId)

    const payload = {
      key: activeSettingKey,
      value: userId,
      action: 'remove'
    }
    const response = await submitPharmacySettings(payload)

    if (response?.success) {
      toast.success(response?.message)
      fetchData()
    } else {
      toast.error(response?.message || 'Submission failed')
    }
    setDeleteLoading(null)
  }

  const columns = [
    {
      minWidth: 500,
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

    {
      ...(pharmacyRole && {
        minWidth: 500,
        field: 'action',
        sortable: false,
        headerName: 'Action',
        renderCell: params =>
          params?.row?.id === deleteLoading ? (
            <CircularProgress size={20} color='primary' />
          ) : (
            <Icon onClick={() => deleteHandler(params?.row?.id)} icon='mdi:delete-outline' />
          )
      })
    }
  ]

  return (
    <PageCardLayout
      title='Pharmacy Notification Settings'
      action={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {pharmacyRole && (
            <AddButtonContained title='Add Notification Recipient' action={openDrawer} styles={{ m: 0 }} />
          )}
        </Box>
      }
    >
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <TabList onChange={(e, newValue) => setActiveTab(newValue)} variant='scrollable' allowScrollButtonsMobile>
            {notificationTabs?.map(tab => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </TabList>
        </Box>
        {notificationTabs?.map(tab => (
          <TabPanel key={tab.value} value={tab.value} sx={{ p: 0 }}>
            <CommonTable
              hideFooter
              disablePagination
              indexedRows={tableData}
              columns={columns}
              loading={loading}
              externalTableStyle={{ mt: 0 }}
            />
          </TabPanel>
        ))}
      </TabContext>
      {drawerOpen && (
        <PharmacySettingsDrawer
          open={drawerOpen}
          toggle={() => setDrawerOpen(false)}
          onSubmit={handleSubmit}
          isLoading={submitLoading}
          availableUsers={usersList}
        />
      )}
    </PageCardLayout>
  )
}

export default PharmacySettingsList
