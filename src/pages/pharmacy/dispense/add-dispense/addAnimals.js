// ** React Imports
import { useState, Fragment } from 'react'
// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import React from 'react'
import { LoadingButton } from '@mui/lab'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
// ** Third Party Imports
import { Avatar, Checkbox, Typography } from '@mui/material'
import { getAnimalList } from 'src/lib/api/pharmacy/dispenseProduct'

const AddAnimals = ({ drawerWidth, animals_s, setAnimals_s, user, addEventSidebarOpen, handleSidebarClose }) => {
  const [searchValue, setSearchValue] = useState('')
  const [currentDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [animalList, setAnimalList] = useState([])
  const [collectedAnimals, setCollectedAnimals] = useState([])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' onClick={addAnimals}>
          Add
        </LoadingButton>
      </Fragment>
    )
  }

  const handleClear = () => {
    setSearchValue('')
    setAnimalList([])
    setCollectedAnimals([])
  }

  const searchAnimalData = async search => {
    try {
      await getAnimalList({
        end_date: currentDate,
        page_no: 1,
        q: search,
        start_date: '',
        type: 'all_animals',
        selected_user_id: user
      }).then(res => {
        if (res?.data?.animals.length > 0) {
          setAnimalList(res?.data?.animals)
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  const animalFunc = item => {
    setCollectedAnimals(pre => {
      const updatedArray = collectedAnimals
      console.log('item', item)
      const existingIndex = updatedArray?.findIndex(animal => animal?.animal_id === item?.animal_id)
      if (existingIndex !== -1) {
        // If animal_id exists, remove the element
        updatedArray?.splice(existingIndex, 1)
      } else {
        // If animal_id does not exist, add the new element
        updatedArray?.push({
          animal_id: item.animal_id,
          animalName: item.default_common_name,
          enclosure_id: item?.enclosure_id,
          section_name: item?.section_name,
          icon: item.default_icon,
          gender: item?.sex
        })
      }
      return updatedArray
    })
  }

  const addAnimals = () => {
    setAnimals_s([...animals_s, ...collectedAnimals])
    handleClear()
    handleSidebarClose()
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Typography variant='h6'>Add Animals</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size='small'
              onClick={() => {
                setAnimalList([])
                handleSidebarClose()
                setSearchValue('')
              }}
              sx={{ color: 'text.primary' }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <TextField
          fullWidth
          sx={{ p: 2, borderBottom: 0, backgroundColor: 'white' }}
          variant='standard'
          placeholder='Search Animals'
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyUp={e => searchAnimalData(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment sx={{ m: 3 }} position='end'>
                {searchValue && (
                  <IconButton edge='end' onClick={handleClear}>
                    {/* <CloseIcon /> */}&#10005;
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
        />
      </Box>
      {addEventSidebarOpen ? (
        <div>
          {animalList?.map((item, index) => (
            <Box key={index}>
              <Box
                sx={{
                  p: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: 2,
                  borderColor: '#dddddd'
                }}
              >
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                      alignItems: 'center'
                    }}
                  >
                    <Avatar alt={item?.default_icon} src={item?.default_icon} />
                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#96DED1' }} variant='rounded'>
                      {item?.sex === 'male' ? (
                        <Typography sx={{ fontSize: 14 }}>M</Typography>
                      ) : item?.sex === 'female' ? (
                        <Typography sx={{ fontSize: 14 }}>F</Typography>
                      ) : (
                        <Typography sx={{ fontSize: 14 }}>U</Typography>
                      )}
                    </Avatar>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{item.animal_id}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{item?.default_common_name}</Typography>
                    <Typography sx={{ fontWeight: 400 }}>Encl:{item?.enclosure_id}</Typography>
                    <Typography sx={{ fontWeight: 400 }}>Sec: {item?.section_name}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    disabled={animals_s?.some(i => i.animal_id === item?.animal_id)}
                    onChange={e => {
                      animalFunc(item)
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </div>
      ) : null}
      <Box
        sx={{
          position: 'sticky',
          p: 3,
          bottom: 0,
          zIndex: 17,
          display: 'flex',
          justifyContent: 'end'
        }}
      >
        <RenderSidebarFooter />
      </Box>
    </Drawer>
  )
}

export default AddAnimals
