import React, { useEffect, useRef, useContext, useState, Fragment } from 'react'
import { useRouter } from 'next/router'

import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AuthContext } from 'src/context/AuthContext'

import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import MenuList from '@mui/material/MenuList'
import ButtonGroup from '@mui/material/ButtonGroup'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { readAsync, write } from 'src/lib/windows/utils'
import isEqual from 'lodash/isEqual'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

function SelectPharmacy() {
  // ** States
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState()

  const { selectedValue, setSelectedValue } = usePharmacyContext()
  const authData = useContext(AuthContext)

  // console.log('authData', authData)

  const getStoreData = async () => {
    // const data = await readAsync('userDetails')

    // console.log('data', data)
    // console.log('authData1', authData?.userData?.modules?.pharmacy_data?.pharmacy[0])
    // console.log('authData2', authData?.userData?.modules?.pharmacy_data?.pharmacy)

    const pharmacy = authData?.userData?.modules?.pharmacy_data?.pharmacy[0]
    const options = authData?.userData?.modules?.pharmacy_data?.pharmacy

    // const pharmacy = data?.modules?.pharmacy_data?.pharmacy[0]
    // const options = data?.modules?.pharmacy_data?.pharmacy
    console.log('stores', pharmacy)
    setOptions(options)
    const storedPharmacy = await readAsync('selectedStore')

    // console.log('storedPharmacy', storedPharmacy)

    const foundStored = () => {
      if (options?.length > 0 && storedPharmacy !== undefined) {
        return options.some(item => item.id === storedPharmacy?.id)
      }

      return false
    }
    if (storedPharmacy === '' || foundStored() === false) {
      if (pharmacy !== undefined) {
        setSelectedStore(pharmacy)
        write('selectedStore', pharmacy)
        setSelectedValue(pharmacy)
      } else {
      }
    } else {
      setSelectedStore(storedPharmacy)
    }
  }

  const anchorRef = useRef(null)

  const handleClick = () => {}

  // console.log('context in app bar', selectedValue)

  const handleMenuItemClick = id => {
    const selected = options.filter(el => {
      return el.id == id
    })

    setSelectedStore(selected[0])
    write('selectedStore', selected[0])
    setSelectedPharmacy(selected[0])
    setOpen(false)

    router.reload()
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = () => {
    setOpen(false)
  }
  useEffect(() => {
    getStoreData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Fragment>
      <ButtonGroup variant='outlined' ref={anchorRef} aria-label='split button'>
        <Button onClick={handleClick}>{selectedStore?.name}</Button>

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
                      selected={selectedStore ? selectedStore?.name : null}
                      onClick={event => handleMenuItemClick(option.id)}
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

export default SelectPharmacy
