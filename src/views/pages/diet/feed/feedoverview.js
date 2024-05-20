import { Avatar, Card, Divider, CardContent, FormControlLabel, Switch, Typography } from '@mui/material'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import Router from 'next/router'

// ** Utils Import
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import { feedStatusChange } from 'src/lib/api/diet/getFeedDetails'
import IconButton from '@mui/material/IconButton'

const FeedOverview = ({ isActive, setIsActive, FeedDetailsValue }) => {
  // const [isActive, setIsActive] = useState(FeedDetailsValue?.active || '0')
  const [activePayload, setActivePayload] = useState(FeedDetailsValue?.active || false)
  const [confirmDialogBox, setConfirmDialogBox] = useState(false)

  const handleClosenew = () => {
    setConfirmDialogBox(false)

    // setIsActive(FeedDetailsValue.active)
  }
  useEffect(() => {
    setIsActive(FeedDetailsValue?.active)
  }, [FeedDetailsValue])

  const handleSwitchChange = async event => {
    const newIsActive = event.target.checked ? 1 : 0
    setActivePayload(newIsActive)

    // setIsActive(newIsActive)
    setConfirmDialogBox(true)
  }

  const confirmStatusAction = async () => {
    try {
      setConfirmDialogBox(false)
      const response = await feedStatusChange({ status: activePayload }, FeedDetailsValue?.id)

      // console.log(response, 'response')
      if (response?.success === true) {
        setIsActive(isActive === '0' ? '1' : '0')

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

  if (FeedDetailsValue) {
    return (
      <>
        <Grid item xs={4}>
          {/* <Card sx={{ boxShadow: 'none', background: '#EFF5F2' }}>
            <div
              item
              md={3}
              xs={12}
              style={{ borderRight: 'none', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <Avatar
                    variant='square'
                    alt={FeedDetailsValue.image}
                    sx={{
                      width: '100%',
                      height: '100%'
                    }}
                    src={FeedDetailsValue.image ? FeedDetailsValue.image : '/icons/recipedummy.svg'}
                  ></Avatar>
                </div>
              </CardContent>
            </div>
            <CardContent sx={{ py: 0 }}>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2
                }}
              >
                <Box sx={{}}></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Grid item>
                    <FormControlLabel
                      control={
                        <Switch
                          // checked={FeedDetailsValue.active === '1' ? true : false}
                          checked={isActive === '1' ? true : false}
                          onChange={handleSwitchChange}
                          fontSize={2}
                        />
                      }
                      labelPlacement='start'
                      label={isActive === '1' ? 'Active' : 'InActive'}
                    />
                  </Grid>
                </Box>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  my: 3
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Ingredients used
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                    {FeedDetailsValue.ingredients + ' nos'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card> */}
          <Card sx={{ boxShadow: 'none', background: '#EFF5F2' }}>
            <div
              item
              md={3}
              xs={12}
              style={{ borderRight: 'none', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '18px',
                    width: '120px',
                    height: '120px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Avatar
                    variant='square'
                    alt={FeedDetailsValue.image}
                    sx={{
                      width: '100%',
                      height: '100%'
                    }}
                    src={FeedDetailsValue.image ? FeedDetailsValue.image : '/icons/recipedummy.svg'}
                  ></Avatar>
                </div>
              </CardContent>

              <Grid item>
                {/* <Typography sx={{ mb: 1, color: '#000', fontWeight: 500 }}>
                  {'ING' + IngredientsDetailsval.id}
                </Typography> */}
                <FormControlLabel
                  control={
                    <Switch checked={isActive === '1' ? true : false} onChange={handleSwitchChange} fontSize={2} />
                  }
                  labelPlacement='start'
                  label={isActive === '1' ? 'Active' : 'InActive'}
                />
              </Grid>
            </div>
            <Divider sx={{ mt: 3, mx: 4, borderColor: '#C3CEC7' }} />
            <CardContent sx={{ py: 0 }}>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2
                }}
              >
                <Box sx={{}}></Box>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  my: 3
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Ingredients used
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='body2' sx={{ mr: 1.5, color: '#7A8684' }}>
                    {FeedDetailsValue.ingredients + ' nos'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <DeleteDialogConfirmation
            handleClosenew={handleClosenew}
            action={confirmStatusAction}
            open={confirmDialogBox}
            typeCount={FeedDetailsValue?.ingredients}
            type='feed'
            active={isActive}
            message={
              <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
                {isActive === '1' ? 'Deactivate' : 'Activate'} Feed Type?
              </span>
            }
          />
        </Grid>
      </>
    )
  } else {
    return null
  }
}

export default FeedOverview
