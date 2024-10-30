import React, { useEffect, useRef, useContext, useState } from 'react'
import { useRouter } from 'next/router'

import MenuItem from '@mui/material/MenuItem'
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
import Box from '@mui/material/Box'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

function SelectPharmacy() {
  // ** States
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState()

  const { selectedPharmacy, setSelectedPharmacy } = usePharmacyContext()
  const authData = useContext(AuthContext)
  const router = useRouter()

  const getStoreData = async () => {
    const pharmacy = authData?.userData?.modules?.pharmacy_data?.pharmacy[0]
    const options = authData?.userData?.modules?.pharmacy_data?.pharmacy

    setOptions(options)
    const storedPharmacy = await readAsync('selectedStore')

    const foundStored = () => {
      if (options?.length > 0 && storedPharmacy !== undefined) {
        return options.some(item => item.id === storedPharmacy?.id)
      }

      return false
    }

    const findSelectedPharmacy = () => {
      let foundPharmacy = ''
      if (options?.length > 0 && storedPharmacy !== undefined) {
        foundPharmacy = options.find(item => item.id === storedPharmacy?.id)
      }

      const areArraysEqual = JSON.stringify(foundPharmacy?.permission) === JSON.stringify(storedPharmacy?.permission)

      if (areArraysEqual === false) {
        write('selectedStore', foundPharmacy)

        setSelectedPharmacy(foundPharmacy)
      }
    }

    findSelectedPharmacy()

    if (storedPharmacy === '' || foundStored() === false) {
      if (pharmacy !== undefined) {
        setSelectedStore(pharmacy)
        write('selectedStore', pharmacy)
        setSelectedPharmacy(pharmacy)
      } else {
      }
    } else {
      setSelectedStore(storedPharmacy)
    }
  }

  const anchorRef = useRef(null)

  const handleClick = () => {}

  const handleMenuItemClick = id => {
    const selected = options.filter(el => {
      return el.id == id
    })

    setSelectedStore(selected[0])
    write('selectedStore', selected[0])
    setSelectedPharmacy(selected[0])
    setOpen(false)

    // router.reload()
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
    <Box sx={{ minWidth: 200 }}>
      <ButtonGroup sx={{ width: '100%' }} variant='outlined' ref={anchorRef} aria-label='split button'>
        <Button
          sx={{
            width: '100%'
          }}
          onClick={handleClick}
        >
          {selectedStore?.name}
        </Button>

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
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal sx={{ width: '100%' }}>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu' sx={{ maxHeight: 200, overflowY: 'scroll', overflowX: 'hidden' }}>
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
    </Box>
  )
}

export default SelectPharmacy
