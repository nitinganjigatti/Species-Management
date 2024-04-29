// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import { Card, CardContent, Divider, Breadcrumbs, Link, debounce, Box, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Step from '@mui/material/Step'
import Stepper from '@mui/material/Stepper'
import StepLabel from '@mui/material/StepLabel'

// ** Step Components
import StepBasicDetails from 'src/views/pages/diet/add-diet/StepBasicDetails'
import { getIngredientList } from 'src/lib/api/diet/getIngredients'
import IconButton from '@mui/material/IconButton'
import toast from 'react-hot-toast'

// ** Custom Component Import
import StepperCustomDot from 'src/views/forms/form-wizard/StepperCustomDot'
import StepperWrapper from 'src/@core/styles/mui/stepper'
import { getUnitsForRecipe, addNewRecipe, getRecipeDetail, updateRecipe } from 'src/lib/api/diet/recipe'
import Router from 'next/router'
import { useRouter } from 'next/router'
import StepPreviewDiet from 'src/views/pages/diet/add-diet/PreviewDiet'
import { getDietTypeList } from 'src/lib/api/diet/dietList'

const steps = [
  {
    title: 'Basic Information',
    subtitle: 'Enter details'
  },
  {
    title: 'Add Quantity',
    subtitle: 'Enter details'
  }
]

const AddDiet = () => {
  const router = useRouter()
  const { id } = router.query
  const [activeStep, setActiveStep] = useState(0)
  const [uomList, setUom] = useState([])
  const [IngredientTypeList, setIngredientTypeList] = useState([])
  const [selectedCard, setSelectedCard] = useState([])
  const [formData, setFormData] = useState({
    diet_name: '',
    diet_type: '',
    diet_type_id: '',
    diet_type_child: '',
    diet_image: '',
    desc: '',
    add_meal: [
      {
        newid: 'meal0',
        meal_name: '',
        meal_from_time: '',
        meal_to_time: '',
        notes: '',
        recipe: [
          {
            recipe_id: '',
            days_of_week: [],
            remarks: '',
            meal_type: [
              {
                meal_value_header: '',
                quantity: '',
                meal_value_uom_id: '',
                notes: ''
              }
            ]
          }
        ],
        ingredient: []
      }
    ],
    by_quantity: [
      {
        ingredient_id: '',
        ingredient_name: '',
        feed_type_label: '',
        uom_id: '',
        quantity: '',
        preparation_type_id: '',
        preparation_type: ''
      }
    ]
  })

  const handleSelectedCardChange = card => {
    setSelectedCard(card)
  }

  const getUnitsList = async () => {
    try {
      const params = {
        // type: ['length', 'weight'],
        // page: 1
      }
      await getDietTypeList({ params: params }).then(res => {
        console.log(res, 'res')
        setUom(res?.data)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const IngredientTypeListSearch = debounce(async value => {
    try {
      await callIngredientTypeList({ status: 1, page: 1, limit: 20, q: value })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  // const callIngredientTypeList = async ({ status, page, limit, q }) => {
  //   try {
  //     const params = {
  //       //status,
  //       q,

  //       //active: 1,
  //       page,
  //       limit
  //     }
  //     await getIngredientList({ params: params }).then(res => {
  //       setIngredientTypeList(res?.data?.result)
  //     })
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  const handleCancelIconClick = async () => {
    setFormData(prevData => ({
      ...prevData,
      by_quantity: prevData.by_quantity.map(item => ({
        ...item,
        ingredient_id: '',
        ingredient_name: '',
        feed_type_label: ''
      }))
    }))
    callIngredientTypeList({ status: 1, page: 1, limit: 10, q: '' })
  }

  const getIngredientsDetailval = async id => {
    try {
      const response = await getRecipeDetail(id)
      console.log(response, 'response')
      if (response.data.success === true && response.data.data !== null) {
        const data = response.data.data

        const convertedData = {
          ...data,
          add_meal: data.add_meal.map(item => ({
            ...item,
            ingredient_id: String(item.ingredient_id),
            preparation_type_id: String(item.preparation_type_id)
          })),
          by_quantity: data.by_quantity.map(item => ({
            ...item,
            ingredient_id: String(item.ingredient_id),
            preparation_type_id: String(item.preparation_type_id),
            uom_id: String(item.uom_id)
          }))
        }

        // Filter out the keys that were initially set in formData
        const initialKeys = Object.keys(formData)
        const updatedData = {}
        Object.keys(convertedData).forEach(key => {
          if (initialKeys.includes(key)) {
            updatedData[key] = convertedData[key]
          }
        })

        setFormData(prevData => ({
          ...prevData,
          ...updatedData
        }))
      }
    } catch (error) {
      console.log('Feed list', error)
    }
  }
  useEffect(() => {
    getUnitsList()
    // callIngredientTypeList({ status: 1, page: 1, limit: 10 })
  }, [])

  useEffect(() => {
    console.log(id, 'id')
    if (id) {
      getIngredientsDetailval(id)
    }
  }, [id])

  const handleNext = data => {
    // setFormData(prevData => ({
    //   ...prevData,
    //   ...newData
    // }))
    setFormData({ ...formData, ...data })
    setActiveStep(activeStep + 1)
  }

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1)
    }
  }

  // const handleBasicDetailsChange = (name, value) => {
  //   setFormData(prevData => ({
  //     ...prevData,
  //     [name]: value
  //   }))
  // }

  const handleIngredientChange = (name, value, ingredient, index) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
      ingredients: {
        ...prevData.ingredients,
        byPercentage: prevData.ingredients.byPercentage.map((item, i) =>
          i === index ? { ...item, ingredient_id: ingredient.value } : item
        ),
        byQuantity: prevData.ingredients.byQuantity.map((item, i) =>
          i === index ? { ...item, ingredient_id: ingredient.value } : item
        )
      }
    }))
  }

  const updateFormData = newData => {
    setFormData(prevData => ({
      ...prevData,
      ...newData
    }))
  }

  const handleStepBillingSubmit = async () => {
    if (!id) {
      const numericFormData = {
        ...formData,
        add_meal: JSON.stringify(
          formData.add_meal.map(item => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            quantity: parseFloat(item.quantity).toFixed(2),
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type
          }))
        ),
        by_quantity: JSON.stringify(
          formData.by_quantity.map(item => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            uom_id: item.uom_id,
            quantity: item.quantity,
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type
          }))
        )
      }

      // Remove unnecessary fields from formData
      const updatedFormData = {
        ...numericFormData,
        add_meal: numericFormData.add_meal,
        by_quantity: numericFormData.by_quantity,
        diet_image: numericFormData.diet_image[0]
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await addNewRecipe(updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/recipe`)

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
                    Recipe added successfully
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
      }
    } else {
      const numericFormData = {
        ...formData,
        add_meal: JSON.stringify(
          formData.add_meal.map(item => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            quantity: parseFloat(item.quantity).toFixed(2),
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type
          }))
        ),
        by_quantity: JSON.stringify(
          formData.by_quantity.map(item => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            uom_id: item.uom_id,
            quantity: item.quantity,
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type
          }))
        )
      }

      const updatedFormData = {
        ...numericFormData,
        add_meal: numericFormData.add_meal,
        by_quantity: numericFormData.by_quantity
      }
      console.log(formData.diet_image, 'klkl')
      if (formData.diet_image === null) {
        delete updatedFormData.diet_image
        delete updatedFormData.remove_current_image
      } else if (typeof formData.diet_image === 'string') {
        delete updatedFormData.diet_image
        delete updatedFormData.remove_current_image
      } else {
        updatedFormData.diet_image = formData.diet_image[0]
        updatedFormData.remove_current_image = '1'
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await updateRecipe(id, updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/recipe`)

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
                    Recipe updated successfully
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
      }
    }
  }

  const getStepContent = step => {
    switch (step) {
      case 0:
        return (
          <StepBasicDetails
            handleNext={handleNext}
            formData={formData}
            //onChange={handleBasicDetailsChange}
            updateFormData={updateFormData}
            uomList={uomList}
            setSelectedCard={handleSelectedCardChange}
            selectedCard={selectedCard}
          />
        )
      case 1:
        return (
          <StepPreviewDiet
            handleNext={handleNext}
            handlePrev={handlePrev}
            handleIngredientChange={handleIngredientChange}
            updateFormData={updateFormData}
            formData={formData}
            uomList={uomList}
            IngredientTypeList={IngredientTypeList}
            IngredientTypeListSearch={IngredientTypeListSearch}
            onCancelIconClick={handleCancelIconClick}
          />
        )
      default:
        return null
    }
  }

  const renderContent = () => {
    console.log(formData, 'formdat')

    return getStepContent(activeStep)
  }

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit'>Diet</Typography>
        <Link underline='hover' color='inherit' href='/diet/diet/'>
          Diet
        </Link>
        {console.log(id, 'id')}
        <Typography color='text.primary'>{id ? 'Edit recipe' : 'Add new diet'}</Typography>
      </Breadcrumbs>
      {console.log(formData, 'ppp')}
      <Card sx={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '90%' }}>
              <Typography variant='h6'>{id ? 'Edit Recipe' : 'Add New Diet'}</Typography>
            </div>
          </div>
        </CardContent>

        <StepperWrapper sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
          <Stepper activeStep={activeStep} sx={{ width: '55%', px: 15 }}>
            {steps.map((step, index) => {
              return (
                <Step key={index}>
                  <StepLabel StepIconComponent={StepperCustomDot}>
                    <div className='step-label'>
                      {/* <Typography className='step-number'>{`0${index + 1}`}</Typography> */}
                      <div>
                        <Typography className='step-title'>{step.title}</Typography>
                        <Typography className='step-subtitle'>{step.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
        </StepperWrapper>
      </Card>
      {renderContent()}
    </>
  )
}

export default AddDiet
