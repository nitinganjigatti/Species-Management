import { useState } from 'react'
// ** MUI Components
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import Autocomplete from '@mui/material/Autocomplete'
import { RadioGroup, FormControlLabel, Radio } from '@mui/material'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { right } from '@popperjs/core'

const StepAddIngredients = ({ handleNext, handlePrev }) => {
  const [value, setValue] = useState('checked')

  const handleChange = event => {
    setValue(event.target.value)
    console.log(event.target.value, 'lll')
  }

  const ingredients = [{ label: ' Ingredients' }, { label: 'Quantity' }, { label: 'Preparation Type' }]

  const defaultValues = {
    salts: [
      {
        label: '',
        salt_qty: '',
        salt_id: ''
      }
    ]
  }

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    trigger,

    getValues
  } = useForm({
    defaultValues,
    // resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'salts'
  })

  const addSaltButton = () => {
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
          append({
            salt_qty: '',
            slat_id: ''
          })
        }}
      >
        <Icon icon='material-symbols:add' />
        ADD NEW INGREDIENT
      </Typography>
    )
  }
  const clearSaltFields = index => {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '35px' }}
        onClick={() => {
          remove(index)
          insert(index, {})
        }}
      >
        <Icon icon='material-symbols:cancel' />
      </div>
    )
  }

  const removeSaltButton = index => {
    console.log(index, 'index')
    return (
      <Box
        style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '20px', marginTop: '35px' }}
        onClick={() => {
          remove(index)
        }}
        className='checkraghu'
      >
        <Icon icon='material-symbols:cancel' />
      </Box>
    )
  }

  const handleAddRemoveSalts = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addSaltButton()}
          {/* {removeSaltButton(index)} */}
        </>
      )
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return (
        <>
          {addSaltButton()}
          {/* {clearSaltFields(index)} */}
        </>
      )
    } else if (index <= 0 && fields.length > 0) {
      return <>{clearSaltFields(index)}</>
    } else {
      return <>{removeSaltButton(index)}</>
    }
  }
  return (
    <>
      <Box sx={{ mb: 1, px: 5, mt: 5, float: 'left' }}>
        <Typography variant='h5'>Add Ingredients</Typography>
        <RadioGroup
          sx={{ mt: 3 }}
          row
          value={value}
          name='simple-radio'
          onChange={handleChange}
          aria-label='simple-radio'
        >
          <FormControlLabel value='checked' control={<Radio />} label='By Percentage' />
          <FormControlLabel value='unchecked' control={<Radio />} label='By Quantity' />
        </RadioGroup>
      </Box>

      <Grid container spacing={5} sx={{ px: 5 }}>
        <Grid container spacing={5} sx={{ px: 5, background: '#E8F4F2', my: 4, borderRadius: 0.5, mx: 4 }}>
          {ingredients.map((ingredient, index) => (
            <Grid item xs={12} sm={3.6} key={index} sx={{ py: 4, px: 2 }}>
              <Typography sx={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 600 }}>
                {ingredient.label}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={5} sx={{ px: 5, py: 5 }}>
          {fields.map((field, index) => (
            <Grid container spacing={5} sx={{ px: 5, py: 5 }} key={field.id}>
              <Grid item xs={12} sm={3.6}>
                <FormControl fullWidth>
                  <Autocomplete
                    id={`autocomplete-outlined-${index}`}
                    getOptionLabel={option => option.title || ''}
                    renderInput={params => <TextField {...params} label='Combo box' />}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3.6}>
                <FormControl fullWidth>
                  <TextField label='Enter Quantity (%)' type='number' placeholder='Enter Quantity' />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3.6}>
                <FormControl fullWidth>
                  <Autocomplete
                    id={`autocomplete-outlined-${index}`}
                    getOptionLabel={option => option.title || ''}
                    renderInput={params => <TextField {...params} label='Combo box' />}
                  />
                </FormControl>
              </Grid>
              {/* {fields.length !== 1 && (
                <div
                  style={{ float: 'right', position: 'absolute', right: '4%', cursor: 'pointer' }}
                  onClick={() => handleRemoveClick(index)}
                >
                  <Icon icon='material-symbols:cancel' />
                </div>
              )} */}
              {fields.length - 1 === index && index > 0 ? (
                <Grid>{removeSaltButton(index)}</Grid>
              ) : index <= 0 && fields.length - 1 <= 0 ? (
                <Grid>{clearSaltFields(index)}</Grid>
              ) : (
                ''
              )}
              <Grid>{handleAddRemoveSalts(fields, index)}</Grid>
            </Grid>
          ))}
        </Grid>

        {/* <TextField multiline id='textarea-outlined' placeholder='Placeholder' label='Multiline Placeholder' /> */}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 12 }}>
            <Button
              color='secondary'
              variant='outlined'
              onClick={handlePrev}
              startIcon={<Icon icon='mdi:arrow-left' fontSize={20} />}
              sx={{ mr: 6 }}
            >
              Go back
            </Button>
            <Button variant='contained' onClick={handleNext} endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}>
              Next
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

export default StepAddIngredients
