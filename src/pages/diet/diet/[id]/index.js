import React, { useState } from 'react'
import {
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Breadcrumbs,
  Grid,
  Avatar,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Divider,
  Paper,
  styled
} from '@mui/material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import DietDetailCard from './DietDetailCard'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { schedule } from './data'

const ScrollContainer = styled('div')({
  overflowX: 'auto',
  flexWrap: 'nowrap',
  scrollbarWidth: '10px', // For Firefox
  '::-webkit-scrollbar': {
    width: '0', // Hide scrollbar by default
    height: '0'
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: '#ccc',
    borderRadius: '2px'
  },
  '&:hover': {
    '::-webkit-scrollbar': {
      width: '4px', // Show scrollbar on hover
      height: '1px'
    }
  }
})

const DietDetail = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const [loader, setLoader] = useState(false)
  const [value, setValue] = useState('one')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  // const classes = useStyles()
  return (
    <>
      {loader ? (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      ) : (
        <Box container spacing={6}>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography color='inherit'>Diet</Typography>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/diet/diet')}>
              Diet
            </Typography>
            <Typography color='text.primary'>Diet Details</Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DietDetailCard />
            <Card sx={{ p: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 500, fontSize: '16px', lineHeight: '19.36px', color: '#7A8684' }}>
                  You have added{' '}
                  <span style={{ fontWeight: 500, fontSize: '20px', lineHeight: '24.2px', color: '#8479F9' }}>
                    {' '}
                    13 species{' '}
                  </span>{' '}
                  for this diet plan
                </Typography>
                <Button startIcon={<Icon icon='mi:add' />} variant='contained'>
                  ADD SPICES
                </Button>
              </Box>
              <Box>
                <TabContext value={value}>
                  <TabList
                    sx={{ '& button': { borderBottom: '0.5px solid #839D8D', color: '#839D8D' } }}
                    onChange={handleChange}
                    aria-label='simple tabs example'
                  >
                    <Tab value='full' label='Full Week' />
                    <Tab value='one' label='Monday' />
                    <Tab value='two' label='Tuesday' />
                    <Tab value='three' label='Wednesday' />
                    <Tab value='four' label='Thursday' />
                    <Tab value='five' label='Friday' />
                    <Tab value='six' label='Saturday' />
                    <Tab value='seven' label='Sunday' />
                  </TabList>
                  <TabPanel sx={{ overflowX: 'auto' }} value='full'>
                    <Grid sx={{ p: 0, pt: '24px' }} container>
                      <Grid md={8} item>
                        <Grid
                          container
                          sx={{
                            alignItems: 'center',
                            height: '40px',
                            backgroundColor: '#C1D3D04D'
                          }}
                        >
                          <Grid sx={{ position: 'sticky', left: 10, zIndex: 100 }} md={2} item>
                            <Typography
                              sx={{
                                pl: '16px',
                                fontSize: '12px',
                                lineHeight: '16px',
                                fontWeight: 600
                              }}
                            >
                              TIME
                            </Typography>
                          </Grid>
                          <Grid md={10} item>
                            <Typography sx={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600 }}>
                              MEAL DETAILS
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item md={4}>
                        {/* <ScrollContainer> */}
                        <Box
                          sx={{
                            display: 'flex',
                            height: '40px'
                          }}
                        >
                          <Box
                            sx={{
                              px: 6,
                              backgroundColor: '#C1D3D099',
                              minWidth: '110px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRight: '1px solid #C3CEC7'
                            }}
                          >
                            <Typography>COMMON</Typography>
                          </Box>
                          <Box
                            sx={{
                              backgroundColor: '#C1D3D099',
                              minWidth: '110px',
                              px: 6,
                              display: 'flex',
                              alignItems: 'center',
                              borderRight: '1px solid #C3CEC7'
                            }}
                          >
                            <Typography>MALE</Typography>
                          </Box>
                          <Box
                            sx={{
                              px: 6,
                              backgroundColor: '#C1D3D099',
                              minWidth: '110px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRight: '1px solid #C3CEC7'
                            }}
                          >
                            <Typography>FEMALE</Typography>
                          </Box>
                          <Box
                            sx={{
                              px: 6,
                              backgroundColor: '#C1D3D099',
                              minWidth: '110px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRight: '1px solid #C3CEC7'
                            }}
                          >
                            <Typography>Kid</Typography>
                          </Box>
                        </Box>
                        {/* </ScrollContainer> */}
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: '16px' }}>
                      {schedule.length > 0 &&
                        schedule.map((item, index) => (
                          <Grid
                            key={index}
                            container
                            sx={{
                              borderBottom: '1px solid #C3CEC7',
                              pb: '32px',
                              // pr: '16px',
                              pt: index === 0 ? null : '32px'
                            }}
                          >
                            <Grid sx={{ position: 'sticky', zIndex: 100, left: 0 }} md={1.5} item>
                              <Box sx={{ width: '80%' }}>
                                <Box sx={{ borderRadius: '25px', border: `2px dotted #00AFD6`, py: '5px', px: '4px' }}>
                                  <Typography
                                    sx={{
                                      textAlign: 'center',
                                      color: '#00AFD6',
                                      fontWeight: 500,
                                      fontSize: '16px',
                                      lineHeight: '19.36px'
                                    }}
                                  >
                                    {item?.startTime}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Box sx={{ width: 0, height: '19px', borderLeft: `2px solid #00AFD6` }}></Box>
                                </Box>

                                <Box sx={{ borderRadius: '25px', border: `2px dotted #00AFD6`, py: '5px', px: '4px' }}>
                                  <Typography
                                    sx={{
                                      textAlign: 'center',
                                      color: '#00AFD6',
                                      fontWeight: 500,
                                      fontSize: '16px',
                                      lineHeight: '19.36px'
                                    }}
                                  >
                                    {item?.endTime}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid md={10.5} item>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {item?.items?.map((item, index) => (
                                  <Grid sx={{ justifyContent: 'space-between' }} container>
                                    <Grid sx={{}} xs={7.3}>
                                      <Box
                                        key={index}
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          backgroundColor: '#E1F9ED',
                                          borderRadius: '8px',
                                          p: '12px',
                                          gap: '16px'
                                        }}
                                      >
                                        <Box>
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '12px'
                                            }}
                                          >
                                            <Box sx={{ display: 'flex' }}>
                                              {item?.category && (
                                                <Typography
                                                  sx={{
                                                    color: '#000',
                                                    lineHeight: '16.94px',
                                                    fontWeight: 600,
                                                    fontSize: '16px'
                                                  }}
                                                >
                                                  {item?.category}
                                                </Typography>
                                              )}
                                              {item?.prep && (
                                                <Typography
                                                  sx={{
                                                    color: '#7A8684',
                                                    lineHeight: '16.94px',
                                                    fontWeight: 400,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  &nbsp;-&nbsp; {item?.prep}
                                                </Typography>
                                              )}
                                            </Box>

                                            {item?.ingredient?.length > 0 && (
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  gap: '24px'
                                                }}
                                              >
                                                {item?.ingredient?.map((item, index) => (
                                                  <Box key={index} sx={{ display: 'flex' }}>
                                                    <Typography
                                                      sx={{
                                                        color: '#1F515B',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 400,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {item.name}&nbsp;
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        color: '#000',
                                                        lineHeight: '16.94px',
                                                        fontWeight: 600,
                                                        fontSize: '14px'
                                                      }}
                                                    >
                                                      {item?.percentage}
                                                    </Typography>
                                                  </Box>
                                                ))}
                                              </Box>
                                            )}
                                            {(item?.preparationType || item?.desc) && (
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  gap: '24px'
                                                }}
                                              >
                                                {item?.preparationType && (
                                                  <Typography
                                                    sx={{
                                                      color: '#1F515B',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    {item?.preparationType}
                                                  </Typography>
                                                )}
                                                {item?.desc && (
                                                  <Typography
                                                    sx={{
                                                      color: '#1F515B',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 400,
                                                      fontSize: '14px'
                                                    }}
                                                  >
                                                    {item?.desc}
                                                  </Typography>
                                                )}
                                              </Box>
                                            )}
                                            {item?.remarks && (
                                              <Box
                                                sx={{
                                                  backgroundColor: '#0000000d',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  p: '12px',
                                                  borderRadius: '8px'
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    color: '#000',
                                                    lineHeight: '16.94px',
                                                    fontWeight: 600,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  Remarks
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    color: '#000',
                                                    lineHeight: '16.94px',
                                                    fontWeight: 400,
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  {item?.remarks}
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        </Box>
                                        {item?.days?.length > 0 && (
                                          <>
                                            <Divider />
                                            <Box sx={{ display: 'flex', gap: '12px' }}>
                                              {item?.days?.map((item, index) => (
                                                <Box
                                                  key={index}
                                                  sx={{
                                                    width: '48px',
                                                    height: '32px',
                                                    borderRadius: '16px',
                                                    backgroundColor: '#0000000d',
                                                    display: 'center',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontWeight: 400,
                                                      fontSize: '13px',
                                                      lineHeight: '18px',
                                                      color: '#44544A'
                                                    }}
                                                  >
                                                    {item}
                                                  </Typography>
                                                </Box>
                                              ))}
                                            </Box>
                                          </>
                                        )}
                                      </Box>
                                    </Grid>
                                    <Grid sx={{ alignSelf: 'stretch' }} xs={4.5} item>
                                      {/* <ScrollContainer sx={{ height: '100%' }}> */}
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          height: '100%'
                                        }}
                                      >
                                        {item?.mealCategory?.common && (
                                          <Box
                                            sx={{
                                              left: 0,
                                              minWidth: '110px',
                                              height: '100%',
                                              mx: '8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '8px',
                                              backgroundColor: '#0000000d'
                                            }}
                                          >
                                            <Typography>{item?.mealCategory?.common}</Typography>
                                          </Box>
                                        )}
                                        {item?.mealCategory?.male && (
                                          <Box
                                            sx={{
                                              minWidth: '110px',
                                              height: '100%',
                                              mx: '8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '8px',
                                              backgroundColor: '#0000000d'
                                            }}
                                          >
                                            <Typography>{item?.mealCategory?.male}</Typography>
                                          </Box>
                                        )}
                                        {item?.mealCategory?.female && (
                                          <Box
                                            sx={{
                                              minWidth: '110px',
                                              height: '100%',
                                              mx: '8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '8px',
                                              backgroundColor: '#0000000d'
                                            }}
                                          >
                                            <Typography>{item?.mealCategory?.female}</Typography>
                                          </Box>
                                        )}
                                        {item?.mealCategory?.kid && (
                                          <Box
                                            sx={{
                                              minWidth: '110px',
                                              height: '100%',
                                              mx: '8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '8px',
                                              backgroundColor: '#0000000d'
                                            }}
                                          >
                                            <Typography>{item?.mealCategory?.kid}</Typography>
                                          </Box>
                                        )}
                                      </Box>
                                      {/* </ScrollContainer> */}
                                    </Grid>
                                  </Grid>
                                ))}
                              </Box>
                            </Grid>
                          </Grid>
                        ))}
                    </Box>
                  </TabPanel>
                  <TabPanel value='one'>
                    <Typography>
                      Cake apple pie chupa chups biscuit liquorice tootsie roll liquorice sugar plum. Cotton candy wafer
                    </Typography>
                  </TabPanel>
                  <TabPanel value='two'>
                    <Typography>
                      Cake apple pie chupa chups biscuit liquorice tootsie roll liquorice sugar plum. Cotton candy wafer
                    </Typography>
                  </TabPanel>
                </TabContext>
              </Box>
            </Card>
          </Box>
        </Box>
      )}
    </>
  )
}

export default DietDetail
