import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import React, { useRef } from 'react'
import { LoadingButton } from '@mui/lab'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Snackbar,
  Typography,
  debounce
} from '@mui/material'
import { getAnimalList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useTheme } from '@mui/material/styles'

const AddAnimals = ({ drawerWidth, animals_s, setAnimals_s, user, addEventSidebarOpen, handleSidebarClose }) => {
  const [searchValue, setSearchValue] = useState('')
  const theme = useTheme()

  const [currentDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  })
  const [animalList, setAnimalList] = useState([])
  const [collectedAnimals, setCollectedAnimals] = useState([])
  const [collectedAnimalsCount, setCollectedAnimalsCount] = useState(0)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [animalFilterValue, setAnimalFilterValue] = useState('')
  let [animalPage, setAnimalPage] = useState(1)
  const animalFilterValueRef = useRef(animalFilterValue)
  useEffect(() => {
    animalFilterValueRef.current = animalFilterValue
  }, [animalFilterValue])

  const [animals_s_after_update, setAnimals_s_after_update] = useState([])

  const [open, setOpen] = useState(false)

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  const handleChange = event => {
    setAnimalFilterValue(event.target.value)
    setShowFilterDialog(false)
  }

  const action = (
    <>
      <IconButton size='small' aria-label='close' color='inherit' onClick={handleClose}>
        &#10005;
      </IconButton>
    </>
  )

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' onClick={addAnimals}>
          Add
        </LoadingButton>
      </Fragment>
    )
  }

  useEffect(() => {
    const filteredAnimals_s = animals_s.filter(
      existingAnimal => !collectedAnimals.some(newAnimal => newAnimal.animal_id === existingAnimal.animal_id)
    )

    // filtering out old elements which is not matched
    const filteredCollectedAnimals = collectedAnimals.filter(
      newAnimal => !animals_s.some(existingAnimal => existingAnimal.animal_id === newAnimal.animal_id)
    )

    // Concatenate the both filtered arrays
    const updatedAnimals_s = [...filteredAnimals_s, ...filteredCollectedAnimals]

    setAnimals_s_after_update(updatedAnimals_s)
  }, [])

  const handleScroll = async e => {
    const container = e.target

    // Check if the user has reached the bottom
    if (container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight && searchValue != '') {
      // User has reached the bottom, perform your action here
      setAnimalPage(++animalPage)
      setReachedEnd(true)
      try {
        const currentAnimalFilterValue = animalFilterValueRef.current
        await getAnimalList(
          {
            end_date: currentDate,
            page_no: animalPage,
            q: searchValue,
            start_date: '',
            type: 'all_animals',
            selected_user_id: user
          },
          currentAnimalFilterValue
        ).then(res => {
          if (res?.data?.animals?.length > 0) {
            setAnimalList(prevArray => [...prevArray, ...res?.data?.animals])
            setReachedEnd(false)
          } else {
            setReachedEnd(false)
            setOpen(true)
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleClear = () => {
    setSearchValue('')
    setAnimalList([])
    setCollectedAnimals([])
    setCollectedAnimalsCount(0)
    setAnimalPage(1)
  }

  const searchAnimalData = useCallback(
    debounce(async search => {
      if (searchValue != ' ') {
        try {
          const currentAnimalFilterValue = animalFilterValueRef.current
          await getAnimalList(
            {
              end_date: currentDate,
              page_no: 1,
              q: search,
              start_date: '',
              type: 'all_animals',
              selected_user_id: user
            },
            currentAnimalFilterValue
          ).then(res => {
            if (res?.data?.animals.length > 0) {
              setAnimalList(res?.data?.animals)
              setAnimalPage(1)
            }
          })
        } catch (error) {
          // console.error(error)
          setAnimalPage(1)
        }
      }
    }, 500),

    []
  )

  const animalFunc = item => {
    setCollectedAnimals(pre => {
      const updatedArray = collectedAnimals
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
      setCollectedAnimalsCount(updatedArray?.length)

      const filteredAnimals_s = animals_s.filter(
        existingAnimal => !collectedAnimals.some(newAnimal => newAnimal.animal_id === existingAnimal.animal_id)
      )

      // filtering out old elements which is not matched
      const filteredCollectedAnimals = collectedAnimals.filter(
        newAnimal => !animals_s.some(existingAnimal => existingAnimal.animal_id === newAnimal.animal_id)
      )

      // Concatenate the both filtered arrays
      const updatedAnimals_s = [...filteredAnimals_s, ...filteredCollectedAnimals]

      setAnimals_s_after_update(updatedAnimals_s)

      return updatedArray
    })
  }

  const addAnimals = () => {
    // filtering out new elements which is not matched
    const filteredAnimals_s = animals_s.filter(
      existingAnimal => !collectedAnimals.some(newAnimal => newAnimal.animal_id === existingAnimal.animal_id)
    )

    // filtering out old elements which is not matched
    const filteredCollectedAnimals = collectedAnimals.filter(
      newAnimal => !animals_s.some(existingAnimal => existingAnimal.animal_id === newAnimal.animal_id)
    )

    // Concatenate the both filtered arrays
    const updatedAnimals_s = [...filteredAnimals_s, ...filteredCollectedAnimals]

    setAnimals_s(updatedAnimals_s)
    handleClear()
    handleSidebarClose()
    setAnimalPage(1)
    setCollectedAnimals([])
    setCollectedAnimalsCount(0)
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] }, height: '100vh' }}
    >
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} message='All animals Found' action={action} />

      <Dialog
        open={showFilterDialog}
        maxWidth='md'
        height='auto'
        scroll='body'
        onClose={() => setShowFilterDialog(false)}
        onBackdropClick={() => setShowFilterDialog(false)}
      >
        <Card>
          <CardHeader
            title={'Filter By'}
            action={
              <IconButton size='small' onClick={() => setShowFilterDialog(false)} sx={{ ml: 20 }}>
                <Icon icon='mdi:close' />
              </IconButton>
            }
          />
          <CardContent>
            <RadioGroup
              aria-labelledby='demo-radio-buttons-group-label'
              name='radio-buttons-group'
              value={animalFilterValue}
              onChange={handleChange}
            >
              <FormControlLabel value='commonName' control={<Radio />} label='Common Name' />
              <FormControlLabel value='scientificName' control={<Radio />} label='Scientific Name' />
              <FormControlLabel value='identifier' control={<Radio />} label='identifier' />
            </RadioGroup>
          </CardContent>
        </Card>
      </Dialog>
      <Box sx={{ height: '0px', zIndex: 12 }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            paddingX: 2
          }}
        >
          <Typography variant='h6'>Add Animals</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <IconButton
              size='small'
              onClick={() => {
                setShowFilterDialog(true)
              }}
              sx={{ color: 'text.primary' }}
            >
              <Icon icon='mdi:filter' color={theme.palette.primary.main} fontSize={20} />
            </IconButton> */}
            <IconButton
              size='small'
              onClick={() => {
                setAnimalList([])
                setCollectedAnimals([])
                setCollectedAnimalsCount(0)
                handleSidebarClose()
                setSearchValue('')
                setAnimalPage(1)
              }}
              sx={{ color: 'text.primary' }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <TextField
          fullWidth
          sx={{ p: 2, borderBottom: 0, backgroundColor: 'white', zIndex: 10 }}
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
                    &#10005;
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Box sx={{ height: '90%', overflowY: 'auto', mt: '100px' }} onScroll={handleScroll}>
        {animalList.length > 0 &&
          animalList?.map((item, index) => (
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
                    <Avatar
                      sx={{
                        '& > img': {
                          objectFit: 'contain'
                        }
                      }}
                      alt={item?.default_icon}
                      src={item?.default_icon}
                    />
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
                    <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                      {item.local_identifier_name ? item.local_identifier_name + ' : ' + item.local_id : item.animal_id}
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{item?.default_common_name}</Typography>
                    <Typography sx={{ fontWeight: 400 }}>Encl:{item?.enclosure_id}</Typography>
                    <Typography sx={{ fontWeight: 400 }}>Sec: {item?.section_name}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    defaultChecked={animals_s?.some(i => i.animal_id === item?.animal_id)}
                    onChange={e => {
                      animalFunc(item)
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
      </Box>
      {reachedEnd ? <LinearProgress /> : null}
      <Box
        sx={{
          p: 3,
          bottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'transparent'
        }}
      >
        <Typography>
          {animals_s_after_update?.length > 0 ? 'Selected Animals : ' + animals_s_after_update?.length : null}
        </Typography>
        <RenderSidebarFooter />
      </Box>
    </Drawer>
  )
}

export default AddAnimals
