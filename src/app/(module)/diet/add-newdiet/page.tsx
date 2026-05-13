'use client';
import React, { useState } from 'react'
import {
  Tabs,
  Tab,
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  FormControl,
  FormHelperText
} from '@mui/material'
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

const MealTabs = () => {
  const { t } = useTranslation()
  const [meals, setMeals] = useState([{ id: 1, name: 'Meal 1', fromTime: null, toTime: null, notes: '' }])
  const [activeTab, setActiveTab] = useState(0)

  const handleAddMeal = () => {
    const newMeal = { id: meals.length + 1, name: `Meal ${meals.length + 1}`, fromTime: null, toTime: null, notes: '' }
    setMeals([...meals, newMeal])
    setActiveTab(meals.length)
  }

  const handleTabChange = (event: any, newValue: any) => {
    setActiveTab(newValue)
  }

  const handleMealChange = (index: any, field: any, value: any) => {
    const updatedMeals: any[] = [...meals]
    updatedMeals[index][field] = value
    setMeals(updatedMeals)
  }

  return (
    <Box>
      {meals.map((meal, index) => (
        <Box key={meal.id} hidden={activeTab !== index}>
          <Card sx={{ mt: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              {meals.map((meal, index) => (
                <Tab key={meal.id} label={meal.name} />
              ))}
              <Tab label='+' onClick={handleAddMeal} />
            </Tabs>
            <CardHeader title={`Add ${meal.name}`} />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label='Meal name'
                    value={meal.name}
                    onChange={e => handleMealChange(index, 'name', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      {React.createElement(TimePicker as any, {
                        label: t('diet_module.select_time_from'),
                        value: meal.fromTime ? dayjs(meal.fromTime) : null,
                        onChange: (newValue: any) => handleMealChange(index, 'fromTime', newValue),
                        renderInput: (params: any) => React.createElement(TextField, params)
                      })}
                    </LocalizationProvider>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      {React.createElement(TimePicker as any, {
                        label: t('diet_module.select_time_to'),
                        value: meal.toTime ? dayjs(meal.toTime) : null,
                        onChange: (newValue: any) => handleMealChange(index, 'toTime', newValue),
                        renderInput: (params: any) => React.createElement(TextField, params)
                      })}
                    </LocalizationProvider>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label='Notes'
                    value={meal.notes}
                    onChange={e => handleMealChange(index, 'notes', e.target.value)}
                  />
                </Grid>
              </Grid>
              {/* Add your previous logic for recipes, combos, ingredients here */}
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  )
}

export default MealTabs
