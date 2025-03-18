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
    submitLoader,
    setSelectedCardRecipe,
    selectedCardRecipe,
    checkid,
    onChange,
    allRecipeSelectedValues,
    setAllRecipeSelectedValues,
    formData,
    fromrow,
    recipeid
  } = props
  const theme = useTheme()
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [ingredientList, setIngredientList] = useState([])
  const [totalCount, setTotalCount] = useState('')

  const [reachedEnd, setReachedEnd] = useState(false)
  const [sort, setSort] = useState('desc')
  let [ingredientPage, setIngredientPage] = useState(1)

  useEffect(() => {
    const getRecipeListData = async () => {
      setReachedEnd(true)
      const params = { page: ingredientPage, q: searchValue, sort, status: 1, limit: 10, meal_type: 'recipe' }
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
  }, [ingredientPage, sort])

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
          const params = { page: ingredientPage + 1, q: searchValue, sort, status: 1, limit: 10, meal_type: 'recipe' }
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
        //setLoading(true)
        const params = { page: 1, q: search, sort, status: 1, limit: 10, meal_type: 'recipe' }
        const res = await getRecipeList({ params })
        if (res?.data?.result.length > 0) {
          setIngredientList(res.data.result)
          setIngredientPage(1)
          setTotalCount(res?.data?.total_count)
        } else {
          setIngredientList([])
        }
      } catch (error) {
        console.error(error)
      } finally {
        //setLoading(false)
      }
    }, 500),
    []
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
        bgcolor: '#EFF5F2',
        gap: '24px'
      }}
    >
      <Box sx={{ position: 'fixed', top: 0, bgcolor: '#EFF5F2', zIndex: 10, width: '562px' }}>
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
            <Typography variant='h6' sx={{ color: '#44544A' }}>
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
              sx={{ color: '#1F515B' }}
            >
              <Icon icon='mdi:close' fontSize={25} />
            </IconButton>
          </Box>
        </Box>
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
              InputProps={{
                startAdornment: <Icon style={{ marginRight: 10, color: '#44544A' }} icon={'ion:search-outline'} />,
                endAdornment: searchValue && (
                  <IconButton onClick={handleCancelClick} size='small' sx={{ padding: 0 }}>
                    <Icon icon={'ion:close-outline'} style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                  </IconButton>
                )
              }}
              placeholder='Search recipe'
              onChange={handleSearchChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderColor: '#839D8D',
                  '& fieldset': {
                    borderColor: '#839D8D'
                  }
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* on scroll */}
      <Box
        className=''
        sx={{ marginTop: 30, height: '70%', overflowY: 'auto', bgcolor: '#EFF5F2', p: 4 }}
        onScroll={handleScroll}
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
