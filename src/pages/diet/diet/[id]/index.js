import React, { useEffect, useState } from 'react'
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
import { schedule } from './data'
import { getDietDetails } from 'src/lib/api/diet/dietList'

const DietDetail = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const [loader, setLoader] = useState(false)
  const [loaderTwo, setLoaderTwo] = useState(false)
  const [dietDetails, setDietDetails] = useState({})
  const [value, setValue] = useState('full')

  let startArry = []

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  useEffect(() => {
    if (id) {
      try {
        setLoaderTwo(true)
        getDietDetails(id, { week_day: value === 'full' ? '' : value }).then(response => {
          if (response.success === true) {
            // console.log('response', response.data)
            setDietDetails(response.data)
            setLoaderTwo(false)
          }
          setLoaderTwo(false)
        })
      } catch (error) {
        // console.log('DietDetals', error)
        setLoaderTwo(false)
      }
    }
  }, [id, value])

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

  const tabs = [
    { value: 'full', label: 'Full Week' },
    { value: '0', label: 'Monday' },
    { value: '1', label: 'Tuesday' },
    { value: '2', label: 'Wednesday' },
    { value: '3', label: 'Thursday' },
    { value: '4', label: 'Friday' },
    { value: '5', label: 'Saturday' },
    { value: '6', label: 'Sunday' }
  ]

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
            <DietDetailCard dietDetails={dietDetails} />
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
                    {tabs.map((item, index) => (
                      <Tab key={index} value={item.value} label={item.label} />
                    ))}
                  </TabList>
                  {tabs.map((item, index) => (
                    <>
                      {item?.value === value && (
                        <TabPanel sx={{ overflowX: 'auto', pb: 0, pl: '0px' }} key={index} value={item?.value}>
                          {loaderTwo ? (
                            <Box
                              sx={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <CircularProgress />
                            </Box>
                          ) : (
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
                                        pl: '0px',
                                        py: 0,
                                        width: '160px',
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
                                        left: '160px',
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
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {dietDetails?.day_wise_data?.map(itemd => {
                                    const startTimes = itemd?.meal_from_time
                                    const endTimes = itemd?.meal_to_time
                                    const ind = index

                                    // const itemData1 = itemd?.meal_types?.ingredient?.length
                                    //   ? itemd?.meal_types?.ingredient
                                    //   : []
                                    const itemData1 = itemd?.meal_types?.ingredient?.length
                                      ? itemd.meal_types.ingredient.map(item => ({ ...item, ingredient: true }))
                                      : []

                                    // console.log('itemData1', itemData1)
                                    const itemData2 = itemd?.meal_types?.recipe?.length
                                      ? itemd.meal_types.recipe.map(item => ({ ...item, recipe: true }))
                                      : []

                                    // const itemData3 = itemd?.meal_types?.ingredientwithchoice[0]?.ingredientList?.length
                                    //   ? itemd?.meal_types?.ingredientwithchoice[0]?.ingredientList?.map(item => ({
                                    //       ...item,
                                    //       ingredientwithchoice: true
                                    //     }))
                                    //   : []
                                    const itemData = [...itemData1, ...itemData2]

                                    return (
                                      <>
                                        {itemData?.length &&
                                          itemData?.map((item, index) => {
                                            let first = startArry.indexOf(itemd.meal_from_time) === -1
                                            startArry = [...startArry, itemd.meal_from_time]

                                            // console.log('item', item)
                                            return (
                                              <TableRow
                                                sx={{
                                                  borderBottom:
                                                    itemData?.items?.length === 0
                                                      ? '1px solid #C3CEC7'
                                                      : index === itemData?.length - 1
                                                      ? '1px solid #C3CEC7'
                                                      : 'none'
                                                }}
                                                key={index}
                                              >
                                                {first ? (
                                                  <TableCell
                                                    sx={{
                                                      position: 'sticky',
                                                      left: 0,
                                                      width: '160px',
                                                      border: 'none',
                                                      pl: '0px !important',
                                                      pr: '18px'
                                                    }}

                                                    // scope='row'
                                                  >
                                                    <Box
                                                      sx={{
                                                        borderRadius: '25px',
                                                        border: `2px dotted #00AFD6`,
                                                        py: '5px',
                                                        px: '2px'
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
                                                        sx={{
                                                          width: 0,
                                                          height: '19px',
                                                          borderLeft: `2px solid #00AFD6`
                                                        }}
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
                                                  <TableCell
                                                    sx={{
                                                      borderBottom:
                                                        index === itemd?.items?.length - 1
                                                          ? '1px solid #C3CEC7'
                                                          : 'none'
                                                    }}
                                                  ></TableCell>
                                                )}

                                                <TableCell
                                                  sx={{
                                                    position: 'sticky',
                                                    left: '160px',
                                                    pl: 0,
                                                    border: 'none',
                                                    backgroundColor: '#fff'
                                                  }}
                                                >
                                                  <Box
                                                    key={index}
                                                    sx={{
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      backgroundColor: item.ingredient
                                                        ? '#00D6C933'
                                                        : item.recipe
                                                        ? '#E1F9ED'
                                                        : 'white',
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
                                                          {item?.ingredient_name && (
                                                            <Typography
                                                              sx={{
                                                                color: '#000',
                                                                lineHeight: '16.94px',
                                                                fontWeight: 600,
                                                                fontSize: '16px'
                                                              }}
                                                            >
                                                              {item?.ingredient_name}
                                                            </Typography>
                                                          )}
                                                          {item?.recipe_name && (
                                                            <Typography
                                                              sx={{
                                                                color: '#000',
                                                                lineHeight: '16.94px',
                                                                fontWeight: 600,
                                                                fontSize: '16px'
                                                              }}
                                                            >
                                                              {item?.recipe_name}
                                                            </Typography>
                                                          )}
                                                          {item?.preparation_type_label && (
                                                            <Typography
                                                              sx={{
                                                                color: '#7A8684',
                                                                lineHeight: '16.94px',
                                                                fontWeight: 400,
                                                                fontSize: '14px'
                                                              }}
                                                            >
                                                              &nbsp;-&nbsp; {item?.preparation_type_label}
                                                            </Typography>
                                                          )}
                                                        </Box>

                                                        {item?.ingredients?.length > 0 && (
                                                          <Box
                                                            sx={{
                                                              display: 'flex',
                                                              flexWrap: 'wrap',
                                                              columnGap: `24px`,
                                                              rowGap: '10px'
                                                            }}
                                                          >
                                                            {item?.ingredients?.map((item, index) => (
                                                              <Box key={index} sx={{ display: 'flex' }}>
                                                                <Typography
                                                                  sx={{
                                                                    color: '#1F515B',
                                                                    lineHeight: '16.94px',
                                                                    fontWeight: 400,
                                                                    fontSize: '14px'
                                                                  }}
                                                                >
                                                                  {item?.ingredient_name}&nbsp;
                                                                </Typography>
                                                                <Typography
                                                                  sx={{
                                                                    color: '#000',
                                                                    lineHeight: '16.94px',
                                                                    fontWeight: 600,
                                                                    fontSize: '14px'
                                                                  }}
                                                                >
                                                                  {item?.quantity}%
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
                                                    <Divider />
                                                    {JSON?.parse(item?.days_of_week)?.length > 0 && (
                                                      <>
                                                        <Box sx={{ display: 'flex', gap: '12px' }}>
                                                          {Object.entries(item?.days_of_weeks).map(([key, value]) => (
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
                                                                {value}
                                                              </Typography>
                                                            </Box>
                                                          ))}
                                                        </Box>
                                                      </>
                                                    )}
                                                  </Box>
                                                  {index === itemData?.length - 1 ? (
                                                    <Box
                                                      sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px',
                                                        my: '10px'
                                                      }}
                                                    >
                                                      <Typography
                                                        sx={{
                                                          lineHeight: '29.05px',
                                                          fontSize: '20px',
                                                          fontWeight: 500,
                                                          color: '#44544A'
                                                        }}
                                                      >
                                                        Note:-
                                                      </Typography>
                                                      <Typography
                                                        sx={{
                                                          lineHeight: '19.36px',
                                                          fontSize: '16px',
                                                          fontWeight: 400,
                                                          color: '#44544A'
                                                        }}
                                                      >
                                                        {itemd.notes}{' '}
                                                      </Typography>
                                                    </Box>
                                                  ) : null}
                                                </TableCell>

                                                {item?.meal_type?.map((item, index) => (
                                                  <TableCell
                                                    key={index}
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
                                                      {item?.quantity && (
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
                                                            {item?.quantity} KG
                                                          </Typography>
                                                        </Box>
                                                      )}
                                                    </Box>
                                                  </TableCell>
                                                ))}
                                              </TableRow>
                                            )
                                          })}
                                        {/* <TableRow>
                                        <TableCell>ghjk</TableCell>
                                      </TableRow> */}
                                      </>

                                      // <Typography>ghjk</Typography>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </CustomScrollbar>
                          )}
                        </TabPanel>
                      )}
                    </>
                  ))}
                </TabContext>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Typography sx={{ lineHeight: '29.05px', fontSize: '24px', fontWeight: 500, color: '#44544A' }}>
                  Remarks
                </Typography>
                <Typography sx={{ lineHeight: '19.36px', fontSize: '16px', fontWeight: 400, color: '#44544A' }}>
                  {dietDetails?.remarks ? dietDetails?.remarks : 'No Remarks'}
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
