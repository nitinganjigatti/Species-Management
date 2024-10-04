import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Divider
} from '@mui/material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import ActivityLogs from 'src/components/diet/activityLogs'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import { deleteDiet, dietStatusChange } from 'src/lib/api/diet/dietList'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import Tooltip from '@mui/material/Tooltip'
import ChangeDietName from 'src/components/diet/ChangeDietname'

const DietDetailCard = ({ dietDetails }) => {
  const router = useRouter()
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [activitySearchValue, setActivitySearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // const [searchValue, setSearchValue] = useState('')

  const [deleteDialogBox, setDeleteDialogBox] = useState(false)

  const [isActive, setIsActive] = useState(dietDetails?.active || '0')

  // const [activePayload, setActivePayload] = useState(FeedDetailsValue?.active || false)
  const [activePayload, setActivePayload] = useState(false)
  const [confirmDialogBox, setConfirmDialogBox] = useState(false)

  const handleSwitchChange = async event => {
    const newIsActive = event.target.checked ? 1 : 0
    setActivePayload(newIsActive)
    setConfirmDialogBox(true)
  }

  const handleClosenew = () => {
    setConfirmDialogBox(false)
  }

  const handleSidebarClose = () => {
    setActivitySidebarOpen(false)
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const handleCloseDetele = () => {
    setDeleteDialogBox(false)
  }

  const handlelOpenDelete = () => {
    setDeleteDialogBox(true)
  }

  const handleDietClick = () => {
    setIsOpen(true)
  }

  useEffect(() => {
    setIsActive(dietDetails?.active)
  }, [dietDetails])

  const convertToTitleCase = str => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }

  const confirmDeleteAction = async () => {
    setLoading(true)
    try {
      const response = await deleteDiet(dietDetails?.id)
      if (response.success === true) {
        setDeleteDialogBox(false)
        setLoading(false)
        Toaster({ type: 'success', message: response?.message })
        Router.push('/diet/diet')
      } else {
        setLoading(false)
        setDeleteDialogBox(false)
        Toaster({ type: 'error', message: response.message })
      }
    } catch (error) {
      console.log('error', error)
    }

    // console.log('first')
  }

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(value, sortColumning)
  // }

  const confirmStatusAction = async () => {
    try {
      setConfirmDialogBox(false)
      const response = await dietStatusChange({ status: activePayload }, dietDetails?.id)

      console.log(response, 'response')
      if (response.success) {
        setIsActive(isActive === '0' ? '1' : '0')
        Toaster({ type: 'success', message: response.message })
      } else {
        alert('something went wrong')
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  return (
    <Card>
      {/* {console.log(dietDetails, 'dietDetails')} */}
      <CardContent>
        <Grid sx={{ justifyContent: 'center', gap: '24px', boxSizing: 'border-box' }} container>
          <Grid md={3.8} item>
            <Box item sx={{ borderTopLeftRadius: 36, borderTopRightRadius: 36 }}>
              <Avatar
                variant='square'
                alt={dietDetails?.image}
                sx={{
                  width: '100%',
                  height: dietDetails?.image ? '300px' : '250px',
                  borderRadius: '8px'
                }}
                src={dietDetails?.image ? dietDetails?.image : '/icons/icon_diet_fill.png'}
              ></Avatar>
              {/* <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'space-between',
                  gap: '12px',
                  p: '16px'
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 400, color: 'text.primary' }}>
                    Ingredients used
                  </Typography>
                  <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 500, color: '#44544A' }}>
                    112
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 400, color: 'text.primary' }}>
                    Recipes used
                  </Typography>
                  <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 500, color: '#44544A' }}>
                    45
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 400, color: 'text.primary' }}>
                    Species
                  </Typography>
                  <Typography variant='body2' sx={{ fontSize: '14px', fontWeight: 500, color: '#44544A' }}>
                    12
                  </Typography>
                </Box>
              </Box> */}
            </Box>
          </Grid>
          <Grid item md={7.8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '24px', color: '#44544A', lineHeight: '29.05px' }}>
                    {dietDetails?.diet_name}
                  </Typography>
                  <Typography sx={{ fontWeight: 400, fontSize: '16px', color: '#44544A', lineHeight: '19.36px' }}>
                    {dietDetails?.diet_no}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch checked={isActive === '1' ? true : false} onChange={handleSwitchChange} fontSize={2} />
                      }
                      labelPlacement='start'
                      label={isActive === '1' ? 'Active' : 'InActive'}
                    />
                  </Box>
                  <Tooltip title='Copy' placement='top'>
                    <Box>
                      <Icon
                        icon='fluent:copy-32-regular'
                        style={{ fontSize: 24, transform: 'rotate(180deg)', cursor: 'pointer' }}
                        onClick={handleDietClick}
                      />
                    </Box>
                  </Tooltip>
                  <Tooltip title='Edit' placement='top'>
                    <Box>
                      <Icon
                        icon='bx:pencil'
                        style={{ fontSize: 24, cursor: 'pointer' }}
                        onClick={() =>
                          Router.push({ pathname: '/diet/add-diet', query: { id: dietDetails.id, action: 'update' } })
                        }
                      />
                    </Box>
                  </Tooltip>
                  <Tooltip title='Delete' placement='top'>
                    <Box>
                      <Icon
                        onClick={() => {
                          handlelOpenDelete()
                        }}
                        icon='material-symbols:delete-outline'
                        style={{ fontSize: 24, cursor: 'pointer' }}
                      />
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
              <Box>
                {dietDetails?.desc ? (
                  <div>
                    <Typography sx={{ mb: 2, fontSize: '16px', fontWeight: '600' }}>Description</Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        width: '100%',
                        color: '#7A8684',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: expanded ? 'unset' : 3,
                        WebkitBoxOrient: 'vertical',
                        transition: 'max-height 2s ease-in-out',
                        maxHeight: expanded ? '1000px' : '60px'
                      }}
                    >
                      {convertToTitleCase(dietDetails.desc)}
                    </Typography>
                    {dietDetails.desc.length > 180 ? (
                      <Typography
                        onClick={toggleExpanded}
                        sx={{
                          fontWeight: '600',
                          fontSize: '13px',

                          textDecoration: 'underline',
                          color: '#000',
                          cursor: 'pointer'
                        }}
                      >
                        {expanded ? 'View less' : 'View more'}
                      </Typography>
                    ) : (
                      ''
                    )}
                  </div>
                ) : (
                  ''
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar
                    src={dietDetails?.created_by_user?.profile_pic || '/icons/recipedummy.svg'}
                    sx={{ width: '2rem', height: '2rem' }}
                  />
                  <Box>
                    <Typography
                      variant='subtitle2'
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: 'normal'
                      }}
                    >
                      {dietDetails?.created_by_user?.user_name}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: 'normal',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      Created on {moment(dietDetails?.created_at).format('DD/MM/YYYY')}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  onClick={() => setActivitySidebarOpen(true)}
                  sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}
                >
                  <Typography sx={{ color: '#000000', my: 3, fontSize: 14 }}>Activity Log</Typography>
                  <Icon icon='ph:clock' style={{ marginLeft: '4px', marginTop: '13px', fontSize: 20 }} />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
        {dietDetails?.id && (
          <ActivityLogs
            activitySidebarOpen={activitySidebarOpen}
            activity_type='diet'
            detailsValue={{ id: dietDetails?.id }}
            searchValue={activitySearchValue}
            setSearchValue={setActivitySearchValue}
            handleSidebarClose={handleSidebarClose}
          />
        )}
        {/* ////it is for delete /////////*/}
        <ConfirmationDialog
          icon={'mdi:delete'}
          iconColor={'#ff3838'}
          title={'Are you sure you want to delete this Diet?'}
          dialogBoxStatus={deleteDialogBox}
          onClose={handleCloseDetele}
          ConfirmationText={'Delete'}
          confirmAction={confirmDeleteAction}
          loading={loading}
        />

        {/* ////it is for status change /////////*/}
        <DeleteDialogConfirmation
          handleClosenew={handleClosenew}
          action={confirmStatusAction}
          open={confirmDialogBox}
          type='diet'
          active={isActive}
          message={
            <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
              {isActive === '1' ? 'Deactivate' : 'Activate'} Diet?
            </span>
          }
        />
        <ChangeDietName
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          dietname={dietDetails?.diet_name}
          dietid={dietDetails?.id}
        />
      </CardContent>
    </Card>
  )
}

export default DietDetailCard
