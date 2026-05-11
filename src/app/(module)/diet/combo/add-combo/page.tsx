'use client';
// ** React Imports
import { useState, useEffect } from 'react'
import { Card, CardContent, Divider, Breadcrumbs, Link, debounce, Box, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Step from '@mui/material/Step'
import Stepper from '@mui/material/Stepper'
import StepLabel from '@mui/material/StepLabel'
import StepAddIngredients from 'src/views/pages/combo/add-combo/StepAddIngredients'
import StepBasicDetails from 'src/views/pages/combo/add-combo/StepBasicDetails'
import StepBillingDetails from 'src/views/pages/combo/add-combo/StepBillingDetails'
import { getIngredientList } from 'src/lib/api/diet/getIngredients'
import StepperCustomDot from 'src/views/forms/form-wizard/StepperCustomDot'
import StepperWrapper from 'src/@core/styles/mui/stepper'
import { getUnitsForRecipe, addNewRecipe, getRecipeDetail, updateRecipe } from 'src/lib/api/diet/recipe'
import useSafeRouter from 'src/hooks/useSafeRouter';
import { useParams, useSearchParams } from 'next/navigation';
import Toaster from 'src/components/Toaster'
import { getCutsizeList } from 'src/lib/api/diet/settings/cutSizes'
import { useTranslation } from 'react-i18next'

const steps = [
  {
    title: 'Basic Information with Items',
    subtitle: 'Enter details'
  },

  {
    title: 'Preview',
    subtitle: 'Preview & Submit'
  }
]

const AddCombo = () => {
  const router = useSafeRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) } as any;
  const { id, name } = routerQuery
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)
  const [uomList, setUom] = useState<any[]>([])
  const [cutsizeList, setcutSize] = useState<any[]>([])
  const [IngredientTypeList, setIngredientTypeList] = useState<any[]>([])
  const [fullIngredientList, setFullIngredientList] = useState<any[]>([])
  const [urlType, seturlType] = useState('')
  const [loader, setLoader] = useState(false)

  const [formData, setFormData] = useState<any>({
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
        preparation_type: '',
        cut_size: '',
        cut_size_id: ''
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
        preparation_type: '',
        cut_size: '',
        cut_size_id: ''
      }
    ],
    desc: ''
  })

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    getUnitsList()
    getCutsizeListdata()
    callIngredientTypeList({ status: 1, page: 1, limit: 20, q: '' })
  }, [activeStep])

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

  const getCutsizeListdata = async () => {
    try {
      const params = {
        page: 1,
        limit: 100
      }
      await getCutsizeList(params).then(res => {
        setcutSize(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const IngredientTypeListSearch = debounce(async value => {
    setSearchValue(value)
    setPage(1)
    try {
      await callIngredientTypeList({ status: 1, page: 1, limit: 20, q: value })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  const callIngredientTypeList = async ({ status, page, limit, q }: { status: any; page: any; limit: any; q: any }) => {
    try {
      const params = {
        //status,
        q,
        page,
        limit,
        status: 1
      }

      await getIngredientList({ params: params }).then(res => {
        setTotalCount(res?.data?.total_count || 0)
        setIngredientTypeList(res?.data?.result)
        setFullIngredientList(prevList => [
          ...prevList,
          ...res?.data?.result.filter((newItem: any) => !prevList.some((item: any) => item.id === newItem.id))
        ])
      })
    } catch (e) {
      console.log(e)
    }
  }

  const fetchMoreIngredients = () => {
    if (fullIngredientList.length < totalCount) {
      const nextPage = page + 1
      setPage(nextPage)
      callIngredientTypeList({ status: 1, page: nextPage, limit: 20, q: searchValue })
    }
  }

  const handleCancelIconClick = async () => {
    setFormData((prevData: any) => ({
      ...prevData,
      by_quantity: prevData.by_quantity.map((item: any) => ({
        ...item,
        ingredient_id: '',
        ingredient_name: '',
        feed_type_label: ''
      }))
    }))
    setPage(1)
    setSearchValue('')
    callIngredientTypeList({ status: 1, page: 1, limit: 20, q: '' })
  }

  const getIngredientsDetailval = async (id: any) => {
    try {
      setLoader(true)
      const response = await getRecipeDetail(id)

      if (response.data.success === true && response.data.data !== null) {
        const data = response.data.data

        if (urlType === 'copy') {
          data.recipe_name = name
        }

        const convertedData = {
          ...data,
          by_percentage: data.by_percentage.map((item: any) => ({
            ...item,
            ingredient_id: String(item.ingredient_id),
            preparation_type_id: String(item.preparation_type_id),
            cut_size_id: String(item.cut_size_id)
          })),
          by_quantity: data.by_quantity.map((item: any) => ({
            ...item,
            ingredient_id: String(item.ingredient_id),
            preparation_type_id: String(item.preparation_type_id),
            uom_id: String(item.uom_id),
            cut_size_id: String(item.cut_size_id)
          }))
        }

        const initialKeys = Object.keys(formData)
        const updatedData: any = {}
        Object.keys(convertedData).forEach(key => {
          if (initialKeys.includes(key)) {
            updatedData[key] = convertedData[key]
          }
        })

        setFormData((prevData: any) => ({
          ...prevData,
          ...updatedData
        }))

        const combinedIngredients = [
          ...data.by_percentage.map((item: any) => ({
            id: item.ingredient_id,
            ingredient_name: item.ingredient_name
          }))
          // ...data.by_quantity.map(item => ({
          //   id: item.ingredient_id,
          //   ingredient_name: item.ingredient_name
          // }))
        ]

        const uniqueIngredientList = combinedIngredients.filter(
          (item, index, self) => index === self.findIndex(i => i.id === item.id)
        )
        setLoader(false)
        setFullIngredientList((prevList: any[]) => [
          ...prevList,
          ...uniqueIngredientList.filter((newItem: any) => !prevList.some((item: any) => item.id === newItem.id))
        ])
      }
    } catch (error) {
      console.log('Feed list', error)
    }
  }

  useEffect(() => {
    if (id) {
      const url = new URL(window.location.href)
      const action = url.searchParams.get('action')

      seturlType(action || '')
    }
  }, [id])

  useEffect(() => {
    if (id && urlType) {
      getIngredientsDetailval(id)
    }
  }, [id, urlType])

  const handleNext = (data: any) => {
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

  const handleIngredientChange = (name: any, value: any, ingredient: any, index: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: value,
      ingredients: {
        ...prevData.ingredients,
        byPercentage: prevData.ingredients.byPercentage.map((item: any, i: any) =>
          i === index ? { ...item, ingredient_id: ingredient.value } : item
        ),
        byQuantity: prevData.ingredients.byQuantity.map((item: any, i: any) =>
          i === index ? { ...item, ingredient_id: ingredient.value } : item
        )
      }
    }))
  }

  const updateFormData = (newData: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      ...newData
    }))
  }

  const handleStepBillingSubmit = async () => {
    if (!id) {
      setLoader(true)

      const numericFormData = {
        ...formData,
        by_percentage: JSON.stringify(
          formData.by_percentage.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            quantity: parseFloat(item.quantity).toFixed(2),
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type,
            cut_size: item.cut_size,
            cut_size_id: item.cut_size_id
          }))
        ),
        by_quantity: JSON.stringify(
          formData.by_quantity.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            uom_id: item.uom_id,
            quantity: item.quantity,
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type,
            cut_size: item.cut_size,
            cut_size_id: item.cut_size_id
          }))
        )
      }

      // Remove unnecessary fields from formData
      const updatedFormData = {
        ...numericFormData,
        by_percentage: numericFormData.by_percentage,

        // by_quantity: numericFormData.by_quantity,
        by_quantity: [],
        recipe_image: numericFormData?.recipe_image?.[0] || null,
        meal_type: 'combo'
      }

      const apival = await addNewRecipe(updatedFormData)

      if (apival.success === true) {
        router.push(`/diet/combo`)
        setLoader(false)
        Toaster({ type: 'success', message: 'Mix' + ' ' + apival?.message })
      } else {
        Toaster({
          type: 'error',
          message: apival?.message?.recipe_image
        })
        setLoader(false)
      }
    } else if (id && urlType === 'copy') {
      setLoader(true)

      const numericFormData = {
        ...formData,
        by_percentage: JSON.stringify(
          formData.by_percentage.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            quantity: parseFloat(item.quantity).toFixed(2),
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type,
            cut_size: item.cut_size,
            cut_size_id: item.cut_size_id
          }))
        ),
        by_quantity: JSON.stringify(
          formData.by_quantity.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            uom_id: item.uom_id,
            quantity: item.quantity,
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type,
            cut_size: item.cut_size,
            cut_size_id: item.cut_size_id
          }))
        )
      }

      const updatedFormData: any = {
        ...numericFormData,
        by_percentage: numericFormData.by_percentage,

        // by_quantity: numericFormData.by_quantity,
        by_quantity: [],
        meal_type: 'combo'
      }

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

      const apival = await addNewRecipe(updatedFormData)

      if (apival.success === true) {
        router.push(`/diet/combo`)
        setLoader(false)
        Toaster({ type: 'success', message: 'Mix' + ' ' + apival?.message })
      } else {
        Toaster({
          type: 'error',
          message: apival?.message?.recipe_image
        })
        setLoader(false)
      }
    } else {
      setLoader(true)

      const numericFormData = {
        ...formData,
        by_percentage: JSON.stringify(
          formData.by_percentage.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            quantity: parseFloat(item.quantity).toFixed(2),
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type,
            cut_size: item.cut_size,
            cut_size_id: item.cut_size_id
          }))
        ),
        by_quantity: JSON.stringify(
          formData.by_quantity.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            feed_type_label: item.feed_type_label,
            uom_id: item.uom_id,
            quantity: item.quantity,
            preparation_type_id: parseInt(item.preparation_type_id),
            preparation_type: item.preparation_type,
            cut_size: item.cut_size,
            cut_size_id: item.cut_size_id
          }))
        )
      }

      const updatedFormData: any = {
        ...numericFormData,
        by_percentage: numericFormData.by_percentage,

        // by_quantity: numericFormData.by_quantity,
        by_quantity: [],
        meal_type: 'combo'
      }

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

      const apival = await updateRecipe(id as string, updatedFormData)

      if (apival.success === true) {
        router.push(`/diet/combo`)
        setLoader(false)
        Toaster({ type: 'success', message: 'Mix' + ' ' + apival?.message })
      } else {
        Toaster({
          type: 'error',
          message: apival?.message?.recipe_image
        })
        setLoader(false)
      }
    }
  }

  const getStepContent = (step: any) => {
    switch (step) {
      case 0:
        return (
          <>
            {/* <StepBasicDetails
              handleNext={handleNext}
              formData={formData}
              updateFormData={updateFormData}
              uomList={uomList}
            /> */}
            {(() => { const S = StepAddIngredients as any; return (
            <S
              handleNext={handleNext}
              handlePrev={handlePrev}
              handleIngredientChange={handleIngredientChange}
              updateFormData={updateFormData}
              formData={formData}
              uomList={uomList}
              cutsizeList={cutsizeList}
              fullIngredientList={fullIngredientList}
              setFullIngredientList={setFullIngredientList}
              IngredientTypeListSearch={IngredientTypeListSearch}
              onCancelIconClick={handleCancelIconClick}
              setcutSize={setcutSize}
              loader={loader}
              fetchMoreIngredients={fetchMoreIngredients}
            />
            ); })()}
          </>
        )
      case 1:
        return (
          <StepBillingDetails
            handlePrev={handlePrev}
            handleSubmit={handleStepBillingSubmit}
            formData={formData}
            loader={loader}
          />
        )

      default:
        return null
    }
  }

  const renderContent = () => {
    return getStepContent(activeStep)
  }

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Link underline='hover' color='inherit' href='/diet/combo/'>
          {t('navigation.mix')}
        </Link>

        <Typography
          sx={{
            color: 'text.primary'
          }}
        >
          {id ? t('diet_module.edit_mix') : t('diet_module.add_new_mix')}
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '90%' }}>
              <Typography sx={{ mb: 1 }} variant='h6'>
                {id ? t('diet_module.edit_mix') : t('diet_module.add_new_mix')}
              </Typography>
              {/* <Typography sx={{ mb: 1, fontSize: 14 }}>
                Please provide the nutritional values, unit of measurement,water percentage, and dry ingredient
                proportions for this <br /> ingredient prior to processing.
              </Typography> */}
            </div>
          </div>
        </CardContent>

        <Divider sx={{ mx: '20px !important', pb: 1 }} />

        <StepperWrapper sx={{ mb: 5, mt: 5, pt: 5, display: 'flex', justifyContent: 'center' }} className='combo_steps'>
          <Stepper activeStep={activeStep} sx={{ width: '75%', px: 15 }}>
            {steps.map((step, index) => {
              return (
                <Step key={index}>
                  <StepLabel
                    slots={{
                      // @ts-ignore
                      icon: StepperCustomDot
                    }}
                  >
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

export default AddCombo
