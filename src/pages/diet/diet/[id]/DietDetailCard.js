import React, { useState } from 'react'
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
import ActivityLogs from 'src/@core/components/activityLogs'
import ConfirmationDialog from 'src/@core/components/dialogs/confirmation-dialog'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import toast from 'react-hot-toast'
import { dietStatusChange } from 'src/lib/api/diet/dietList'

const DietDetailCard = () => {
  const router = useRouter()
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)

  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [activitySearchValue, setActivitySearchValue] = useState('')

  // const [searchValue, setSearchValue] = useState('')

  const [deleteDialogBox, setDeleteDialogBox] = useState(false)

  // const [isActive, setIsActive] = useState(FeedDetailsValue?.active || '0')
  const [isActive, setIsActive] = useState('0')
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

  const onClose = () => {
    setDeleteDialogBox(false)
  }

  const handleSidebarClose = () => {
    setActivitySidebarOpen(false)
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const DietDetailsValue = { id: 1 }
  const textpara = ` Provide sustained energy, aid in digestion, and contribute to heart health while offering a wholesome
  and hearty texture to a variety of dishes. Consider abit Incorporating whole grains into your diet is
  a smart choice for overall well-being and nutrition. Packed with dietary fiber, vitamins, minerals,
  and art and fruit hearty texture to a variety of dishes Provide sustained energy, aid in digestion,
  and contribute to heart health while offering a wholesome and hearty texture to a variety of dishes.
  Consider abit Incorporating whole grains into your diet is a smart choice for overall well-being and
  nutrition. Packed with dietary fiber, vitamins, minerals, and art and fruit hearty texture to a
  variety of dishes`

  const confirmDeleteAction = async () => {
    // try {
    //   const response = await feedDelete(FeedDetailsValue?.id)
    //   if (response.success === true) {
    //     setDeleteDialogBox(false)
    //     return toast(
    //       t => (
    //         <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    //           <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //             <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: '#37BD69' }} />
    //             <div>
    //               <Typography sx={{ fontWeight: 500 }} variant='h5'>
    //                 Success!
    //               </Typography>
    //               <Divider sx={{ my: 2 }} />
    //               <Typography variant='body2' sx={{ color: '#44544A' }}>
    //                 {response.message}
    //               </Typography>
    //             </div>
    //           </Box>
    //           <IconButton
    //             onClick={() => toast.dismiss(t.id)}
    //             style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
    //           >
    //             <Icon icon='mdi:close' fontSize={24} />
    //           </IconButton>
    //         </Box>
    //       ),
    //       {
    //         style: {
    //           minWidth: '450px',
    //           minHeight: '130px'
    //         }
    //       }
    //     )
    //   } else {
    //     setDeleteDialogBox(false)
    //     return toast(
    //       t => (
    //         <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    //           <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //             <Icon icon='ooui:error' style={{ marginRight: '20px', fontSize: 50, color: 'red' }} />
    //             <div>
    //               <Typography sx={{ fontWeight: 500 }} variant='h5'>
    //                 Error!
    //               </Typography>
    //               <Divider sx={{ my: 2 }} />
    //               <Typography variant='body2' sx={{ color: '#44544A' }}>
    //                 {response.message}
    //               </Typography>
    //             </div>
    //           </Box>
    //           <IconButton
    //             onClick={() => toast.dismiss(t.id)}
    //             style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
    //           >
    //             <Icon icon='mdi:close' fontSize={24} />
    //           </IconButton>
    //         </Box>
    //       ),
    //       {
    //         style: {
    //           minWidth: '450px',
    //           minHeight: '130px'
    //         }
    //       }
    //     )
    //   }
    // } catch (error) {
    //   console.log('dfghj', error)
    // }
    console.log('first')
  }

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(value, sortColumning)
  // }

  const confirmStatusAction = async () => {
    try {
      setConfirmDialogBox(false)
      // const response = await dietStatusChange({ status: activePayload }, FeedDetailsValue?.id)
      const response = await dietStatusChange({ status: activePayload }, 1)

      console.log(response, 'response')
      if (response.success === true) {
        setIsActive(isActive == '0' ? '1' : '0')
        return toast(
          t => (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: '#37BD69' }} />
                <div>
                  <Typography sx={{ fontWeight: 500 }} variant='h5'>
                    Success!
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='body2' sx={{ color: '#44544A' }}>
                    {response.message}
                    {/* Recipe {'REP' + FeedDetailsValue.id} has been successfully{' '}
                    {isActive === 1 ? 'activated' : 'deactivated'} */}
                  </Typography>
                </div>
              </Box>
              <IconButton
                onClick={() => toast.dismiss(t.id)}
                style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          ),
          {
            style: {
              minWidth: '450px',
              minHeight: '130px'
            }
          }
        )
      } else {
        alert('something went wrong')
      }
    } catch (error) {}
  }

  return (
    <Card>
      <CardContent>
        <Grid sx={{ justifyContent: 'center', gap: '24px', boxSizing: 'border-box' }} container>
          <Grid md={3.8} item>
            <Box item sx={{ background: '#EFF5F2', borderTopLeftRadius: 36, borderTopRightRadius: 36 }}>
              <Avatar
                variant='square'
                // alt={FeedDetailsValue.image}
                alt={'FeedDetailsValue.image'}
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px'
                }}
                src={'/icons/recipedummy.svg'}
                // src={FeedDetailsValue.image ? FeedDetailsValue.image : '/icons/recipedummy.svg'}
              ></Avatar>
              <Box
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
              </Box>
            </Box>
          </Grid>
          <Grid item md={7.8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: '24px', color: '#44544A', lineHeight: '29.05px' }}>
                    Omnivore Delight
                  </Typography>
                  <Typography sx={{ fontWeight: 400, fontSize: '16px', color: '#44544A', lineHeight: '19.36px' }}>
                    DIET000123
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch checked={isActive === '1' ? true : false} onChange={handleSwitchChange} fontSize={2} />
                      }
                      labelPlacement='start'
                      // label={IngredientsDetailsval.active === '1' ? 'Active' : 'InActive'}
                      label={'InActive'}
                    />
                  </Box>
                  <Box>
                    <Icon
                      icon='bx:pencil'
                      style={{ fontSize: 24 }}
                      // onClick={() =>
                      //   Router.push({ pathname: '/diet/feed/add-feed', query: { id: FeedDetailsValue?.id } })
                      // }
                    />
                  </Box>
                  <Box>
                    <Icon icon='material-symbols:delete-outline' style={{ fontSize: 24 }} />
                  </Box>
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: '16px', color: '#44544A', mb: '8px' }}>
                  Description
                </Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#44544A' }}>
                  {!expanded ? textpara.slice(0, 400) + '...' : textpara}
                  {/* {expanded && <span>&nbsp;more</span>} &nbsp; */}
                  &nbsp;
                  <span
                    style={{
                      cursor: 'pointer',
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '16.94px',
                      textDecoration: 'underline'
                    }}
                    onClick={toggleExpanded}
                  >
                    {expanded ? 'View less' : 'View more'}
                  </span>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar src={'/icons/recipedummy.svg'} sx={{ width: '2rem', height: '2rem' }} />
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
                      {'item.user_name'}
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
                      Ingredient
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
        <ActivityLogs
          activitySidebarOpen={activitySidebarOpen}
          activity_type='diet'
          detailsValue={DietDetailsValue}
          searchValue={activitySearchValue}
          setSearchValue={setActivitySearchValue}
          handleSidebarClose={handleSidebarClose}
        />
        <ConfirmationDialog
          icon={'mdi:delete'}
          iconColor={'#ff3838'}
          title={'Are you sure you want to delete this Feed?'}
          // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
          dialogBoxStatus={deleteDialogBox}
          onClose={onClose}
          ConfirmationText={'Delete'}
          confirmAction={confirmDeleteAction}
        />

        {/* ////it is for status change /////////*/}
        <DeleteDialogConfirmation
          handleClosenew={handleClosenew}
          action={confirmStatusAction}
          open={confirmDialogBox}
          // typeCount={FeedDetailsValue?.ingredients}
          type='diet'
          active={isActive}
          message={
            <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
              {isActive === '1' ? 'Deactivate' : 'Activate'} Diet?
            </span>
          }
        />
      </CardContent>
    </Card>
  )
}

export default DietDetailCard
