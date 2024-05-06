import { useState, useEffect } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Router from 'next/router'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm, useFieldArray } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { getPreparationTypeList } from 'src/lib/api/diet/getIngredients'
import {
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material'
import { Divider, Card } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const defaultValues = {
  meal_type: [
    {
      meal_value_header: '',
      quantity: '',
      meal_value_uom_id: '',
      notes: ''
    }
  ]
}

const StepPreviewDiet = ({ formData, handleNext, handlePrev, uomList, finalhandleSubmit }) => {
  const [open, setOpen] = useState(false)
  const [mealData, setmealType] = useState([])
  const [LocalformData, setlocalformData] = useState([])
  const [mealingredientIndex, setmealingredientIndex] = useState('')
  const [ingredientvalueid, setingredientvalueid] = useState({})
  const [headertype, setheadertype] = useState('')
  const [dietTypeval, setdietTypeval] = useState('')
  const [initialValues, setInitialValues] = useState({
    quantity: '',
    meal_value_uom_id: '',
    notes: ''
  })

  const handleClickOpen = (index, item, type, dietType) => {
    console.log(item, 'item')
    console.log(type, 'type')
    console.log(index, 'index')
    const mealTypeObject = item?.meal_type?.find((meal, mealIndex) => {
      return meal.meal_value_header === type
    })

    const initialval = mealTypeObject
      ? {
          quantity: mealTypeObject.quantity || '',
          meal_value_uom_id: mealTypeObject.meal_value_uom_id || '',
          notes: mealTypeObject.notes || ''
        }
      : {
          quantity: '',
          meal_value_uom_id: '',
          notes: ''
        }

    setInitialValues(initialval)

    // Then open the dialog
    setOpen(true)
    setmealingredientIndex(index)
    setingredientvalueid(item.valueid)
    setheadertype(type)
    setdietTypeval(dietType)
  }
  const handleClosed = () => setOpen(false)
  const {
    reset,
    control,
    handleSubmit,
    clearErrors,

    //formState: { errors },
    trigger,
    getValues,
    setValue: setFormValue
  } = useForm({
    defaultValues,
    shouldUnregister: false,

    //resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const handlePrevClick = () => {
    window.scrollTo(0, 0)
    handlePrev()
  }

  useEffect(() => {
    if (formData) {
      reset(formData)
      setlocalformData(formData)
    }
  }, [formData, reset])

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
  const classes = useStyles()

  const SelectQuantityclick = (index, item, val) => {
    console.log(val, 'val')
    if (dietTypeval === 'ingredient') {
      alert('hi')
      const { quantity, meal_value_uom_id, notes } = getValues()
      const updatedFormData = { ...formData } // Create a copy of formData

      // Find the index of the meal_data object with matching newid
      const addMealIndex = updatedFormData.meal_data.findIndex(meal => meal.newid === ingredientvalueid)

      if (addMealIndex !== -1) {
        // Find the index of the ingredient object with matching valueid and index
        const ingredientIndex = updatedFormData.meal_data[addMealIndex].ingredient.findIndex(
          (ingredient, i) => ingredient.valueid === ingredientvalueid && i === mealingredientIndex
        )

        if (ingredientIndex !== -1) {
          // Get the existing meal_type array
          const mealTypeArray = updatedFormData.meal_data[addMealIndex].ingredient[ingredientIndex].meal_type || []

          // Check if there's an existing object with the same meal_value_header
          const existingMealTypeIndex = mealTypeArray.findIndex(meal => meal.meal_value_header === headertype)

          if (existingMealTypeIndex !== -1) {
            // If an existing object with the same meal_value_header is found, update it
            mealTypeArray[existingMealTypeIndex] = {
              meal_value_header: headertype,
              quantity: quantity,
              meal_value_uom_id: meal_value_uom_id.value,
              notes: notes
            }
          } else {
            // Otherwise, add the new object to the meal_type array
            mealTypeArray.push({
              meal_value_header: headertype,
              quantity: quantity,
              meal_value_uom_id: meal_value_uom_id.value,
              notes: notes
            })
          }

          // Update the meal_type array with the updated mealTypeArray
          updatedFormData.meal_data[addMealIndex].ingredient[ingredientIndex].meal_type = mealTypeArray
        }
      }

      // Update the formData in the parent component using a function passed through props
      setlocalformData(updatedFormData)
      setOpen(false)
      console.log(updatedFormData, 'updatedFormData')
    } else {
      alert('hiooo')
      const { quantity, meal_value_uom_id, notes } = getValues()
      const updatedFormData = { ...formData } // Create a copy of formData
      console.log(updatedFormData, 'updatedFormData')
      // Find the index of the meal_data object with matching newid
      const addMealIndex = updatedFormData.meal_data.findIndex(meal => meal.newid === ingredientvalueid)

      if (addMealIndex !== -1) {
        // Find the index of the ingredient object with matching valueid and index
        const ingredientIndex = updatedFormData.meal_data[addMealIndex].recipe.findIndex(
          (recipe, i) => recipe.valueid === ingredientvalueid && i === mealingredientIndex
        )

        if (ingredientIndex !== -1) {
          // Get the existing meal_type array
          const mealTypeArray = updatedFormData.meal_data[addMealIndex].recipe[ingredientIndex].meal_type || []

          // Check if there's an existing object with the same meal_value_header
          const existingMealTypeIndex = mealTypeArray.findIndex(meal => meal.meal_value_header === headertype)

          if (existingMealTypeIndex !== -1) {
            // If an existing object with the same meal_value_header is found, update it
            mealTypeArray[existingMealTypeIndex] = {
              meal_value_header: headertype,
              quantity: quantity,
              meal_value_uom_id: meal_value_uom_id.value,
              notes: notes
            }
          } else {
            // Otherwise, add the new object to the meal_type array
            mealTypeArray.push({
              meal_value_header: headertype,
              quantity: quantity,
              meal_value_uom_id: meal_value_uom_id.value,
              notes: notes
            })
          }

          // Update the meal_type array with the updated mealTypeArray
          updatedFormData.meal_data[addMealIndex].recipe[ingredientIndex].meal_type = mealTypeArray
        }
      }

      // Update the formData in the parent component using a function passed through props
      setlocalformData(updatedFormData)
      setOpen(false)
      console.log(updatedFormData, 'updatedFormData')
    }
  }

  const SelectQuantityRecipeclick = (index, item) => {
    const { quantity, meal_value_uom_id, notes } = getValues()
    const updatedFormData = { ...formData } // Create a copy of formData
    console.log(updatedFormData, 'updatedFormData')
    // Find the index of the meal_data object with matching newid
    const addMealIndex = updatedFormData.meal_data.findIndex(meal => meal.newid === ingredientvalueid)

    if (addMealIndex !== -1) {
      // Find the index of the ingredient object with matching valueid and index
      const ingredientIndex = updatedFormData.meal_data[addMealIndex].recipe.findIndex(
        (recipe, i) => recipe.valueid === ingredientvalueid && i === mealingredientIndex
      )

      if (ingredientIndex !== -1) {
        // Get the existing meal_type array
        const mealTypeArray = updatedFormData.meal_data[addMealIndex].recipe[ingredientIndex].meal_type || []

        // Check if there's an existing object with the same meal_value_header
        const existingMealTypeIndex = mealTypeArray.findIndex(meal => meal.meal_value_header === headertype)

        if (existingMealTypeIndex !== -1) {
          // If an existing object with the same meal_value_header is found, update it
          mealTypeArray[existingMealTypeIndex] = {
            meal_value_header: headertype,
            quantity: quantity,
            meal_value_uom_id: meal_value_uom_id.value,
            notes: notes
          }
        } else {
          // Otherwise, add the new object to the meal_type array
          mealTypeArray.push({
            meal_value_header: headertype,
            quantity: quantity,
            meal_value_uom_id: meal_value_uom_id.value,
            notes: notes
          })
        }

        // Update the meal_type array with the updated mealTypeArray
        updatedFormData.meal_data[addMealIndex].recipe[ingredientIndex].meal_type = mealTypeArray
      }
    }

    // Update the formData in the parent component using a function passed through props
    setlocalformData(updatedFormData)
    setOpen(false)
    console.log(updatedFormData, 'updatedFormData')
  }

  const onSubmit = async data => {
    console.log(data, 'data')
    const updatedData = { ...data, ...LocalformData } // Merge data with LocalformData
    console.log(updatedData, 'updatedData')

    handleNext(updatedData)
    // Router.push(`/diet/diet`)
  }

  const Day = [
    { id: 0, name: 'All', isActive: false },
    { id: 1, name: 'Mon', isActive: false },
    { id: 2, name: 'Tue', isActive: false },
    { id: 3, name: 'Wed', isActive: false },
    { id: 4, name: 'Thrs', isActive: false },
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ boxShadow: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Box sx={{ px: 5, mt: 2, float: 'left' }}>
            <Typography variant='h6'>Preview</Typography>
          </Box>

          <Grid container spacing={5} sx={{ mx: 1 }}>
            {/* First Grid item */}
            <Grid item xs={12} sm={4}>
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
                    {Array.isArray(formData.diet_image) && formData.diet_image.length > 0 ? (
                      formData.diet_image.map(file => (
                        <Avatar
                          key={file.name}
                          variant='square'
                          alt={file.name}
                          sx={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 1
                          }}
                          src={URL.createObjectURL(file)}
                        />
                      ))
                    ) : (
                      <Avatar
                        variant='square'
                        src={
                          typeof formData.recipe_image === 'string' ? formData.recipe_image : '/icons/recipedummy.svg'
                        }
                        sx={{
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </div>
            </Grid>
            {/* Second Grid item */}
            <Grid item xs={10} sm={7.5}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>
                  <span>Diet Name : </span>
                  <span style={{ fontWeight: 600 }}>{formData.diet_name}</span>
                </Typography>
                <Typography>
                  <span>Diet Type : </span>
                  <span style={{ fontWeight: 600 }}>{formData.diet_type ? formData.diet_type : '-'}</span>
                </Typography>
              </div>
              <Grid sx={{ mt: 5 }}>
                <Typography variant='h6'>Description</Typography>
                <Typography sx={{ pt: 1 }}>{formData.desc ? formData.desc : 'No Description to show'}</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Card sx={{ boxShadow: 'none', px: 5 }}>
            <Grid sx={{ overflowX: 'auto' }} value='full'>
              <Typography variant='h6'>Enter Values for Meals</Typography>
              <Typography variant='h6' onClick={handleClickOpen}>
                Test
              </Typography>

              <Grid sx={{ overflowX: 'auto', pb: 0 }} value='full'>
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
                            width: '500px'
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
                        {formData.diet_type === 'By Gender' ? (
                          <>
                            <TableCell
                              sx={{
                                border: 'none',
                                backgroundColor: '#C1D3D099',
                                height: '40px',
                                width: '127px',
                                borderRight: '1px solid #C3CEC7'
                              }}
                            >
                              <Typography>GENERIC</Typography>
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
                          </>
                        ) : (
                          ''
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {console.log(formData, 'rag')}
                      {formData.meal_data?.map((itemd, index) => {
                        console.log(itemd.meal_from_time, 'raghhhh')
                        const fromdate = new Date(itemd.meal_from_time)
                        const formattedfromTime = fromdate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                        const todate = new Date(itemd.meal_to_time)
                        const formattedtoTime = todate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                        const startTimes = formattedfromTime
                        const endTimes = formattedtoTime
                        const ind = index
                        return (
                          <>
                            <TableRow
                              sx={{
                                borderBottom: '1px solid #C3CEC7'
                              }}
                              key={index}
                            >
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
                                {/* <Typography>Meal Name :</Typography> */}
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
                                  <Box sx={{ width: 0, height: '19px', borderLeft: `2px solid #00AFD6` }}></Box>
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

                              <>
                                {itemd?.ingredient?.map((item, index) => {
                                  return (
                                    <TableRow>
                                      <TableCell
                                        sx={{
                                          position: 'sticky',
                                          left: '180px',
                                          border: 'none',
                                          backgroundColor: '#fff',
                                          width: '500px',
                                          float: 'left'
                                        }}
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
                                          <Box>
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                              }}
                                            >
                                              <Box sx={{ display: 'flex' }}>
                                                {item?.name && (
                                                  <Typography
                                                    sx={{
                                                      color: '#000',
                                                      lineHeight: '16.94px',
                                                      fontWeight: 600,
                                                      fontSize: '16px'
                                                    }}
                                                  >
                                                    {item?.name}
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
                                              {/* <Divider /> */}
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
                                        onClick={() => handleClickOpen(index, item, 'Generic', 'ingredient')}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {console.log(item.meal_type, 'eee')}
                                          <Box
                                            sx={{
                                              backgroundColor: '#0000000d',
                                              p: '10px',
                                              width: '110px',
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
                                              {console.log(index, 'index')}
                                              {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Generic'
                                                      ? meal.quantity + meal.meal_value_uom_id
                                                      : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
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
                                        onClick={() => handleClickOpen(index, item, 'Male', 'ingredient')}
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
                                              width: '110px',
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
                                              {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Male'
                                                      ? meal.quantity + meal.meal_value_uom_id
                                                      : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
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
                                        onClick={() => handleClickOpen(index, item, 'Female', 'ingredient')}
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
                                              width: '110px',
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
                                              {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Female' ? meal.quantity : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
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
                                        onClick={() => handleClickOpen(index, item, 'Kid', 'ingredient')}
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
                                              width: '110px',
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
                                              {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Kid' ? meal.quantity : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </TableCell>
                                      <Dialog
                                        open={open}
                                        onClose={handleClosed}
                                        aria-labelledby='customized-dialog-title'
                                        sx={{ '& .MuiDialog-paper': { overflow: 'visible', width: 500 } }}
                                      >
                                        <DialogTitle
                                          id='customized-dialog-title'
                                          sx={{
                                            p: 4,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <Typography variant='h6'>Add Value</Typography>
                                          <Icon icon='tabler:x' fontSize='1.25rem' onClick={handleClosed} />
                                        </DialogTitle>
                                        <DialogContent>
                                          {/* <Typography variant='h6'>Add Value</Typography> */}
                                          {console.log(initialValues.quantity)}
                                          <Grid container spacing={5} sx={{ mt: 1 }}>
                                            <Grid item xs={12} sm={6}>
                                              <FormControl fullWidth>
                                                <Controller
                                                  name='quantity'
                                                  control={control}
                                                  rules={{ required: true }}
                                                  //defaultValue={initialValues.quantity}
                                                  render={({ field: { value, onChange } }) => (
                                                    <TextField
                                                      type='number'
                                                      //value={value}
                                                      label='Quantity '
                                                      name='quantity'
                                                      //error={Boolean(errors.diet_name)}
                                                      onChange={onChange}
                                                      defaultValue={initialValues.quantity}
                                                    />
                                                  )}
                                                />
                                              </FormControl>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                              <FormControl fullWidth>
                                                {/* <InputLabel id='uom'> Select unit of measurement (UOM)</InputLabel> */}
                                                {console.log(uomList, 'uomList')}
                                                <Controller
                                                  name='meal_value_uom_id'
                                                  control={control}
                                                  rules={{ required: true }}
                                                  render={({ field: { value, onChange } }) => (
                                                    <Autocomplete
                                                      //value={value}
                                                      defaultValue={initialValues.meal_value_uom_id}
                                                      onChange={(event, newValue) => {
                                                        onChange(newValue) // Update the form value
                                                      }}
                                                      options={[
                                                        { value: 'kg', label: 'Kilogram (kg)' },
                                                        { value: 'gm', label: 'Gram (gm)' },
                                                        { value: 'lb', label: 'Pound (lb)' },
                                                        { value: 'oz', label: 'Ounce (oz)' }
                                                      ]} // List of options with value and label
                                                      getOptionLabel={option => option.label} // Function to get the label of the option
                                                      renderInput={params => (
                                                        <TextField
                                                          {...params}
                                                          label='Select Unit'
                                                          placeholder='Search & Select'
                                                        />
                                                      )}
                                                    />
                                                  )}
                                                />
                                              </FormControl>
                                            </Grid>

                                            <Grid item xs={12} sx={{ pt: 5 }}>
                                              <Controller
                                                name='notes'
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field: { value, onChange } }) => (
                                                  <TextField
                                                    multiline
                                                    fullWidth
                                                    //value={value}
                                                    label='Notes '
                                                    name='notes'
                                                    // error={Boolean(errors.desc)}
                                                    onChange={onChange}
                                                    id='textarea-outlined'
                                                    rows={3}
                                                    defaultValue={initialValues.notes}
                                                  />
                                                )}
                                              />
                                            </Grid>
                                            <Grid
                                              item
                                              xs={12}
                                              sx={{ textAlign: 'center', mb: 3 }}
                                              onClick={() => SelectQuantityclick(index, item)}
                                            >
                                              <Button variant='contained' sx={{ width: '350px', height: '40px' }}>
                                                ADD Quantity
                                              </Button>{' '}
                                            </Grid>
                                          </Grid>
                                        </DialogContent>
                                      </Dialog>
                                    </TableRow>
                                  )
                                })}
                              </>

                              <>
                                {itemd?.recipe?.map((item, index) => {
                                  return (
                                    <TableRow>
                                      <TableCell
                                        sx={{
                                          position: 'sticky',
                                          left: '180px',
                                          border: 'none',
                                          backgroundColor: '#fff',
                                          width: '500px',
                                          float: 'left'
                                        }}
                                      >
                                        <Box
                                          key={index}
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            //backgroundColor: '#E1F9ED',
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
                                              {/* <Divider /> */}
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
                                        onClick={() => handleClickOpen(index, item, 'Generic', 'recipe')}
                                      >
                                        <Box
                                          sx={{
                                            height: '100%'
                                          }}
                                        >
                                          {console.log(item.meal_type, 'eee')}
                                          <Box
                                            sx={{
                                              backgroundColor: '#0000000d',
                                              p: '10px',
                                              width: '110px',
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
                                              {console.log(index, 'index')}
                                              {item.meal_type
                                                ? item.meal_type?.map((meal, i) => {
                                                    return meal.meal_value_header === 'Generic'
                                                      ? meal.quantity + meal.meal_value_uom_id
                                                      : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
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
                                        onClick={() => handleClickOpen(index, item, 'Male', 'recipe')}
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
                                              width: '110px',
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
                                              {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Male'
                                                      ? meal.quantity + meal.meal_value_uom_id
                                                      : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
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
                                        onClick={() => handleClickOpen(index, item, 'Female', 'recipe')}
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
                                              width: '110px',
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
                                              {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Female' ? meal.quantity : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
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
                                        onClick={() => handleClickOpen(index, item, 'Kid', 'recipe')}
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
                                              width: '110px',
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
                                              {item.meal_type
                                                ? item.meal_type.map((meal, i) => {
                                                    return meal.meal_value_header === 'Kid' ? meal.quantity : ''
                                                  })
                                                : 'Add'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </TableCell>

                                      <Dialog
                                        open={open}
                                        onClose={handleClosed}
                                        aria-labelledby='customized-dialog-title'
                                        sx={{ '& .MuiDialog-paper': { overflow: 'visible', width: 500 } }}
                                      >
                                        <DialogTitle
                                          id='customized-dialog-title'
                                          sx={{
                                            p: 4,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <Typography variant='h6'>Add Value</Typography>
                                          <Icon icon='tabler:x' fontSize='1.25rem' onClick={handleClosed} />
                                        </DialogTitle>
                                        <DialogContent>
                                          {/* <Typography variant='h6'>Add Value</Typography> */}
                                          <Grid container spacing={5} sx={{ mt: 1 }}>
                                            <Grid item xs={12} sm={6}>
                                              <FormControl fullWidth>
                                                <Controller
                                                  name='quantity'
                                                  control={control}
                                                  rules={{ required: true }}
                                                  //defaultValue={initialValues.quantity}
                                                  render={({ field: { value, onChange } }) => (
                                                    <TextField
                                                      type='number'
                                                      //value={value}
                                                      label='Quantity '
                                                      name='quantity'
                                                      //error={Boolean(errors.diet_name)}
                                                      onChange={onChange}
                                                      defaultValue={initialValues.quantity}
                                                    />
                                                  )}
                                                />
                                              </FormControl>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                              <FormControl fullWidth>
                                                {/* <InputLabel id='uom'> Select unit of measurement (UOM)</InputLabel> */}
                                                {console.log(uomList, 'uomList')}
                                                <Controller
                                                  name='meal_value_uom_id'
                                                  control={control}
                                                  rules={{ required: true }}
                                                  render={({ field: { value, onChange } }) => (
                                                    <Autocomplete
                                                      //value={value}
                                                      onChange={(event, newValue) => {
                                                        onChange(newValue) // Update the form value
                                                      }}
                                                      defaultValue={initialValues.meal_value_uom_id}
                                                      options={[
                                                        { value: 'kg', label: 'Kilogram (kg)' },
                                                        { value: 'gm', label: 'Gram (gm)' },
                                                        { value: 'lb', label: 'Pound (lb)' },
                                                        { value: 'oz', label: 'Ounce (oz)' }
                                                      ]} // List of options with value and label
                                                      getOptionLabel={option => option.label} // Function to get the label of the option
                                                      renderInput={params => (
                                                        <TextField
                                                          {...params}
                                                          label='Select Unit'
                                                          placeholder='Search & Select'
                                                        />
                                                      )}
                                                    />
                                                  )}
                                                />
                                              </FormControl>
                                            </Grid>

                                            <Grid item xs={12} sx={{ pt: 5 }}>
                                              <Controller
                                                name='notes'
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field: { value, onChange } }) => (
                                                  <TextField
                                                    multiline
                                                    fullWidth
                                                    //value={value}
                                                    label='Notes '
                                                    name='notes'
                                                    // error={Boolean(errors.desc)}
                                                    onChange={onChange}
                                                    id='textarea-outlined'
                                                    rows={3}
                                                    defaultValue={initialValues.notes}
                                                  />
                                                )}
                                              />
                                            </Grid>
                                            <Grid
                                              item
                                              xs={12}
                                              sx={{ textAlign: 'center', mb: 3 }}
                                              onClick={() => SelectQuantityclick(index, item)}
                                            >
                                              <Button variant='contained' sx={{ width: '350px', height: '40px' }}>
                                                ADD Quantity
                                              </Button>{' '}
                                            </Grid>
                                          </Grid>
                                        </DialogContent>
                                      </Dialog>
                                    </TableRow>
                                  )
                                })}
                              </>
                            </TableRow>
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CustomScrollbar>
              </Grid>
            </Grid>
          </Card>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12, mx: 6 }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={handlePrevClick}
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
              >
                Go back
              </Button>
              <Button
                onClick={finalhandleSubmit}
                variant='contained'
                endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}
              >
                Submit
              </Button>
            </Box>
          </Grid>
        </Card>
      </form>
    </>
  )
}

export default StepPreviewDiet
