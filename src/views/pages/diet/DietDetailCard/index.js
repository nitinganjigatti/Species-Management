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
  useMediaQuery,
  Button,
  Menu,
  MenuItem
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
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const DietDetailCard = ({
  dietDetails,
  dietModuleAccess,
  refreshDietDetails,
  handleSpeciesClick,
  handleSpeciesClicknew,
  setapplyfilterCheck,
  authData
}) => {
  const router = useRouter()
  const { source, recipeId, ingId } = router.query
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [activitySearchValue, setActivitySearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // const [searchValue, setSearchValue] = useState('')

  const [deleteDialogBox, setDeleteDialogBox] = useState(false)

  const [isActive, setIsActive] = useState(dietDetails?.active || '0')

  const [activePayload, setActivePayload] = useState(false)
  const [confirmDialogBox, setConfirmDialogBox] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleSwitchChange = async event => {
    if (dietModuleAccess && (dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE')) {
      const newIsActive = event.target.checked ? 1 : 0
      setActivePayload(newIsActive)
      setConfirmDialogBox(true)
    }
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
  }

  const confirmStatusAction = async () => {
    try {
      setConfirmDialogBox(false)
      const response = await dietStatusChange({ status: activePayload }, dietDetails?.id)

      if (response.success) {
        setIsActive(isActive === '0' ? '1' : '0')
        refreshDietDetails()
        Toaster({ type: 'success', message: response.message })
      } else {
        alert('something went wrong')
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const handlebackClick = () => {
    if (source !== undefined && source === 'recipedetail') {
      Router.push({
        pathname: `/diet/recipe/${recipeId}`,
        query: { source: 'fromdiet' }
      })
    } else if (source !== undefined && source === 'ingdetail') {
      Router.push({
        pathname: `/diet/ingredient/${ingId}`,
        query: { source: 'fromdiet' }
      })
    } else {
      Router.back()
    }
  }

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            float: 'left',
            gap: '16px',
            alignItems: 'center',
            pb: 4,
            pl: 1
          }}
        >
          <Icon
            style={{ cursor: 'pointer' }}
            onClick={handlebackClick}
            color={theme.palette.customColors.OnSurfaceVariant}
            icon='material-symbols:arrow-back'
          />
          <Typography
            sx={{
              color: theme.palette.secondary.dark,
              fontWeight: 500,
              fontSize: '24px',
              lineHeight: '29.05px'
            }}
          >
            Diet Details
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: isSmallDevice ? '16px' : '24px',
            alignItems: 'center',
            flexDirection: isSmallDevice ? 'row' : 'row',
            flexWrap: isSmallDevice ? 'row' : 'nowrap',
            float: 'right'
          }}
        >
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isActive === '1' ? true : false}
                  onChange={handleSwitchChange}
                  fontSize={2}
                  disabled={!(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE')}
                  sx={{
                    '&.Mui-disabled': {
                      color: 'grey'
                    },
                    '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                      backgroundColor: '#ccc',
                      opacity: 0.7
                    }
                  }}
                />
              }
              labelPlacement='start'
              label={isActive === '1' ? 'Active' : 'InActive'}
              sx={{ marginLeft: isSmallDevice ? '0px' : '16px' }}
            />
          </Box>
          {(dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
            <Tooltip title='Copy' placement='top'>
              <Box>
                <Avatar
                  sx={{ width: '100%', height: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: 24 }}
                  src={'/icons/icon_copy.svg'}
                  variant='square'
                  onClick={handleDietClick}
                />
              </Box>
            </Tooltip>
          )}
          {(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
            <Tooltip title='Edit' placement='top'>
              <Box>
                <Avatar
                  sx={{ width: '100%', height: '100%', cursor: 'pointer' }}
                  src={'/icons/pencil_outlined.svg'}
                  variant='square'
                  onClick={() =>
                    Router.push({ pathname: '/diet/add-diet', query: { id: dietDetails.id, action: 'update' } })
                  }
                />
              </Box>
            </Tooltip>
          )}
          {dietModuleAccess === 'DELETE' && (
            <Tooltip title='Delete' placement='top'>
              <Box>
                <Avatar
                  sx={{ width: '100%', height: '100%', borderRadius: '8px', cursor: 'pointer' }}
                  src={'/icons/delete_outlined.svg'}
                  variant='square'
                  onClick={() => {
                    handlelOpenDelete()
                  }}
                />
              </Box>
            </Tooltip>
          )}
        </Box>
        <Grid
          sx={{
            justifyContent: 'space-between',
            gap: isSmallDevice ? '25px' : '24px',
            boxSizing: 'border-box',
            flexWrap: 'nowrap',
            alignItems: 'flex-start'
          }}
          container
        >
          <Grid size={{ xs: 12, md: 3.8 }}>
            <Box
              sx={{
                maxWidth: 400,
                border: '1px solid #d0d0d0',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {/* Image Section */}
              <Avatar
                variant='square'
                alt={dietDetails?.image}
                sx={{
                  width: '100%',

                  height: '145px',
                  borderRadius: '8px',
                  '& img': {
                    objectFit: isSmallDevice ? '' : 'cover',
                    objectPosition: isSmallDevice ? 'left' : 'center'
                  }
                }}
                src={dietDetails?.image ? dietDetails?.image : '/images/diet_default.svg'}
              ></Avatar>

              {/* Details Section */}
              <Box sx={{ p: 3, pt: 5 }}>
                {authData?.userData?.roles?.settings?.assign_diet === true ? (
                  <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                    <Typography fontWeight='400' sx={{ color: theme.palette.customColors.secondaryBg }}>
                      Assigned to
                    </Typography>
                    <div>
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={handleClick}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          color: theme.palette.primary.dark,
                          pl: 4,
                          pr: 4,
                          pt: 2,
                          pb: 2
                        }}
                      >
                        + Assign
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        sx={{
                          '& .MuiPaper-root': {
                            boxShadow: 'none',
                            minWidth: 150,
                            position: 'absolute'
                          }
                        }}
                      >
                        <MenuItem
                          onClick={() => {
                            handleSpeciesClick('species')
                            handleClose()
                            setapplyfilterCheck(false)
                          }}
                          sx={{ fontSize: '14px' }}
                        >
                          Assign to Species
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleSpeciesClick('animals')
                            handleClose()
                            setapplyfilterCheck(false)
                          }}
                          sx={{ fontSize: '14px' }}
                        >
                          Assign to Animals
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleSpeciesClick('site_species')
                            handleClose()
                            setapplyfilterCheck(false)
                          }}
                          sx={{ fontSize: '14px' }}
                        >
                          Assign Site to Species
                        </MenuItem>
                      </Menu>
                    </div>
                  </Box>
                ) : (
                  ''
                )}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    {dietDetails?.total_species !== '0' ? (
                      <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Typography
                          variant='body2'
                          fontWeight='bold'
                          sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '16px' }}
                        >
                          Species
                        </Typography>
                        <Box
                          display='flex'
                          alignItems='center'
                          onClick={() => handleSpeciesClicknew('details', 'species')}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Typography variant='h6' color={theme.palette.primary.main}>
                            {dietDetails.total_species}
                          </Typography>
                          <Typography
                            variant='caption'
                            sx={{
                              background: theme.palette.customColors.bodyBg,
                              p: '5px',
                              borderRadius: '3px',
                              ml: 2,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: '600'
                            }}
                          >
                            Primary {dietDetails.total_primary_species}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      ''
                    )}
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    {dietDetails?.total_animals !== '0' ? (
                      <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ pb: 3 }}>
                        {/* Label */}
                        <Typography
                          variant='body2'
                          fontWeight='bold'
                          sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '16px' }}
                        >
                          Animals
                        </Typography>

                        <Box
                          display='flex'
                          alignItems='center'
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleSpeciesClicknew('details', 'animals')}
                        >
                          <Typography variant='h6' color={theme.palette.primary.main}>
                            {dietDetails.total_animals}
                          </Typography>
                          <Typography
                            variant='caption'
                            sx={{
                              background: theme.palette.customColors.bodyBg,
                              p: '5px',
                              borderRadius: '3px',
                              ml: 2,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: '600'
                            }}
                          >
                            Primary {dietDetails.total_primary_animals}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      ''
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 7.8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isSmallDevice ? 'column' : 'row',
                  justifyContent: isSmallDevice ? 'flex-start' : 'space-between',
                  alignItems: isSmallDevice ? 'flex-start' : 'center',
                  gap: isSmallDevice ? '16px' : '0'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: '22px', color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    {dietDetails?.diet_no}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontStyle: 'italic'
                    }}
                  >
                    {dietDetails?.diet_name}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  mb: '6px',
                  maxWidth: '400px'
                }}
              >
                <UserAvatarDetails
                  profile_image={dietDetails?.dietitian?.profile_pic}
                  user_name={dietDetails?.dietitian?.user_name}
                  size='small'
                />

                <Typography
                  sx={{
                    color: theme.palette.customColors.Outline,
                    fontSize: '14px',
                    fontWeight: '500',
                    lineHeight: '100%',
                    letterSpacing: '0.1px',
                    display: 'flex'
                  }}
                >
                  <span style={{ margin: '0px 8px 0px 0px' }}>&#8226;</span>
                  <span>Super Admin</span>
                </Typography>
              </Box>
              <Box>
                {dietDetails?.desc ? (
                  <div>
                    <Typography sx={{ mb: 2, fontSize: '16px', fontWeight: '600' }}>Description</Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        width: '100%',
                        color: theme.palette.customColors.secondaryBg,
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
                          color: theme.palette.common.black,
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isSmallDevice ? 'column' : 'row',
                  justifyContent: isSmallDevice ? 'flex-start' : 'space-between',
                  alignItems: isSmallDevice ? 'flex-start' : 'center',
                  gap: isSmallDevice ? '16px' : '0'
                }}
              >
                <Box sx={{ display: 'flex', gap: '12px' }}>
                  <Box>
                    <Typography sx={{ mb: 2, mt: '8px', fontSize: '16px', fontWeight: '600' }}>
                      Diet Added by
                    </Typography>
                    <UserAvatarDetails
                      date={dietDetails?.created_at}
                      profile_image={dietDetails?.created_by_user?.profile_pic}
                      user_name={dietDetails?.created_by_user?.user_name}

                      // date={dietDetails?.created_at}
                    />
                  </Box>
                  {/* <Avatar
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
                  </Box> */}
                </Box>
                {(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
                  <Box
                    onClick={() => setActivitySidebarOpen(true)}
                    sx={{ display: 'flex', marginLeft: isSmallDevice ? '0' : 'auto', cursor: 'pointer' }}
                  >
                    <Typography sx={{ color: theme.palette.customColors.deepDark, my: 3, fontSize: 14 }}>
                      Activity Log
                    </Typography>
                    <Icon icon='ph:clock' style={{ marginLeft: '4px', marginTop: '13px', fontSize: 20 }} />
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
        {dietDetails?.id && (dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
          <ActivityLogs
            activitySidebarOpen={activitySidebarOpen}
            activity_type='diet'
            detailsValue={dietDetails}
            searchValue={activitySearchValue}
            setSearchValue={setActivitySearchValue}
            handleSidebarClose={handleSidebarClose}
          />
        )}
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
