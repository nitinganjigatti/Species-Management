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
import Toaster from 'src/components/Toaster'

// ** Custom Component Import
import StepperCustomDot from 'src/views/forms/form-wizard/StepperCustomDot'
import StepperWrapper from 'src/@core/styles/mui/stepper'
import { addNewDiet, getDietDetails, updateDiet } from 'src/lib/api/diet/dietList'
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
  const { id, name } = router.query
  const [activeStep, setActiveStep] = useState(0)
  const [uomList, setUomList] = useState([])
  const [uomprev, setUomprev] = useState([])
  const [IngredientTypeList, setIngredientTypeList] = useState([])
  const [selectedCard, setSelectedCard] = useState([])
  const [selectedCardRecipe, setSelectedCardRecipe] = useState([])
  console.log('selectedCardRecipe :>> ', selectedCardRecipe)
  const [diettypechildvalues, setdiettypechildvalues] = useState([])
  const [urlType, seturlType] = useState('')

  const [formData, setFormData] = useState({
    diet_name: '',
    diet_type_name: '',
    diet_type_id: '',
    child: '',
    diet_image: '',
    desc: '',
    remarks: '',
    meal_data: [
      {
        mealid: 'meal0',
        meal_name: 'Meal 1',
        meal_from_time: '',
        meal_to_time: '',
        notes: '',
        recipe: [],
        ingredient: [],
        ingredientwithchoice: []
      }
    ]
  })

  const handleSelectedCardChange = card => {
    setSelectedCardRecipe(card)
  }

  const getUnitsList = async () => {
    try {
      const params = {
        // type: ['length', 'weight'],
        // page: 1
      }
      await getDietTypeList({ params: params }).then(res => {
        console.log(res, 'res')
        setUomList(res?.data)
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

  const handleRemarksChange = newRemarks => {
    setFormData(prevFormData => ({
      ...prevFormData,
      remarks: newRemarks
    }))
  }

  // const handleDietTypeChildValuesChange = values => {
  //   // Update the parent component state with the received values
  //   setdiettypechildvalues(values)
  // }

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

  useEffect(() => {
    if (id) {
      const url = new URL(window.location.href)
      const action = url.searchParams.get('action')
      console.log(action, 'action')
      seturlType(action || '')
    }
  }, [id])

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

  useEffect(() => {
    console.log(id, 'id')
    if (id && urlType) {
      console.log(urlType, 'urlType')
      getIngredientsDetailval(id)
    }
  }, [id, urlType])

  const getIngredientsDetailval = async id => {
    try {
      const response = await getDietDetails(id, { week_day: 0 })
      console.log(response, 'response')
      if (response.success === true && response.data !== null) {
        const data = response.data
        console.log(data, 'data')

        // Update formData state with the values from data
        setFormData(prevFormData => ({
          ...prevFormData,
          diet_name: urlType === 'copy' ? name : data.diet_name,
          diet_type_name: data.diet_type_name,
          diet_type_id: data.diet_type_id,
          child: data.child,
          diet_image: data.diet_image,
          desc: data.desc,
          remarks: data.remarks,
          meal_data: data.meal_data.map(meal => ({
            ...meal,
            meal_from_time: formatTime(meal.meal_from_time),
            meal_to_time: formatTime(meal.meal_to_time)
          }))
        }))

        const dietTypesData = data.child

        // const convertedData = dietTypesData?.map(item => item.replace(/ /g, '_').replace(/_to/g, ''))
        const convertedData = dietTypesData?.map(item => item.replace(/(\d+) /g, '$1_'))
        console.log(convertedData, 'convertedData')

        const newarr = convertedData?.map(item => {
          // Splitting the string into minWeight, maxWeight, and unit name
          const [weight, unitName] = item.split('_')
          const matchedUom = uomprev.find(item => item.name === unitName)

          return {
            meal_value_header: parseFloat(weight), // Convert to number
            weight_uom_id: parseFloat(matchedUom?._id),
            weight_uom_label: unitName
          }
        })
        console.log(newarr, 'newarr')
        const newarrdiet = newarr?.map((item, index) => ({
          unit: {
            value: {
              _id: item.weight_uom_id,
              name: item.weight_uom_label,
              description: item.weight_uom_label
            }
          },
          weight: parseInt(item.meal_value_header)
        }))

        document.cookie = `dietTypeChildValues=${JSON.stringify(data.child)}; path=/`
        document.cookie = `dietTypeChildVal=${JSON.stringify(newarr)}; path=/`
      }
    } catch (error) {
      console.log('Feed list', error)
    }
  }

  // Function to format time
  const formatTime = timeString => {
    const date = new Date(`2000-01-01 ${timeString}`)

    return date.toUTCString()
  }

  useEffect(() => {
    getUnitsList()

    // callIngredientTypeList({ status: 1, page: 1, limit: 10 })
  }, [])

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

  function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  const updateFormData = newData => {
    setFormData(prevData => ({
      ...prevData,
      ...newData
    }))
  }

  useEffect(() => {
    deleteCookie('dietTypeChildValues')
    deleteCookie('dietTypeChildVal')
  }, [])

  const handleStepBillingSubmit = async () => {
    console.log(formData, 'formdata')

    let mealTypeError = false
    let genericError = false

    formData.meal_data.forEach(item => {
      const { ingredientwithchoice, recipe, ingredient } = item

      const checkMealType = data => {
        if (data && data.length > 0) {
          if (!data.every(d => d.meal_type && Array.isArray(d.meal_type) && d.meal_type.length > 0)) {
            mealTypeError = true
            return false
          }
          if (!data.every(d => d.meal_type.some(mealType => mealType.meal_value_header === 'Generic'))) {
            genericError = true
            return false
          }
        }
        return true
      }

      checkMealType(ingredientwithchoice)
      checkMealType(recipe)
      checkMealType(ingredient)
    })

    if (mealTypeError) {
      return Toaster({ type: 'error', message: 'Enter the values of the meal' })
    }

    if (genericError) {
      return Toaster({ type: 'error', message: 'Please enter all the Generic values' })
    }

    if (!id) {
      // Omitting child field from formData
      // const { child, ...formDataWithoutChild } = formData

      const numericFormData = {
        // ...formDataWithoutChild,
        ...formData,
        child: JSON.stringify(formData.child),
        meal_data: JSON.stringify(
          formData.meal_data.map(item => {
            // Convert string date to Date objects
            const fromTime = new Date(item.meal_from_time)
            const toTime = new Date(item.meal_to_time)

            // Remove empty arrays from the object
            const filteredItem = Object.fromEntries(
              Object.entries(item).filter(([key, value]) => {
                // Filter out empty arrays or arrays with all null/undefined values
                return !Array.isArray(value) || value.some(val => val !== null && val !== undefined)
              })
            )

            return {
              ...filteredItem,
              mealid: item.mealid,
              meal_name: item.meal_name,
              meal_from_time: fromTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              meal_to_time: toTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              notes: item.notes

              // recipe: item?.recipe,
              // ingredient: item?.ingredient,
              // ingredientwithchoice: item?.ingredientwithchoice
            }
          })
        )
      }

      const updatedFormData = {
        ...numericFormData,
        meal_data: numericFormData.meal_data,
        diet_image: numericFormData?.diet_image?.length > 0 ? numericFormData.diet_image[0] : null
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await addNewDiet(updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/diet`)
        deleteCookie('dietTypeChildValues')
        deleteCookie('dietTypeChildVal')
        return Toaster({ type: 'success', message: apival.message })
      } else {
        return Toaster({
          type: 'error',
          message: apival?.message?.diet_image ? 'Image type only PNG and JPG is allowed' : apival?.message
        })
      }
    } else if (id && urlType === 'copy') {
      const numericFormData = {
        //...formDataWithoutChild,
        ...formData,
        child: JSON.stringify(formData.child),
        meal_data: JSON.stringify(
          formData.meal_data.map(item => {
            // Convert string date to Date objects
            const fromTime = new Date(item.meal_from_time)
            const toTime = new Date(item.meal_to_time)

            // Remove empty arrays from the object
            const filteredItem = Object.fromEntries(
              Object.entries(item).filter(([key, value]) => {
                // Filter out empty arrays or arrays with all null/undefined values
                return !Array.isArray(value) || value.some(val => val !== null && val !== undefined)
              })
            )

            return {
              ...filteredItem,
              mealid: item.mealid,
              meal_name: item.meal_name,
              meal_from_time: fromTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              meal_to_time: toTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              notes: item.notes

              // recipe: item?.recipe,
              // ingredient: item?.ingredient,
              // ingredientwithchoice: item?.ingredientwithchoice
            }
          })
        )
      }

      const updatedFormData = {
        ...numericFormData,
        meal_data: numericFormData.meal_data
      }
      console.log(formData.diet_image, 'klkl')
      if (formData.diet_image === null) {
        delete updatedFormData.diet_image
        delete updatedFormData.remove_current_image
      } else if (typeof formData.diet_image === 'string') {
        delete updatedFormData.diet_image
        delete updatedFormData.remove_current_image
      } else {
        updatedFormData.diet_image = formData.diet_image?.[0] || null
        updatedFormData.remove_current_image = '1'
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await addNewDiet(updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/diet`)
        deleteCookie('dietTypeChildValues')
        deleteCookie('dietTypeChildVal')

        return Toaster({ type: 'success', message: apival.message })
      } else {
        return Toaster({
          type: 'error',
          message: apival?.message?.diet_image ? 'Image type only PNG and JPG is allowed' : apival?.message
        })
      }
    } else {
      // Omitting child field from formData
      // const { child, ...formDataWithoutChild } = formData

      const numericFormData = {
        //...formDataWithoutChild,
        ...formData,
        child: JSON.stringify(formData.child),
        meal_data: JSON.stringify(
          formData.meal_data.map(item => {
            // Convert string date to Date objects
            const fromTime = new Date(item.meal_from_time)
            const toTime = new Date(item.meal_to_time)

            // Remove empty arrays from the object
            const filteredItem = Object.fromEntries(
              Object.entries(item).filter(([key, value]) => {
                // Filter out empty arrays or arrays with all null/undefined values
                return !Array.isArray(value) || value.some(val => val !== null && val !== undefined)
              })
            )

            return {
              ...filteredItem,
              mealid: item.mealid,
              meal_name: item.meal_name,
              meal_from_time: fromTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              meal_to_time: toTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              notes: item.notes

              // recipe: item?.recipe,
              // ingredient: item?.ingredient,
              // ingredientwithchoice: item?.ingredientwithchoice
            }
          })
        )
      }

      const updatedFormData = {
        ...numericFormData,
        meal_data: numericFormData.meal_data
      }
      console.log(formData.diet_image, 'klkl')
      if (formData.diet_image === null) {
        delete updatedFormData.diet_image
        delete updatedFormData.remove_current_image
      } else if (typeof formData.diet_image === 'string') {
        delete updatedFormData.diet_image
        delete updatedFormData.remove_current_image
      } else {
        updatedFormData.diet_image = formData.diet_image?.[0] || null
        updatedFormData.remove_current_image = '1'
      }

      console.log(updatedFormData, 'updatedFormData')
      const apival = await updateDiet(id, updatedFormData)
      console.log(apival, 'apival')
      if (apival.success === true) {
        Router.push(`/diet/diet`)
        deleteCookie('dietTypeChildValues')
        deleteCookie('dietTypeChildVal')

        return Toaster({ type: 'success', message: apival.message })
      } else {
        return Toaster({
          type: 'error',
          message: apival?.message?.diet_image ? 'Image type only PNG and JPG is allowed' : apival?.message
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
            setSelectedCardRecipe={handleSelectedCardChange}
            selectedCardRecipe={selectedCardRecipe}
            setFormData={setFormData}
            setUomprev={setUomprev}
            diettypechildvalues={diettypechildvalues}
            id={id}
          />
        )
      case 1:
        return (
          <StepPreviewDiet
            handleNext={handleNext}
            handlePrev={handlePrev}
            updateFormData={updateFormData}
            formData={formData}
            uomList={uomList}
            IngredientTypeList={IngredientTypeList}
            IngredientTypeListSearch={IngredientTypeListSearch}
            onCancelIconClick={handleCancelIconClick}
            finalhandleSubmit={handleStepBillingSubmit}
            uomprev={uomprev}
            setFormData={setFormData}
            id={id}
            remarks={formData.remarks}
            onRemarksChange={handleRemarksChange}

            // onDietTypeChildValuesChange={handleDietTypeChildValuesChange}
            // diettypechildvalues={diettypechildvalues}
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
        <Link underline='hover' color='inherit' href='/diet/diet/'>
          Diet
        </Link>
        {console.log(id, 'id')}
        <Typography color='text.primary'>
          {id && urlType === 'copy' ? 'Add new diet' : id && urlType === 'update' ? 'Edit diet' : 'Add new diet'}
        </Typography>
      </Breadcrumbs>
      {console.log(formData, 'ppp')}
      <Card sx={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '90%' }}>
              <Typography variant='h6'>
                {' '}
                {id && urlType === 'copy' ? 'Add new diet' : id && urlType === 'update' ? 'Edit diet' : 'Add new diet'}
              </Typography>
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
