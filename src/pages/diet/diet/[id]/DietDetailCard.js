import React, { useState } from 'react'
import { Typography, Box, Switch, FormControlLabel, Grid, Avatar, Card, CardContent } from '@mui/material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'

const DietDetailCard = () => {
  const router = useRouter()
  const theme = useTheme()
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
                  height: '100%'
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
                        <Switch
                          //   checked={IngredientsDetailsval.active === '1' ? true : false}
                          //   onChange={handleSwitchChange}
                          fontSize={2}
                        />
                      }
                      labelPlacement='start'
                      //   label={IngredientsDetailsval.active === '1' ? 'Active' : 'InActive'}
                      label={'InActive'}
                    />
                  </Box>
                  <Box>
                    <Icon icon='bx:pencil' style={{ fontSize: 24 }} />
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
                  Provide sustained energy, aid in digestion, and contribute to heart health while offering a wholesome
                  and hearty texture to a variety of dishes. Consider abit Incorporating whole grains into your diet is
                  a smart choice for overall well-being and nutrition. Packed with dietary fiber, vitamins, minerals,
                  and art and fruit hearty texture to a variety of dishes Provide sustained energy, aid in digestion,
                  and contribute to heart health while offering a wholesome and hearty texture to a variety of dishes.
                  Consider abit Incorporating whole grains into your diet is a smart choice for overall well-being and
                  nutrition. Packed with dietary fiber, vitamins, minerals, and art and fruit hearty texture to a
                  variety of dishes{' '}
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
                  // onClick={() => setActivitySidebarOpen(true)}
                  sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}
                >
                  <Typography sx={{ color: '#000000', my: 3, fontSize: 14 }}>Activity Log</Typography>
                  <Icon icon='ph:clock' style={{ marginLeft: '4px', marginTop: '13px', fontSize: 20 }} />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default DietDetailCard
