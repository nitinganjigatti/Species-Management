import { Card, CardHeader, Button } from '@mui/material'
import { useState, useEffect } from 'react'
import FallbackSpinner from 'src/@core/components/spinner/index'
import RecipeList from 'src/components/diet/RecipeList'
import { getRecipeList } from 'src/lib/api/diet/recipe'

// import { getRecipeList } from 'src/lib/api/diet/recipe'

const TestPage = () => {
  const [recipeList, setRecipeList] = useState([])
  const [loader, setLoader] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [selectedCard, setSelectedCard] = useState([])

  const addEventSidebarOpen = () => {
    setOpenDrawer(true)
    setSelectedCard([])
  }

  const handleSidebarClose = () => {
    console.log('close event clicked')
    setOpenDrawer(false)
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <Card sx={{ display: 'flex' }}>
          <CardHeader title='Recipe List' />
          <div style={{ flex: '1' }}></div>
          <Button
            onClick={addEventSidebarOpen}
            variant='contained'
            size='medium'
            sx={{ alignSelf: 'flex-end', mb: '15px', mr: 2 }}
          >
            Add Recipe
          </Button>
        </Card>
      )}

      {
        <RecipeList
          recipeList={recipeList}
          setSelectedCard={setSelectedCard}
          selectedCard={selectedCard}
          drawerWidth={400}
          addEventSidebarOpen={openDrawer}
          handleSidebarClose={handleSidebarClose}
          submitLoader={submitLoader}
        />
      }
    </>
  )
}

export default TestPage
