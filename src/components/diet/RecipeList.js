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
import { debounce } from '@mui/material'

const RecipeList = props => {
  const { addEventSidebarOpen, handleSidebarClose, submitLoader, setSelectedCard, selectedCard } = props

  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [ingredientList, setIngredientList] = useState([])
  const [reachedEnd, setReachedEnd] = useState(false)
  const [sort, setSort] = useState('desc')
  let [ingredientPage, setIngredientPage] = useState(1)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  console.log('paginationModel ??', paginationModel)

  useEffect(() => {
    const getRecipeListData = async () => {
      const params = { page: ingredientPage, q: searchValue, sort }
      await getRecipeList({ params }).then(res => {
        console.log('response', res)
        if (res.data.result.length > 0) {
          setIngredientList(prevArray => [...prevArray, ...res?.data?.result])
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
    if (container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight) {
      // User has reached the bottom, perform your action here
      console.log('if')
      try {
        const nextPage = paginationModel.page + 1
        const params = { page: nextPage, q: searchValue, sort, limit: paginationModel.pageSize, status: 1 }

        const res = await getRecipeList({ params })
        console.log('res', res)

        if (res?.data?.result?.length > 0) {
          setIngredientList(prevArray => [...prevArray, ...res?.data?.result])
          setPaginationModel(prevPagination => ({ ...prevPagination, page: nextPage }))
          setReachedEnd(false)
        } else {
          setReachedEnd(true) // Depending on your logic, you might want to set reached end to true
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  const searchData = useCallback(
    debounce(async search => {
      console.log('search')
      if (searchValue != ' ') {
        try {
          // const currentAnimalFilterValue = animalFilterValueRef.current
          const params = { page: ingredientPage, q: search, sort, status: 1 }
          await getRecipeList({ params }).then(res => {
            if (res?.data?.result.length > 0) {
              setIngredientList(res?.data?.result)
              setIngredientPage(1)
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
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 600] } }}
    >
      <Box
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
      </Box>
      <Box
        sx={{
          p: theme => theme.spacing(5, 6),
          height: '95%',
          overflowY: 'auto',
          bgcolor: '#dbe0de',
          '&::-webkit-scrollbar': {
            width: '8px', // Width of the scrollbar
            height: '4px' // Height of the scrollbar
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888', // Color of the thumb
            borderRadius: '4px' // Border radius of the thumb
          }
        }}
        onScroll={handleScroll}
      >
        <TextField
          fullWidth
          placeholder='Search Recipe or Ingredient'
          onKeyUp={e => searchData(e.target.value)}
          onChange={e => {
            setSearchValue(e.target.value)
          }}
        />
        {/* Card Section */}

        <RecipeCard rows={ingredientList} setSelectedCard={setSelectedCard} selectedCard={selectedCard} />

        {/* End Card Section */}
      </Box>
    </Drawer>
  )
}

export default RecipeList
