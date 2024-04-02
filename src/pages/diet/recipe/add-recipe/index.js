// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import { Box, Card, CardContent, FormControlLabel, Switch, Divider } from '@mui/material'
import Step from '@mui/material/Step'
import Stepper from '@mui/material/Stepper'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'

// ** Step Components
import StepAddIngredients from 'src/views/pages/recipe/add-recipe/StepAddIngredients'
import StepBasicDetails from 'src/views/pages/recipe/add-recipe/StepBasicDetails'
import StepBillingDetails from 'src/views/pages/recipe/add-recipe/StepBillingDetails'

// ** Custom Component Import
import StepperCustomDot from 'src/views/forms/form-wizard/StepperCustomDot'

// ** Styled Components
import StepperWrapper from 'src/@core/styles/mui/stepper'

const steps = [
  {
    title: 'Account',
    subtitle: 'Account Details'
  },
  {
    title: 'Personal',
    subtitle: 'Enter Information'
  },
  {
    title: 'Billing',
    subtitle: 'Payment Details'
  }
]

const AddRecipe = () => {
  // ** States
  const [activeStep, setActiveStep] = useState(0)

  // Handle Stepper
  const handleNext = () => {
    setActiveStep(activeStep + 1)
  }

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const getStepContent = step => {
    switch (step) {
      case 0:
        return <StepBasicDetails handleNext={handleNext} />
      case 1:
        return <StepAddIngredients handleNext={handleNext} handlePrev={handlePrev} />
      case 2:
        return <StepBillingDetails handlePrev={handlePrev} />
      default:
        return null
    }
  }

  const renderContent = () => {
    return getStepContent(activeStep)
  }
  return (
    <>
      <Card>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '90%' }}>
              <Typography sx={{ mb: 1 }} variant='h6'>
                Add New Recipe
              </Typography>
              <Typography sx={{ mb: 1, fontSize: 14 }}>
                Please provide the statndard unit, unit of measurement,water percentage, and dry ingredient proportions
                for this <br /> ingredient prior to processing.
              </Typography>
            </div>
            <div style={{ width: '10%', float: 'left' }}>
              <FormControlLabel
                control={
                  <Switch
                  //checked={status}
                  // onChange={e => {
                  //   // console.log('e.target.checked', e.target.checked)
                  //   setStatus(Number(e.target.checked))
                  //   onStatusChange(e)
                  // }}
                  />
                }
                label=' Active '
                labelPlacement='start'
              />
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
