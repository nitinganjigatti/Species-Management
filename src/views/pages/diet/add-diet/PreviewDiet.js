import { useState, useEffect } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import { FormHelperText } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm, useFieldArray } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import IconButton from '@mui/material/IconButton'
import { getPreparationTypeList } from 'src/lib/api/diet/getIngredients'
import { CardContent, Avatar } from '@mui/material'
import { Divider, Card } from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import toast from 'react-hot-toast'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const defaultValues = {
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
}

const schema = yup.object().shape({
  by_percentage: yup.array().of(
    yup.object().shape({
      ingredient_id: yup.string().required('Ingredient is required'),
      quantity: yup
        .string()
        .required('Quantity is required')
        .test('is-less-than-100', 'Quantity must be less than or equal to 100', value => {
          return parseFloat(value) <= 100
        }),
      preparation_type_id: yup.string().required('Preparation type is required')
    })
  ),

  by_quantity: yup.array().of(
    yup.object().shape({
      ingredient_id: yup.string().required('Ingredient is required'),
      uom_id: yup.string().required('Uom is required'),
      quantity: yup
        .string()
        .required('Quantity is required')
        .test('is-less-than-100', 'Quantity must be less than or equal to 100', value => {
          return parseFloat(value) <= 100
        }),
      preparation_type_id: yup.string().required('Preparation type is required')
    })
  )
})

const StepPreviewDiet = ({
  formData,
  handleNext,
  handlePrev,
  uomList,
  IngredientTypeList,
  IngredientTypeListSearch,
  onCancelIconClick,
  handleIngredientChange
}) => {
  const ingredients = [{ label: ' Ingredients' }, { label: 'Quantity' }, { label: 'Preparation Type' }]

  const ingredientsbyqun = [
    { label: ' Ingredients' },
    { label: 'Quantity' },
    { label: 'Unit of Measurement' },
    { label: 'Preparation Type' }
  ]
  const [preparationTypeListPercentage, setPreparationTypeListPercentage] = useState([])
  const [preparationTypeListQuantity, setPreparationTypeListQuantity] = useState([])

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

  const {
    fields: fieldsIngredients,
    append: appendIngredients,
    remove: removeIngredients
  } = useFieldArray({
    control,
    name: 'by_percentage'
  })

  const {
    fields: fieldsByQuantity,
    append: appendByQuantity,
    remove: removeByQuantity
  } = useFieldArray({
    control,
    name: 'by_quantity'
  })

  const addIngredientsButton = () => {
    return (
      <>
        <Typography
          sx={{
            mb: 1,
            px: 4,
            mt: 6,
            float: 'left',
            color: '#37BD69',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: 600
          }}
          onClick={() => {
            appendIngredients({
              ingredient_id: '',
              quantity: '',
              preparation_type_id: ''
            })
          }}
        >
          <Icon icon='material-symbols:add' />
          ADD NEW INGREDIENT
        </Typography>
      </>
    )
  }

  const calculateTotalQuantity = () => {
    const byPercentageValues = getValues('by_percentage')
    const totalQuantity = byPercentageValues.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0)

    return totalQuantity
  }

  const addQuantityButton = () => {
    return (
      <Typography
        sx={{
          mb: 1,
          px: 4,
          mt: 6,
          float: 'left',
          color: '#37BD69',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={() => {
          appendByQuantity({
            ingredient_id: '',
            quantity: '',
            preparation_type_id: ''
          })
        }}
      >
        <Icon icon='material-symbols:add' />
        ADD NEW INGREDIENT
      </Typography>
    )
  }

  const removeIngredientButton = index => {
    console.log(index, 'index')

    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '35px' }}
        onClick={() => {
          removeIngredients(index)
        }}
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const removebyQuantityButton = index => {
    console.log(index, 'index')

    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '35px' }}
        onClick={() => {
          removeByQuantity(index)
        }}
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const handleAddRemoveingredient = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return <>{addIngredientsButton()}</>
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return <>{addIngredientsButton()}</>
    } else {
      return <>{removeIngredientButton(index)}</>
    }
  }

  const handleAddRemoveQuantity = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return <>{addQuantityButton()}</>
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return <>{addQuantityButton()}</>
    } else {
      return <>{removebyQuantityButton(index)}</>
    }
  }

  const handlePrevClick = () => {
    window.scrollTo(0, 0)
    handlePrev()
  }

  useEffect(() => {
    if (formData) {
      reset(formData)
    }
  }, [formData, reset])

  const onSubmit = async data => {
    console.log(data, 'data')
    alert('hi')
    handleNext(data)
  }

  const handlecheck = async (ingredientId, index, section) => {
    console.log(ingredientId, 'ingredientId')
    try {
      const response = await getPreparationTypeList(ingredientId)
      if (response.success === true) {
        console.log(IngredientTypeList, 'IngredientTypeList')
        const ingredient = IngredientTypeList.find(item => item.id === ingredientId)
        if (ingredient) {
          // Update the preparationTypeList array based on the section
          if (section === 'by_percentage') {
            setPreparationTypeListPercentage(prevList => {
              const newList = [...prevList]
              newList[index] = response.data.result

              return newList
            })
          } else if (section === 'by_quantity') {
            setPreparationTypeListQuantity(prevList => {
              const newList = [...prevList]
              newList[index] = response.data.result

              return newList
            })
          }
        }
      }
    } catch (error) {
      // Handle error
    }
  }

  useEffect(() => {
    formData.by_percentage.forEach((item, index) => {
      if (item.ingredient_id) {
        handlecheck(item.ingredient_id, index, 'by_percentage')
      }
    })
  }, [formData])

  useEffect(() => {
    formData.by_quantity.forEach((item, index) => {
      if (item.ingredient_id) {
        handlecheck(item.ingredient_id, index, 'by_quantity')
      }
    })
  }, [formData])

  const ScrollToFieldError = ({ errors, index }) => {
    // if (!errors) return
    const firstErrorField = Object.keys(errors)[0]
    console.log('First Error Field:', firstErrorField)
    console.log(errors)
    if (firstErrorField === 'by_percentage') {
      const errorElement = document.getElementById('test' + index)
      console.log(errorElement, 'errorElement')
      if (errorElement) {
        // errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.scroll(0, 250)
      }
    } else if (firstErrorField === 'by_quantity') {
      const errorElement = document.getElementById('testnew' + index)
      console.log(errorElement, 'errorElement')
      if (errorElement) {
        //errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.scrollTo(0, 700)
      }
    }

    return null
  }

  const handleEquilizerClick = () => {
    const byPercentageValues = getValues('by_percentage')
    console.log(byPercentageValues, 'byPercentageValues')
    const numIngredients = byPercentageValues.length
    const equalDistribution = 100 / numIngredients

    const updatedIngredients = byPercentageValues.map(ingredient => ({
      ...ingredient,
      quantity: equalDistribution.toString()
    }))
    setFormValue('by_percentage', updatedIngredients)
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {console.log(fieldsIngredients, 'fieldsIngredients')}
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
                    <Avatar
                      variant='square'
                      alt='Ingredient Image'
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '12px'
                      }}
                      src={'/icons/recipedummy.svg'}
                    ></Avatar>
                  </div>
                </CardContent>
              </div>
            </Grid>
            {/* Second Grid item */}
            <Grid item xs={10} sm={7.5}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>
                  <span>Diet Name : </span>
                  <span style={{ fontWeight: 600 }}>Brown Bear Diet</span>
                </Typography>
                <Typography>
                  <span>Diet Type : </span>
                  <span style={{ fontWeight: 600 }}>Gender Wise</span>
                </Typography>
              </div>
              <Grid sx={{ mt: 8 }}>
                <Typography>Description</Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={handlePrevClick}
                startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
                sx={{ mr: 6 }}
              >
                Go back
              </Button>
              <Button type='submit' variant='contained' endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
                Next
              </Button>
            </Box>
          </Grid>
        </Card>
      </form>
    </>
  )
}

export default StepPreviewDiet
