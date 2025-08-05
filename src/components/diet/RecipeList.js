import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { margin, padding } from '@mui/system'
import { useState, useEffect, useCallback } from 'react'
import RecipeCard from 'src/views/pages/diet/add_recipe_combo-List/recipeCard'
import { getRecipeList } from 'src/lib/api/diet/recipe'
import { CircularProgress, debounce } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const RecipeList = props => {
  const {
    addEventSidebarOpen,
    handleSidebarClose,
    setSelectedCardRecipe,
    selectedCardRecipe,
    checkid,
    onChange,
    allRecipeSelectedValues,
    setAllRecipeSelectedValues,
    formData,
    fromrow,
    recipeid,
    dietid,
    recipeName
  } = props
  const theme = useTheme()
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [ingredientList, setIngredientList] = useState([])
  const [totalCount, setTotalCount] = useState('')
  const [loading, setLoading] = useState(false)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [sortBy, setsortBy] = useState('desc')
  let [ingredientPage, setIngredientPage] = useState(1)

  useEffect(() => {
    const getRecipeListData = async () => {
      setReachedEnd(true)

      const params = {
        page: ingredientPage,
        q: fromrow !== 'rowedit_recipe' ? searchValue : recipeName,
        sortBy,
        status: 1,
        limit: 10,
        meal_type: 'recipe'
      }
      const res = await getRecipeList({ params })

      if (res?.data?.result?.length > 0) {
        const newResults = res.data.result.filter(
          item => !ingredientList.some(existingItem => existingItem.id === item.id)
        )

        // Combine previous and new results, ensuring unique IDs
        const combinedList = [...ingredientList, ...newResults]
        const uniqueList = Array.from(new Map(combinedList.map(item => [item.id, item])).values())

        setIngredientList(uniqueList)
        setTotalCount(res.data.total_count)
        setReachedEnd(false)
      } else {
        setReachedEnd(false)
      }
    }

    getRecipeListData()
  }, [ingredientPage, sortBy, recipeid])

  const handleScroll = async e => {
    const container = e.target
    const threshold = 20

    // Check if user has reached the bottom and more data is available
    if (totalCount > ingredientList?.length && !reachedEnd) {
      const isNearBottom =
        container.scrollHeight - Math.round(container.scrollTop) <= container.clientHeight + threshold

      if (isNearBottom) {
        setReachedEnd(true) // Prevent multiple API calls

        try {
          const params = { page: ingredientPage + 1, q: searchValue, sortBy, status: 1, limit: 10, meal_type: 'recipe' }
          const res = await getRecipeList({ params })

          if (res?.data?.result?.length > 0) {
            const newResults = res.data.result.filter(
              item => !ingredientList.some(existingItem => existingItem.id === item.id)
            )

            const updatedList = [...ingredientList, ...newResults]

            // Ensure all IDs in the updated list are unique
            const uniqueList = Array.from(new Map(updatedList.map(item => [item.id, item])).values())

            setIngredientList(uniqueList)
          }

          setIngredientPage(prevPage => prevPage + 1)
          setReachedEnd(false)
        } catch (error) {
          console.error(error)
          setReachedEnd(false)
        }
      }
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async search => {
      try {
        setLoading(true)
        const params = { page: 1, q: search, sortBy, status: 1, limit: 10, meal_type: 'recipe' }
        const res = await getRecipeList({ params })
        if (res?.data?.result.length > 0) {
          // Merge new results with previous list, ensuring unique items
          const newResults = res.data.result.filter(
            item => !ingredientList.some(existingItem => existingItem.id === item.id)
          )
          setIngredientList(prevList => [...prevList, ...newResults])
          setIngredientPage(1)
          setTotalCount(res?.data?.total_count)
        } else {
          setIngredientList([])
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }, 500),
    [ingredientList]
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleCancelClick = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.customColors.bodyBg,
        gap: '24px'
      }}
    >
      <Box sx={{ position: 'fixed', top: 0, bgcolor: theme.palette.customColors.bodyBg, zIndex: 10, width: '562px' }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            px: '16px'
          }}
        >
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
            <Typography variant='h6' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              Add Recipes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size='small'
              onClick={() => {
                handleSidebarClose()
                setSearchValue('')
              }}
              sx={{ color: theme.palette.primary.light }}
            >
              <Icon icon='mdi:close' fontSize={25} />
            </IconButton>
          </Box>
        </Box>
        {fromrow !== 'rowedit_recipe' ? (
          <Box
            sx={{
              alignItems: 'center',

              p: 2,
              px: '16px'
            }}
          >
            <Box>
              <TextField
                value={searchValue}
                fullWidth
                placeholder='Search recipe'
                onChange={handleSearchChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderColor: theme.palette.customColors.Outline,
                    '& fieldset': {
                      borderColor: theme.palette.customColors.Outline
                    }
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Icon
                        style={{ marginRight: 10, color: theme.palette.customColors.OnSurfaceVariant }}
                        icon={'ion:search-outline'}
                      />
                    ),
                    endAdornment: searchValue && (
                      <IconButton onClick={handleCancelClick} size='small' sx={{ padding: 0 }}>
                        <Icon
                          icon={'ion:close-outline'}
                          style={{ color: theme.palette.customColors.OnSurfaceVariant }}
                        />
                      </IconButton>
                    )
                  }
                }}
              />
            </Box>
          </Box>
        ) : (
          ''
        )}
      </Box>
      {/* on scroll */}
      <Box
        className=''
        sx={{
          marginTop: fromrow !== 'rowedit_recipe' ? 30 : 12,

          //height: fromrow !== 'rowedit_recipe' ? '70%' : '80%',
          height: fromrow !== 'rowedit_recipe' ? 'calc(100vh - 140px)' : '80%',
          overflowY: 'auto',
          bgcolor: theme.palette.customColors.bodyBg,
          p: 4
        }}
        //onScroll={handleScroll}
        onScroll={fromrow !== 'rowedit_recipe' ? handleScroll : undefined}
      >
        <RecipeCard
          rows={ingredientList}
          setSelectedCardRecipe={setSelectedCardRecipe}
          selectedCardRecipe={selectedCardRecipe}
          checkid={checkid}
          onChange={onChange}
          handleSidebarClose={handleSidebarClose}
          allRecipeSelectedValues={allRecipeSelectedValues}
          setAllRecipeSelectedValues={setAllRecipeSelectedValues}
          formData={formData}
          addEventSidebarOpen={addEventSidebarOpen}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          fromrow={fromrow}
          recipeid={recipeid}
          loading={loading}
          dietid={dietid}
          recipeName={recipeName}
        />

        {/* End Card Section */}
        {reachedEnd ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: '500px',
              mt: 2

              // m: 2
            }}
          >
            <CircularProgress sx={{ mb: 10 }} />
          </Box>
        ) : null}
      </Box>
    </Drawer>
  )
}

export default RecipeList
