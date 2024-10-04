import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Breadcrumbs,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Divider,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import DietDetailCard from '../../../../views/pages/diet/DietDetailCard'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { getDietDetails } from 'src/lib/api/diet/dietList'
import moment from 'moment'

const DietDetail = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const [loader, setLoader] = useState(true)
  const [loaderTwo, setLoaderTwo] = useState(false)
  const [dietDetails, setDietDetails] = useState({})
  const [value, setValue] = useState('full')
  const schedule = []

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
            setDietDetails(response?.data)
            setLoaderTwo(false)
            setLoader(false)
          }
          setLoaderTwo(false)
          setLoader(false)
        })
      } catch (error) {
        // console.log('DietDetals', error)
        setLoaderTwo(false)
        setLoader(false)
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
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
    { value: '7', label: 'Sunday' }
  ]

  const Day = [
    { id: 0, name: 'All', isActive: false },
    { id: 1, name: 'Mon', isActive: false },
    { id: 2, name: 'Tue', isActive: false },
    { id: 3, name: 'Wed', isActive: false },
    { id: 4, name: 'Thu', isActive: false },
    { id: 5, name: 'Fri', isActive: false },
    { id: 6, name: 'Sat', isActive: false },
    { id: 7, name: 'Sun', isActive: false }
  ]
  const getDayName = dayId => {
    const day = Day.find(d => d.id === dayId)

    return day ? day.name : ''
  }

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
              <Typography sx={{ fontWeight: 500, fontSize: '20px', lineHeight: '24.2px' }}>
                Meals Plan - {dietDetails?.diet_type_name}
              </Typography>
              {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
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
                </Box>

                <Button startIcon={<Icon icon='mi:add' />} variant='contained'>
                  ADD SPECIES
                </Button>
              </Box> */}
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
                      {console.log(item, 'item')}
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
                              {console.log(dietDetails, 'dietDetails')}
                              <Table aria-label='simple table' style={{ tableLayout: 'fixed' }}>
                                {dietDetails.meal_data.every(
                                  all =>
                                    (!all?.ingredient || all?.ingredient?.length === 0) &&
                                    (!all?.ingredientwithchoice || all?.ingredientwithchoice?.length === 0) &&
                                    (!all?.recipe || all?.recipe?.length === 0)
                                ) ? (
                                  <div>No records to show</div>
                                ) : (
                                  <TableHead>
                                    <TableRow>
                                      <TableCell
                                        style={{ padding: '0px' }}
                                        sx={{
                                          border: 'none',
                                          height: '40px',
                                          backgroundColor: '#fff',
                                          width: '160px',
                                          position: 'sticky',
                                          left: 0
                                        }}
                                        className={classes.sticky}
                                      >
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: '100%',
                                            padding: '17px',
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
                                            TIME
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          border: 'none',
                                          height: '40px',
                                          backgroundColor: '#fff',
                                          position: 'sticky',
                                          left: '160px',
                                          p: 0,
                                          width: '580px'
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

                                      {/* {dietDetails?.meal_data?.length > 0
                                      ? dietDetails?.meal_data[0]?.ingredient?.length > 0
                                        ? dietDetails?.meal_data[0]?.ingredient[0].meal_type?.map((item, index) => (
                                            <TableCell
                                              key={index}
                                              sx={{
                                                border: 'none',
                                                backgroundColor: '#C1D3D099',
                                                height: '40px',
                                                width: '134px',
                                                textAlign: 'center',
                                                borderRight:
                                                  index + 1 ===
                                                  dietDetails?.meal_data[0]?.ingredient[0].meal_type?.length
                                                    ? null
                                                    : '1px solid #C3CEC7'
                                              }}
                                            >
                                              <Typography>
                                                {item?.meal_value_header}&nbsp;{item?.weight_uom_label}
                                              </Typography>
                                            </TableCell>
                                          ))
                                        : dietDetails?.meal_data[0]?.recipe?.length > 0
                                        ? dietDetails?.meal_data[0]?.recipe[0].meal_type?.map((item, index) => (
                                            <TableCell
                                              key={index}
                                              sx={{
                                                border: 'none',
                                                backgroundColor: '#C1D3D099',
                                                height: '40px',
                                                width: '134px',
                                                textAlign: 'center',
                                                borderRight:
                                                  index + 1 === dietDetails?.meal_data[0]?.recipe[0].meal_type?.length
                                                    ? null
                                                    : '1px solid #C3CEC7'
                                              }}
                                            >
                                              <Typography>
                                                {item?.meal_value_header}&nbsp;{item?.weight_uom_label}
                                              </Typography>
                                            </TableCell>
                                          ))
                                        : dietDetails?.meal_data[0]?.ingredientwithchoice?.length > 0
                                        ? dietDetails?.meal_data[0]?.ingredientwithchoice[0].meal_type?.map(
                                            (item, index) => (
                                              <TableCell
                                                key={index}
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '134px',
                                                  textAlign: 'center',
                                                  borderRight:
                                                    index + 1 ===
                                                    dietDetails?.meal_data[0]?.ingredientwithchoice[0].meal_type?.length
                                                      ? null
                                                      : '1px solid #C3CEC7'
                                                }}
                                              >
                                                <Typography>
                                                  {item?.meal_value_header}&nbsp;{item?.weight_uom_label}
                                                </Typography>
                                              </TableCell>
                                            )
                                          )
                                        : null
                                      : null} */}
                                      {dietDetails.diet_type_name === 'By Gender' ? (
                                        <>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '133px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>GENERIC</Typography>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '133px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>FEMALE </Typography>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '133px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>MALE</Typography>
                                          </TableCell>
                                        </>
                                      ) : dietDetails.diet_type_name === 'By Lifestage' ? (
                                        <>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '137px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>GENERIC</Typography>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '140px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>Juvenile </Typography>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '140px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>Young</Typography>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '140px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>Adult</Typography>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '157px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>Undetermined</Typography>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '127px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>Old</Typography>
                                          </TableCell>
                                        </>
                                      ) : dietDetails.diet_type_name === 'Generic' ? (
                                        <>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '137px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography>GENERIC</Typography>
                                          </TableCell>
                                        </>
                                      ) : dietDetails.diet_type_name === 'By Weight' ? (
                                        <>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              backgroundColor: '#C1D3D099',
                                              height: '40px',
                                              width: '137px',
                                              borderRight: '1px solid #C3CEC7',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>GENERIC</Typography>
                                          </TableCell>
                                          {dietDetails.child?.map((all, index) => {
                                            return (
                                              <TableCell
                                                key={index}
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '137px',
                                                  borderRight: '1px solid #C3CEC7',
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{all}</Typography>
                                              </TableCell>
                                            )
                                          })}
                                        </>
                                      ) : (
                                        ''
                                      )}
                                    </TableRow>
                                  </TableHead>
                                )}
                                {dietDetails?.meal_data?.length > 0 ? (
                                  <TableBody>
                                    {/* <>
                                      {dietDetails?.meal_data?.map(itemd => {
                                        const startTimes = itemd?.meal_from_time
                                        const endTimes = itemd?.meal_to_time

                                        const itemData1 = itemd?.ingredient?.length
                                          ? itemd.ingredient.map(item => ({ ...item, ingredient: true }))
                                          : []

                                        const itemData2 = itemd?.recipe?.length
                                          ? itemd.recipe.map(item => ({ ...item, recipe: true }))
                                          : []

                                        const itemData3 = itemd?.ingredientwithchoice?.length
                                          ? itemd?.ingredientwithchoice?.map(item => ({
                                              ...item,
                                              ingredientwithchoice: true
                                            }))
                                          : []
                                        const itemData = [...itemData1, ...itemData2, ...itemData3]

                                        return (
                                          <>
                                            {itemData?.length ? (
                                              itemData?.map((item, index) => {
                                                let first = startArry.indexOf(itemd.meal_from_time) === -1
                                                startArry = [...startArry, itemd.meal_from_time]

                                                return (
                                                  <>
                                                    <TableRow key={index}>
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
                                                        {item?.ingredientwithchoice ? (
                                                          <Box
                                                            sx={{
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              backgroundColor: item.ingredientwithchoice
                                                                ? '#00D6C933'
                                                                : 'white',
                                                              borderRadius: '8px',
                                                              p: '12px',
                                                              gap: '16px'
                                                            }}
                                                          >
                                                            <Box
                                                              sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '12px'
                                                              }}
                                                            >
                                                              {item?.no_of_component_required && (
                                                                <Typography
                                                                  sx={{
                                                                    color: '#000',
                                                                    lineHeight: '16.94px',
                                                                    fontWeight: 600,
                                                                    fontSize: '16px'
                                                                  }}
                                                                >
                                                                  Offer minimum {item?.no_of_component_required} from
                                                                  the below items
                                                                </Typography>
                                                              )}

                                                              {item?.ingredientList?.length > 0 && (
                                                                <Box
                                                                  sx={{
                                                                    display: 'flex',
                                                                    flexWrap: 'wrap',
                                                                    columnGap: `24px`,
                                                                    rowGap: '10px'
                                                                  }}
                                                                >
                                                                  {item?.ingredientList?.map((item, index) => (
                                                                    <>
                                                                      <Box
                                                                        key={index}
                                                                        sx={{
                                                                          height: '32px',
                                                                          borderRadius: '16px',
                                                                          backgroundColor: '#1F415B1A',
                                                                          display: 'center',
                                                                          px: 2,
                                                                          justifyContent: 'center',
                                                                          alignItems: 'center'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            fontWeight: 600,
                                                                            fontSize: '14px',
                                                                            lineHeight: '16.94px',
                                                                            color: '#1F415B'
                                                                          }}
                                                                        >
                                                                          {item?.ingredient_name}
                                                                        </Typography>
                                                                        {item?.preparation_type_label ||
                                                                          (item?.preparation_type && (
                                                                            <Typography
                                                                              sx={{
                                                                                fontWeight: 400,
                                                                                fontSize: '14px',
                                                                                lineHeight: '18px',
                                                                                color: '#1F415B'
                                                                              }}
                                                                            >
                                                                              &nbsp;-&nbsp;
                                                                              {item?.preparation_type_label ||
                                                                                item?.preparation_type}
                                                                            </Typography>
                                                                          ))}
                                                                        {item?.feed_uom_name && (
                                                                          <Typography
                                                                            sx={{
                                                                              fontWeight: 400,
                                                                              fontSize: '14px',
                                                                              lineHeight: '18px',
                                                                              color: '#1F415B'
                                                                            }}
                                                                          >
                                                                            &nbsp;-&nbsp;{item?.feed_uom_name}
                                                                          </Typography>
                                                                        )}
                                                                      </Box>
                                                                    </>
                                                                  ))}
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
                                                            <Divider />

                                                            <Box sx={{ display: 'flex', gap: '12px' }}>
                                                              {Object?.entries(item?.days_of_weeks).map(
                                                                ([key, value]) => (
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
                                                                )
                                                              )}
                                                            </Box>
                                                          </Box>
                                                        ) : (
                                                          <Box
                                                            key={index}
                                                            sx={{
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              backgroundColor:
                                                                item.ingredient || item.ingredientwithchoice
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

                                                            <Box sx={{ display: 'flex', gap: '12px' }}>
                                                              {Object?.entries(item?.days_of_weeks).map(
                                                                ([key, value]) => (
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
                                                                )
                                                              )}
                                                            </Box>
                                                          </Box>
                                                        )}
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
                                                              <CustomTooltip title={item?.notes} placement='left'>
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
                                                                    {item?.quantity}&nbsp;{item?.feed_uom_name}
                                                                  </Typography>
                                                                </Box>
                                                              </CustomTooltip>
                                                            )}
                                                          </Box>
                                                        </TableCell>
                                                      ))}
                                                    </TableRow>
                                                    {index === itemData?.length - 1 ? (
                                                      <TableRow
                                                        sx={{
                                                          borderBottom:
                                                            itemData?.items?.length === 0
                                                              ? '1px solid #C3CEC7'
                                                              : index === itemData?.length - 1
                                                              ? '1px solid #C3CEC7'
                                                              : 'none'
                                                        }}
                                                      >
                                                        {itemd?.notes ? (
                                                          <Box
                                                            sx={{
                                                              display: 'flex',
                                                              flexDirection: 'row',
                                                              alignItems: 'center',
                                                              gap: '4px',
                                                              my: '10px',
                                                              width: '1070px'
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
                                                              Note:- &nbsp;
                                                              <Typography
                                                                component='span'
                                                                sx={{
                                                                  lineHeight: '19.36px',
                                                                  fontSize: '16px',
                                                                  fontWeight: 400,
                                                                  color: '#44544A'
                                                                }}
                                                              >
                                                                {itemd.notes}
                                                              </Typography>
                                                            </Typography>
                                                          </Box>
                                                        ) : (
                                                          ''
                                                        )}
                                                      </TableRow>
                                                    ) : null}
                                                  </>
                                                )
                                              })
                                            ) : (
                                              <Typography sx={{ mt: 2, fontWeight: 700 }}>No Data</Typography>
                                            )}
                                          </>
                                        )
                                      })}
                                    </> */}
                                    {dietDetails.meal_data?.map((itemd, index) => {
                                      const formattedfromTime = moment(itemd?.meal_from_time, 'h:mm A').isValid()
                                        ? moment(itemd.meal_from_time, 'h:mm A').format('h:mm A')
                                        : undefined
                                      const formattedtoTime = moment(itemd?.meal_to_time, 'h:mm A').isValid()
                                        ? moment(itemd.meal_to_time, 'h:mm A').format('h:mm A')
                                        : undefined

                                      const startTimes = formattedfromTime
                                      const endTimes = formattedtoTime
                                      const ind = index

                                      return (
                                        <>
                                          {itemd?.ingredient?.length <= 0 ||
                                          itemd?.ingredientwithchoice?.length <= 0 ||
                                          itemd?.recipe?.length <= 0 ? (
                                            <Typography sx={{ pt: 5, display: 'none' }}>No records to show</Typography>
                                          ) : (
                                            <TableRow key={index}>
                                              <TableCell
                                                sx={{
                                                  position: 'sticky',
                                                  left: 0,
                                                  width: '180px',
                                                  border: 'none',
                                                  pl: 0,
                                                  pr: '36px',
                                                  background: '#fff',
                                                  height: '100px',
                                                  //display: 'flex',
                                                  //flexDirection: 'column',
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  overflow: 'hidden'
                                                }}
                                                component='th'
                                                scope='row'
                                              >
                                                <span
                                                  style={{
                                                    position: 'absolute', // Change this to absolute
                                                    top: '70px', // Center vertically
                                                    transform: 'translateY(-50%)', // Adjust to center properly
                                                    //display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    width: '70%'
                                                  }}
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
                                                  {console.log(endTimes, 'endTimes')}
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
                                                </span>
                                              </TableCell>

                                              <>
                                                {itemd?.ingredient?.length > 0 &&
                                                  itemd?.ingredient?.map((item, index) => {
                                                    // console.log(dietDetails?.child?.length, 'lll')

                                                    return (
                                                      <TableRow key={index}>
                                                        <TableCell
                                                          style={{ paddingLeft: '0px' }}
                                                          sx={{
                                                            position: 'sticky',
                                                            left: '160px',
                                                            border: 'none',
                                                            backgroundColor: '#fff',
                                                            float: 'left'
                                                          }}
                                                          className={
                                                            dietDetails.diet_type_name === 'Generic'
                                                              ? 'cell_dimn'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 0
                                                              ? 'cell_dimn'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 1
                                                              ? 'cell_dimn1'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 2
                                                              ? 'cell_dimn2'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 3
                                                              ? 'cell_dimn3'
                                                              : dietDetails.diet_type_name === 'By Gender'
                                                              ? 'cell_gend'
                                                              : 'cellmodule4'
                                                          }
                                                        >
                                                          <Box
                                                            key={index}
                                                            sx={{
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              backgroundColor: '#00d6c957',
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
                                                                  {item?.preparation_type && (
                                                                    <Typography
                                                                      sx={{
                                                                        color: '#7A8684',
                                                                        lineHeight: '16.94px',
                                                                        fontWeight: 400,
                                                                        fontSize: '14px'
                                                                      }}
                                                                    >
                                                                      &nbsp;-&nbsp; {item?.preparation_type}
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
                                                            {item?.days_of_week?.length > 0 && (
                                                              <>
                                                                <Divider />
                                                                <Box sx={{ display: 'flex', gap: '12px' }}>
                                                                  {item?.days_of_week?.map((item, index) => (
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
                                                                        {getDayName(item)}
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
                                                            paddingLeft: '8px',
                                                            paddingRight: '8px',
                                                            height: '10px',
                                                            maxHeight: '100%',
                                                            border: 'none'
                                                          }}
                                                          // onClick={() =>
                                                          //   handleClickOpen(index, item, 'Generic', 'ingredient')
                                                          // }
                                                        >
                                                          <Box
                                                            sx={{
                                                              height: '100%'
                                                            }}
                                                          >
                                                            {/* {console.log(item.meal_type, 'eee')} */}
                                                            <Box
                                                              sx={{
                                                                backgroundColor: '#0000000d',
                                                                p: '10px',
                                                                boxSizing: 'border-box',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                borderRadius: '8px',
                                                                height: '100%'
                                                              }}
                                                              className={
                                                                dietDetails.diet_type_name === 'By Lifestage'
                                                                  ? 'diet_val_cont'
                                                                  : dietDetails.diet_type_name === 'By Gender'
                                                                  ? 'diet_gender'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 1
                                                                  ? 'diet_cell_weight'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 2
                                                                  ? 'diet_cell_weight2'
                                                                  : 'diet_cell'
                                                              }
                                                            >
                                                              <Typography
                                                                sx={{
                                                                  color: '#000',
                                                                  lineHeight: '16.94px',
                                                                  fontWeight: 400,
                                                                  fontSize: '14px'
                                                                }}
                                                              >
                                                                {/* {console.log(index, 'index')} */}
                                                                {item.meal_type
                                                                  ? item.meal_type.map((meal, i) => {
                                                                      return meal.meal_value_header === 'Generic'
                                                                        ? meal.quantity +
                                                                            (meal.feed_uom_name
                                                                              ? ' ' + meal.feed_uom_name
                                                                              : '')
                                                                        : ''
                                                                    })
                                                                  : ''}
                                                              </Typography>
                                                            </Box>
                                                          </Box>
                                                        </TableCell>
                                                        {dietDetails?.child?.length > 0 &&
                                                          dietDetails.child?.map((all, indexnew) => {
                                                            if (all !== 'Generic') {
                                                              return (
                                                                <TableCell
                                                                  key={index}
                                                                  style={{
                                                                    paddingLeft: '8px',
                                                                    paddingRight: '8px',
                                                                    height: '10px',
                                                                    maxHeight: '100%',
                                                                    border: 'none'
                                                                  }}
                                                                  // onClick={() =>
                                                                  //   handleClickOpen(index, item, all, 'ingredient')
                                                                  // }
                                                                >
                                                                  <Box
                                                                    sx={{
                                                                      height: '100%'
                                                                    }}
                                                                  >
                                                                    <Box
                                                                      sx={{
                                                                        backgroundColor: '#0000000d',
                                                                        p: '10px',
                                                                        display: 'flex',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        borderRadius: '8px',
                                                                        height: '100%'
                                                                      }}
                                                                      className={
                                                                        dietDetails.diet_type_name === 'By Lifestage'
                                                                          ? 'diet_val_cont'
                                                                          : dietDetails.diet_type_name === 'By Gender'
                                                                          ? 'diet_gender'
                                                                          : dietDetails.diet_type_name ===
                                                                              'By Weight' &&
                                                                            dietDetails?.child?.length === 1
                                                                          ? 'diet_cell_weight'
                                                                          : dietDetails.diet_type_name ===
                                                                              'By Weight' &&
                                                                            dietDetails?.child?.length === 2
                                                                          ? 'diet_cell_weight2'
                                                                          : 'diet_cell'
                                                                      }
                                                                    >
                                                                      <Typography
                                                                        sx={{
                                                                          color: '#000',
                                                                          lineHeight: '16.94px',
                                                                          fontWeight: 400,
                                                                          fontSize: '14px'
                                                                        }}
                                                                      >
                                                                        {dietDetails.diet_type_name === 'By Weight' &&
                                                                        item.meal_type
                                                                          ? item.meal_type.map((meal, i) => {
                                                                              if (
                                                                                all.includes(meal.meal_value_header)
                                                                              ) {
                                                                                return (
                                                                                  meal.quantity +
                                                                                  (meal.feed_uom_name
                                                                                    ? ' ' + meal.feed_uom_name
                                                                                    : '')
                                                                                )
                                                                              } else {
                                                                                return ''
                                                                              }
                                                                            })
                                                                          : item.meal_type
                                                                          ? item.meal_type.map((meal, i) => {
                                                                              return meal.meal_value_header === all
                                                                                ? meal.quantity +
                                                                                    (meal.feed_uom_name
                                                                                      ? ' ' + meal.feed_uom_name
                                                                                      : '')
                                                                                : ''
                                                                            })
                                                                          : ''}
                                                                      </Typography>
                                                                    </Box>
                                                                  </Box>
                                                                </TableCell>
                                                              )
                                                            }
                                                          })}

                                                        {/* {getModal(index, item)} */}
                                                      </TableRow>
                                                    )
                                                  })}
                                              </>

                                              <>
                                                {itemd?.recipe?.length > 0 &&
                                                  itemd?.recipe?.map((item, index) => {
                                                    return (
                                                      <TableRow key={index}>
                                                        <TableCell
                                                          style={{ paddingLeft: '0px' }}
                                                          sx={{
                                                            position: 'sticky',
                                                            left: '160px',
                                                            border: 'none',

                                                            backgroundColor: '#fff',
                                                            float: 'left'
                                                          }}
                                                          className={
                                                            dietDetails.diet_type_name === 'Generic'
                                                              ? 'cell_dimn'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 0
                                                              ? 'cell_dimn'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 1
                                                              ? 'cell_dimn1'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 2
                                                              ? 'cell_dimn2'
                                                              : dietDetails.diet_type_name === 'By Weight' &&
                                                                dietDetails?.child?.length === 3
                                                              ? 'cell_dimn3'
                                                              : dietDetails.diet_type_name === 'By Gender'
                                                              ? 'cell_gend'
                                                              : 'cellmodule4'
                                                          }
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
                                                                </Box>
                                                                {/* {console.log(item, 'kkkk')} */}
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                  {item.ingredient_name &&
                                                                    item?.ingredient_name?.length > 0 && (
                                                                      <Typography
                                                                        sx={{
                                                                          color: '#7A8684',
                                                                          lineHeight: '16.94px',
                                                                          fontWeight: 400,
                                                                          fontSize: '14px',
                                                                          display: 'flex',
                                                                          flexWrap: 'wrap'
                                                                        }}
                                                                      >
                                                                        {item?.ingredient_name.map((name, index) => (
                                                                          <Box
                                                                            key={index}
                                                                            sx={{
                                                                              display: 'flex',
                                                                              alignItems: 'center',
                                                                              marginRight: '10px'
                                                                            }}
                                                                          >
                                                                            {name}
                                                                            <Typography
                                                                              component='span'
                                                                              sx={{
                                                                                fontWeight: 'bold',
                                                                                marginLeft: '2px',
                                                                                fontSize: '14px',
                                                                                lineHeight: '1.7rem'
                                                                              }}
                                                                            >
                                                                              {parseFloat(item?.quantity[index])}
                                                                              {''}
                                                                              {item?.quantity_type[index] ===
                                                                              'percentage'
                                                                                ? '%'
                                                                                : ''}
                                                                            </Typography>
                                                                          </Box>
                                                                        ))}
                                                                      </Typography>
                                                                    )}
                                                                  {item?.ingredients?.length > 0 &&
                                                                    item?.ingredients.map((name, index) => (
                                                                      <Box
                                                                        key={index}
                                                                        sx={{
                                                                          display: 'flex',
                                                                          alignItems: 'center',
                                                                          marginRight: '10px',
                                                                          backgroundColor: '#00D6C933',
                                                                          m: 1,
                                                                          borderRadius: '16px',
                                                                          px: '10px',
                                                                          gap: '8px'
                                                                        }}
                                                                      >
                                                                        {name?.ingredient_name}
                                                                        <Typography
                                                                          component='span'
                                                                          sx={{
                                                                            fontWeight: 'bold',
                                                                            marginLeft: '2px',
                                                                            fontSize: '14px',
                                                                            lineHeight: '1.7rem'
                                                                          }}
                                                                        >
                                                                          {parseFloat(name?.quantity)}
                                                                          {''}
                                                                          {name?.quantity_type === 'percentage'
                                                                            ? '%'
                                                                            : ''}
                                                                        </Typography>
                                                                      </Box>
                                                                    ))}
                                                                </Box>

                                                                {item?.recipe?.length > 0 && (
                                                                  <Box
                                                                    sx={{
                                                                      display: 'flex',
                                                                      gap: '24px'
                                                                    }}
                                                                  >
                                                                    {item?.recipe?.map((item, index) => (
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
                                                            {item?.days_of_week?.length > 0 && (
                                                              <>
                                                                <Divider />
                                                                <Box sx={{ display: 'flex', gap: '12px' }}>
                                                                  {item?.days_of_week?.map((item, index) => (
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
                                                                        {getDayName(item)}
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
                                                            paddingLeft: '8px',
                                                            paddingRight: '8px',
                                                            height: '10px',
                                                            maxHeight: '100%',
                                                            border: 'none'
                                                          }}
                                                          // onClick={() => handleClickOpen(index, item, 'Generic', 'recipe')}
                                                        >
                                                          <Box
                                                            sx={{
                                                              height: '100%'
                                                            }}
                                                          >
                                                            {/* {console.log(item.meal_type, 'eee')} */}
                                                            <Box
                                                              sx={{
                                                                backgroundColor: '#0000000d',
                                                                p: '10px',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                borderRadius: '8px',
                                                                height: '100%'
                                                              }}
                                                              className={
                                                                dietDetails.diet_type_name === 'By Lifestage'
                                                                  ? 'diet_val_cont'
                                                                  : dietDetails.diet_type_name === 'By Gender'
                                                                  ? 'diet_gender'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 1
                                                                  ? 'diet_cell_weight'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 2
                                                                  ? 'diet_cell_weight2'
                                                                  : 'diet_cell'
                                                              }
                                                            >
                                                              <Typography
                                                                sx={{
                                                                  color: '#000',
                                                                  lineHeight: '16.94px',
                                                                  fontWeight: 400,
                                                                  fontSize: '14px'
                                                                }}
                                                              >
                                                                {/* {console.log(index, 'index')} */}
                                                                {item.meal_type
                                                                  ? item.meal_type.map((meal, i) => {
                                                                      return meal.meal_value_header === 'Generic'
                                                                        ? meal.quantity +
                                                                            (meal.feed_uom_name
                                                                              ? ' ' + meal.feed_uom_name
                                                                              : '')
                                                                        : ''
                                                                    })
                                                                  : ''}
                                                              </Typography>
                                                            </Box>
                                                          </Box>
                                                        </TableCell>
                                                        {dietDetails?.child?.length > 0 &&
                                                          dietDetails.child?.map((all, indexnew) => {
                                                            if (all !== 'Generic') {
                                                              return (
                                                                <TableCell
                                                                  key={index}
                                                                  style={{
                                                                    paddingLeft: '8px',
                                                                    paddingRight: '8px',
                                                                    height: '10px',
                                                                    maxHeight: '100%',
                                                                    border: 'none'
                                                                  }}
                                                                  // onClick={() => handleClickOpen(index, item, all, 'recipe')}
                                                                >
                                                                  <Box
                                                                    sx={{
                                                                      height: '100%'
                                                                    }}
                                                                  >
                                                                    <Box
                                                                      sx={{
                                                                        backgroundColor: '#0000000d',
                                                                        p: '10px',
                                                                        display: 'flex',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        borderRadius: '8px',
                                                                        height: '100%'
                                                                      }}
                                                                      className={
                                                                        dietDetails.diet_type_name === 'By Lifestage'
                                                                          ? 'diet_val_cont'
                                                                          : dietDetails.diet_type_name === 'By Gender'
                                                                          ? 'diet_gender'
                                                                          : dietDetails.diet_type_name ===
                                                                              'By Weight' &&
                                                                            dietDetails?.child?.length === 1
                                                                          ? 'diet_cell_weight'
                                                                          : dietDetails.diet_type_name ===
                                                                              'By Weight' &&
                                                                            dietDetails?.child?.length === 2
                                                                          ? 'diet_cell_weight2'
                                                                          : 'diet_cell'
                                                                      }
                                                                    >
                                                                      <Typography
                                                                        sx={{
                                                                          color: '#000',
                                                                          lineHeight: '16.94px',
                                                                          fontWeight: 400,
                                                                          fontSize: '14px'
                                                                        }}
                                                                      >
                                                                        {dietDetails.diet_type_name === 'By Weight' &&
                                                                        item.meal_type
                                                                          ? item.meal_type.map((meal, i) => {
                                                                              if (
                                                                                all.includes(meal.meal_value_header)
                                                                              ) {
                                                                                return (
                                                                                  meal.quantity +
                                                                                  (meal.feed_uom_name
                                                                                    ? ' ' + meal.feed_uom_name
                                                                                    : '')
                                                                                )
                                                                              } else {
                                                                                return ''
                                                                              }
                                                                            })
                                                                          : item.meal_type
                                                                          ? item.meal_type.map((meal, i) => {
                                                                              return meal.meal_value_header === all
                                                                                ? meal.quantity +
                                                                                    (meal.feed_uom_name
                                                                                      ? ' ' + meal.feed_uom_name
                                                                                      : '')
                                                                                : ''
                                                                            })
                                                                          : ''}
                                                                      </Typography>
                                                                    </Box>
                                                                  </Box>
                                                                </TableCell>
                                                              )
                                                            }
                                                          })}
                                                        {/* {getModal(index, item)} */}
                                                      </TableRow>
                                                    )
                                                  })}
                                              </>

                                              <>
                                                {itemd?.ingredientwithchoice?.map((item, index) => {
                                                  return (
                                                    <TableRow key={index}>
                                                      <TableCell
                                                        style={{ paddingLeft: '0px' }}
                                                        sx={{
                                                          position: 'sticky',
                                                          left: '160px',
                                                          border: 'none',
                                                          backgroundColor: '#fff',
                                                          float: 'left'
                                                        }}
                                                        className={
                                                          dietDetails.diet_type_name === 'Generic'
                                                            ? 'cell_dimn'
                                                            : dietDetails.diet_type_name === 'By Weight' &&
                                                              dietDetails?.child?.length === 0
                                                            ? 'cell_dimn'
                                                            : dietDetails.diet_type_name === 'By Weight' &&
                                                              dietDetails?.child?.length === 1
                                                            ? 'cell_dimn1'
                                                            : dietDetails.diet_type_name === 'By Weight' &&
                                                              dietDetails?.child?.length === 2
                                                            ? 'cell_dimn2'
                                                            : dietDetails.diet_type_name === 'By Weight' &&
                                                              dietDetails?.child?.length === 3
                                                            ? 'cell_dimn3'
                                                            : dietDetails.diet_type_name === 'By Gender'
                                                            ? 'cell_gend'
                                                            : 'cellmodule4'
                                                        }
                                                      >
                                                        <Box
                                                          key={index}
                                                          sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',

                                                            //backgroundColor: '#E1F9ED',
                                                            backgroundColor: '#00d6c957',
                                                            borderRadius: '8px',
                                                            p: '12px',
                                                            gap: '16px'
                                                          }}
                                                        >
                                                          <Box
                                                            sx={{
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              gap: '12px'
                                                            }}
                                                          >
                                                            {item?.no_of_component_required && (
                                                              <Typography
                                                                sx={{
                                                                  color: '#000',
                                                                  lineHeight: '16.94px',
                                                                  fontWeight: 600,
                                                                  fontSize: '16px'
                                                                }}
                                                              >
                                                                Offer minimum {item?.no_of_component_required} from the
                                                                below items
                                                              </Typography>
                                                            )}

                                                            {item?.ingredientList?.length > 0 && (
                                                              <Box
                                                                sx={{
                                                                  display: 'flex',
                                                                  flexWrap: 'wrap',
                                                                  columnGap: `24px`,
                                                                  rowGap: '10px'
                                                                }}
                                                              >
                                                                {item?.ingredientList?.map((item, index) => (
                                                                  <>
                                                                    <Box
                                                                      key={index}
                                                                      sx={{
                                                                        height: '32px',
                                                                        borderRadius: '16px',
                                                                        backgroundColor: '#1F415B1A',
                                                                        display: 'center',
                                                                        px: 2,
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center'
                                                                      }}
                                                                    >
                                                                      <Typography
                                                                        sx={{
                                                                          fontWeight: 600,
                                                                          fontSize: '14px',
                                                                          lineHeight: '16.94px',
                                                                          color: '#1F415B'
                                                                        }}
                                                                      >
                                                                        {item?.ingredient_name}
                                                                      </Typography>
                                                                      <Typography
                                                                        sx={{
                                                                          fontWeight: 400,
                                                                          fontSize: '14px',
                                                                          lineHeight: '18px',
                                                                          color: '#1F415B'
                                                                        }}
                                                                      >
                                                                        &nbsp;-&nbsp;{item?.preparation_type}
                                                                      </Typography>
                                                                      <Typography
                                                                        sx={{
                                                                          fontWeight: 400,
                                                                          fontSize: '14px',
                                                                          lineHeight: '18px',
                                                                          color: '#1F415B'
                                                                        }}
                                                                      >
                                                                        &nbsp;-&nbsp;{item?.feed_uom_name}
                                                                      </Typography>
                                                                    </Box>
                                                                  </>
                                                                ))}
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
                                                          {item?.days_of_week?.length > 0 && (
                                                            <>
                                                              <Divider />
                                                              <Box sx={{ display: 'flex', gap: '12px' }}>
                                                                {item?.days_of_week?.map((item, index) => (
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
                                                                      {getDayName(item)}
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
                                                          paddingLeft: '8px',
                                                          paddingRight: '8px',
                                                          height: '10px',
                                                          maxHeight: '100%',
                                                          border: 'none'
                                                        }}
                                                        // onClick={() =>
                                                        //   handleClickOpen(index, item, 'Generic', 'ingredientwithchoice')
                                                        // }
                                                      >
                                                        <Box
                                                          sx={{
                                                            height: '100%'
                                                          }}
                                                        >
                                                          {/* {console.log(item.meal_type, 'eee')} */}
                                                          <Box
                                                            sx={{
                                                              backgroundColor: '#0000000d',
                                                              p: '10px',
                                                              display: 'flex',
                                                              justifyContent: 'center',
                                                              alignItems: 'center',
                                                              borderRadius: '8px',
                                                              height: '100%'
                                                            }}
                                                            className={
                                                              dietDetails.diet_type_name === 'By Lifestage'
                                                                ? 'diet_val_cont'
                                                                : dietDetails.diet_type_name === 'By Gender'
                                                                ? 'diet_gender'
                                                                : dietDetails.diet_type_name === 'By Weight' &&
                                                                  dietDetails?.child?.length === 1
                                                                ? 'diet_cell_weight'
                                                                : dietDetails.diet_type_name === 'By Weight' &&
                                                                  dietDetails?.child?.length === 2
                                                                ? 'diet_cell_weight2'
                                                                : 'diet_cell'
                                                            }
                                                          >
                                                            <Typography
                                                              sx={{
                                                                color: '#000',
                                                                lineHeight: '16.94px',
                                                                fontWeight: 400,
                                                                fontSize: '14px'
                                                              }}
                                                            >
                                                              {/* {console.log(index, 'index')} */}
                                                              {item.meal_type
                                                                ? item.meal_type.map((meal, i) => {
                                                                    return meal.meal_value_header === 'Generic'
                                                                      ? meal.quantity +
                                                                          (meal.feed_uom_name
                                                                            ? ' ' + meal.feed_uom_name
                                                                            : '')
                                                                      : ''
                                                                  })
                                                                : ''}
                                                            </Typography>
                                                          </Box>
                                                        </Box>
                                                      </TableCell>
                                                      {dietDetails?.child?.length &&
                                                        dietDetails.child?.map((all, indexnew) => {
                                                          if (all !== 'Generic') {
                                                            return (
                                                              <TableCell
                                                                key={index}
                                                                style={{
                                                                  paddingLeft: '8px',
                                                                  paddingRight: '8px',
                                                                  height: '10px',
                                                                  maxHeight: '100%',
                                                                  border: 'none'
                                                                }}
                                                                // onClick={() =>
                                                                //   handleClickOpen(index, item, all, 'ingredientwithchoice')
                                                                // }
                                                              >
                                                                <Box
                                                                  sx={{
                                                                    height: '100%'
                                                                  }}
                                                                >
                                                                  <Box
                                                                    sx={{
                                                                      backgroundColor: '#0000000d',
                                                                      p: '10px',
                                                                      display: 'flex',
                                                                      justifyContent: 'center',
                                                                      alignItems: 'center',
                                                                      borderRadius: '8px',
                                                                      height: '100%'
                                                                    }}
                                                                    className={
                                                                      dietDetails.diet_type_name === 'By Lifestage'
                                                                        ? 'diet_val_cont'
                                                                        : dietDetails.diet_type_name === 'By Gender'
                                                                        ? 'diet_gender'
                                                                        : dietDetails.diet_type_name === 'By Weight' &&
                                                                          dietDetails?.child?.length === 1
                                                                        ? 'diet_cell_weight'
                                                                        : dietDetails.diet_type_name === 'By Weight' &&
                                                                          dietDetails?.child?.length === 2
                                                                        ? 'diet_cell_weight2'
                                                                        : 'diet_cell'
                                                                    }
                                                                  >
                                                                    <Typography
                                                                      sx={{
                                                                        color: '#000',
                                                                        lineHeight: '16.94px',
                                                                        fontWeight: 400,
                                                                        fontSize: '14px'
                                                                      }}
                                                                    >
                                                                      {dietDetails.diet_type_name === 'By Weight' &&
                                                                      item.meal_type
                                                                        ? item.meal_type.map((meal, i) => {
                                                                            if (all.includes(meal.meal_value_header)) {
                                                                              return (
                                                                                meal.quantity +
                                                                                (meal.feed_uom_name
                                                                                  ? ' ' + meal.feed_uom_name
                                                                                  : '')
                                                                              )
                                                                            } else {
                                                                              return ''
                                                                            }
                                                                          })
                                                                        : item.meal_type
                                                                        ? item.meal_type.map((meal, i) => {
                                                                            return meal.meal_value_header === all
                                                                              ? meal.quantity +
                                                                                  (meal.feed_uom_name
                                                                                    ? ' ' + meal.feed_uom_name
                                                                                    : '')
                                                                              : ''
                                                                          })
                                                                        : ''}
                                                                    </Typography>
                                                                  </Box>
                                                                </Box>
                                                              </TableCell>
                                                            )
                                                          }
                                                        })}
                                                      {/* {getModal(index, item)} */}
                                                    </TableRow>
                                                  )
                                                })}
                                              </>
                                            </TableRow>
                                          )}
                                          {itemd.notes &&
                                          (itemd?.ingredient?.length >= 1 ||
                                            itemd?.ingredientwithchoice?.length >= 1 ||
                                            itemd?.recipe?.length >= 1) ? (
                                            <TableRow sx={{ width: '100%', borderBottom: '1px solid #C3CEC7', pb: 3 }}>
                                              <Typography
                                                sx={{
                                                  width: '100%',
                                                  display: 'block',
                                                  pb: 3
                                                }}
                                              >
                                                <span style={{ fontWeight: 'bold', color: 'rgb(0 0 0 / 67%)' }}>
                                                  Notes :
                                                </span>{' '}
                                                {itemd.notes}
                                              </Typography>
                                            </TableRow>
                                          ) : (
                                            ''
                                          )}
                                        </>
                                      )
                                    })}
                                  </TableBody>
                                ) : (
                                  <Typography sx={{ mt: 2, fontWeight: 700 }}>No Data</Typography>
                                )}
                              </Table>
                            </CustomScrollbar>
                          )}
                        </TabPanel>
                      )}
                    </>
                  ))}
                </TabContext>
              </Box>
              {dietDetails?.remarks ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Typography sx={{ lineHeight: '29.05px', fontSize: '24px', fontWeight: 500, color: '#44544A' }}>
                    Remarks
                  </Typography>
                  <Typography sx={{ lineHeight: '19.36px', fontSize: '16px', fontWeight: 400, color: '#44544A' }}>
                    {dietDetails?.remarks ? dietDetails?.remarks : 'No Remarks'}
                  </Typography>
                </Box>
              ) : (
                ''
              )}
            </Card>
          </Box>
        </Box>
      )}
    </>
  )
}

export default DietDetail
