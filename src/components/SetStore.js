import React, { useEffect, useRef, useContext, useState, Fragment } from 'react'

import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import { useDropdownContext } from 'src/context/storeContext'
import { AuthContext, AuthProvider } from 'src/context/AuthContext'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import MenuList from '@mui/material/MenuList'
import ButtonGroup from '@mui/material/ButtonGroup'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { readAsync } from 'src/lib/windows/utils'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

function SetStore() {
  // ** States
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState()

  const getStoreData = async () => {
    const data = await readAsync('userDetails')
    console.log('stores', data)
    setOptions(data?.modules?.pharmacy_data?.pharmacy)
  }

  const { selectedValue, setSelectedValue } = useDropdownContext()
  const authData = useContext(AuthContext)

  const handleSelectChange = event => {
    const newValue = event.target.value

    setSelectedValue(newValue)
  }

  // ** Ref
  const anchorRef = useRef(null)

  const handleClick = () => {
    // console.info(You clicked '{options[selectedIndex]}')
  }

  const handleMenuItemClick = (event, id) => {
    const selected = options.filter(el => {
      return el.id == id
    })
    console.log('event', event)
    console.log('id', id)
    console.log('selected', selected)
    setSelectedStore(selected)

    setSelectedValue(selected)

    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = () => {
    setOpen(false)
  }
  useEffect(() => {
    getStoreData()
    console.log('dataaa', authData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Fragment>
      <ButtonGroup variant='outlined' ref={anchorRef} aria-label='split button'>
        <Button onClick={handleClick}>{selectedStore ? selectedStore[0]?.name : `Select Store`}</Button>

        <Button
          sx={{ px: '0' }}
          aria-haspopup='menu'
          onClick={handleToggle}
          aria-label='select merge strategy'
          aria-expanded={open ? 'true' : undefined}
          aria-controls={open ? 'split-button-menu' : undefined}
        >
          <Icon icon='mdi:menu-down' />
        </Button>
      </ButtonGroup>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu'>
                  {options?.map((option, index) => (
                    <MenuItem
                      key={index}
                      selected={selectedStore ? selectedStore[0]?.name : null}
                      onClick={event => handleMenuItemClick(event, option.id)}
                    >
                      {option?.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  )
}

export default SetStore
