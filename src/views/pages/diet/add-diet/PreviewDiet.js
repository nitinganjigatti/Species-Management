import { useState, useEffect } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Router from 'next/router'
import FormControl from '@mui/material/FormControl'
import { FormHelperText } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm, useFieldArray } from 'react-hook-form'
import { schedule } from 'src/pages/diet/diet/[id]/data'
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
import DietDetailCard from 'src/pages/diet/diet/[id]/DietDetailCard'
import DietDetail from 'src/pages/diet/diet/[id]'

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

    handleNext(data)
    Router.push(`/diet/diet`)
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
              <Grid sx={{ mt: 5 }}>
                <Typography variant='h6'>Description</Typography>
                <Typography>
                  Provide sustained energy,aid Provide sustained energy,aid Provide sustained energy,aid Provide
                  sustained energy,aid Provide sustained energy,aid{' '}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Card sx={{ boxShadow: 'none', px: 5 }}>
            <Grid sx={{ overflowX: 'auto' }} value='full'>
              <Typography variant='h6'>Enter Values for Meals</Typography>
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
              <Button type='submit' variant='contained' endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
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
