// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import { Card, CardContent, Divider, Breadcrumbs, Link, debounce, Box, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Step from '@mui/material/Step'
import Stepper from '@mui/material/Stepper'
import StepLabel from '@mui/material/StepLabel'

// ** Step Components
import StepAddIngredients from 'src/views/pages/recipe/add-recipe/StepAddIngredients'
import StepBasicDetails from 'src/views/pages/recipe/add-recipe/StepBasicDetails'
import StepBillingDetails from 'src/views/pages/recipe/add-recipe/StepBillingDetails'
import { getIngredientList } from 'src/lib/api/diet/getIngredients'

// ** Custom Component Import
import StepperCustomDot from 'src/views/forms/form-wizard/StepperCustomDot'
import StepperWrapper from 'src/@core/styles/mui/stepper'
import { getUnitsForRecipe, addNewRecipe, getRecipeDetail, updateRecipe } from 'src/lib/api/diet/recipe'
import Router from 'next/router'
import { useRouter } from 'next/router'
import Toaster from 'src/components/Toaster'

const steps = [
  {
    title: 'Basic Information',
    subtitle: 'Enter details'
  },
  {
    title: 'Add Ingredients',
    subtitle: 'Enter details'
  },
  {
    title: 'Preview',
    subtitle: 'Preview & Submit'
  }
]

const AddRecipe = () => {
  const router = useRouter()
  const { id, name } = router.query
  const [activeStep, setActiveStep] = useState(0)
  const [uomList, setUom] = useState([])
  const [IngredientTypeList, setIngredientTypeList] = useState([])
  const [fullIngredientList, setFullIngredientList] = useState([])
  const [urlType, seturlType] = useState('')

  const [formData, setFormData] = useState({
    recipe_name: '',
    portion_size: '',
    portion_uom_id: '',
    portion_uom_name: '',
    nutrional_value: '',
    nutrional_uom_id: '',
    kcal: '',
    recipe_image: '',
    by_percentage: [
      {
        ingredient_id: '',
        ingredient_name: '',
        feed_type_label: '',
        quantity: '',
        preparation_type_id: '',
        preparation_type: ''
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
    ],
    desc: ''
  })

  useEffect(() => {
    getUnitsList()
    callIngredientTypeList({ status: 1, page: 1, limit: 10 })
  }, [])

  const getUnitsList = async () => {
    try {
      const params = {
        type: ['length', 'weight'],
        page: 1,
        limit: 50
      }
      await getUnitsForRecipe({ params: params }).then(res => {
        setUom(res?.data?.result)
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

  const callIngredientTypeList = async ({ status, page, limit, q }) => {
    try {
      const params = {
        //status,
        q,
        //active: 1,
        page,
        limit,
        status: 1
      }

      await getIngredientList({ params: params }).then(res => {
        setIngredientTypeList(res?.data?.result)
        setFullIngredientList(prevList => [
          ...prevList,
          ...res?.data?.result.filter(newItem => !prevList.some(item => item.id === newItem.id))
        ])
      })
    } catch (e) {
      console.log(e)
    }
  }
  // const IngredientTypeListSearch = debounce(value => {
  //   console.log(value, 'value')
  //   if (value) {
  //     const filteredList = fullIngredientList.filter(ingredient =>
  //       ingredient.ingredient_name.toLowerCase().includes(value.toLowerCase())
  //     )
  //     console.log(filteredList, 'filteredList')
  //     setIngredientTypeList(filteredList)
  //   } else {
  //     // If no search value, show the full list
  //     setIngredientTypeList(fullIngredientList)
  //   }
  // }, 500)

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
        console.log(name, 'name')
        // Update recipe_name based on urlType
        if (urlType === 'copy') {
          data.recipe_name = name
        }

        const convertedData = {
          ...data,
          by_percentage: data.by_percentage.map(item => ({
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

        const ingredientList = data.by_percentage.map(item => ({
          id: item.ingredient_id,
          ingredient_name: item.ingredient_name
        }))
        console.log(ingredientList, 'ingredientList')
        setFullIngredientList(ingredientList)
      }
    } catch (error) {
      console.log('Feed list', error)
    }
  }

  useEffect(() => {
    if (id) {
      const url = new URL(window.location.href)
      const action = url.searchParams.get('action')
      console.log(action, 'action')
      seturlType(action || '')
    }
  }, [id])

  useEffect(() => {
    console.log(id, 'id')
    if (id && urlType) {
      getIngredientsDetailval(id)
    }
  }, [id, urlType])

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
        by_percentage: JSON.stringify(
          formData.by_percentage.map(item => ({
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
      console.log(numericFormData, 'numericFormData')
      // Remove unnecessary fields from formData
      const updatedFormData = {
        ...numericFormData,
        by_percentage: numericFormData.by_percentage,
        by_quantity: numericFormData.by_quantity,
        recipe_image: numericFormData?.recipe_image?.[0] || null
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await addNewRecipe(updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/recipe`)

        Toaster({ type: 'success', message: 'Recipe' + ' ' + apival?.message })
      } else {
        Toaster({
          type: 'error',
          message: apival?.message?.recipe_image ? 'Image type only PNG and JPG is allowed' : apival?.message
        })
      }
    } else if (id && urlType === 'copy') {
      const numericFormData = {
        ...formData,
        by_percentage: JSON.stringify(
          formData.by_percentage.map(item => ({
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
        by_percentage: numericFormData.by_percentage,
        by_quantity: numericFormData.by_quantity
      }
      console.log(formData.recipe_image, 'klkl')
      if (formData.recipe_image === null) {
        delete updatedFormData.recipe_image
        delete updatedFormData.remove_current_image
      } else if (typeof formData.recipe_image === 'string') {
        delete updatedFormData.recipe_image
        delete updatedFormData.remove_current_image
      } else {
        updatedFormData.recipe_image = formData?.recipe_image?.[0] || null
        updatedFormData.remove_current_image = '1'
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await addNewRecipe(updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/recipe`)

        Toaster({ type: 'success', message: 'Recipe' + ' ' + apival?.message })
      } else {
        Toaster({
          type: 'error',
          message: apival?.message?.recipe_image ? 'Image type only PNG and JPG is allowed' : apival?.message
        })
      }
    } else {
      const numericFormData = {
        ...formData,
        by_percentage: JSON.stringify(
          formData.by_percentage.map(item => ({
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
        by_percentage: numericFormData.by_percentage,
        by_quantity: numericFormData.by_quantity
      }
      console.log(formData.recipe_image, 'klkl')
      if (formData.recipe_image === null) {
        delete updatedFormData.recipe_image
        delete updatedFormData.remove_current_image
      } else if (typeof formData.recipe_image === 'string') {
        delete updatedFormData.recipe_image
        delete updatedFormData.remove_current_image
      } else {
        updatedFormData.recipe_image = formData?.recipe_image?.[0] || null
        updatedFormData.remove_current_image = '1'
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await updateRecipe(id, updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/recipe`)

        Toaster({ type: 'success', message: 'Recipe' + ' ' + apival?.message })
      } else {
        Toaster({
          type: 'error',
          message: apival?.message?.recipe_image ? 'Image type only PNG and JPG is allowed' : apival?.message
        })
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
            updateFormData={updateFormData}
            uomList={uomList}
          />
        )
      case 1:
        return (
          <StepAddIngredients
            handleNext={handleNext}
            handlePrev={handlePrev}
            handleIngredientChange={handleIngredientChange}
            updateFormData={updateFormData}
            formData={formData}
            uomList={uomList}
            fullIngredientList={fullIngredientList}
            setFullIngredientList={setFullIngredientList}
            IngredientTypeListSearch={IngredientTypeListSearch}
            onCancelIconClick={handleCancelIconClick}
          />
        )
      case 2:
        return <StepBillingDetails handlePrev={handlePrev} handleSubmit={handleStepBillingSubmit} formData={formData} />
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
        <Link underline='hover' color='inherit' href='/diet/recipe/'>
          Recipe
        </Link>
        {console.log(id, 'id')}
        <Typography color='text.primary'>{id ? 'Edit recipe' : 'Add new recipe'}</Typography>
      </Breadcrumbs>
      {console.log(formData, 'ppp')}
      <Card>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '90%' }}>
              <Typography sx={{ mb: 1 }} variant='h6'>
                {id ? 'Edit Recipe' : 'Add New Recipe'}
              </Typography>
              <Typography sx={{ mb: 1, fontSize: 14 }}>
                Please provide the nutritional values, unit of measurement,water percentage, and dry ingredient
                proportions for this <br /> ingredient prior to processing.
              </Typography>
            </div>
          </div>
        </CardContent>

        <Divider sx={{ mx: '20px !important', pb: 1 }} />

        <StepperWrapper sx={{ mb: 5, mt: 5, pt: 5, display: 'flex', justifyContent: 'center' }}>
          <Stepper activeStep={activeStep} sx={{ width: '75%', px: 15 }}>
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
        {renderContent()}
      </Card>
    </>
  )
}

export default AddRecipe
