'use client';
import { Avatar, Card, Divider, CardContent, FormControlLabel, Switch, Typography } from '@mui/material'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components

// ** Utils Import
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'
import { feedStatusChange } from 'src/lib/api/diet/getFeedDetails'
import IconButton from '@mui/material/IconButton'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'

const FeedOverview = ({ isActive, setIsActive, FeedDetailsValue, permission }) => {
  const { t } = useTranslation()
  const [activePayload, setActivePayload] = useState(FeedDetailsValue?.active || false)
  const [confirmDialogBox, setConfirmDialogBox] = useState(false)

  const handleClosenew = () => {
    setConfirmDialogBox(false)
  }

  useEffect(() => {
    setIsActive(FeedDetailsValue?.active)
  }, [FeedDetailsValue])

  const handleSwitchChange = async event => {
    const newIsActive = event.target.checked ? 1 : 0
    setActivePayload(newIsActive)
    setConfirmDialogBox(true)
  }

  const confirmStatusAction = async () => {
    try {
      setConfirmDialogBox(false)
      const response = await feedStatusChange({ status: activePayload }, FeedDetailsValue?.id)

      if (response?.success) {
        setIsActive(Number(isActive) === 0 ? '1' : '0')

        // setIsActive(!isActive)
        Toaster({ type: 'success', message: response.message })
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {}
  }

  if (FeedDetailsValue) {
    return (
      <>
        <Grid size={{ xs: 6.5, md: 4 }} sx={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
          {/* <Card sx={{ boxShadow: 'none', background: '#EFF5F2' }}>
            <div
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
                  <Grid>
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
              style={{ borderRight: 'none', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0,
                  mb: 2
                }}
              >
                <div
                  style={{
                    borderRadius: '8px',
                    width: '100%',
                    height: '250px',
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

              <Grid>
                {/* <Typography sx={{ mb: 1, color: '#000', fontWeight: 500 }}>
                  {'ING' + IngredientsDetailsval.id}
                </Typography> */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive === '1' ? true : false}
                      onChange={permission ? handleSwitchChange : null}
                      fontSize={2}
                    />
                  }
                  labelPlacement='start'
                  label={isActive === '1' ? 'Active' : 'InActive'}
                  disabled={!permission}
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
              ></Box>
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
                    {t('diet_module.items_used')}
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
            dietCount={FeedDetailsValue.ingredients}
            message={
              <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
                {isActive === '1' ? 'Deactivate' : 'Activate'} {t('diet_module.feed_type')}?
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
