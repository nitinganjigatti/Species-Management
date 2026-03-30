import {
  Box,
  Button,
  IconButton,
  styled,
  Switch,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Theme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  getTransferAndSecurityTeamList,
  addSiteTeamMember,
  removeSiteTeamMember,
  updateTeamMemberPermission
} from 'src/lib/api/housing'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { GridCellParams } from '@mui/x-data-grid'
import InchargeDrawer from '../utils/InchargeDrawer'
import { Incharge } from 'src/types/housing/incharge'
import Toaster from 'src/components/Toaster'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'

type TeamTabType = 'transfer_user' | 'security'

interface TeamMember {
  user_id: number
  user_first_name: string
  user_last_name: string
  user_profile_pic?: string
  role_name?: string
  mobile_number?: string
  can_perform_action?: string
}

interface IndexedTeamMember extends TeamMember {
  id: number
  sl_no: number
}

interface SiteIncharge {
  user_id: number
  full_name?: string
}

interface TeamsListingProps {
  siteIncharges?: SiteIncharge[]
  loggedInUserId?: number
  addSitesAccess?: boolean
  settings?: {
    ANIMAL_TRANSFER_REQUIRES_APPROVAL?: boolean
    ANIMAL_TRANSFER_REQUIRES_SECURITY_APPROVAL?: boolean
  }
}

const TeamsListing: React.FC<TeamsListingProps> = ({
  siteIncharges = [],
  loggedInUserId,
  addSitesAccess = false,
  settings
}) => {
  const theme = useTheme() as Theme
  const { id } = useRouter().query
  const [activeTab, setActiveTab] = useState<TeamTabType>('transfer_user')
  const [loading, setLoading] = useState<boolean>(false)
  const [teamList, setTeamList] = useState<TeamMember[]>([])
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    user: TeamMember | null
    type: 'remove' | 'permission'
  }>({ open: false, user: null, type: 'remove' })

  // Check if Security Team tab should be visible
  const showSecurityTab = settings?.ANIMAL_TRANSFER_REQUIRES_SECURITY_APPROVAL === true

  // Check if user has permission to add/edit/remove team members
  const isSiteIncharge = useMemo(() => {
    return siteIncharges.some(incharge => incharge.user_id === loggedInUserId)
  }, [siteIncharges, loggedInUserId])

  const hasEditPermission = isSiteIncharge || addSitesAccess

  // Count approvers in the list
  const approverCount = useMemo(() => {
    return teamList.filter(member => member.can_perform_action === '1').length
  }, [teamList])

  const getTeamLists = async (): Promise<void> => {
    setLoading(true)
    try {
      const payload = {
        site_id: id as string,
        user_type: activeTab
      }
      const response = await getTransferAndSecurityTeamList(payload)
      if (response?.success) {
        setTeamList((response?.data || []) as unknown as TeamMember[])
      } else {
        setTeamList([])
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getTeamLists()
      setIsEditMode(false) // Reset edit mode when changing tabs
    }
  }, [activeTab, id])

  const handleTabChange = (event: React.SyntheticEvent, newValue: TeamTabType): void => {
    setActiveTab(newValue)
  }

  const handleAddTeamMember = async (selectedUsers: Incharge[]): Promise<{ success?: boolean; message?: string }> => {
    try {
      // Filter out users that are already in the team
      const existingUserIds = teamList.map(member => member.user_id)
      const newUsers = selectedUsers.filter(user => !existingUserIds.includes(user.user_id))

      if (newUsers.length === 0) {
        return { success: false, message: 'Selected users are already in the team' }
      }

      // Add all users in a single API call (matching mobile behavior)
      const payload = {
        site_id: Number(id),
        user_id: newUsers.map(user => user.user_id),
        user_type: activeTab as 'transfer_user' | 'security'
      }
      const res = await addSiteTeamMember(payload)

      if (res?.success) {
        return {
          success: true,
          message:
            activeTab === 'transfer_user'
              ? 'Transfer member(s) added successfully'
              : 'Security member(s) added successfully'
        }
      } else {
        return { success: false, message: res?.message || 'Failed to add team member' }
      }
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to add team member' }
    }
  }

  const handleRemoveTeamMember = async (user: TeamMember): Promise<void> => {
    try {
      const payload = {
        site_id: Number(id),
        user_id: user.user_id,
        user_type: activeTab as 'transfer_user' | 'security'
      }
      const res = await removeSiteTeamMember(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Team member removed successfully' })
        getTeamLists()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to remove team member' })
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'Failed to remove team member' })
    }
    setConfirmDialog({ open: false, user: null, type: 'remove' })
  }

  const handleTogglePermission = async (user: TeamMember): Promise<void> => {
    const currentValue = user.can_perform_action === '1'
    const newValue = !currentValue

    // Safety check: prevent removing the last approver
    if (currentValue && approverCount === 1) {
      Toaster({
        type: 'error',
        message: 'Cannot remove approval permission. At least one team member must have approval authority.'
      })

      return
    }

    try {
      const payload = {
        site_id: Number(id),
        user_id: user.user_id,
        user_type: activeTab as 'transfer_user' | 'security',
        can_perform_action: newValue ? 1 : 0
      }
      const res = await updateTeamMemberPermission(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Permission updated successfully' })
        getTeamLists()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to update permission' })
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'Failed to update permission' })
    }
  }

  const handleConfirmRemove = (user: TeamMember): void => {
    setConfirmDialog({ open: true, user, type: 'remove' })
  }

  const indexedRows: IndexedTeamMember[] = teamList.map((row, index) => ({
    ...row,
    id: +row?.user_id,
    sl_no: index + 1
  }))

  const columns = [
    {
      minWidth: 20,
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            pl: 2
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.onPrimaryContainer,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {(params.row as IndexedTeamMember).sl_no + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 40,
      flex: 1,
      field: 'user_first_name',
      headerName: 'User',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <UserAvatarDetails
          user_name={`${(params.row as IndexedTeamMember).user_first_name} ${
            (params.row as IndexedTeamMember).user_last_name
          }`}
          profile_image={(params.row as IndexedTeamMember).user_profile_pic}
        />
      )
    },
    {
      minWidth: 40,
      width: 200,
      field: 'role_name',
      headerName: 'Role',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            pl: 2
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.onPrimaryContainer,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {(params.row as IndexedTeamMember).role_name ? (params.row as IndexedTeamMember).role_name : '-'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 40,
      width: 200,
      field: 'contact',
      headerName: 'Contact',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const mobile = (params.row as IndexedTeamMember).mobile_number

        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              pl: 2
            }}
          >
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.neutralSecondary
              }}
            >
              {mobile || '-'}
            </Typography>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5 }}>
              <IconButton
                size='small'
                component='a'
                href={`tel:${mobile}`}
                sx={{
                  bgcolor: theme.palette.customColors.Background,
                  width: 32,
                  height: 32
                }}
              >
                <Icon icon='mdi:phone' fontSize={18} color={theme.palette.customColors.OnPrimaryContainer} />
              </IconButton>
              <IconButton
                size='small'
                component='a'
                href={`sms:${mobile}`}
                sx={{
                  bgcolor: theme.palette.customColors.Background,
                  width: 32,
                  height: 32
                }}
              >
                <Icon icon='mdi:message' fontSize={18} color={theme.palette.customColors.OnPrimaryContainer} />
              </IconButton>
            </Box>
          </Box>
        )
      }
    }
    // Permission to Approve column - only for Transfer Team in view mode
    // ...(activeTab === 'transfer_user' && !isEditMode
    //   ? [
    //       {
    //         minWidth: 40,
    //         width: 200,
    //         field: 'permission_to_approve',
    //         headerName: 'Permission to Approve',
    //         align: 'left' as const,
    //         headerAlign: 'left' as const,
    //         sortable: false,
    //         renderCell: (params: GridCellParams) => (
    //           <Box
    //             sx={{
    //               width: '100%',
    //               height: '100%',
    //               display: 'flex',
    //               alignItems: 'center',
    //               pl: 2
    //             }}
    //           >
    //             <IOSSwitch
    //               checked={(params.row as IndexedTeamMember).can_perform_action === '1'}
    //               onChange={() => {
    //                 if (hasEditPermission) {
    //                   handleTogglePermission(params.row as IndexedTeamMember)
    //                 }
    //               }}
    //               disabled={!hasEditPermission}
    //             />
    //           </Box>
    //         )
    //       }
    //     ]
    //   : []),
    // Remove action column - only in edit mode with permission
    // ...(isEditMode && hasEditPermission
    //   ? [
    //       {
    //         minWidth: 40,
    //         width: 100,
    //         field: 'actions',
    //         headerName: 'Actions',
    //         align: 'center' as const,
    //         headerAlign: 'center' as const,
    //         sortable: false,
    //         renderCell: (params: GridCellParams) => (
    //           <Box
    //             sx={{
    //               width: '100%',
    //               height: '100%',
    //               display: 'flex',
    //               alignItems: 'center',
    //               justifyContent: 'center'
    //             }}
    //           >
    //             <IconButton
    //               size='small'
    //               onClick={() => handleConfirmRemove(params.row as IndexedTeamMember)}
    //               sx={{ color: theme.palette.error.main }}
    //             >
    //               <Icon icon='mdi:close-circle-outline' fontSize={24} />
    //             </IconButton>
    //           </Box>
    //         )
    //       }
    //     ]
    //   : [])
  ]

  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
            <Tab value='transfer_user' label='Transfer Team' />
            {showSecurityTab && <Tab value='security' label='Security Team' />}
          </Tabs>
        </Box>
        <Box sx={{ mt: 4 }}>
          <ListingHeader
            title={activeTab === 'transfer_user' ? 'Transfer Team' : 'Security Team'}
            totalCount={teamList.length}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {activeTab === 'transfer_user' && !isEditMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon='f7:star-circle-fill' color={theme.palette.customColors.antzNotes} />
                  <Typography
                    sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.onPrimaryContainer }}
                  >
                    Permission To Approve
                  </Typography>
                </Box>
              )}
            </Box>
            {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {hasEditPermission && (
                <>
                  {isEditMode ? (
                    <Button
                      variant='contained'
                      onClick={() => {
                        setIsEditMode(false)
                        Toaster({ type: 'success', message: 'Team members updated' })
                      }}
                    >
                      Done
                    </Button>
                  ) : (
                    <>
                      {teamList.length > 0 && (
                        <Button
                          variant='outlined'
                          startIcon={<Icon icon='mdi:pencil-outline' />}
                          onClick={() => setIsEditMode(true)}
                          sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant='outlined'
                        startIcon={<Icon icon='cuida:user-add-outline' />}
                        sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
                        onClick={() => setOpenDrawer(true)}
                      >
                        {activeTab === 'transfer_user' ? 'Add Transfer Members' : 'Add Security Members'}
                      </Button>
                    </>
                  )}
                </>
              )}
            </Box> */}
          </Box>
          <CommonTable
            columns={columns}
            indexedRows={indexedRows}
            loading={loading}
            total={teamList.length}
            hideFooter
          />
        </Box>
      </Box>

      {/* Add Team Member Drawer */}
      {openDrawer && (
        <InchargeDrawer
          openDrawer={openDrawer}
          closeDrawer={() => setOpenDrawer(false)}
          selectedUsers={teamList.map(member => ({
            user_id: member.user_id,
            user_first_name: member.user_first_name,
            user_last_name: member.user_last_name,
            user_profile_pic: member.user_profile_pic || '',
            role_name: member.role_name || '',
            user_mobile_number: member.mobile_number || ''
          }))}
          title={activeTab === 'transfer_user' ? 'Add Transfer Members' : 'Add Security Members'}
          confirmLabel={activeTab === 'transfer_user' ? 'Add Transfer Members' : 'Add Security Members'}
          showFilter={true}
          onSubmit={handleAddTeamMember}
          onSelect={() => {
            getTeamLists()
          }}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, user: null, type: 'remove' })}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>Remove Team Member</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to remove{' '}
            <strong>
              {confirmDialog.user?.user_first_name} {confirmDialog.user?.user_last_name}
            </strong>{' '}
            from the {activeTab === 'transfer_user' ? 'Transfer' : 'Security'} Team?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, user: null, type: 'remove' })} color='inherit'>
            Cancel
          </Button>
          <Button
            onClick={() => confirmDialog.user && handleRemoveTeamMember(confirmDialog.user)}
            color='error'
            variant='contained'
            autoFocus
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default TeamsListing

const IOSSwitch = styled(Switch)(({ theme }) => ({
  width: 44,
  height: 24,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: (theme as Theme).palette.customColors.OnPrimary,
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 0
      }
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.5
    }
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 20,
    height: 20,
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  '& .MuiSwitch-track': {
    borderRadius: 24 / 2,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300],
    opacity: 1,
    transition: theme.transitions.create(['background-color'], { duration: 300 })
  }
}))
