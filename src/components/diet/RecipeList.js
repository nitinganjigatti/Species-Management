import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import Divider from '@mui/material/Divider'
import Avatar from 'src/@core/components/mui/avatar'
import Button from '@mui/material/Button'
import { margin, padding } from '@mui/system'
import { useState, useEffect, useCallback } from 'react'
import RecipeCard from 'src/views/pages/diet/test/recipeCard'
import { getRecipeList } from 'src/lib/api/diet/recipe'
import { CircularProgress, debounce } from '@mui/material'

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
    formData
  } = props

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
      const params = { page: ingredientPage, q: searchValue, sort, status: 1 }
      await getRecipeList({ params }).then(res => {
        if (res.data.result.length > 0) {
          setIngredientList(prevArray => [...prevArray, ...res?.data?.result])
          setTotalCount(res?.data?.total_count)
          setReachedEnd(false)
        } else {
          setReachedEnd(false)
        }
      })
    }
    getRecipeListData()
  }, [])

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleScroll = async e => {
    const container = e.target

    // Check if the user has reached the bottom
    if (totalCount > ingredientList.length) {
      if (container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight) {
        // User has reached the bottom, perform your action here
        setIngredientPage(++ingredientPage)
        setReachedEnd(true)
        try {
          // const nextPage = paginationModel.page + 1
          const params = { page: ingredientPage, q: searchValue, sort, status: 1 }

          const res = await getRecipeList({ params })

          if (res?.data?.result?.length > 0) {
            setIngredientList(prevArray => [...prevArray, ...res?.data?.result])

            // setPaginationModel(prevPagination => ({ ...prevPagination, page: nextPage }))
            setReachedEnd(false)
          } else {
            setReachedEnd(false) // Depending on your logic, you might want to set reached end to true
          }
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  const searchData = useCallback(
    debounce(async search => {
      if (searchValue != ' ') {
        try {
          // const currentAnimalFilterValue = animalFilterValueRef.current
          const params = { page: 1, q: search, sort, status: 1 }
          await getRecipeList({ params }).then(res => {
            if (res?.data?.result.length > 0) {
              setIngredientList(res?.data?.result)
              setIngredientPage(1)
            } else {
              setIngredientList([])
            }
          })
        } catch (error) {
          // console.error(error)
          setIngredientPage(1)
        }
      }
    }, 500),

    [searchValue]
  )

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
        bgcolor: '#dbe0de',
        gap: '24px'
      }}
    >
      {/* <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Typography variant='h6'> Add Recipes</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size='small'
            onClick={() => {
              handleSidebarClose()
            }}
            sx={{ color: 'text.primary' }}
          >
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box> */}

      <Box sx={{ position: 'fixed', top: 0, bgcolor: '#dbe0de', zIndex: 10, width: '562px' }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            px: '24px'
          }}
        >
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              style={{ marginLeft: -8 }}
              icon='material-symbols-light:add-notes-outline-rounded'
              fontSize={'32px'}
            />
            <Typography variant='h6'>Add Recipes</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size='small'
              onClick={() => {
                handleSidebarClose()
              }}
              sx={{ color: 'text.primary' }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            alignItems: 'center',

            p: 2,
            px: '24px'

            // width: '100%'
          }}
        >
          <Box>
            <TextField
              value={searchValue}
              fullWidth
              InputProps={{
                startAdornment: <Icon style={{ marginRight: 10 }} icon={'ion:search-outline'} />
              }}
              placeholder='Search'
              onKeyUp={e => searchData(e.target.value)}
              onChange={e => {
                setSearchValue(e.target.value)
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* on scroll */}
      <Box sx={{ marginTop: 30, height: '70%', overflowY: 'auto', bgcolor: '#dbe0de', p: 4 }} onScroll={handleScroll}>
        {/* <TextField
          fullWidth
          placeholder='Search Recipe or Ingredient'
          onKeyUp={e => searchData(e.target.value)}
          onChange={e => {
            setSearchValue(e.target.value)
          }}
        /> */}
        {/* Card Section */}

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
