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
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import DietDetailCard from './DietDetailCard'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'

const DietDetail = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const [loader, setLoader] = useState(false)
  const [value, setValue] = useState('full')
  const schedule = []

  let startArry = []

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const useStyles = styled({
    table: {
      minWidth: 650
    },
    sticky: {
      position: 'sticky',
      left: 0,
      background: 'white',
      boxShadow: '5px 2px 5px grey',
      borderRight: '2px solid black'
    }
  })

  const CustomScrollbar = styled('div')({
    overflowX: 'auto', // or 'scroll'
    '&::-webkit-scrollbar': {
      width: 10, // specify your desired width
      height: 4 // specify your desired height
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent' // customize track color if needed
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'lightgray', // customize thumb color if needed
      borderRadius: 5 // specify border radius
    }
  })
  const classes = useStyles()

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
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: '20px',
                      lineHeight: '24.2px',
                      color: theme.palette.primary.main
                    }}
                  >
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
                  <TabPanel sx={{ overflowX: 'auto', pb: 0 }} value='full'>
                    <CustomScrollbar
                      style={{
                        maxWidth: '100%'
                      }}
                    >
                      <Table aria-label='simple table' style={{ tableLayout: 'fixed' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                border: 'none',
                                height: '40px',
                                backgroundColor: '#C1D3D04D',
                                pl: '16px',
                                py: 0,
                                width: '180px',
                                position: 'sticky',
                                left: 0
                              }}
                              className={classes.sticky}
                            >
                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  lineHeight: '16px',
                                  fontWeight: 600
                                }}
                              >
                                TIME
                              </Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                height: '40px',
                                backgroundColor: '#fff',
                                position: 'sticky',
                                left: '180px',
                                p: 0,
                                width: '700px'
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: '100%',
                                  backgroundColor: '#C1D3D04D'
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: '12px',
                                    lineHeight: '16px',
                                    fontWeight: 600
                                  }}
                                >
                                  MEAL DETAILS
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '127px',
                                borderRight: '1px solid #C3CEC7'
                              }}
                            >
                              <Typography>COMMON</Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '127px',
                                borderRight: '1px solid #C3CEC7'
                              }}
                            >
                              <Typography>MALE</Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '127px',
                                borderRight: '1px solid #C3CEC7'
                              }}
                            >
                              <Typography>FEMALE</Typography>
                            </TableCell>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '127px',
                                borderRight: '1px solid #C3CEC7'
                              }}
                            >
                              <Typography>KID</Typography>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {schedule?.map((itemd, index) => {
                            const startTimes = itemd.startTime
                            const endTimes = itemd.endTime
                            const ind = index

                            return (
                              <>
                                {itemd?.items?.map((item, index) => {
                                  let first = startArry.indexOf(itemd.startTime) === -1
                                  startArry = [...startArry, itemd.startTime]

                                  return (
                                    <TableRow
                                      sx={{
                                        borderBottom: first || ind == schedule.length - 1 ? '1px solid #C3CEC7' : 'none'
                                      }}
                                      key={index}
                                    >
                                      {first ? (
                                        <TableCell
                                          sx={{
                                            position: 'sticky',
                                            left: 0,
                                            width: '180px',
                                            border: 'none',
                                            pl: 0,
                                            pr: '36px'
                                          }}
                                          component='th'
                                          scope='row'
                                        >
                                          <Box
                                            sx={{
                                              borderRadius: '25px',
                                              border: `2px dotted #00AFD6`,
                                              py: '5px',
                                              px: '4px'
                                            }}
                                          >
                                            <Typography
                                              sx={{
                                                textAlign: 'center',
                                                color: '#00AFD6',
                                                fontWeight: 500,
                                                fontSize: '16px',
                                                lineHeight: '19.36px'
                                              }}
                                            >
                                              {startTimes}
                                            </Typography>
                                          </Box>
                                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <Box
                                              sx={{ width: 0, height: '19px', borderLeft: `2px solid #00AFD6` }}
                                            ></Box>
                                          </Box>

                                          <Box
                                            sx={{
                                              borderRadius: '25px',
                                              border: `2px dotted #00AFD6`,
                                              py: '5px',
                                              px: '4px'
                                            }}
                                          >
                                            <Typography
                                              sx={{
                                                textAlign: 'center',
                                                color: '#00AFD6',
                                                fontWeight: 500,
                                                fontSize: '16px',
                                                lineHeight: '19.36px'
                                              }}
                                            >
                                              {endTimes}
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                      ) : (
                                        <TableCell sx={{ border: 'none' }}></TableCell>
                                      )}

                                      <TableCell
                                        sx={{
                                          position: 'sticky',
                                          left: '180px',
                                          border: 'none',
                                          backgroundColor: '#fff'
                                        }}
                                      >
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
                                              {/* <Divider /> */}
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
                                      </TableCell>

                                      <TableCell
                                        style={{
                                          height: '10px',
                                          maxHeight: '100%',
                                          border: 'none',
                                          paddingLeft: '8px',
                                          paddingRight: '8px'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {item?.mealCategory?.common && (
                                            <Box
                                              sx={{
                                                backgroundColor: '#0000000d',
                                                p: '10px',
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderRadius: '8px',
                                                height: '100%'
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color: '#000',
                                                  lineHeight: '16.94px',
                                                  fontWeight: 400,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                {item?.mealCategory?.common}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          paddingLeft: '8px',
                                          paddingRight: '8px',
                                          height: '10px',
                                          maxHeight: '100%',
                                          border: 'none'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {item?.mealCategory?.male && (
                                            <Box
                                              sx={{
                                                backgroundColor: '#0000000d',
                                                p: '10px',
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderRadius: '8px',
                                                height: '100%'
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color: '#000',
                                                  lineHeight: '16.94px',
                                                  fontWeight: 400,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                {item?.mealCategory?.male}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          paddingLeft: '8px',
                                          paddingRight: '8px',
                                          height: '10px',
                                          maxHeight: '100%',
                                          border: 'none'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {item?.mealCategory?.female && (
                                            <Box
                                              sx={{
                                                backgroundColor: '#0000000d',
                                                p: '10px',
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderRadius: '8px',
                                                height: '100%'
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color: '#000',
                                                  lineHeight: '16.94px',
                                                  fontWeight: 400,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                {item?.mealCategory?.female}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          paddingLeft: '8px',
                                          paddingRight: '8px',
                                          height: '10px',
                                          maxHeight: '100%',
                                          border: 'none'
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {item?.mealCategory?.kid && (
                                            <Box
                                              sx={{
                                                backgroundColor: '#0000000d',

                                                // mx: '5px',
                                                p: '10px',
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderRadius: '8px',
                                                height: '100%'
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color: '#000',
                                                  lineHeight: '16.94px',
                                                  fontWeight: 400,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                {item?.mealCategory?.kid}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CustomScrollbar>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Typography sx={{ lineHeight: '29.05px', fontSize: '24px', fontWeight: 500, color: '#44544A' }}>
                  Remarks
                </Typography>
                <Typography sx={{ lineHeight: '19.36px', fontSize: '16px', fontWeight: 400, color: '#44544A' }}>
                  {' '}
                  <span>1.&nbsp;</span>Offer 2 times a week larger piece on tree trunk with bark
                </Typography>
              </Box>
            </Card>
          </Box>
        </Box>
      )}
    </>
  )
}

export default DietDetail
